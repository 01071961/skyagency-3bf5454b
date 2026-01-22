import { motion } from 'framer-motion';
import { TrendingUp, Play, Eye, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const mockTrending = Array.from({ length: 10 }, (_, i) => ({
  id: `trending-${i}`,
  rank: i + 1,
  title: `Vídeo em Alta #${i + 1} - Conteúdo Viral`,
  author: `TopCreator ${(i % 5) + 1}`,
  avatar: '',
  thumbnail: `https://picsum.photos/seed/trending${i}/320/180`,
  duration: `${10 + i * 3}:${(i * 7) % 60}`,
  views: Math.floor(Math.random() * 500000) + 100000,
  likes: Math.floor(Math.random() * 50000),
  publishedAt: new Date(Date.now() - i * 3600000 * 12),
}));

export default function VIPNetworkTrending() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500/20 to-red-500/20">
          <TrendingUp className="h-6 w-6 text-orange-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Em Alta</h1>
          <p className="text-muted-foreground">Os vídeos mais populares agora</p>
        </div>
      </div>

      <div className="space-y-4">
        {mockTrending.map((video, index) => (
          <motion.div
            key={video.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="hover:border-primary/50 transition-colors cursor-pointer group">
              <CardContent className="p-4 flex gap-4 items-start">
                <div className="text-3xl font-bold text-muted-foreground w-8 text-center shrink-0">
                  {video.rank}
                </div>
                <div className="relative shrink-0">
                  <img
                    src={video.thumbnail}
                    alt=""
                    className="w-40 h-24 object-cover rounded-lg"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                    <Play className="h-8 w-8 text-white" />
                  </div>
                  <span className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 rounded">
                    {video.duration}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                    {video.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-2">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={video.avatar} />
                      <AvatarFallback className="text-xs">{video.author[0]}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-muted-foreground">{video.author}</span>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {video.views.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {video.publishedAt.toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
                <Badge variant="outline" className="shrink-0 text-orange-500 border-orange-500">
                  #{video.rank} Em Alta
                </Badge>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
