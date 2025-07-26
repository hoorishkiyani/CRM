import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export async function generateReply(
  messageContent: string,
  context: {
    contactName: string
    product: string
    previousMessages?: string[]
  },
) {
  try {
    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      system: `Eres un asistente de ventas profesional para Neon 51, una empresa que fabrica productos de neón personalizados como letreros, cuadros neón, letras corpóreas y espejos infinitos. 

Tu tarea es generar respuestas profesionales y útiles para clientes potenciales. Mantén un tono amigable pero profesional, y siempre busca avanzar la conversación hacia una venta o reunión.

Información del contexto:
- Cliente: ${context.contactName}
- Producto de interés: ${context.product}
- Mensajes previos: ${context.previousMessages?.join("\n") || "Ninguno"}`,
      prompt: `El cliente escribió: "${messageContent}"

Genera una respuesta profesional que:
1. Responda directamente a su consulta
2. Proporcione información útil sobre el producto
3. Incluya una llamada a la acción apropiada
4. Mantenga el interés del cliente

La respuesta debe ser en español y no más de 150 palabras.`,
    })

    return text
  } catch (error) {
    console.error("Error generating AI reply:", error)
    throw new Error("No se pudo generar la respuesta automática")
  }
}
