import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Radio,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Settings,
  Play,
  Square,
  Loader2,
  Share2,
  Eye,
  X,
  ArrowLeft,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/auth';
import { VIPLiveChat } from '@/components/vip/social/VIPLiveChat';
import { useBroadcaster } from '@/hooks/useWebRTCLive';

export default function VIPNetworkLiveCreate() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLive, setIsLive] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [privacy, setPrivacy] = useState('public');
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [postId, setPostId] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [mediaDevices, setMediaDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedVideoDevice, setSelectedVideoDevice] = useState('');
  const [selectedAudioDevice, setSelectedAudioDevice] = useState('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // WebRTC broadcaster hook
  const { startBroadcast, stopBroadcast, viewerCount } = useBroadcaster(postId || '');

  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then(devices => {
      setMediaDevices(devices);
      const videoDevice = devices.find(d => d.kind === 'videoinput');
      const audioDevice = devices.find(d => d.kind === 'audioinput');
      if (videoDevice) setSelectedVideoDevice(videoDevice.deviceId);
      if (audioDevice) setSelectedAudioDevice(audioDevice.deviceId);
    });
  }, []);

  useEffect(() => {
    if (videoEnabled || audioEnabled) {
      startPreview();
    }
    return () => {
      if (!isLive) {
        stopPreview();
      }
    };
  }, [videoEnabled, audioEnabled, selectedVideoDevice, selectedAudioDevice]);

  // Duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLive) {
      interval = setInterval(() => {
        setDuration(d => d + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isLive]);

  const startPreview = async () => {
    try {
      const constraints: MediaStreamConstraints = {
        video: videoEnabled ? { deviceId: selectedVideoDevice || undefined } : false,
        audio: audioEnabled ? { deviceId: selectedAudioDevice || undefined } : false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing media:', error);
      toast.error('Erro ao acessar câmera/microfone');
    }
  };

  const stopPreview = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const startLive = async () => {
    if (!user || !title.trim()) {
      toast.error('Digite um título para a live');
      return;
    }

    setIsStarting(true);

    try {
      // Create VIP post for live
      const { data: postData, error: postError } = await (supabase as any)
        .from('vip_posts')
        .insert({
          author_id: user.id,
          title: title.trim(),
          content: description.trim(),
          media_type: 'live',
          is_live: true,
          live_started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (postError) throw postError;

      setPostId(postData.id);

      // Start WebRTC broadcast
      if (streamRef.current) {
        await startBroadcast(streamRef.current);
      }

      // Start recording for later
      if (streamRef.current) {
        try {
          const mediaRecorder = new MediaRecorder(streamRef.current, {
            mimeType: 'video/webm;codecs=vp9,opus',
          });

          mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
              chunksRef.current.push(e.data);
            }
          };

          mediaRecorder.start(1000);
          mediaRecorderRef.current = mediaRecorder;
        } catch (err) {
          console.warn('Recording not supported:', err);
        }
      }

      setIsLive(true);
      setDuration(0);

      toast.success('🔴 Live iniciada! Espectadores podem assistir agora.');
    } catch (error: any) {
      console.error('Error starting live:', error);
      toast.error('Erro ao iniciar live: ' + error.message);
    } finally {
      setIsStarting(false);
    }
  };

  const endLive = async () => {
    if (!postId || !user) return;

    try {
      // Stop WebRTC broadcast
      stopBroadcast();

      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }

      // Create recording blob and upload
      if (chunksRef.current.length > 0) {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const timestamp = Date.now();
        const filePath = `${user.id}/live_${timestamp}.webm`;

        // Upload to internal storage
        const { error: uploadError } = await supabase.storage
          .from('videos')
          .upload(filePath, blob);

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('videos')
            .getPublicUrl(filePath);

          // Update VIP post with recording URL
          await supabase
            .from('vip_posts')
            .update({
              is_live: false,
              live_ended_at: new Date().toISOString(),
              media_url: publicUrl,
            })
            .eq('id', postId);
        } else {
          console.error('Error uploading recording:', uploadError);
          // Still update post as ended
          await supabase
            .from('vip_posts')
            .update({
              is_live: false,
              live_ended_at: new Date().toISOString(),
            })
            .eq('id', postId);
        }
      } else {
        // No recording, just update post
        await supabase
          .from('vip_posts')
          .update({
            is_live: false,
            live_ended_at: new Date().toISOString(),
          })
          .eq('id', postId);
      }

      setIsLive(false);
      chunksRef.current = [];
      
      toast.success('Live encerrada!');
      navigate('/vip/network/live');
    } catch (error: any) {
      console.error('Error ending live:', error);
      toast.error('Erro ao encerrar live');
    }
  };

  const cancelLive = () => {
    if (isLive) {
      const confirm = window.confirm('Tem certeza que deseja cancelar a live?');
      if (!confirm) return;
      endLive();
    } else {
      stopPreview();
      navigate('/vip/network/live');
    }
  };

  const copyShareLink = () => {
    if (!postId) return;
    const url = `${window.location.origin}/vip/network/live/watch/${postId}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copiado!');
  };

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/vip/network/live')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="p-2 rounded-lg bg-gradient-to-br from-red-500/20 to-pink-500/20">
            <Radio className="h-6 w-6 text-red-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              {isLive ? 'Ao Vivo' : 'Criar Live'}
            </h1>
            <p className="text-muted-foreground">
              {isLive ? 'Você está transmitindo ao vivo' : 'Configure sua transmissão'}
            </p>
          </div>
        </div>
        
        {!isLive && (
          <Button variant="outline" onClick={cancelLive}>
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Video Area */}
        <div className="lg:col-span-2 space-y-4">
          {/* Video Preview */}
          <Card className="overflow-hidden">
            <div className="relative aspect-video bg-black">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              
              {/* Live Indicator */}
              {isLive && (
                <div className="absolute top-4 left-4 flex items-center gap-3">
                  <Badge variant="destructive" className="animate-pulse gap-1">
                    <Radio className="h-3 w-3" />
                    AO VIVO
                  </Badge>
                  <Badge variant="secondary">
                    {formatDuration(duration)}
                  </Badge>
                  <Badge variant="secondary" className="gap-1">
                    <Users className="h-3 w-3" />
                    {viewerCount} espectadores
                  </Badge>
                </div>
              )}

              {/* Controls Overlay */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
                <Button
                  size="icon"
                  variant={videoEnabled ? 'secondary' : 'destructive'}
                  onClick={() => setVideoEnabled(!videoEnabled)}
                >
                  {videoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                </Button>
                <Button
                  size="icon"
                  variant={audioEnabled ? 'secondary' : 'destructive'}
                  onClick={() => setAudioEnabled(!audioEnabled)}
                >
                  {audioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                </Button>
                <Button
                  size="icon"
                  variant="secondary"
                  onClick={() => setShowSettings(true)}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>

          {/* Live Controls */}
          {!isLive ? (
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label>Título da Live *</Label>
                  <Input
                    placeholder="Ex: Live de perguntas e respostas"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea
                    placeholder="Descreva o tema da sua live..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Visibilidade</Label>
                  <Select value={privacy} onValueChange={setPrivacy}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Público</SelectItem>
                      <SelectItem value="vip">Apenas VIP</SelectItem>
                      <SelectItem value="private">Privado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-3">
                  <Button
                    className="flex-1 bg-red-500 hover:bg-red-600"
                    size="lg"
                    onClick={startLive}
                    disabled={isStarting || !title.trim()}
                  >
                    {isStarting ? (
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    ) : (
                      <Play className="h-5 w-5 mr-2" />
                    )}
                    Iniciar Live
                  </Button>
                  <Button variant="outline" size="lg" onClick={cancelLive}>
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold">{title}</h3>
                    <p className="text-sm text-muted-foreground">
                      Transmitindo há {formatDuration(duration)} • {viewerCount} espectadores
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={copyShareLink}>
                      <Share2 className="h-4 w-4 mr-2" />
                      Compartilhar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={endLive}
                    >
                      <Square className="h-4 w-4 mr-2" />
                      Encerrar Live
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Chat Sidebar */}
        <div className="lg:col-span-1">
          {postId ? (
            <VIPLiveChat postId={postId} isHost={true} />
          ) : (
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Radio className="h-5 w-5" />
                  Chat ao Vivo
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex items-center justify-center text-muted-foreground">
                <p>Inicie a live para ver o chat</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configurações de Mídia</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Câmera</Label>
              <Select value={selectedVideoDevice} onValueChange={setSelectedVideoDevice}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar câmera" />
                </SelectTrigger>
                <SelectContent>
                  {mediaDevices
                    .filter(d => d.kind === 'videoinput')
                    .map(device => (
                      <SelectItem key={device.deviceId} value={device.deviceId}>
                        {device.label || 'Câmera'}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Microfone</Label>
              <Select value={selectedAudioDevice} onValueChange={setSelectedAudioDevice}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar microfone" />
                </SelectTrigger>
                <SelectContent>
                  {mediaDevices
                    .filter(d => d.kind === 'audioinput')
                    .map(device => (
                      <SelectItem key={device.deviceId} value={device.deviceId}>
                        {device.label || 'Microfone'}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
