import { motion } from 'framer-motion';
import { 
  BookOpen, Award, Clock, TrendingUp, 
  CheckCircle, Target, Zap, Star 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface DashboardStatsProps {
  enrolledCourses: number;
  completedCourses: number;
  certificates: number;
  totalHoursStudied: number;
  averageScore: number;
  currentStreak: number;
}

export function DashboardStats({
  enrolledCourses,
  completedCourses,
  certificates,
  totalHoursStudied,
  averageScore,
  currentStreak
}: DashboardStatsProps) {
  const stats = [
    {
      label: 'Cursos em Andamento',
      value: enrolledCourses - completedCourses,
      icon: BookOpen,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
    },
    {
      label: 'Cursos Concluídos',
      value: completedCourses,
      icon: CheckCircle,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10'
    },
    {
      label: 'Certificados',
      value: certificates,
      icon: Award,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10'
    },
    {
      label: 'Horas de Estudo',
      value: totalHoursStudied,
      icon: Clock,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      suffix: 'h'
    },
    {
      label: 'Média em Provas',
      value: averageScore,
      icon: Target,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      suffix: '%'
    },
    {
      label: 'Sequência',
      value: currentStreak,
      icon: Zap,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      suffix: ' dias'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <Card className="h-full hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex flex-col items-center text-center">
              <div className={`p-3 rounded-xl ${stat.bgColor} mb-3`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <p className="text-2xl font-bold">
                {stat.value}{stat.suffix || ''}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.label}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
