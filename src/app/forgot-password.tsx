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
} from "react-native";

import { alertMessage } from "@/lib/alert";
import { apiFetch } from "@/lib/api";

export default function ForgotPasswordScreen() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function requestCode() {
    setError("");
    if (!email.trim()) {
      setError("가입한 이메일을 입력해 주세요.");
      return;
    }

    setLoading(true);
    try {
      await apiFetch("/api/auth/password-reset/request", {
        method: "POST",
        body: JSON.stringify({ email: email.trim() }),
      });
      setCodeSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "코드를 보내지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function confirm() {
    setError("");
    if (!/^\d{6}$/.test(code.trim())) {
      setError("메일로 받은 6자리 코드를 입력해 주세요.");
      return;
    }
    if (password !== passwordConfirm) {
      setError("새 비밀번호가 서로 다릅니다.");
      return;
    }

    setLoading(true);
    try {
      await apiFetch("/api/auth/password-reset/confirm", {
        method: "POST",
        body: JSON.stringify({ email: email.trim(), code: code.trim(), newPassword: password }),
      });
      alertMessage("변경 완료", "비밀번호를 변경했습니다. 새 비밀번호로 로그인해 주세요.");
      router.replace("/login");
    } catch (e) {
      setError(e instanceof Error ? e.message : "비밀번호를 변경하지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Pressable accessibilityRole="button" onPress={() => router.replace("/login")}>
          <Text style={styles.back}>‹ 로그인으로</Text>
        </Pressable>

        <Text style={styles.title}>비밀번호 찾기</Text>
        <Text style={styles.subtitle}>
          {codeSent
            ? "가입된 이메일이라면 재설정 코드를 보냈습니다. 메일이 보이지 않으면 스팸함도 확인해 주세요."
            : "가입한 이메일로 재설정 코드를 보내 드립니다. 소셜 로그인 계정은 해당 서비스로 로그인해 주세요."}
        </Text>

        <Text style={styles.label}>이메일</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          editable={!codeSent}
          placeholder="example@email.com"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          accessibilityLabel="이메일"
        />

        {codeSent && (
          <>
            <Text style={styles.label}>재설정 코드 (10분 유효)</Text>
            <TextInput
              style={styles.input}
              value={code}
              onChangeText={setCode}
              placeholder="6자리 숫자"
              keyboardType="number-pad"
              maxLength={6}
              autoComplete="one-time-code"
              accessibilityLabel="재설정 코드"
            />

            <Text style={styles.label}>새 비밀번호</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="영문과 숫자를 포함해 8자 이상"
              secureTextEntry
              autoCapitalize="none"
              accessibilityLabel="새 비밀번호"
            />

            <Text style={styles.label}>새 비밀번호 확인</Text>
            <TextInput
              style={styles.input}
              value={passwordConfirm}
              onChangeText={setPasswordConfirm}
              secureTextEntry
              autoCapitalize="none"
              accessibilityLabel="새 비밀번호 확인"
            />
          </>
        )}

        {!!error && <Text style={styles.error}>{error}</Text>}

        <Pressable
          style={[styles.button, loading && styles.disabled]}
          accessibilityRole="button"
          disabled={loading}
          onPress={codeSent ? confirm : requestCode}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>{codeSent ? "비밀번호 변경" : "코드 받기"}</Text>
          )}
        </Pressable>

        {codeSent && (
          <Pressable
            style={styles.linkButton}
            accessibilityRole="button"
            onPress={() => {
              setCodeSent(false);
              setCode("");
              setError("");
            }}
          >
            <Text style={styles.link}>코드 다시 받기</Text>
          </Pressable>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F8FA" },
  content: { padding: 24, paddingTop: 48 },
  back: { color: "#39765B", fontSize: 15, marginBottom: 28 },
  title: { fontSize: 28, fontWeight: "700", color: "#26352D" },
  subtitle: { color: "#777", fontSize: 14, lineHeight: 21, marginTop: 8, marginBottom: 20 },
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
  button: { backgroundColor: "#39765B", paddingVertical: 17, borderRadius: 12, alignItems: "center", marginTop: 24 },
  disabled: { opacity: 0.6 },
  buttonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  linkButton: { alignItems: "center", paddingVertical: 16 },
  link: { color: "#39765B", fontSize: 14, fontWeight: "600" },
});
