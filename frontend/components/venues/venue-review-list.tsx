"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StarRating } from "@/components/venues/star-rating";
import { VenueReview } from "@/types/venue";

interface VenueReviewListProps {
  reviews: VenueReview[];
  emptyText?: string;
}

function formatReviewDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export function VenueReviewList({
  reviews,
  emptyText = "No reviews yet — be the first to review after attending a mingle here.",
}: VenueReviewListProps) {
  if (!reviews || reviews.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/70 bg-brand-ivory/30 p-6 text-center text-sm text-muted-foreground">
        {emptyText}
      </div>
    );
  }

  return (
    <ul className="space-y-3 text-left">
      {reviews.map((review) => (
        <li
          key={review.id}
          className="rounded-2xl border border-border/60 bg-white p-4 shadow-xs"
        >
          <div className="flex items-start gap-3">
            <Avatar className="w-9 h-9 border border-border">
              <AvatarFallback className="bg-brand-coral/10 text-brand-coral font-bold text-xs">
                {review.author_name?.slice(0, 2).toUpperCase() || "M"}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold text-sm text-brand-navy">
                  {review.author_name || "A Mingler"}
                </span>
                <StarRating value={review.rating} size={3.5} />
              </div>
              {review.comment && (
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {review.comment}
                </p>
              )}
              <div className="mt-2 text-xs text-muted-foreground">
                {formatReviewDate(review.created_at)}
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
export default VenueReviewList;
