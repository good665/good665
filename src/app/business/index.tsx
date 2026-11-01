import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { getFacilityTypeName } from "@/config/api";
import { ApiError, apiFetch } from "@/lib/api";

type MyFacility = {
  id: number;
  organizationId: number;
  organizationName: string;
  facilityType: string;
  name: string;
  address: string;
  status: string;
};

type FacilityPage = {
  items: MyFacility[];
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

export default function MyFacilitiesScreen() {
  const router = useRouter();

  const [facilities, setFacilities] = useState<MyFacility[]>([]);
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

        const data = await apiFetch<FacilityPage>(
          `/api/business/facilities?${params.toString()}`,
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
        setError(e instanceof ApiError ? e.message : "시설 목록을 불러오지 못했습니다.");
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

      <Pressable style={styles.createButton} onPress={() => router.push("/business/new")}>
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
          ListHeaderComponent={!error ? <Text style={styles.total}>전체 {total}건</Text> : undefined}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {error || "등록된 시설이 없습니다. 위 버튼으로 첫 시설을 등록해 보세요."}
            </Text>
          }
          renderItem={({ item }) => {
            const badge = statusBadge[item.status] ?? statusBadge.PENDING;

            return (
              <Pressable
                style={styles.card}
                onPress={() =>
                  router.push({ pathname: "/business/[id]", params: { id: item.id } })
                }
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.facilityType}>{getFacilityTypeName(item.facilityType)}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.statusText, { color: badge.fg }]}>{badge.label}</Text>
                  </View>
                </View>

                <Text style={styles.facilityName}>{item.name} (수정 →)</Text>
                <Text style={styles.address}>{item.address}</Text>
              </Pressable>
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
    paddingHorizontal: 20,
  },
  footerLoader: {
    marginVertical: 16,
  },
});
