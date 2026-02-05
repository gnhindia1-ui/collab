"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import {
  ArrowLeft,
  LogOut,
  Settings,
  ChevronDown,
  Shield,
  Key,
  Copy,
  Check,
  Clock,
  Users,
  AlertCircle,
  Lock,
  Database,
} from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface User {
  id: number
  email: string
  name: string
  role: number
}

interface Token {
  id: number
  token: string
  createdBy: number
  creatorName: string
  expiresAt: string
  isUsed: boolean
  usedBy: number | null
  userName: string | null
  usedAt: string | null
  createdAt: string
}

interface ColumnPermission {
  column_name: string
  is_editable: boolean
}

export default function SettingsPage() {
  const router = useRouter()
  const [user, setUser] = React.useState<User | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isGenerating, setIsGenerating] = React.useState(false)
  const [tokens, setTokens] = React.useState<Token[]>([])
  const [isFetchingTokens, setIsFetchingTokens] = React.useState(false)
  const [copiedToken, setCopiedToken] = React.useState<string | null>(null)
  const [permissions, setPermissions] = React.useState<ColumnPermission[]>([])
  const [isFetchingPermissions, setIsFetchingPermissions] = React.useState(false)
  const [isSavingPermissions, setIsSavingPermissions] = React.useState(false)

  React.useEffect(() => {
    fetchUser()
  }, [])

  React.useEffect(() => {
    if (user && user.role === 2) {
      fetchTokens()
      fetchPermissions()
    }
  }, [user])

  async function fetchUser() {
    try {
      const response = await fetch("/api/auth/me")

      if (!response.ok) {
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

  async function fetchTokens() {
    setIsFetchingTokens(true)
    try {
      const response = await fetch("/api/tokens/list")

      if (!response.ok) {
        throw new Error("Failed to fetch tokens")
      }

      const data = await response.json()
      setTokens(data.tokens)
    } catch (error) {
      console.error("Failed to fetch tokens:", error)
      toast.error("Failed to fetch tokens")
    } finally {
      setIsFetchingTokens(false)
    }
  }

  async function fetchPermissions() {
    setIsFetchingPermissions(true)
    try {
      // Add no-store and timestamp to bypass caching
      const response = await fetch(`/api/settings/permissions?roleId=1&t=${Date.now()}`, {
        cache: "no-store",
        headers: { "Pragma": "no-cache" }
      })
      if (!response.ok) throw new Error("Failed to fetch permissions")
      const data = await response.json()
      // Normalize and sort for consistency
      const normalizedPermissions = (data.permissions || []).map((p: any) => ({
        column_name: p.column_name.toLowerCase(),
        is_editable: !!p.is_editable
      })).sort((a: any, b: any) => a.column_name.localeCompare(b.column_name))

      setPermissions(normalizedPermissions)
    } catch (error) {
      console.error("Failed to fetch permissions:", error)
      toast.error("Failed to fetch column permissions")
    } finally {
      setIsFetchingPermissions(false)
    }
  }

  async function savePermissions(latestPermissions: ColumnPermission[]) {
    setIsSavingPermissions(true)
    try {
      const response = await fetch("/api/settings/permissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleId: 1, permissions: latestPermissions }),
      })

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.error || "Failed to save permissions")
      }

      const data = await response.json()
      // Optional: silent success since it's auto-save
      // toast.success("Permissions synced")

      if (data.permissions) {
        const synced = data.permissions.map((p: any) => ({
          column_name: p.column_name.toLowerCase(),
          is_editable: !!p.is_editable
        })).sort((a: any, b: any) => a.column_name.localeCompare(b.column_name))
        setPermissions(synced)
      }
    } catch (error: any) {
      console.error("Auto-save error:", error)
      toast.error("Failed to sync permissions")
      // Refetch to revert to server state on failure
      fetchPermissions()
    } finally {
      setIsSavingPermissions(false)
    }
  }

  function togglePermission(columnName: string) {
    const normalizedName = columnName.toLowerCase()
    const newPermissions = permissions.map((p) =>
      p.column_name.toLowerCase() === normalizedName ? { ...p, is_editable: !p.is_editable } : p
    )

    // Update local state immediately for UI responsiveness
    setPermissions(newPermissions)

    // Trigger auto-save with the new state
    savePermissions(newPermissions)
  }

  async function generateToken() {
    setIsGenerating(true)
    try {
      const response = await fetch("/api/tokens/generate", {
        method: "POST",
      })

      if (!response.ok) {
        const data = await response.json()
        toast.error(data.error || "Failed to generate token")
        return
      }

      const data = await response.json()
      toast.success("Registration token generated successfully!")

      // Refresh tokens list
      await fetchTokens()

      // Auto-copy the new token
      await copyToClipboard(data.token)
    } catch (error) {
      console.error("Token generation error:", error)
      toast.error("Failed to generate token")
    } finally {
      setIsGenerating(false)
    }
  }

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedToken(text)
      toast.success("Token copied to clipboard!")

      setTimeout(() => {
        setCopiedToken(null)
      }, 2000)
    } catch (error) {
      console.error("Failed to copy:", error)
      toast.error("Failed to copy to clipboard")
    }
  }

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

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  const isTokenExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date()
  }

  const getTokenStatus = (token: Token) => {
    if (token.isUsed) {
      return { label: "Used", variant: "secondary" as const }
    }
    if (isTokenExpired(token.expiresAt)) {
      return { label: "Expired", variant: "destructive" as const }
    }
    return { label: "Active", variant: "default" as const }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const isSuperAdmin = user.role === 2

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
                <DropdownMenuItem onClick={() => router.push("/dashboard")}>
                  <Users className="mr-2 h-4 w-4" />
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem>
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
      <main className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard")}>
                <ArrowLeft className="h-5 w-5" />
                <span className="sr-only">Go back</span>
              </Button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
                  {isSuperAdmin && (
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                      <Shield className="h-3 w-3 mr-1" />
                      Superadmin
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {isSuperAdmin
                    ? "Generate registration tokens and manage system settings"
                    : "View your account settings"}
                </p>
              </div>
            </div>
          </div>

          {/* Superadmin Token Generation Section */}
          {isSuperAdmin ? (
            <>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Key className="h-5 w-5" />
                        Generate Registration Token
                      </CardTitle>
                      <CardDescription>
                        Create a 64-character token valid for 24 hours. New users need this token to register.
                      </CardDescription>
                    </div>
                    <Button onClick={generateToken} disabled={isGenerating}>
                      {isGenerating ? "Generating..." : "Generate Token"}
                    </Button>
                  </div>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Token History
                  </CardTitle>
                  <CardDescription>All registration tokens and their status</CardDescription>
                </CardHeader>
                <CardContent>
                  {isFetchingTokens ? (
                    <div className="text-center py-8">
                      <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
                      <p className="mt-2 text-sm text-muted-foreground">Loading tokens...</p>
                    </div>
                  ) : tokens.length === 0 ? (
                    <div className="text-center py-8">
                      <Key className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                      <p className="mt-4 text-sm text-muted-foreground">No tokens generated yet</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Token</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Expires</TableHead>
                            <TableHead>Created By</TableHead>
                            <TableHead>Used By</TableHead>
                            <TableHead>Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {tokens.map((token) => {
                            const status = getTokenStatus(token)
                            return (
                              <TableRow key={token.id}>
                                <TableCell className="font-mono text-xs max-w-xs truncate">
                                  {token.token}
                                </TableCell>
                                <TableCell>
                                  <Badge variant={status.variant}>{status.label}</Badge>
                                </TableCell>
                                <TableCell className="text-sm">
                                  {formatDate(token.expiresAt)}
                                </TableCell>
                                <TableCell className="text-sm">{token.creatorName}</TableCell>
                                <TableCell className="text-sm">
                                  {token.userName || "-"}
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => copyToClipboard(token.token)}
                                  >
                                    {copiedToken === token.token ? (
                                      <Check className="h-4 w-4" />
                                    ) : (
                                      <Copy className="h-4 w-4" />
                                    )}
                                  </Button>
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Lock className="h-5 w-5" />
                        Admin Edit Permissions
                      </CardTitle>
                      <CardDescription>
                        Control which fields the Admin role is allowed to edit. Changes are saved automatically.
                      </CardDescription>
                    </div>
                    {isSavingPermissions && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground animate-pulse">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                        Syncing...
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {isFetchingPermissions ? (
                    <div className="text-center py-8">
                      <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
                      <p className="mt-2 text-sm text-muted-foreground">Loading permissions...</p>
                    </div>
                  ) : permissions.length === 0 ? (
                    <div className="text-center py-8">
                      <Lock className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                      <p className="mt-4 text-sm text-muted-foreground">No permissions found</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {permissions.map((perm) => (
                        <div
                          key={perm.column_name}
                          className={`flex items-center justify-between p-3 rounded-lg border transition-all ${perm.is_editable
                            ? "bg-card border-border"
                            : "bg-muted/50 border-amber-500/20"
                            }`}
                        >
                          <div className="flex items-center gap-2">
                            {perm.is_editable ? (
                              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            ) : (
                              <Lock className="h-3 w-3 text-amber-500" />
                            )}
                            <span className={`text-[13px] font-medium font-mono ${!perm.is_editable ? "text-muted-foreground" : ""}`}>
                              {perm.column_name.replace('item_', '')}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                              {perm.is_editable ? "Edit" : "View"}
                            </span>
                            <Switch
                              checked={perm.is_editable}
                              onCheckedChange={() => togglePermission(perm.column_name)}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

            </>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You are logged in as an Admin. Only Superadmins can generate registration tokens.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </main>
    </div>
  )
}
