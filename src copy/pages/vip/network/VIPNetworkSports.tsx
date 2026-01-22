import { motion } from 'framer-motion';
import { Trophy, Play, Calendar, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const mockSportsVideos = Array.from({ length: 8 }, (_, i) => ({
  id: `sports-${i}`,
  title: `Análise Esportiva ${i + 1} - Trading em Esportes`,
  author: `SportsAnalyst ${(i % 4) + 1}`,
  thumbnail: `https://picsum.photos/seed/sports${i}/320/180`,
  views: Math.floor(Math.random() * 30000),
  sport: ['Futebol', 'Basquete', 'Tênis', 'E-Sports'][i % 4],
}));

const upcomingEvents = [
  { name: 'Copa do Brasil', date: 'Hoje, 21:00', sport: 'Futebol' },
  { name: 'NBA Finals', date: 'Amanhã, 22:30', sport: 'Basquete' },
  { name: 'Wimbledon', date: '12/01', sport: 'Tênis' },
];

export default function VIPNetworkSports() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-green-500/20">
          <Trophy className="h-6 w-6 text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Esportes</h1>
          <p className="text-muted-foreground">Análises e conteúdos esportivos</p>
        </div>
      </div>

      {/* Upcoming Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Próximos Eventos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {upcomingEvents.map((event, index) => (
              <motion.div
                key={event.name}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-3 rounded-lg bg-accent/50"
              >
                <div>
                  <p className="font-medium">{event.name}</p>
                  <p className="text-sm text-muted-foreground">{event.date}</p>
                </div>
                <Badge variant="outline">{event.sport}</Badge>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sports Videos */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Vídeos de Esportes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {mockSportsVideos.map((video, index) => (
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
                    <Badge className="absolute top-2 left-2">{video.sport}</Badge>
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium text-sm line-clamp-2">{video.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{video.author}</p>
                    <p className="text-xs text-muted-foreground">{video.views.toLocaleString()} views</p>
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
