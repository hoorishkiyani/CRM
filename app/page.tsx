"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Plus, RotateCcw } from "lucide-react"
import { PipelineBoard } from "@/components/pipeline-board"
import { ActivitiesList } from "@/components/activities-list"
import { ContactsTable } from "@/components/contacts-table"
import { AddLeadForm } from "@/components/add-lead-form"

export default function CRMDashboard() {
  const [showAddLead, setShowAddLead] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1)
  }

  if (!mounted) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center min-h-screen">
          <div className="text-lg">Cargando CRM...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">CRM | Neon 51</h1>
        <div className="flex gap-2">
          <Button onClick={handleRefresh} variant="outline">
            <RotateCcw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Button onClick={() => setShowAddLead(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Añadir Lead
          </Button>
        </div>
      </div>

      <Tabs defaultValue="pipeline" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="activities">Historial de Actividades</TabsTrigger>
          <TabsTrigger value="contacts">Contactos</TabsTrigger>
          <TabsTrigger value="reports">Informes</TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline" className="mt-6">
          <PipelineBoard key={refreshKey} onRefresh={handleRefresh} />
        </TabsContent>

        <TabsContent value="activities" className="mt-6">
          <ActivitiesList key={refreshKey} onRefresh={handleRefresh} />
        </TabsContent>

        <TabsContent value="contacts" className="mt-6">
          <ContactsTable key={refreshKey} onRefresh={handleRefresh} />
        </TabsContent>

        <TabsContent value="reports" className="mt-6">
          <div className="text-center p-8">
            <h2 className="text-2xl font-bold mb-4">Informes</h2>
            <p className="text-muted-foreground">Los informes y análisis estarán disponibles próximamente.</p>
          </div>
        </TabsContent>
      </Tabs>

      {showAddLead && (
        <AddLeadForm open={showAddLead} onClose={() => setShowAddLead(false)} onSuccess={handleRefresh} />
      )}
    </div>
  )
}
