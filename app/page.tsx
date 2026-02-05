"use client"
import { AuthLayout } from "@/components/auth-layout"
import { AuthForm } from "@/components/auth-form"
import * as React from "react"

export default function Home() {
  const [mode, setMode] = React.useState<"login" | "register">("login")
  return (
    <AuthLayout>
      <AuthForm mode={mode} onModeChange={setMode} />
    </AuthLayout>
  )
}
