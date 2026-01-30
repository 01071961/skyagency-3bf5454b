/**
 * Configuração centralizada do sistema de Tiers de Afiliados SKY BRASIL
 * 
 * Critérios cumulativos para progressão:
 * - Indicações diretas
 * - Vendas de indicações (R$)
 * - Taxa de comissão
 * - Pontos mínimos
 */

export interface TierRequirements {
  minReferrals: number;
  minReferralSales: number;
  commissionRate: number;
  minPoints: number;
  maxPoints: number;
}

export interface TierConfig extends TierRequirements {
  key: string;
  label: string;
  labelPT: string;
  icon: string;
  emoji: string;
  color: string;
  gradient: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  mlmRates: number[];  // Taxas MLM por nível [L1, L2, L3, L4]
}

// Configuração completa dos tiers conforme especificação
export const TIER_CONFIG: Record<string, TierConfig> = {
  bronze: {
    key: 'bronze',
    label: 'Bronze',
    labelPT: 'Bronze',
    icon: '🥉',
    emoji: '🥉',
    color: 'from-amber-600 to-amber-800',
    gradient: 'from-amber-600 to-amber-800',
    bgColor: 'bg-amber-500/10',
    textColor: 'text-amber-600',
    borderColor: 'border-amber-500/30',
    minReferrals: 0,
    minReferralSales: 0,
    commissionRate: 10,
    minPoints: 0,
    maxPoints: 499,
    mlmRates: [5, 2, 1, 0.5],
  },
  silver: {
    key: 'silver',
    label: 'Silver',
    labelPT: 'Prata',
    icon: '🥈',
    emoji: '🥈',
    color: 'from-slate-400 to-slate-600',
    gradient: 'from-slate-400 to-slate-600',
    bgColor: 'bg-slate-500/10',
    textColor: 'text-slate-500',
    borderColor: 'border-slate-500/30',
    minReferrals: 5,
    minReferralSales: 500,
    commissionRate: 12,
    minPoints: 500,
    maxPoints: 1999,
    mlmRates: [5, 2, 1, 0.5],
  },
  gold: {
    key: 'gold',
    label: 'Gold',
    labelPT: 'Ouro',
    icon: '🥇',
    emoji: '🥇',
    color: 'from-yellow-400 to-amber-500',
    gradient: 'from-yellow-400 to-amber-500',
    bgColor: 'bg-yellow-500/10',
    textColor: 'text-yellow-600',
    borderColor: 'border-yellow-500/30',
    minReferrals: 15,
    minReferralSales: 2000,
    commissionRate: 15,
    minPoints: 2000,
    maxPoints: 4999,
    mlmRates: [5, 2, 1, 0.5],
  },
  platinum: {
    key: 'platinum',
    label: 'Platinum',
    labelPT: 'Platina',
    icon: '💠',
    emoji: '💠',
    color: 'from-purple-500 to-violet-600',
    gradient: 'from-purple-500 to-violet-600',
    bgColor: 'bg-purple-500/10',
    textColor: 'text-purple-500',
    borderColor: 'border-purple-500/30',
    minReferrals: 30,
    minReferralSales: 5000,
    commissionRate: 18,
    minPoints: 5000,
    maxPoints: 9999,
    mlmRates: [5, 2, 1, 0.5],
  },
  diamond: {
    key: 'diamond',
    label: 'Diamond',
    labelPT: 'Diamante',
    icon: '💎',
    emoji: '💎',
    color: 'from-cyan-400 to-blue-500',
    gradient: 'from-cyan-400 to-blue-500',
    bgColor: 'bg-cyan-500/10',
    textColor: 'text-cyan-500',
    borderColor: 'border-cyan-500/30',
    minReferrals: 50,
    minReferralSales: 10000,
    commissionRate: 20,
    minPoints: 10000,
    maxPoints: Infinity,
    mlmRates: [5, 2, 1, 0.5],
  },
};

// Ordem dos tiers para comparação
export const TIER_ORDER = ['bronze', 'silver', 'gold', 'platinum', 'diamond'] as const;
export type TierKey = typeof TIER_ORDER[number];

// Aliases em português
export const TIER_ALIASES: Record<string, TierKey> = {
  'bronze': 'bronze',
  'prata': 'silver',
  'silver': 'silver',
  'ouro': 'gold',
  'gold': 'gold',
  'platina': 'platinum',
  'platinum': 'platinum',
  'diamante': 'diamond',
  'diamond': 'diamond',
};

