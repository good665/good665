import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const TOKEN_KEY = "auth_token";
const OAUTH_VERIFIER_KEY = "oauth_verifier";

// 모바일: 기기의 보안 저장소(Keychain/Keystore) / 웹: SecureStore 미지원이라 localStorage 사용
export async function saveToken(token: string) {
  if (Platform.OS === "web") {
    localStorage.setItem(TOKEN_KEY, token);
    return;
  }
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function getToken(): Promise<string | null> {
  if (Platform.OS === "web") {
    return localStorage.getItem(TOKEN_KEY);
  }
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function clearToken() {
  if (Platform.OS === "web") {
    localStorage.removeItem(TOKEN_KEY);
    return;
  }
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

// 소셜 로그인 PKCE verifier. 웹은 같은 탭에서 이동해 돌아오므로 sessionStorage
export async function saveOAuthVerifier(verifier: string) {
  if (Platform.OS === "web") {
    sessionStorage.setItem(OAUTH_VERIFIER_KEY, verifier);
    return;
  }
  await SecureStore.setItemAsync(OAUTH_VERIFIER_KEY, verifier);
}

export async function getOAuthVerifier(): Promise<string | null> {
  if (Platform.OS === "web") {
    return sessionStorage.getItem(OAUTH_VERIFIER_KEY);
  }
  return SecureStore.getItemAsync(OAUTH_VERIFIER_KEY);
}

export async function clearOAuthVerifier() {
  if (Platform.OS === "web") {
    sessionStorage.removeItem(OAUTH_VERIFIER_KEY);
    return;
  }
  await SecureStore.deleteItemAsync(OAUTH_VERIFIER_KEY);
}
