import { useState, useRef, useEffect, useCallback } from "react";
import { X, Send, Loader2, PhoneOff, WifiOff, AlertTriangle, MessageCircle, Volume2, VolumeX, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PreChatForm, PreChatFormData } from "./chat/PreChatForm";
import { ChatMessage } from "./chat/ChatMessage";
import { TypingIndicator } from "./chat/TypingIndicator";
import { RatingModal } from "./chat/RatingModal";
import { FileUpload } from "./chat/FileUpload";
import { ChatResumePrompt } from "./chat/ChatResumePrompt";
import { ChatEndedPrompt } from "./chat/ChatEndedPrompt";
import { useChatRealtime } from "@/hooks/useChatRealtime";
import { useChatAbandonment } from "@/hooks/useChatAbandonment";
import { useChatConnection } from "@/hooks/useChatConnection";
import { useChatSession, ChatSession } from "@/hooks/useChatSession";
import { useAnonymousAuth } from "@/hooks/useAnonymousAuth";
import logo from "@/assets/logo.png";

interface Message {
  id?: string;
  role: "user" | "assistant" | "admin" | "system";
  content: string;
  created_at?: string;
  is_ai_response?: boolean;
  file_url?: string;
  file_name?: string;
  file_type?: string;
  file_size?: number;
}

// Notification sound as data URL (short beep)
const NOTIFICATION_SOUND = "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleQsNjOvk4LY=";

const LiveChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [formCompleted, setFormCompleted] = useState(false);
  const [formData, setFormData] = useState<PreChatFormData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isTypingAdmin, setIsTypingAdmin] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [conversationStatus, setConversationStatus] = useState<string>("active");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [partialFormData, setPartialFormData] = useState<Partial<PreChatFormData>>({});
  const [isAdminTakeover, setIsAdminTakeover] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [showEndedPrompt, setShowEndedPrompt] = useState(false);

  // Session management hook
  const { savedSession, isLoading: isSessionLoading, hasResumableSession, saveSession, clearSession } = useChatSession();

  // Anonymous authentication for secure chat
  const { user: authUser, isLoading: isAuthLoading, ensureAuthenticated } = useAnonymousAuth();

  // Use auth user ID if available, fallback to localStorage for backward compatibility
  const [visitorId, setVisitorId] = useState<string>(() => {
    const stored = localStorage.getItem("sky_visitor_id");
    if (stored) return stored;
    const newId = crypto.randomUUID();
    localStorage.setItem("sky_visitor_id", newId);
    return newId;
  });

  // Update visitorId when auth user is available
  useEffect(() => {
    if (authUser?.id) {
      setVisitorId(authUser.id);
    }
  }, [authUser?.id]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const processedMessageIds = useRef<Set<string>>(new Set());
  const isFirstLoad = useRef(true);

  // Check for resumable session when chat opens
  useEffect(() => {
    if (isOpen && !isSessionLoading && hasResumableSession && !formCompleted) {
      setShowResumePrompt(true);
    }
  }, [isOpen, isSessionLoading, hasResumableSession, formCompleted]);

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    if (soundEnabled && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  }, [soundEnabled]);

  // Realtime hook with improved deduplication
  const { setTyping } = useChatRealtime({
    conversationId,
    visitorId,
    onNewMessage: useCallback((message: any) => {
      // Only process messages from others (not user)
      if (message.role === "user") return;
      
      // Skip if already processed by ID
      if (message.id && processedMessageIds.current.has(message.id)) {
        return;
      }

      setMessages(prev => {
        // Check for duplicates by ID
        if (message.id && prev.some(m => m.id === message.id)) {
          return prev;
        }

        // Check for duplicates by content match (for messages added before DB save)
        const existingIndex = prev.findIndex(m => 
          !m.id && 
          m.role === message.role && 
          m.content === message.content
        );

        if (existingIndex !== -1) {
          // Update existing message with ID
          if (message.id) {
            processedMessageIds.current.add(message.id);
          }
          return prev.map((m, i) => 
            i === existingIndex ? { ...m, id: message.id } : m
          );
        }

        // New message - add it
        if (message.id) {
          processedMessageIds.current.add(message.id);
        }

        // Play sound if chat is minimized or tab is hidden
        if (!isOpen || document.hidden) {
          playNotificationSound();
        }

        return [...prev, message];
      });
    }, [isOpen, playNotificationSound]),
    onTypingChange: useCallback((isTyping: boolean, isAdmin: boolean) => {
      if (isAdmin) {
        setIsTypingAdmin(isTyping);
      }
    }, []),
    onConversationUpdate: useCallback((conv: any) => {
      setConversationStatus(conv.status);
      if (conv.assigned_admin_id) {
        setIsAdminTakeover(true);
      } else {
        setIsAdminTakeover(false);
      }
      if (conv.status === "closed" && !conv.rating) {
        setShowRating(true);
        setShowEndedPrompt(true);
      }
    }, []),
  });

  // Connection monitoring hook
  const { status: connectionStatus, bucketAvailable, forceReconnect, isConnecting } = useChatConnection({
    conversationId,
    enabled: isOpen && formCompleted,
  });

  // Abandonment detection hook
  const { updateActivity } = useChatAbandonment({
    conversationId,
    visitorId,
    isActive: isOpen && formCompleted,
  });

  // Smooth scroll to bottom
  const scrollToBottom = useCallback((smooth = true) => {
    if (scrollRef.current) {
      const scrollElement = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTo({
          top: scrollElement.scrollHeight,
          behavior: smooth && !isFirstLoad.current ? "smooth" : "auto",
        });
      }
    }
  }, []);

  // Auto-scroll on new messages
  useEffect(() => {
    scrollToBottom(!isFirstLoad.current);
    if (messages.length > 0) {
      isFirstLoad.current = false;
    }
  }, [messages, isTypingAdmin, scrollToBottom]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && formCompleted && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, formCompleted]);

  // Save partial form data on close (abandonment tracking)
  useEffect(() => {
    const handleBeforeUnload = async () => {
      const hasPartialData = Object.values(partialFormData).some(v => v && v.length > 0);
      if (hasPartialData && !formCompleted) {
        await supabase.from("abandoned_forms").insert({
          visitor_id: visitorId,
          name: partialFormData.name || null,
          email: partialFormData.email || null,
          phone: partialFormData.phone || null,
          subject: partialFormData.subject || null,
        });
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [partialFormData, formCompleted, visitorId]);

  // Resume previous conversation
  const handleResumeConversation = async () => {
    if (!savedSession) return;

    setIsLoading(true);
    setShowResumePrompt(false);

    try {
      // Load existing messages
      const { data: existingMessages } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("conversation_id", savedSession.conversationId)
        .order("created_at", { ascending: true });

      if (existingMessages) {
        // Deduplicar mensagens históricas gravadas em duplicidade
        const seen = new Set<string>();
        const deduped = existingMessages.filter((m: any) => {
          const key = `${m.role}:${m.content}:${m.created_at}:${m.message_type || "text"}:${m.file_url || ""}`;
          if (seen.has(key)) {
            console.log("[LiveChat] Removendo duplicata histórica:", m.id);
            return false;
          }
          seen.add(key);
          return true;
        });

        deduped.forEach((m: any) => processedMessageIds.current.add(m.id));
        setMessages(deduped.map((m: any) => ({
          id: m.id,
          role: m.role as Message["role"],
          content: m.content,
          created_at: m.created_at,
          is_ai_response: m.is_ai_response,
          file_url: m.file_url ?? undefined,
          file_name: m.file_name ?? undefined,
          file_type: m.file_type ?? undefined,
          file_size: m.file_size ?? undefined,
        })));
      }

      // If conversation was closed, reopen it
      if (savedSession.status === "closed") {
        await supabase
          .from("chat_conversations")
          .update({ status: "active", closed_at: null })
          .eq("id", savedSession.conversationId);

        // Add system message about resuming
        const resumeMsg: Message = {
          id: `system-resume-${Date.now()}`,
          role: "assistant",
          content: `Olá ${savedSession.visitorName}! Bem-vindo de volta. Como posso ajudar?`,
          created_at: new Date().toISOString(),
          is_ai_response: true,
        };

        const { data: savedMsg } = await supabase.from("chat_messages").insert({
          conversation_id: savedSession.conversationId,
          role: "assistant",
          content: resumeMsg.content,
          is_ai_response: true,
        }).select().single();

        if (savedMsg) {
          processedMessageIds.current.add(savedMsg.id);
          setMessages(prev => [...prev, { ...resumeMsg, id: savedMsg.id }]);
        }
      }

      setConversationId(savedSession.conversationId);
      setFormData({
        name: savedSession.visitorName,
        email: savedSession.visitorEmail,
        phone: savedSession.visitorPhone || "",
        subject: savedSession.subject,
      });
      setFormCompleted(true);
      setConversationStatus("active");
      setShowEndedPrompt(false);

      // Update session activity
      saveSession({ ...savedSession, status: "active", lastActivityAt: new Date().toISOString() });
    } catch (error) {
      console.error("Error resuming conversation:", error);
      toast.error("Erro ao retomar conversa. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  // Start new conversation (clear previous)
  const handleStartNewChat = () => {
    clearSession();
    setShowResumePrompt(false);
    setShowEndedPrompt(false);
    setFormCompleted(false);
    setFormData(null);
    setMessages([]);
    setConversationId(null);
    setConversationStatus("active");
    processedMessageIds.current.clear();
    isFirstLoad.current = true;
  };

  // Handle form submission
  const handleFormSubmit = async (data: PreChatFormData) => {
    setFormData(data);
    setIsLoading(true);

    try {
      // Ensure user is authenticated (anonymously if needed) before creating conversation
      const authenticatedUser = await ensureAuthenticated();
      if (!authenticatedUser) {
        throw new Error("Falha na autenticação. Por favor, tente novamente.");
      }

      const { data: conversation, error } = await supabase
        .from("chat_conversations")
        .insert({
          visitor_id: authenticatedUser.id,
          user_id: authenticatedUser.id,
          visitor_name: data.name,
          visitor_email: data.email,
          visitor_phone: data.phone,
          subject: data.subject,
          form_completed: true,
          status: "active",
        })
        .select()
        .single();

      if (error) throw error;

      setConversationId(conversation.id);
      setFormCompleted(true);

      // Save session for future resume
      saveSession({
        conversationId: conversation.id,
        visitorId: authenticatedUser.id,
        visitorName: data.name,
        visitorEmail: data.email,
        visitorPhone: data.phone,
        subject: data.subject,
        status: "active",
        formCompleted: true,
        lastActivityAt: new Date().toISOString(),
      });

      // Send confirmation email
      supabase.functions.invoke("chat-notifications", {
        body: {
          type: "confirmation",
          email: data.email,
          name: data.name,
          subject: data.subject,
        },
      }).catch(console.warn);

      // Create welcome message
      const welcomeContent = `Olá ${data.name}! 👋 Sou a assistente virtual da SKY BRASIL. Vi que você está interessado em "${data.subject}". Como posso ajudar?`;

      // Save to DB and add to state with ID to prevent Realtime duplicate
      const { data: savedMessage } = await supabase.from("chat_messages").insert({
        conversation_id: conversation.id,
        user_id: authenticatedUser.id,
        role: "assistant",
        content: welcomeContent,
        is_ai_response: true,
      }).select().single();

      if (savedMessage) {
        processedMessageIds.current.add(savedMessage.id);
        setMessages([{
          id: savedMessage.id,
          role: "assistant",
          content: welcomeContent,
          created_at: savedMessage.created_at,
          is_ai_response: true,
        }]);
      }

    } catch (error) {
      console.error("Error starting chat:", error);
      toast.error("Erro ao iniciar conversa. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  // Stream chat with AI
  const streamChat = useCallback(async (messagesToSend: Message[]) => {
    const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-assistant`;

    // Get current session for auth token
    const { data: { session } } = await supabase.auth.getSession();
    const authToken = session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        messages: messagesToSend.map(m => ({ role: m.role === "admin" ? "assistant" : m.role, content: m.content })),
        conversationId,
        visitorId,
        visitorName: formData?.name,
      }),
    });

    if (!resp.ok) {
      const errorData = await resp.json().catch(() => ({}));
      if (errorData.skipped) {
        console.log("[LiveChat] AI skipped:", errorData.reason);
        return "";
      }
      throw new Error(errorData.error || "Erro ao enviar mensagem");
    }

    if (!resp.body) throw new Error("No response body");

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let assistantContent = "";

    // Add placeholder message for streaming
    const tempId = `temp-${Date.now()}`;
    setMessages(prev => [...prev, { role: "assistant", content: "", is_ai_response: true, id: tempId }]);

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") break;

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            assistantContent += content;
            setMessages(prev => prev.map(m => 
              m.id === tempId ? { ...m, content: assistantContent } : m
            ));
          }
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }

    // Save to DB and update message with real ID
    if (assistantContent && conversationId) {
      const { data: savedMsg } = await supabase.from("chat_messages").insert({
        conversation_id: conversationId,
        user_id: authUser?.id || null,
        role: "assistant",
        content: assistantContent,
        is_ai_response: true,
      }).select().single();

      if (savedMsg) {
        processedMessageIds.current.add(savedMsg.id);
        setMessages(prev => prev.map(m => 
          m.id === tempId ? { ...m, id: savedMsg.id } : m
        ));
      }
    }

    return assistantContent;
  }, [conversationId, visitorId, formData, authUser?.id]);

  // Upload file
  const uploadFile = async (file: File): Promise<{ url: string; path: string } | null> => {
    if (!conversationId) return null;

    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${conversationId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("chat-attachments")
        .upload(filePath, file, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("chat-attachments")
        .getPublicUrl(filePath);

      return { url: publicUrl, path: filePath };
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Erro ao enviar arquivo.");
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  // Send message
  const handleSend = async () => {
    if ((!input.trim() && !pendingFile) || isLoading || !conversationId) return;

    const messageContent = input.trim();
    let fileData: { url: string; path: string } | null = null;

    if (pendingFile) {
      fileData = await uploadFile(pendingFile);
      if (!fileData && !messageContent) return;
    }

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: messageContent,
      created_at: new Date().toISOString(),
      file_url: fileData?.url,
      file_name: pendingFile?.name,
      file_type: pendingFile?.type,
      file_size: pendingFile?.size,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setPendingFile(null);
    setIsLoading(true);

    await setTyping(false);

    try {
      // Save user message
      const { data: savedUserMsg } = await supabase.from("chat_messages").insert({
        conversation_id: conversationId,
        user_id: authUser?.id || null,
        role: "user",
        content: messageContent,
        is_ai_response: false,
        file_url: fileData?.url,
        file_name: pendingFile?.name,
        file_type: pendingFile?.type,
        file_size: pendingFile?.size,
      }).select().single();

      if (savedUserMsg) {
        processedMessageIds.current.add(savedUserMsg.id);
        setMessages(prev => prev.map(m => 
          m.id === userMessage.id ? { ...m, id: savedUserMsg.id } : m
        ));
      }

      updateActivity();

      // Update session activity
      if (savedSession) {
        saveSession({ ...savedSession, lastActivityAt: new Date().toISOString() });
      }

      // Check if user wants human
      const wantsHuman = /falar.*(humano|atendente|pessoa)|quero.*atendente|preciso.*humano/i.test(messageContent);
      
      if (wantsHuman) {
        const { data: availability } = await supabase
          .from("admin_availability")
          .select("*")
          .eq("status", "online")
          .limit(1);

        if (availability && availability.length > 0) {
          await supabase
            .from("chat_conversations")
            .update({
              transferred_at: new Date().toISOString(),
              assigned_admin_id: availability[0].admin_id,
            })
            .eq("id", conversationId);

          const transferMsg: Message = {
            id: `system-${Date.now()}`,
            role: "assistant",
            content: "Entendido! Estou transferindo você para um de nossos atendentes. Por favor, aguarde um momento.",
            created_at: new Date().toISOString(),
            is_ai_response: true,
          };
          setMessages(prev => [...prev, transferMsg]);

          const { data: savedTransfer } = await supabase.from("chat_messages").insert({
            conversation_id: conversationId,
            role: "assistant",
            content: transferMsg.content,
            is_ai_response: true,
            message_type: "system",
          }).select().single();

          if (savedTransfer) {
            processedMessageIds.current.add(savedTransfer.id);
            setMessages(prev => prev.map(m => 
              m.id === transferMsg.id ? { ...m, id: savedTransfer.id } : m
            ));
          }

          supabase.functions.invoke("chat-notifications", {
            body: {
              type: "transfer",
              conversationId,
              visitorName: formData?.name,
              adminId: availability[0].admin_id,
            },
          }).catch(console.warn);

        } else {
          const noAdminMsg: Message = {
            id: `noAdmin-${Date.now()}`,
            role: "assistant",
            content: "Nossos atendentes não estão disponíveis no momento. Posso tentar ajudar com sua dúvida, ou você pode deixar seu contato para retornarmos em breve. Deseja continuar comigo?",
            created_at: new Date().toISOString(),
            is_ai_response: true,
          };
          setMessages(prev => [...prev, noAdminMsg]);

          const { data: savedNoAdmin } = await supabase.from("chat_messages").insert({
            conversation_id: conversationId,
            role: "assistant",
            content: noAdminMsg.content,
            is_ai_response: true,
          }).select().single();

          if (savedNoAdmin) {
            processedMessageIds.current.add(savedNoAdmin.id);
            setMessages(prev => prev.map(m => 
              m.id === noAdminMsg.id ? { ...m, id: savedNoAdmin.id } : m
            ));
          }
        }
      } else {
        // Only call AI if no admin takeover
        if (!isAdminTakeover) {
          const { data: currentConv } = await supabase
            .from("chat_conversations")
            .select("assigned_admin_id")
            .eq("id", conversationId)
            .single();

          if (!currentConv?.assigned_admin_id) {
            await streamChat([...messages, userMessage]);
          } else {
            setIsAdminTakeover(true);
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao enviar mensagem");
    } finally {
      setIsLoading(false);
    }
  };

  // Typing indicator handler
  const handleInputChange = (value: string) => {
    setInput(value);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (value.trim()) {
      setTyping(true);
      typingTimeoutRef.current = setTimeout(() => {
        setTyping(false);
      }, 2000);
    } else {
      setTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Rating
  const handleRatingSubmit = async (rating: number, comment: string) => {
    if (!conversationId) return;

    await supabase
      .from("chat_conversations")
      .update({ rating, rating_comment: comment || null })
      .eq("id", conversationId);

    if (formData?.email) {
      supabase.functions.invoke("chat-notifications", {
        body: {
          type: "thanks",
          email: formData.email,
          name: formData.name,
          rating,
        },
      }).catch(console.warn);
    }

    toast.success("Obrigado pela sua avaliação!");
  };

  // End conversation
  const handleEndChat = async () => {
    if (!conversationId) return;

    await supabase
      .from("chat_conversations")
      .update({ status: "closed", closed_at: new Date().toISOString() })
      .eq("id", conversationId);

    // Update saved session
    if (savedSession) {
      saveSession({ ...savedSession, status: "closed" });
    }

    setShowRating(true);
    setShowEndedPrompt(true);
  };

  return (
    <>
      {/* Audio element for notifications */}
      <audio ref={audioRef} src={NOTIFICATION_SOUND} preload="auto" />

      {/* Floating Chat Button - Premium Liquid Glass Design */}
      <motion.div
        initial={false}
        animate={{ 
          scale: isOpen ? 0 : 1, 
          opacity: isOpen ? 0 : 1,
          pointerEvents: isOpen ? "none" : "auto"
        }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50"
      >
        <motion.button
          onClick={() => setIsOpen(true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative h-14 w-14 sm:h-16 sm:w-16 rounded-full shadow-2xl overflow-hidden group"
        >
          {/* Animated gradient background */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-primary via-secondary to-accent"
            animate={{ 
              backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"],
            }}
            transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
          />
          
          {/* Glassmorphism overlay */}
          <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />
          
          {/* Glow effect */}
          <motion.div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{
              background: "radial-gradient(circle at center, hsl(var(--primary) / 0.4) 0%, transparent 70%)",
              filter: "blur(12px)",
            }}
          />
          
          {/* Icon */}
          <div className="relative z-10 flex items-center justify-center h-full w-full">
            <MessageCircle className="h-6 w-6 sm:h-7 sm:w-7 text-white drop-shadow-lg" />
          </div>
          
          {/* Pulse ring */}
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-primary/50"
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.button>
      </motion.div>

      {/* Chat Window - Premium Glassmorphism Design */}
      <motion.div
        initial={false}
        animate={{ 
          opacity: isOpen ? 1 : 0, 
          y: isOpen ? 0 : 20, 
          scale: isOpen ? 1 : 0.95,
          pointerEvents: isOpen ? "auto" : "none"
        }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="fixed bottom-0 right-0 sm:bottom-4 sm:right-4 md:bottom-6 md:right-6 z-50 
          w-full sm:w-[400px] md:w-[420px] 
          h-[100dvh] sm:h-[600px] md:h-[650px] sm:max-h-[calc(100vh-32px)]
          sm:rounded-3xl overflow-hidden
          backdrop-blur-2xl bg-background/80 
          border-0 sm:border border-white/10
          shadow-[0_8px_32px_rgba(0,0,0,0.4),0_0_80px_hsl(var(--primary)/0.15)]
          flex flex-col"
      >
        {/* Gradient border overlay for glass effect */}
        <div className="absolute inset-0 pointer-events-none sm:rounded-3xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent" />
        </div>

        {/* Premium Header with Glass Effect */}
        <div className="relative flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 flex-shrink-0 overflow-hidden">
          {/* Header background gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20" />
          <div className="absolute inset-0 backdrop-blur-xl bg-background/40" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          
          <div className="flex items-center gap-3 relative z-10">
            {/* Animated avatar */}
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary rounded-full blur-sm opacity-60" />
              <img 
                src={logo} 
                alt="SKY BRASIL" 
                className="relative h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-background/50 p-1 backdrop-blur-sm ring-2 ring-white/10" 
              />
            </motion.div>
            
            <div>
              <h3 className="font-semibold text-sm sm:text-base text-foreground">Chat SKY BRASIL</h3>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                {isConnecting ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin text-primary" />
                    <span>Reconectando...</span>
                  </>
                ) : connectionStatus === "disconnected" || connectionStatus === "error" ? (
                  <>
                    <WifiOff className="h-3 w-3 text-destructive" />
                    <span>Desconectado</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={forceReconnect}
                      className="h-5 px-2 text-xs text-primary hover:text-primary hover:bg-primary/10"
                    >
                      Reconectar
                    </Button>
                  </>
                ) : conversationStatus === "closed" ? (
                  <span className="text-muted-foreground">Conversa encerrada</span>
                ) : (
                  <>
                    <motion.span 
                      className="w-2 h-2 rounded-full bg-green-400"
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <span>Online • Assistência 24h</span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {/* Header actions */}
          <div className="flex items-center gap-1 relative z-10">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="h-9 w-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all"
              title={soundEnabled ? "Desativar som" : "Ativar som"}
            >
              {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </motion.button>
            {formCompleted && conversationStatus === "active" && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleEndChat}
                className="h-9 w-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                title="Encerrar conversa"
              >
                <PhoneOff className="h-4 w-4" />
              </motion.button>
            )}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsOpen(false)}
              className="h-9 w-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all"
            >
              <X className="h-5 w-5" />
            </motion.button>
          </div>
        </div>

        {/* Content Area with subtle gradient */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/30 to-background/60 pointer-events-none" />
          
          {isSessionLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Loader2 className="h-8 w-8 text-primary" />
              </motion.div>
            </div>
          ) : showResumePrompt && savedSession ? (
            <ChatResumePrompt
              session={{
                visitorName: savedSession.visitorName,
                subject: savedSession.subject,
                status: savedSession.status,
              }}
              onResume={handleResumeConversation}
              onNewChat={handleStartNewChat}
              isLoading={isLoading}
            />
          ) : !formCompleted ? (
            <div className="flex-1 overflow-y-auto relative z-10">
              <PreChatForm
                onSubmit={handleFormSubmit}
                onPartialChange={setPartialFormData}
                isSubmitting={isLoading}
              />
            </div>
          ) : (
            <>
              {/* Messages with premium styling */}
              <ScrollArea className="flex-1 px-3 sm:px-4 py-4 relative z-10" ref={scrollRef}>
                <div className="space-y-3 sm:space-y-4">
                  {messages.map((message, index) => (
                    <ChatMessage
                      key={message.id || `msg-${index}`}
                      id={message.id}
                      conversationId={conversationId || undefined}
                      role={message.role}
                      content={message.content}
                      timestamp={message.created_at}
                      isAiResponse={message.is_ai_response}
                      fileUrl={message.file_url}
                      fileName={message.file_name}
                      fileType={message.file_type}
                      fileSize={message.file_size}
                      showFeedback={message.is_ai_response && message.role === "assistant"}
                    />
                  ))}

                  {/* Chat Ended Prompt */}
                  {showEndedPrompt && conversationStatus === "closed" && formData && (
                    <ChatEndedPrompt
                      visitorName={formData.name}
                      onResume={handleResumeConversation}
                      onNewChat={handleStartNewChat}
                      onClose={() => setShowEndedPrompt(false)}
                    />
                  )}

                  {/* Typing Indicator */}
                  <AnimatePresence>
                    {isTypingAdmin && (
                      <TypingIndicator isAdmin label="Atendente digitando..." />
                    )}
                    {isLoading && !isTypingAdmin && messages[messages.length - 1]?.role === "user" && (
                      <TypingIndicator label="IA pensando..." />
                    )}
                  </AnimatePresence>
                </div>
              </ScrollArea>

              {/* Premium Input Area */}
              {conversationStatus === "active" && (
                <div className="relative z-10 p-3 sm:p-4 flex-shrink-0 safe-area-bottom">
                  {/* Glass input container */}
                  <div className="relative rounded-2xl overflow-hidden">
                    {/* Input background */}
                    <div className="absolute inset-0 bg-muted/40 backdrop-blur-lg" />
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5" />
                    
                    {bucketAvailable === false && (
                      <div className="relative flex items-center gap-2 text-xs text-yellow-500 px-4 py-2 border-b border-white/5">
                        <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                        <span>Envio de arquivos temporariamente indisponível</span>
                      </div>
                    )}
                    
                    <div className="relative flex gap-2 items-end p-2 sm:p-3">
                      <FileUpload
                        onFileSelect={setPendingFile}
                        isUploading={isUploading}
                        disabled={isLoading || bucketAvailable === false}
                      />
                      <Input
                        ref={inputRef}
                        value={input}
                        onChange={(e) => handleInputChange(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder="Digite sua mensagem..."
                        disabled={isLoading || isUploading}
                        className="flex-1 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/60 text-sm sm:text-base"
                      />
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleSend}
                        disabled={(!input.trim() && !pendingFile) || isLoading || isUploading}
                        className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl flex items-center justify-center flex-shrink-0 
                          bg-gradient-to-br from-primary to-secondary 
                          text-white shadow-lg shadow-primary/25
                          disabled:opacity-50 disabled:cursor-not-allowed
                          transition-all hover:shadow-xl hover:shadow-primary/30"
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </motion.button>
                    </div>
                    
                    {pendingFile && (
                      <div className="relative px-4 py-2 border-t border-white/5 flex items-center gap-2 text-xs text-muted-foreground">
                        <Paperclip className="h-3 w-3" />
                        <span className="truncate">{pendingFile.name}</span>
                        <button
                          onClick={() => setPendingFile(null)}
                          className="ml-auto text-destructive hover:text-destructive/80"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>

      {/* Rating Modal */}
      <RatingModal
        isOpen={showRating}
        onClose={() => setShowRating(false)}
        onSubmit={handleRatingSubmit}
      />
    </>
  );
};

export default LiveChat;
