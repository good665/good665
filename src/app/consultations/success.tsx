import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function ConsultationSuccessScreen() {
  const router = useRouter();

  const { facilityName, preferredAt, method } = useLocalSearchParams<{
    facilityName: string;
    preferredAt: string;
    method: string;
  }>();

  const methodText = method === "VISIT" ? "방문 상담" : "전화 상담";

  const formattedDate = preferredAt
    ? preferredAt.replace("T", " ").slice(0, 16)
    : "";

  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Text style={styles.check}>✓</Text>
      </View>

      <Text style={styles.title}>상담 신청 완료!</Text>

      <Text style={styles.description}>
        상담 신청이 정상적으로 접수되었습니다.
      </Text>

      <View style={styles.card}>
        <Text style={styles.label}>신청 시설</Text>
        <Text style={styles.value}>{facilityName || "선택한 시설"}</Text>

        <Text style={styles.label}>희망 상담 일시</Text>
        <Text style={styles.value}>{formattedDate || "미입력"}</Text>

        <Text style={styles.label}>상담 방식</Text>
        <Text style={styles.value}>{methodText}</Text>
      </View>

      <Pressable
        style={styles.primaryButton}
        onPress={() => router.replace("/consultations")}
      >
        <Text style={styles.primaryButtonText}>내 상담 내역 확인</Text>
      </Pressable>

      <Pressable
        style={styles.secondaryButton}
        onPress={() => router.replace("/")}
      >
        <Text style={styles.secondaryButtonText}>시설 목록으로 돌아가기</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F8FA",
    padding: 24,
    justifyContent: "center",
  },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "#E7F2EB",
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  check: {
    color: "#39765B",
    fontSize: 40,
    fontWeight: "700",
  },
  title: {
    textAlign: "center",
    fontSize: 27,
    fontWeight: "700",
    color: "#26352D",
  },
  description: {
    textAlign: "center",
    color: "#666",
    fontSize: 14,
    marginTop: 10,
    marginBottom: 28,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  label: {
    fontSize: 13,
    color: "#777",
    marginTop: 8,
    marginBottom: 5,
  },
  value: {
    fontSize: 16,
    color: "#26352D",
    fontWeight: "600",
    marginBottom: 10,
  },
  primaryButton: {
    backgroundColor: "#39765B",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  secondaryButtonText: {
    color: "#39765B",
    fontSize: 15,
    fontWeight: "600",
  },
});
