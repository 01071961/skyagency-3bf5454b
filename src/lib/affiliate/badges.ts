/**
 * Sistema de Badges e Gamificação SKY BRASIL
 * 
 * Badges são conquistados por milestones específicos:
 * - Indicações
 * - Vendas
 * - Tier alcançado
 * - Desafios completados
 */

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'referral' | 'sales' | 'tier' | 'challenge' | 'special';
  criteria: BadgeCriteria;
  points: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

export interface BadgeCriteria {
  type: 'referrals' | 'sales' | 'tier' | 'streak' | 'challenge' | 'manual';
  value: number | string;
}

// Configuração de badges predefinidos
export const BADGE_CONFIG: Badge[] = [
  // Badges de Indicação
  {
    id: 'first_referral',
    name: 'Primeiro Passo',
    description: 'Fez sua primeira indicação',
    icon: '🌱',
    category: 'referral',
    criteria: { type: 'referrals', value: 1 },
    points: 50,
    rarity: 'common',
  },
  {
    id: 'referral_5',
    name: 'Recrutador Iniciante',
    description: 'Alcançou 5 indicações',
    icon: '👥',
    category: 'referral',
    criteria: { type: 'referrals', value: 5 },
    points: 100,
    rarity: 'uncommon',
  },
  {
    id: 'referral_10',
    name: 'Recrutador Mestre',
    description: 'Alcançou 10 indicações ativas',
    icon: '🎯',
    category: 'referral',
    criteria: { type: 'referrals', value: 10 },
    points: 200,
    rarity: 'rare',
  },
  {
    id: 'referral_25',
    name: 'Líder de Equipe',
    description: 'Alcançou 25 indicações',
    icon: '🏆',
    category: 'referral',
    criteria: { type: 'referrals', value: 25 },
    points: 500,
    rarity: 'epic',
  },
  {
    id: 'referral_50',
    name: 'Mestre da Rede',
    description: 'Alcançou 50 indicações',
    icon: '👑',
    category: 'referral',
    criteria: { type: 'referrals', value: 50 },
    points: 1000,
    rarity: 'legendary',
  },
  
  // Badges de Vendas
  {
    id: 'first_sale',
    name: 'Primeira Venda',
    description: 'Realizou sua primeira venda',
    icon: '💰',
    category: 'sales',
    criteria: { type: 'sales', value: 1 },
    points: 100,
    rarity: 'common',
  },
  {
    id: 'sales_1k',
    name: 'Vendedor Bronze',
    description: 'Alcançou R$ 1.000 em vendas',
    icon: '📈',
    category: 'sales',
    criteria: { type: 'sales', value: 1000 },
    points: 200,
    rarity: 'uncommon',
  },
  {
    id: 'sales_5k',
    name: 'Vendedor Prata',
    description: 'Alcançou R$ 5.000 em vendas',
    icon: '🚀',
    category: 'sales',
    criteria: { type: 'sales', value: 5000 },
    points: 500,
    rarity: 'rare',
  },
  {
    id: 'sales_10k',
    name: 'Vendedor Ouro',
    description: 'Alcançou R$ 10.000 em vendas',
    icon: '💎',
    category: 'sales',
    criteria: { type: 'sales', value: 10000 },
    points: 1000,
    rarity: 'epic',
  },
  {
    id: 'sales_50k',
    name: 'Top Seller',
    description: 'Alcançou R$ 50.000 em vendas',
    icon: '⭐',
    category: 'sales',
    criteria: { type: 'sales', value: 50000 },
    points: 2500,
    rarity: 'legendary',
  },
  
  // Badges de Tier
  {
    id: 'tier_silver',
    name: 'Prata Alcançado',
    description: 'Conquistou o tier Prata',
    icon: '🥈',
    category: 'tier',
    criteria: { type: 'tier', value: 'silver' },
    points: 250,
    rarity: 'uncommon',
  },
  {
    id: 'tier_gold',
    name: 'Ouro Alcançado',
    description: 'Conquistou o tier Ouro',
    icon: '🥇',
    category: 'tier',
    criteria: { type: 'tier', value: 'gold' },
    points: 500,
    rarity: 'rare',
  },
  {
    id: 'tier_diamond',
    name: 'Diamante Alcançado',
    description: 'Conquistou o tier Diamante',
    icon: '💎',
    category: 'tier',
    criteria: { type: 'tier', value: 'diamond' },
    points: 1500,
    rarity: 'legendary',
  },
  
  // Badges de Desafio
  {
    id: 'streak_7',
    name: 'Consistente',
    description: '7 dias consecutivos com atividade',
    icon: '🔥',
    category: 'challenge',
    criteria: { type: 'streak', value: 7 },
    points: 100,
    rarity: 'uncommon',
  },
  {
    id: 'streak_30',
    name: 'Dedicado',
    description: '30 dias consecutivos com atividade',
    icon: '🌟',
    category: 'challenge',
    criteria: { type: 'streak', value: 30 },
    points: 500,
    rarity: 'rare',
  },
  {
    id: 'academy_complete',
    name: 'Graduado SKY',
    description: 'Completou a Academy SKY',
    icon: '🎓',
    category: 'challenge',
    criteria: { type: 'challenge', value: 'academy' },
    points: 750,
    rarity: 'epic',
  },
  
  // Badges Especiais
  {
    id: 'early_adopter',
    name: 'Early Adopter',
    description: 'Um dos primeiros 100 afiliados',
    icon: '🌅',
    category: 'special',
    criteria: { type: 'manual', value: 'early_adopter' },
    points: 500,
    rarity: 'legendary',
  },
  {
    id: 'partner_razer',
    name: 'Parceiro Razer',
    description: 'Top 10 do leaderboard mensal',
    icon: '🐍',
    category: 'special',
    criteria: { type: 'manual', value: 'partner_razer' },
    points: 1000,
    rarity: 'legendary',
  },
];

