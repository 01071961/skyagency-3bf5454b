import { motion } from 'framer-motion';
import { GraduationCap, Play, BookOpen, Award, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

const mockCourses = [
  { id: '1', title: 'Trading para Iniciantes', lessons: 24, progress: 45, instructor: 'Prof. Carlos' },
  { id: '2', title: 'Análise Técnica Avançada', lessons: 36, progress: 0, instructor: 'Prof. Maria' },
  { id: '3', title: 'Criptomoedas 101', lessons: 18, progress: 100, instructor: 'Prof. João' },
];

const mockEducationalVideos = Array.from({ length: 8 }, (_, i) => ({
  id: `edu-${i}`,
  title: `Aula ${i + 1} - Fundamentos do Mercado`,
  instructor: `Professor ${(i % 4) + 1}`,
  thumbnail: `https://picsum.photos/seed/edu${i}/320/180`,
  duration: `${20 + i * 5}:00`,
  level: ['Iniciante', 'Intermediário', 'Avançado'][i % 3],
}));

export default function VIPNetworkEducation() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20">
          <GraduationCap className="h-6 w-6 text-indigo-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Educação</h1>
          <p className="text-muted-foreground">Cursos e conteúdos educacionais</p>
        </div>
      </div>

      {/* My Courses */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Meus Cursos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {mockCourses.map((course, index) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-4 rounded-lg border hover:border-primary/50 transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold">{course.title}</h3>
                  <p className="text-sm text-muted-foreground">{course.instructor} • {course.lessons} aulas</p>
                </div>
                {course.progress === 100 ? (
                  <Badge className="bg-green-500">
                    <Award className="h-3 w-3 mr-1" />
                    Concluído
                  </Badge>
                ) : (
                  <Badge variant="outline">{course.progress}%</Badge>
                )}
              </div>
              <Progress value={course.progress} className="h-2" />
            </motion.div>
          ))}
        </CardContent>
      </Card>

      {/* Educational Videos */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Aulas Recentes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {mockEducationalVideos.map((video, index) => (
            <motion.div
              key={video.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.03 }}
            >
              <Card className="overflow-hidden cursor-pointer hover:border-primary/50 transition-colors group">
                <CardContent className="p-0">
                  <div className="relative aspect-video">
                    <img src={video.thumbnail} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="h-8 w-8 text-white" />
                    </div>
                    <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 rounded">
                      {video.duration}
                    </span>
                    <Badge className="absolute top-2 left-2" variant="secondary">
                      {video.level}
                    </Badge>
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium text-sm line-clamp-2">{video.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{video.instructor}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
