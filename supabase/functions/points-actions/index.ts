import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Escala de pontos para categorias de recompensas
const pointRanges = [
  { min: 0, max: 100, label: 'Iniciante', categories: ['ebook'], maxValue: 50 },
  { min: 101, max: 300, label: 'Avançado', categories: ['ebook', 'course'], maxValue: 150 },
  { min: 301, max: 600, label: 'Expert', categories: ['ebook', 'course', 'combo', 'premium'], maxValue: 300 },
  { min: 601, max: 1000, label: 'Master', categories: ['ebook', 'course', 'combo', 'premium', 'mentoring'], maxValue: 500 },
  { min: 1001, max: Infinity, label: 'Elite', categories: ['all'], maxValue: Infinity },
];

// Calcular tier baseado em pontos (requisitos mais rigorosos)
// Nota: O tier real é calculado pela função SQL calculate_affiliate_tier()
// que considera referrals, vendas E pontos. Esta função é apenas fallback.
function calculateTier(totalPoints: number): string {
  if (totalPoints >= 50000) return 'platinum';
  if (totalPoints >= 20000) return 'diamond';
  if (totalPoints >= 5000) return 'gold';
  if (totalPoints >= 1000) return 'silver';
  return 'bronze';
}

// Determinar faixa de pontos atual
function getPointRange(points: number) {
  return pointRanges.find(r => points >= r.min && points <= r.max) || pointRanges[0];
}

