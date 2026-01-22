import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Video, 
  Users, 
  MessageSquare, 
  Send, 
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Settings,
  ThumbsUp,
  Share2
} from 'lucide-react';
import { useAuth } from '@/auth';

interface ChatMessage {
  id: string;
  user: string;
  avatar?: string;
  message: string;
  timestamp: Date;
  isHost?: boolean;
}

interface WebinarPlayerProps {
  webinarId: string;
  title: string;
  description?: string;
  videoUrl?: string;
  hostName: string;
  hostAvatar?: string;
  isLive?: boolean;
  scheduledAt?: Date;
  viewerCount?: number;
  onJoin?: () => void;
}

export const WebinarPlayer = ({
  webinarId,
  title,
  description,
  videoUrl,
  hostName,
  hostAvatar,
  isLive = false,
  scheduledAt,
  viewerCount = 0,
  onJoin
}: WebinarPlayerProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', user: 'Maria Silva', message: 'Muito bom o conteúdo!', timestamp: new Date(), isHost: false },
    { id: '2', user: hostName, message: 'Obrigado por participar!', timestamp: new Date(), isHost: true },
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showChat, setShowChat] = useState(true);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    const message: ChatMessage = {
      id: Date.now().toString(),
      user: user?.email?.split('@')[0] || 'Anônimo',
      message: newMessage,
      timestamp: new Date(),
      isHost: false
    };
    
    setMessages(prev => [...prev, message]);
    setNewMessage('');
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
      {/* Video Player */}
      <div className={`${showChat ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
        <Card className="overflow-hidden">
          <div className="relative aspect-video bg-black">
            {videoUrl ? (
              <iframe
                src={videoUrl}
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white">
                  <Video className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Aguardando início do webinar...</p>
                  {scheduledAt && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Início: {scheduledAt.toLocaleString('pt-BR')}
                    </p>
                  )}
                </div>
              </div>
            )}
            
            {/* Live Badge */}
            {isLive && (
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <Badge variant="destructive" className="animate-pulse">
                  <span className="h-2 w-2 rounded-full bg-white mr-2" />
                  AO VIVO
                </Badge>
                <Badge variant="secondary">
                  <Users className="h-3 w-3 mr-1" />
                  {viewerCount} assistindo
                </Badge>
              </div>
            )}

            {/* Controls */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20"
                    onClick={() => setIsPlaying(!isPlaying)}
                  >
                    {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20"
                    onClick={() => setIsMuted(!isMuted)}
                  >
                    {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20"
                    onClick={() => setShowChat(!showChat)}
                  >
                    <MessageSquare className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20"
                  >
                    <Settings className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20"
                  >
                    <Maximize className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold">{title}</h2>
                {description && (
                  <p className="text-muted-foreground mt-1">{description}</p>
                )}
                <div className="flex items-center gap-2 mt-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={hostAvatar} />
                    <AvatarFallback>{hostName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{hostName}</span>
                  <Badge variant="outline">Host</Badge>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <ThumbsUp className="h-4 w-4 mr-2" />
                  Curtir
                </Button>
                <Button variant="outline" size="sm">
                  <Share2 className="h-4 w-4 mr-2" />
                  Compartilhar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chat */}
      {showChat && (
        <Card className="flex flex-col h-[600px]">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageSquare className="h-4 w-4" />
              Chat ao Vivo
            </CardTitle>
          </CardHeader>
          
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className="flex items-start gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={msg.avatar} />
                    <AvatarFallback>{msg.user.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium text-sm ${msg.isHost ? 'text-primary' : ''}`}>
                        {msg.user}
                      </span>
                      {msg.isHost && (
                        <Badge variant="default" className="text-xs py-0">Host</Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {formatTime(msg.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm break-words">{msg.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                placeholder="Digite sua mensagem..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <Button size="icon" onClick={handleSendMessage}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default WebinarPlayer;
