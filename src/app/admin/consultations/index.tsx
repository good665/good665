import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ApiError, apiFetch } from "@/lib/api";

type AdminConsultation = {
  id: number;
  facilityId: number;
  facilityName: string;
  userId: number;
  userName: string;
  userEmail: string;
  preferredAt: string;
  consultationMethod: string;
  message: string | null;
  status: string;
  createdAt: string;
};

type ConsultationPage = {
  items: AdminConsultation[];
  page: number;
  hasNext: boolean;
  totalElements: number;
};

const statusFilters = [
  { label: "전체", value: "" },
  { label: "신청", value: "REQUESTED" },
  { label: "확정", value: "CONFIRMED" },
  { label: "완료", value: "COMPLETED" },
  { label: "취소", value: "CANCELED" },
];

const statusLabels: Record<string, string> = {
  REQUESTED: "신청 완료",
  CONFIRMED: "상담 확정",
  COMPLETED: "상담 완료",
  CANCELED: "취소됨",
};

const methodLabels: Record<string, string> = {
  PHONE: "전화 상담",
  VISIT: "방문 상담",
  ONLINE: "온라인 상담",
};

const nextActions: Record<string, { label: string; status: string }[]> = {
  REQUESTED: [
    { label: "확정으로 변경", status: "CONFIRMED" },
    { label: "취소 처리", status: "CANCELED" },
  ],
  CONFIRMED: [
    { label: "완료로 변경", status: "COMPLETED" },
    { label: "취소 처리", status: "CANCELED" },
  ],
  COMPLETED: [],
  CANCELED: [],
};

function formatDate(date: string) {
  if (!date) return "-";
  return date.replace("T", " ").slice(0, 16);
}

