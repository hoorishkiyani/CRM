"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Mail, MessageCircle, Phone, Lock, AlertTriangle } from "lucide-react"
import { supabase, type Database } from "@/lib/supabase"
import { LeadDetailModal } from "./lead-detail-modal"

type Lead = Database["public"]["Tables"]["leads"]["Row"] & {
  contact: Database["public"]["Tables"]["contacts"]["Row"]
  activities: Database["public"]["Tables"]["activities"]["Row"][]
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

  const fetchData = async () => {
    try {
      // Fetch pipeline stages
      const { data: stagesData, error: stagesError } = await supabase
        .from("pipeline_stages")
        .select("*")
        .order("order_index")

      if (stagesError) throw stagesError

      // Fetch leads with contacts and activities
      const { data: leadsData, error: leadsError } = await supabase
        .from("leads")
        .select(`
          *,
          contact:contacts(*),
          activities:activities(*)
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

  // Real-time updates
  useEffect(() => {
    fetchData()
  }, [])

  const checkStageAdvancementEligibility = async (leadId: string, targetStage: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc("can_advance_stage", {
        lead_uuid: leadId,
        target_stage_id: targetStage,
      })

      if (error) {
        console.error("Error checking stage advancement:", error)
        return false
      }

      return data
    } catch (error) {
      console.error("Error checking stage advancement:", error)
      return false
    }
  }

  const handleStageChange = async (leadId: string, newStage: string) => {
    const lead = leads.find((l) => l.id === leadId)
    if (!lead) return

    // Check if advancement is allowed
    const canAdvance = await checkStageAdvancementEligibility(leadId, newStage)

    if (!canAdvance && newStage !== lead.current_stage) {
      const currentStage = stages.find((s) => s.id === lead.current_stage)
      const mandatoryActivities = (currentStage?.mandatory_activities as any[]) || []

      if (mandatoryActivities.length > 0) {
        alert(
          `No se puede avanzar de etapa. Debe completar las siguientes actividades obligatorias:\n${mandatoryActivities.map((a) => `- ${a.description}`).join("\n")}`,
        )
        return
      }
    }

    try {
      const updateData: any = {
        current_stage: newStage,
        last_stage_change: new Date().toISOString(),
      }

      // Lock stage if mandatory activities are not completed
      if (!canAdvance && newStage !== lead.current_stage) {
        updateData.is_locked = true
        updateData.stage_locked_reason = "Actividades obligatorias pendientes"
      } else {
        updateData.is_locked = false
        updateData.stage_locked_reason = null
      }

      const { error } = await supabase.from("leads").update(updateData).eq("id", leadId)

      if (error) throw error

      // Create automatic mandatory activities for new stage
      await createMandatoryActivities(leadId, newStage)

      // Update local state
      setLeads((prev) =>
        prev.map((lead) =>
          lead.id === leadId ? { ...lead, current_stage: newStage, is_locked: updateData.is_locked } : lead,
        ),
      )

      onRefresh?.()
    } catch (error) {
      console.error("Error updating lead stage:", error)
    }
  }

  const createMandatoryActivities = async (leadId: string, stageId: string) => {
    const stage = stages.find((s) => s.id === stageId)
    if (!stage?.mandatory_activities) return

    const mandatoryActivities = stage.mandatory_activities as any[]

    for (const activity of mandatoryActivities) {
      try {
        await supabase.from("activities").insert({
          lead_id: leadId,
          text: activity.description,
          type: activity.type,
          is_mandatory: true,
          auto_generated: true,
        })
      } catch (error) {
        console.error("Error creating mandatory activity:", error)
      }
    }
  }

  const getMandatoryActivitiesStatus = (lead: Lead) => {
    const currentStage = stages.find((s) => s.id === lead.current_stage)
    if (!currentStage?.mandatory_activities) return { completed: 0, total: 0 }

    const mandatoryActivities = currentStage.mandatory_activities as any[]
    const completedMandatory = lead.activities?.filter((a) => a.is_mandatory && a.is_completed).length || 0

    return {
      completed: completedMandatory,
      total: mandatoryActivities.length,
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
                    .map((lead) => {
                      const mandatoryStatus = getMandatoryActivitiesStatus(lead)
                      const isBlocked = mandatoryStatus.total > 0 && mandatoryStatus.completed < mandatoryStatus.total

                      return (
                        <Card
                          key={lead.id}
                          className={`cursor-pointer transition-shadow hover:shadow-md ${
                            lead.is_locked ? "border-orange-300 bg-orange-50" : ""
                          }`}
                          onClick={() => setSelectedLead(lead)}
                        >
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center gap-2">
                                {lead.label_color && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs text-white"
                                    style={{ backgroundColor: lead.label_color }}
                                  >
                                    {lead.label_text || ""}
                                  </Badge>
                                )}
                                {lead.is_locked && <Lock className="h-3 w-3 text-orange-600" />}
                                {isBlocked && <AlertTriangle className="h-3 w-3 text-red-600" />}
                              </div>
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

                            {/* Mandatory Activities Status */}
                            {mandatoryStatus.total > 0 && (
                              <div className="mb-3">
                                <div className="flex items-center gap-2 text-xs">
                                  <span className={`font-medium ${isBlocked ? "text-red-600" : "text-green-600"}`}>
                                    Actividades: {mandatoryStatus.completed}/{mandatoryStatus.total}
                                  </span>
                                  {isBlocked && <span className="text-red-600">(Bloqueado)</span>}
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                                  <div
                                    className={`h-1.5 rounded-full ${isBlocked ? "bg-red-500" : "bg-green-500"}`}
                                    style={{
                                      width: `${(mandatoryStatus.completed / mandatoryStatus.total) * 100}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            )}

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
                      )
                    })}
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
