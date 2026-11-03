import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { API_BASE_URL, getFacilityTypeName } from "@/config/api";
import { alertMessage } from "@/lib/alert";
import { apiFetch } from "@/lib/api";

type Claim = {
  id: number;
  facilityName: string;
  facilityAddress: string;
  facilityType: string;
  organizationName: string;
  businessRegistrationNumber: string | null;
  verificationStatus: string | null;
  requesterName: string;
  requesterPhone: string | null;
  requesterEmail: string;
  message: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  rejectReason: string | null;
  createdAt: string;
  hasDocument: boolean;
};

const FILTERS = [
  { label: "검토 대기", value: "PENDING" },
  { label: "승인", value: "APPROVED" },
  { label: "거절", value: "REJECTED" },
  { label: "전체", value: "ALL" },
];

const STATUS_LABELS: Record<Claim["status"], string> = { PENDING: "검토 대기", APPROVED: "승인됨", REJECTED: "거절됨" };

const VERIFICATION_LABELS: Record<string, string> = {
  VERIFIED: "국세청 확인됨",
  MISMATCH: "국세청 정보 불일치",
  CLOSED: "휴·폐업",
  UNAVAILABLE: "국세청 미확인",
};

function errorText(e: unknown, fallback: string) {
  return e instanceof Error ? e.message : fallback;
}

