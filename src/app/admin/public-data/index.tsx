import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { ApiError, apiFetch } from "@/lib/api";

type ImportResult = {
  region: string;
  institutions: number; // 그 지역 장기요양기관 수 (들여올 종류만)
  alreadyImported: number;
  imported: number;
  failed: number;
  remaining: number;
  firstError: string | null;
};

// 지원 지역 — 백엔드 LtcImportService.REGIONS 와 맞춤
const regions = [
  { label: "서울", code: "11" },
  { label: "경기", code: "41" },
];

const BATCH = 300; // 한 번에 들여올 기관 수 (기관마다 상세조회 1회, 하루 10,000회 한도)

export default function AdminPublicDataScreen() {
  const [busy, setBusy] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState("");

  async function runImport(code: string) {
    setBusy(code);
    setError("");
    setResult(null);

    try {
      setResult(
        await apiFetch<ImportResult>(`/api/admin/public-data/ltc?siDoCd=${code}&limit=${BATCH}`, {
          method: "POST",
        }),
      );
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "가져오기에 실패했습니다.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.description}>
        국민건강보험공단 장기요양기관 공공데이터에서 요양원·주야간보호·방문 돌봄 기관을 시설로 들여옵니다.
        한 번에 {BATCH}곳씩 들여오고, 이미 들여온 기관은 건너뜁니다. 남은 기관이 있으면 다시 누르세요.
      </Text>

      <View style={styles.buttonRow}>
        {regions.map((r) => (
          <Pressable
            key={r.code}
            style={[styles.button, busy !== null && styles.disabled]}
            disabled={busy !== null}
            onPress={() => runImport(r.code)}
          >
            {busy === r.code ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>{r.label} 가져오기</Text>
            )}
          </Pressable>
        ))}
      </View>

      {busy && <Text style={styles.helper}>기관 수에 따라 몇 분 걸릴 수 있습니다…</Text>}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {result && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{result.region}</Text>
          <Text style={styles.line}>대상 기관 {result.institutions.toLocaleString("ko-KR")}곳</Text>
          <Text style={styles.line}>이번에 추가 {result.imported}곳 · 이전에 추가 {result.alreadyImported}곳</Text>
          <Text style={styles.line}>남은 기관 {result.remaining.toLocaleString("ko-KR")}곳</Text>
          {result.failed > 0 && <Text style={styles.error}>실패 {result.failed}곳</Text>}
          {result.firstError && <Text style={styles.error}>{result.firstError}</Text>}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F8FA" },
  content: { padding: 20 },
  description: { fontSize: 13, color: "#555", lineHeight: 20, marginBottom: 16 },
  buttonRow: { flexDirection: "row", gap: 10 },
  button: {
    flex: 1,
    backgroundColor: "#39765B",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  disabled: { opacity: 0.6 },
  buttonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  helper: { fontSize: 12, color: "#777", marginTop: 10 },
  error: { color: "#C0392B", fontSize: 13, marginTop: 8 },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#E8E8E8",
  },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#26352D", marginBottom: 8 },
  line: { fontSize: 14, color: "#26352D", marginTop: 4 },
});
