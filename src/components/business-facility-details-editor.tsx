import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { type FacilityDetails } from "@/components/facility-premium-details";
import { parseFee } from "@/config/api";
import { alertMessage } from "@/lib/alert";
import { apiFetch, apiUpload, uploadFormData } from "@/lib/api";

type RoomForm = {
  key: number;
  roomType: string;
  area: string;
  deposit: string;
  rent: string;
  jeonse: string;
  sale: string;
};

function errorText(e: unknown, fallback: string) {
  return e instanceof Error ? e.message : fallback;
}

function amountText(value: number | null | undefined) {
  return value == null ? "" : String(value);
}

/** 입력값 → 요청 본문. 잘못된 입력은 조용히 지워지지 않도록 오류 문구를 던짐 */
export function toRequest(rooms: RoomForm[]) {
  return {
    rooms: rooms.map((room) => {
      const name = room.roomType.trim() || "방";
      const area = room.area.trim();
      const areaSqm = area ? Number(area) : null;
      const deposit = parseFee(room.deposit);
      const rent = parseFee(room.rent);
      const jeonse = parseFee(room.jeonse);
      const sale = parseFee(room.sale);

      // Infinity 는 JSON 에서 null 이 되어 기존 값이 조용히 지워지므로 함께 막음
      if ([areaSqm, deposit, rent, jeonse, sale].some((value) => value !== null && !Number.isFinite(value))) {
        throw new Error(`${name}: 크기와 가격은 숫자로 입력해 주세요.`);
      }
      if (deposit !== null && rent === null) {
        throw new Error(`${name}: 월세 금액을 입력해 주세요.`);
      }

      const prices = [];
      if (rent !== null) prices.push({ dealType: "MONTHLY", deposit: deposit ?? 0, amount: rent });
      if (jeonse !== null) prices.push({ dealType: "JEONSE", deposit: jeonse, amount: null });
      if (sale !== null) prices.push({ dealType: "SALE", deposit: null, amount: sale });

      return { roomType: room.roomType, areaSqm, prices };
    }),
  };
}

