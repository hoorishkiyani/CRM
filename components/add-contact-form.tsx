"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/lib/supabase"

interface AddContactFormProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function AddContactForm({ open, onClose, onSuccess }: AddContactFormProps) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [loading, setLoading] = useState(false)

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const validatePhone = (phone: string) => {
    return /^\+?\d{9,}$/.test(phone)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !email || !phone) {
      alert("Por favor complete los campos obligatorios")
      return
    }

    if (!validateEmail(email) || !validatePhone(phone)) {
      alert("Por favor ingrese un email y teléfono válidos")
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.from("contacts").insert({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        address: address.trim() || null,
      })

      if (error) throw error

      // Reset form
      setName("")
      setEmail("")
      setPhone("")
      setAddress("")

      onSuccess()
      onClose()
    } catch (error) {
      console.error("Error creating contact:", error)
      alert("Error al crear el contacto")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Añadir Nuevo Contacto</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Nombre *</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre completo" required />
          </div>

          <div>
            <label className="text-sm font-medium">Teléfono *</label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+34..." required />
          </div>

          <div>
            <label className="text-sm font-medium">Email *</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@ejemplo.com"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium">Dirección</label>
            <Textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Dirección completa"
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : "Guardar Contacto"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
