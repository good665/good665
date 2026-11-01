import { useFocusEffect, useRouter } from "expo-router";
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

import { getFacilityTypeName } from "@/config/api";
import { ApiError, apiFetch } from "@/lib/api";

type AdminFacility = {
  id: number;
  organizationId: number;
  organizationName: string;
  facilityType: string;
  name: string;
  address: string;
  phone: string;
  monthlyFeeMin: number | null;
  monthlyFeeMax: number | null;
  introduction: string | null;
  admissionConditions: string | null;
  status: string;
  photos: string[] | null;
};

type FacilityPage = {
  items: AdminFacility[];
  page: number;
  hasNext: boolean;
  totalElements: number;
};

const statusFilters = [
  { label: "전체", value: "" },
  { label: "승인 대기", value: "PENDING" },
  { label: "운영 중", value: "ACTIVE" },
  { label: "비활성화", value: "INACTIVE" },
];

const statusBadge: Record<string, { label: string; bg: string; fg: string }> = {
  PENDING: { label: "승인 대기", bg: "#FFF3CD", fg: "#8A6D1D" },
  ACTIVE: { label: "운영 중", bg: "#E5F3EA", fg: "#267347" },
  INACTIVE: { label: "비활성화", bg: "#F3E5E5", fg: "#A63B3B" },
};

export default function AdminFacilityListScreen() {
  const router = useRouter();

  const [facilities, setFacilities] = useState<AdminFacility[]>([]);
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

        const params = new URLSearchParams({
          page: String(pageToLoad),
          size: "10",
        });

        if (statusValue) params.set("status", statusValue);

        const data = await apiFetch<FacilityPage>(
          `/api/admin/facilities?${params.toString()}`,
        );

        if (myId !== requestId.current) return;

        setFacilities((prev) => (append ? [...prev, ...data.items] : data.items));
        setPage(data.page);
        setHasNext(data.hasNext);
        setTotal(data.totalElements);
      } catch (e) {
        if (myId !== requestId.current) return;

        if (!append) setFacilities([]);
        setHasNext(false);
        setError(
          e instanceof ApiError
            ? e.message
            : "시설 목록을 불러오지 못했습니다.",
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

  const changeStatus = async (facility: AdminFacility, nextActive: boolean) => {
    const path = nextActive
      ? `/api/admin/facilities/${facility.id}/activate`
      : `/api/admin/facilities/${facility.id}`;

    try {
      await apiFetch(path, { method: nextActive ? "PUT" : "DELETE" });
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

  const confirmChangeStatus = (facility: AdminFacility, nextActive: boolean, actionLabel: string) => {
    const message = `"${facility.name}" 시설을 ${actionLabel}하시겠습니까?`;

    if (Platform.OS === "web") {
      if (window.confirm(message)) changeStatus(facility, nextActive);
      return;
    }

    Alert.alert("상태 변경", message, [
      { text: "취소", style: "cancel" },
      { text: "확인", onPress: () => changeStatus(facility, nextActive) },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.filterRow}>
        {statusFilters.map((item) => (
          <Pressable
            key={item.value}
            style={[
              styles.filterButton,
              status === item.value && styles.filterButtonSelected,
            ]}
            onPress={() => setStatus(item.value)}
          >
            <Text
              style={[
                styles.filterText,
                status === item.value && styles.filterTextSelected,
              ]}
            >
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Pressable
        style={styles.createButton}
        onPress={() => router.push("/admin/facilities/new")}
      >
        <Text style={styles.createButtonText}>+ 시설 등록</Text>
      </Pressable>

      {loading ? (
        <ActivityIndicator size="large" style={styles.loader} />
      ) : (
        <FlatList
          data={facilities}
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
            facilities.length === 0 ? styles.emptyContainer : styles.list
          }
          ListHeaderComponent={
            !error ? (
              <Text style={styles.total}>전체 {total}건</Text>
            ) : undefined
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {error || "등록된 시설이 없습니다."}
            </Text>
          }
          renderItem={({ item }) => {
            const badge = statusBadge[item.status] ?? statusBadge.PENDING;

            return (
              <View style={styles.card}>
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: "/admin/facilities/[id]",
                      params: { id: item.id },
                    })
                  }
                >
                  <View style={styles.cardHeader}>
                    <Text style={styles.facilityType}>
                      {getFacilityTypeName(item.facilityType)}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                      <Text style={[styles.statusText, { color: badge.fg }]}>{badge.label}</Text>
                    </View>
                  </View>

                  <Text style={styles.facilityName}>{item.name} (수정 →)</Text>
                  <Text style={styles.address}>{item.address}</Text>
                  <Text style={styles.org}>
                    운영 기관: {item.organizationName} (#{item.organizationId})
                  </Text>
                </Pressable>

                {item.status === "PENDING" ? (
                  <View style={styles.actionRow}>
                    <Pressable
                      style={styles.toggleButton}
                      onPress={() => confirmChangeStatus(item, true, "승인")}
                    >
                      <Text style={styles.toggleButtonText}>승인하기</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.toggleButton, styles.toggleButtonDanger]}
                      onPress={() => confirmChangeStatus(item, false, "거절")}
                    >
                      <Text style={[styles.toggleButtonText, styles.toggleButtonTextDanger]}>
                        거절
                      </Text>
                    </Pressable>
                  </View>
                ) : (
                  <Pressable
                    style={[
                      styles.toggleButton,
                      styles.fullWidthButton,
                      item.status === "ACTIVE" && styles.toggleButtonDanger,
                    ]}
                    onPress={() =>
                      confirmChangeStatus(
                        item,
                        item.status !== "ACTIVE",
                        item.status === "ACTIVE" ? "비활성화" : "다시 활성화",
                      )
                    }
                  >
                    <Text
                      style={[
                        styles.toggleButtonText,
                        item.status === "ACTIVE" && styles.toggleButtonTextDanger,
                      ]}
                    >
                      {item.status === "ACTIVE" ? "비활성화" : "다시 활성화"}
                    </Text>
                  </Pressable>
                )}
              </View>
            );
          }}
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
    gap: 8,
    marginBottom: 16,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#DDE2DE",
    alignItems: "center",
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
  createButton: {
    backgroundColor: "#39765B",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 16,
  },
  createButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
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
    marginBottom: 8,
  },
  facilityType: {
    color: "#39765B",
    fontSize: 12,
    fontWeight: "700",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
  },
  facilityName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222",
    marginBottom: 4,
  },
  address: {
    fontSize: 13,
    color: "#666",
    marginBottom: 4,
  },
  org: {
    fontSize: 12,
    color: "#999",
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#39765B",
    alignItems: "center",
  },
  fullWidthButton: {
    marginTop: 12,
  },
  toggleButtonDanger: {
    borderColor: "#D9534F",
  },
  toggleButtonText: {
    color: "#39765B",
    fontSize: 13,
    fontWeight: "700",
  },
  toggleButtonTextDanger: {
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