export function BusinessFacilityDetailsEditor({ facilityId }: { facilityId: number }) {
  const path = `/api/business/facilities/${facilityId}/details`;
  const nextKey = useRef(0);

  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [plans, setPlans] = useState<FacilityDetails["floorPlans"]>([]);
  const [rooms, setRooms] = useState<RoomForm[]>([]);
  const [label, setLabel] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  function applyRooms(data: FacilityDetails["rooms"]) {
    setRooms(
      data.map((room) => {
        const find = (type: string) => room.prices.find((p) => p.dealType === type);
        return {
          key: nextKey.current++,
          roomType: room.roomType,
          area: amountText(room.areaSqm),
          deposit: amountText(find("MONTHLY")?.deposit),
          rent: amountText(find("MONTHLY")?.amount),
          jeonse: amountText(find("JEONSE")?.deposit),
          sale: amountText(find("SALE")?.amount),
        };
      }),
    );
  }

  useEffect(() => {
    let active = true;

    apiFetch<FacilityDetails>(path)
      .then((data) => {
        if (!active) return;
        setPlans(data.floorPlans);
        applyRooms(data.rooms);
      })
      .catch(() => {
        if (active) setLoadFailed(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [path, loadAttempt]);

  async function upload(formData: FormData) {
    if (label.trim()) formData.append("label", label.trim());

    setUploading(true);
    try {
      const plan = await apiUpload<FacilityDetails["floorPlans"][number]>(`${path}/floor-plans`, formData);
      setPlans((prev) => [...prev, plan]);
      setLabel("");
    } catch (e) {
      alertMessage("업로드 실패", errorText(e, "도면도 업로드 중 오류가 발생했습니다."));
    } finally {
      setUploading(false);
    }
  }

  async function pickImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      alertMessage("권한 필요", "도면도를 등록하려면 사진 보관함 접근 권한이 필요합니다.");
      return;
    }

    // quality 1 은 원본을 그대로 복사해 iPhone HEIC 가 서버에서 거절됨 → JPEG 로 변환되도록 지정
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.9,
      preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
    });
    if (!result.canceled && result.assets?.[0]) {
      await upload(uploadFormData(result.assets[0]));
    }
  }

  async function pickPdf() {
    const result = await DocumentPicker.getDocumentAsync({ type: "application/pdf" });
    const asset = result.assets?.[0];
    if (result.canceled || !asset) return;

    await upload(uploadFormData({ ...asset, mimeType: "application/pdf" }));
  }

  async function deletePlan(planId: number) {
    try {
      await apiFetch(`${path}/floor-plans/${planId}`, { method: "DELETE" });
      setPlans((prev) => prev.filter((plan) => plan.id !== planId));
    } catch (e) {
      alertMessage("삭제 실패", errorText(e, "도면도 삭제 중 오류가 발생했습니다."));
    }
  }

  function confirmDeletePlan(planId: number) {
    if (Platform.OS === "web") {
      if (window.confirm("이 도면도를 삭제하시겠습니까?")) deletePlan(planId);
      return;
    }
    Alert.alert("도면도 삭제", "이 도면도를 삭제하시겠습니까?", [
      { text: "취소", style: "cancel" },
      { text: "삭제", style: "destructive", onPress: () => deletePlan(planId) },
    ]);
  }

  function updateRoom(key: number, field: keyof Omit<RoomForm, "key">, value: string) {
    setRooms((prev) => prev.map((room) => (room.key === key ? { ...room, [field]: value } : room)));
  }

  function addRoom() {
    setRooms((prev) => [
      ...prev,
      { key: nextKey.current++, roomType: "", area: "", deposit: "", rent: "", jeonse: "", sale: "" },
    ]);
  }

  async function save() {
    setSaving(true);
    try {
      const data = await apiFetch<FacilityDetails>(path, {
        method: "PUT",
        body: JSON.stringify(toRequest(rooms)),
      });
      applyRooms(data.rooms);
      alertMessage("저장 완료", "방 종류와 가격을 저장했습니다.");
    } catch (e) {
      alertMessage("저장 실패", errorText(e, "저장 중 오류가 발생했습니다."));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <ActivityIndicator color="#39765B" style={styles.loading} />;
  }

  // 저장은 방 목록 전체를 교체하므로, 불러오지 못한 상태에서는 입력·저장 화면을 보여 주지 않음
  if (loadFailed) {
    return (
      <View>
        <Text style={styles.sectionTitle}>도면도 · 방 크기 · 가격</Text>
        <Text style={styles.notice}>등록한 내용을 불러오지 못했습니다. 네트워크를 확인한 뒤 다시 시도해 주세요.</Text>
        <View style={styles.buttonRow}>
          <Pressable
            style={styles.outline}
            accessibilityRole="button"
            onPress={() => {
              setLoadFailed(false);
              setLoading(true);
              setLoadAttempt((n) => n + 1);
            }}
          >
            <Text style={styles.outlineText}>다시 시도</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const field = (room: RoomForm, name: keyof Omit<RoomForm, "key">, title: string, numeric = true) => (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{title}</Text>
      <TextInput
        style={styles.input}
        value={room[name]}
        onChangeText={(value) => updateRoom(room.key, name, value)}
        keyboardType={numeric ? "numeric" : "default"}
        accessibilityLabel={`${room.roomType || "새 방"} ${title}`}
      />
    </View>
  );

  return (
    <View>
      <Text style={styles.sectionTitle}>도면도 · 방 크기 · 가격</Text>
      <Text style={styles.notice}>
        등록한 내용은 광고가 진행되는 동안에만 시설 화면에 공개됩니다. 비워 둔 항목은 &quot;등록한 내용이 없습니다.&quot;로 표시됩니다.
      </Text>

      <Text style={styles.subTitle}>도면도</Text>
      {plans.length === 0 && <Text style={styles.helper}>등록한 내용이 없습니다.</Text>}
      {plans.map((plan) => (
        <View key={plan.id} style={styles.planRow}>
          <Text style={styles.planName}>
            {plan.label || "도면도"} ({plan.fileType === "PDF" ? "PDF" : "사진"})
          </Text>
          <Pressable accessibilityRole="button" onPress={() => confirmDeletePlan(plan.id)}>
            <Text style={styles.delete}>삭제</Text>
          </Pressable>
        </View>
      ))}
      <TextInput
        style={[styles.input, styles.labelInput]}
        value={label}
        onChangeText={setLabel}
        maxLength={30}
        placeholder="층 이름 (선택, 예: 1층)"
        accessibilityLabel="도면도 층 이름"
      />
      <View style={styles.buttonRow}>
        <Pressable style={styles.outline} disabled={uploading} accessibilityRole="button" onPress={pickImage}>
          <Text style={styles.outlineText}>사진 선택</Text>
        </Pressable>
        <Pressable style={styles.outline} disabled={uploading} accessibilityRole="button" onPress={pickPdf}>
          <Text style={styles.outlineText}>PDF 선택</Text>
        </Pressable>
      </View>
      {uploading && <ActivityIndicator color="#39765B" style={styles.loading} />}
      <Text style={styles.helper}>JPG, PNG, PDF · 20MB 이하</Text>

      <Text style={styles.subTitle}>방 종류별 크기와 가격</Text>
      {rooms.length === 0 && <Text style={styles.helper}>등록한 내용이 없습니다.</Text>}
      {rooms.map((room) => (
        <View key={room.key} style={styles.roomCard}>
          {field(room, "roomType", "방 종류 (예: 1인실)", false)}
          {field(room, "area", "크기 (㎡)")}
          {field(room, "deposit", "월세 보증금 (원)")}
          {field(room, "rent", "월세 (원)")}
          {field(room, "jeonse", "전세금 (원)")}
          {field(room, "sale", "매매가 (원)")}
          <Pressable
            accessibilityRole="button"
            onPress={() => setRooms((prev) => prev.filter((r) => r.key !== room.key))}
          >
            <Text style={styles.delete}>이 방 삭제</Text>
          </Pressable>
        </View>
      ))}
      <View style={styles.buttonRow}>
        <Pressable style={styles.outline} accessibilityRole="button" onPress={addRoom}>
          <Text style={styles.outlineText}>+ 방 종류 추가</Text>
        </Pressable>
        <Pressable style={styles.primary} disabled={saving} accessibilityRole="button" onPress={save}>
          {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryText}>저장</Text>}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { marginVertical: 12 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#26352D", marginTop: 20, marginBottom: 12 },
  subTitle: { fontSize: 14, fontWeight: "700", color: "#26352D", marginTop: 16, marginBottom: 8 },
  notice: { fontSize: 13, color: "#555", lineHeight: 19 },
  helper: { fontSize: 12, color: "#777", marginTop: 6 },
  planRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 12,
    marginBottom: 6,
  },
  planName: { flex: 1, fontSize: 14, color: "#26352D" },
  delete: { color: "#C0392B", fontSize: 14, fontWeight: "600", paddingVertical: 4 },
  labelInput: { marginTop: 8 },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDE2DE",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#333",
  },
  buttonRow: { flexDirection: "row", gap: 10, marginTop: 10 },
  outline: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: "#39765B",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  outlineText: { color: "#39765B", fontSize: 15, fontWeight: "700" },
  primary: { flex: 1, backgroundColor: "#39765B", borderRadius: 10, paddingVertical: 12, alignItems: "center" },
  primaryText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  roomCard: { backgroundColor: "#F2F5F3", borderRadius: 12, padding: 12, marginBottom: 10 },
  field: { marginBottom: 10 },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: "#333", marginBottom: 6 },
});
