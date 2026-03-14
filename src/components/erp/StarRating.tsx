import { Star } from 'lucide-react';

export default function StarRating({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i < Math.round(rating) ? 'fill-warning text-warning' : 'text-border'}`}
        />
      ))}
      <span className="ml-1.5 text-xs text-muted-foreground">{rating.toFixed(1)}</span>
    </div>
  );
}
