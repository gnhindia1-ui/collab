"use client"

import * as React from "react"
import { useRouter, useParams } from "next/navigation"
import {
  Pill,
  Save,
  ArrowLeft,
  LogOut,
  Settings,
  ChevronDown,
  ImageIcon,
  Info,
  FileText,
  Package,
  Database,
  HelpCircle,
  Lock,
} from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface ColumnPermission {
  column_name: string
  is_editable: boolean
}

interface User {
  id: number
  email: string
  name: string
  role: number
}

const isSuperadmin = (userRole: number) => userRole === 2
const isAdmin = (userRole: number) => userRole === 1 || userRole === 2

export default function EditItemPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const params = React.use(paramsPromise)
  const idValue = params.id
  const itemId = Number(idValue)

  const [user, setUser] = React.useState<User | null>(null)
  const [formData, setFormData] = React.useState<any>(null)
  const [permissions, setPermissions] = React.useState<Record<string, boolean>>({})
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)

  React.useEffect(() => {
    if (idValue && !isNaN(itemId)) {
      fetchInitialData()
    }
  }, [idValue, itemId])

  async function fetchInitialData() {
    setIsLoading(true)
    try {
      // 1. Fetch User Session
      const userRes = await fetch("/api/auth/me")
      if (!userRes.ok) {
        router.push("/")
        return
      }
      const userData = await userRes.json()
      setUser(userData.user)

      // 2. Fetch Item Data
      const itemRes = await fetch(`/api/products/${itemId}`)
      if (!itemRes.ok) {
        console.error("DEBUG: Failed to fetch product. Status:", itemRes.status)
        toast.error("Failed to fetch product data")
        // Don't redirect immediately, let the user see the error or handle it
        setIsLoading(false)
        return
      }
      const itemData = await itemRes.json()
      console.log("DEBUG: Item data successfully fetched:", itemData.product)
      if (!itemData.product) {
        console.warn("DEBUG: itemData.product is null or undefined!")
      }
      setFormData(itemData.product)

      // 3. Fetch Permissions if Admin
      if (userData.user.role === 1) {
        console.log("DEBUG: User is Admin, fetching column permissions...")
        const permRes = await fetch(`/api/settings/permissions?roleId=1&t=${Date.now()}`, {
          cache: "no-store",
          headers: { "Pragma": "no-cache" }
        })
        if (permRes.ok) {
          const permData = await permRes.json()
          const permMap = permData.permissions.reduce((acc: any, p: any) => {
            acc[p.column_name.toLowerCase()] = !!p.is_editable
            return acc
          }, {})
          setPermissions(permMap)
        } else {
          console.error("DEBUG: Failed to fetch permissions. Status:", permRes.status)
        }
      }
    } catch (error) {
      console.error("DEBUG: Initialization error:", error)
      toast.error("An error occurred while loading the page")
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      router.push("/")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  const handleInputChange = (field: string, value: string | number | null) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/products/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to save changes")
      }

      toast.success("Product updated successfully")
      router.push("/dashboard")
    } catch (error: any) {
      console.error("Save error:", error)
      toast.error(error.message || "Failed to save changes")
    } finally {
      setIsSaving(false)
    }
  }

  const isEditable = (columnName: string) => {
    if (!user) return false
    if (user.role === 2) return true

    // Explicitly check if the permission is set to false
    const normalizedColumnName = columnName.toLowerCase()
    const isExplicitlyDisabled = permissions[normalizedColumnName] === false
    return !isExplicitlyDisabled
  }

  // Helper component for labels with lock icon
  const FieldLabel = ({ id, label, columnName }: { id: string, label: string, columnName: string }) => {
    const editable = isEditable(columnName)
    return (
      <div className="flex items-center gap-2 mb-2">
        <Label htmlFor={id} className={!editable ? "text-muted-foreground" : ""}>
          {label}
        </Label>
        {!editable && user?.role === 1 && (
          <Badge variant="outline" className="h-5 px-1 bg-amber-500/10 text-amber-500 border-amber-500/20 text-[10px] flex items-center gap-1">
            <Lock className="h-2 w-2" />
            Locked
          </Badge>
        )}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">Loading product details...</p>
        </div>
      </div>
    )
  }

  if (!formData) return null

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Pill className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold text-foreground hidden sm:inline-block">
              PharmaCatalog
            </span>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 px-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                      {getInitials(user?.name || "User")}
                    </AvatarFallback>
                  </Avatar>
                  <ChevronDown className="h-4 w-4 text-muted-foreground hidden sm:block" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center gap-2 p-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                      {getInitials(user?.name || "User")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{user?.name}</span>
                    <span className="text-xs text-muted-foreground">{user?.email}</span>
                  </div>
                </div>
                <DropdownMenuSeparator />
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
                <h1 className="text-2xl font-semibold text-foreground">Edit Item</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Update pharmaceutical item information
                </p>
              </div>
            </div>
            <Button onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto">
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>

          {/* Form Tabs */}
          <Tabs defaultValue="basic" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 lg:w-auto lg:inline-grid">
              <TabsTrigger value="basic" className="gap-2">
                <Package className="h-4 w-4" />
                <span className="hidden sm:inline">Basic</span>
              </TabsTrigger>
              <TabsTrigger value="details" className="gap-2">
                <Info className="h-4 w-4" />
                <span className="hidden sm:inline">Details</span>
              </TabsTrigger>
              <TabsTrigger value="content" className="gap-2">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Content</span>
              </TabsTrigger>
              <TabsTrigger value="faqs" className="gap-2">
                <HelpCircle className="h-4 w-4" />
                <span className="hidden sm:inline">FAQs</span>
              </TabsTrigger>
              <TabsTrigger value="meta" className="gap-2">
                <Database className="h-4 w-4" />
                <span className="hidden sm:inline">Meta</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-2">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Settings</span>
              </TabsTrigger>
            </TabsList>

            {/* Basic Info Tab */}
            <TabsContent value="basic" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Basic Information
                  </CardTitle>
                  <CardDescription>
                    Core identification and naming details for the pharmaceutical item
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <FieldLabel id="item_serial" label="Serial Number" columnName="item_serial" />
                      <Input
                        id="item_serial"
                        value={formData.item_serial || ""}
                        onChange={(e) => handleInputChange("item_serial", e.target.value)}
                        placeholder="SER-XXXXXX"
                        disabled={!isEditable("item_serial")}
                      />
                    </div>
                    <div className="space-y-2">
                      <FieldLabel id="item_sku" label="SKU" columnName="item_sku" />
                      <Input
                        id="item_sku"
                        value={formData.item_sku || ""}
                        onChange={(e) => handleInputChange("item_sku", e.target.value)}
                        placeholder="Product SKU"
                        disabled={!isEditable("item_sku")}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <FieldLabel id="item_name" label="Item Name" columnName="item_name" />
                    <Input
                      id="item_name"
                      value={formData.item_name || ""}
                      onChange={(e) => handleInputChange("item_name", e.target.value)}
                      placeholder="Full product name"
                      disabled={!isEditable("item_name")}
                    />
                  </div>

                  <div className="space-y-2">
                    <FieldLabel id="item_slug" label="URL Slug" columnName="item_slug" />
                    <Input
                      id="item_slug"
                      value={formData.item_slug || ""}
                      onChange={(e) => handleInputChange("item_slug", e.target.value)}
                      placeholder="url-friendly-name"
                      disabled={!isEditable("item_slug")}
                    />
                  </div>

                  <Separator />

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <FieldLabel id="item_drug" label="Drug Name" columnName="item_drug" />
                      <Input
                        id="item_drug"
                        value={formData.item_drug || ""}
                        onChange={(e) => handleInputChange("item_drug", e.target.value)}
                        placeholder="Active ingredient"
                        disabled={!isEditable("item_drug")}
                      />
                    </div>
                    <div className="space-y-2">
                      <FieldLabel id="item_drugcode" label="Drug Code" columnName="item_drugcode" />
                      <Input
                        id="item_drugcode"
                        value={formData.item_drugcode || ""}
                        onChange={(e) => handleInputChange("item_drugcode", e.target.value)}
                        placeholder="ATC code"
                        disabled={!isEditable("item_drugcode")}
                      />
                    </div>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <FieldLabel id="item_brand" label="Brand" columnName="item_brand" />
                      <Input
                        id="item_brand"
                        value={formData.item_brand || ""}
                        onChange={(e) => handleInputChange("item_brand", e.target.value)}
                        placeholder="Brand name"
                        disabled={!isEditable("item_brand")}
                      />
                    </div>
                    <div className="space-y-2">
                      <FieldLabel id="item_manufacturer" label="Manufacturer" columnName="item_manufacturer" />
                      <Input
                        id="item_manufacturer"
                        value={formData.item_manufacturer || ""}
                        onChange={(e) => handleInputChange("item_manufacturer", e.target.value)}
                        placeholder="Manufacturing company"
                        disabled={!isEditable("item_manufacturer")}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    Product Images
                  </CardTitle>
                  <CardDescription>
                    Product image URLs
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-col sm:flex-row gap-6 items-start">
                    <div className="w-32 h-32 rounded-lg border-2 border-dashed border-border bg-muted flex items-center justify-center overflow-hidden">
                      {formData.item_image ? (
                        <img src={formData.item_image} alt="Product" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 space-y-4 w-full">
                      <div className="space-y-2">
                        <FieldLabel id="item_image" label="Image URL" columnName="item_image" />
                        <Input
                          id="item_image"
                          value={formData.item_image || ""}
                          onChange={(e) => handleInputChange("item_image", e.target.value)}
                          placeholder="/images/product.jpg"
                          disabled={!isEditable("item_image")}
                        />
                      </div>
                      <div className="space-y-2">
                        <FieldLabel id="item_image_webp" label="WebP Image URL" columnName="item_image_webp" />
                        <Input
                          id="item_image_webp"
                          value={formData.item_image_webp || ""}
                          onChange={(e) => handleInputChange("item_image_webp", e.target.value)}
                          placeholder="/images/product.webp"
                          disabled={!isEditable("item_image_webp")}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Details Tab */}
            <TabsContent value="details" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="h-5 w-5" />
                    Product Details
                  </CardTitle>
                  <CardDescription>
                    Formulation, strength, and packaging information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <FieldLabel id="item_form" label="Form" columnName="item_form" />
                      <Select
                        value={formData.item_form || ""}
                        onValueChange={(value) => handleInputChange("item_form", value)}
                        disabled={!isEditable("item_form")}
                      >
                        <SelectTrigger id="item_form">
                          <SelectValue placeholder="Select form" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Tablet">Tablet</SelectItem>
                          <SelectItem value="Capsule">Capsule</SelectItem>
                          <SelectItem value="Syrup">Syrup</SelectItem>
                          <SelectItem value="Injection">Injection</SelectItem>
                          <SelectItem value="Cream">Cream</SelectItem>
                          <SelectItem value="Ointment">Ointment</SelectItem>
                          <SelectItem value="Drops">Drops</SelectItem>
                          <SelectItem value="Powder">Powder</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <FieldLabel id="item_route" label="Route" columnName="item_route" />
                      <Select
                        value={formData.item_route || ""}
                        onValueChange={(value) => handleInputChange("item_route", value)}
                        disabled={!isEditable("item_route")}
                      >
                        <SelectTrigger id="item_route">
                          <SelectValue placeholder="Select route" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Oral">Oral</SelectItem>
                          <SelectItem value="Topical">Topical</SelectItem>
                          <SelectItem value="Intravenous">Intravenous</SelectItem>
                          <SelectItem value="Intramuscular">Intramuscular</SelectItem>
                          <SelectItem value="Subcutaneous">Subcutaneous</SelectItem>
                          <SelectItem value="Inhalation">Inhalation</SelectItem>
                          <SelectItem value="Nasal">Nasal</SelectItem>
                          <SelectItem value="Ophthalmic">Ophthalmic</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <FieldLabel id="item_strength" label="Strength" columnName="item_strength" />
                      <Input
                        id="item_strength"
                        value={formData.item_strength || ""}
                        onChange={(e) => handleInputChange("item_strength", e.target.value)}
                        placeholder="e.g., 500mg"
                        disabled={!isEditable("item_strength")}
                      />
                    </div>
                    <div className="space-y-2">
                      <FieldLabel id="item_packsize" label="Pack Size" columnName="item_packsize" />
                      <Input
                        id="item_packsize"
                        value={formData.item_packsize || ""}
                        onChange={(e) => handleInputChange("item_packsize", e.target.value)}
                        placeholder="e.g., 30 Tablets"
                        disabled={!isEditable("item_packsize")}
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <FieldLabel id="item_origin" label="Country of Origin" columnName="item_origin" />
                      <Input
                        id="item_origin"
                        value={formData.item_origin || ""}
                        onChange={(e) => handleInputChange("item_origin", e.target.value)}
                        placeholder="Country name"
                        disabled={!isEditable("item_origin")}
                      />
                    </div>
                    <div className="space-y-2">
                      <FieldLabel id="item_origin_id" label="Origin ID" columnName="item_origin_id" />
                      <Input
                        id="item_origin_id"
                        type="number"
                        value={formData.item_origin_id || 0}
                        onChange={(e) => handleInputChange("item_origin_id", parseInt(e.target.value) || 0)}
                        placeholder="Origin ID"
                        disabled={!isEditable("item_origin_id")}
                      />
                    </div>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <FieldLabel id="item_temperature" label="Storage Temperature" columnName="item_temperature" />
                      <Input
                        id="item_temperature"
                        value={formData.item_temperature || ""}
                        onChange={(e) => handleInputChange("item_temperature", e.target.value)}
                        placeholder="Storage conditions"
                        disabled={!isEditable("item_temperature")}
                      />
                    </div>
                    <div className="space-y-2">
                      <FieldLabel id="item_maauth" label="Marketing Authorization" columnName="item_maauth" />
                      <Input
                        id="item_maauth"
                        value={formData.item_maauth || ""}
                        onChange={(e) => handleInputChange("item_maauth", e.target.value)}
                        placeholder="e.g., FDA Approved"
                        disabled={!isEditable("item_maauth")}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <FieldLabel id="item_mauth_ids" label="Marketing Auth IDs" columnName="item_mauth_ids" />
                    <Input
                      id="item_mauth_ids"
                      value={formData.item_mauth_ids || ""}
                      onChange={(e) => handleInputChange("item_mauth_ids", e.target.value)}
                      placeholder="Comma-separated IDs"
                      disabled={!isEditable("item_mauth_ids")}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <FieldLabel id="item_packdm" label="Pack Dimensions JSON" columnName="item_packdm" />
                    <Textarea
                      id="item_packdm"
                      value={formData.item_packdm || ""}
                      onChange={(e) => handleInputChange("item_packdm", e.target.value)}
                      placeholder='{"length": 10, "width": 5, "height": 2, "weight": 50}'
                      className="font-mono text-sm"
                      rows={3}
                      disabled={!isEditable("item_packdm")}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Content Tab */}
            <TabsContent value="content" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Product Content
                  </CardTitle>
                  <CardDescription>
                    Descriptions, uses, and medical information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <FieldLabel id="item_about" label="About" columnName="item_about" />
                    <Textarea
                      id="item_about"
                      value={formData.item_about || ""}
                      onChange={(e) => handleInputChange("item_about", e.target.value)}
                      placeholder="General description of the product"
                      rows={4}
                      disabled={!isEditable("item_about")}
                    />
                  </div>

                  <div className="space-y-2">
                    <FieldLabel id="item_uses" label="Uses" columnName="item_uses" />
                    <Textarea
                      id="item_uses"
                      value={formData.item_uses || ""}
                      onChange={(e) => handleInputChange("item_uses", e.target.value)}
                      placeholder="What is this medication used for?"
                      rows={4}
                      disabled={!isEditable("item_uses")}
                    />
                  </div>

                  <div className="space-y-2">
                    <FieldLabel id="item_effects" label="Side Effects" columnName="item_effects" />
                    <Textarea
                      id="item_effects"
                      value={formData.item_effects || ""}
                      onChange={(e) => handleInputChange("item_effects", e.target.value)}
                      placeholder="Potential side effects"
                      rows={4}
                      disabled={!isEditable("item_effects")}
                    />
                  </div>

                  <div className="space-y-2">
                    <FieldLabel id="item_precautions" label="Precautions" columnName="item_precautions" />
                    <Textarea
                      id="item_precautions"
                      value={formData.item_precautions || ""}
                      onChange={(e) => handleInputChange("item_precautions", e.target.value)}
                      placeholder="Warnings and precautions"
                      rows={4}
                      disabled={!isEditable("item_precautions")}
                    />
                  </div>

                  <div className="space-y-2">
                    <FieldLabel id="item_interactions" label="Drug Interactions" columnName="item_interactions" />
                    <Textarea
                      id="item_interactions"
                      value={formData.item_interactions || ""}
                      onChange={(e) => handleInputChange("item_interactions", e.target.value)}
                      placeholder="Interactions with other medications"
                      rows={4}
                      disabled={!isEditable("item_interactions")}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* FAQs Tab */}
            <TabsContent value="faqs" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HelpCircle className="h-5 w-5" />
                    Frequently Asked Questions
                  </CardTitle>
                  <CardDescription>
                    FAQs in JSON format
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <FieldLabel id="item_faqs" label="FAQs JSON" columnName="item_faqs" />
                    <Textarea
                      id="item_faqs"
                      value={formData.item_faqs || ""}
                      onChange={(e) => handleInputChange("item_faqs", e.target.value)}
                      placeholder='[{"question": "...", "answer": "..."}]'
                      className="font-mono text-sm"
                      rows={10}
                      disabled={!isEditable("item_faqs")}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Meta Tab */}
            <TabsContent value="meta" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    SEO & Meta Information
                  </CardTitle>
                  <CardDescription>
                    Search engine optimization and metadata
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <FieldLabel id="item_keywords" label="Keywords" columnName="item_keywords" />
                    <Textarea
                      id="item_keywords"
                      value={formData.item_keywords || ""}
                      onChange={(e) => handleInputChange("item_keywords", e.target.value)}
                      placeholder="Comma-separated keywords"
                      rows={2}
                      disabled={!isEditable("item_keywords")}
                    />
                  </div>

                  <div className="space-y-2">
                    <FieldLabel id="item_metadesc" label="Meta Description" columnName="item_metadesc" />
                    <Textarea
                      id="item_metadesc"
                      value={formData.item_metadesc || ""}
                      onChange={(e) => handleInputChange("item_metadesc", e.target.value)}
                      placeholder="SEO meta description (max 500 chars)"
                      rows={3}
                      disabled={!isEditable("item_metadesc")}
                    />
                    <p className="text-xs text-muted-foreground">
                      {(formData.item_metadesc || "").length}/500 characters
                    </p>
                  </div>

                  <div className="space-y-2">
                    <FieldLabel id="item_reference" label="Reference URL" columnName="item_reference" />
                    <Input
                      id="item_reference"
                      value={formData.item_reference || ""}
                      onChange={(e) => handleInputChange("item_reference", e.target.value)}
                      placeholder="https://..."
                      disabled={!isEditable("item_reference")}
                    />
                  </div>

                  <Separator />

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <FieldLabel id="item_author" label="Author" columnName="item_author" />
                      <Input
                        id="item_author"
                        value={formData.item_author || ""}
                        onChange={(e) => handleInputChange("item_author", e.target.value)}
                        placeholder="Content author"
                        disabled={!isEditable("item_author")}
                      />
                    </div>
                    <div className="space-y-2">
                      <FieldLabel id="item_source" label="Source" columnName="item_source" />
                      <Input
                        id="item_source"
                        value={formData.item_source || ""}
                        onChange={(e) => handleInputChange("item_source", e.target.value)}
                        placeholder="Data source"
                        disabled={!isEditable("item_source")}
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <FieldLabel id="item_schema" label="Schema JSON" columnName="item_schema" />
                    <Textarea
                      id="item_schema"
                      value={formData.item_schema || ""}
                      onChange={(e) => handleInputChange("item_schema", e.target.value)}
                      placeholder='{"@type": "Drug", ...}'
                      className="font-mono text-sm"
                      rows={6}
                      disabled={!isEditable("item_schema")}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Status & Settings
                  </CardTitle>
                  <CardDescription>
                    Item status, flags, and internal settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <FieldLabel id="item_status" label="Active Status" columnName="item_status" />
                      <p className="text-sm text-muted-foreground">
                        Enable or disable this item
                      </p>
                    </div>
                    <Switch
                      checked={formData.item_status === 1}
                      onCheckedChange={(checked) => handleInputChange("item_status", checked ? 1 : 0)}
                      disabled={!isEditable("item_status")}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <FieldLabel id="item_rxreq" label="Prescription Required" columnName="item_rxreq" />
                      <p className="text-sm text-muted-foreground">
                        Requires a prescription to purchase
                      </p>
                    </div>
                    <Switch
                      checked={formData.item_rxreq === 1}
                      onCheckedChange={(checked) => handleInputChange("item_rxreq", checked ? 1 : 0)}
                      disabled={!isEditable("item_rxreq")}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <FieldLabel id="item_pggen" label="Page Generated" columnName="item_pggen" />
                      <p className="text-sm text-muted-foreground">
                        Has the page been generated?
                      </p>
                    </div>
                    <Switch
                      checked={formData.item_pggen === 1}
                      onCheckedChange={(checked) => handleInputChange("item_pggen", checked ? 1 : 0)}
                      disabled={!isEditable("item_pggen")}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <FieldLabel id="item_pgmap" label="Page Mapped" columnName="item_pgmap" />
                      <p className="text-sm text-muted-foreground">
                        Has the page been mapped?
                      </p>
                    </div>
                    <Switch
                      checked={formData.item_pgmap === 1}
                      onCheckedChange={(checked) => handleInputChange("item_pgmap", checked ? 1 : 0)}
                      disabled={!isEditable("item_pgmap")}
                    />
                  </div>

                  <Separator />

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <FieldLabel id="item_priority" label="Priority" columnName="item_priority" />
                      <Input
                        id="item_priority"
                        type="number"
                        value={formData.item_priority || 999}
                        onChange={(e) => handleInputChange("item_priority", parseInt(e.target.value) || 999)}
                        placeholder="999"
                        disabled={!isEditable("item_priority")}
                      />
                    </div>
                    <div className="space-y-2">
                      <FieldLabel id="item_set_id" label="Set ID" columnName="item_set_id" />
                      <Input
                        id="item_set_id"
                        type="number"
                        value={formData.item_set_id || 0}
                        onChange={(e) => handleInputChange("item_set_id", parseInt(e.target.value) || 0)}
                        placeholder="Set ID"
                        disabled={!isEditable("item_set_id")}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <FieldLabel id="item_dgline_id" label="Drug Line ID" columnName="item_dgline_id" />
                    <Input
                      id="item_dgline_id"
                      type="number"
                      value={formData.item_dgline_id || 0}
                      onChange={(e) => handleInputChange("item_dgline_id", parseInt(e.target.value) || 0)}
                      placeholder="Drug Line ID"
                      disabled={!isEditable("item_dgline_id")}
                    />
                  </div>

                  <Separator />

                  <div className="rounded-lg bg-muted p-4 space-y-2">
                    <h4 className="text-sm font-medium">Timestamps (Read-only)</h4>
                    <div className="grid gap-4 sm:grid-cols-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Created: </span>
                        <span className="font-mono">{formData.item_created}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Updated: </span>
                        <span className="font-mono">{formData.item_updated}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

        </div>
      </main>
    </div>
  )
}
