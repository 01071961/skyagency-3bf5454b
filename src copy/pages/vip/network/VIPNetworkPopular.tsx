import { motion } from 'framer-motion';
import { Flame, Play, Eye, ThumbsUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const mockPopular = Array.from({ length: 12 }, (_, i) => ({
  id: `popular-${i}`,
  title: `Vídeo Popular ${i + 1} - Milhões de Visualizações`,
  author: `FamousCreator ${(i % 6) + 1}`,
  avatar: '',
  thumbnail: `https://picsum.photos/seed/popular${i}/320/180`,
  duration: `${15 + i * 2}:${(i * 9) % 60}`,
  views: Math.floor(Math.random() * 1000000) + 500000,
  likes: Math.floor(Math.random() * 100000),
}));

export default function VIPNetworkPopular() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-gradient-to-br from-red-500/20 to-pink-500/20">
          <Flame className="h-6 w-6 text-red-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Populares</h1>
          <p className="text-muted-foreground">Os vídeos mais vistos de todos os tempos</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {mockPopular.map((video, index) => (
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
                  <Badge className="absolute top-2 left-2 bg-gradient-to-r from-red-500 to-pink-500">
                    <Flame className="h-3 w-3 mr-1" />
                    Popular
                  </Badge>
                </div>
                <div className="p-3">
                  <h3 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                    {video.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-2">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={video.avatar} />
                      <AvatarFallback className="text-xs">{video.author[0]}</AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground">{video.author}</span>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {(video.views / 1000000).toFixed(1)}M
                    </span>
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="h-3 w-3" />
                      {(video.likes / 1000).toFixed(0)}K
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
