import * as Crypto from "expo-crypto";

import { apiFetch } from "@/lib/api";
import { clearOAuthVerifier, getOAuthVerifier, saveOAuthVerifier } from "@/lib/storage";

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

// 256 은 64 로 나누어떨어져 나머지 연산으로도 글자 분포가 치우치지 않음
const VERIFIER_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

/** PKCE: verifier 를 이 기기에 저장하고, 서버에 보낼 해시(challenge)를 돌려줌 */
export async function createOAuthChallenge() {
  const bytes = await Crypto.getRandomBytesAsync(43);
  const verifier = Array.from(bytes, (b) => VERIFIER_CHARS[b % 64]).join("");
  await saveOAuthVerifier(verifier);

  const digest = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, verifier, {
    encoding: Crypto.CryptoEncoding.BASE64,
  });
  return digest.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function exchange<T>(code: string): Promise<T> {
  const codeVerifier = await getOAuthVerifier();
  if (!codeVerifier) {
    // 이 기기에서 시작하지 않은 로그인 (남이 보낸 링크 등)
    throw new Error("로그인 요청을 찾을 수 없습니다. 로그인 화면에서 다시 시도해 주세요.");
  }

  const result = await apiFetch<T>("/api/auth/oauth/exchange", {
    method: "POST",
    body: JSON.stringify({ code, codeVerifier }),
  });
  await clearOAuthVerifier();
  return result;
}

const exchanges = new Map<string, Promise<unknown>>();

// 코드는 한 번만 쓸 수 있는데, Android 는 딥링크가 화면과 인증 세션 양쪽에 도착할 수 있어 같은 결과를 나눠 씀
export function exchangeOAuthCode<T>(code: string): Promise<T> {
  let pending = exchanges.get(code);
  if (!pending) {
    pending = exchange<T>(code);
    exchanges.set(code, pending);
  }
  return pending as Promise<T>;
}
