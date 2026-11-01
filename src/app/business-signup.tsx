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

export default function BusinessSignupScreen() {
  const router = useRouter();
  const { signupBusiness } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  const [organizationName, setOrganizationName] = useState("");
  const [organizationType, setOrganizationType] = useState("");
  const [businessRegistrationNumber, setBusinessRegistrationNumber] = useState("");
  const [representativeName, setRepresentativeName] = useState("");
  const [businessStartDate, setBusinessStartDate] = useState("");
  const [organizationPhone, setOrganizationPhone] = useState("");
  const [organizationEmail, setOrganizationEmail] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function validate(): string | null {
    if (!name.trim()) return "담당자 이름을 입력해 주세요.";

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

    if (!organizationName.trim()) return "운영 기관명을 입력해 주세요.";
    if (!organizationType.trim()) return "기관 유형을 입력해 주세요.";
    if (businessRegistrationNumber.replace(/[^0-9]/g, "").length !== 10) {
      return "사업자등록번호 10자리를 입력해 주세요.";
    }
    if (!representativeName.trim()) return "대표자 성명을 입력해 주세요.";
    if (!/^\d{4}-?\d{2}-?\d{2}$/.test(businessStartDate.trim())) {
      return "개업일자를 YYYY-MM-DD 형식으로 입력해 주세요.";
    }

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
      await signupBusiness({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
        organizationName: organizationName.trim(),
        organizationType: organizationType.trim(),
        businessRegistrationNumber: businessRegistrationNumber.trim(),
        representativeName: representativeName.trim(),
        businessStartDate: businessStartDate.trim(),
        organizationPhone: organizationPhone.trim(),
        organizationEmail: organizationEmail.trim(),
      });
      router.replace("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "사업자 가입 중 오류가 발생했습니다.");
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

        <Text style={styles.title}>사업자 가입</Text>
        <Text style={styles.subtitle}>
          시설을 운영하시나요? 가입 후 시설을 등록하면 관리자 승인을 거쳐 공개됩니다.
        </Text>

        <Text style={styles.sectionTitle}>담당자 정보</Text>

        <Text style={styles.label}>이름</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} maxLength={100} />

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
          secureTextEntry
          autoCapitalize="none"
          maxLength={64}
        />

        <Text style={styles.sectionTitle}>운영 기관 정보</Text>

        <Text style={styles.label}>기관명</Text>
        <TextInput style={styles.input} value={organizationName} onChangeText={setOrganizationName} />

        <Text style={styles.label}>기관 유형</Text>
        <TextInput
          style={styles.input}
          value={organizationType}
          onChangeText={setOrganizationType}
          placeholder="예: CARE_PROVIDER"
          autoCapitalize="characters"
        />

        <Text style={styles.label}>사업자등록번호</Text>
        <TextInput
          style={styles.input}
          value={businessRegistrationNumber}
          onChangeText={setBusinessRegistrationNumber}
          placeholder="000-00-00000"
          keyboardType="number-pad"
          maxLength={12}
        />

        <Text style={styles.label}>대표자 성명</Text>
        <TextInput
          style={styles.input}
          value={representativeName}
          onChangeText={setRepresentativeName}
          placeholder="사업자등록증의 대표자 이름"
          maxLength={50}
        />

        <Text style={styles.label}>개업일자</Text>
        <TextInput
          style={styles.input}
          value={businessStartDate}
          onChangeText={setBusinessStartDate}
          placeholder="YYYY-MM-DD (사업자등록증의 개업연월일)"
          keyboardType="numbers-and-punctuation"
          maxLength={10}
        />
        <Text style={styles.hint}>
          사업자등록번호·대표자 성명·개업일자는 국세청 정보와 대조해 확인합니다.
        </Text>

        <Text style={styles.label}>기관 전화번호 (선택)</Text>
        <TextInput
          style={styles.input}
          value={organizationPhone}
          onChangeText={setOrganizationPhone}
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>기관 이메일 (선택)</Text>
        <TextInput
          style={styles.input}
          value={organizationEmail}
          onChangeText={setOrganizationEmail}
          autoCapitalize="none"
          keyboardType="email-address"
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
            <Text style={styles.buttonText}>사업자 가입하기</Text>
          )}
        </Pressable>

        <View style={styles.row}>
          <Text style={styles.rowText}>이미 계정이 있으신가요?</Text>
          <Pressable onPress={() => router.replace("/login")}>
            <Text style={styles.link}> 로그인</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  hint: {
    fontSize: 12,
    color: "#7A857D",
    marginTop: 6,
    lineHeight: 17,
  },
  container: { flex: 1, backgroundColor: "#F7F8FA" },
  content: { padding: 24, paddingTop: 48, paddingBottom: 48 },
  backText: { color: "#39765B", fontSize: 15, marginBottom: 28 },
  title: { fontSize: 28, fontWeight: "700", color: "#26352D" },
  subtitle: { color: "#777", fontSize: 14, marginTop: 8, marginBottom: 20, lineHeight: 20 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#26352D",
    marginTop: 24,
    marginBottom: 4,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
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
