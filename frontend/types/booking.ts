import { Mingle } from "./mingle";

export type BookingStatus = "pending" | "confirmed" | "cancelled" | "refunded";

export interface Booking {
  id: string;
  mingle: Mingle;
  places_booked: number;
  unit_price: string;
  total_amount: string;
  status: BookingStatus;
  status_display: string;
  created_at: string;
  updated_at: string;
}

export interface CreateBookingPayload {
  mingle_id: string;
  places_booked: number;
}

export interface CreateBookingResponse {
  success: boolean;
  message: string;
  booking: Booking;
}

export interface CheckoutSessionPayload {
  booking_id?: string;
  success_url?: string;
  cancel_url?: string;
}

export interface CheckoutSessionResponse {
  success: boolean;
  session_id: string;
  checkout_url: string;
}

export interface CancelBookingPayload {
  reason?: string;
}

export interface CancelBookingResponse {
  success: boolean;
  message: string;
  booking: Booking;
}

export interface MyBookingsFilterParams {
  status?: BookingStatus;
  page?: number;
  page_size?: number;
}

export interface PaginatedBookingsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Booking[];
}
