import { motion } from 'framer-motion';
import { Music, Play, Clock, Heart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const mockMusicVideos = Array.from({ length: 8 }, (_, i) => ({
  id: `music-${i}`,
  title: `Música Financeira ${i + 1} - Motivação`,
  artist: `Artist ${(i % 4) + 1}`,
  thumbnail: `https://picsum.photos/seed/music${i}/320/180`,
  duration: `${3 + (i % 4)}:${(i * 13) % 60}`,
  plays: Math.floor(Math.random() * 500000),
}));

export default function VIPNetworkMusic() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20">
          <Music className="h-6 w-6 text-purple-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Música</h1>
          <p className="text-muted-foreground">Vídeos e conteúdos musicais</p>
        </div>
      </div>

      <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Playlist do Trader</h2>
              <p className="text-muted-foreground">Músicas para foco e concentração</p>
            </div>
            <Button className="gap-2 bg-purple-500 hover:bg-purple-600">
              <Play className="h-4 w-4" />
              Tocar Tudo
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {mockMusicVideos.map((video, index) => (
          <motion.div
            key={video.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.03 }}
          >
            <Card className="overflow-hidden cursor-pointer hover:border-purple-500/50 transition-colors group">
              <CardContent className="p-0">
                <div className="relative">
                  <img
                    src={video.thumbnail}
                    alt=""
                    className="w-full aspect-video object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="p-3 rounded-full bg-purple-500/80 backdrop-blur-sm">
                      <Play className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
                    {video.duration}
                  </span>
                </div>
                <div className="p-3">
                  <h3 className="font-medium text-sm line-clamp-2 group-hover:text-purple-400 transition-colors">
                    {video.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">{video.artist}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Music className="h-3 w-3" />
                      {video.plays.toLocaleString()} plays
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