export default function AdminFacilityClaimsScreen() {
  const [status, setStatus] = useState("PENDING");
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [reason, setReason] = useState("");

  const load = useCallback(async (value: string) => {
    try {
      setError("");
      const page = await apiFetch<{ items: Claim[] }>(`/api/admin/facility-claims?status=${value}&size=50`);
      setClaims(page.items);
    } catch (e) {
      setClaims([]);
      setError(errorText(e, "신청 목록을 불러오지 못했습니다."));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load(status);
    }, [status, load]),
  );

  async function openDocument(id: number) {
    try {
      const { url } = await apiFetch<{ url: string }>(`/api/admin/facility-claims/${id}/document-link`, { method: "POST" });
      await Linking.openURL(API_BASE_URL + url);
    } catch (e) {
      alertMessage("서류 열기 실패", errorText(e, "서류를 열지 못했습니다."));
    }
  }

  async function approve(id: number) {
    try {
      await apiFetch(`/api/admin/facility-claims/${id}/approve`, { method: "POST" });
    } catch (e) {
      alertMessage("승인 실패", errorText(e, "승인 중 오류가 발생했습니다."));
    }
    await load(status);
  }

  function confirmApprove(claim: Claim) {
    const message = `${claim.facilityName} 시설의 소유권을 ${claim.organizationName}(으)로 옮깁니다. 서류를 확인하셨나요?`;

    if (Platform.OS === "web") {
      if (window.confirm(message)) approve(claim.id);
      return;
    }
    Alert.alert("소유권 승인", message, [
      { text: "취소", style: "cancel" },
      { text: "승인", onPress: () => approve(claim.id) },
    ]);
  }

  async function reject(id: number) {
    if (!reason.trim()) {
      alertMessage("입력 확인", "거절 사유를 입력해 주세요.");
      return;
    }
    try {
      await apiFetch(`/api/admin/facility-claims/${id}/reject`, {
        method: "POST",
        body: JSON.stringify({ reason: reason.trim() }),
      });
      setRejectingId(null);
      setReason("");
    } catch (e) {
      alertMessage("거절 실패", errorText(e, "거절 중 오류가 발생했습니다."));
    }
    await load(status);
  }

  return (
    <View style={styles.container}>
      <View style={styles.filters}>
        {FILTERS.map((filter) => (
          <Pressable
            key={filter.value}
            style={[styles.filter, status === filter.value && styles.filterSelected]}
            accessibilityRole="button"
            accessibilityState={{ selected: status === filter.value }}
            onPress={() => setStatus(filter.value)}
          >
            <Text style={[styles.filterText, status === filter.value && styles.filterTextSelected]}>{filter.label}</Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#39765B" style={styles.loader} />
      ) : (
        <FlatList
          data={claims}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={claims.length === 0 ? styles.empty : styles.list}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={<Text style={styles.emptyText}>{error || "소유권 신청이 없습니다."}</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.header}>
                <Text style={styles.title}>{item.facilityName}</Text>
                <Text style={styles.status}>{STATUS_LABELS[item.status]}</Text>
              </View>
              <Text style={styles.text}>
                {getFacilityTypeName(item.facilityType)} · {item.facilityAddress}
              </Text>

              <Text style={styles.label}>신청 기관</Text>
              <Text style={styles.text}>{item.organizationName}</Text>
              <Text style={styles.text}>사업자번호: {item.businessRegistrationNumber ?? "없음"}</Text>
              <Text style={styles.text}>
                {item.verificationStatus ? VERIFICATION_LABELS[item.verificationStatus] ?? item.verificationStatus : "국세청 확인 기록 없음"}
              </Text>

              <Text style={styles.label}>신청자</Text>
              <Text style={styles.text}>
                {item.requesterName} · {item.requesterPhone ?? "전화번호 없음"}
              </Text>
              <Text style={styles.text}>{item.requesterEmail}</Text>

              {item.message && (
                <>
                  <Text style={styles.label}>요청 내용</Text>
                  <Text style={styles.text}>{item.message}</Text>
                </>
              )}
              {item.rejectReason && <Text style={styles.rejected}>거절 사유: {item.rejectReason}</Text>}
              <Text style={styles.date}>신청일: {item.createdAt}</Text>

              {item.hasDocument && (
                <Pressable style={styles.outline} accessibilityRole="button" onPress={() => openDocument(item.id)}>
                  <Text style={styles.outlineText}>증빙 서류 보기</Text>
                </Pressable>
              )}

              {item.status === "PENDING" && rejectingId !== item.id && (
                <View style={styles.actions}>
                  <Pressable style={styles.approve} accessibilityRole="button" onPress={() => confirmApprove(item)}>
                    <Text style={styles.approveText}>승인하기</Text>
                  </Pressable>
                  <Pressable
                    style={styles.reject}
                    accessibilityRole="button"
                    onPress={() => {
                      setRejectingId(item.id);
                      setReason("");
                    }}
                  >
                    <Text style={styles.rejectText}>거절하기</Text>
                  </Pressable>
                </View>
              )}

              {rejectingId === item.id && (
                <View>
                  <TextInput
                    style={styles.input}
                    value={reason}
                    onChangeText={setReason}
                    maxLength={500}
                    multiline
                    placeholder="거절 사유 (신청자에게 보입니다)"
                    accessibilityLabel="거절 사유"
                  />
                  <View style={styles.actions}>
                    <Pressable style={styles.outlineAction} accessibilityRole="button" onPress={() => setRejectingId(null)}>
                      <Text style={styles.outlineText}>닫기</Text>
                    </Pressable>
                    <Pressable style={styles.reject} accessibilityRole="button" onPress={() => reject(item.id)}>
                      <Text style={styles.rejectText}>거절 확정</Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F8FA", padding: 20 },
  filters: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  filter: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: 10, borderWidth: 1, borderColor: "#DDE2DE", backgroundColor: "#FFFFFF" },
  filterSelected: { backgroundColor: "#39765B", borderColor: "#39765B" },
  filterText: { fontSize: 13, color: "#555" },
  filterTextSelected: { color: "#FFFFFF", fontWeight: "700" },
  loader: { marginTop: 40 },
  list: { paddingBottom: 30 },
  empty: { flexGrow: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { color: "#777", fontSize: 14, textAlign: "center" },
  card: { backgroundColor: "#FFFFFF", padding: 16, borderRadius: 14, marginBottom: 12, borderWidth: 1, borderColor: "#E8E8E8" },
  header: { flexDirection: "row", justifyContent: "space-between", gap: 8, marginBottom: 4 },
  title: { flex: 1, fontSize: 16, fontWeight: "700", color: "#222" },
  status: { fontSize: 13, fontWeight: "700", color: "#267347" },
  label: { color: "#777", fontSize: 12, marginTop: 10, marginBottom: 3 },
  text: { color: "#333", fontSize: 14, lineHeight: 20 },
  rejected: { color: "#C62828", fontSize: 13, marginTop: 10, lineHeight: 20 },
  date: { color: "#999", fontSize: 12, marginTop: 10 },
  outline: { borderWidth: 1.5, borderColor: "#39765B", borderRadius: 10, paddingVertical: 11, alignItems: "center", marginTop: 12 },
  outlineAction: { flex: 1, borderWidth: 1.5, borderColor: "#39765B", borderRadius: 10, paddingVertical: 11, alignItems: "center" },
  outlineText: { color: "#39765B", fontSize: 14, fontWeight: "700" },
  actions: { flexDirection: "row", gap: 8, marginTop: 10 },
  approve: { flex: 1, backgroundColor: "#39765B", borderRadius: 10, paddingVertical: 12, alignItems: "center" },
  approveText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  reject: { flex: 1, borderWidth: 1.5, borderColor: "#D9534F", borderRadius: 10, paddingVertical: 11, alignItems: "center" },
  rejectText: { color: "#C62828", fontSize: 14, fontWeight: "700" },
  input: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#DDE2DE", borderRadius: 10, padding: 12, fontSize: 14, color: "#333", marginTop: 12, minHeight: 70, textAlignVertical: "top" },
});
