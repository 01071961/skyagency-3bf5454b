import { motion } from 'framer-motion';
import { PlaySquare, Plus, Smartphone } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const mockShorts = Array.from({ length: 12 }, (_, i) => ({
  id: `short-${i}`,
  thumbnail: `https://picsum.photos/seed/short${i}/400/700`,
  views: Math.floor(Math.random() * 100000),
  likes: Math.floor(Math.random() * 10000),
  author: `Creator ${i + 1}`,
}));

export default function VIPNetworkShorts() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-pink-500/20 to-red-500/20">
            <PlaySquare className="h-6 w-6 text-pink-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Shorts</h1>
            <p className="text-muted-foreground">Vídeos curtos e verticais</p>
          </div>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Criar Short
        </Button>
      </div>

      {/* Shorts Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {mockShorts.map((short, index) => (
          <motion.div
            key={short.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.03 }}
          >
            <Card className="overflow-hidden cursor-pointer hover:scale-105 transition-transform group">
              <CardContent className="p-0 relative aspect-[9/16]">
                <img
                  src={short.thumbnail}
                  alt=""
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-white text-sm font-medium truncate">{short.author}</p>
                  <p className="text-white/70 text-xs">{short.views.toLocaleString()} views</p>
                </div>
                <div className="absolute top-2 right-2 p-1 bg-black/50 rounded-full">
                  <Smartphone className="h-3 w-3 text-white" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
