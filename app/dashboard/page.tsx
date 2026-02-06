"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import {
  Search,
  LogOut,
  Settings,
  ChevronDown,
  Edit,
  Package,
  FileText,
  Calendar,
  Newspaper,
} from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { ProductsTable } from "@/components/products-table"



interface User {
  id: number
  email: string
  name: string
  role: number
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = React.useState<User | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    // Fetch current user
    async function fetchUser() {
      try {
        const response = await fetch("/api/auth/me")

        if (!response.ok) {
          // Not authenticated, redirect to login
          router.push("/")
          return
        }

        const data = await response.json()
        setUser(data.user)
      } catch (error) {
        console.error("Failed to fetch user:", error)
        router.push("/")
      } finally {
        setIsLoading(false)
      }
    }

    fetchUser()
  }, [router])

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      toast.success("Logged out successfully")
      router.push("/")
    } catch (error) {
      console.error("Logout error:", error)
      toast.error("Failed to logout")
    }
  }





  // Get user initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-auto items-center justify-center">
              <Image
                src="/logo.svg"
                alt="PharmaCatalog Logo"
                width={140}
                height={40}
                className="object-contain"
                priority
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 px-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <ChevronDown className="h-4 w-4 text-muted-foreground hidden sm:block" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center gap-2 p-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{user.name}</span>
                    <span className="text-xs text-muted-foreground">{user.email}</span>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <div className="px-2 py-1.5">
                  <Badge variant={user.role === 2 ? "default" : "secondary"} className="text-xs">
                    {user.role === 2 ? "Superadmin" : "Admin"}
                  </Badge>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/dashboard/settings")}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/dashboard/blogs")}>
                  <FileText className="mr-2 h-4 w-4" />
                  Manage Blogs
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/dashboard/events")}>
                  <Calendar className="mr-2 h-4 w-4" />
                  Manage Events
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/dashboard/news")}>
                  <Newspaper className="mr-2 h-4 w-4" />
                  Manage News
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 sm:p-6 lg:p-8 w-full max-w-[98%] mx-auto">
        <div className="space-y-6">
          {/* Page Header */}
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Pharmaceutical Items</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Select an item to edit
            </p>
          </div>



          {/* Items Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ProductsTable />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
