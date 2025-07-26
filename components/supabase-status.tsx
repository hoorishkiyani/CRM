"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, AlertCircle, Database, RefreshCw } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface TableStatus {
  name: string
  exists: boolean
  rowCount: number
  error?: string
}

export function SupabaseStatus() {
  const [tableStatuses, setTableStatuses] = useState<TableStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)

  const checkSupabaseStatus = async () => {
    setLoading(true)
    const tables = ["contacts", "leads", "activities", "messages", "pipeline_stages"]
    const statuses: TableStatus[] = []

    for (const tableName of tables) {
      try {
        const { count, error } = await supabase.from(tableName).select("*", { count: "exact", head: true })

        if (error) {
          statuses.push({
            name: tableName,
            exists: false,
            rowCount: 0,
            error: error.message,
          })
        } else {
          statuses.push({
            name: tableName,
            exists: true,
            rowCount: count || 0,
          })
        }
      } catch (error) {
        statuses.push({
          name: tableName,
          exists: false,
          rowCount: 0,
          error: error instanceof Error ? error.message : "Unknown error",
        })
      }
    }

    setTableStatuses(statuses)
    setLastChecked(new Date())
    setLoading(false)
  }

  useEffect(() => {
    checkSupabaseStatus()
  }, [])

  const allTablesExist = tableStatuses.every((status) => status.exists)
  const hasData = tableStatuses.some((status) => status.rowCount > 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Estado de Supabase
          {allTablesExist ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-600" />
          )}
        </CardTitle>
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            {lastChecked && `Última verificación: ${lastChecked.toLocaleTimeString()}`}
          </p>
          <Button size="sm" variant="outline" onClick={checkSupabaseStatus} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Verificar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {tableStatuses.map((status) => (
            <div key={status.name} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                {status.exists ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                )}
                <div>
                  <p className="font-medium capitalize">{status.name}</p>
                  {status.error && <p className="text-sm text-red-600">{status.error}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={status.exists ? "secondary" : "destructive"}>
                  {status.exists ? `${status.rowCount} registros` : "No existe"}
                </Badge>
              </div>
            </div>
          ))}
        </div>

        {!allTablesExist && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h4 className="font-medium text-red-800 mb-2">Acción Requerida</h4>
            <p className="text-sm text-red-700 mb-3">
              Algunas tablas no existen en Supabase. Ejecuta los siguientes scripts SQL:
            </p>
            <ol className="text-sm text-red-700 space-y-1 list-decimal list-inside">
              <li>scripts/001-create-tables.sql</li>
              <li>scripts/002-seed-data.sql</li>
              <li>scripts/003-enhance-database.sql</li>
            </ol>
          </div>
        )}

        {allTablesExist && !hasData && (
          <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <h4 className="font-medium text-orange-800 mb-2">Base de Datos Vacía</h4>
            <p className="text-sm text-orange-700">
              Las tablas existen pero no hay datos. Ejecuta scripts/002-seed-data.sql para datos de ejemplo.
            </p>
          </div>
        )}

        {allTablesExist && hasData && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-medium text-green-800 mb-2">✅ Todo Configurado</h4>
            <p className="text-sm text-green-700">Supabase está correctamente configurado y funcionando.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
