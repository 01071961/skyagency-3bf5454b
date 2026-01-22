import { motion } from 'framer-motion';
import { ListVideo, Plus, Play, MoreVertical } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const mockPlaylists = [
  { id: '1', title: 'Favoritos', videoCount: 24, thumbnail: 'https://picsum.photos/seed/pl1/320/180', isPrivate: false },
  { id: '2', title: 'Análises Técnicas', videoCount: 15, thumbnail: 'https://picsum.photos/seed/pl2/320/180', isPrivate: true },
  { id: '3', title: 'Tutoriais', videoCount: 8, thumbnail: 'https://picsum.photos/seed/pl3/320/180', isPrivate: false },
  { id: '4', title: 'Lives Salvas', videoCount: 32, thumbnail: 'https://picsum.photos/seed/pl4/320/180', isPrivate: true },
];

export default function VIPNetworkPlaylists() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20">
            <ListVideo className="h-6 w-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Playlists</h1>
            <p className="text-muted-foreground">Suas listas de reprodução</p>
          </div>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Playlist
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {mockPlaylists.map((playlist, index) => (
          <motion.div
            key={playlist.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="overflow-hidden cursor-pointer hover:border-primary/50 transition-colors group">
              <CardContent className="p-0">
                <div className="relative">
                  <img
                    src={playlist.thumbnail}
                    alt=""
                    className="w-full aspect-video object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="p-3 rounded-full bg-white/20 backdrop-blur-sm">
                      <Play className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <div className="absolute bottom-0 right-0 left-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                    <div className="flex items-center gap-1 text-white text-xs">
                      <ListVideo className="h-3 w-3" />
                      {playlist.videoCount} vídeos
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold group-hover:text-primary transition-colors">{playlist.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        {playlist.isPrivate && (
                          <Badge variant="outline" className="text-xs">Privada</Badge>
                        )}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
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
