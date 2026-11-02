import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useAuth } from "@/context/AuthContext";
import { alertMessage } from "@/lib/alert";
import { apiFetch } from "@/lib/api";
import { checkFutureDateTime, getTomorrow } from "@/lib/datetime";

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
  const { user, refreshUser } = useAuth();
  // 시설에서 연락할 번호가 없는 사용자(소셜 로그인 등)는 신청할 때 입력
  const needsPhone = !user?.phone?.trim();
  const [phone, setPhone] = useState("");

  async function submitConsultation() {
    const parsedFacilityId = Number(facilityId);

    if (!Number.isInteger(parsedFacilityId) || parsedFacilityId <= 0) {
      alertMessage("오류", "시설 정보가 올바르지 않습니다.");
      return;
    }

    if (needsPhone && !phone.trim()) {
      alertMessage("입력 확인", "시설에서 연락받을 전화번호를 입력해 주세요.");
      return;
    }

    const invalid = checkFutureDateTime(date, time);
    if (invalid) {
      alertMessage(invalid[0], invalid[1]);
      return;
    }

    const preferredAt = `${date}T${time}:00`;

    setLoading(true);

    try {
      // userId 는 보내지 않습니다. 서버가 토큰에서 꺼냅니다.
      await apiFetch("/api/consultations", {
        method: "POST",
        body: JSON.stringify({
          facilityId: parsedFacilityId,
          preferredAt,
          consultationMethod: method,
          message: message.trim(),
          ...(needsPhone ? { contactPhone: phone.trim() } : {}),
        }),
      });

      // 저장된 번호를 반영. 실패해도 신청은 이미 완료됨
      if (needsPhone) await refreshUser().catch(() => {});

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

      alertMessage("신청 실패", errorMessage);
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

      <Text style={styles.helper}>
        입력 형식: 24시간제 HH:mm (같은 시설·시간대는 상담 정원이 찰 수 있습니다)
      </Text>

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

      {needsPhone && (
        <>
          <Text style={styles.label}>연락받을 전화번호</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="010-1234-5678"
            keyboardType="phone-pad"
            autoComplete="tel"
            accessibilityLabel="연락받을 전화번호"
          />
        </>
      )}

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
