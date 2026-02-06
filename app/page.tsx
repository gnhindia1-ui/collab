"use client"
import { AuthLayout } from "@/components/auth-layout"
import { AuthForm } from "@/components/auth-form"
import { Navbar } from "@/components/navbar"
import * as React from "react"

export default function Home() {
  const [mode, setMode] = React.useState<"login" | "register">("login")
  return (
    <>
      <div className="absolute top-0 left-0 right-0 z-50">
        <Navbar />
      </div>
      <AuthLayout>
        <AuthForm mode={mode} onModeChange={setMode} />
      </AuthLayout>
    </>
  )
}
