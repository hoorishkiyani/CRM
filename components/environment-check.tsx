"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle, RefreshCw } from "lucide-react"

interface EnvironmentCheckProps {
  children: React.ReactNode
}

export function EnvironmentCheck({ children }: EnvironmentCheckProps) {
  const [envStatus, setEnvStatus] = useState<{
    supabaseUrl: boolean
    supabaseKey: boolean
    openaiKey: boolean
  } | null>(null)

  const checkEnvironment = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const openaiKey = process.env.OPENAI_API_KEY

    setEnvStatus({
      supabaseUrl: !!supabaseUrl && supabaseUrl !== "",
      supabaseKey: !!supabaseKey && supabaseKey !== "",
      openaiKey: !!openaiKey && openaiKey !== "",
    })
  }

  useEffect(() => {
    checkEnvironment()
  }, [])

  if (!envStatus) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center min-h-screen">
          <div className="text-lg">Verificando configuración...</div>
        </div>
      </div>
    )
  }

  const hasRequiredEnv = envStatus.supabaseUrl && envStatus.supabaseKey

  if (!hasRequiredEnv) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center min-h-screen">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-5 w-5" />
                Configuración Requerida
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Faltan variables de entorno requeridas para el funcionamiento del CRM:
              </p>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {envStatus.supabaseUrl ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span className="text-sm">NEXT_PUBLIC_SUPABASE_URL</span>
                </div>

                <div className="flex items-center gap-2">
                  {envStatus.supabaseKey ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span className="text-sm">NEXT_PUBLIC_SUPABASE_ANON_KEY</span>
                </div>

                <div className="flex items-center gap-2">
                  {envStatus.openaiKey ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                  )}
                  <span className="text-sm">OPENAI_API_KEY (opcional)</span>
                </div>
              </div>

              <div className="pt-4 space-y-2">
                <p className="text-sm font-medium">Para configurar las variables de entorno:</p>
                <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Ve a tu dashboard de Vercel</li>
                  <li>Selecciona tu proyecto CRM</li>
                  <li>Ve a Settings → Environment Variables</li>
                  <li>Añade las variables requeridas</li>
                  <li>Redeploy el proyecto</li>
                </ol>
              </div>

              <Button onClick={checkEnvironment} className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Verificar Nuevamente
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
