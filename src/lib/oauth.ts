import { apiFetch } from "@/lib/api";

const MESSAGES: Record<string, string> = {
  cancelled: "로그인이 취소되었습니다.",
  email_exists: "이미 가입된 이메일입니다. 이메일과 비밀번호로 로그인해 주세요.",
  failed: "소셜 로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.",
};

export function oauthErrorMessage(error: string) {
  return MESSAGES[error] ?? MESSAGES.failed;
}

/** 서버가 돌려보낸 주소에서 일회용 코드 또는 오류를 꺼냄 */
export function parseOAuthRedirect(url: string): { code?: string; error?: string } {
  const code = url.match(/[?&]code=([^&#]+)/)?.[1];
  if (code) return { code: decodeURIComponent(code) };

  const error = url.match(/[?&]error=([^&#]+)/)?.[1];
  return { error: error ? decodeURIComponent(error) : "failed" };
}

const exchanges = new Map<string, Promise<unknown>>();

// 코드는 한 번만 쓸 수 있는데, Android 는 딥링크가 화면과 인증 세션 양쪽에 도착할 수 있어 같은 결과를 나눠 씀
export function exchangeOAuthCode<T>(code: string): Promise<T> {
  let exchange = exchanges.get(code);
  if (!exchange) {
    exchange = apiFetch<T>("/api/auth/oauth/exchange", {
      method: "POST",
      body: JSON.stringify({ code }),
    });
    exchanges.set(code, exchange);
  }
  return exchange as Promise<T>;
}
