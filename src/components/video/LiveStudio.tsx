import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Radio,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Settings,
  Users,
  MessageSquare,
  Play,
  Square,
  Camera,
  Monitor,
  Loader2,
  Copy,
  Share2,
  Eye,
  Cloud,
  HardDrive,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
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
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/auth';
import { LiveChatAdvanced } from './LiveChatAdvanced';

interface ChatMessage {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  user?: {
    name: string;
    avatar_url: string;
  };
}

export function LiveStudio() {
  const { user } = useAuth();
  const [isLive, setIsLive] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [privacy, setPrivacy] = useState('public');
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [viewerCount, setViewerCount] = useState(0);
  const [liveId, setLiveId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [mediaDevices, setMediaDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedVideoDevice, setSelectedVideoDevice] = useState('');
  const [selectedAudioDevice, setSelectedAudioDevice] = useState('');
  const [duration, setDuration] = useState(0);
  
  // Drive save modal states
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveToDrive, setSaveToDrive] = useState(true); // Pre-checked by default
  const [driveConnected, setDriveConnected] = useState(false);
  const [driveFolderId, setDriveFolderId] = useState<string | null>(null);
  const [isSavingToDrive, setIsSavingToDrive] = useState(false);
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Check Drive connection
  useEffect(() => {
    const checkDriveConnection = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('profiles')
        .select('drive_connected')
        .eq('user_id', user.id)
        .single();
      
      setDriveConnected(data?.drive_connected || false);
    };
    
    checkDriveConnection();
  }, [user]);

  // Initialize Drive folder
  useEffect(() => {
    const initDriveFolder = async () => {
      if (!driveConnected || !user || driveFolderId) return;
      
      try {
        const { data } = await supabase.functions.invoke('google-drive-manager', {
          body: { action: 'create-root-folder', user_id: user.id }
        });
        
        if (data?.folderId) {
          setDriveFolderId(data.folderId);
        }
      } catch (error) {
        console.error('Error initializing Drive folder:', error);
      }
    };
    
    initDriveFolder();
  }, [driveConnected, user, driveFolderId]);

  useEffect(() => {
    // Get available media devices
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
      stopPreview();
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

  // Real-time chat subscription
  useEffect(() => {
    if (!liveId) return;

    const channel = supabase
      .channel(`live_chat:${liveId}`)
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
            .select('name, avatar_url')
            .eq('user_id', payload.new.user_id)
            .single();

          setChatMessages(prev => [...prev, {
            ...payload.new as ChatMessage,
            user: profile || undefined,
          }]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [liveId]);

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
      // Create live record
      const { data: liveData, error: liveError } = await supabase
        .from('videos')
        .insert({
          user_id: user.id,
          title: title.trim(),
          description: description.trim(),
          type: 'live',
          privacy: privacy as any,
          status: 'live',
          storage_type: 'internal',
          is_recording: true,
          live_started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (liveError) throw liveError;

      setLiveId(liveData.id);
      setIsLive(true);
      setDuration(0);

      // Start recording
      if (streamRef.current) {
        const mediaRecorder = new MediaRecorder(streamRef.current, {
          mimeType: 'video/webm;codecs=vp9,opus',
        });

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunksRef.current.push(e.data);
          }
        };

        mediaRecorder.start(1000); // Collect data every second
        mediaRecorderRef.current = mediaRecorder;
      }

      toast.success('Live iniciada!');
    } catch (error: any) {
      console.error('Error starting live:', error);
      toast.error('Erro ao iniciar live: ' + error.message);
    } finally {
      setIsStarting(false);
    }
  };

  const endLive = async () => {
    if (!liveId || !user) return;

    try {
      // Stop recording
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }

      // Create recording blob
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      const timestamp = Date.now();
      const filePath = `${user.id}/live_${timestamp}.webm`;

      // Upload to internal storage (always for performance)
      const { error: uploadError } = await supabase.storage
        .from('videos')
        .upload(filePath, blob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('videos')
        .getPublicUrl(filePath);

      // Update live record
      await supabase
        .from('videos')
        .update({
          status: 'ended',
          live_ended_at: new Date().toISOString(),
          is_recording: false,
          recording_url: publicUrl,
          duration,
        })
        .eq('id', liveId);

      setIsLive(false);
      setRecordingUrl(publicUrl);
      setRecordingBlob(blob);
      chunksRef.current = [];
      
      // Show save to Drive modal
      setShowSaveModal(true);
      toast.success('Live encerrada! Gravação salva na plataforma.');
    } catch (error: any) {
      console.error('Error ending live:', error);
      toast.error('Erro ao encerrar live');
    }
  };

  const handleSaveToDrive = async () => {
    if (!saveToDrive || !recordingBlob || !user || !driveFolderId) {
      setShowSaveModal(false);
      setLiveId(null);
      return;
    }

    setIsSavingToDrive(true);

    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(recordingBlob);
      });

      const { data, error } = await supabase.functions.invoke('google-drive-manager', {
        body: {
          action: 'upload',
          user_id: user.id,
          folderId: driveFolderId,
          file_name: `${title || 'Live'}_${new Date().toISOString().split('T')[0]}.webm`,
          file_data: base64,
          file_mime: 'video/webm',
        },
      });

      if (error) throw error;
      
      toast.success('✓ Gravação também salva no Google Drive!');
    } catch (error: any) {
      console.error('Error saving to Drive:', error);
      toast.error('Erro ao salvar no Drive: ' + error.message);
    } finally {
      setIsSavingToDrive(false);
      setShowSaveModal(false);
      setLiveId(null);
      setRecordingBlob(null);
      setRecordingUrl(null);
    }
  };

  const handleConnectDrive = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.functions.invoke('google-drive-manager', {
        body: { action: 'get-auth-url', user_id: user.id, origin: window.location.origin }
      });

      if (error) throw error;
      
      if (data?.authUrl) {
        sessionStorage.setItem('drive_oauth_return', window.location.pathname);
        window.location.href = data.authUrl;
      }
    } catch (error: any) {
      toast.error('Erro ao conectar Google Drive');
    }
  };

  const sendChatMessage = async () => {
    if (!newMessage.trim() || !liveId || !user) return;

    try {
      await supabase
        .from('live_chat_messages')
        .insert({
          video_id: liveId,
          user_id: user.id,
          content: newMessage.trim(),
        });

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const copyShareLink = () => {
    if (!liveId) return;
    const url = `${window.location.origin}/live/${liveId}`;
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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 lg:p-6">
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
                      <Eye className="h-3 w-3" />
                      {viewerCount}
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
                        <SelectItem value="students">Apenas alunos</SelectItem>
                        <SelectItem value="vip">Apenas VIP</SelectItem>
                        <SelectItem value="private">Privado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    className="w-full bg-red-500 hover:bg-red-600"
                    size="lg"
                    onClick={startLive}
                    disabled={isStarting || !title.trim()}
                  >
                    {isStarting ? (
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    ) : (
                      <Radio className="h-5 w-5 mr-2" />
                    )}
                    Iniciar Live
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold">{title}</h3>
                      <p className="text-sm text-muted-foreground">
                        Transmitindo há {formatDuration(duration)}
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

          {/* Chat Sidebar - Using Advanced Chat Component */}
          <div className="lg:col-span-1">
            {liveId ? (
              <LiveChatAdvanced
                liveId={liveId}
                isLive={isLive}
                viewerCount={viewerCount}
                className="h-[600px] rounded-lg border"
              />
            ) : (
              <Card className="h-[600px] flex flex-col">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <MessageSquare className="h-5 w-5" />
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

      {/* Save to Drive Modal */}
      <Dialog open={showSaveModal} onOpenChange={setShowSaveModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              Gravação Salva!
            </DialogTitle>
            <DialogDescription>
              Sua live foi salva com sucesso na plataforma.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
              <HardDrive className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <p className="font-medium">Salvo na Plataforma</p>
                <p className="text-sm text-muted-foreground">Sua gravação está disponível imediatamente.</p>
              </div>
              <Check className="h-5 w-5 text-green-500" />
            </div>

            {driveConnected ? (
              <div className="flex items-start gap-3 p-4 border border-blue-500/30 bg-blue-500/5 rounded-lg">
                <Checkbox
                  id="save-to-drive"
                  checked={saveToDrive}
                  onCheckedChange={(checked) => setSaveToDrive(checked === true)}
                />
                <div className="flex-1">
                  <Label htmlFor="save-to-drive" className="font-medium cursor-pointer">
                    Salvar cópia no Google Drive
                  </Label>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Mantenha uma cópia sincronizada no seu Drive.
                  </p>
                </div>
                <Cloud className="h-5 w-5 text-blue-500" />
              </div>
            ) : (
              <div className="p-4 border border-amber-500/30 bg-amber-500/5 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-amber-600 dark:text-amber-400">Google Drive não conectado</p>
                    <p className="text-sm text-muted-foreground">Conecte para fazer backup automático das lives.</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={handleConnectDrive}>
                    <Cloud className="h-4 w-4 mr-1" />
                    Conectar
                  </Button>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowSaveModal(false);
              setLiveId(null);
            }} disabled={isSavingToDrive}>
              Fechar
            </Button>
            {driveConnected && saveToDrive && (
              <Button onClick={handleSaveToDrive} disabled={isSavingToDrive} className="bg-blue-500 hover:bg-blue-600">
                {isSavingToDrive ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Cloud className="h-4 w-4 mr-2" />
                    Confirmar
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
