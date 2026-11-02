import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { alertMessage } from "@/lib/alert";
import { ApiError, apiFetch } from "@/lib/api";

type Kind = "consultations" | "reservations";

type BusinessRequest = {
  id: number;
  facilityName: string;
  userName: string;
  userPhone: string | null;
  requestedAt: string;
  consultationMethod: string | null;
  message: string | null;
  status: string;
  createdAt: string;
};

type RequestPage = {
  items: BusinessRequest[];
  page: number;
  hasNext: boolean;
  totalElements: number;
};

const kinds: { label: string; value: Kind }[] = [
  { label: "상담 신청", value: "consultations" },
  { label: "방문 예약", value: "reservations" },
];

const statusFilters = [
  { label: "전체", value: "" },
  { label: "신청", value: "REQUESTED" },
  { label: "확정", value: "CONFIRMED" },
  { label: "완료", value: "COMPLETED" },
  { label: "취소", value: "CANCELED" },
];

const statusLabels: Record<string, string> = {
  REQUESTED: "신청 완료",
  CONFIRMED: "확정",
  COMPLETED: "완료",
  CANCELED: "취소됨",
};

const methodLabels: Record<string, string> = {
  PHONE: "전화 상담",
  VISIT: "방문 상담",
  ONLINE: "온라인 상담",
};

const nextActions: Record<string, { verb: string; status: string }[]> = {
  REQUESTED: [
    { verb: "확정", status: "CONFIRMED" },
    { verb: "취소", status: "CANCELED" },
  ],
  CONFIRMED: [
    { verb: "완료", status: "COMPLETED" },
    { verb: "취소", status: "CANCELED" },
  ],
};

