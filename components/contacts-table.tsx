"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Edit } from "lucide-react"
import { supabase, type Database } from "@/lib/supabase"
import { AddContactForm } from "./add-contact-form"
import { EditContactForm } from "./edit-contact-form"

type Contact = Database["public"]["Tables"]["contacts"]["Row"] & {
  leads: { id: string; lead_number: number; product: string }[]
}

interface ContactsTableProps {
  onRefresh?: () => void
}

export function ContactsTable({ onRefresh }: ContactsTableProps) {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchContacts()
  }, [])

  const fetchContacts = async () => {
    try {
      const { data, error } = await supabase
        .from("contacts")
        .select(`
          *,
          leads:leads(id, lead_number, product)
        `)
        .order("name")

      if (error) throw error
      setContacts(data || [])
    } catch (error) {
      console.error("Error fetching contacts:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteContact = async (contactId: string) => {
    if (!confirm("¿Eliminar este contacto? Esto eliminará también sus leads asociados.")) {
      return
    }

    try {
      const { error } = await supabase.from("contacts").delete().eq("id", contactId)

      if (error) throw error
      fetchContacts()
      onRefresh?.()
    } catch (error) {
      console.error("Error deleting contact:", error)
      alert("Error al eliminar el contacto")
    }
  }

  if (loading) {
    return <div className="flex justify-center p-8">Cargando contactos...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Contactos</h2>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Añadir Contacto
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Teléfono</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Leads</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contacts.map((contact) => (
            <TableRow key={contact.id}>
              <TableCell className="font-medium">{contact.name}</TableCell>
              <TableCell>{contact.phone}</TableCell>
              <TableCell>{contact.email}</TableCell>
              <TableCell>
                <div className="space-y-1">
                  <div>{contact.leads.length} lead(s)</div>
                  {contact.leads.map((lead) => (
                    <Badge key={lead.id} variant="secondary" className="mr-1">
                      #{lead.lead_number} - {lead.product}
                    </Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setEditingContact(contact)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDeleteContact(contact.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AddContactForm open={showAddForm} onClose={() => setShowAddForm(false)} onSuccess={fetchContacts} />

      {editingContact && (
        <EditContactForm
          contact={editingContact}
          open={!!editingContact}
          onClose={() => setEditingContact(null)}
          onSuccess={fetchContacts}
        />
      )}
    </div>
  )
}
