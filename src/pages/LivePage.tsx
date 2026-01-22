import { useParams } from 'react-router-dom';
import { LiveViewer } from '@/components/video';

export default function LivePage() {
  const { id } = useParams<{ id: string }>();
  
  if (!id) {
    return <div className="p-8 text-center">Live não encontrada</div>;
  }

  return <LiveViewer liveId={id} />;
}
