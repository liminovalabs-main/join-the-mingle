import { apiClient } from "./client";
import {
  CommissionSettingsResponse,
  MingleApprovalItem,
  PlatformSettingAudit,
  VenueApprovalItem,
} from "@/types/admin";
import { PaginatedResponse } from "@/types/mingle";

/**
 * Fetch pending venue registration applications awaiting founder approval.
 */
export async function getPendingVenues(
  page: number = 1
): Promise<PaginatedResponse<VenueApprovalItem>> {
  const response = await apiClient.get<PaginatedResponse<VenueApprovalItem>>(
    `/admin/approvals/venues/?page=${page}`
  );
  return response.data;
}

/**
 * Approve or reject a pending venue application.
 */
export async function decideVenue(
  id: string,
  action: "approve" | "reject"
): Promise<VenueApprovalItem> {
  const response = await apiClient.post<VenueApprovalItem>(
    `/admin/approvals/venues/${id}/`,
    { action }
  );
  return response.data;
}

/**
 * Fetch submitted Mingle experience proposals awaiting founder curation.
 */
export async function getPendingMingles(
  page: number = 1
): Promise<PaginatedResponse<MingleApprovalItem>> {
  const response = await apiClient.get<PaginatedResponse<MingleApprovalItem>>(
    `/admin/approvals/mingles/?page=${page}`
  );
  return response.data;
}

/**
 * Approve, request changes, or reject a submitted Mingle experience proposal.
 */
export async function decideMingle(
  id: string,
  action: "approve" | "changes_requested" | "reject",
  curatorNotes: string = ""
): Promise<MingleApprovalItem> {
  const response = await apiClient.post<MingleApprovalItem>(
    `/admin/approvals/mingles/${id}/`,
    {
      action,
      curator_notes: curatorNotes,
    }
  );
  return response.data;
}

/**
 * Fetch current platform commission percentage and historical audit trail.
 */
export async function getCommissionSettings(): Promise<CommissionSettingsResponse> {
  const response = await apiClient.get<CommissionSettingsResponse>(
    "/admin/platform-settings/commission/"
  );
  return response.data;
}

/**
 * Dynamically adjust platform commission rate with audit log notes.
 */
export async function updateCommissionRate(
  commissionRate: number,
  notes: string = ""
): Promise<{
  success: boolean;
  message: string;
  setting: PlatformSettingAudit;
}> {
  const response = await apiClient.patch<{
    success: boolean;
    message: string;
    setting: PlatformSettingAudit;
  }>("/admin/platform-settings/commission/", {
    commission_rate: commissionRate,
    notes,
  });
  return response.data;
}
