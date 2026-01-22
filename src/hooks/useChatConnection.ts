import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UseChatConnectionOptions {
  conversationId: string | null;
  enabled?: boolean;
}

type ConnectionStatus = "connected" | "connecting" | "disconnected" | "error";

export const useChatConnection = ({ 
  conversationId, 
  enabled = true 
}: UseChatConnectionOptions) => {
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [bucketAvailable, setBucketAvailable] = useState<boolean | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  // Check if storage bucket is available
  const checkBucketAvailability = useCallback(async () => {
    try {
      const { data, error } = await supabase.storage.from("chat-attachments").list("", { limit: 1 });
      if (error) {
        console.warn("[ChatConnection] Bucket check failed:", error.message);
        setBucketAvailable(false);
      } else {
        setBucketAvailable(true);
      }
    } catch (err) {
      console.warn("[ChatConnection] Bucket check error:", err);
      setBucketAvailable(false);
    }
  }, []);

  // Handle reconnection logic
  const attemptReconnect = useCallback(() => {
    if (reconnectAttempts.current >= maxReconnectAttempts) {
      setStatus("error");
      // Only show toast once
      if (reconnectAttempts.current === maxReconnectAttempts) {
        toast.error("Não foi possível reconectar ao chat", {
          description: "Tente recarregar a página",
        });
      }
      return;
    }

    reconnectAttempts.current += 1;
    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
    
    console.log(`[ChatConnection] Reconnect #${reconnectAttempts.current} in ${delay}ms`);
    setStatus("connecting");

    reconnectTimeoutRef.current = setTimeout(async () => {
      try {
        await checkBucketAvailability();
        setStatus("connected");
        reconnectAttempts.current = 0;
        // Silent success - no toast spam
      } catch (err) {
        console.error("[ChatConnection] Reconnect failed:", err);
        attemptReconnect();
      }
    }, delay);
  }, [checkBucketAvailability]);

  // Monitor realtime connection status
  useEffect(() => {
    if (!enabled || !conversationId) return;

    const channelName = `connection-monitor-${conversationId}`;
    const channel = supabase.channel(channelName);

    channel
      .on("system", { event: "*" }, (payload) => {
        console.log("[ChatConnection] System event:", payload);
      })
      .subscribe((status) => {
        console.log("[ChatConnection] Subscription status:", status);
        
        if (status === "SUBSCRIBED") {
          setStatus("connected");
          reconnectAttempts.current = 0;
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          setStatus("disconnected");
          attemptReconnect();
        } else if (status === "CLOSED") {
          setStatus("disconnected");
        }
      });

    // Initial bucket check
    checkBucketAvailability();
    setStatus("connecting");

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      supabase.removeChannel(channel);
    };
  }, [conversationId, enabled, attemptReconnect, checkBucketAvailability]);

  const forceReconnect = useCallback(() => {
    reconnectAttempts.current = 0;
    attemptReconnect();
  }, [attemptReconnect]);

  return {
    status,
    bucketAvailable,
    forceReconnect,
    isConnected: status === "connected",
    isConnecting: status === "connecting",
    isDisconnected: status === "disconnected" || status === "error",
  };
};