export default function AdminConsultationListScreen() {
  const [consultations, setConsultations] = useState<AdminConsultation[]>([]);
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [total, setTotal] = useState(0);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // 필터를 빠르게 바꿔 응답이 뒤섞여 도착해도 "가장 최근 요청"의 결과만 반영하기 위한 번호표
  const requestId = useRef(0);

  const fetchPage = useCallback(
    async (pageToLoad: number, append: boolean, statusValue: string) => {
      const myId = ++requestId.current;

      try {
        setError("");

        const params = new URLSearchParams({ page: String(pageToLoad), size: "10" });
        if (statusValue) params.set("status", statusValue);

        const data = await apiFetch<ConsultationPage>(
          `/api/admin/consultations?${params.toString()}`,
        );

        if (myId !== requestId.current) return;

        setConsultations((prev) => (append ? [...prev, ...data.items] : data.items));
        setPage(data.page);
        setHasNext(data.hasNext);
        setTotal(data.totalElements);
      } catch (e) {
        if (myId !== requestId.current) return;

        if (!append) setConsultations([]);
        setHasNext(false);
        setError(
          e instanceof ApiError ? e.message : "상담 목록을 불러오지 못했습니다.",
        );
      } finally {
        if (myId === requestId.current) {
          setLoading(false);
          setLoadingMore(false);
          setRefreshing(false);
        }
      }
    },
    [],
  );

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchPage(0, false, status);
    }, [status, fetchPage]),
  );

  const loadMore = () => {
    if (loading || loadingMore || refreshing || !hasNext || error) return;
    setLoadingMore(true);
    fetchPage(page + 1, true, status);
  };

  const updateStatus = async (consultationId: number, nextStatus: string) => {
    try {
      await apiFetch(`/api/admin/consultations/${consultationId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
      fetchPage(0, false, status);
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "상태 변경 중 오류가 발생했습니다.";
      if (Platform.OS === "web") {
        window.alert(message);
      } else {
        Alert.alert("실패", message);
      }
    }
  };

  const confirmUpdate = (consultationId: number, label: string, nextStatus: string) => {
    const message = `${label}하시겠습니까?`;

    if (Platform.OS === "web") {
      if (window.confirm(message)) updateStatus(consultationId, nextStatus);
      return;
    }

    Alert.alert("상태 변경", message, [
      { text: "취소", style: "cancel" },
      { text: "확인", onPress: () => updateStatus(consultationId, nextStatus) },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.filterRow}>
        {statusFilters.map((item) => (
          <Pressable
            key={item.value}
            style={[styles.filterButton, status === item.value && styles.filterButtonSelected]}
            onPress={() => setStatus(item.value)}
          >
            <Text
              style={[styles.filterText, status === item.value && styles.filterTextSelected]}
            >
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" style={styles.loader} />
      ) : (
        <FlatList
          data={consultations}
          keyExtractor={(item) => String(item.id)}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchPage(0, false, status);
              }}
            />
          }
          contentContainerStyle={
            consultations.length === 0 ? styles.emptyContainer : styles.list
          }
          ListHeaderComponent={!error ? <Text style={styles.total}>전체 {total}건</Text> : undefined}
          ListEmptyComponent={
            <Text style={styles.emptyText}>{error || "상담 신청이 없습니다."}</Text>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.facilityName}>{item.facilityName}</Text>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>
                    {statusLabels[item.status] ?? item.status}
                  </Text>
                </View>
              </View>

              <Text style={styles.label}>신청자</Text>
              <Text style={styles.value}>
                {item.userName} ({item.userEmail})
              </Text>

              <Text style={styles.label}>희망 상담 일시</Text>
              <Text style={styles.value}>{formatDate(item.preferredAt)}</Text>

              <Text style={styles.label}>상담 방식</Text>
              <Text style={styles.value}>
                {methodLabels[item.consultationMethod] ?? item.consultationMethod}
              </Text>

              {item.message ? (
                <>
                  <Text style={styles.label}>요청 사항</Text>
                  <Text style={styles.value}>{item.message}</Text>
                </>
              ) : null}

              <Text style={styles.createdAt}>신청일: {formatDate(item.createdAt)}</Text>

              {nextActions[item.status]?.length > 0 && (
                <View style={styles.actionRow}>
                  {nextActions[item.status].map((action) => (
                    <Pressable
                      key={action.status}
                      style={[
                        styles.actionButton,
                        action.status === "CANCELED" && styles.actionButtonDanger,
                      ]}
                      onPress={() => confirmUpdate(item.id, action.label, action.status)}
                    >
                      <Text
                        style={[
                          styles.actionButtonText,
                          action.status === "CANCELED" && styles.actionButtonTextDanger,
                        ]}
                      >
                        {action.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          )}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator color="#39765B" style={styles.footerLoader} />
            ) : undefined
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F8FA",
    padding: 20,
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#DDE2DE",
    backgroundColor: "#FFFFFF",
  },
  filterButtonSelected: {
    backgroundColor: "#39765B",
    borderColor: "#39765B",
  },
  filterText: {
    fontSize: 13,
    color: "#555",
  },
  filterTextSelected: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  loader: {
    marginTop: 40,
  },
  list: {
    paddingBottom: 30,
  },
  total: {
    color: "#777",
    fontSize: 13,
    marginBottom: 12,
  },
  card: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E8E8E8",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  facilityName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222",
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    backgroundColor: "#E5F3EA",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    color: "#267347",
    fontSize: 12,
    fontWeight: "700",
  },
  label: {
    color: "#777",
    fontSize: 12,
    marginTop: 8,
    marginBottom: 3,
  },
  value: {
    color: "#333",
    fontSize: 14,
    lineHeight: 20,
  },
  createdAt: {
    color: "#999",
    fontSize: 12,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#39765B",
    alignItems: "center",
  },
  actionButtonDanger: {
    borderColor: "#D9534F",
  },
  actionButtonText: {
    color: "#39765B",
    fontSize: 13,
    fontWeight: "700",
  },
  actionButtonTextDanger: {
    color: "#C62828",
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    color: "#777",
    fontSize: 14,
    textAlign: "center",
  },
  footerLoader: {
    marginVertical: 16,
  },
});
