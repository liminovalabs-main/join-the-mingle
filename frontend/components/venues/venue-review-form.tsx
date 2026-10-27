"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/venues/star-rating";
import { submitVenueReview } from "@/lib/api/venues";
import { extractErrorMessage } from "@/lib/api/client";

interface VenueReviewFormProps {
  venueSlugOrId: string;
  onSaved?: () => void;
}

export function VenueReviewForm({
  venueSlugOrId,
  onSaved,
}: VenueReviewFormProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1 || rating > 5) {
      toast.error("Please select a rating between 1 and 5 stars.");
      return;
    }

    setIsSubmitting(true);
    try {
      await submitVenueReview(venueSlugOrId, {
        rating,
        comment: comment.trim(),
      });
      toast.success("Thank you! Your venue review has been posted.");
      setComment("");
      onSaved?.();
    } catch (err) {
      const msg = extractErrorMessage(err);
      toast.error(msg || "Could not save your review. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-brand-coral/30 bg-brand-coral/5 p-5 text-left"
    >
      <h3 className="font-heading text-lg font-bold text-brand-navy">
        You mingled here &mdash; how was the venue?
      </h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Rate this venue and leave a note for fellow Minglers.
      </p>

      <div className="mt-3 flex items-center gap-3">
        <span className="text-xs font-semibold text-brand-navy">Your rating:</span>
        <StarRating value={rating} onChange={setRating} size={5} />
      </div>

      <div className="mt-4">
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          placeholder="What made this venue special? Atmosphere, staff, drinks..."
          className="w-full rounded-xl border border-border/70 bg-white p-3 text-sm text-brand-navy focus:border-brand-coral focus:outline-none focus:ring-2 focus:ring-brand-coral/20 resize-none placeholder:text-muted-foreground"
        />
      </div>

      <div className="mt-4 flex justify-end">
        <Button
          type="submit"
          variant="coral"
          disabled={isSubmitting}
          className="rounded-full px-6 text-xs font-bold uppercase tracking-wider"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              Posting...
            </>
          ) : (
            "Post Review"
          )}
        </Button>
      </div>
    </form>
  );
}
export default VenueReviewForm;
