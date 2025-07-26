"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle, Circle, Eye, Plus } from "lucide-react"
import { supabase, type Database } from "@/lib/supabase"
import { AddActivityForm } from "./add-activity-form"

type Activity = Database["public"]["Tables"]["activities"]["Row"] & {
  lead: {
    id: string
    lead_number: number
    contact: {
      name: string
    }
  }
}

interface ActivitiesListProps {
  onRefresh?: () => void
}

export function ActivitiesList({ onRefresh }: ActivitiesListProps) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [filter, setFilter] = useState<"all" | "completed" | "pending">("all")
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest")
  const [showAddForm, setShowAddForm] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchActivities()
  }, [filter, sortOrder])

  const fetchActivities = async () => {
    try {
      let query = supabase.from("activities").select(`
          *,
          lead:leads(
            id,
            lead_number,
            contact:contacts(name)
          )
        `)

      if (filter === "completed") {
        query = query.eq("is_completed", true)
      } else if (filter === "pending") {
        query = query.eq("is_completed", false)
      }

      query = query.order("created_at", { ascending: sortOrder === "oldest" })

      const { data, error } = await query

      if (error) throw error
      setActivities(data || [])
    } catch (error) {
      console.error("Error fetching activities:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleCompletion = async (activityId: string, isCompleted: boolean) => {
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
      onRefresh?.()
    } catch (error) {
      console.error("Error updating activity:", error)
    }
  }

  const pendingCount = activities.filter((a) => !a.is_completed).length

  if (loading) {
    return <div className="flex justify-center p-8">Cargando actividades...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">
            Historial de Actividades
            {pendingCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {pendingCount} pendientes
              </Badge>
            )}
          </h2>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Añadir Actividad
        </Button>
      </div>

      <div className="flex gap-4">
        <Select value={filter} onValueChange={(value: "all" | "completed" | "pending") => setFilter(value)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="completed">Completadas</SelectItem>
            <SelectItem value="pending">Pendientes</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortOrder} onValueChange={(value: "newest" | "oldest") => setSortOrder(value)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Más recientes primero</SelectItem>
            <SelectItem value="oldest">Más antiguas primero</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {activities.map((activity) => (
          <Card key={activity.id} className={activity.is_completed ? "opacity-70" : ""}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleCompletion(activity.id, activity.is_completed)}
                    className="p-0 h-auto"
                  >
                    {activity.is_completed ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <Circle className="h-5 w-5 text-gray-400" />
                    )}
                  </Button>

                  <div className="flex-1">
                    <h4 className="font-medium">{activity.text}</h4>
                    {activity.lead && (
                      <p className="text-sm text-muted-foreground">
                        Lead #{activity.lead.lead_number} - {activity.lead.contact.name}
                      </p>
                    )}
                    <div className="text-xs text-muted-foreground mt-1">
                      Creada: {new Date(activity.created_at).toLocaleString()}
                      {activity.completed_at && (
                        <span className="ml-2">| Completada: {new Date(activity.completed_at).toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  {activity.lead && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        // This would open the lead detail modal
                        alert(`Ver lead: ${activity.lead.id}`)
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {activities.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">No hay actividades que mostrar.</p>
            </CardContent>
          </Card>
        )}
      </div>

      <AddActivityForm open={showAddForm} onClose={() => setShowAddForm(false)} onSuccess={fetchActivities} />
    </div>
  )
}
