import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ApiError, apiFetch } from "@/lib/api";

type Overview = {
  summary: {
    activeCount: number;
    autoRenewCount: number;
    monthRevenue: number;
    monthFailedCount: number;
    totalRevenue: number;
  };
  activeSubscriptions: {
    facilityId: number;
    facilityName: string;
    organizationName?: string;
    autoRenew: number | boolean; // MySQL 비교식이라 1/0 으로 옴
    premiumUntil: string;
  }[];
  recentPayments: {
    id: number;
    facilityId: number;
    facilityName?: string;
    amount: number;
    status: string;
    pgProvider: string;
    failureReason?: string;
    paidAt: string;
  }[];
};

const won = (n: number) => `${Number(n).toLocaleString("ko-KR")}원`;

export default function AdminSubscriptionScreen() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setError("");
      setData(await apiFetch<Overview>("/api/admin/subscriptions/overview"));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "매출·구독 현황을 불러오지 못했습니다.");
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (!data && !error) {
    return <ActivityIndicator size="large" style={styles.loader} />;
  }

  const s = data?.summary;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            load();
          }}
        />
      }
    >
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {s && (
        <View style={styles.statGrid}>
          <Stat label="이번 달 매출" value={won(s.monthRevenue)} />
          <Stat label="누적 매출" value={won(s.totalRevenue)} />
          <Stat label="상단 노출 중" value={`${s.activeCount}곳`} sub={`자동연장 ${s.autoRenewCount}곳`} />
          <Stat label="이번 달 결제 실패" value={`${s.monthFailedCount}건`} warn={s.monthFailedCount > 0} />
        </View>
      )}

      <Text style={styles.sectionTitle}>상단 노출 중인 시설</Text>
      {data?.activeSubscriptions.length ? (
        data.activeSubscriptions.map((item) => (
          <View key={item.facilityId} style={styles.row}>
            <View style={styles.rowMain}>
              <Text style={styles.rowTitle}>{item.facilityName}</Text>
              <Text style={styles.rowSub}>{item.organizationName ?? "-"}</Text>
            </View>
            <View style={styles.rowSide}>
              <Text style={styles.rowTitle}>{item.premiumUntil}까지</Text>
              <Text style={[styles.rowSub, item.autoRenew ? styles.ok : null]}>
                {item.autoRenew ? "자동연장" : "연장 안 함"}
              </Text>
            </View>
          </View>
        ))
      ) : (
        <Text style={styles.empty}>노출 중인 시설이 없습니다.</Text>
      )}

      <Text style={styles.sectionTitle}>최근 결제 (최대 50건)</Text>
      {data?.recentPayments.length ? (
        data.recentPayments.map((p) => (
          <View key={p.id} style={styles.row}>
            <View style={styles.rowMain}>
              <Text style={styles.rowTitle}>{p.facilityName ?? `시설 #${p.facilityId}`}</Text>
              <Text style={styles.rowSub}>
                {p.paidAt} · {p.pgProvider}
              </Text>
              {p.failureReason ? <Text style={styles.failText}>{p.failureReason}</Text> : null}
            </View>
            <View style={styles.rowSide}>
              <Text style={styles.rowTitle}>{won(p.amount)}</Text>
              <Text style={[styles.rowSub, p.status === "PAID" ? styles.ok : styles.failText]}>
                {p.status === "PAID" ? "결제 완료" : "실패"}
              </Text>
            </View>
          </View>
        ))
      ) : (
        <Text style={styles.empty}>결제 내역이 없습니다.</Text>
      )}
    </ScrollView>
  );
}

function Stat({ label, value, sub, warn }: { label: string; value: string; sub?: string; warn?: boolean }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, warn && styles.failText]}>{value}</Text>
      {sub ? <Text style={styles.rowSub}>{sub}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F8FA" },
  content: { padding: 20, paddingBottom: 40 },
  loader: { marginTop: 40 },
  error: { color: "#C0392B", marginBottom: 12 },
  statGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  stat: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E8E8E8",
  },
  statLabel: { fontSize: 13, color: "#777", marginBottom: 6 },
  statValue: { fontSize: 20, fontWeight: "700", color: "#26352D" },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#26352D", marginTop: 16, marginBottom: 10 },
  row: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E8E8E8",
  },
  rowMain: { flex: 1, paddingRight: 8 },
  rowSide: { alignItems: "flex-end" },
  rowTitle: { fontSize: 14, fontWeight: "600", color: "#26352D" },
  rowSub: { fontSize: 12, color: "#777", marginTop: 3 },
  ok: { color: "#39765B", fontWeight: "700" },
  failText: { color: "#C0392B", fontSize: 12, marginTop: 3 },
  empty: { color: "#999", fontSize: 13, marginBottom: 8 },
});