// Verificar se subiu de faixa
function checkRangeUpgrade(oldPoints: number, newPoints: number) {
  const oldRange = getPointRange(oldPoints);
  const newRange = getPointRange(newPoints);
  return oldRange.label !== newRange.label ? newRange : null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verificar autenticação
    const authHeader = req.headers.get('Authorization');
    console.log('[Points Actions] Auth header presente:', !!authHeader);
    
    if (!authHeader) {
      console.log('[Points Actions] Erro: Sem header de autorização');
      return new Response(
        JSON.stringify({ success: false, error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.log('[Points Actions] Erro de autenticação:', authError?.message);
      return new Response(
        JSON.stringify({ success: false, error: 'Token inválido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[Points Actions] Usuário autenticado:', user.id);

    let body;
    try {
      body = await req.json();
    } catch (e) {
      console.log('[Points Actions] Erro ao parsear JSON:', e);
      return new Response(
        JSON.stringify({ success: false, error: 'Corpo da requisição inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, ...params } = body;
    console.log('[Points Actions] Ação recebida:', action);

    if (!action) {
      console.log('[Points Actions] Erro: Nenhuma ação especificada');
      return new Response(
        JSON.stringify({ success: false, error: 'Ação não especificada' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    switch (action) {
      case 'get_balance': {
        // Buscar ou criar saldo de pontos
        let { data: points } = await supabase
          .from('user_points')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (!points) {
          const { data: newPoints, error } = await supabase
            .from('user_points')
            .insert({ user_id: user.id })
            .select()
            .single();

          if (error) throw error;
          points = newPoints;
        }

        // Buscar transações recentes
        const { data: transactions } = await supabase
          .from('point_transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);

        // Buscar badges
        const { data: badges } = await supabase
          .from('user_badges')
          .select('*')
          .eq('user_id', user.id);

        // Calcular faixa atual
        const currentRange = getPointRange(points.current_balance);

        return new Response(
          JSON.stringify({
            success: true,
            points,
            transactions,
            badges,
            point_range: currentRange,
            point_ranges: pointRanges,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_rewards': {
        // Buscar recompensas disponíveis
        const { data: userPoints } = await supabase
          .from('user_points')
          .select('current_balance, tier')
          .eq('user_id', user.id)
          .single();

        const userTier = userPoints?.tier || 'bronze';
        const userBalance = userPoints?.current_balance || 0;
        const tierOrder = ['bronze', 'silver', 'gold', 'diamond', 'platinum'];
        const userTierIndex = tierOrder.indexOf(userTier);
        const currentRange = getPointRange(userBalance);

        const { data: rewards } = await supabase
          .from('rewards')
          .select('*')
          .eq('is_active', true)
          .order('points_required', { ascending: true });

        // Filtrar por tier e adicionar status de disponibilidade
        const processedRewards = rewards?.map(r => {
          const rewardTierIndex = tierOrder.indexOf(r.tier_required || 'bronze');
          const canAfford = userBalance >= r.points_required;
          const hasTier = rewardTierIndex <= userTierIndex;
          const inStock = r.stock === null || r.stock > 0;
          
          return {
            ...r,
            can_redeem: canAfford && hasTier && inStock,
            reason: !canAfford ? 'insufficient_points' : !hasTier ? 'insufficient_tier' : !inStock ? 'out_of_stock' : null,
          };
        });

        return new Response(
          JSON.stringify({
            success: true,
            rewards: processedRewards,
            user_balance: userBalance,
            user_tier: userTier,
            point_range: currentRange,
            point_ranges: pointRanges,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'redeem_reward': {
        const { reward_id, payout_method, payout_details } = params;

        // Buscar recompensa
        const { data: reward } = await supabase
          .from('rewards')
          .select('*')
          .eq('id', reward_id)
          .eq('is_active', true)
          .single();

        if (!reward) {
          return new Response(
            JSON.stringify({ success: false, error: 'Recompensa não encontrada' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Verificar saldo
        const { data: userPoints } = await supabase
          .from('user_points')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (!userPoints || userPoints.current_balance < reward.points_required) {
          return new Response(
            JSON.stringify({ success: false, error: 'Pontos insuficientes' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Verificar estoque
        if (reward.stock !== null && reward.stock <= 0) {
          return new Response(
            JSON.stringify({ success: false, error: 'Recompensa esgotada' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Verificar tier
        const tierOrder = ['bronze', 'silver', 'gold', 'diamond', 'platinum'];
        if (tierOrder.indexOf(userPoints.tier) < tierOrder.indexOf(reward.tier_required || 'bronze')) {
          return new Response(
            JSON.stringify({ success: false, error: 'Tier insuficiente para esta recompensa' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Criar resgate
        const { data: redemption, error: redeemError } = await supabase
          .from('reward_redemptions')
          .insert({
            user_id: user.id,
            reward_id,
            points_spent: reward.points_required,
            payout_method: payout_method || reward.type,
            payout_details,
          })
          .select()
          .single();

        if (redeemError) throw redeemError;

        // Debitar pontos
        const oldBalance = userPoints.current_balance;
        const newBalance = userPoints.current_balance - reward.points_required;
        const newTotalSpent = (userPoints.total_spent || 0) + reward.points_required;

        await supabase
          .from('user_points')
          .update({
            current_balance: newBalance,
            total_spent: newTotalSpent,
            last_activity: new Date().toISOString(),
          })
          .eq('user_id', user.id);

        // Registrar transação
        await supabase
          .from('point_transactions')
          .insert({
            user_id: user.id,
            type: 'redeem',
            amount: -reward.points_required,
            balance_after: newBalance,
            description: `Resgate: ${reward.name}`,
            metadata: { reward_id, redemption_id: redemption.id },
          });

        // Registrar ação VIP
        await supabase
          .from('vip_affiliate_actions')
          .insert({
            user_id: user.id,
            action_type: 'redeem',
            points_earned: 0,
            description: `Resgatou: ${reward.name}`,
            metadata: { reward_id, points_spent: reward.points_required },
          });

        // Atualizar estoque
        if (reward.stock !== null) {
          await supabase
            .from('rewards')
            .update({ stock: reward.stock - 1 })
            .eq('id', reward_id);
        }

        // Enviar notificação de resgate
        await supabase
          .from('vip_notifications')
          .insert({
            user_id: user.id,
            type: 'reward',
            title: 'Resgate Realizado!',
            message: `Parabéns! Você trocou seus pontos por "${reward.name}".`,
            icon: 'gift',
            action_url: '/vip/panel/history',
            metadata: { reward_id, redemption_id: redemption.id },
          });

        // Verificar se desceu de faixa e notificar
        const oldRange = getPointRange(oldBalance);
        const newRange = getPointRange(newBalance);
        
        if (oldRange.label !== newRange.label && newRange.min < oldRange.min) {
          // Apenas informativo, não é um upgrade
          console.log(`[Points Actions] Usuário ${user.id} desceu de faixa: ${oldRange.label} -> ${newRange.label}`);
        }

        return new Response(
          JSON.stringify({
            success: true,
            redemption,
            new_balance: newBalance,
            reward_name: reward.name,
            point_range: newRange,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'check_range_upgrade': {
        // Verificar se usuário subiu de faixa (chamado após ganhar pontos)
        const { old_balance, new_balance } = params;
        
        const upgrade = checkRangeUpgrade(old_balance, new_balance);
        
        if (upgrade) {
          // Enviar notificação de nova faixa
          await supabase
            .from('vip_notifications')
            .insert({
              user_id: user.id,
              type: 'milestone',
              title: 'Nova Faixa Desbloqueada!',
              message: `Você desbloqueou novas recompensas na loja! Faixa: ${upgrade.label}`,
              icon: 'sparkles',
              action_url: '/vip/panel/store',
              metadata: { range: upgrade },
            });

          return new Response(
            JSON.stringify({
              success: true,
              upgraded: true,
              new_range: upgrade,
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({
            success: true,
            upgraded: false,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'admin_award_points': {
        // Verificar se é admin
        const { data: isAdmin } = await supabase.rpc('has_role', {
          _user_id: user.id,
          _role: 'admin',
        });

        if (!isAdmin) {
          return new Response(
            JSON.stringify({ success: false, error: 'Não autorizado' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { target_user_id, amount, type, description } = params;

        // Buscar ou criar saldo
        let { data: userPoints } = await supabase
          .from('user_points')
          .select('*')
          .eq('user_id', target_user_id)
          .single();

        if (!userPoints) {
          const { data: newPoints, error } = await supabase
            .from('user_points')
            .insert({ user_id: target_user_id })
            .select()
            .single();
          if (error) throw error;
          userPoints = newPoints;
        }

        const oldBalance = userPoints.current_balance;
        const newBalance = userPoints.current_balance + amount;
        const newTotalEarned = amount > 0 ? userPoints.total_earned + amount : userPoints.total_earned;

        // Atualizar saldo
        await supabase
          .from('user_points')
          .update({
            current_balance: newBalance,
            total_earned: newTotalEarned,
            tier: calculateTier(newTotalEarned),
            last_activity: new Date().toISOString(),
          })
          .eq('user_id', target_user_id);

        // Registrar transação
        await supabase
          .from('point_transactions')
          .insert({
            user_id: target_user_id,
            type: type || (amount > 0 ? 'bonus' : 'adjustment'),
            amount,
            balance_after: newBalance,
            description: description || 'Ajuste administrativo',
            metadata: { awarded_by: user.id },
          });

        // Verificar upgrade de faixa
        if (amount > 0) {
          const upgrade = checkRangeUpgrade(oldBalance, newBalance);
          if (upgrade) {
            await supabase
              .from('vip_notifications')
              .insert({
                user_id: target_user_id,
                type: 'milestone',
                title: 'Nova Faixa Desbloqueada!',
                message: `Você desbloqueou novas recompensas na loja! Faixa: ${upgrade.label}`,
                icon: 'sparkles',
                action_url: '/vip/panel/store',
                metadata: { range: upgrade },
              });
          }
        }

        return new Response(
          JSON.stringify({ success: true, new_balance: newBalance }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ success: false, error: 'Ação desconhecida' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error: any) {
    console.error('[Points Actions] Erro:', error);
    return new Response(
      JSON.stringify({ success: false, error: error?.message || 'Erro interno' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});