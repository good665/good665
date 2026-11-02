import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { ApiError, apiFetch, setUnauthorizedHandler } from "@/lib/api";
import { exchangeOAuthCode } from "@/lib/oauth";
import { clearToken, getToken, saveToken } from "@/lib/storage";

export type User = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: string;
};

type AuthResponse = {
  token: string;
  user: User;
};

type SignupInput = {
  name: string;
  email: string;
  phone: string;
  password: string;
};

export type BusinessSignupInput = SignupInput & {
  organizationName: string;
  organizationType: string;
  businessRegistrationNumber: string;
  representativeName: string; // 국세청 진위확인용
  businessStartDate: string; // YYYY-MM-DD
  organizationPhone: string;
  organizationEmail: string;
};

type AuthContextValue = {
  user: User | null;
  loading: boolean; // 앱 시작 시 저장된 토큰을 확인하는 동안 true
  login: (email: string, password: string) => Promise<void>;
  loginWithOAuthCode: (code: string) => Promise<void>;
  signup: (input: SignupInput) => Promise<void>;
  signupBusiness: (input: BusinessSignupInput) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async () => {
    await clearToken();
    setUser(null);
  }, []);

  // API 가 401 을 돌려주면(토큰 만료 등) 자동 로그아웃
  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout();
    });
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  // 앱 시작 시: 저장된 토큰이 있으면 /me 로 유효성 확인
  useEffect(() => {
    let active = true;

    async function restore() {
      try {
        const token = await getToken();

        if (token) {
          const me = await apiFetch<User>("/api/auth/me");
          if (active) setUser(me);
        }
      } catch (e) {
        // 토큰이 무효면 삭제. 네트워크 오류면 토큰은 남겨 두고 비로그인 상태로 시작
        if (e instanceof ApiError && e.status === 401) {
          await clearToken();
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    restore();

    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await apiFetch<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    await saveToken(result.token);
    setUser(result.user);
  }, []);

  const loginWithOAuthCode = useCallback(async (code: string) => {
    const result = await exchangeOAuthCode<AuthResponse>(code);

    await saveToken(result.token);
    setUser(result.user);
  }, []);

  const signup = useCallback(async (input: SignupInput) => {
    const result = await apiFetch<AuthResponse>("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify(input),
    });

    await saveToken(result.token);
    setUser(result.user);
  }, []);

  const signupBusiness = useCallback(async (input: BusinessSignupInput) => {
    const result = await apiFetch<AuthResponse>("/api/auth/signup-business", {
      method: "POST",
      body: JSON.stringify(input),
    });

    await saveToken(result.token);
    setUser(result.user);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, loginWithOAuthCode, signup, signupBusiness, logout }),
    [user, loading, login, loginWithOAuthCode, signup, signupBusiness, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error("useAuth 는 AuthProvider 안에서만 사용할 수 있습니다.");
  }

  return ctx;
}
