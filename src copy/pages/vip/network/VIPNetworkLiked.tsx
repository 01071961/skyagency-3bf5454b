import { motion } from 'framer-motion';
import { ThumbsUp, Play } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const mockLikedVideos = Array.from({ length: 12 }, (_, i) => ({
  id: `liked-${i}`,
  title: `Vídeo Curtido ${i + 1} - Conteúdo Incrível`,
  author: `Creator ${(i % 5) + 1}`,
  thumbnail: `https://picsum.photos/seed/liked${i}/320/180`,
  duration: `${5 + i * 2}:${(i * 11) % 60}`,
  views: Math.floor(Math.random() * 100000),
}));

export default function VIPNetworkLiked() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20">
          <ThumbsUp className="h-6 w-6 text-green-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Vídeos Curtidos</h1>
          <p className="text-muted-foreground">{mockLikedVideos.length} vídeos que você curtiu</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {mockLikedVideos.map((video, index) => (
          <motion.div
            key={video.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.03 }}
          >
            <Card className="overflow-hidden cursor-pointer hover:border-primary/50 transition-colors group">
              <CardContent className="p-0">
                <div className="relative">
                  <img
                    src={video.thumbnail}
                    alt=""
                    className="w-full aspect-video object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="p-3 rounded-full bg-white/20 backdrop-blur-sm">
                      <Play className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
                    {video.duration}
                  </span>
                </div>
                <div className="p-3">
                  <h3 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                    {video.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">{video.author}</p>
                  <p className="text-xs text-muted-foreground">{video.views.toLocaleString()} visualizações</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