export default function BusinessRequestsScreen() {
  const [kind, setKind] = useState<Kind>("consultations");
  const [status, setStatus] = useState("");
  const [items, setItems] = useState<BusinessRequest[]>([]);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // 탭을 빠르게 바꿔 응답이 뒤섞여 도착해도 가장 최근 요청의 결과만 반영
  const requestId = useRef(0);

  const fetchPage = useCallback(async (pageToLoad: number, append: boolean, kindValue: Kind, statusValue: string) => {
    const myId = ++requestId.current;

    try {
      setError("");

      const params = new URLSearchParams({ page: String(pageToLoad), size: "10" });
      if (statusValue) params.set("status", statusValue);

      const data = await apiFetch<RequestPage>(`/api/business/${kindValue}?${params.toString()}`);
      if (myId !== requestId.current) return;

      setItems((prev) => (append ? [...prev, ...data.items] : data.items));
      setPage(data.page);
      setHasNext(data.hasNext);
      setTotal(data.totalElements);
    } catch (e) {
      if (myId !== requestId.current) return;

      if (!append) setItems([]);
      setHasNext(false);
      setError(e instanceof ApiError ? e.message : "신청 목록을 불러오지 못했습니다.");
    } finally {
      if (myId === requestId.current) {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchPage(0, false, kind, status);
    }, [kind, status, fetchPage]),
  );

  const loadMore = () => {
    if (loading || loadingMore || refreshing || !hasNext || error) return;
    setLoadingMore(true);
    fetchPage(page + 1, true, kind, status);
  };

  const updateStatus = async (id: number, nextStatus: string) => {
    try {
      await apiFetch(`/api/business/${kind}/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
    } catch (e) {
      alertMessage("변경 실패", e instanceof Error ? e.message : "상태 변경 중 오류가 발생했습니다.");
    }
    // 실패(고객이 먼저 취소 등)해도 최신 상태를 보여 줌
    fetchPage(0, false, kind, status);
  };

  const confirmUpdate = (item: BusinessRequest, verb: string, nextStatus: string) => {
    const message = `${item.userName}님의 신청을 ${verb}하시겠습니까?`;

    if (Platform.OS === "web") {
      if (window.confirm(message)) updateStatus(item.id, nextStatus);
      return;
    }

    Alert.alert("상태 변경", message, [
      { text: "닫기", style: "cancel" },
      { text: `${verb}하기`, onPress: () => updateStatus(item.id, nextStatus) },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.kindRow}>
        {kinds.map((item) => (
          <Pressable
            key={item.value}
            style={[styles.kindButton, kind === item.value && styles.selected]}
            accessibilityRole="tab"
            accessibilityState={{ selected: kind === item.value }}
            onPress={() => setKind(item.value)}
          >
            <Text style={[styles.kindText, kind === item.value && styles.selectedText]}>{item.label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.filterRow}>
        {statusFilters.map((item) => (
          <Pressable
            key={item.value}
            style={[styles.filterButton, status === item.value && styles.selected]}
            accessibilityRole="button"
            accessibilityState={{ selected: status === item.value }}
            onPress={() => setStatus(item.value)}
          >
            <Text style={[styles.filterText, status === item.value && styles.selectedText]}>{item.label}</Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#39765B" style={styles.loader} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchPage(0, false, kind, status);
              }}
            />
          }
          contentContainerStyle={items.length === 0 ? styles.emptyContainer : styles.list}
          ListHeaderComponent={!error ? <Text style={styles.total}>전체 {total}건</Text> : undefined}
          ListEmptyComponent={<Text style={styles.emptyText}>{error || "들어온 신청이 없습니다."}</Text>}
          ListFooterComponent={loadingMore ? <ActivityIndicator color="#39765B" style={styles.loader} /> : undefined}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.facilityName}>{item.facilityName}</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{statusLabels[item.status] ?? item.status}</Text>
                </View>
              </View>

              <Text style={styles.label}>신청자</Text>
              <Text style={styles.value}>{item.userName}</Text>

              <Text style={styles.label}>연락처</Text>
              {item.userPhone ? (
                <Pressable
                  accessibilityRole="link"
                  accessibilityLabel={`${item.userName}님에게 전화 걸기`}
                  onPress={() => Linking.openURL(`tel:${item.userPhone}`)}
                >
                  <Text style={styles.phone}>{item.userPhone}</Text>
                </Pressable>
              ) : (
                <Text style={styles.value}>등록된 전화번호가 없습니다.</Text>
              )}

              <Text style={styles.label}>{kind === "consultations" ? "희망 상담 일시" : "방문 일시"}</Text>
              <Text style={styles.value}>{item.requestedAt.slice(0, 16)}</Text>

              {item.consultationMethod && (
                <>
                  <Text style={styles.label}>상담 방식</Text>
                  <Text style={styles.value}>{methodLabels[item.consultationMethod] ?? item.consultationMethod}</Text>
                </>
              )}

              {item.message ? (
                <>
                  <Text style={styles.label}>요청 사항</Text>
                  <Text style={styles.value}>{item.message}</Text>
                </>
              ) : null}

              <Text style={styles.createdAt}>신청일: {item.createdAt.slice(0, 16)}</Text>

              {nextActions[item.status] && (
                <View style={styles.actionRow}>
                  {nextActions[item.status].map((action) => (
                    <Pressable
                      key={action.status}
                      style={[styles.actionButton, action.status === "CANCELED" && styles.dangerButton]}
                      accessibilityRole="button"
                      onPress={() => confirmUpdate(item, action.verb, action.status)}
                    >
                      <Text style={[styles.actionText, action.status === "CANCELED" && styles.dangerText]}>
                        {action.verb}하기
                      </Text>
                    </Pressable>
                  ))}
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
  kindRow: { flexDirection: "row", gap: 8, marginBottom: 10 },
  kindButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#DDE2DE",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
  },
  kindText: { fontSize: 15, color: "#555", fontWeight: "600" },
  filterRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#DDE2DE",
    backgroundColor: "#FFFFFF",
  },
  filterText: { fontSize: 13, color: "#555" },
  selected: { backgroundColor: "#39765B", borderColor: "#39765B" },
  selectedText: { color: "#FFFFFF", fontWeight: "700" },
  loader: { marginVertical: 24 },
  list: { paddingBottom: 30 },
  total: { color: "#777", fontSize: 13, marginBottom: 12 },
  card: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E8E8E8",
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  facilityName: { flex: 1, marginRight: 8, fontSize: 16, fontWeight: "700", color: "#222" },
  badge: { backgroundColor: "#E5F3EA", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { color: "#267347", fontSize: 12, fontWeight: "700" },
  label: { color: "#777", fontSize: 12, marginTop: 8, marginBottom: 3 },
  value: { color: "#333", fontSize: 14, lineHeight: 20 },
  phone: { color: "#39765B", fontSize: 15, fontWeight: "700", textDecorationLine: "underline", paddingVertical: 4 },
  createdAt: {
    color: "#999",
    fontSize: 12,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
  },
  actionRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  actionButton: { flex: 1, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: "#39765B", alignItems: "center" },
  dangerButton: { borderColor: "#D9534F" },
  actionText: { color: "#39765B", fontSize: 14, fontWeight: "700" },
  dangerText: { color: "#C62828" },
  emptyContainer: { flexGrow: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { color: "#777", fontSize: 14, textAlign: "center" },
});
