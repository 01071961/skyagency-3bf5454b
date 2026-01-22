import { motion } from 'framer-motion';
import { Library, Clock, ListVideo, ThumbsUp, Bookmark, History, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const libraryItems = [
  { icon: History, title: 'Histórico', description: 'Vídeos que você assistiu', href: '/vip/network/history', count: 234 },
  { icon: ListVideo, title: 'Playlists', description: 'Suas listas de reprodução', href: '/vip/network/playlists', count: 12 },
  { icon: ThumbsUp, title: 'Vídeos Curtidos', description: 'Vídeos que você curtiu', href: '/vip/network/liked', count: 89 },
  { icon: Bookmark, title: 'Salvos', description: 'Conteúdos salvos para depois', href: '/vip/network/saved', count: 45 },
];

export default function VIPNetworkLibrary() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-indigo-500/20">
          <Library className="h-6 w-6 text-purple-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Biblioteca</h1>
          <p className="text-muted-foreground">Seus vídeos, playlists e conteúdos salvos</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {libraryItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link to={item.href}>
                <Card className="hover:border-primary/50 transition-colors cursor-pointer group">
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-accent group-hover:bg-primary/10 transition-colors">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold group-hover:text-primary transition-colors">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                    <div className="text-2xl font-bold text-primary">{item.count}</div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4 flex-wrap">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Criar Playlist
          </Button>
          <Button variant="outline" className="gap-2">
            <Clock className="h-4 w-4" />
            Assistir Mais Tarde
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
