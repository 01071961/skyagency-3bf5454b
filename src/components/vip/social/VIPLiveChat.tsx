import { useState, useRef, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Send,
  Smile,
  Gift,
  Settings,
  Users,
  MoreVertical,
  Trash2,
  Ban,
  Pin,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import { cn } from '@/lib/utils';
import { useVIPLiveChat } from '@/hooks/useVIPSocial';
import { useAuth } from '@/auth';

interface VIPLiveChatProps {
  postId: string;
  isHost?: boolean;
}

const quickEmojis = ['👏', '❤️', '🔥', '😂', '😮', '👍', '🎉', '💰'];

export function VIPLiveChat({ postId, isHost = false }: VIPLiveChatProps) {
  const { messages, sendMessage } = useVIPLiveChat(postId);
  const { user } = useAuth();
  const [newMessage, setNewMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [viewerCount] = useState(Math.floor(Math.random() * 500) + 50);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Play notification sound
  const playSound = () => {
    if (!isMuted) {
      // Could add actual sound here
    }
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    sendMessage(newMessage);
    setNewMessage('');
    playSound();
  };

  const handleEmojiClick = (emoji: any) => {
    setNewMessage(prev => prev + emoji.emoji);
    setShowEmojiPicker(false);
  };

  const handleQuickEmoji = (emoji: string) => {
    sendMessage(emoji);
    playSound();
  };

  const ChatMessage = memo(function ChatMessage({ message }: { message: any }) {
    const isVIP = message.author?.is_vip;
    const isHighlighted = message.is_highlighted;

    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className={cn(
          'flex items-start gap-2 py-1.5 px-2 rounded group hover:bg-muted/50',
          isHighlighted && 'bg-gradient-to-r from-pink-500/10 to-cyan-500/10 border-l-2 border-primary'
        )}
      >
        <Avatar className="h-6 w-6 shrink-0">
          <AvatarImage src={message.author?.avatar_url || ''} />
          <AvatarFallback className="text-xs">
            {message.author?.full_name?.[0] || 'U'}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={cn(
              'text-xs font-medium',
              isVIP && 'text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-cyan-500'
            )}>
              {message.author?.full_name || 'Usuário'}
            </span>
            {isVIP && (
              <Badge variant="secondary" className="text-[8px] px-1 py-0 h-4 bg-gradient-to-r from-pink-500 to-cyan-500 text-white border-0">
                VIP
              </Badge>
            )}
            <span className={cn(
              'text-sm break-words',
              isHighlighted && 'font-medium'
            )}>
              {message.content}
            </span>
          </div>
        </div>

        {/* Moderation actions for host */}
        {isHost && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Pin className="mr-2 h-4 w-4" />
                Destacar
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">
                <Ban className="mr-2 h-4 w-4" />
                Banir usuário
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </motion.div>
    );
  });

  return (
    <div className="flex flex-col h-full bg-card rounded-xl border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">Chat ao vivo</span>
          <Badge variant="secondary" className="gap-1">
            <Users className="h-3 w-3" />
            {viewerCount}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsMuted(!isMuted)}
          >
            {isMuted ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>
          {isHost && (
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Settings className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-2" ref={scrollRef as any}>
        <div className="py-2 space-y-0.5">
          {messages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <p>Seja o primeiro a mandar uma mensagem!</p>
            </div>
          ) : (
            messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))
          )}
        </div>
      </ScrollArea>

      {/* Quick Emojis */}
      <div className="flex items-center gap-1 px-3 py-2 border-t border-border bg-muted/30">
        {quickEmojis.map((emoji) => (
          <Button
            key={emoji}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-lg hover:scale-125 transition-transform"
            onClick={() => handleQuickEmoji(emoji)}
          >
            {emoji}
          </Button>
        ))}
      </div>

      {/* Input */}
      {user ? (
        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-2">
            <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="shrink-0">
                  <Smile className="h-5 w-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start" side="top">
                <EmojiPicker
                  onEmojiClick={handleEmojiClick}
                  theme={Theme.DARK}
                  width={300}
                  height={350}
                />
              </PopoverContent>
            </Popover>

            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Envie uma mensagem..."
              className="flex-1 h-9 text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />

            <Button variant="ghost" size="icon" className="shrink-0">
              <Gift className="h-5 w-5 text-pink-500" />
            </Button>

            <Button 
              size="icon" 
              className="shrink-0"
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="p-3 border-t border-border text-center">
          <p className="text-sm text-muted-foreground">
            Faça login para participar do chat
          </p>
        </div>
      )}
    </div>
  );
}
