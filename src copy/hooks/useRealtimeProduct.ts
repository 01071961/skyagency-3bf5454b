import { useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UseRealtimeProductOptions {
  productId?: string;
  enabled?: boolean;
  onProductChange?: (payload: any) => void;
  onModuleChange?: (payload: any) => void;
  onLessonChange?: (payload: any) => void;
  showNotifications?: boolean;
}

export function useRealtimeProduct({
  productId,
  enabled = true,
  onProductChange,
  onModuleChange,
  onLessonChange,
  showNotifications = false,
}: UseRealtimeProductOptions) {
  const queryClient = useQueryClient();
  const channelsRef = useRef<ReturnType<typeof supabase.channel>[]>([]);

  const invalidateProductQueries = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['product-wizard', productId] });
    queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    queryClient.invalidateQueries({ queryKey: ['product-stats'] });
  }, [queryClient, productId]);

  const invalidateModuleQueries = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['course-modules', productId] });
  }, [queryClient, productId]);

  useEffect(() => {
    if (!enabled || !productId) return;

    console.log('[Realtime] Setting up channels for product:', productId);

    // Channel for product changes
    const productChannel = supabase
      .channel(`product-${productId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products',
          filter: `id=eq.${productId}`,
        },
        (payload) => {
          console.log('[Realtime] Product change:', payload.eventType);
          onProductChange?.(payload);
          invalidateProductQueries();
          
          if (showNotifications && payload.eventType === 'UPDATE') {
            toast.info('Produto atualizado', { duration: 2000 });
          }
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] Product channel status:', status);
      });

    // Channel for module changes
    const modulesChannel = supabase
      .channel(`modules-${productId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'product_modules',
          filter: `product_id=eq.${productId}`,
        },
        (payload) => {
          console.log('[Realtime] Module change:', payload.eventType);
          onModuleChange?.(payload);
          invalidateModuleQueries();
          
          if (showNotifications) {
            const messages: Record<string, string> = {
              INSERT: 'Módulo adicionado',
              UPDATE: 'Módulo atualizado',
              DELETE: 'Módulo removido',
            };
            toast.info(messages[payload.eventType] || 'Módulo alterado', { duration: 2000 });
          }
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] Modules channel status:', status);
      });

    // Channel for lesson changes (requires join via modules)
    const lessonsChannel = supabase
      .channel(`lessons-${productId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'product_lessons',
        },
        (payload) => {
          console.log('[Realtime] Lesson change:', payload.eventType);
          onLessonChange?.(payload);
          invalidateModuleQueries();
          
          if (showNotifications) {
            const messages: Record<string, string> = {
              INSERT: 'Aula adicionada',
              UPDATE: 'Aula atualizada',
              DELETE: 'Aula removida',
            };
            toast.info(messages[payload.eventType] || 'Aula alterada', { duration: 2000 });
          }
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] Lessons channel status:', status);
      });

    channelsRef.current = [productChannel, modulesChannel, lessonsChannel];

    return () => {
      console.log('[Realtime] Cleaning up channels');
      channelsRef.current.forEach((channel) => {
        supabase.removeChannel(channel);
      });
      channelsRef.current = [];
    };
  }, [
    productId,
    enabled,
    onProductChange,
    onModuleChange,
    onLessonChange,
    showNotifications,
    invalidateProductQueries,
    invalidateModuleQueries,
  ]);

  const forceRefresh = useCallback(() => {
    invalidateProductQueries();
    invalidateModuleQueries();
    toast.success('Dados atualizados', { duration: 1500 });
  }, [invalidateProductQueries, invalidateModuleQueries]);

  return { forceRefresh };
}
