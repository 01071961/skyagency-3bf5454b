import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const ABANDONMENT_TIMEOUT = 10 * 60 * 1000; // 10 minutes

interface UseChatAbandonmentOptions {
  conversationId: string | null;
  visitorId: string;
  isActive: boolean;
  onAbandonment?: () => void;
}

export const useChatAbandonment = ({
  conversationId,
  visitorId,
  isActive,
  onAbandonment,
}: UseChatAbandonmentOptions) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now();

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (isActive && conversationId) {
      timeoutRef.current = setTimeout(async () => {
        // Check if still inactive
        const timeSinceActivity = Date.now() - lastActivityRef.current;
        if (timeSinceActivity >= ABANDONMENT_TIMEOUT) {
          // Trigger abandonment notification
          try {
            await supabase.functions.invoke("chat-notifications", {
              body: {
                type: "abandonment",
                conversationId,
                visitorId,
              },
            });
            
            if (onAbandonment) {
              onAbandonment();
            }
          } catch (error) {
            console.error("Error sending abandonment notification:", error);
          }
        }
      }, ABANDONMENT_TIMEOUT);
    }
  }, [conversationId, visitorId, isActive, onAbandonment]);

  // Reset timer on mount and when dependencies change
  useEffect(() => {
    resetTimer();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [resetTimer]);

  // Update last activity on conversation update
  const updateActivity = useCallback(async () => {
    resetTimer();

    if (conversationId) {
      try {
        await supabase
          .from("chat_conversations")
          .update({ last_activity_at: new Date().toISOString() })
          .eq("id", conversationId);
      } catch (error) {
        console.warn("Error updating activity:", error);
      }
    }
  }, [conversationId, resetTimer]);

  return { updateActivity, resetTimer };
};
