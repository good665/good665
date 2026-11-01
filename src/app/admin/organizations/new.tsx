import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
} from "react-native";

import { apiFetch } from "@/lib/api";

export default function NewOrganizationScreen() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [organizationType, setOrganizationType] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!name.trim() || !organizationType.trim()) {
      Alert.alert("입력 확인", "기관명과 기관 유형은 필수입니다.");
      return;
    }

    setLoading(true);

    try {
      await apiFetch("/api/admin/organizations", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          organizationType: organizationType.trim(),
          phone: phone.trim(),
          email: email.trim(),
        }),
      });

      router.back();
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "운영 기관 등록 중 오류가 발생했습니다.";

      if (Platform.OS === "web") {
        window.alert(message);
      } else {
        Alert.alert("등록 실패", message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.label}>기관명</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} />

      <Text style={styles.label}>기관 유형</Text>
      <TextInput
        style={styles.input}
        value={organizationType}
        onChangeText={setOrganizationType}
        placeholder="예: CARE_PROVIDER"
        autoCapitalize="characters"
      />
      <Text style={styles.helper}>
        시설 유형과 달리 자유 입력입니다. 기존 기관들과 맞추려면 CARE_PROVIDER 같은 형식을 참고하세요.
      </Text>

      <Text style={styles.label}>전화번호 (선택)</Text>
      <TextInput
        style={styles.input}
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />

      <Text style={styles.label}>이메일 (선택)</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Pressable
        style={[styles.submitButton, loading && styles.disabledButton]}
        onPress={submit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.submitButtonText}>등록하기</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F8FA",
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDE2DE",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#333",
  },
  helper: {
    fontSize: 12,
    color: "#999",
    marginTop: 6,
  },
  submitButton: {
    backgroundColor: "#39765B",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 28,
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
