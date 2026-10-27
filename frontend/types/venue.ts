export interface VenueOpeningHour {
  id: string;
  day_of_week: number; // 0=Monday, 6=Sunday
  day_name: string;
  open_time: string | null; // HH:MM:SS
  close_time: string | null; // HH:MM:SS
  is_closed: boolean;
}

export interface VenueReview {
  id: string;
  rating: number; // 1-5
  comment: string;
  author_name: string;
  created_at: string;
}

export interface Venue {
  id: string;
  name: string;
  slug: string;
  category: string;
  area: string;
  address: string;
  postcode: string;
  description: string;
  hero_image: string | null;
  status: "pending" | "approved" | "rejected";
  average_rating: number;
  review_count: number;
  opening_hours?: VenueOpeningHour[];
  reviews?: VenueReview[];
  created_at: string;
  updated_at?: string;
}

export interface VenueFilterParams {
  area?: string;
  category?: string;
  search?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
}
