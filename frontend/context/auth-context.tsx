"use client";

import * as React from "react";
import { toast } from "sonner";
import { apiClient, extractErrorMessage } from "@/lib/api/client";
import {
  AuthApiResponse,
  AuthModalType,
  AuthTokens,
  PrivateProfile,
  SocialAuthUrlResponse,
  SocialProvider,
  User,
  UserRole,
} from "@/types/auth";

interface AuthContextType {
  user: User | null;
  profile: PrivateProfile | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isMounted: boolean;
  role: UserRole;
  activeModal: AuthModalType;
  prefilledEmail: string;
  openModal: (modal: AuthModalType, email?: string) => void;
  closeModal: () => void;
  saveSession: (
    newTokens: AuthTokens,
    newUser: User,
    newProfile?: PrivateProfile
  ) => void;
  initiateSocialAuth: (provider: SocialProvider) => Promise<void>;
  handleSocialCallback: (
    provider: SocialProvider,
    code: string,
    state?: string
  ) => Promise<boolean>;
  login: (email: string, password: string) => Promise<boolean>;
  register: (
    email: string,
    password: string,
    passwordConfirm: string,
    displayName?: string
  ) => Promise<boolean>;
  verifyEmail: (email: string, code: string) => Promise<boolean>;
  resendVerification: (email: string) => Promise<boolean>;
  requestPasswordReset: (email: string) => Promise<boolean>;
  verifyPasswordResetCode: (email: string, code: string) => Promise<boolean>;
  confirmPasswordReset: (
    email: string,
    code: string,
    password: string,
    passwordConfirm: string
  ) => Promise<boolean>;
  updateProfile: (data: Partial<PrivateProfile> | FormData) => Promise<boolean>;
  refreshProfile: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [profile, setProfile] = React.useState<PrivateProfile | null>(null);
  const [tokens, setTokens] = React.useState<AuthTokens | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    try {
      const storedUser = localStorage.getItem("mingler_user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      const storedProfile = localStorage.getItem("mingler_profile");
      if (storedProfile) {
        setProfile(JSON.parse(storedProfile));
      }
      const access = localStorage.getItem("mingler_access_token");
      const refresh = localStorage.getItem("mingler_refresh_token");
      if (access && refresh) {
        setTokens({ access, refresh });
      }
    } catch (e) {
      console.warn("Failed to read auth from localStorage", e);
    } finally {
      setIsLoading(false);
      setIsMounted(true);
    }
  }, []);

  const [activeModal, setActiveModal] = React.useState<AuthModalType>(null);
  const [prefilledEmail, setPrefilledEmail] = React.useState<string>("");

  const openModal = React.useCallback(
    (modal: AuthModalType, email?: string) => {
      if (email !== undefined) {
        setPrefilledEmail(email);
      }
      setActiveModal(modal);
    },
    []
  );

  const closeModal = React.useCallback(() => {
    setActiveModal(null);
  }, []);

  // Listen to session expiry event dispatched by Axios interceptor
  React.useEffect(() => {
    const handleAuthExpired = () => {
      setUser(null);
      setProfile(null);
      setTokens(null);
      toast.info("Your session has expired. Please log in again.");
      openModal("login");
    };

    window.addEventListener("mingler:auth:expired", handleAuthExpired);
    return () => {
      window.removeEventListener("mingler:auth:expired", handleAuthExpired);
    };
  }, [openModal]);

  const saveSession = (
    newTokens: AuthTokens,
    newUser: User,
    newProfile?: PrivateProfile
  ) => {
    setTokens(newTokens);
    setUser(newUser);
    localStorage.setItem("mingler_access_token", newTokens.access);
    localStorage.setItem("mingler_refresh_token", newTokens.refresh);
    localStorage.setItem("mingler_user", JSON.stringify(newUser));

    if (newProfile) {
      setProfile(newProfile);
      localStorage.setItem("mingler_profile", JSON.stringify(newProfile));
    }
  };

  const clearSession = () => {
    setTokens(null);
    setUser(null);
    setProfile(null);
    localStorage.removeItem("mingler_access_token");
    localStorage.removeItem("mingler_refresh_token");
    localStorage.removeItem("mingler_user");
    localStorage.removeItem("mingler_profile");
  };

  const getOAuthCallbackUri = (provider: SocialProvider): string => {
    if (typeof window === "undefined") {
      return `http://localhost:3000/auth/callback/${provider}`;
    }
    const hostname = window.location.hostname;
    // Google OAuth (RFC 8252) strictly forbids raw private IP addresses (192.168.x.x, 10.x.x.x, 172.16-31.x.x).
    // In local development, if accessed via LAN IP or loopback IP, normalize to localhost so it matches
    // the registered OAuth redirect URI in Google/Apple/Facebook consoles.
    const isPrivateIp =
      hostname === "127.0.0.1" ||
      hostname.startsWith("192.168.") ||
      hostname.startsWith("10.") ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname);

    if (isPrivateIp) {
      const port = window.location.port ? `:${window.location.port}` : "";
      return `${window.location.protocol}//localhost${port}/auth/callback/${provider}`;
    }
    return `${window.location.origin}/auth/callback/${provider}`;
  };

  const initiateSocialAuth = async (provider: SocialProvider): Promise<void> => {
    try {
      const callbackUri = getOAuthCallbackUri(provider);
      const res = await apiClient.get<SocialAuthUrlResponse>(
        "/auth/social/url/",
        {
          params: {
            provider,
            redirect_uri: callbackUri,
          },
        }
      );

      if (res.data?.authorization_url) {
        window.location.href = res.data.authorization_url;
      } else {
        toast.error(`Unable to get authorization URL for ${provider}.`);
      }
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  };

  const handleSocialCallback = async (
    provider: SocialProvider,
    code: string,
    state?: string
  ): Promise<boolean> => {
    try {
      const redirectUri = getOAuthCallbackUri(provider);
      const res = await apiClient.post<AuthApiResponse>("/auth/social/login/", {
        provider,
        code,
        redirect_uri: redirectUri,
        state: state || undefined,
      });

      if (res.data.tokens && res.data.user) {
        saveSession(res.data.tokens, res.data.user, res.data.profile);
        const welcomeMsg = res.data.is_new_user
          ? "Welcome to Mingler! Account created successfully."
          : res.data.message || "Social login successful.";
        toast.success(welcomeMsg);
        closeModal();
        return true;
      }
      return false;
    } catch (error) {
      toast.error(extractErrorMessage(error));
      return false;
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await apiClient.post<AuthApiResponse>("/auth/login/", {
        email,
        password,
      });

      if (res.data.tokens && res.data.user) {
        saveSession(res.data.tokens, res.data.user, res.data.profile);
        toast.success("Welcome back to Mingler!");
        closeModal();
        return true;
      }
      return false;
    } catch (error) {
      toast.error(extractErrorMessage(error));
      return false;
    }
  };

  const register = async (
    email: string,
    password: string,
    passwordConfirm: string,
    displayName?: string
  ): Promise<boolean> => {
    try {
      const res = await apiClient.post<AuthApiResponse>("/auth/register/", {
        email,
        password,
        password_confirm: passwordConfirm,
        display_name: displayName,
      });

      toast.success(
        res.data.message ||
          "Account created! Please check your email for the 6-digit code."
      );
      // Automatically transition to OTP verification modal with email passed through
      openModal("verify-email", email);
      return true;
    } catch (error) {
      toast.error(extractErrorMessage(error));
      return false;
    }
  };

  const verifyEmail = async (email: string, code: string): Promise<boolean> => {
    try {
      const res = await apiClient.post<AuthApiResponse>("/auth/verify-email/", {
        email,
        code,
      });

      if (res.data.tokens && res.data.user) {
        saveSession(res.data.tokens, res.data.user, res.data.profile);
        toast.success("Email verified successfully! Welcome to Mingler.");
        closeModal();
        return true;
      }
      return false;
    } catch (error) {
      toast.error(extractErrorMessage(error));
      return false;
    }
  };

  const resendVerification = async (email: string): Promise<boolean> => {
    try {
      const res = await apiClient.post<AuthApiResponse>(
        "/auth/resend-verification/",
        { email }
      );
      toast.success(
        res.data.message || "A new 6-digit verification code has been sent."
      );
      return true;
    } catch (error) {
      toast.error(extractErrorMessage(error));
      return false;
    }
  };

  const requestPasswordReset = async (email: string): Promise<boolean> => {
    try {
      const res = await apiClient.post<AuthApiResponse>(
        "/auth/password-reset/request/",
        { email }
      );
      toast.success(
        res.data.message || "Password reset code sent to your email."
      );
      return true;
    } catch (error) {
      toast.error(extractErrorMessage(error));
      return false;
    }
  };

  const verifyPasswordResetCode = async (
    email: string,
    code: string
  ): Promise<boolean> => {
    try {
      await apiClient.post("/auth/password-reset/verify-code/", { email, code });
      toast.success("Code verified! Please set your new password.");
      return true;
    } catch (error) {
      toast.error(extractErrorMessage(error));
      return false;
    }
  };

  const confirmPasswordReset = async (
    email: string,
    code: string,
    password: string,
    passwordConfirm: string
  ): Promise<boolean> => {
    try {
      const res = await apiClient.post<AuthApiResponse>(
        "/auth/password-reset/confirm/",
        {
          email,
          code,
          new_password: password,
          new_password_confirm: passwordConfirm,
          password,
          password_confirm: passwordConfirm,
        }
      );
      toast.success(
        res.data.message || "Password reset successfully. Please log in."
      );
      openModal("login", email);
      return true;
    } catch (error) {
      toast.error(extractErrorMessage(error));
      return false;
    }
  };

  const refreshProfile = async (): Promise<void> => {
    try {
      const res = await apiClient.get<{ success: boolean; profile: PrivateProfile }>(
        "/profiles/me/"
      );
      if (res.data.profile) {
        setProfile(res.data.profile);
        localStorage.setItem("mingler_profile", JSON.stringify(res.data.profile));
      }
    } catch (e) {
      console.error("Failed to refresh profile", e);
    }
  };

  const updateProfile = async (
    data: Partial<PrivateProfile> | FormData
  ): Promise<boolean> => {
    try {
      const res = await apiClient.patch<{
        success: boolean;
        message: string;
        profile: PrivateProfile;
      }>("/profiles/me/", data);

      if (res.data.profile) {
        setProfile(res.data.profile);
        localStorage.setItem("mingler_profile", JSON.stringify(res.data.profile));
        toast.success("Profile updated successfully!");
        return true;
      }
      return false;
    } catch (error) {
      toast.error(extractErrorMessage(error));
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      const refreshToken = localStorage.getItem("mingler_refresh_token");
      if (refreshToken) {
        await apiClient.post("/auth/logout/", { refresh: refreshToken });
      }
    } catch (e) {
      console.warn("Logout request completed with warning", e);
    } finally {
      clearSession();
      toast.info("You have been logged out.");
      closeModal();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        tokens,
        isAuthenticated: !!user && !!tokens,
        isLoading,
        isMounted,
        role: user?.role || "member",
        activeModal,
        prefilledEmail,
        openModal,
        closeModal,
        saveSession,
        initiateSocialAuth,
        handleSocialCallback,
        login,
        register,
        verifyEmail,
        resendVerification,
        requestPasswordReset,
        verifyPasswordResetCode,
        confirmPasswordReset,
        updateProfile,
        refreshProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
