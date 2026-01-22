import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UseChatRealtimeOptions {
  conversationId: string | null;
  visitorId?: string;
  onNewMessage?: (message: any) => void;
  onTypingChange?: (isTyping: boolean, isAdmin: boolean) => void;
  onConversationUpdate?: (conversation: any) => void;
}

// Module-level deduplication cache with timestamps
const processedMessages = new Map<string, { timestamp: number; hash: string }>();
const MESSAGE_CACHE_TTL = 60000; // 1 minute

// Generate hash for message content comparison
function generateMessageHash(message: any): string {
  const content = message.content?.slice(0, 150) || '';
  return `${message.role}-${content}-${message.conversation_id}`;
}

// Clean old entries from cache
function cleanCache(): void {
  const now = Date.now();
  for (const [id, data] of processedMessages.entries()) {
    if (now - data.timestamp > MESSAGE_CACHE_TTL) {
      processedMessages.delete(id);
    }
  }
}

// Check if message is duplicate - more robust check
function isDuplicateMessage(message: any): boolean {
  if (!message?.id) return true;
  
  // Check by ID first
  if (processedMessages.has(message.id)) {
    console.log("[ChatRealtime] Duplicate by ID:", message.id);
    return true;
  }
  
  // Check by content hash (catches same content with different IDs within time window)
  const hash = generateMessageHash(message);
  const now = Date.now();
  
  for (const [, data] of processedMessages.entries()) {
    if (data.hash === hash && now - data.timestamp < 10000) { // 10 second window
      console.log("[ChatRealtime] Duplicate by content hash");
      return true;
    }
  }
  
  return false;
}

// Mark message as processed
function markAsProcessed(message: any): void {
  if (!message?.id) return;
  
  const hash = generateMessageHash(message);
  processedMessages.set(message.id, {
    timestamp: Date.now(),
    hash,
  });
  
  // Periodic cleanup
  if (processedMessages.size > 200) {
    cleanCache();
  }
}

export const useChatRealtime = ({
  conversationId,
  onNewMessage,
  onTypingChange,
  onConversationUpdate,
}: UseChatRealtimeOptions) => {
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const isSubscribed = useRef(false);
  
  // Use refs to avoid stale closures and prevent re-subscriptions
  const onNewMessageRef = useRef(onNewMessage);
  const onTypingChangeRef = useRef(onTypingChange);
  const onConversationUpdateRef = useRef(onConversationUpdate);
  
  // Keep refs updated
  useEffect(() => {
    onNewMessageRef.current = onNewMessage;
    onTypingChangeRef.current = onTypingChange;
    onConversationUpdateRef.current = onConversationUpdate;
  });

  useEffect(() => {
    if (!conversationId) return;
    
    // Prevent duplicate subscriptions
    if (isSubscribed.current && channelRef.current) {
      return;
    }

    console.log("[ChatRealtime] Subscribing to:", conversationId);

    // Use stable channel name
    const channelName = `chat-realtime-${conversationId}`;
    
    // Clean up existing channel first
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    isSubscribed.current = true;

    channelRef.current = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMessage = payload.new;
          
          // Anti-duplication check
          if (isDuplicateMessage(newMessage)) {
            console.log("[ChatRealtime] Blocked duplicate message");
            return;
          }
          
          markAsProcessed(newMessage);
          console.log("[ChatRealtime] New message:", newMessage?.id);
          onNewMessageRef.current?.(newMessage);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "chat_conversations",
          filter: `id=eq.${conversationId}`,
        },
        (payload) => {
          const conv = payload.new as any;
          
          // Typing changes
          if (conv.is_typing_admin !== undefined) {
            onTypingChangeRef.current?.(conv.is_typing_admin, true);
          }
          if (conv.is_typing_visitor !== undefined) {
            onTypingChangeRef.current?.(conv.is_typing_visitor, false);
          }

          onConversationUpdateRef.current?.(conv);
        }
      )
      .subscribe((status, err) => {
        console.log("[ChatRealtime] Status:", status);
        
        if (status === 'CHANNEL_ERROR') {
          console.warn("[ChatRealtime] Channel error:", err);
          isSubscribed.current = false;
        }
        if (status === 'TIMED_OUT') {
          console.warn("[ChatRealtime] Subscription timed out");
          isSubscribed.current = false;
        }
        if (status === 'CLOSED') {
          isSubscribed.current = false;
        }
      });

    return () => {
      console.log("[ChatRealtime] Cleanup:", conversationId);
      isSubscribed.current = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [conversationId]);

  const setTyping = useCallback(async (isTyping: boolean, isAdmin: boolean = false) => {
    if (!conversationId) return;

    const field = isAdmin ? "is_typing_admin" : "is_typing_visitor";
    
    try {
      await supabase
        .from("chat_conversations")
        .update({ [field]: isTyping, last_activity_at: new Date().toISOString() })
        .eq("id", conversationId);
    } catch (error) {
      console.warn("[ChatRealtime] Typing error:", error);
    }
  }, [conversationId]);

  return { setTyping };
};
