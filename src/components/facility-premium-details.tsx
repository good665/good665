import { useState } from "react";
import {
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import { resolveImageUrl } from "@/config/api";

export type DealType = "MONTHLY" | "JEONSE" | "SALE";

export type FacilityDetails = {
  floorPlans: { id: number; fileUrl: string; fileType: "IMAGE" | "PDF"; label: string | null }[];
  rooms: {
    id: number;
    roomType: string;
    areaSqm: number | null;
    prices: { dealType: DealType; deposit: number | null; amount: number | null }[];
  }[];
};

export const EMPTY_TEXT = "등록한 내용이 없습니다.";

const DEAL_TABS: { type: DealType; label: string }[] = [
  { type: "MONTHLY", label: "월세" },
  { type: "JEONSE", label: "전세" },
  { type: "SALE", label: "매매" },
];

const SQM_PER_PYEONG = 3.3058;
const MAX_ZOOM = 4;

function won(value: number | null) {
  return `${(value ?? 0).toLocaleString("ko-KR")}원`;
}

function priceText(price: FacilityDetails["rooms"][number]["prices"][number] | undefined) {
  if (!price) return EMPTY_TEXT;
  if (price.dealType === "MONTHLY") return `보증금 ${won(price.deposit)} · 월세 ${won(price.amount)}`;
  if (price.dealType === "JEONSE") return `전세금 ${won(price.deposit)}`;
  return `매매가 ${won(price.amount)}`;
}

export function FacilityPremiumDetails({ details }: { details: FacilityDetails }) {
  const [deal, setDeal] = useState<DealType>("MONTHLY");
  const [zoomUrl, setZoomUrl] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const screen = useWindowDimensions();

  function closeZoom() {
    setZoomUrl(null);
    setZoom(1);
  }

  return (
    <>
      <View style={styles.card}>
        <Text style={styles.title}>도면도</Text>
        {details.floorPlans.length === 0 && <Text style={styles.empty}>{EMPTY_TEXT}</Text>}
        {details.floorPlans.map((plan) => {
          const url = resolveImageUrl(plan.fileUrl);
          return (
            <View key={plan.id} style={styles.plan}>
              {plan.label && <Text style={styles.planLabel}>{plan.label}</Text>}
              {plan.fileType === "PDF" ? (
                <Pressable
                  style={styles.pdfButton}
                  accessibilityRole="button"
                  onPress={() => Linking.openURL(url)}
                >
                  <Text style={styles.pdfText}>PDF 도면도 열기</Text>
                </Pressable>
              ) : (
                <Pressable
                  accessibilityRole="imagebutton"
                  accessibilityLabel="도면도 크게 보기"
                  onPress={() => setZoomUrl(url)}
                >
                  <Image source={{ uri: url }} style={styles.planImage} resizeMode="contain" />
                  <Text style={styles.hint}>눌러서 크게 보기</Text>
                </Pressable>
              )}
            </View>
          );
        })}
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>방 크기</Text>
        {details.rooms.length === 0 && <Text style={styles.empty}>{EMPTY_TEXT}</Text>}
        {details.rooms.map((room) => (
          <View key={room.id} style={styles.row}>
            <Text style={styles.rowName}>{room.roomType}</Text>
            {room.areaSqm == null ? (
              <Text style={styles.empty}>{EMPTY_TEXT}</Text>
            ) : (
              <Text style={styles.rowValue}>
                {room.areaSqm}㎡ (약 {(room.areaSqm / SQM_PER_PYEONG).toFixed(1)}평)
              </Text>
            )}
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>가격</Text>
        <View style={styles.tabs}>
          {DEAL_TABS.map((tab) => (
            <Pressable
              key={tab.type}
              style={[styles.tab, deal === tab.type && styles.tabOn]}
              accessibilityRole="tab"
              accessibilityState={{ selected: deal === tab.type }}
              onPress={() => setDeal(tab.type)}
            >
              <Text style={[styles.tabText, deal === tab.type && styles.tabTextOn]}>{tab.label}</Text>
            </Pressable>
          ))}
        </View>
        {details.rooms.length === 0 && <Text style={styles.empty}>{EMPTY_TEXT}</Text>}
        {details.rooms.map((room) => {
          const price = room.prices.find((p) => p.dealType === deal);
          return (
            <View key={room.id} style={styles.row}>
              <Text style={styles.rowName}>{room.roomType}</Text>
              <Text style={price ? styles.rowValue : styles.empty}>{priceText(price)}</Text>
            </View>
          );
        })}
      </View>

      <Modal visible={zoomUrl !== null} transparent animationType="fade" onRequestClose={closeZoom}>
        <View style={styles.modal}>
          {/* 핀치 확대는 iOS ScrollView 에만 있어, 양쪽에서 같은 확대 버튼 + 상하좌우 스크롤을 사용 */}
          <ScrollView contentContainerStyle={styles.modalContent}>
            <ScrollView horizontal contentContainerStyle={styles.modalContent}>
              {zoomUrl && (
                <Image
                  source={{ uri: zoomUrl }}
                  style={{ width: screen.width * zoom, height: screen.height * 0.75 * zoom }}
                  resizeMode="contain"
                />
              )}
            </ScrollView>
          </ScrollView>
          <View style={styles.modalBar}>
            <Pressable
              style={[styles.closeButton, zoom === 1 && styles.dimmed]}
              accessibilityRole="button"
              accessibilityLabel="축소"
              disabled={zoom === 1}
              onPress={() => setZoom(zoom - 1)}
            >
              <Text style={styles.closeText}>－</Text>
            </Pressable>
            <Pressable
              style={[styles.closeButton, zoom === MAX_ZOOM && styles.dimmed]}
              accessibilityRole="button"
              accessibilityLabel="확대"
              disabled={zoom === MAX_ZOOM}
              onPress={() => setZoom(zoom + 1)}
            >
              <Text style={styles.closeText}>＋</Text>
            </Pressable>
            <Pressable style={styles.closeButton} accessibilityRole="button" onPress={closeZoom}>
              <Text style={styles.closeText}>닫기</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#FFFFFF", padding: 20, borderRadius: 16, marginBottom: 16 },
  title: { fontSize: 18, fontWeight: "700", color: "#26352D", marginBottom: 16 },
  empty: { fontSize: 14, color: "#777", lineHeight: 21 },
  plan: { marginBottom: 14 },
  planLabel: { fontSize: 14, fontWeight: "600", color: "#26352D", marginBottom: 6 },
  planImage: { width: "100%", height: 200, borderRadius: 10, backgroundColor: "#F2F4F3" },
  hint: { fontSize: 12, color: "#777", marginTop: 6 },
  pdfButton: { borderWidth: 1.5, borderColor: "#39765B", borderRadius: 10, paddingVertical: 12, alignItems: "center" },
  pdfText: { color: "#39765B", fontSize: 15, fontWeight: "700" },
  row: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#EEF0EE" },
  rowName: { fontSize: 13, color: "#777", marginBottom: 4 },
  rowValue: { fontSize: 15, fontWeight: "600", color: "#26352D", lineHeight: 22 },
  tabs: { flexDirection: "row", gap: 6, marginBottom: 8 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: "#DDE2DE", alignItems: "center" },
  tabOn: { backgroundColor: "#39765B", borderColor: "#39765B" },
  tabText: { fontSize: 14, color: "#26352D" },
  tabTextOn: { color: "#FFFFFF", fontWeight: "700" },
  modal: { flex: 1, backgroundColor: "rgba(0,0,0,0.92)" },
  modalContent: { flexGrow: 1, justifyContent: "center" },
  modalBar: { flexDirection: "row", gap: 10, padding: 20 },
  closeButton: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: "#FFFFFF", alignItems: "center" },
  dimmed: { opacity: 0.4 },
  closeText: { fontSize: 16, fontWeight: "700", color: "#26352D" },
});
