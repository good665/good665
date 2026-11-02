import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { API_BASE_URL } from "@/config/api";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { createOAuthChallenge, oauthErrorMessage, parseOAuthRedirect } from "@/lib/oauth";

const APP_REDIRECT = "tansongmobile://oauth-callback";

const PROVIDERS: Record<string, { label: string; background: string; color: string; border?: string }> = {
  kakao: { label: "카카오로 계속하기", background: "#FEE500", color: "#191919" },
  naver: { label: "네이버로 계속하기", background: "#03C75A", color: "#FFFFFF" },
  google: { label: "구글로 계속하기", background: "#FFFFFF", color: "#1F1F1F", border: "#747775" },
};

/** 서버에 키가 설정된 제공자만 표시. 하나도 없으면 아무것도 그리지 않음 */
export function SocialLoginButtons() {
  const { loginWithOAuthCode } = useAuth();
  const [providers, setProviders] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    apiFetch<string[]>("/api/auth/oauth/providers")
      .then((list) => {
        if (active) setProviders(list.filter((name) => PROVIDERS[name]));
      })
      .catch(() => {
        // 목록을 못 받으면 버튼만 숨김. 이메일 로그인은 그대로 사용 가능
      });
    return () => {
      active = false;
    };
  }, []);

  async function start(provider: string) {
    setError("");
    setBusy(true);
    try {
      const challenge = await createOAuthChallenge();
      const base = `${API_BASE_URL}/api/auth/oauth/${provider}/start?code_challenge=${challenge}&redirect=`;

      if (Platform.OS === "web") {
        // 웹은 같은 창에서 이동하고 /oauth-callback 화면이 이어서 처리
        window.location.assign(base + encodeURIComponent(`${window.location.origin}/oauth-callback`));
        return;
      }

      const result = await WebBrowser.openAuthSessionAsync(base + encodeURIComponent(APP_REDIRECT), APP_REDIRECT);
      if (result.type !== "success") return; // 사용자가 창을 닫음

      const { code, error: redirectError } = parseOAuthRedirect(result.url);
      if (code) {
        await loginWithOAuthCode(code); // 이동은 AuthGate 가 처리
      } else {
        setError(oauthErrorMessage(redirectError ?? "failed"));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : oauthErrorMessage("failed"));
    } finally {
      setBusy(false);
    }
  }

  if (providers.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.dividerRow}>
        <View style={styles.divider} />
        <Text style={styles.dividerText}>또는</Text>
        <View style={styles.divider} />
      </View>

      {providers.map((name) => {
        const p = PROVIDERS[name];
        return (
          <Pressable
            key={name}
            style={[
              styles.button,
              { backgroundColor: p.background, borderColor: p.border ?? p.background },
              busy && styles.disabled,
            ]}
            accessibilityRole="button"
            disabled={busy}
            onPress={() => start(name)}
          >
            <Text style={[styles.text, { color: p.color }]}>{p.label}</Text>
          </Pressable>
        );
      })}

      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 22 },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 },
  divider: { flex: 1, height: 1, backgroundColor: "#DDE2DE" },
  dividerText: { color: "#777", fontSize: 13 },
  button: { paddingVertical: 15, borderRadius: 12, borderWidth: 1, alignItems: "center", marginBottom: 10 },
  disabled: { opacity: 0.6 },
  text: { fontSize: 16, fontWeight: "700" },
  error: { color: "#C62828", marginTop: 6, lineHeight: 20 },
});
