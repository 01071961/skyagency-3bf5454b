import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/auth';
import { format, subDays, startOfDay, eachDayOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface ActivityData {
  name: string;
  date: string;
  views: number;
  points: number;
  lessons: number;
  exams: number;
}

export interface ActivitySummary {
  totalViews: number;
  totalPoints: number;
  totalLessons: number;
  totalExams: number;
  avgDailyActivity: number;
}

interface UseUserActivityOptions {
  days?: number;
  enabled?: boolean;
}

export function useUserActivity(options: UseUserActivityOptions = {}) {
  const { days = 7, enabled = true } = options;
  const { user } = useAuth();
  const [data, setData] = useState<ActivityData[]>([]);
  const [summary, setSummary] = useState<ActivitySummary>({
    totalViews: 0,
    totalPoints: 0,
    totalLessons: 0,
    totalExams: 0,
    avgDailyActivity: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivity = useCallback(async () => {
    if (!user?.id || !enabled) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const startDate = startOfDay(subDays(new Date(), days - 1));
      const endDate = new Date();
      const dateRange = eachDayOfInterval({ start: startDate, end: endDate });

      // Initialize data structure
      const dataByDay: Record<string, { views: number; points: number; lessons: number; exams: number }> = {};
      dateRange.forEach(date => {
        const key = format(date, 'yyyy-MM-dd');
        dataByDay[key] = { views: 0, points: 0, lessons: 0, exams: 0 };
      });

      // Fetch lesson progress
      const { data: lessonsData } = await supabase
        .from('lesson_progress')
        .select('created_at, updated_at')
        .eq('user_id', user.id)
        .gte('updated_at', startDate.toISOString());

      // Fetch exam attempts
      const { data: examsData } = await supabase
        .from('exam_attempts')
        .select('created_at')
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString());

      // Fetch analytics events (views)
      const { data: eventsData } = await supabase
        .from('analytics_events')
        .select('created_at, event_name')
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString());

      // Get total points (we'll distribute evenly across days as approximation)
      const { data: userPoints } = await supabase
        .from('user_points')
        .select('current_balance, total_earned')
        .eq('user_id', user.id)
        .maybeSingle();

      // Distribute points evenly across days for visualization
      const avgPointsPerDay = userPoints?.total_earned ? Math.round(userPoints.total_earned / days) : 0;

      // Process lessons data
      lessonsData?.forEach(l => {
        const key = format(new Date(l.updated_at || l.created_at), 'yyyy-MM-dd');
        if (dataByDay[key]) {
          dataByDay[key].lessons += 1;
        }
      });

      // Process exams data
      examsData?.forEach(e => {
        const key = format(new Date(e.created_at), 'yyyy-MM-dd');
        if (dataByDay[key]) {
          dataByDay[key].exams += 1;
        }
      });

      // Process events data (views)
      eventsData?.forEach(e => {
        const key = format(new Date(e.created_at!), 'yyyy-MM-dd');
        if (dataByDay[key]) {
          dataByDay[key].views += 1;
        }
      });

      // Convert to array format - add average points per day
      const activityData: ActivityData[] = dateRange.map((date, index) => {
        const key = format(date, 'yyyy-MM-dd');
        const dayData = dataByDay[key];
        return {
          name: format(date, 'EEE', { locale: ptBR }),
          date: key,
          views: dayData.views,
          points: avgPointsPerDay + (dayData.lessons * 10) + (dayData.exams * 20), // Estimate points from activity
          lessons: dayData.lessons,
          exams: dayData.exams,
        };
      });

      // Calculate summary
      const totals = activityData.reduce(
        (acc, day) => ({
          totalViews: acc.totalViews + day.views,
          totalPoints: acc.totalPoints + day.points,
          totalLessons: acc.totalLessons + day.lessons,
          totalExams: acc.totalExams + day.exams,
        }),
        { totalViews: 0, totalPoints: 0, totalLessons: 0, totalExams: 0 }
      );

      const avgDailyActivity = Math.round(
        (totals.totalViews + totals.totalLessons + totals.totalExams) / days
      );

      setData(activityData);
      setSummary({ ...totals, avgDailyActivity });
    } catch (err: any) {
      console.error('Error fetching user activity:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, days, enabled]);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  return {
    data,
    summary,
    isLoading,
    error,
    refresh: fetchActivity,
  };
}

// Hook for admin to fetch platform-wide activity
export function useAdminActivity(options: UseUserActivityOptions = {}) {
  const { days = 7, enabled = true } = options;
  const [data, setData] = useState<ActivityData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchActivity = useCallback(async () => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      const startDate = startOfDay(subDays(new Date(), days - 1));
      const dateRange = eachDayOfInterval({ start: startDate, end: new Date() });

      const dataByDay: Record<string, { views: number; points: number; lessons: number; exams: number }> = {};
      dateRange.forEach(date => {
        const key = format(date, 'yyyy-MM-dd');
        dataByDay[key] = { views: 0, points: 0, lessons: 0, exams: 0 };
      });

      // Fetch all lesson progress
      const { data: lessonsData } = await supabase
        .from('lesson_progress')
        .select('updated_at')
        .gte('updated_at', startDate.toISOString());

      // Fetch all exam attempts
      const { data: examsData } = await supabase
        .from('exam_attempts')
        .select('created_at')
        .gte('created_at', startDate.toISOString());

      lessonsData?.forEach(l => {
        const key = format(new Date(l.updated_at!), 'yyyy-MM-dd');
        if (dataByDay[key]) dataByDay[key].lessons += 1;
      });

      lessonsData?.forEach(l => {
        const key = format(new Date(l.updated_at!), 'yyyy-MM-dd');
        if (dataByDay[key]) dataByDay[key].lessons += 1;
      });

      examsData?.forEach(e => {
        const key = format(new Date(e.created_at), 'yyyy-MM-dd');
        if (dataByDay[key]) dataByDay[key].exams += 1;
      });

      const activityData: ActivityData[] = dateRange.map(date => {
        const key = format(date, 'yyyy-MM-dd');
        return {
          name: format(date, 'dd/MM', { locale: ptBR }),
          date: key,
          ...dataByDay[key],
        };
      });

      setData(activityData);
    } catch (err) {
      console.error('Error fetching admin activity:', err);
    } finally {
      setIsLoading(false);
    }
  }, [days, enabled]);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  return { data, isLoading, refresh: fetchActivity };
}
