/**
 * Storefront Page - Public Store for Connected Accounts
 * 
 * This page displays products from a specific connected account
 * and allows customers to purchase them.
 * 
 * URL Pattern: /store/:accountId
 * 
 * NOTE: In production, you should NOT use the Stripe account ID directly
 * in the URL. Instead, use your own identifier (like a username or store slug)
 * and map it to the Stripe account ID in your database.
 * 
 * Example production URL: /store/my-awesome-store
 * Then lookup: SELECT stripe_account_id FROM stores WHERE slug = 'my-awesome-store'
 */

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, ShoppingCart, Store, CheckCircle, Package } from "lucide-react";

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

export default function Storefront() {
  // Get account ID from URL parameter
  // TODO: In production, use your own identifier and map to Stripe account ID
  const { accountId } = useParams<{ accountId: string }>();
  const [searchParams] = useSearchParams();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [purchasingProductId, setPurchasingProductId] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Check for success/cancel parameters
  useEffect(() => {
    if (searchParams.get("success") === "true") {
      setShowSuccess(true);
      toast.success("Payment successful! Thank you for your purchase.");
    } else if (searchParams.get("canceled") === "true") {
      toast.info("Payment was canceled.");
    }
  }, [searchParams]);

  // Fetch products on mount
  useEffect(() => {
    if (accountId) {
      fetchProducts();
    }
  }, [accountId]);

  /**
   * Fetch products for the connected account
   */
  const fetchProducts = async () => {
    if (!accountId) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("stripe-connect-products", {
        body: {
          action: "list",
          accountId,
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      setProducts(data.products);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to load products");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle product purchase
   * Creates a Checkout Session and redirects to Stripe
   */
  const handlePurchase = async (product: Product) => {
    if (!accountId) return;

    const price = product.default_price as PriceData;
    if (!price || typeof price === "string") {
      toast.error("Product price not available");
      return;
    }

    setPurchasingProductId(product.id);
    try {
      const { data, error } = await supabase.functions.invoke("stripe-connect-checkout", {
        body: {
          accountId,
          priceId: price.id,
          productName: product.name,
          priceInCents: price.unit_amount,
          quantity: 1,
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (error) {
      console.error("Error creating checkout:", error);
      toast.error(error instanceof Error ? error.message : "Failed to start checkout");
      setPurchasingProductId(null);
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

  // Success state
  if (showSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md text-center">
          <CardContent className="pt-8">
            <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
            <h1 className="text-2xl font-bold mb-2">Payment Successful!</h1>
            <p className="text-muted-foreground mb-6">
              Thank you for your purchase. You will receive a confirmation email shortly.
            </p>
            <Button onClick={() => setShowSuccess(false)}>
              Continue Shopping
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // No account ID provided
  if (!accountId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Store className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Store Not Found</h1>
          <p className="text-muted-foreground">
            Please provide a valid store ID in the URL.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <Store className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Store</h1>
              {/* 
                TODO: In production, display the actual store name here
                This should come from your database, not the Stripe account ID
              */}
              <p className="text-sm text-muted-foreground">
                Browse our products
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Info Banner */}
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-8">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Note:</strong> This is a demo storefront. In production, you should use your own 
            store identifier instead of the Stripe account ID in the URL.
          </p>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : products.length === 0 ? (
          /* Empty State */
          <div className="text-center py-12">
            <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-medium mb-2">No Products Available</h2>
            <p className="text-muted-foreground">
              This store doesn't have any products yet.
            </p>
          </div>
        ) : (
          /* Products Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <Card key={product.id} className="flex flex-col">
                {/* Product Image */}
                {product.images.length > 0 ? (
                  <div className="aspect-video bg-muted">
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover rounded-t-lg"
                    />
                  </div>
                ) : (
                  <div className="aspect-video bg-muted flex items-center justify-center">
                    <Package className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                
                <CardHeader className="flex-1">
                  <CardTitle>{product.name}</CardTitle>
                  {product.description && (
                    <CardDescription className="line-clamp-3">
                      {product.description}
                    </CardDescription>
                  )}
                </CardHeader>
                
                <CardContent>
                  <div className="text-3xl font-bold text-primary">
                    {formatPrice(product.default_price as PriceData)}
                  </div>
                </CardContent>
                
                <CardFooter>
                  <Button
                    className="w-full"
                    onClick={() => handlePurchase(product)}
                    disabled={purchasingProductId === product.id}
                  >
                    {purchasingProductId === product.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Buy Now
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t mt-auto">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>
            Payments are processed securely by{" "}
            <a
              href="https://stripe.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Stripe
            </a>
          </p>
          <p className="mt-1 text-xs">
            Platform fee: 10% per transaction
          </p>
        </div>
      </footer>
    </div>
  );
}
