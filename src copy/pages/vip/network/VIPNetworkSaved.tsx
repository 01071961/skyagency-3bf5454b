import { motion } from 'framer-motion';
import { Bookmark, Play, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const mockSavedItems = Array.from({ length: 8 }, (_, i) => ({
  id: `saved-${i}`,
  title: `Conteúdo Salvo ${i + 1} - Para assistir depois`,
  author: `Creator ${(i % 4) + 1}`,
  thumbnail: `https://picsum.photos/seed/saved${i}/320/180`,
  type: i % 3 === 0 ? 'video' : i % 3 === 1 ? 'post' : 'live',
  savedAt: new Date(Date.now() - i * 86400000),
}));

export default function VIPNetworkSaved() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-gradient-to-br from-yellow-500/20 to-orange-500/20">
          <Bookmark className="h-6 w-6 text-yellow-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Salvos</h1>
          <p className="text-muted-foreground">{mockSavedItems.length} itens salvos</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {mockSavedItems.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.03 }}
          >
            <Card className="overflow-hidden cursor-pointer hover:border-primary/50 transition-colors group">
              <CardContent className="p-0">
                <div className="relative">
                  <img
                    src={item.thumbnail}
                    alt=""
                    className="w-full aspect-video object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="p-3 rounded-full bg-white/20 backdrop-blur-sm">
                      <Play className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="secondary" size="icon" className="h-8 w-8">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">{item.author}</p>
                  <p className="text-xs text-muted-foreground">
                    Salvo em {item.savedAt.toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
