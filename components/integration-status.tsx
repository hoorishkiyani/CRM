"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Mail, MessageCircle, Bot, Zap, AlertCircle, CheckCircle } from "lucide-react"

export function IntegrationStatus() {
  const integrations = [
    {
      name: "Email (SMTP/IMAP)",
      status: "pending",
      description: "Integración completa de email con threading",
      icon: Mail,
      features: ["Envío automático", "Threading", "Seguimiento de respuestas"],
    },
    {
      name: "WhatsApp API",
      status: "pending",
      description: "Integración con Twilio/Gupshup para WhatsApp",
      icon: MessageCircle,
      features: ["Mensajes automáticos", "Webhooks", "Estado de entrega"],
    },
    {
      name: "AI Reply Generation",
      status: "active",
      description: "Generación de respuestas con OpenAI",
      icon: Bot,
      features: ["Respuestas contextuales", "Múltiples idiomas", "Personalización"],
    },
    {
      name: "Real-time Updates",
      status: "active",
      description: "Actualizaciones en tiempo real con Supabase",
      icon: Zap,
      features: ["Sincronización automática", "Notificaciones", "Estado en vivo"],
    },
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "pending":
        return <AlertCircle className="h-4 w-4 text-orange-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Activo</Badge>
      case "pending":
        return <Badge className="bg-orange-100 text-orange-800">Pendiente</Badge>
      default:
        return <Badge variant="secondary">Inactivo</Badge>
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Estado de Integraciones</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {integrations.map((integration) => {
          const IconComponent = integration.icon
          return (
            <Card key={integration.name}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconComponent className="h-5 w-5" />
                  {integration.name}
                  {getStatusIcon(integration.status)}
                </CardTitle>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">{integration.description}</p>
                  {getStatusBadge(integration.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Características:</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {integration.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                {integration.status === "pending" && (
                  <div className="mt-4 p-3 bg-orange-50 rounded-lg">
                    <p className="text-sm text-orange-800">
                      Esta integración está preparada para implementación futura con APIs externas.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Próximos Pasos para Integraciones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                1
              </div>
              <div>
                <h4 className="font-medium">Configurar Email SMTP/IMAP</h4>
                <p className="text-sm text-muted-foreground">
                  Integrar con proveedores como Gmail API, Outlook, o servicios SMTP personalizados
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                2
              </div>
              <div>
                <h4 className="font-medium">Implementar WhatsApp Business API</h4>
                <p className="text-sm text-muted-foreground">
                  Conectar con Twilio, Gupshup, o Kaleyra para mensajería automática
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                3
              </div>
              <div>
                <h4 className="font-medium">Configurar Automatización (n8n)</h4>
                <p className="text-sm text-muted-foreground">
                  Implementar workflows automáticos para seguimientos y triggers temporales
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
