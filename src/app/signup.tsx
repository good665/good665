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

import { useAuth } from "@/context/AuthContext";

export default function SignupScreen() {
  const router = useRouter();
  const { signup } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 서버 검증과 같은 규칙을 앱에서도 먼저 확인
  function validate(): string | null {
    if (!name.trim()) return "이름을 입력해 주세요.";

    if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email.trim())) {
      return "이메일 형식이 올바르지 않습니다.";
    }

    if (phone.trim() && !/^[0-9-]{9,15}$/.test(phone.trim())) {
      return "전화번호는 숫자와 하이픈(-)만 입력해 주세요.";
    }

    if (password.length < 8 || password.length > 64 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      return "비밀번호는 영문과 숫자를 포함해 8자 이상 입력해 주세요.";
    }

    if (password !== passwordConfirm) return "비밀번호가 서로 일치하지 않습니다.";

    return null;
  }

  async function onSubmit() {
    setError("");

    const message = validate();
    if (message) {
      setError(message);
      return;
    }

    setLoading(true);

    try {
      await signup({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
      });
      router.replace("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "회원가입 중 오류가 발생했습니다.");
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
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace("/login"))}>
          <Text style={styles.backText}>‹ 로그인으로</Text>
        </Pressable>

        <Text style={styles.title}>회원가입</Text>
        <Text style={styles.subtitle}>간단한 정보만 입력하면 바로 시작할 수 있어요.</Text>

        <Text style={styles.label}>이름</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="홍길동" maxLength={100} />

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

        <Text style={styles.label}>전화번호 (선택)</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="010-0000-0000"
          keyboardType="phone-pad"
          maxLength={15}
        />
        <Text style={styles.helper}>시설에서 상담 연락 시 사용돼요.</Text>

        <Text style={styles.label}>비밀번호</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="영문+숫자 8자 이상"
          secureTextEntry
          autoCapitalize="none"
          maxLength={64}
        />

        <Text style={styles.label}>비밀번호 확인</Text>
        <TextInput
          style={styles.input}
          value={passwordConfirm}
          onChangeText={setPasswordConfirm}
          placeholder="비밀번호를 한 번 더 입력"
          secureTextEntry
          autoCapitalize="none"
          maxLength={64}
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
            <Text style={styles.buttonText}>가입하기</Text>
          )}
        </Pressable>

        <View style={styles.row}>
          <Text style={styles.rowText}>이미 계정이 있으신가요?</Text>
          <Pressable onPress={() => router.replace("/login")}>
            <Text style={styles.link}> 로그인</Text>
          </Pressable>
        </View>

        <View style={styles.row}>
          <Text style={styles.rowText}>시설을 운영하고 계신가요?</Text>
          <Pressable onPress={() => router.push("/business-signup")}>
            <Text style={styles.link}> 사업자 가입</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F8FA" },
  content: { padding: 24, paddingTop: 48, paddingBottom: 48 },
  backText: { color: "#39765B", fontSize: 15, marginBottom: 28 },
  title: { fontSize: 28, fontWeight: "700", color: "#26352D" },
  subtitle: { color: "#777", fontSize: 14, marginTop: 8, marginBottom: 20 },
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
  helper: { fontSize: 12, color: "#777", marginTop: 6 },
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
