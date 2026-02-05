"use client"

import * as React from "react"
import { ThemeToggle } from "@/components/theme-toggle"
import { AuthForm } from "@/components/auth-form"
import { Card, CardContent } from "@/components/ui/card"

export function AuthLayout({ children }: { children: React.ReactNode }) {

  return (
    <div className="min-h-screen w-full flex flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between p-6">
        <div className="flex items-center gap-3">
          <img
            src="/logo.svg"
            alt="PharmaCatalog Logo"
            className="h-10 w-auto object-contain"
          />
        </div>
        <ThemeToggle />
      </header>

      {/* Form Container */}
      <main className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-md border-border/50 shadow-lg">
          <CardContent className="p-6 sm:p-8">
            {children}
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center">
        <p className="text-sm text-muted-foreground">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </footer>
    </div>
  )
}
