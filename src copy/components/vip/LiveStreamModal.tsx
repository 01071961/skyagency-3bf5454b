import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  MessageCircle,
  Send,
  Heart,
  ThumbsUp,
  Users,
  Maximize2,
  Minimize2,
  Share2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { getYouTubeEmbedUrl } from '@/lib/url';

// Bot names and messages for live interaction
const BOT_NAMES = [
  'Lucas Silva', 'Maria Santos', 'Pedro Costa', 'Ana Oliveira', 'João Pereira',
  'Fernanda Lima', 'Rafael Souza', 'Juliana Rocha', 'Bruno Alves', 'Carla Dias',
  'Marcos Ribeiro', 'Patrícia Gomes', 'Ricardo Ferreira', 'Camila Martins', 'Felipe Nascimento',
  'Amanda Castro', 'Thiago Cardoso', 'Beatriz Correia', 'Daniel Barbosa', 'Larissa Araújo',
  'Gabriel Moreira', 'Vanessa Teixeira', 'André Pinto', 'Priscila Vieira', 'Leandro Melo',
  'Cristiane Lopes', 'Eduardo Nunes', 'Aline Mendes', 'Rodrigo Freitas', 'Natália Ramos',
];

const BOT_MESSAGES = [
  '🔥 Conteúdo incrível!', '👏 Muito bom!', '❤️ Amando a live!', '🎯 Direto ao ponto!',
  '💎 Ouro puro!', '🚀 Isso muda tudo!', 'Parabéns pelo conteúdo!', 'Melhor live do mês!',
  'Obrigado por compartilhar!', '🌟 Excelente explicação!', 'Salvando esse conteúdo!',
  'Que aula!', '💪 Motivação pura!', 'Isso é muito valioso!', 'Perfeito!',
  '✨ Genial!', 'Compartilhando com meu time!', 'Anotando tudo!', 'Incrível!',
  '🏆 Top demais!', 'Já apliquei aqui!', 'Resultado garantido!', 'Sensacional!',
  '🎉 Espetacular!', 'Valeu pela dica!', 'Isso funciona mesmo!', 'Muito obrigado!',
  '💯 100%!', 'Revolucionário!', 'Continue assim!',
];

const BOT_REACTIONS = ['👍', '❤️', '🔥', '🎉', '💪', '🚀', '⭐', '💎', '👏', '🏆'];

interface ChatMessage {
  id: string;
  author: string;
  avatar?: string;
  message: string;
  timestamp: Date;
  isBot?: boolean;
}

interface LiveStreamModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  title?: string;
  authorName?: string;
  authorAvatar?: string;
}

