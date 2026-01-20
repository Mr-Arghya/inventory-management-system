"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import type { User, UserRole, AuthStep, RegisterFormData } from "@/types";
import { authApi } from "@/services/api";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  authCheckLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  authStep: AuthStep;
  pendingEmail: string;
  initiateLogin: (email: string, password: string) => Promise<void>;
  initiateRegister: (data: RegisterFormData) => Promise<void>;
  logout: () => Promise<void>;
  resetAuthFlow: () => void;
  clearError: () => void;
  hasPermission: (requiredRoles: UserRole[]) => boolean;
  isOwner: boolean;
  isManager: boolean;
  isStaff: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const ROLE_HIERARCHY: Record<UserRole, number> = {
  owner: 3,
  manager: 2,
  staff: 1,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [authCheckLoading, setAuthCheckLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [authStep, setAuthStep] = useState<AuthStep>("email");
  const [pendingEmail, setPendingEmail] = useState("");
  const [pendingRegisterData, setPendingRegisterData] =
    useState<RegisterFormData | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("auth_token");
        if (!token) {
          setAuthCheckLoading(false);
          return;
        }

        const response = await authApi.checkAuth();
        if (response.error) {
          localStorage.removeItem("auth_token");
          setUser(null);
          setAuthCheckLoading(false);
          return;
        }
        setUser(JSON.parse(localStorage.getItem("user") || ""));
        setAuthCheckLoading(false);
        
      } catch (err) {
        console.error("[Auth] Error checking auth:", err);
        localStorage.removeItem("auth_token");
      } finally {
        setAuthCheckLoading(false);
      }
    };

    checkAuth();
  }, []);

  const initiateLogin = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authApi.sendLogin(email, password);
      if (!response.error) {
        setPendingEmail(email);
        localStorage.setItem("auth_token", response.data.accessToken);
        setUser(response.data.user);
        localStorage.setItem("user", JSON.stringify(response.data.user));
        setAuthStep("complete");
        router.push("/dashboard");
      } else {
        setError(response.message || "Failed to send verification code");
      }
    } catch (err) {
      setError(
        "User not found. Please check your email or contact your administrator."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const initiateRegister = useCallback(async (data: RegisterFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authApi.sendRegister(data);
      if (!response.error) {
        setPendingEmail(data.email);
        setPendingRegisterData(data);
        setAuthStep("otp");
      } else {
        setError(response.message || "Failed to send verification code");
      }
    } catch (err) {
      setError("Failed to register. Email may already be in use.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.error("[Auth] Logout error:", err);
    } finally {
      localStorage.removeItem("auth_token");
      setUser(null);
      setAuthStep("email");
      setPendingEmail("");
      setPendingRegisterData(null);
      router.push("/login");
    }
  }, [router]);

  const resetAuthFlow = useCallback(() => {
    setAuthStep("email");
    setPendingEmail("");
    setPendingRegisterData(null);
    setError(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const hasPermission = useCallback(
    (requiredRoles: UserRole[]) => {
      if (!user) return false;
      return requiredRoles.some(
        (role) => ROLE_HIERARCHY[user.user_type] >= ROLE_HIERARCHY[role]
      );
    },
    [user]
  );

  const value: AuthContextValue = {
    user,
    isLoading,
    authCheckLoading,
    isAuthenticated: !!user,
    error,
    authStep,
    pendingEmail,
    initiateLogin,
    initiateRegister,
    logout,
    resetAuthFlow,
    clearError,
    hasPermission,
    isOwner: user?.user_type === "owner",
    isManager: user?.user_type === "manager" || user?.user_type === "owner",
    isStaff:
      user?.user_type === "staff" ||
      user?.user_type === "manager" ||
      user?.user_type === "owner",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
