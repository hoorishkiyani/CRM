"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase, type Database } from "@/lib/supabase"

type Lead = Database["public"]["Tables"]["leads"]["Row"] & {
  contact: Database["public"]["Tables"]["contacts"]["Row"]
}

interface AddActivityFormProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function AddActivityForm({ open, onClose, onSuccess }: AddActivityFormProps) {
  const [leads, setLeads] = useState<Lead[]>([])
  const [selectedLeadId, setSelectedLeadId] = useState("")
  const [text, setText] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      fetchLeads()
      // Reset form
      setSelectedLeadId("")
      setText("")
    }
  }, [open])

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from("leads")
        .select(`
          *,
          contact:contacts(*)
        `)
        .order("lead_number", { ascending: false })

      if (error) throw error
      setLeads(data || [])
    } catch (error) {
      console.error("Error fetching leads:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedLeadId || !text.trim()) {
      alert("Por favor complete los campos obligatorios")
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.from("activities").insert({
        lead_id: selectedLeadId,
        text: text.trim(),
        type: "manual",
      })

      if (error) throw error

      onSuccess()
      onClose()
    } catch (error) {
      console.error("Error creating activity:", error)
      alert("Error al crear la actividad")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Añadir Nueva Actividad</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Asignar a Lead *</label>
            <Select value={selectedLeadId} onValueChange={setSelectedLeadId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccione un lead..." />
              </SelectTrigger>
              <SelectContent>
                {leads.map((lead) => (
                  <SelectItem key={lead.id} value={lead.id}>
                    Lead #{lead.lead_number} - {lead.contact.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Descripción *</label>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Descripción de la actividad..."
              rows={3}
              required
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !selectedLeadId || !text.trim()}>
              {loading ? "Guardando..." : "Guardar Actividad"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
