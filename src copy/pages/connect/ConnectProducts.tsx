/**
 * Stripe Connect Products Management Page
 * 
 * This page allows connected account owners to:
 * 1. View their existing products
 * 2. Create new products with prices
 * 
 * All products are created on the connected account using the
 * Stripe-Account header, so they appear in the connected account's
 * Stripe Dashboard.
 */

import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Plus, Store, ExternalLink, Package, RefreshCw } from "lucide-react";

interface PriceData {
  id: string;
  unit_amount: number | null;
  currency: string;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  images: string[];
  active: boolean;
  default_price: PriceData | string | null;
}

export default function ConnectProducts() {
  const [searchParams] = useSearchParams();
  const [accountId, setAccountId] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form state for new product
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    price: "",
  });

  useEffect(() => {
    // Get account ID from URL or localStorage
    const accountFromUrl = searchParams.get("account");
    const savedAccountId = localStorage.getItem("stripe_connected_account_id");
    
    const id = accountFromUrl || savedAccountId;
    if (id) {
      setAccountId(id);
      fetchProducts(id);
    } else {
      setIsLoading(false);
    }
  }, [searchParams]);

  /**
   * Fetch products for the connected account
   */
  const fetchProducts = async (id: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("stripe-connect-products", {
        body: {
          action: "list",
          accountId: id,
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      setProducts(data.products);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to fetch products");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Create a new product
   */
  const handleCreateProduct = async () => {
    if (!accountId) return;
    if (!newProduct.name || !newProduct.price) {
      toast.error("Please fill in product name and price");
      return;
    }

    const priceValue = parseFloat(newProduct.price);
    if (isNaN(priceValue) || priceValue <= 0) {
      toast.error("Please enter a valid price");
      return;
    }

    setIsCreating(true);
    try {
      // Convert price to cents (Stripe uses smallest currency unit)
      const priceInCents = Math.round(priceValue * 100);

      const { data, error } = await supabase.functions.invoke("stripe-connect-products", {
        body: {
          action: "create",
          accountId,
          name: newProduct.name,
          description: newProduct.description || undefined,
          priceInCents,
          currency: "brl",
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      toast.success("Product created successfully!");
      setIsDialogOpen(false);
      setNewProduct({ name: "", description: "", price: "" });
      
      // Refresh products list
      await fetchProducts(accountId);
    } catch (error) {
      console.error("Error creating product:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create product");
    } finally {
      setIsCreating(false);
    }
  };

  /**
   * Format price for display
   */
  const formatPrice = (price: PriceData | string | null): string => {
    if (!price || typeof price === "string") return "N/A";
    if (price.unit_amount === null) return "N/A";
    
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: price.currency.toUpperCase(),
    }).format(price.unit_amount / 100);
  };

  // No account connected
  if (!accountId && !isLoading) {
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="container max-w-2xl mx-auto px-4 text-center">
          <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">No Account Connected</h1>
          <p className="text-muted-foreground mb-6">
            You need to create a connected account first to manage products.
          </p>
          <Button asChild>
            <Link to="/connect/onboarding">Create Account</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Products</h1>
            <p className="text-muted-foreground mt-1">
              Manage your store's products
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" asChild>
              <Link to={`/store/${accountId}`}>
                <Store className="mr-2 h-4 w-4" />
                View Store
              </Link>
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Product
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Product</DialogTitle>
                  <DialogDescription>
                    Add a new product to your store. It will be created on your connected Stripe account.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="productName">Product Name *</Label>
                    <Input
                      id="productName"
                      placeholder="e.g., Premium Course"
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="productDescription">Description</Label>
                    <Textarea
                      id="productDescription"
                      placeholder="Describe your product..."
                      value={newProduct.description}
                      onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="productPrice">Price (BRL) *</Label>
                    <Input
                      id="productPrice"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="99.90"
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    />
                  </div>
                  <Button
                    className="w-full"
                    onClick={handleCreateProduct}
                    disabled={isCreating}
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Product"
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Account Info */}
        <div className="bg-muted/50 rounded-lg p-4 mb-6 flex items-center justify-between">
          <div>
            <span className="text-sm text-muted-foreground">Connected Account:</span>
            <code className="ml-2 text-xs bg-background px-2 py-1 rounded">{accountId}</code>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => accountId && fetchProducts(accountId)}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : products.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Products Yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first product to start selling
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Product
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <Card key={product.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{product.name}</CardTitle>
                  {product.description && (
                    <CardDescription className="line-clamp-2">
                      {product.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    {formatPrice(product.default_price as PriceData)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    ID: {product.id}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" size="sm" asChild className="w-full">
                    <a
                      href={`https://dashboard.stripe.com/connect/accounts/${accountId}/products/${product.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View in Stripe
                      <ExternalLink className="ml-2 h-3 w-3" />
                    </a>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 pt-8 border-t flex justify-between">
          <Button variant="outline" asChild>
            <Link to="/connect/onboarding">
              ← Back to Account
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
