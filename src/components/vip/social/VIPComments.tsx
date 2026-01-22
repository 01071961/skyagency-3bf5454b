import { useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  MessageCircle,
  ThumbsUp,
  Reply,
  MoreVertical,
  Send,
  Smile,
  Pin,
  Trash2,
  Flag,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import { cn } from '@/lib/utils';
import { useVIPComments, VIPComment } from '@/hooks/useVIPSocial';
import { useAuth } from '@/auth';

interface VIPCommentsProps {
  postId: string;
}

export function VIPComments({ postId }: VIPCommentsProps) {
  const { comments, loading, addComment } = useVIPComments(postId);
  const { user } = useAuth();
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;
    await addComment(newComment);
    setNewComment('');
    setShowEmojiPicker(false);
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!replyContent.trim()) return;
    await addComment(replyContent, parentId);
    setReplyContent('');
    setReplyingTo(null);
  };

  const toggleReplies = (commentId: string) => {
    setExpandedReplies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };

  const handleEmojiClick = (emoji: any) => {
    setNewComment(prev => prev + emoji.emoji);
    setShowEmojiPicker(false);
  };

  const CommentItem = memo(function CommentItem({ 
    comment, 
    isReply = false 
  }: { 
    comment: VIPComment; 
    isReply?: boolean;
  }) {
    const hasReplies = comment.replies && comment.replies.length > 0;
    const isExpanded = expandedReplies.has(comment.id);

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn('flex gap-3', isReply && 'ml-12')}
      >
        <Avatar className={cn(isReply ? 'h-8 w-8' : 'h-10 w-10', 'shrink-0')}>
          <AvatarImage src={comment.author?.avatar_url || ''} />
          <AvatarFallback>
            {comment.author?.full_name?.[0] || 'U'}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="bg-muted/50 rounded-lg px-3 py-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm">
                {comment.author?.full_name || 'Usuário'}
              </span>
              {comment.author?.is_vip && (
                <Badge variant="secondary" className="text-[10px] px-1 py-0 bg-gradient-to-r from-pink-500 to-cyan-500 text-white border-0">
                  VIP
                </Badge>
              )}
              {comment.is_pinned && (
                <Badge variant="outline" className="text-[10px] px-1 py-0 gap-1">
                  <Pin className="h-2.5 w-2.5" />
                  Fixado
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(comment.created_at), {
                  addSuffix: true,
                  locale: ptBR,
                })}
              </span>
            </div>
            <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
          </div>

          {/* Comment Actions */}
          <div className="flex items-center gap-2 mt-1 ml-1">
            <Button variant="ghost" size="sm" className="h-7 px-2 gap-1 text-xs">
              <ThumbsUp className="h-3.5 w-3.5" />
              {comment.likes_count > 0 && comment.likes_count}
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 px-2 gap-1 text-xs"
              onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
            >
              <Reply className="h-3.5 w-3.5" />
              Responder
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 px-1">
                  <MoreVertical className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem>
                  <Flag className="mr-2 h-4 w-4" />
                  Denunciar
                </DropdownMenuItem>
                {user?.id === comment.author_id && (
                  <DropdownMenuItem className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Reply Input */}
          <AnimatePresence>
            {replyingTo === comment.id && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2 flex gap-2"
              >
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={user?.user_metadata?.avatar_url} />
                  <AvatarFallback>
                    {user?.email?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 flex gap-2">
                  <Input
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Escreva uma resposta..."
                    className="h-9 text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmitReply(comment.id);
                      }
                    }}
                  />
                  <Button 
                    size="sm" 
                    className="h-9"
                    onClick={() => handleSubmitReply(comment.id)}
                    disabled={!replyContent.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Show/Hide Replies */}
          {hasReplies && !isReply && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 gap-1 text-primary"
              onClick={() => toggleReplies(comment.id)}
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  Ocultar {comment.replies?.length} respostas
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  Ver {comment.replies?.length} respostas
                </>
              )}
            </Button>
          )}

          {/* Replies */}
          <AnimatePresence>
            {isExpanded && comment.replies && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 space-y-3"
              >
                {comment.replies.map((reply) => (
                  <CommentItem key={reply.id} comment={reply} isReply />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    );
  });

  return (
    <div className="space-y-4" id="comments">
      <div className="flex items-center gap-2">
        <MessageCircle className="h-5 w-5" />
        <h3 className="font-semibold">
          {comments.length} Comentários
        </h3>
      </div>

      {/* New Comment Input */}
      {user ? (
        <div className="flex gap-3">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarImage src={user.user_metadata?.avatar_url} />
            <AvatarFallback>
              {user.email?.[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Adicione um comentário..."
              className="min-h-[80px] resize-none"
            />
            <div className="flex items-center justify-between mt-2">
              <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Smile className="h-5 w-5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <EmojiPicker
                    onEmojiClick={handleEmojiClick}
                    theme={Theme.DARK}
                    width={300}
                    height={350}
                  />
                </PopoverContent>
              </Popover>
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  onClick={() => setNewComment('')}
                  disabled={!newComment}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim()}
                >
                  Comentar
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-4 bg-muted/50 rounded-lg">
          <p className="text-muted-foreground">
            Faça login para comentar
          </p>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="h-10 w-10 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-20 bg-muted rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum comentário ainda. Seja o primeiro!
          </div>
        ) : (
          comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))
        )}
      </div>
    </div>
  );
}
