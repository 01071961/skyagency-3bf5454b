import { useEffect, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/auth';

interface RealtimeEvent {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: Record<string, any>;
  old: Record<string, any>;
}

export function useRealtimeEnrollments() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);

  const handleEnrollmentChange = useCallback((payload: RealtimeEvent) => {
    console.log('[Realtime] Enrollment change:', payload.eventType);
    
    // Invalidate enrollment-related queries
    queryClient.invalidateQueries({ queryKey: ['enrollments'] });
    queryClient.invalidateQueries({ queryKey: ['enrolled-products'] });
    queryClient.invalidateQueries({ queryKey: ['my-courses'] });
  }, [queryClient]);

  const handleLessonProgressChange = useCallback((payload: RealtimeEvent) => {
    console.log('[Realtime] Lesson progress change:', payload.eventType);
    
    // Invalidate progress-related queries
    queryClient.invalidateQueries({ queryKey: ['lesson-progress'] });
    queryClient.invalidateQueries({ queryKey: ['course-progress'] });
    queryClient.invalidateQueries({ queryKey: ['user-activity'] });
  }, [queryClient]);

  const handleQuizAttemptChange = useCallback((payload: RealtimeEvent) => {
    console.log('[Realtime] Quiz attempt change:', payload.eventType);
    
    // Invalidate quiz-related queries
    queryClient.invalidateQueries({ queryKey: ['quiz-attempts'] });
    queryClient.invalidateQueries({ queryKey: ['simulator-attempts'] });
    queryClient.invalidateQueries({ queryKey: ['user-activity'] });
  }, [queryClient]);

  const handleSimulatorAttemptChange = useCallback((payload: RealtimeEvent) => {
    console.log('[Realtime] Simulator attempt change:', payload.eventType);
    
    // Invalidate simulator-related queries
    queryClient.invalidateQueries({ queryKey: ['simulator-attempts'] });
    queryClient.invalidateQueries({ queryKey: ['simulator-attempts-all'] });
    queryClient.invalidateQueries({ queryKey: ['historico-modulos'] });
  }, [queryClient]);

  useEffect(() => {
    if (!user?.id) return;

    // Create a single channel for all enrollment-related changes
    const channel = supabase
      .channel(`enrollments-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'enrollments',
          filter: `user_id=eq.${user.id}`
        },
        handleEnrollmentChange
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lesson_progress',
          filter: `user_id=eq.${user.id}`
        },
        handleLessonProgressChange
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lesson_quiz_attempts',
          filter: `user_id=eq.${user.id}`
        },
        handleQuizAttemptChange
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'simulator_attempts',
          filter: `user_id=eq.${user.id}`
        },
        handleSimulatorAttemptChange
      )
      .subscribe((status) => {
        console.log('[Realtime] Enrollment channel status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      console.log('[Realtime] Unsubscribing from enrollment channel');
      supabase.removeChannel(channel);
    };
  }, [
    user?.id, 
    handleEnrollmentChange, 
    handleLessonProgressChange, 
    handleQuizAttemptChange,
    handleSimulatorAttemptChange
  ]);

  return { isConnected };
}
