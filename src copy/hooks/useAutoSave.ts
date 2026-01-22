import { useEffect, useRef, useCallback, useState } from 'react';
import { toast } from 'sonner';

interface UseAutoSaveOptions<T> {
  data: T;
  onSave: (data: T) => Promise<void>;
  interval?: number;
  enabled?: boolean;
  debounceMs?: number;
}

export function useAutoSave<T>({
  data,
  onSave,
  interval = 30000,
  enabled = true,
  debounceMs = 2000,
}: UseAutoSaveOptions<T>) {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  const previousDataRef = useRef<T | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const intervalTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isSavingRef = useRef(false);

  // Detect changes
  useEffect(() => {
    if (previousDataRef.current === null) {
      previousDataRef.current = data;
      return;
    }

    const hasChanged = JSON.stringify(data) !== JSON.stringify(previousDataRef.current);
    if (hasChanged) {
      setHasUnsavedChanges(true);
    }
  }, [data]);

  const performSave = useCallback(async () => {
    if (isSavingRef.current || !hasUnsavedChanges) return;
    
    isSavingRef.current = true;
    setIsSaving(true);

    try {
      await onSave(data);
      previousDataRef.current = data;
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      toast.success('Auto-save realizado', { 
        duration: 2000,
        icon: '💾',
      });
    } catch (error) {
      console.error('[AutoSave] Error:', error);
      toast.error('Erro no auto-save', { duration: 3000 });
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  }, [data, hasUnsavedChanges, onSave]);

  // Interval-based auto-save
  useEffect(() => {
    if (!enabled) return;

    intervalTimerRef.current = setInterval(() => {
      if (hasUnsavedChanges && !isSavingRef.current) {
        performSave();
      }
    }, interval);

    return () => {
      if (intervalTimerRef.current) {
        clearInterval(intervalTimerRef.current);
      }
    };
  }, [enabled, interval, hasUnsavedChanges, performSave]);

  // Debounced save on changes
  useEffect(() => {
    if (!enabled || !hasUnsavedChanges) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Don't debounce-save - only use interval
    // This prevents too many saves during active editing
  }, [enabled, hasUnsavedChanges]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (intervalTimerRef.current) {
        clearInterval(intervalTimerRef.current);
      }
    };
  }, []);

  const forceSave = useCallback(async () => {
    setHasUnsavedChanges(true);
    await performSave();
  }, [performSave]);

  const markAsChanged = useCallback(() => {
    setHasUnsavedChanges(true);
  }, []);

  return {
    isSaving,
    lastSaved,
    hasUnsavedChanges,
    forceSave,
    markAsChanged,
  };
}
