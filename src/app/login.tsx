import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { SocialLoginButtons } from "@/components/social-login-buttons";
import { useAuth } from "@/context/AuthContext";

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit() {
    setError("");

    if (!email.trim() || !password) {
      setError("이메일과 비밀번호를 입력해 주세요.");
      return;
    }

    setLoading(true);

    try {
      await login(email.trim(), password);
      // 이동은 _layout.tsx AuthGate 가 처리 (보던 화면으로 돌아감)
    } catch (e) {
      setError(e instanceof Error ? e.message : "로그인 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}>
          <Text style={styles.backText}>‹ 둘러보기</Text>
        </Pressable>

        <Text style={styles.brand}>시니어라이프</Text>
        <Text style={styles.title}>로그인</Text>
        <Text style={styles.subtitle}>상담 신청과 내역 확인을 위해 로그인해 주세요.</Text>

        <Text style={styles.label}>이메일</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="example@email.com"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
        />

        <Text style={styles.label}>비밀번호</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="비밀번호"
          secureTextEntry
          autoCapitalize="none"
          onSubmitEditing={onSubmit}
        />

        {!!error && <Text style={styles.error}>{error}</Text>}

        <Pressable
          style={[styles.button, loading && styles.disabled]}
          onPress={onSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>로그인</Text>
          )}
        </Pressable>

        <Pressable style={styles.forgot} accessibilityRole="link" onPress={() => router.push("/forgot-password")}>
          <Text style={styles.link}>비밀번호를 잊으셨나요?</Text>
        </Pressable>

        <SocialLoginButtons />

        <View style={styles.row}>
          <Text style={styles.rowText}>계정이 없으신가요?</Text>
          <Pressable onPress={() => router.push("/signup")}>
            <Text style={styles.link}> 회원가입</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F8FA" },
  content: { padding: 24, paddingTop: 48 },
  backText: { color: "#39765B", fontSize: 15, marginBottom: 28 },
  forgot: { alignItems: "center", paddingTop: 16, paddingBottom: 4 },
  brand: { fontSize: 15, fontWeight: "700", color: "#39765B", marginBottom: 8 },
  title: { fontSize: 28, fontWeight: "700", color: "#26352D" },
  subtitle: { color: "#777", fontSize: 14, marginTop: 8, marginBottom: 28 },
  label: { fontSize: 15, fontWeight: "600", color: "#333", marginBottom: 8, marginTop: 14 },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDE2DE",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: "#333",
  },
  error: { color: "#C62828", marginTop: 16, lineHeight: 20 },
  button: {
    backgroundColor: "#39765B",
    paddingVertical: 17,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 26,
  },
  disabled: { opacity: 0.6 },
  buttonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  row: { flexDirection: "row", justifyContent: "center", marginTop: 22 },
  rowText: { color: "#666", fontSize: 14 },
  link: { color: "#39765B", fontSize: 14, fontWeight: "700" },
});
