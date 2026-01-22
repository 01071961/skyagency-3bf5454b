import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Trash2,
  Star,
  Smile,
  MessageSquare,
  Users,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import { toast } from 'sonner';
import { playNotificationBeep } from '@/lib/notificationSound';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/auth';

interface ChatMessage {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  user?: {
    name: string;
    avatar_url: string;
    plan?: string;
  };
}

interface LiveChatAdvancedProps {
  liveId: string;
  isLive?: boolean;
  viewerCount?: number;
  className?: string;
}

export function LiveChatAdvanced({ 
  liveId, 
  isLive = true, 
  viewerCount = 0,
  className = ''
}: LiveChatAdvancedProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [userProfile, setUserProfile] = useState<{ plan?: string } | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize audio context for notifications
  useEffect(() => {
    return () => {
      audioContextRef.current?.close();
    };
  }, []);

  // Fetch user profile for VIP check
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('profiles')
        .select('plan')
        .eq('user_id', user.id)
        .single();
      
      setUserProfile(data);
    };
    
    fetchUserProfile();
  }, [user]);

  // Fetch initial messages
  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('live_chat_messages')
        .select('*')
        .eq('video_id', liveId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      // Fetch profiles for all messages
      const userIds = [...new Set((data || []).map(m => m.user_id))];
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, name, avatar_url, plan')
          .in('user_id', userIds);

        const profileMap = new Map(
          profiles?.map(p => [p.user_id, { name: p.name, avatar_url: p.avatar_url, plan: p.plan }])
        );

        setMessages((data || []).map(msg => ({
          ...msg,
          user: profileMap.get(msg.user_id),
        })));
      } else {
        setMessages(data || []);
      }
    };

    fetchMessages();
  }, [liveId]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel(`live_chat_advanced:${liveId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'live_chat_messages',
          filter: `video_id=eq.${liveId}`,
        },
        async (payload) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('name, avatar_url, plan')
            .eq('user_id', payload.new.user_id)
            .single();

          const newMsg: ChatMessage = {
            ...payload.new as ChatMessage,
            user: profile || undefined,
          };

          setMessages(prev => [...prev, newMsg]);

          // Play notification sound if enabled and not from current user
          if (soundEnabled && payload.new.user_id !== user?.id) {
            if (!audioContextRef.current) {
              audioContextRef.current = new AudioContext();
            }
            playNotificationBeep(audioContextRef.current);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'live_chat_messages',
          filter: `video_id=eq.${liveId}`,
        },
        (payload) => {
          setMessages(prev => prev.filter(m => m.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [liveId, soundEnabled, user?.id]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || sending) return;

    setSending(true);
    const { error } = await supabase
      .from('live_chat_messages')
      .insert({
        video_id: liveId,
        user_id: user.id,
        content: newMessage.trim(),
      });

    if (error) {
      console.error('Error sending message:', error);
      toast.error('Erro ao enviar mensagem');
    } else {
      setNewMessage('');
      setIsEmojiPickerOpen(false);
    }
    setSending(false);
  };

  const addEmoji = (emojiData: EmojiClickData) => {
    setNewMessage(prev => prev + emojiData.emoji);
  };

  const deleteMessage = async (msgId: string) => {
    const canModerate = userProfile?.plan === 'vip' || 
                       userProfile?.plan === 'premium' || 
                       userProfile?.plan === 'admin';
    
    const msg = messages.find(m => m.id === msgId);
    const isOwnMessage = msg?.user_id === user?.id;

    if (!canModerate && !isOwnMessage) {
      toast.error('Sem permissão para apagar esta mensagem');
      return;
    }

    const { error } = await supabase
      .from('live_chat_messages')
      .delete()
      .eq('id', msgId);

    if (error) {
      console.error('Error deleting message:', error);
      toast.error('Erro ao apagar mensagem');
    } else {
      toast.success('Mensagem apagada');
    }
  };

  const isVIP = (plan?: string) => {
    return plan === 'vip' || plan === 'premium' || plan === 'admin';
  };

  const canModerate = userProfile?.plan && isVIP(userProfile.plan);

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className={`flex flex-col bg-card ${className}`}>
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="font-semibold flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Chat ao Vivo
        </h2>
        <div className="flex items-center gap-2">
          {isLive && (
            <Badge variant="secondary" className="gap-1">
              <Users className="h-3 w-3" />
              {viewerCount}
            </Badge>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? 'Desativar som' : 'Ativar som'}
          >
            {soundEnabled ? (
              <Volume2 className="h-4 w-4" />
            ) : (
              <VolumeX className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-3">
          <AnimatePresence>
            {messages.map((msg) => {
              const msgIsVIP = isVIP(msg.user?.plan);
              const isOwn = msg.user_id === user?.id;
              
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className={`flex gap-2 p-2 rounded-lg transition-colors group ${
                    msgIsVIP 
                      ? 'bg-primary/10 border border-primary/20' 
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={msg.user?.avatar_url} />
                    <AvatarFallback className={msgIsVIP ? 'bg-primary text-primary-foreground' : ''}>
                      {msg.user?.name?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-sm font-medium truncate ${
                        msgIsVIP ? 'text-primary' : 'text-foreground'
                      }`}>
                        {msg.user?.name || 'Anônimo'}
                      </span>
                      
                      {msgIsVIP && (
                        <Badge variant="default" className="h-5 gap-1 bg-gradient-to-r from-amber-500 to-yellow-400 text-white">
                          <Star className="h-3 w-3 fill-current" />
                          VIP
                        </Badge>
                      )}
                      
                      <span className="text-xs text-muted-foreground">
                        {formatTime(msg.created_at)}
                      </span>
                      
                      {/* Delete button - visible on hover for moderators or own messages */}
                      {user && (canModerate || isOwn) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity ml-auto"
                          onClick={() => deleteMessage(msg.id)}
                          title="Apagar mensagem"
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      )}
                    </div>
                    
                    <p className="text-sm break-words mt-0.5">{msg.content}</p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Nenhuma mensagem ainda</p>
              <p className="text-sm">Seja o primeiro a comentar!</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      {isLive ? (
        <div className="p-4 border-t">
          {user ? (
            <div className="flex gap-2">
              <Popover open={isEmojiPickerOpen} onOpenChange={setIsEmojiPickerOpen}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="flex-shrink-0">
                    <Smile className="h-5 w-5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" side="top" align="start">
                  <EmojiPicker
                    onEmojiClick={addEmoji}
                    theme={Theme.AUTO}
                    lazyLoadEmojis
                    searchPlaceholder="Buscar emoji..."
                    width={300}
                    height={400}
                  />
                </PopoverContent>
              </Popover>
              
              <Input
                placeholder="Enviar mensagem..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                disabled={sending}
                className="flex-1"
              />
              
              <Button 
                onClick={sendMessage} 
                disabled={!newMessage.trim() || sending}
                className="flex-shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="text-center py-2 text-muted-foreground">
              <p className="text-sm">Faça login para participar do chat</p>
            </div>
          )}
        </div>
      ) : (
        <div className="p-4 border-t text-center text-muted-foreground">
          <p className="text-sm">Chat encerrado - esta live foi finalizada</p>
        </div>
      )}
    </div>
  );
}
