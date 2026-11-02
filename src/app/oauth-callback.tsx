import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { useAuth } from "@/context/AuthContext";
import { oauthErrorMessage } from "@/lib/oauth";

// 소셜 로그인 복귀 화면: 웹은 항상 여기로 돌아오고, Android 는 딥링크로 함께 열릴 수 있음
export default function OAuthCallbackScreen() {
  const router = useRouter();
  const { loginWithOAuthCode } = useAuth();
  const { code, error } = useLocalSearchParams<{ code?: string; error?: string }>();
  const [message, setMessage] = useState(() => (code ? "" : oauthErrorMessage(error ?? "failed")));

  useEffect(() => {
    if (!code) return;

    loginWithOAuthCode(code)
      .then(() => router.replace("/"))
      .catch((e) => setMessage(e instanceof Error ? e.message : oauthErrorMessage("failed")));
  }, [code, loginWithOAuthCode, router]);

  if (!message) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#39765B" />
        <Text style={styles.text}>로그인 중입니다...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{message}</Text>
      <Pressable style={styles.button} accessibilityRole="button" onPress={() => router.replace("/login")}>
        <Text style={styles.buttonText}>로그인 화면으로</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24, backgroundColor: "#F7F8FA" },
  text: { marginTop: 14, fontSize: 15, color: "#333", textAlign: "center", lineHeight: 22 },
  button: { marginTop: 20, backgroundColor: "#39765B", paddingHorizontal: 22, paddingVertical: 13, borderRadius: 10 },
  buttonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
});
