"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Mail, MessageCircle, Trash2, CheckCircle, Circle, Lock, AlertTriangle } from "lucide-react"
import { supabase, type Database } from "@/lib/supabase"
import { ThreadedMessages } from "./threaded-messages"

type Lead = Database["public"]["Tables"]["leads"]["Row"] & {
  contact: Database["public"]["Tables"]["contacts"]["Row"]
  activities: Database["public"]["Tables"]["activities"]["Row"][]
}

type Activity = Database["public"]["Tables"]["activities"]["Row"]

interface LeadDetailModalProps {
  lead: Lead
  open: boolean
  onClose: () => void
  onUpdate: () => void
}

export function LeadDetailModal({ lead, open, onClose, onUpdate }: LeadDetailModalProps) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [newNote, setNewNote] = useState("")
  const [labelText, setLabelText] = useState(lead.label_text || "")
  const [labelColor, setLabelColor] = useState(lead.label_color || "")

  useEffect(() => {
    if (open && lead) {
      fetchActivities()
      setLabelText(lead.label_text || "")
      setLabelColor(lead.label_color || "")
    }
  }, [open, lead])

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

  const mandatoryActivities = activities.filter((a) => a.is_mandatory)
  const completedMandatory = mandatoryActivities.filter((a) => a.is_completed).length
  const isBlocked = mandatoryActivities.length > 0 && completedMandatory < mandatoryActivities.length

  const labelColors = ["#4CAF50", "#2196F3", "#FF9800", "#F44336", "#9C27B0", "#607D8B", ""]

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>
                {lead.contact.name} #{lead.lead_number}
              </span>
              {lead.is_locked && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <Lock className="h-3 w-3" />
                  Bloqueado
                </Badge>
              )}
              {isBlocked && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Actividades Pendientes
                </Badge>
              )}
            </div>
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

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="info">Información</TabsTrigger>
            <TabsTrigger value="activities">
              Actividades
              {mandatoryActivities.length > 0 && (
                <Badge variant={isBlocked ? "destructive" : "secondary"} className="ml-2">
                  {completedMandatory}/{mandatoryActivities.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="messages">Mensajes</TabsTrigger>
            <TabsTrigger value="notes">Notas</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4">
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
                  {lead.last_stage_change && (
                    <div>
                      <label className="text-sm font-medium">Último cambio de etapa:</label>
                      <p>{new Date(lead.last_stage_change).toLocaleString()}</p>
                    </div>
                  )}
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
                  {lead.stage_locked_reason && (
                    <div>
                      <label className="text-sm font-medium text-red-600">Razón del bloqueo:</label>
                      <p className="text-red-600">{lead.stage_locked_reason}</p>
                    </div>
                  )}
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
          </TabsContent>

          <TabsContent value="activities" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  Actividades
                  {mandatoryActivities.length > 0 && (
                    <Badge variant={isBlocked ? "destructive" : "secondary"}>
                      Obligatorias: {completedMandatory}/{mandatoryActivities.length}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activities.length > 0 ? (
                  <div className="space-y-3">
                    {activities.map((activity) => (
                      <div
                        key={activity.id}
                        className={`flex items-center justify-between p-3 rounded-lg ${
                          activity.is_mandatory ? "bg-orange-50 border border-orange-200" : "bg-muted"
                        }`}
                      >
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
                            <div className="flex items-center gap-2">
                              <p className={`font-medium ${activity.is_completed ? "line-through opacity-60" : ""}`}>
                                {activity.text}
                              </p>
                              {activity.is_mandatory && (
                                <Badge variant="outline" className="text-xs">
                                  Obligatoria
                                </Badge>
                              )}
                              {activity.auto_generated && (
                                <Badge variant="secondary" className="text-xs">
                                  Auto
                                </Badge>
                              )}
                            </div>
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
          </TabsContent>

          <TabsContent value="messages">
            <ThreadedMessages leadId={lead.id} onUpdate={onUpdate} />
          </TabsContent>

          <TabsContent value="notes" className="space-y-4">
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
          </TabsContent>
        </Tabs>

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
