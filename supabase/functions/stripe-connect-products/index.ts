/**
 * Stripe Connect Products Edge Function
 * 
 * This function manages products on connected accounts using the
 * Stripe-Account header for authentication. Products created here
 * belong to the connected account, not the platform.
 * 
 * Supports:
 * - POST: Create a new product with a default price
 * - GET: List all products for a connected account
 * 
 * API Version: 2025-12-15.clover
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured.");
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2025-12-15.clover",
    });

    const body = await req.json();
    const { action, accountId } = body;

    if (!accountId) {
      throw new Error("accountId is required to manage connected account products");
    }

    console.log(`[STRIPE-PRODUCTS] Action: ${action}, Account: ${accountId}`);

    // Handle different actions
    if (action === "create") {
      return handleCreateProduct(stripe, body, corsHeaders);
    } else if (action === "list") {
      return handleListProducts(stripe, accountId, corsHeaders);
    } else {
      throw new Error(`Unknown action: ${action}. Use 'create' or 'list'.`);
    }
  } catch (error) {
    console.error("[STRIPE-PRODUCTS] Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Product operation failed"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

/**
 * Create a product with a default price on a connected account
 * 
 * This uses the stripeAccount option to specify which connected account
 * should own the product. The product will appear in the connected
 * account's Stripe dashboard, not the platform's.
 */
async function handleCreateProduct(
  stripe: Stripe,
  body: {
    accountId: string;
    name: string;
    description?: string;
    priceInCents: number;
    currency?: string;
    imageUrl?: string;
  },
  corsHeaders: Record<string, string>
) {
  const { accountId, name, description, priceInCents, currency = "brl", imageUrl } = body;

  if (!name) {
    throw new Error("Product name is required");
  }
  if (!priceInCents || priceInCents <= 0) {
    throw new Error("Price in cents must be a positive number");
  }

  console.log("[STRIPE-PRODUCTS] Creating product:", { name, priceInCents, currency });

  /**
   * Create a product with embedded default price
   * 
   * The stripeAccount option in the second parameter tells Stripe
   * to create this product on the connected account instead of
   * the platform account.
   * 
   * This is equivalent to setting the Stripe-Account header in raw API calls.
   */
  const product = await stripe.products.create(
    {
      name: name,
      description: description || undefined,
      // Embed price data to create product and price in one call
      default_price_data: {
        unit_amount: priceInCents,
        currency: currency,
      },
      // Optional: Add product images
      images: imageUrl ? [imageUrl] : undefined,
    },
    {
      // IMPORTANT: This specifies the connected account
      // Without this, the product would be created on the platform account
      stripeAccount: accountId,
    }
  );

  console.log("[STRIPE-PRODUCTS] Product created:", product.id);

  return new Response(
    JSON.stringify({
      success: true,
      product: {
        id: product.id,
        name: product.name,
        description: product.description,
        default_price: product.default_price,
        images: product.images,
        active: product.active,
      }
    }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    }
  );
}

/**
 * List all products for a connected account
 * 
 * Uses the stripeAccount option to fetch products owned by the
 * connected account.
 */
async function handleListProducts(
  stripe: Stripe,
  accountId: string,
  corsHeaders: Record<string, string>
) {
  console.log("[STRIPE-PRODUCTS] Listing products for account:", accountId);

  /**
   * List products on the connected account
   * 
   * The stripeAccount option ensures we only get products
   * that belong to this specific connected account.
   */
  const products = await stripe.products.list(
    {
      limit: 100, // Adjust as needed
      active: true, // Only get active products
      expand: ["data.default_price"], // Include price information
    },
    {
      stripeAccount: accountId,
    }
  );

  console.log("[STRIPE-PRODUCTS] Found products:", products.data.length);

  return new Response(
    JSON.stringify({
      success: true,
      products: products.data.map((product: Stripe.Product) => ({
        id: product.id,
        name: product.name,
        description: product.description,
        images: product.images,
        active: product.active,
        default_price: product.default_price,
      })),
    }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    }
  );
}
