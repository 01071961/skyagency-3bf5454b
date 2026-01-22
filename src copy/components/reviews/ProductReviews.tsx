import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Star, ThumbsUp, MessageSquare, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  title: string;
  comment: string;
  createdAt: Date;
  helpful: number;
  verified: boolean;
}

interface ProductReviewsProps {
  productId: string;
  reviews?: Review[];
  averageRating?: number;
  totalReviews?: number;
  onSubmitReview?: (review: { rating: number; title: string; comment: string }) => void;
  canReview?: boolean;
}

export const ProductReviews = ({
  productId,
  reviews = [],
  averageRating = 0,
  totalReviews = 0,
  onSubmitReview,
  canReview = false
}: ProductReviewsProps) => {
  const [newReview, setNewReview] = useState({ rating: 0, title: '', comment: '' });
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<'all' | number>('all');

  // Calculate rating distribution
  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: reviews.filter(r => Math.floor(r.rating) === rating).length,
    percentage: totalReviews > 0 
      ? (reviews.filter(r => Math.floor(r.rating) === rating).length / totalReviews) * 100 
      : 0
  }));

  const filteredReviews = filter === 'all' 
    ? reviews 
    : reviews.filter(r => Math.floor(r.rating) === filter);

  const handleSubmit = () => {
    if (newReview.rating === 0 || !newReview.comment.trim()) return;
    onSubmitReview?.(newReview);
    setNewReview({ rating: 0, title: '', comment: '' });
    setShowForm(false);
  };

  const renderStars = (rating: number, interactive = false, onSelect?: (rating: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => onSelect?.(star)}
            className={cn(
              "transition-colors",
              interactive && "cursor-pointer hover:scale-110"
            )}
          >
            <Star
              className={cn(
                "h-5 w-5",
                rating >= star
                  ? "fill-yellow-400 text-yellow-400"
                  : rating >= star - 0.5
                  ? "fill-yellow-400/50 text-yellow-400"
                  : "text-muted-foreground"
              )}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Average Rating */}
            <div className="text-center md:text-left">
              <div className="flex items-center gap-4 justify-center md:justify-start">
                <span className="text-5xl font-bold">{averageRating.toFixed(1)}</span>
                <div>
                  {renderStars(averageRating)}
                  <p className="text-sm text-muted-foreground mt-1">
                    {totalReviews} avaliações
                  </p>
                </div>
              </div>
              {canReview && !showForm && (
                <Button className="mt-4" onClick={() => setShowForm(true)}>
                  <Star className="h-4 w-4 mr-2" />
                  Escrever Avaliação
                </Button>
              )}
            </div>

            {/* Rating Distribution */}
            <div className="space-y-2">
              {ratingDistribution.map(({ rating, count, percentage }) => (
                <button
                  key={rating}
                  onClick={() => setFilter(filter === rating ? 'all' : rating)}
                  className={cn(
                    "flex items-center gap-2 w-full group",
                    filter === rating && "opacity-100",
                    filter !== 'all' && filter !== rating && "opacity-50"
                  )}
                >
                  <span className="text-sm w-8">{rating} ★</span>
                  <Progress value={percentage} className="flex-1 h-2" />
                  <span className="text-sm text-muted-foreground w-8">{count}</span>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* New Review Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sua Avaliação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nota</label>
              <div className="mt-2">
                {renderStars(
                  newReview.rating,
                  true,
                  (rating) => setNewReview(prev => ({ ...prev, rating }))
                )}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Título (opcional)</label>
              <input
                type="text"
                className="mt-1 w-full px-3 py-2 border rounded-md"
                placeholder="Resumo da sua avaliação"
                value={newReview.title}
                onChange={(e) => setNewReview(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Comentário</label>
              <Textarea
                className="mt-1"
                placeholder="Conte sua experiência com o produto..."
                rows={4}
                value={newReview.comment}
                onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSubmit} disabled={newReview.rating === 0 || !newReview.comment.trim()}>
                Enviar Avaliação
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter */}
      {reviews.length > 0 && (
        <div className="flex items-center justify-between">
          <h3 className="font-medium">
            {filter === 'all' ? 'Todas as avaliações' : `Avaliações com ${filter} estrelas`}
          </h3>
          {filter !== 'all' && (
            <Button variant="ghost" size="sm" onClick={() => setFilter('all')}>
              Limpar filtro
            </Button>
          )}
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredReviews.map((review) => (
          <Card key={review.id}>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <Avatar>
                  <AvatarImage src={review.userAvatar} />
                  <AvatarFallback>{review.userName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{review.userName}</span>
                    {review.verified && (
                      <Badge variant="secondary" className="text-xs">
                        ✓ Compra verificada
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {renderStars(review.rating)}
                    {review.title && (
                      <span className="font-medium">{review.title}</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {format(review.createdAt, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                  <p className="mt-3 text-sm">{review.comment}</p>
                  <div className="flex items-center gap-4 mt-4">
                    <Button variant="ghost" size="sm">
                      <ThumbsUp className="h-4 w-4 mr-2" />
                      Útil ({review.helpful})
                    </Button>
                    <Button variant="ghost" size="sm">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Responder
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredReviews.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Star className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {filter === 'all' 
                  ? 'Nenhuma avaliação ainda. Seja o primeiro a avaliar!' 
                  : `Nenhuma avaliação com ${filter} estrelas.`}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ProductReviews;
