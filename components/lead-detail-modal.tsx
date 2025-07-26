"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Mail, MessageCircle, Bot, Trash2, CheckCircle, Circle } from "lucide-react"
import { supabase, type Database } from "@/lib/supabase"
import { generateReply } from "@/lib/ai"

type Lead = Database["public"]["Tables"]["leads"]["Row"] & {
  contact: Database["public"]["Tables"]["contacts"]["Row"]
}

type Message = Database["public"]["Tables"]["messages"]["Row"]
type Activity = Database["public"]["Tables"]["activities"]["Row"]

interface LeadDetailModalProps {
  lead: Lead
  open: boolean
  onClose: () => void
  onUpdate: () => void
}

export function LeadDetailModal({ lead, open, onClose, onUpdate }: LeadDetailModalProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [messageChannel, setMessageChannel] = useState<"email" | "whatsapp">("email")
  const [newNote, setNewNote] = useState("")
  const [labelText, setLabelText] = useState(lead.label_text || "")
  const [labelColor, setLabelColor] = useState(lead.label_color || "")
  const [isGeneratingReply, setIsGeneratingReply] = useState(false)

  useEffect(() => {
    if (open && lead) {
      fetchMessages()
      fetchActivities()
      setLabelText(lead.label_text || "")
      setLabelColor(lead.label_color || "")
    }
  }, [open, lead])

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("lead_id", lead.id)
        .order("timestamp", { ascending: true })

      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      console.error("Error fetching messages:", error)
    }
  }

  const fetchActivities = async () => {
    try {
      const { data, error } = await supabase
        .from("activities")
        .select("*")
        .eq("lead_id", lead.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setActivities(data || [])
    } catch (error) {
      console.error("Error fetching activities:", error)
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return

    try {
      const { error } = await supabase.from("messages").insert({
        lead_id: lead.id,
        content: newMessage,
        channel: messageChannel,
        sender: "Neon 51",
      })

      if (error) throw error

      setNewMessage("")
      fetchMessages()
      onUpdate()
    } catch (error) {
      console.error("Error sending message:", error)
    }
  }

  const handleGenerateReply = async () => {
    if (messages.length === 0) return

    setIsGeneratingReply(true)
    try {
      const lastMessage = messages[messages.length - 1]
      const previousMessages = messages.slice(-3).map((m) => m.content)

      const reply = await generateReply(lastMessage.content, {
        contactName: lead.contact.name,
        product: lead.product,
        previousMessages,
      })

      setNewMessage(reply)
    } catch (error) {
      console.error("Error generating reply:", error)
    } finally {
      setIsGeneratingReply(false)
    }
  }

  const handleAddNote = async () => {
    if (!newNote.trim()) return

    try {
      const currentNotes = lead.notes_internal || []
      const updatedNotes = [
        ...currentNotes,
        {
          text: newNote,
          date: new Date().toISOString(),
        },
      ]

      const { error } = await supabase.from("leads").update({ notes_internal: updatedNotes }).eq("id", lead.id)

      if (error) throw error

      setNewNote("")
      onUpdate()
    } catch (error) {
      console.error("Error adding note:", error)
    }
  }

  const handleUpdateLabel = async () => {
    try {
      const { error } = await supabase
        .from("leads")
        .update({
          label_text: labelText,
          label_color: labelColor,
        })
        .eq("id", lead.id)

      if (error) throw error
      onUpdate()
    } catch (error) {
      console.error("Error updating label:", error)
    }
  }

  const handleCompleteActivity = async (activityId: string, isCompleted: boolean) => {
    try {
      const updateData: any = { is_completed: !isCompleted }
      if (!isCompleted) {
        updateData.completed_at = new Date().toISOString()
      } else {
        updateData.completed_at = null
      }

      const { error } = await supabase.from("activities").update(updateData).eq("id", activityId)

      if (error) throw error
      fetchActivities()
      onUpdate()
    } catch (error) {
      console.error("Error completing activity:", error)
    }
  }

  const handleDeleteLead = async () => {
    if (!confirm("¿Estás seguro de eliminar este lead? Esta acción no se puede deshacer.")) {
      return
    }

    try {
      const { error } = await supabase.from("leads").delete().eq("id", lead.id)

      if (error) throw error
      onClose()
      onUpdate()
    } catch (error) {
      console.error("Error deleting lead:", error)
    }
  }

  const labelColors = ["#4CAF50", "#2196F3", "#FF9800", "#F44336", "#9C27B0", "#607D8B", ""]

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>
              {lead.contact.name} #{lead.lead_number}
            </span>
            <div className="flex gap-2">
              {labelColors.map((color) => (
                <button
                  key={color}
                  className={`w-6 h-6 rounded-full border-2 ${
                    labelColor === color ? "border-gray-800" : "border-gray-300"
                  }`}
                  style={{ backgroundColor: color || "transparent" }}
                  onClick={() => setLabelColor(color)}
                />
              ))}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Información Básica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Producto:</label>
                <p>{lead.product}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Etapa:</label>
                <p>{lead.current_stage}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Creado:</label>
                <p>{new Date(lead.created_at).toLocaleString()}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Etiqueta:</label>
                <div className="flex gap-2">
                  <Input
                    value={labelText}
                    onChange={(e) => setLabelText(e.target.value)}
                    placeholder="ETIQUETA"
                    maxLength={10}
                    className="flex-1"
                  />
                  <Button onClick={handleUpdateLabel} size="sm">
                    Actualizar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Información de Contacto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Nombre:</label>
                <p>{lead.contact.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Email:</label>
                <p>{lead.contact.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Teléfono:</label>
                <p>{lead.contact.phone}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Dirección:</label>
                <p>{lead.contact.address || "-"}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Actividades</CardTitle>
          </CardHeader>
          <CardContent>
            {activities.length > 0 ? (
              <div className="space-y-3">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCompleteActivity(activity.id, activity.is_completed)}
                        className="p-0 h-auto"
                      >
                        {activity.is_completed ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <Circle className="h-5 w-5 text-gray-400" />
                        )}
                      </Button>
                      <div>
                        <p className={`font-medium ${activity.is_completed ? "line-through opacity-60" : ""}`}>
                          {activity.text}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Creada: {new Date(activity.created_at).toLocaleString()}
                          {activity.completed_at && (
                            <span className="ml-2">
                              | Completada: {new Date(activity.completed_at).toLocaleString()}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No hay actividades.</p>
            )}
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Notas Internas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Añadir nota interna..."
                rows={3}
              />
              <Button onClick={handleAddNote} className="self-end">
                Añadir
              </Button>
            </div>

            {lead.notes_internal && lead.notes_internal.length > 0 && (
              <div className="space-y-2">
                {lead.notes_internal.map((note: any, index: number) => (
                  <div key={index} className="p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">{new Date(note.date).toLocaleString()}</p>
                    <p>{note.text}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Messages */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Conversaciones</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {messages.length > 0 && (
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {messages.map((message) => (
                  <div key={message.id} className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      {message.channel === "email" ? (
                        <Mail className="h-4 w-4" />
                      ) : (
                        <MessageCircle className="h-4 w-4" />
                      )}
                      <span className="text-sm font-medium">{message.sender}</span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(message.timestamp).toLocaleString()}
                      </span>
                      {message.ai_generated && (
                        <Badge variant="secondary">
                          <Bot className="h-3 w-3 mr-1" />
                          IA
                        </Badge>
                      )}
                    </div>
                    <p>{message.content}</p>
                    {message.response && (
                      <div className="mt-2 p-2 bg-background rounded border-l-4 border-primary">
                        <p className="text-sm">
                          <strong>Respuesta:</strong> {message.response}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-3">
              <div className="flex gap-2">
                <Select
                  value={messageChannel}
                  onValueChange={(value: "email" | "whatsapp") => setMessageChannel(value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleGenerateReply}
                  disabled={isGeneratingReply || messages.length === 0}
                  variant="outline"
                >
                  <Bot className="h-4 w-4 mr-2" />
                  {isGeneratingReply ? "Generando..." : "IA"}
                </Button>
              </div>

              <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Escribir mensaje..."
                rows={3}
              />

              <Button onClick={handleSendMessage} className="w-full">
                Enviar Mensaje
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-between">
          <div className="flex gap-2">
            <Button onClick={() => (window.location.href = `mailto:${lead.contact.email}`)} variant="outline">
              <Mail className="h-4 w-4 mr-2" />
              Email
            </Button>
            <Button
              onClick={() => window.open(`https://wa.me/${lead.contact.phone.replace(/[^\d+]/g, "")}`, "_blank")}
              variant="outline"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              WhatsApp
            </Button>
          </div>

          <Button onClick={handleDeleteLead} variant="destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            Eliminar Lead
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
