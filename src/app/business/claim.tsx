import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { getFacilityTypeName } from "@/config/api";
import { alertMessage } from "@/lib/alert";
import { apiFetch, apiUpload, uploadFormData } from "@/lib/api";
import { pickDocumentPhoto, pickPdf } from "@/lib/file-pickers";

type ClaimableFacility = {
  id: number;
  name: string;
  address: string;
  phone: string | null;
  facilityType: string;
  myPending: boolean;
};

type Organization = { id: number; name: string };

type MyClaim = {
  id: number;
  facilityName: string;
  organizationName: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  rejectReason: string | null;
  createdAt: string;
};

type Picked = Parameters<typeof uploadFormData>[0];

const STATUS_LABELS: Record<MyClaim["status"], string> = {
  PENDING: "검토 중",
  APPROVED: "승인됨",
  REJECTED: "거절됨",
};

const MIN_KEYWORD = 2;

function errorText(e: unknown, fallback: string) {
  return e instanceof Error ? e.message : fallback;
}

export default function FacilityClaimScreen() {
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState<ClaimableFacility[] | null>(null);
  const [searching, setSearching] = useState(false);

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [claims, setClaims] = useState<MyClaim[]>([]);

  const [selected, setSelected] = useState<ClaimableFacility | null>(null);
  const [organizationId, setOrganizationId] = useState<number | null>(null);
  const [document, setDocument] = useState<Picked | null>(null);
  const [documentName, setDocumentName] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadClaims = useCallback(async () => {
    try {
      setClaims(await apiFetch<MyClaim[]>("/api/business/facility-claims"));
    } catch (e) {
      alertMessage("불러오기 실패", errorText(e, "신청 내역을 불러오지 못했습니다."));
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadClaims();
      apiFetch<Organization[]>("/api/business/organizations")
        .then((list) => {
          setOrganizations(list);
          setOrganizationId((current) => current ?? list[0]?.id ?? null);
        })
        .catch((e) => alertMessage("불러오기 실패", errorText(e, "운영 기관을 불러오지 못했습니다.")));
    }, [loadClaims]),
  );

  async function search() {
    const value = keyword.trim();
    if (value.length < MIN_KEYWORD) {
      alertMessage("입력 확인", "시설명이나 주소를 두 글자 이상 입력해 주세요.");
      return;
    }

    setSearching(true);
    setSelected(null);
    try {
      const params = new URLSearchParams({ keyword: value, size: "20" });
      const page = await apiFetch<{ items: ClaimableFacility[] }>(
        `/api/business/facility-claims/claimable?${params.toString()}`,
      );
      setResults(page.items);
    } catch (e) {
      alertMessage("검색 실패", errorText(e, "시설을 검색하지 못했습니다."));
    } finally {
      setSearching(false);
    }
  }

  async function attach(pick: () => Promise<(Picked & { fileName?: string | null; name?: string }) | null>) {
    const asset = await pick();
    if (asset) {
      setDocument(asset);
      setDocumentName(asset.fileName ?? asset.name ?? "첨부한 파일");
    }
  }

  async function submit() {
    if (!selected || !organizationId) {
      alertMessage("입력 확인", "시설과 운영 기관을 선택해 주세요.");
      return;
    }
    if (!document) {
      alertMessage("입력 확인", "사업자등록증 등 증빙 서류를 첨부해 주세요.");
      return;
    }

    setSubmitting(true);
    try {
      const formData = uploadFormData(document);
      formData.append("facilityId", String(selected.id));
      formData.append("organizationId", String(organizationId));
      if (message.trim()) formData.append("message", message.trim());

      await apiUpload("/api/business/facility-claims", formData);

      alertMessage("신청 완료", "소유권 신청이 접수되었습니다. 관리자가 확인한 뒤 결과를 이 화면에서 알려 드립니다.");
      setSelected(null);
      setDocument(null);
      setDocumentName("");
      setMessage("");
      setResults(null);
      setKeyword("");
      await loadClaims();
    } catch (e) {
      alertMessage("신청 실패", errorText(e, "소유권 신청 중 오류가 발생했습니다."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.intro}>
        앱에 이미 등록된 공공데이터 시설을 운영 중이시라면 소유권을 신청해 주세요. 관리자가 서류를 확인해 승인하면 시설 정보를
        직접 관리하고 상담·예약 신청을 받을 수 있습니다.
      </Text>

      <Text style={styles.sectionTitle}>내 시설 찾기</Text>
      <View style={styles.searchRow}>
        <TextInput
          style={[styles.input, styles.searchInput]}
          value={keyword}
          onChangeText={setKeyword}
          onSubmitEditing={search}
          placeholder="시설명 또는 주소"
          returnKeyType="search"
          accessibilityLabel="시설 검색어"
        />
        <Pressable style={styles.searchButton} accessibilityRole="button" disabled={searching} onPress={search}>
          {searching ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryText}>검색</Text>}
        </Pressable>
      </View>

      {results?.length === 0 && <Text style={styles.helper}>신청할 수 있는 시설을 찾지 못했습니다.</Text>}
      {results?.map((facility) => (
        <Pressable
          key={facility.id}
          style={[styles.card, selected?.id === facility.id && styles.cardSelected]}
          accessibilityRole="button"
          accessibilityState={{ selected: selected?.id === facility.id, disabled: facility.myPending }}
          disabled={facility.myPending}
          onPress={() => setSelected(facility)}
        >
          <Text style={styles.category}>{getFacilityTypeName(facility.facilityType)}</Text>
          <Text style={styles.cardTitle}>{facility.name}</Text>
          <Text style={styles.cardText}>{facility.address}</Text>
          {facility.phone && <Text style={styles.cardText}>{facility.phone}</Text>}
          {facility.myPending && <Text style={styles.pending}>이미 신청하여 검토 중입니다.</Text>}
        </Pressable>
      ))}

      {selected && (
        <View style={styles.form}>
          <Text style={styles.sectionTitle}>소유권 신청</Text>
          <Text style={styles.cardText}>{selected.name}</Text>

          <Text style={styles.label}>운영 기관</Text>
          {organizations.length === 0 && <Text style={styles.helper}>등록된 운영 기관이 없습니다.</Text>}
          <View style={styles.chips}>
            {organizations.map((organization) => (
              <Pressable
                key={organization.id}
                style={[styles.chip, organizationId === organization.id && styles.chipSelected]}
                accessibilityRole="button"
                accessibilityState={{ selected: organizationId === organization.id }}
                onPress={() => setOrganizationId(organization.id)}
              >
                <Text style={[styles.chipText, organizationId === organization.id && styles.chipTextSelected]}>
                  {organization.name}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>증빙 서류 (필수)</Text>
          <Text style={styles.helper}>
            사업자등록증과 시설 운영을 확인할 수 있는 서류를 첨부해 주세요. JPG, PNG, PDF · 20MB 이하. 서류는 관리자만 볼 수 있으며
            검토가 끝나면 삭제됩니다.
          </Text>
          <View style={styles.buttonRow}>
            <Pressable style={styles.outline} accessibilityRole="button" onPress={() => attach(pickDocumentPhoto)}>
              <Text style={styles.outlineText}>사진 선택</Text>
            </Pressable>
            <Pressable style={styles.outline} accessibilityRole="button" onPress={() => attach(pickPdf)}>
              <Text style={styles.outlineText}>PDF 선택</Text>
            </Pressable>
          </View>
          {!!documentName && <Text style={styles.attached}>첨부됨: {documentName}</Text>}

          <Text style={styles.label}>요청 내용 (선택)</Text>
          <TextInput
            style={[styles.input, styles.messageInput]}
            value={message}
            onChangeText={setMessage}
            maxLength={500}
            multiline
            accessibilityLabel="요청 내용"
          />

          <Pressable style={styles.primary} accessibilityRole="button" disabled={submitting} onPress={submit}>
            {submitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryText}>소유권 신청하기</Text>}
          </Pressable>
        </View>
      )}

      <Text style={styles.sectionTitle}>내 신청 내역</Text>
      {claims.length === 0 && <Text style={styles.helper}>신청 내역이 없습니다.</Text>}
      {claims.map((claim) => (
        <View key={claim.id} style={styles.card}>
          <View style={styles.claimHeader}>
            <Text style={styles.cardTitle}>{claim.facilityName}</Text>
            <Text style={[styles.status, claim.status === "REJECTED" && styles.statusRejected]}>
              {STATUS_LABELS[claim.status]}
            </Text>
          </View>
          <Text style={styles.cardText}>운영 기관: {claim.organizationName}</Text>
          <Text style={styles.cardText}>신청일: {claim.createdAt}</Text>
          {claim.rejectReason && <Text style={styles.rejected}>거절 사유: {claim.rejectReason}</Text>}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F8FA" },
  content: { padding: 20, paddingBottom: 40 },
  intro: { fontSize: 13, color: "#555", lineHeight: 20, marginBottom: 8 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#26352D", marginTop: 18, marginBottom: 10 },
  searchRow: { flexDirection: "row", gap: 8 },
  searchInput: { flex: 1 },
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
  messageInput: { minHeight: 80, textAlignVertical: "top" },
  searchButton: { backgroundColor: "#39765B", borderRadius: 10, paddingHorizontal: 20, justifyContent: "center" },
  helper: { fontSize: 12, color: "#777", lineHeight: 18, marginTop: 6 },
  card: { backgroundColor: "#FFFFFF", borderRadius: 12, borderWidth: 1, borderColor: "#E8E8E8", padding: 14, marginTop: 10 },
  cardSelected: { borderColor: "#39765B", borderWidth: 2 },
  category: { fontSize: 12, color: "#39765B", fontWeight: "600", marginBottom: 4 },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: "700", color: "#26352D", marginBottom: 4 },
  cardText: { fontSize: 13, color: "#555", lineHeight: 20 },
  pending: { fontSize: 12, color: "#8A6D1D", marginTop: 6 },
  form: { marginTop: 6 },
  label: { fontSize: 14, fontWeight: "600", color: "#333", marginTop: 14, marginBottom: 6 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderWidth: 1, borderColor: "#DDE2DE", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, backgroundColor: "#FFFFFF" },
  chipSelected: { backgroundColor: "#39765B", borderColor: "#39765B" },
  chipText: { fontSize: 13, color: "#555" },
  chipTextSelected: { color: "#FFFFFF", fontWeight: "700" },
  buttonRow: { flexDirection: "row", gap: 10, marginTop: 10 },
  outline: { flex: 1, borderWidth: 1.5, borderColor: "#39765B", borderRadius: 10, paddingVertical: 12, alignItems: "center", backgroundColor: "#FFFFFF" },
  outlineText: { color: "#39765B", fontSize: 15, fontWeight: "700" },
  attached: { fontSize: 13, color: "#267347", marginTop: 8 },
  primary: { backgroundColor: "#39765B", borderRadius: 12, paddingVertical: 15, alignItems: "center", marginTop: 16 },
  primaryText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  claimHeader: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  status: { fontSize: 13, fontWeight: "700", color: "#267347" },
  statusRejected: { color: "#C62828" },
  rejected: { fontSize: 13, color: "#C62828", marginTop: 6, lineHeight: 20 },
});
