import type React from "react"
import type { Metadata, Viewport } from "next"
import "../styles/globals.css"

export const metadata: Metadata = {
  title: "YourVoice - Platform Integritas & Aspirasi",
  description:
    "Platform pelaporan anonim untuk menyuarakan aspirasi, melaporkan masalah, dan membangun lingkungan yang lebih baik.",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#020617",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  )
}
