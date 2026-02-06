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
  const [stats, setStats] = React.useState({ products: 0, blogs: 0, events: 0, news: 0 })

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

    // Fetch stats
    async function fetchStats() {
      try {
        const response = await fetch("/api/stats")
        if (response.ok) {
          const data = await response.json()
          setStats(data)
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error)
      }
    }

    fetchUser()
    fetchStats()
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
          <div className="flex items-center gap-6">
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

            {/* Main Navigation Links */}
            <nav className="hidden md:flex items-center gap-4 border-l pl-6 ml-2 h-8">
              <span
                onClick={() => router.push("/dashboard/blogs")}
                className="text-sm font-medium hover:text-primary cursor-pointer flex items-center gap-2 transition-colors"
              >
                <FileText className="h-4 w-4 text-muted-foreground" />
                Blogs
              </span>
              <span
                onClick={() => router.push("/dashboard/events")}
                className="text-sm font-medium hover:text-primary cursor-pointer flex items-center gap-2 transition-colors"
              >
                <Calendar className="h-4 w-4 text-muted-foreground" />
                Events
              </span>
              <span
                onClick={() => router.push("/dashboard/news")}
                className="text-sm font-medium hover:text-primary cursor-pointer flex items-center gap-2 transition-colors"
              >
                <Newspaper className="h-4 w-4 text-muted-foreground" />
                News
              </span>
            </nav>
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
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/dashboard')}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.products}</div>
                <p className="text-xs text-muted-foreground">Active inventory items</p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/dashboard/blogs')}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Blogs Published</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.blogs}</div>
                <p className="text-xs text-muted-foreground">Articles and updates</p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/dashboard/events')}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Events</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.events}</div>
                <p className="text-xs text-muted-foreground">Upcoming and past</p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/dashboard/news')}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">News Articles</CardTitle>
                <Newspaper className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.news}</div>
                <p className="text-xs text-muted-foreground">Press and announcements</p>
              </CardContent>
            </Card>
          </div>

          <div className="border-t pt-6"></div>

          {/* Page Header */}
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Pharmaceutical Items</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Select an item to edit or manage inventory
            </p>
          </div>

          {/* Items Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Inventory List
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
