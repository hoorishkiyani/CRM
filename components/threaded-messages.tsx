"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Mail, MessageCircle, Bot, Reply, ArrowRight } from "lucide-react"
import { supabase, type Database } from "@/lib/supabase"
import { generateReply } from "@/lib/ai"

type Message = Database["public"]["Tables"]["messages"]["Row"]

interface ThreadedMessage extends Message {
  replies: ThreadedMessage[]
  level: number
}

interface ThreadedMessagesProps {
  leadId: string
  onUpdate?: () => void
}

export function ThreadedMessages({ leadId, onUpdate }: ThreadedMessagesProps) {
  const [messages, setMessages] = useState<ThreadedMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [replyToId, setReplyToId] = useState<string | null>(null)
  const [messageChannel, setMessageChannel] = useState<"email" | "whatsapp">("email")
  const [isGeneratingReply, setIsGeneratingReply] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMessages()
  }, [leadId])

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("lead_id", leadId)
        .order("timestamp", { ascending: true })

      if (error) throw error

      // Build threaded structure
      const threaded = buildThreadedMessages(data || [])
      setMessages(threaded)
    } catch (error) {
      console.error("Error fetching messages:", error)
    } finally {
      setLoading(false)
    }
  }

  const buildThreadedMessages = (messages: Message[]): ThreadedMessage[] => {
    const messageMap = new Map<string, ThreadedMessage>()
    const rootMessages: ThreadedMessage[] = []

    // First pass: create all message objects
    messages.forEach((msg) => {
      messageMap.set(msg.id, {
        ...msg,
        replies: [],
        level: 0,
      })
    })

    // Second pass: build the tree structure
    messages.forEach((msg) => {
      const threadedMsg = messageMap.get(msg.id)!

      if (msg.in_reply_to && messageMap.has(msg.in_reply_to)) {
        const parent = messageMap.get(msg.in_reply_to)!
        threadedMsg.level = parent.level + 1
        parent.replies.push(threadedMsg)
      } else {
        rootMessages.push(threadedMsg)
      }
    })

    return rootMessages
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return

    try {
      const messageData: any = {
        lead_id: leadId,
        content: newMessage,
        channel: messageChannel,
        sender: "Neon 51",
        reply_status: "sent",
      }

      // Set threading information
      if (replyToId) {
        messageData.in_reply_to = replyToId
        // Generate thread_id based on the root message
        const rootMessage = findRootMessage(replyToId)
        messageData.thread_id = rootMessage?.thread_id || rootMessage?.id || replyToId
      } else {
        // New thread
        messageData.thread_id = `thread_${Date.now()}`
      }

      const { error } = await supabase.from("messages").insert(messageData)

      if (error) throw error

      setNewMessage("")
      setReplyToId(null)
      fetchMessages()
      onUpdate?.()
    } catch (error) {
      console.error("Error sending message:", error)
    }
  }

  const findRootMessage = (messageId: string): ThreadedMessage | null => {
    const findInMessages = (msgs: ThreadedMessage[]): ThreadedMessage | null => {
      for (const msg of msgs) {
        if (msg.id === messageId) return msg
        const found = findInMessages(msg.replies)
        if (found) return found
      }
      return null
    }
    return findInMessages(messages)
  }

  const handleGenerateReply = async (originalMessage: ThreadedMessage) => {
    setIsGeneratingReply(true)
    try {
      // Get lead info for context
      const { data: leadData } = await supabase
        .from("leads")
        .select(`
          *,
          contact:contacts(*)
        `)
        .eq("id", leadId)
        .single()

      if (!leadData) throw new Error("Lead not found")

      const reply = await generateReply(originalMessage.content, {
        contactName: leadData.contact.name,
        product: leadData.product,
        previousMessages: [originalMessage.content],
      })

      setNewMessage(reply)
      setReplyToId(originalMessage.id)
      setMessageChannel(originalMessage.channel as "email" | "whatsapp")
    } catch (error) {
      console.error("Error generating reply:", error)
    } finally {
      setIsGeneratingReply(false)
    }
  }

  const renderMessage = (message: ThreadedMessage) => (
    <div key={message.id} className="space-y-3">
      <Card className={`${message.level > 0 ? "ml-8 border-l-4 border-blue-200" : ""}`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            {message.channel === "email" ? <Mail className="h-4 w-4" /> : <MessageCircle className="h-4 w-4" />}
            <span className="text-sm font-medium">{message.sender}</span>
            <span className="text-sm text-muted-foreground">{new Date(message.timestamp).toLocaleString()}</span>
            {message.ai_generated && (
              <Badge variant="secondary">
                <Bot className="h-3 w-3 mr-1" />
                IA
              </Badge>
            )}
            <Badge variant="outline" className="text-xs">
              {message.reply_status}
            </Badge>
            {message.level > 0 && (
              <Badge variant="secondary" className="text-xs">
                <Reply className="h-3 w-3 mr-1" />
                Respuesta
              </Badge>
            )}
          </div>

          <p className="text-sm mb-3">{message.content}</p>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setReplyToId(message.id)
                setMessageChannel(message.channel as "email" | "whatsapp")
              }}
            >
              <Reply className="h-3 w-3 mr-1" />
              Responder
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleGenerateReply(message)}
              disabled={isGeneratingReply}
            >
              <Bot className="h-3 w-3 mr-1" />
              {isGeneratingReply ? "Generando..." : "IA"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Render replies */}
      {message.replies.map((reply) => renderMessage(reply))}
    </div>
  )

  if (loading) {
    return <div className="flex justify-center p-4">Cargando conversaciones...</div>
  }

  return (
    <div className="space-y-4">
      <CardHeader>
        <CardTitle className="text-lg">Conversaciones con Hilos</CardTitle>
      </CardHeader>

      {/* Messages Thread */}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {messages.map((message) => renderMessage(message))}

        {messages.length === 0 && (
          <div className="text-center p-8 text-muted-foreground">No hay mensajes en esta conversación.</div>
        )}
      </div>

      {/* Reply Form */}
      <Card>
        <CardContent className="p-4 space-y-3">
          {replyToId && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ArrowRight className="h-4 w-4" />
              Respondiendo a mensaje
              <Button size="sm" variant="ghost" onClick={() => setReplyToId(null)}>
                Cancelar
              </Button>
            </div>
          )}

          <div className="flex gap-2">
            <Select value={messageChannel} onValueChange={(value: "email" | "whatsapp") => setMessageChannel(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={replyToId ? "Escribir respuesta..." : "Escribir mensaje..."}
            rows={3}
          />

          <Button onClick={handleSendMessage} className="w-full">
            {replyToId ? "Enviar Respuesta" : "Enviar Mensaje"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
