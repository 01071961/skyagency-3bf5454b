import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MessageCircle, Send, Loader2, RefreshCw, X, Star, Phone, Mail, Bell, Volume2, Paperclip, UserCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { TypingIndicator } from "@/components/chat/TypingIndicator";

interface ChatConversation {
  id: string;
  visitor_id: string;
  visitor_name: string | null;
  visitor_email: string | null;
  visitor_phone: string | null;
  subject: string | null;
  status: string;
  rating: number | null;
  rating_comment: string | null;
  is_typing_visitor: boolean;
  assigned_admin_id: string | null;
  transferred_at: string | null;
  created_at: string;
  updated_at: string;
}

interface ChatMessageType {
  id: string;
  conversation_id: string;
  role: string;
  content: string;
  is_ai_response: boolean;
  admin_id: string | null;
  message_type: string;
  file_url: string | null;
  file_name: string | null;
  file_type: string | null;
  file_size: number | null;
  created_at: string;
}

const ChatManager = () => {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [openTabs, setOpenTabs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string>("list");
  const [messagesMap, setMessagesMap] = useState<Record<string, ChatMessageType[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});
  const [isSending, setIsSending] = useState<Record<string, boolean>>({});
  const [typingVisitors, setTypingVisitors] = useState<Record<string, boolean>>({});
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [uploadingFile, setUploadingFile] = useState<Record<string, boolean>>({});
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const messagesEndRef = useRef<Record<string, HTMLDivElement | null>>({});

  const fetchConversations = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("chat_conversations")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      setConversations((data as ChatConversation[]) || []);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      toast.error("Erro ao carregar conversas");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string, skipCache = false) => {
    try {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      
      let messages = (data as ChatMessageType[]) || [];
      
      // Deduplicar mensagens antigas que foram gravadas em duplicidade
      const seen = new Set<string>();
      messages = messages.filter(msg => {
        const key = `${msg.role}:${msg.content}:${msg.created_at}:${msg.message_type || "text"}:${msg.file_url || ""}`;
        if (seen.has(key)) {
          console.log("[ChatManager] Removendo duplicata histórica:", msg.id);
          return false;
        }
        seen.add(key);
        return true;
      });
      
      // Pre-populate processed IDs to prevent duplicates from Realtime
      messages.forEach(msg => {
        processedMessageIds.current.add(msg.id);
        processedContentHashes.current.add(generateContentHash(msg));
      });
      
      setMessagesMap(prev => ({ ...prev, [conversationId]: messages }));
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const openConversation = async (conversation: ChatConversation) => {
    if (!openTabs.includes(conversation.id)) {
      if (openTabs.length >= 5) {
        toast.error("Máximo de 5 conversas abertas");
        return;
      }
      setOpenTabs(prev => [...prev, conversation.id]);
    }
    setActiveTab(conversation.id);
    await fetchMessages(conversation.id);
  };

  const closeTab = (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenTabs(prev => prev.filter(id => id !== conversationId));
    if (activeTab === conversationId) {
      setActiveTab(openTabs.length > 1 ? openTabs.find(id => id !== conversationId) || "list" : "list");
    }
  };

  const handleSendReply = async (conversationId: string) => {
    const text = replyTexts[conversationId]?.trim();
    if (!text) return;

    setIsSending(prev => ({ ...prev, [conversationId]: true }));
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("chat_messages").insert({
        conversation_id: conversationId,
        role: "admin",
        content: text,
        is_ai_response: false,
        admin_id: user?.id,
      });
      if (error) throw error;

      // Update typing
      await supabase.from("chat_conversations").update({ is_typing_admin: false }).eq("id", conversationId);

      toast.success("Resposta enviada!");
      setReplyTexts(prev => ({ ...prev, [conversationId]: "" }));
      await fetchMessages(conversationId);
    } catch (error) {
      console.error("Error sending reply:", error);
      toast.error("Erro ao enviar resposta");
    } finally {
      setIsSending(prev => ({ ...prev, [conversationId]: false }));
    }
  };

  const handleFileUpload = async (conversationId: string, file: File) => {
    setUploadingFile(prev => ({ ...prev, [conversationId]: true }));
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const filePath = `${conversationId}/${Date.now()}_${file.name}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("chat-attachments")
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("chat-attachments")
        .getPublicUrl(filePath);

      const { error } = await supabase.from("chat_messages").insert({
        conversation_id: conversationId,
        role: "admin",
        content: `Arquivo enviado: ${file.name}`,
        is_ai_response: false,
        admin_id: user?.id,
        message_type: "file",
        file_url: publicUrl,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
      });

      if (error) throw error;
      toast.success("Arquivo enviado!");
      await fetchMessages(conversationId);
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Erro ao enviar arquivo");
    } finally {
      setUploadingFile(prev => ({ ...prev, [conversationId]: false }));
    }
  };

  const handleTakeOver = async (conversationId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("chat_conversations").update({ 
        assigned_admin_id: user?.id,
        transferred_at: new Date().toISOString()
      }).eq("id", conversationId);
      
      // Send system message
      await supabase.from("chat_messages").insert({
        conversation_id: conversationId,
        role: "system",
        content: "Um atendente assumiu a conversa. Como posso ajudar?",
        is_ai_response: false,
        admin_id: user?.id,
        message_type: "system",
      });

      toast.success("Conversa assumida!");
      fetchConversations();
      await fetchMessages(conversationId);
    } catch (error) {
      toast.error("Erro ao assumir conversa");
    }
  };

  const handleEndConversation = async (conversationId: string) => {
    try {
      await supabase.from("chat_conversations").update({ status: "closed", closed_at: new Date().toISOString() }).eq("id", conversationId);
      toast.success("Conversa encerrada");
      fetchConversations();
    } catch (error) {
      toast.error("Erro ao encerrar conversa");
    }
  };

  const playNotificationSound = useCallback(() => {
    if (soundEnabled && audioRef.current) {
      audioRef.current.play().catch(() => {});
    }
  }, [soundEnabled]);

  // Track processed message IDs and content hashes to prevent duplicates
  const processedMessageIds = useRef<Set<string>>(new Set());
  const processedContentHashes = useRef<Set<string>>(new Set());

  // Generate a content hash to detect duplicate content even with different IDs
  const generateContentHash = (msg: ChatMessageType) => {
    return `${msg.conversation_id}:${msg.role}:${msg.content.substring(0, 100)}`;
  };

  useEffect(() => {
    fetchConversations();
    const channelId = `admin-chat-updates-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const channel = supabase
      .channel(channelId)
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_conversations" }, (payload) => {
        fetchConversations();
        if (payload.eventType === "UPDATE" && (payload.new as any).is_typing_visitor !== undefined) {
          setTypingVisitors(prev => ({ ...prev, [(payload.new as any).id]: (payload.new as any).is_typing_visitor }));
        }
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" }, (payload) => {
        const msg = payload.new as ChatMessageType;
        const contentHash = generateContentHash(msg);
        
        // Triple-check deduplication: by ID and by content hash
        if (processedMessageIds.current.has(msg.id)) {
          console.log("[ChatManager] Duplicate message ID ignored:", msg.id);
          return;
        }
        
        // Check if same content was received recently (within 5 seconds window)
        if (processedContentHashes.current.has(contentHash)) {
          console.log("[ChatManager] Duplicate content ignored:", contentHash);
          return;
        }
        
        processedMessageIds.current.add(msg.id);
        processedContentHashes.current.add(contentHash);
        
        // Clean up old IDs and hashes to prevent memory leak
        setTimeout(() => {
          processedMessageIds.current.delete(msg.id);
          processedContentHashes.current.delete(contentHash);
        }, 30000);
        
        if (msg.role === "user") {
          playNotificationSound();
        }
        
        setMessagesMap(prev => {
          const existing = prev[msg.conversation_id] || [];
          // Final check: ensure message doesn't already exist in state
          if (existing.some(m => m.id === msg.id || (m.role === msg.role && m.content === msg.content && Math.abs(new Date(m.created_at).getTime() - new Date(msg.created_at).getTime()) < 5000))) {
            console.log("[ChatManager] Message already exists in state, skipping:", msg.id);
            return prev;
          }
          return { ...prev, [msg.conversation_id]: [...existing, msg] };
        });
      })
      .subscribe();
      
    return () => { 
      supabase.removeChannel(channel);
      // Clear cache on unmount
      processedMessageIds.current.clear();
      processedContentHashes.current.clear();
    };
  }, [playNotificationSound]);

  const getConversation = (id: string) => conversations.find(c => c.id === id);

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      <audio ref={audioRef} src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleQsNjOvk4LY=" />
      
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Chat ao Vivo</h2>
          <p className="text-muted-foreground">{conversations.filter(c => c.status === "active").length} conversa(s) ativa(s)</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => setSoundEnabled(!soundEnabled)} title={soundEnabled ? "Desativar som" : "Ativar som"}>
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
          </Button>
          <Button variant="outline" onClick={fetchConversations}><RefreshCw className="h-4 w-4 mr-2" />Atualizar</Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="list">Lista</TabsTrigger>
          {openTabs.map(id => {
            const conv = getConversation(id);
            return (
              <TabsTrigger key={id} value={id} className="relative pr-8">
                {conv?.visitor_name?.split(" ")[0] || id.slice(0, 6)}
                {typingVisitors[id] && <span className="ml-1 text-xs text-primary">...</span>}
                <button onClick={(e) => closeTab(id, e)} className="absolute right-1 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded">
                  <X className="h-3 w-3" />
                </button>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="list" className="mt-4">
          {conversations.length === 0 ? (
            <Card><CardContent className="flex flex-col items-center justify-center py-12"><MessageCircle className="h-12 w-12 text-muted-foreground mb-4" /><p className="text-muted-foreground">Nenhuma conversa</p></CardContent></Card>
          ) : (
            <div className="grid gap-3">
              {conversations.map((conv, i) => (
                <motion.div key={conv.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                  <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => openConversation(conv)}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                            <MessageCircle className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{conv.visitor_name || `Visitante ${conv.visitor_id.slice(0, 8)}`}</p>
                            <p className="text-sm text-muted-foreground">{conv.subject || "Sem assunto"}</p>
                            <p className="text-xs text-muted-foreground">{format(new Date(conv.created_at), "dd/MM HH:mm", { locale: ptBR })}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {conv.rating && <div className="flex items-center gap-1"><Star className="h-4 w-4 text-yellow-400 fill-yellow-400" /><span className="text-sm">{conv.rating}</span></div>}
                          <Badge variant={conv.status === "active" ? "default" : "secondary"}>{conv.status === "active" ? "Ativa" : "Encerrada"}</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        {openTabs.map(id => {
          const conv = getConversation(id);
          const msgs = messagesMap[id] || [];
          return (
            <TabsContent key={id} value={id} className="mt-4">
              <Card>
                <CardContent className="p-4">
                  {/* Visitor Info */}
                  <div className="flex items-center justify-between mb-4 pb-4 border-b">
                    <div>
                      <h3 className="font-semibold">{conv?.visitor_name || "Visitante"}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {conv?.visitor_email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{conv.visitor_email}</span>}
                        {conv?.visitor_phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{conv.visitor_phone}</span>}
                      </div>
                    </div>
                    {conv?.status === "active" && (
                      <Button variant="destructive" size="sm" onClick={() => handleEndConversation(id)}>Encerrar</Button>
                    )}
                  </div>

                  {/* Messages */}
                  <ScrollArea className="h-[300px] sm:h-[400px] pr-2 sm:pr-4">
                    <div className="space-y-3 sm:space-y-4">
                      {msgs.map(msg => (
                        <ChatMessage
                          key={msg.id}
                          role={msg.role as any}
                          content={msg.content}
                          timestamp={msg.created_at}
                          isAiResponse={msg.is_ai_response}
                          fileUrl={msg.file_url || undefined}
                          fileName={msg.file_name || undefined}
                          fileType={msg.file_type || undefined}
                          fileSize={msg.file_size || undefined}
                        />
                      ))}
                      <AnimatePresence>
                        {typingVisitors[id] && <TypingIndicator label="Visitante digitando..." />}
                      </AnimatePresence>
                    </div>
                  </ScrollArea>

                  {/* Reply Input */}
                  {conv?.status === "active" && (
                    <div className="flex flex-col gap-2 mt-4 pt-4 border-t">
                      <div className="flex gap-2">
                        <input
                          type="file"
                          ref={(el) => { fileInputRefs.current[id] = el; }}
                          className="hidden"
                          accept="image/*,.pdf,.doc,.docx,.txt"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(id, file);
                            e.target.value = "";
                          }}
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => fileInputRefs.current[id]?.click()}
                          disabled={uploadingFile[id]}
                        >
                          {uploadingFile[id] ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
                        </Button>
                        <Input
                          value={replyTexts[id] || ""}
                          onChange={(e) => setReplyTexts(prev => ({ ...prev, [id]: e.target.value }))}
                          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendReply(id)}
                          placeholder="Digite sua resposta..."
                          disabled={isSending[id]}
                          className="flex-1"
                        />
                        <Button onClick={() => handleSendReply(id)} disabled={!replyTexts[id]?.trim() || isSending[id]}>
                          {isSending[id] ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        </Button>
                      </div>
                      {!conv.assigned_admin_id && (
                        <Button variant="secondary" onClick={() => handleTakeOver(id)} className="w-full">
                          <UserCheck className="h-4 w-4 mr-2" />Assumir Conversa
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
};

export default ChatManager;
