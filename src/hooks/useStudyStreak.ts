import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/auth';

interface StudyStreak {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
  totalStudyDays: number;
}

export const useStudyStreak = () => {
  const { user } = useAuth();
  const [streak, setStreak] = useState<StudyStreak>({
    currentStreak: 0,
    longestStreak: 0,
    lastActivityDate: null,
    totalStudyDays: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchStreak = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('study_streaks')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching streak:', error);
      }

      if (data) {
        setStreak({
          currentStreak: data.current_streak || 0,
          longestStreak: data.longest_streak || 0,
          lastActivityDate: data.last_activity_date,
          totalStudyDays: data.total_study_days || 0
        });
      }
    } catch (error) {
      console.error('Error in useStudyStreak:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Calculate total hours watched from lesson_progress
  const calculateHoursWatched = useCallback(async (): Promise<number> => {
    if (!user?.id) return 0;

    try {
      const { data } = await supabase
        .from('lesson_progress')
        .select('watch_time_seconds')
        .eq('user_id', user.id);

      if (data) {
        const totalSeconds = data.reduce((acc, item) => acc + (item.watch_time_seconds || 0), 0);
        return Math.round(totalSeconds / 3600); // Convert to hours
      }
    } catch (error) {
      console.error('Error calculating hours watched:', error);
    }
    return 0;
  }, [user?.id]);

  useEffect(() => {
    fetchStreak();
  }, [fetchStreak]);

  // Set up realtime subscription
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('study-streak-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'study_streaks',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          if (payload.new) {
            const data = payload.new as any;
            setStreak({
              currentStreak: data.current_streak || 0,
              longestStreak: data.longest_streak || 0,
              lastActivityDate: data.last_activity_date,
              totalStudyDays: data.total_study_days || 0
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  return {
    ...streak,
    isLoading,
    refetch: fetchStreak,
    calculateHoursWatched
  };
};
