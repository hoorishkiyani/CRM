"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Mail, MessageCircle, Phone } from "lucide-react"
import { supabase, type Database } from "@/lib/supabase"
import { LeadDetailModal } from "./lead-detail-modal"

type Lead = Database["public"]["Tables"]["leads"]["Row"] & {
  contact: Database["public"]["Tables"]["contacts"]["Row"]
}

type PipelineStage = Database["public"]["Tables"]["pipeline_stages"]["Row"]

interface PipelineBoardProps {
  onRefresh?: () => void
}

export function PipelineBoard({ onRefresh }: PipelineBoardProps) {
  const [leads, setLeads] = useState<Lead[]>([])
  const [stages, setStages] = useState<PipelineStage[]>([])
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Fetch pipeline stages
      const { data: stagesData, error: stagesError } = await supabase
        .from("pipeline_stages")
        .select("*")
        .order("order_index")

      if (stagesError) throw stagesError

      // Fetch leads with contacts
      const { data: leadsData, error: leadsError } = await supabase
        .from("leads")
        .select(`
          *,
          contact:contacts(*)
        `)
        .order("lead_number", { ascending: false })

      if (leadsError) throw leadsError

      setStages(stagesData || [])
      setLeads(leadsData || [])
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleStageChange = async (leadId: string, newStage: string) => {
    try {
      const { error } = await supabase.from("leads").update({ current_stage: newStage }).eq("id", leadId)

      if (error) throw error

      // Update local state
      setLeads((prev) => prev.map((lead) => (lead.id === leadId ? { ...lead, current_stage: newStage } : lead)))

      // Create automatic activity based on stage
      await createAutomaticActivity(leadId, newStage)

      onRefresh?.()
    } catch (error) {
      console.error("Error updating lead stage:", error)
    }
  }

  const createAutomaticActivity = async (leadId: string, stage: string) => {
    const activityTexts: Record<string, string> = {
      llamada_verificacion: "1. Llamada de Verificación",
      boceto_presupuesto: "2. Presupuesto y Boceto",
      contestar_cliente: "4. Contestar al Cliente",
      incidencias: "Solucionar Incidencia",
    }

    const text = activityTexts[stage]
    if (!text) return

    try {
      await supabase.from("activities").insert({
        lead_id: leadId,
        text,
        type: stage,
      })
    } catch (error) {
      console.error("Error creating automatic activity:", error)
    }
  }

  const openEmail = (email: string) => {
    window.location.href = `mailto:${email}`
  }

  const openWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/[^\d+]/g, "")
    window.open(`https://wa.me/${cleanPhone}`, "_blank")
  }

  if (loading) {
    return <div className="flex justify-center p-8">Cargando pipeline...</div>
  }

  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => (
          <div key={stage.id} className="min-w-[320px] flex-shrink-0">
            <Card className="h-full">
              <CardHeader className="pb-3">
                <CardTitle
                  className="text-sm font-medium flex items-center gap-2"
                  style={{ borderLeft: `4px solid ${stage.color}`, paddingLeft: "12px" }}
                >
                  {stage.name}
                  <Badge variant="secondary" className="ml-auto">
                    {leads.filter((lead) => lead.current_stage === stage.id).length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="min-h-[400px] space-y-3">
                  {leads
                    .filter((lead) => lead.current_stage === stage.id)
                    .map((lead) => (
                      <Card
                        key={lead.id}
                        className="cursor-pointer transition-shadow hover:shadow-md"
                        onClick={() => setSelectedLead(lead)}
                      >
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            {lead.label_color && (
                              <Badge
                                variant="secondary"
                                className="text-xs text-white"
                                style={{ backgroundColor: lead.label_color }}
                              >
                                {lead.label_text || ""}
                              </Badge>
                            )}
                            <Badge variant="outline" className="ml-auto">
                              #{lead.lead_number}
                            </Badge>
                          </div>

                          <h4 className="font-medium mb-2">{lead.contact.name}</h4>

                          <div className="space-y-1 text-sm text-muted-foreground mb-3">
                            <div className="flex items-center gap-2">
                              <Mail className="h-3 w-3" />
                              <span className="truncate">{lead.contact.email}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone className="h-3 w-3" />
                              {lead.contact.phone}
                            </div>
                          </div>

                          <Badge variant="secondary" className="mb-3">
                            {lead.product}
                          </Badge>

                          <div className="text-xs text-muted-foreground mb-3">
                            {new Date(lead.created_at).toLocaleDateString()}
                          </div>

                          {/* Stage Change Dropdown */}
                          <div className="mb-3">
                            <Select
                              value={lead.current_stage}
                              onValueChange={(value) => handleStageChange(lead.id, value)}
                            >
                              <SelectTrigger className="w-full text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {stages.map((stageOption) => (
                                  <SelectItem key={stageOption.id} value={stageOption.id}>
                                    {stageOption.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation()
                                openEmail(lead.contact.email)
                              }}
                            >
                              <Mail className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation()
                                openWhatsApp(lead.contact.phone)
                              }}
                            >
                              <MessageCircle className="h-3 w-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      {selectedLead && (
        <LeadDetailModal
          lead={selectedLead}
          open={!!selectedLead}
          onClose={() => setSelectedLead(null)}
          onUpdate={fetchData}
        />
      )}
    </>
  )
}
