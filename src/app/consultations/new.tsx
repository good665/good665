import { useLocalSearchParams, useRouter } from "expo-router";
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
  View,
} from "react-native";

import { API_BASE_URL, USER_ID } from "@/config/api";

const API_URL = `${API_BASE_URL}/api/consultations`;

// 기본 희망 날짜: 내일
function getTomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

type ConsultationMethod = "PHONE" | "VISIT";

export default function NewConsultationScreen() {
  const router = useRouter();

  const { facilityId, facilityName } = useLocalSearchParams<{
    facilityId: string;
    facilityName: string;
  }>();

  const [date, setDate] = useState(getTomorrow());
  const [time, setTime] = useState("14:00");
  const [method, setMethod] = useState<ConsultationMethod>("PHONE");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submitConsultation() {
    const parsedFacilityId = Number(facilityId);

    if (!Number.isInteger(parsedFacilityId) || parsedFacilityId <= 0) {
      Alert.alert("오류", "시설 정보가 올바르지 않습니다.");
      return;
    }

    if (!date.trim() || !time.trim()) {
      Alert.alert("입력 확인", "희망 날짜와 시간을 입력해 주세요.");
      return;
    }

    // 날짜 형식 및 실제 존재하는 날짜인지 확인
    const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);

    if (!dateMatch) {
      Alert.alert(
        "날짜 형식 확인",
        "날짜를 YYYY-MM-DD 형식으로 입력해 주세요.",
      );
      return;
    }

    const year = Number(dateMatch[1]);
    const month = Number(dateMatch[2]);
    const day = Number(dateMatch[3]);

    const selectedDate = new Date(year, month - 1, day);

    if (
      selectedDate.getFullYear() !== year ||
      selectedDate.getMonth() !== month - 1 ||
      selectedDate.getDate() !== day
    ) {
      Alert.alert("날짜 확인", "실제로 존재하는 날짜를 입력해 주세요.");
      return;
    }

    // 시간 형식 및 범위 확인
    const timeMatch = /^(\d{2}):(\d{2})$/.exec(time);

    if (!timeMatch) {
      Alert.alert("시간 형식 확인", "시간을 HH:mm 형식으로 입력해 주세요.");
      return;
    }

    const hour = Number(timeMatch[1]);
    const minute = Number(timeMatch[2]);

    if (hour > 23 || minute > 59) {
      Alert.alert("시간 확인", "올바른 시간을 입력해 주세요.");
      return;
    }

    // 과거 날짜 및 시간 신청 방지
    const now = new Date();

    const selectedDateTime = new Date(year, month - 1, day, hour, minute);

    if (selectedDateTime <= now) {
      Alert.alert(
        "상담 시간 확인",
        "현재 시각 이후의 날짜와 시간을 선택해 주세요.",
      );
      return;
    }

    const preferredAt = `${date}T${time}:00`;

    setLoading(true);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: USER_ID,
          facilityId: parsedFacilityId,
          preferredAt,
          consultationMethod: method,
          message: message.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok || result.success !== true) {
        throw new Error(result.message || "상담 신청에 실패했습니다.");
      }

      router.replace({
        pathname: "/consultations/success",
        params: {
          facilityName: facilityName || "선택한 시설",
          preferredAt,
          method,
        },
      });
    } catch (e) {
      const errorMessage =
        e instanceof Error ? e.message : "상담 신청 중 오류가 발생했습니다.";

      if (Platform.OS === "web") {
        window.alert(errorMessage);
      } else {
        Alert.alert("신청 실패", errorMessage);
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
      <Pressable onPress={() => router.back()}>
        <Text style={styles.backText}>‹ 시설 상세로 돌아가기</Text>
      </Pressable>

      <Text style={styles.title}>상담 신청</Text>

      <Text style={styles.subtitle}>
        관심 있는 시설의 상담을 신청해 보세요.
      </Text>

      <View style={styles.facilityCard}>
        <Text style={styles.label}>상담 신청 시설</Text>
        <Text style={styles.facilityName}>{facilityName || "선택한 시설"}</Text>
      </View>

      <Text style={styles.label}>희망 상담 날짜</Text>

      <TextInput
        style={styles.input}
        value={date}
        onChangeText={setDate}
        placeholder="2026-10-25"
        keyboardType="numbers-and-punctuation"
        maxLength={10}
      />

      <Text style={styles.helper}>입력 형식: YYYY-MM-DD</Text>

      <Text style={styles.label}>희망 상담 시간</Text>

      <TextInput
        style={styles.input}
        value={time}
        onChangeText={setTime}
        placeholder="14:00"
        keyboardType="numbers-and-punctuation"
        maxLength={5}
      />

      <Text style={styles.helper}>입력 형식: 24시간제 HH:mm</Text>

      <Text style={styles.label}>상담 방식</Text>

      <View style={styles.methodRow}>
        <Pressable
          style={[
            styles.methodButton,
            method === "PHONE" && styles.methodSelected,
          ]}
          onPress={() => setMethod("PHONE")}
        >
          <Text
            style={[
              styles.methodText,
              method === "PHONE" && styles.methodTextSelected,
            ]}
          >
            전화 상담
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.methodButton,
            method === "VISIT" && styles.methodSelected,
          ]}
          onPress={() => setMethod("VISIT")}
        >
          <Text
            style={[
              styles.methodText,
              method === "VISIT" && styles.methodTextSelected,
            ]}
          >
            방문 상담
          </Text>
        </Pressable>
      </View>

      <Text style={styles.label}>문의 내용</Text>

      <TextInput
        style={[styles.input, styles.messageInput]}
        value={message}
        onChangeText={setMessage}
        placeholder="상담 시 궁금한 내용을 입력해 주세요."
        multiline
        textAlignVertical="top"
        maxLength={2000}
      />

      <Pressable
        style={[styles.submitButton, loading && styles.disabledButton]}
        onPress={submitConsultation}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.submitButtonText}>상담 신청하기</Text>
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
  backText: {
    color: "#39765B",
    fontSize: 15,
    marginBottom: 22,
  },
  title: {
    fontSize: 27,
    fontWeight: "700",
    color: "#26352D",
  },
  subtitle: {
    color: "#777",
    fontSize: 14,
    marginTop: 8,
    marginBottom: 24,
  },
  facilityCard: {
    backgroundColor: "#E7F2EB",
    borderRadius: 14,
    padding: 18,
    marginBottom: 24,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
    marginTop: 12,
  },
  facilityName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#39765B",
  },
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
  helper: {
    fontSize: 12,
    color: "#777",
    marginTop: 6,
  },
  methodRow: {
    flexDirection: "row",
    gap: 10,
  },
  methodButton: {
    flex: 1,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: "#DDE2DE",
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  methodSelected: {
    borderColor: "#39765B",
    backgroundColor: "#E7F2EB",
  },
  methodText: {
    fontSize: 15,
    color: "#555",
  },
  methodTextSelected: {
    color: "#39765B",
    fontWeight: "700",
  },
  messageInput: {
    minHeight: 120,
    paddingTop: 14,
  },
  submitButton: {
    backgroundColor: "#39765B",
    paddingVertical: 17,
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
