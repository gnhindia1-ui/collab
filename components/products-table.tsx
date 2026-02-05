"use client"

import * as React from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ChevronLeft, ChevronRight, Loader2, RefreshCcw, Search, Edit } from "lucide-react"
import { useRouter } from "next/navigation"

interface Product {
    item_id: number
    item_serial: string
    item_name: string
    item_sku: string
    item_drug: string
    item_brand: string
    item_manufacturer: string
    item_status: number
}

interface Metadata {
    total: number
    page: number
    limit: number
    totalPages: number
}

export function ProductsTable() {
    const router = useRouter()
    const [products, setProducts] = React.useState<Product[]>([])
    const [metadata, setMetadata] = React.useState<Metadata>({
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
    })
    const [isLoading, setIsLoading] = React.useState(true)
    const [searchQuery, setSearchQuery] = React.useState("")
    const [debouncedSearch, setDebouncedSearch] = React.useState("")

    // Debounce search query
    React.useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery)
            setMetadata(prev => ({ ...prev, page: 1 })) // Reset to page 1 on search
        }, 500) // 500ms debounce

        return () => clearTimeout(timer)
    }, [searchQuery])

    const fetchProducts = React.useCallback(async (page: number, limit: number, search: string) => {
        setIsLoading(true)
        try {
            const queryParams = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                search: search
            })
            const response = await fetch(`/api/products?${queryParams}`)
            if (!response.ok) throw new Error("Failed to fetch products")
            const data = await response.json()
            setProducts(data.products)
            setMetadata(data.metadata)
        } catch (error) {
            console.error("Error fetching products:", error)
        } finally {
            setIsLoading(false)
        }
    }, [])

    React.useEffect(() => {
        fetchProducts(metadata.page, metadata.limit, debouncedSearch)
    }, [fetchProducts, metadata.page, metadata.limit, debouncedSearch])

    const handlePageChange = (newPage: number) => {
        setMetadata((prev) => ({ ...prev, page: newPage }))
    }

    const handleLimitChange = (value: string) => {
        setMetadata((prev) => ({ ...prev, limit: parseInt(value), page: 1 }))
    }

    const handleEdit = (itemId: number) => {
        router.push(`/dashboard/edit/${itemId}`)
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <h2 className="text-xl font-semibold tracking-tight">Products Database</h2>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative w-full sm:w-[300px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by Name, SKU, Drug..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 h-9"
                        />
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Select
                        value={metadata.limit.toString()}
                        onValueChange={handleLimitChange}
                    >
                        <SelectTrigger className="w-[130px] h-9">
                            <SelectValue placeholder="Limit" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="10">10 / page</SelectItem>
                            <SelectItem value="50">50 / page</SelectItem>
                            <SelectItem value="100">100 / page</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9"
                        onClick={() => fetchProducts(metadata.page, metadata.limit, debouncedSearch)}
                        disabled={isLoading}
                    >
                        <RefreshCcw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                    </Button>
                </div>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[80px]">ID</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>SKU</TableHead>
                            <TableHead>Drug Name</TableHead>
                            <TableHead>Brand</TableHead>
                            <TableHead>Manufacturer</TableHead>
                            <TableHead className="w-[100px]">Status</TableHead>
                            <TableHead className="w-[100px]">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={8} className="h-24 text-center">
                                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Loading products...
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : products.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="h-24 text-center">
                                    No products found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            products.map((product) => (
                                <TableRow key={product.item_id}>
                                    <TableCell className="font-mono text-xs">{product.item_id}</TableCell>
                                    <TableCell className="font-medium">{product.item_name}</TableCell>
                                    <TableCell className="font-mono text-xs">{product.item_sku || "-"}</TableCell>
                                    <TableCell>{product.item_drug || "-"}</TableCell>
                                    <TableCell>{product.item_brand || "-"}</TableCell>
                                    <TableCell>{product.item_manufacturer || "-"}</TableCell>
                                    <TableCell>
                                        <Badge variant={product.item_status === 1 ? "default" : "secondary"}>
                                            {product.item_status === 1 ? "Active" : "Inactive"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleEdit(product.item_id)}
                                            className="h-8 px-2 lg:px-3"
                                        >
                                            <Edit className="h-3.5 w-3.5 mr-1" />
                                            Edit
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                    Showing <span className="font-medium">{products.length}</span> of{" "}
                    <span className="font-medium">{metadata.total}</span> results
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(metadata.page - 1)}
                        disabled={metadata.page === 1 || isLoading}
                    >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Previous
                    </Button>
                    <div className="text-sm font-medium">
                        Page {metadata.page} of {metadata.totalPages || 1}
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(metadata.page + 1)}
                        disabled={metadata.page >= metadata.totalPages || isLoading}
                    >
                        Next
                        <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                </div>
            </div>
        </div>
    )
}