/**
 * Normaliza o nome do tier para o formato padrão (inglês)
 */
export function normalizeTier(tier: string | null | undefined): TierKey {
  if (!tier) return 'bronze';
  const lower = tier.toLowerCase();
  return TIER_ALIASES[lower] || 'bronze';
}

/**
 * Obtém a configuração de um tier
 */
export function getTierConfig(tier: string | null | undefined): TierConfig {
  const normalized = normalizeTier(tier);
  return TIER_CONFIG[normalized] || TIER_CONFIG.bronze;
}

/**
 * Obtém o índice/nível do tier (0-3)
 */
export function getTierLevel(tier: string | null | undefined): number {
  const normalized = normalizeTier(tier);
  const index = TIER_ORDER.indexOf(normalized);
  return index >= 0 ? index : 0;
}

/**
 * Verifica se o tier A é maior ou igual ao tier B
 */
export function isTierAtLeast(tierA: string | null | undefined, tierB: TierKey): boolean {
  return getTierLevel(tierA) >= getTierLevel(tierB);
}

/**
 * Calcula pontos baseado em vendas diretas e vendas de downline
 * Fórmula: 1 ponto por R$100 em vendas diretas + 0.5 pontos por R$100 em vendas downline
 */
export function calculatePoints(directSales: number, downlineSales: number): number {
  const directPoints = Math.floor(directSales / 100);
  const downlinePoints = Math.floor(downlineSales / 100) * 0.5;
  return directPoints + downlinePoints;
}

/**
 * Calcula o tier baseado em todos os critérios
 */
export function calculateTierFromCriteria(
  referrals: number,
  referralSales: number,
  totalPoints: number
): TierKey {
  // Percorre do maior para o menor
  for (let i = TIER_ORDER.length - 1; i >= 0; i--) {
    const tierKey = TIER_ORDER[i];
    const config = TIER_CONFIG[tierKey];
    
    // Verifica se atende TODOS os critérios
    if (
      referrals >= config.minReferrals &&
      referralSales >= config.minReferralSales &&
      totalPoints >= config.minPoints
    ) {
      return tierKey;
    }
  }
  
  return 'bronze';
}

/**
 * Calcula o progresso para o próximo tier
 */
export function calculateTierProgress(
  currentTier: TierKey,
  referrals: number,
  referralSales: number,
  totalPoints: number
): {
  nextTier: TierKey | null;
  referralsProgress: number;
  salesProgress: number;
  pointsProgress: number;
  overallProgress: number;
  referralsNeeded: number;
  salesNeeded: number;
  pointsNeeded: number;
} {
  const currentIndex = TIER_ORDER.indexOf(currentTier);
  
  if (currentIndex >= TIER_ORDER.length - 1) {
    return {
      nextTier: null,
      referralsProgress: 100,
      salesProgress: 100,
      pointsProgress: 100,
      overallProgress: 100,
      referralsNeeded: 0,
      salesNeeded: 0,
      pointsNeeded: 0,
    };
  }
  
  const nextTier = TIER_ORDER[currentIndex + 1];
  const nextConfig = TIER_CONFIG[nextTier];
  const currentConfig = TIER_CONFIG[currentTier];
  
  const referralsProgress = Math.min(100, (referrals / nextConfig.minReferrals) * 100);
  const salesProgress = Math.min(100, (referralSales / nextConfig.minReferralSales) * 100);
  const pointsProgress = Math.min(100, ((totalPoints - currentConfig.minPoints) / (nextConfig.minPoints - currentConfig.minPoints)) * 100);
  
  const overallProgress = (referralsProgress + salesProgress + pointsProgress) / 3;
  
  return {
    nextTier,
    referralsProgress,
    salesProgress,
    pointsProgress,
    overallProgress,
    referralsNeeded: Math.max(0, nextConfig.minReferrals - referrals),
    salesNeeded: Math.max(0, nextConfig.minReferralSales - referralSales),
    pointsNeeded: Math.max(0, nextConfig.minPoints - totalPoints),
  };
}

/**
 * Calcula o rollover de pontos para o próximo mês (50%)
 */
export function calculatePointsRollover(currentPoints: number): number {
  return Math.floor(currentPoints * 0.5);
}

/**
 * Formata valor em BRL
 */
export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}
