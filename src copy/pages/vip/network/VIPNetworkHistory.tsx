import { motion } from 'framer-motion';
import { History, Search, Trash2, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const mockHistory = Array.from({ length: 10 }, (_, i) => ({
  id: `history-${i}`,
  title: `Vídeo ${i + 1} - Análise de Mercado`,
  author: `Creator ${(i % 5) + 1}`,
  thumbnail: `https://picsum.photos/seed/history${i}/320/180`,
  duration: `${10 + i * 3}:${(i * 7) % 60}`,
  watchedAt: new Date(Date.now() - i * 3600000 * (i + 1)),
}));

export default function VIPNetworkHistory() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20">
            <History className="h-6 w-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Histórico</h1>
            <p className="text-muted-foreground">Vídeos que você assistiu</p>
          </div>
        </div>
        <Button variant="outline" className="gap-2 text-destructive hover:bg-destructive/10">
          <Trash2 className="h-4 w-4" />
          Limpar Histórico
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar no histórico..." className="pl-10" />
      </div>

      {/* History List */}
      <div className="space-y-4">
        {mockHistory.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.03 }}
          >
            <Card className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardContent className="p-4 flex gap-4">
                <div className="relative shrink-0">
                  <img
                    src={item.thumbnail}
                    alt=""
                    className="w-40 h-24 object-cover rounded-lg"
                  />
                  <span className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 rounded">
                    {item.duration}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.author}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {item.watchedAt.toLocaleDateString('pt-BR', { 
                      day: 'numeric', 
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="shrink-0">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
