import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ChatSession {
  conversationId: string;
  visitorId: string;
  visitorName: string;
  visitorEmail: string;
  visitorPhone?: string;
  subject: string;
  status: "active" | "closed";
  formCompleted: boolean;
  lastActivityAt: string;
}

const STORAGE_KEY = "sky_chat_session";
const SESSION_EXPIRY_HOURS = 24; // Sessions expire after 24 hours

export const useChatSession = () => {
  const [savedSession, setSavedSession] = useState<ChatSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load session from localStorage on mount
  useEffect(() => {
    const loadSession = async () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) {
          setIsLoading(false);
          return;
        }

        const session: ChatSession = JSON.parse(stored);
        
        // Check if session is expired
        const lastActivity = new Date(session.lastActivityAt);
        const now = new Date();
        const hoursSinceActivity = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60);
        
        if (hoursSinceActivity > SESSION_EXPIRY_HOURS) {
          localStorage.removeItem(STORAGE_KEY);
          setIsLoading(false);
          return;
        }

        // Verify session still exists in database
        const { data: conversation } = await supabase
          .from("chat_conversations")
          .select("id, status, form_completed")
          .eq("id", session.conversationId)
          .single();

        if (conversation) {
          // Update status from DB
          session.status = conversation.status as "active" | "closed";
          session.formCompleted = conversation.form_completed ?? true;
          setSavedSession(session);
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch (error) {
        console.warn("[ChatSession] Error loading session:", error);
        localStorage.removeItem(STORAGE_KEY);
      } finally {
        setIsLoading(false);
      }
    };

    loadSession();
  }, []);

  // Save session to localStorage
  const saveSession = useCallback((session: ChatSession) => {
    const sessionWithActivity = {
      ...session,
      lastActivityAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionWithActivity));
    setSavedSession(sessionWithActivity);
  }, []);

  // Clear session from localStorage
  const clearSession = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setSavedSession(null);
  }, []);

  // Update session activity
  const updateActivity = useCallback(() => {
    if (savedSession) {
      saveSession(savedSession);
    }
  }, [savedSession, saveSession]);

  // Check if there's a resumable session (active or recently closed)
  const hasResumableSession = savedSession !== null && savedSession.formCompleted;

  return {
    savedSession,
    isLoading,
    hasResumableSession,
    saveSession,
    clearSession,
    updateActivity,
  };
};
