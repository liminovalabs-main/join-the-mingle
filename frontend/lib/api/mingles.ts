import { apiClient } from "./client";
import {
  Mingle,
  MingleAttendeesResponse,
  MingleFilterParams,
  PaginatedResponse,
} from "@/types/mingle";

/**
 * Fetch paginated list of live Mingle events with filtering.
 */
export async function getMingles(
  params?: MingleFilterParams
): Promise<PaginatedResponse<Mingle>> {
  const queryParams = new URLSearchParams();

  if (params?.experience_type && params.experience_type !== "all") {
    queryParams.set("experience_type", params.experience_type);
  }
  if (params?.area && params.area !== "all") {
    queryParams.set("area", params.area);
  }
  if (params?.date_from) {
    queryParams.set("date_from", params.date_from);
  }
  if (params?.date_to) {
    queryParams.set("date_to", params.date_to);
  }
  if (params?.price_max) {
    queryParams.set("price_max", String(params.price_max));
  }
  if (params?.search) {
    queryParams.set("search", params.search.trim());
  }
  if (params?.ordering) {
    queryParams.set("ordering", params.ordering);
  }
  if (params?.page) {
    queryParams.set("page", String(params.page));
  }
  if (params?.page_size) {
    queryParams.set("page_size", String(params.page_size));
  }
  if (params?.upcoming_only !== undefined) {
    queryParams.set("upcoming_only", String(params.upcoming_only));
  }
  if (params?.include_past) {
    queryParams.set("include_past", "true");
  }

  const queryString = queryParams.toString();
  const url = queryString ? `/mingles/?${queryString}` : "/mingles/";

  const response = await apiClient.get<PaginatedResponse<Mingle>>(url);
  return response.data;
}

/**
 * Fetch full details of a specific Mingle event.
 */
export async function getMingle(id: string): Promise<Mingle> {
  const response = await apiClient.get<Mingle>(`/mingles/${id}/`);
  return response.data;
}

/**
 * Fetch confirmed attendee list for a Mingle (UK GDPR sanitized).
 */
export async function getMingleAttendees(
  id: string
): Promise<MingleAttendeesResponse> {
  const response = await apiClient.get<MingleAttendeesResponse>(
    `/mingles/${id}/attendees/`
  );
  return response.data;
}
