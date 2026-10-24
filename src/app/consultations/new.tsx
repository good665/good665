import { router, Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

// Android 에뮬레이터에서 실행할 때 사용하는 주소
const API_URL = "http://10.0.2.2:8080/api/consultations";

// 개발용 테스트 사용자 ID
// 실제 서비스에서는 로그인 인증으로 교체해야 합니다.
const TEST_USER_ID = 1;

export default function NewConsultationScreen() {
  const params = useLocalSearchParams<{
    facilityId: string;
    facilityName: string;
  }>();

  const facilityId = Number(params.facilityId);
  const facilityName = Array.isArray(params.facilityName)
    ? params.facilityName[0]
    : params.facilityName;

  const [preferredAt, setPreferredAt] = useState("2026-10-25T14:00:00");
  const [method, setMethod] = useState<"PHONE" | "VISIT">("PHONE");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const submitConsultation = async () => {
    if (!Number.isInteger(facilityId) || facilityId <= 0) {
      Alert.alert("오류", "시설 정보가 올바르지 않습니다.");
      return;
    }

    if (!preferredAt.trim()) {
      Alert.alert("확인", "희망 상담 시간을 입력해 주세요.");
      return;
    }

    if (loading) return;

    setLoading(true);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: TEST_USER_ID,
          facilityId,
          preferredAt: preferredAt.trim(),
          consultationMethod: method,
          message: message.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message ?? `요청 실패: HTTP ${response.status}`);
      }

      Alert.alert(
        "상담 신청 완료",
        result.message ?? "상담 신청이 접수되었습니다.",
        [
          {
            text: "확인",
            onPress: () => router.back(),
          },
        ],
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "상담 신청 중 오류가 발생했습니다.";

      Alert.alert(
        "신청 실패",
        `${errorMessage}\n\n백엔드 서버와 API 주소를 확인해 주세요.`,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Stack.Screen options={{ title: "상담 신청" }} />

      <Text style={styles.title}>상담 신청하기</Text>
      <Text style={styles.facility}>
        시설명: {facilityName ?? "시설 정보 없음"}
      </Text>

      <Text style={styles.label}>상담 방법</Text>

      <View style={styles.methodRow}>
        <Pressable
          style={[
            styles.methodButton,
            method === "PHONE" && styles.selectedButton,
          ]}
          onPress={() => setMethod("PHONE")}
        >
          <Text
            style={[
              styles.methodText,
              method === "PHONE" && styles.selectedText,
            ]}
          >
            전화 상담
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.methodButton,
            method === "VISIT" && styles.selectedButton,
          ]}
          onPress={() => setMethod("VISIT")}
        >
          <Text
            style={[
              styles.methodText,
              method === "VISIT" && styles.selectedText,
            ]}
          >
            방문 상담
          </Text>
        </Pressable>
      </View>

      <Text style={styles.label}>희망 상담 시간</Text>
      <TextInput
        style={styles.input}
        value={preferredAt}
        onChangeText={setPreferredAt}
        placeholder="2026-10-25T14:00:00"
        autoCapitalize="none"
      />
      <Text style={styles.hint}>형식: YYYY-MM-DDTHH:mm:ss</Text>

      <Text style={styles.label}>상담 요청 내용</Text>
      <TextInput
        style={[styles.input, styles.messageInput]}
        value={message}
        onChangeText={setMessage}
        placeholder="상담받고 싶은 내용을 입력해 주세요."
        multiline
        textAlignVertical="top"
      />

      <Pressable
        style={[styles.submitButton, loading && styles.disabledButton]}
        onPress={submitConsultation}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.submitText}>상담 신청하기</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#FFFFFF",
    flexGrow: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 12,
  },
  facility: {
    fontSize: 16,
    marginBottom: 24,
    color: "#555555",
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  methodRow: {
    flexDirection: "row",
    gap: 10,
  },
  methodButton: {
    flex: 1,
    padding: 14,
    borderWidth: 1,
    borderColor: "#CCCCCC",
    borderRadius: 8,
    alignItems: "center",
  },
  selectedButton: {
    backgroundColor: "#246BFD",
    borderColor: "#246BFD",
  },
  methodText: {
    color: "#333333",
    fontWeight: "600",
  },
  selectedText: {
    color: "#FFFFFF",
  },
  input: {
    borderWidth: 1,
    borderColor: "#CCCCCC",
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: "#222222",
  },
  hint: {
    marginTop: 6,
    fontSize: 12,
    color: "#777777",
  },
  messageInput: {
    minHeight: 110,
  },
  submitButton: {
    marginTop: 28,
    backgroundColor: "#246BFD",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
