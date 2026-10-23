/**
 * Authentication and Member Profile Type Definitions
 * Strictly aligned with Backend Django REST Framework Serializers and UK GDPR requirements.
 */

export type UserRole = "member" | "venue_manager" | "admin";

export interface User {
  id: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  is_email_verified: boolean;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

/**
 * Public Attendee Profile (UK GDPR Sanitized)
 * Date of birth and email are strictly omitted.
 */
export interface PublicProfile {
  id: string;
  display_name: string;
  photo?: string;
  gender?: "Male" | "Female" | "Prefer not to say" | "";
  relationship_status?: "Single" | "Married" | "It's complicated" | "";
  bio?: string;
  interests?: string[];
  instagram_handle?: string;
  linkedin_url?: string;
}

/**
 * Private Profile (Only accessible by profile owner and platform admin)
 */
export interface PrivateProfile extends PublicProfile {
  email: string;
  role: UserRole;
  is_email_verified: boolean;
  date_of_birth?: string; // YYYY-MM-DD (UK GDPR Private)
  is_age_verified: boolean;
  sound_enabled: boolean;
  notifications_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthApiResponse {
  success: boolean;
  message?: string;
  is_new_user?: boolean;
  provider?: SocialProvider;
  tokens?: AuthTokens;
  user?: User;
  profile?: PrivateProfile;
  error?: {
    code?: string;
    message?: string;
    details?: Record<string, string | string[]>;
  };
}

export type SocialProvider =
  | "google"
  | "apple"
  | "facebook"
  | "instagram"
  | "tiktok"
  | "linkedin";

export interface SocialAccount {
  id: string;
  provider: SocialProvider;
  uid: string;
  created_at: string;
  extra_data?: Record<string, unknown>;
}

export interface SocialAuthUrlResponse {
  success: boolean;
  provider: SocialProvider;
  authorization_url: string;
}

export interface SocialAccountListResponse {
  success: boolean;
  social_accounts: SocialAccount[];
}

export type AuthModalType =
  | "login"
  | "register"
  | "verify-email"
  | "forgot-password"
  | null;
