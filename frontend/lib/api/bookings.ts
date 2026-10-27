import { apiClient } from "./client";
import {
  Booking,
  CancelBookingResponse,
  CheckoutSessionPayload,
  CheckoutSessionResponse,
  CreateBookingPayload,
  CreateBookingResponse,
  MyBookingsFilterParams,
  PaginatedBookingsResponse,
} from "@/types/booking";

/**
 * Reserve 1 to 5 seats for an upcoming Mingle with concurrency-safe DB locking.
 */
export async function createBooking(
  payload: CreateBookingPayload
): Promise<CreateBookingResponse> {
  const res = await apiClient.post<CreateBookingResponse>("/bookings/", payload);
  return res.data;
}

/**
 * Retrieve all reservations made by the authenticated member.
 */
export async function getMyBookings(
  params?: MyBookingsFilterParams
): Promise<PaginatedBookingsResponse> {
  const res = await apiClient.get<PaginatedBookingsResponse>("/bookings/my-bookings/", {
    params,
  });
  return res.data;
}

/**
 * Retrieve a single booking by ID with embedded Mingle and Venue snapshots.
 */
export async function getBooking(id: string): Promise<Booking> {
  const res = await apiClient.get<Booking>(`/bookings/${id}/`);
  return res.data;
}

/**
 * Initiate a Stripe Checkout session for a pending reservation.
 */
export async function createCheckoutSession(
  bookingId: string,
  payload?: CheckoutSessionPayload
): Promise<CheckoutSessionResponse> {
  const res = await apiClient.post<CheckoutSessionResponse>(
    `/bookings/${bookingId}/checkout/`,
    payload || {}
  );
  return res.data;
}

/**
 * Cancel an upcoming reservation and release reserved capacity immediately.
 */
export async function cancelBooking(
  bookingId: string,
  reason?: string
): Promise<CancelBookingResponse> {
  const res = await apiClient.post<CancelBookingResponse>(
    `/bookings/${bookingId}/cancel/`,
    { reason: reason || "" }
  );
  return res.data;
}

/**
 * Download RFC 5545 standard .ics calendar invitation for confirmed booking.
 */
export async function getBookingCalendarBlob(bookingId: string): Promise<Blob> {
  const res = await apiClient.get(`/bookings/${bookingId}/calendar/`, {
    responseType: "blob",
  });
  return res.data;
}

/**
 * Helper to trigger client-side download of the .ics calendar file.
 */
export async function downloadCalendarInvite(bookingId: string, filename?: string): Promise<void> {
  const blob = await getBookingCalendarBlob(bookingId);
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || `mingle-booking-${bookingId.slice(0, 8)}.ics`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}
