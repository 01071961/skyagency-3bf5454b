import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/auth';
import { useStudyStreak } from '@/hooks/useStudyStreak';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  BookOpen,
  Calendar,
  Trophy,
  Target,
  Flame
} from 'lucide-react';

interface Stats {
  totalCourses: number;
  completedCourses: number;
  totalLessons: number;
  completedLessons: number;
  hoursWatched: number;
  streak: number;
  averageProgress: number;
}

interface RecentActivity {
  id: string;
  lessonName: string;
  courseName: string;
  completedAt: string;
}

const MemberProgress = () => {
  const { user } = useAuth();
  const { currentStreak, longestStreak, calculateHoursWatched, isLoading: streakLoading } = useStudyStreak();
  
  const [stats, setStats] = useState<Stats>({
    totalCourses: 0,
    completedCourses: 0,
    totalLessons: 0,
    completedLessons: 0,
    hoursWatched: 0,
    streak: 0,
    averageProgress: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProgress();
    }
  }, [user]);

  // Update streak from real data
  useEffect(() => {
    if (!streakLoading) {
      setStats(prev => ({ ...prev, streak: currentStreak }));
    }
  }, [currentStreak, streakLoading]);

  // Fetch real hours watched
  useEffect(() => {
    const fetchHours = async () => {
      const hours = await calculateHoursWatched();
      setStats(prev => ({ ...prev, hoursWatched: hours }));
    };
    if (user) fetchHours();
  }, [user, calculateHoursWatched]);

  const fetchProgress = async () => {
    try {
      // Fetch enrollments
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('id, progress_percent, product:products(name)')
        .eq('user_id', user?.id)
        .eq('status', 'active');

      // Fetch lesson progress
      const { data: lessonProgress } = await supabase
        .from('lesson_progress')
        .select(`
          id,
          completed,
          completed_at,
          watch_time_seconds,
          lesson:product_lessons(
            name,
            module:product_modules(
              product:products(name)
            )
          )
        `)
        .eq('user_id', user?.id)
        .order('completed_at', { ascending: false })
        .limit(10);

      const enrollmentData = enrollments || [];
      const progressData = lessonProgress || [];

      const totalCourses = enrollmentData.length;
      const completedCourses = enrollmentData.filter(e => e.progress_percent >= 100).length;
      const completedLessons = progressData.filter(p => p.completed).length;
      const averageProgress = totalCourses > 0 
        ? Math.round(enrollmentData.reduce((acc, e) => acc + (e.progress_percent || 0), 0) / totalCourses)
        : 0;
      const hoursWatched = Math.round(progressData.reduce((acc, p) => acc + ((p as any).watch_time_seconds || 0), 0) / 3600);

      setStats(prev => ({
        ...prev,
        totalCourses,
        completedCourses,
        totalLessons: progressData.length,
        completedLessons,
        hoursWatched: hoursWatched || prev.hoursWatched,
        averageProgress
      }));

      // Format recent activity
      const activity = progressData
        .filter(p => p.completed && p.lesson)
        .map(p => ({
          id: p.id,
          lessonName: (p.lesson as any)?.name || 'Aula',
          courseName: (p.lesson as any)?.module?.product?.name || 'Curso',
          completedAt: p.completed_at || ''
        }));

      setRecentActivity(activity);
    } catch (error) {
      console.error('Error fetching progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Meu Progresso</h1>
        <p className="text-muted-foreground">Acompanhe sua evolução nos cursos</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.averageProgress}%</p>
                <p className="text-sm text-muted-foreground">Progresso Médio</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/10">
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.completedLessons}</p>
                <p className="text-sm text-muted-foreground">Aulas Concluídas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/10">
                <Clock className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.hoursWatched}h</p>
                <p className="text-sm text-muted-foreground">Tempo de Estudo</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-orange-500/10">
                <Trophy className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.streak} dias</p>
                <p className="text-sm text-muted-foreground">Sequência</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Course Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Progresso Geral
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Cursos Concluídos</span>
              <span className="font-medium">{stats.completedCourses} de {stats.totalCourses}</span>
            </div>
            <Progress 
              value={stats.totalCourses > 0 ? (stats.completedCourses / stats.totalCourses) * 100 : 0} 
              className="h-3"
            />
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Atividade Recente
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivity.length > 0 ? (
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div 
                  key={activity.id}
                  className="flex items-center gap-4 p-3 rounded-lg bg-muted/50"
                >
                  <div className="p-2 rounded-full bg-green-500/10">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{activity.lessonName}</p>
                    <p className="text-sm text-muted-foreground truncate">{activity.courseName}</p>
                  </div>
                  <p className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDate(activity.completedAt)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">Nenhuma atividade recente</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MemberProgress;
