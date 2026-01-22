import { motion } from 'framer-motion';
import { Gamepad2, Play, Users, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const mockGames = [
  { id: '1', name: 'Trading Simulator', players: 12453, liveNow: 5, thumbnail: 'https://picsum.photos/seed/game1/320/180' },
  { id: '2', name: 'Market Masters', players: 8721, liveNow: 3, thumbnail: 'https://picsum.photos/seed/game2/320/180' },
  { id: '3', name: 'Crypto Quest', players: 6234, liveNow: 8, thumbnail: 'https://picsum.photos/seed/game3/320/180' },
  { id: '4', name: 'Wall Street Tycoon', players: 4567, liveNow: 2, thumbnail: 'https://picsum.photos/seed/game4/320/180' },
];

const mockGamingVideos = Array.from({ length: 8 }, (_, i) => ({
  id: `gaming-${i}`,
  title: `Gameplay ${i + 1} - Trading Simulator`,
  author: `Gamer ${(i % 5) + 1}`,
  thumbnail: `https://picsum.photos/seed/gaming${i}/320/180`,
  views: Math.floor(Math.random() * 50000),
  isLive: i < 2,
}));

export default function VIPNetworkGames() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/20 to-cyan-500/20">
          <Gamepad2 className="h-6 w-6 text-green-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Games</h1>
          <p className="text-muted-foreground">Jogos e gameplays de trading</p>
        </div>
      </div>

      {/* Popular Games */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Jogos Populares</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {mockGames.map((game, index) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="overflow-hidden cursor-pointer hover:border-green-500/50 transition-colors">
                <CardContent className="p-0">
                  <div className="relative aspect-video">
                    <img src={game.thumbnail} alt="" className="w-full h-full object-cover" />
                    {game.liveNow > 0 && (
                      <Badge variant="destructive" className="absolute top-2 left-2 animate-pulse">
                        {game.liveNow} ao vivo
                      </Badge>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-sm">{game.name}</h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Users className="h-3 w-3" />
                      {game.players.toLocaleString()} jogadores
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Gaming Videos */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Gameplays Recentes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {mockGamingVideos.map((video, index) => (
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
                    {video.isLive && (
                      <Badge variant="destructive" className="absolute top-2 left-2 animate-pulse">
                        AO VIVO
                      </Badge>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium text-sm line-clamp-2">{video.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{video.author}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {video.views.toLocaleString()} views
                    </p>
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
