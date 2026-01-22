/**
 * Product utility functions for SKY BRASIL
 * v4.0.0 - Updated with VIP tier-based access control
 */

// VIP tier hierarchy (lower index = lower tier)
export const VIP_TIER_ORDER = ['bronze', 'silver', 'gold', 'diamond', 'platinum'] as const;
export type VipTier = typeof VIP_TIER_ORDER[number];

export const VIP_TIER_INFO: Record<VipTier, { label: string; icon: string; minPoints: number }> = {
  bronze: { label: 'Bronze', icon: '🥉', minPoints: 0 },
  silver: { label: 'Prata', icon: '🥈', minPoints: 500 },
  gold: { label: 'Ouro', icon: '🥇', minPoints: 2000 },
  diamond: { label: 'Diamante', icon: '💎', minPoints: 5000 },
  platinum: { label: 'Platina', icon: '👑', minPoints: 10000 },
};

export interface ProductPriceInfo {
  display: string;
  color: string;
  badge?: string;
  badgeColor?: string;
  isAffiliateFree?: boolean;
  isFree?: boolean;
  regularPrice?: string;
  allowedTiers?: string[];
}

export interface ProductForPricing {
  price: number;
  original_price?: number | null;
  affiliate_free?: boolean;
  affiliate_free_tiers?: string[];
  pricing_type?: 'one_time' | 'subscription' | 'free';
}

/**
 * Check if a VIP tier has access to a product based on allowed tiers
 */
export function tierHasAccess(userTier: string | null, allowedTiers: string[] | null): boolean {
  if (!userTier || !allowedTiers || allowedTiers.length === 0) return false;
  return allowedTiers.includes(userTier);
}

/**
 * Format product price with proper handling for:
 * - affiliate_free products with tier-based access
 * - free products (price = 0)
 * - regular paid products
 */
export function formatProductPrice(
  product: ProductForPricing, 
  isVipAffiliate: boolean = false,
  userTier: string | null = null
): ProductPriceInfo {
  // Regular free product (price = 0 or pricing_type = 'free')
  if (product.price === 0 || product.pricing_type === 'free') {
    return {
      display: 'GRÁTIS',
      color: 'text-green-500',
      isFree: true,
    };
  }

  const allowedTiers = product.affiliate_free_tiers || [];
  const hasTierAccess = isVipAffiliate && tierHasAccess(userTier, allowedTiers);

  // Affiliate Free - VIP has tier access
  if (product.affiliate_free && hasTierAccess) {
    const regularPriceFormatted = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(product.price);

    const tierInfo = userTier ? VIP_TIER_INFO[userTier as VipTier] : null;

    return {
      display: 'GRÁTIS PARA VOCÊ',
      color: 'text-green-500',
      badge: `Benefício ${tierInfo?.label || 'VIP'}`,
      badgeColor: 'bg-primary/10 text-primary border-primary/30',
      isAffiliateFree: true,
      isFree: true,
      regularPrice: regularPriceFormatted,
      allowedTiers,
    };
  }

  // Paid product - format in BRL
  const formatted = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(product.price);

  // If product is affiliate_free but user doesn't have tier access, show badge with allowed tiers
  if (product.affiliate_free && allowedTiers.length > 0) {
    const tierLabels = allowedTiers
      .map(t => VIP_TIER_INFO[t as VipTier]?.label)
      .filter(Boolean)
      .join(', ');

    return {
      display: formatted,
      color: 'text-primary',
      badge: `Grátis: ${tierLabels}`,
      badgeColor: 'bg-green-500/10 text-green-600 border-green-500/30',
      isFree: false,
      isAffiliateFree: true,
      allowedTiers,
    };
  }

  return {
    display: formatted,
    color: 'text-primary',
    isFree: false,
  };
}

/**
 * Format price as currency (simple helper)
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(price);
}

/**
 * Calculate commission amount
 */
export function calculateCommission(
  price: number,
  commissionRate: number,
  affiliateFree?: boolean
): number {
  // Affiliate-free products don't generate commissions when affiliate accesses
  // But regular customer sales still generate commissions
  if (price === 0) return 0;
  return price * (commissionRate / 100);
}

/**
 * Check if user can access product for free (VIP affiliate benefit with tier check)
 */
export function canAccessAffiliateFreeProduct(
  product: ProductForPricing,
  isVipAffiliate: boolean,
  userTier: string | null = null
): boolean {
  if (!product.affiliate_free) return false;
  if (!isVipAffiliate) return false;
  
  // If no specific tiers set, all VIP affiliates get access
  const allowedTiers = product.affiliate_free_tiers || [];
  if (allowedTiers.length === 0) return true;
  
  // Check if user's tier is in the allowed list
  return tierHasAccess(userTier, allowedTiers);
}

/**
 * Get CTA text for product based on type and user status
 */
export function getProductCTA(
  product: ProductForPricing,
  isVipAffiliate: boolean,
  isOwned: boolean,
  userTier: string | null = null
): { text: string; disabled: boolean; reason?: string } {
  if (isOwned) {
    return { text: 'Acessar Conteúdo', disabled: false };
  }

  // VIP affiliate gets free access based on tier
  if (canAccessAffiliateFreeProduct(product, isVipAffiliate, userTier)) {
    const tierInfo = userTier ? VIP_TIER_INFO[userTier as VipTier] : null;
    return { 
      text: `Acessar Grátis ${tierInfo?.icon || '✨'}`, 
      disabled: false 
    };
  }

  // Regular free product
  if (product.price === 0 || product.pricing_type === 'free') {
    return { text: 'Acessar Gratuitamente', disabled: false };
  }

  // Paid product (including affiliate_free for non-eligible users)
  return { text: 'COMPRAR AGORA', disabled: false };
}
