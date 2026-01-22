import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Viewer {
  id: string;
  connection: RTCPeerConnection;
}

// STUN servers for NAT traversal
const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
];

// Hook for the broadcaster (host)
export function useBroadcaster(liveId: string) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const streamRef = useRef<MediaStream | null>(null);
  const viewersRef = useRef<Map<string, Viewer>>(new Map());
  const channelRef = useRef<any>(null);

  // Start broadcasting
  const startBroadcast = useCallback(async (stream: MediaStream) => {
    streamRef.current = stream;
    setIsStreaming(true);

    // Subscribe to signaling channel
    const channel = supabase
      .channel(`live-signaling-${liveId}`)
      .on('broadcast', { event: 'viewer-join' }, async ({ payload }) => {
        console.log('[Broadcaster] Viewer joining:', payload.viewerId);
        await handleViewerJoin(payload.viewerId);
      })
      .on('broadcast', { event: 'ice-candidate' }, async ({ payload }) => {
        if (payload.to === 'broadcaster') {
          await handleIceCandidate(payload.from, payload.candidate);
        }
      })
      .on('broadcast', { event: 'answer' }, async ({ payload }) => {
        await handleAnswer(payload.from, payload.answer);
      })
      .subscribe();

    channelRef.current = channel;

    // Announce live is active
    await channel.send({
      type: 'broadcast',
      event: 'live-active',
      payload: { liveId }
    });
  }, [liveId]);

  const handleViewerJoin = async (viewerId: string) => {
    if (!streamRef.current) return;

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    // Add stream tracks to connection
    streamRef.current.getTracks().forEach(track => {
      pc.addTrack(track, streamRef.current!);
    });

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'ice-candidate',
          payload: {
            from: 'broadcaster',
            to: viewerId,
            candidate: event.candidate.toJSON()
          }
        });
      }
    };

    // Create and send offer
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    channelRef.current?.send({
      type: 'broadcast',
      event: 'offer',
      payload: {
        to: viewerId,
        offer: pc.localDescription?.toJSON()
      }
    });

    viewersRef.current.set(viewerId, { id: viewerId, connection: pc });
    setViewerCount(viewersRef.current.size);
  };

  const handleIceCandidate = async (viewerId: string, candidate: RTCIceCandidateInit) => {
    const viewer = viewersRef.current.get(viewerId);
    if (viewer) {
      try {
        await viewer.connection.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.error('[Broadcaster] Error adding ICE candidate:', error);
      }
    }
  };

  const handleAnswer = async (viewerId: string, answer: RTCSessionDescriptionInit) => {
    const viewer = viewersRef.current.get(viewerId);
    if (viewer) {
      try {
        await viewer.connection.setRemoteDescription(new RTCSessionDescription(answer));
        console.log('[Broadcaster] Answer set for viewer:', viewerId);
      } catch (error) {
        console.error('[Broadcaster] Error setting remote description:', error);
      }
    }
  };

  const stopBroadcast = useCallback(() => {
    // Close all viewer connections
    viewersRef.current.forEach(viewer => {
      viewer.connection.close();
    });
    viewersRef.current.clear();
    setViewerCount(0);

    // Unsubscribe from channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // Stop stream tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    setIsStreaming(false);
  }, []);

  useEffect(() => {
    return () => {
      stopBroadcast();
    };
  }, [stopBroadcast]);

  return {
    isStreaming,
    viewerCount,
    startBroadcast,
    stopBroadcast
  };
}

// Hook for viewers
export function useViewer(liveId: string) {
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const viewerIdRef = useRef<string>(crypto.randomUUID());
  const channelRef = useRef<any>(null);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    setError(null);

    try {
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      pcRef.current = pc;

      // Handle incoming stream
      pc.ontrack = (event) => {
        console.log('[Viewer] Received track:', event.track.kind);
        if (event.streams && event.streams[0]) {
          setRemoteStream(event.streams[0]);
          setIsConnected(true);
          setIsConnecting(false);
        }
      };

      // Handle connection state
      pc.onconnectionstatechange = () => {
        console.log('[Viewer] Connection state:', pc.connectionState);
        if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
          setIsConnected(false);
          setError('Conexão perdida com a transmissão');
        }
      };

      // Subscribe to signaling channel
      const channel = supabase
        .channel(`live-signaling-${liveId}`)
        .on('broadcast', { event: 'offer' }, async ({ payload }) => {
          if (payload.to === viewerIdRef.current) {
            console.log('[Viewer] Received offer');
            await handleOffer(payload.offer);
          }
        })
        .on('broadcast', { event: 'ice-candidate' }, async ({ payload }) => {
          if (payload.to === viewerIdRef.current) {
            await handleIceCandidate(payload.candidate);
          }
        })
        .on('broadcast', { event: 'live-ended' }, () => {
          setIsConnected(false);
          setError('A transmissão foi encerrada');
        })
        .subscribe();

      channelRef.current = channel;

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && channelRef.current) {
          channelRef.current.send({
            type: 'broadcast',
            event: 'ice-candidate',
            payload: {
              from: viewerIdRef.current,
              to: 'broadcaster',
              candidate: event.candidate.toJSON()
            }
          });
        }
      };

      // Announce joining
      await channel.send({
        type: 'broadcast',
        event: 'viewer-join',
        payload: { viewerId: viewerIdRef.current }
      });

      // Timeout if no connection in 15 seconds
      setTimeout(() => {
        if (!isConnected) {
          setIsConnecting(false);
          if (!remoteStream) {
            setError('Não foi possível conectar à transmissão. Tente novamente.');
          }
        }
      }, 15000);

    } catch (err: any) {
      console.error('[Viewer] Error connecting:', err);
      setError(err.message || 'Erro ao conectar');
      setIsConnecting(false);
    }
  }, [liveId]);

  const handleOffer = async (offer: RTCSessionDescriptionInit) => {
    if (!pcRef.current) return;

    try {
      await pcRef.current.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pcRef.current.createAnswer();
      await pcRef.current.setLocalDescription(answer);

      channelRef.current?.send({
        type: 'broadcast',
        event: 'answer',
        payload: {
          from: viewerIdRef.current,
          answer: pcRef.current.localDescription?.toJSON()
        }
      });
    } catch (error) {
      console.error('[Viewer] Error handling offer:', error);
    }
  };

  const handleIceCandidate = async (candidate: RTCIceCandidateInit) => {
    if (!pcRef.current) return;
    try {
      await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error('[Viewer] Error adding ICE candidate:', error);
    }
  };

  const disconnect = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    setRemoteStream(null);
    setIsConnected(false);
    setIsConnecting(false);
  }, []);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    remoteStream,
    isConnecting,
    isConnected,
    error,
    connect,
    disconnect
  };
}