export function LiveStreamModal({
  isOpen,
  onClose,
  videoUrl,
  title = 'Transmissão ao vivo',
  authorName = 'Apresentador',
  authorAvatar,
}: LiveStreamModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [viewerCount, setViewerCount] = useState(Math.floor(Math.random() * 500) + 100);
  const [likesCount, setLikesCount] = useState(Math.floor(Math.random() * 200) + 50);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [floatingReactions, setFloatingReactions] = useState<{ id: string; emoji: string }[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const botIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const embedUrl = getYouTubeEmbedUrl(videoUrl);

  // Generate bot message
  const generateBotMessage = useCallback(() => {
    const randomName = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
    const randomMessage = BOT_MESSAGES[Math.floor(Math.random() * BOT_MESSAGES.length)];
    
    const message: ChatMessage = {
      id: `bot-${Date.now()}-${Math.random()}`,
      author: randomName,
      message: randomMessage,
      timestamp: new Date(),
      isBot: true,
    };

    setMessages(prev => [...prev.slice(-50), message]);
    
    // Sometimes add a like
    if (Math.random() > 0.6) {
      setLikesCount(prev => prev + 1);
    }

    // Sometimes add floating reaction
    if (Math.random() > 0.7) {
      const reactionId = `reaction-${Date.now()}`;
      const emoji = BOT_REACTIONS[Math.floor(Math.random() * BOT_REACTIONS.length)];
      setFloatingReactions(prev => [...prev, { id: reactionId, emoji }]);
      setTimeout(() => {
        setFloatingReactions(prev => prev.filter(r => r.id !== reactionId));
      }, 3000);
    }
  }, []);

  // Bot interactions effect
  useEffect(() => {
    if (!isOpen) return;

    // Initial messages
    const initialMessages: ChatMessage[] = [];
    for (let i = 0; i < 5; i++) {
      const randomName = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
      const randomMessage = BOT_MESSAGES[Math.floor(Math.random() * BOT_MESSAGES.length)];
      initialMessages.push({
        id: `initial-${i}`,
        author: randomName,
        message: randomMessage,
        timestamp: new Date(Date.now() - (5 - i) * 30000),
        isBot: true,
      });
    }
    setMessages(initialMessages);

    // Start bot interval (random message every 2-6 seconds)
    const startBotMessages = () => {
      const interval = Math.random() * 4000 + 2000;
      botIntervalRef.current = setTimeout(() => {
        generateBotMessage();
        startBotMessages();
      }, interval);
    };
    startBotMessages();

    // Viewer count fluctuation
    const viewerInterval = setInterval(() => {
      setViewerCount(prev => prev + Math.floor(Math.random() * 10) - 3);
    }, 5000);

    return () => {
      if (botIntervalRef.current) clearTimeout(botIntervalRef.current);
      clearInterval(viewerInterval);
    };
  }, [isOpen, generateBotMessage]);

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const message: ChatMessage = {
      id: `user-${Date.now()}`,
      author: 'Você',
      message: newMessage.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev.slice(-50), message]);
    setNewMessage('');
  };

  const handleLike = () => {
    setLikesCount(prev => prev + 1);
    const reactionId = `reaction-${Date.now()}`;
    setFloatingReactions(prev => [...prev, { id: reactionId, emoji: '❤️' }]);
    setTimeout(() => {
      setFloatingReactions(prev => prev.filter(r => r.id !== reactionId));
    }, 3000);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(videoUrl);
    toast.success('Link da live copiado!');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className={`${isFullscreen ? 'max-w-[100vw] h-[100vh] m-0 rounded-none' : 'max-w-6xl h-[90vh]'} p-0 gap-0 overflow-hidden`}
      >
        <div className="flex flex-col lg:flex-row h-full">
          {/* Video Section */}
          <div className="flex-1 relative bg-black flex flex-col">
            <DialogHeader className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/80 to-transparent">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 ring-2 ring-red-500">
                    <AvatarImage src={authorAvatar} />
                    <AvatarFallback className="bg-red-500 text-white">
                      {authorName?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <DialogTitle className="text-white text-lg flex items-center gap-2">
                      {title}
                      <Badge variant="destructive" className="animate-pulse">
                        🔴 AO VIVO
                      </Badge>
                    </DialogTitle>
                    <p className="text-white/70 text-sm">{authorName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-black/50 text-white">
                    <Users className="h-3 w-3 mr-1" />
                    {viewerCount.toLocaleString()}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20"
                    onClick={() => setIsFullscreen(!isFullscreen)}
                  >
                    {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20"
                    onClick={onClose}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </DialogHeader>

            {/* Video Player */}
            <div className="flex-1 flex items-center justify-center">
              {embedUrl ? (
                <iframe
                  src={`${embedUrl}?autoplay=1`}
                  title={title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              ) : (
                <div className="text-white text-center p-8">
                  <p className="text-lg mb-2">Não foi possível carregar o vídeo</p>
                  <a href={videoUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                    Abrir link original
                  </a>
                </div>
              )}
            </div>

            {/* Floating Reactions */}
            <div className="absolute bottom-20 right-4 pointer-events-none">
              <AnimatePresence>
                {floatingReactions.map(reaction => (
                  <motion.div
                    key={reaction.id}
                    initial={{ opacity: 1, y: 0, scale: 1 }}
                    animate={{ opacity: 0, y: -100, scale: 1.5 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 3, ease: 'easeOut' }}
                    className="absolute bottom-0 right-0 text-3xl"
                  >
                    {reaction.emoji}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Action Bar */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="ghost"
                  size="lg"
                  className="text-white hover:bg-white/20 gap-2"
                  onClick={handleLike}
                >
                  <Heart className="h-5 w-5 fill-red-500 text-red-500" />
                  {likesCount.toLocaleString()}
                </Button>
                <Button
                  variant="ghost"
                  size="lg"
                  className="text-white hover:bg-white/20 gap-2"
                  onClick={handleShare}
                >
                  <Share2 className="h-5 w-5" />
                  Compartilhar
                </Button>
              </div>
            </div>
          </div>

          {/* Chat Section */}
          <div className="w-full lg:w-96 border-l border-border/50 flex flex-col bg-card h-80 lg:h-full">
            <div className="p-4 border-b border-border/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-primary" />
                <span className="font-semibold">Chat ao vivo</span>
              </div>
              <Badge variant="outline">{messages.length} mensagens</Badge>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              <div className="space-y-3">
                <AnimatePresence initial={false}>
                  {messages.map(msg => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-start gap-2"
                    >
                      <Avatar className="h-6 w-6 shrink-0">
                        <AvatarFallback className={`text-[10px] ${msg.isBot ? 'bg-muted' : 'bg-primary text-white'}`}>
                          {msg.author.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <span className={`text-xs font-medium ${msg.isBot ? 'text-muted-foreground' : 'text-primary'}`}>
                          {msg.author}
                        </span>
                        <p className="text-sm text-foreground break-words">{msg.message}</p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </ScrollArea>

            {/* Chat Input */}
            <div className="p-4 border-t border-border/50">
              <div className="flex gap-2">
                <Input
                  placeholder="Envie uma mensagem..."
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1"
                />
                <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
