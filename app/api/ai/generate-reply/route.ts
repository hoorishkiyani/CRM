import { type NextRequest, NextResponse } from "next/server"
import { generateReply } from "@/lib/ai"

export async function POST(request: NextRequest) {
  try {
    const { messageContent, context } = await request.json()

    if (!messageContent || !context) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const reply = await generateReply(messageContent, context)

    return NextResponse.json({ reply })
  } catch (error) {
    console.error("Error generating AI reply:", error)
    return NextResponse.json({ error: "Failed to generate reply" }, { status: 500 })
  }
}
