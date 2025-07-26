"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase, type Database } from "@/lib/supabase"

type Contact = Database["public"]["Tables"]["contacts"]["Row"]

interface AddLeadFormProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function AddLeadForm({ open, onClose, onSuccess }: AddLeadFormProps) {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [selectedContactId, setSelectedContactId] = useState("")
  const [product, setProduct] = useState("")
  const [notes, setNotes] = useState("")
  const [labelText, setLabelText] = useState("")
  const [labelColor, setLabelColor] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      fetchContacts()
      // Reset form
      setSelectedContactId("")
      setProduct("")
      setNotes("")
      setLabelText("")
      setLabelColor("")
    }
  }, [open])

  const fetchContacts = async () => {
    try {
      const { data, error } = await supabase.from("contacts").select("*").order("name")

      if (error) throw error
      setContacts(data || [])
    } catch (error) {
      console.error("Error fetching contacts:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedContactId || !product) {
      alert("Por favor complete los campos obligatorios")
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.from("leads").insert({
        contact_id: selectedContactId,
        product,
        notes,
        label_text: labelText,
        label_color: labelColor,
        current_stage: "llamada_verificacion",
      })

      if (error) throw error

      onSuccess()
      onClose()
    } catch (error) {
      console.error("Error creating lead:", error)
      alert("Error al crear el lead")
    } finally {
      setLoading(false)
    }
  }

  const labelColors = ["#4CAF50", "#2196F3", "#FF9800", "#F44336", "#9C27B0", "#607D8B", ""]
  const products = ["Neón", "Cuadro Neón", "Letras Corpóreas", "Espejo Infinito", "Otro"]

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Añadir Nuevo Lead</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Contacto *</label>
            <Select value={selectedContactId} onValueChange={setSelectedContactId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccione un contacto..." />
              </SelectTrigger>
              <SelectContent>
                {contacts.map((contact) => (
                  <SelectItem key={contact.id} value={contact.id}>
                    {contact.name} ({contact.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Tipo de Producto *</label>
            <Select value={product} onValueChange={setProduct}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccione..." />
              </SelectTrigger>
              <SelectContent>
                {products.map((prod) => (
                  <SelectItem key={prod} value={prod}>
                    {prod}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Notas</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Información adicional..."
              rows={3}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Etiqueta</label>
            <div className="space-y-2">
              <Input
                value={labelText}
                onChange={(e) => setLabelText(e.target.value)}
                placeholder="ETIQUETA"
                maxLength={10}
              />
              <div className="flex gap-2">
                {labelColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 ${
                      labelColor === color ? "border-gray-800" : "border-gray-300"
                    }`}
                    style={{ backgroundColor: color || "transparent" }}
                    onClick={() => setLabelColor(color)}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !selectedContactId || !product}>
              {loading ? "Guardando..." : "Guardar Lead"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