// Milestones para o simulador de ganhos
export const EARNING_MILESTONES = [
  { name: 'Iniciante', sales: 5, icon: '🎯' },
  { name: 'Bronze', sales: 15, icon: '🥉' },
  { name: 'Prata', sales: 30, icon: '🥈' },
  { name: 'Ouro', sales: 50, icon: '🥇' },
  { name: 'Diamante', sales: 100, icon: '💎' },
];

// Desafios ativos
export interface Challenge {
  id: string;
  name: string;
  description: string;
  type: 'daily' | 'weekly' | 'monthly' | 'special';
  icon: string;
  requirements: {
    type: 'referrals' | 'sales' | 'engagement' | 'course';
    target: number;
  };
  reward: {
    points: number;
    badge?: string;
    other?: string;
  };
  startDate: string;
  endDate: string;
}

export const DEFAULT_CHALLENGES: Challenge[] = [
  {
    id: 'daily_referral',
    name: 'Indicação Diária',
    description: 'Faça 1 indicação hoje',
    type: 'daily',
    icon: '📅',
    requirements: { type: 'referrals', target: 1 },
    reward: { points: 25 },
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'weekly_3_referrals',
    name: 'Trio de Indicações',
    description: 'Faça 3 indicações esta semana para +100 pts bônus',
    type: 'weekly',
    icon: '📊',
    requirements: { type: 'referrals', target: 3 },
    reward: { points: 100 },
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'weekly_sale_1k',
    name: 'Vendedor da Semana',
    description: 'Venda R$ 1.000 em live para badge exclusivo',
    type: 'weekly',
    icon: '🏅',
    requirements: { type: 'sales', target: 1000 },
    reward: { points: 200, badge: 'weekly_seller' },
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'monthly_top10',
    name: 'Top 10 Mensal',
    description: 'Fique entre os 10 melhores do mês',
    type: 'monthly',
    icon: '🏆',
    requirements: { type: 'sales', target: 0 }, // Calculado pelo ranking
    reward: { points: 500, badge: 'monthly_top10', other: 'Parceria Razer' },
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

/**
 * Verifica se um badge foi conquistado com base nos critérios
 */
export function checkBadgeEarned(
  badge: Badge,
  stats: {
    referrals: number;
    totalSales: number;
    currentTier: string;
    streak: number;
    completedChallenges: string[];
  }
): boolean {
  const { criteria } = badge;
  
  switch (criteria.type) {
    case 'referrals':
      return stats.referrals >= (criteria.value as number);
    case 'sales':
      return stats.totalSales >= (criteria.value as number);
    case 'tier':
      return stats.currentTier === criteria.value;
    case 'streak':
      return stats.streak >= (criteria.value as number);
    case 'challenge':
      return stats.completedChallenges.includes(criteria.value as string);
    case 'manual':
      return false; // Badges manuais são atribuídos pelo admin
    default:
      return false;
  }
}

/**
 * Obtém a cor de raridade do badge
 */
export function getRarityColor(rarity: Badge['rarity']): string {
  const colors = {
    common: 'from-gray-400 to-gray-600',
    uncommon: 'from-green-400 to-green-600',
    rare: 'from-blue-400 to-blue-600',
    epic: 'from-purple-400 to-purple-600',
    legendary: 'from-yellow-400 to-orange-500',
  };
  return colors[rarity] || colors.common;
}

/**
 * Obtém o label de raridade em português
 */
export function getRarityLabel(rarity: Badge['rarity']): string {
  const labels = {
    common: 'Comum',
    uncommon: 'Incomum',
    rare: 'Raro',
    epic: 'Épico',
    legendary: 'Lendário',
  };
  return labels[rarity] || 'Comum';
}
