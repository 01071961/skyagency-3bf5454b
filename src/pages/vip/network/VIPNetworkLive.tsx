import { motion } from 'framer-motion';
import { Radio, Eye, MessageCircle, Heart, Share2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { VIPLiveChat } from '@/components/vip/social/VIPLiveChat';

export default function VIPNetworkLive() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-gradient-to-br from-red-500/20 to-pink-500/20 animate-pulse">
          <Radio className="h-6 w-6 text-red-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Ao Vivo
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          </h1>
          <p className="text-muted-foreground">Transmissões acontecendo agora</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Video Area */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="relative aspect-video bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
                <div className="text-center">
                  <Radio className="h-16 w-16 text-red-500 mb-4 mx-auto animate-pulse" />
                  <p className="text-white/70">Nenhuma live selecionada</p>
                  <p className="text-white/50 text-sm">Selecione uma live para assistir</p>
                </div>
                <div className="absolute top-4 left-4 flex gap-2">
                  <Badge variant="destructive" className="gap-1 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    AO VIVO
                  </Badge>
                </div>
                <div className="absolute top-4 right-4">
                  <Badge variant="secondary" className="gap-1">
                    <Eye className="h-3 w-3" />
                    0
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Live Info */}
          <div className="flex items-start gap-4">
            <Avatar className="h-12 w-12">
              <AvatarFallback>?</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="font-semibold text-lg">Selecione uma Live</h2>
              <p className="text-muted-foreground text-sm">Escolha uma transmissão ao vivo para assistir</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <Heart className="h-4 w-4" />
                Curtir
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <Share2 className="h-4 w-4" />
                Compartilhar
              </Button>
            </div>
          </div>
        </div>

        {/* Chat Sidebar */}
        <div className="lg:col-span-1">
          <Card className="h-[600px]">
            <div className="p-4 border-b flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              <span className="font-semibold">Chat ao Vivo</span>
            </div>
            <div className="flex-1 flex items-center justify-center p-8 text-center">
              <div>
                <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground text-sm">
                  Selecione uma live para participar do chat
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
