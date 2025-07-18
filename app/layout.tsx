import type React from "react"
import type { Metadata } from "next"
import localFont from "next/font/local"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"

// Definir la fuente Manrope
const manrope = localFont({
  src: "../public/Manrope-VariableFont_wght.ttf",
  display: "swap",
  variable: "--font-manrope", // Opcional: para usar con Tailwind CSS
})

export const metadata: Metadata = {
  title: "¡Pide tu plata!",
  description: "Nequi - La cuenta digital que te permite manejar tu plata de forma fácil, rápida y segura",
  generator: "v0.dev",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`${manrope.className} ${manrope.variable}`}>
      <body>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
