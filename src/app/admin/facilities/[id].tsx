import * as ImagePicker from "expo-image-picker";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { FACILITY_TYPE_LABELS, parseFee, resolveImageUrl } from "@/config/api";
import { apiFetch, apiUpload, imageFormData } from "@/lib/api";

const facilityTypes = Object.entries(FACILITY_TYPE_LABELS);

const statusBadge: Record<string, { label: string; bg: string; fg: string }> = {
  PENDING: { label: "승인 대기", bg: "#FFF3CD", fg: "#8A6D1D" },
  ACTIVE: { label: "운영 중", bg: "#E5F3EA", fg: "#267347" },
  INACTIVE: { label: "비활성화", bg: "#F3E5E5", fg: "#A63B3B" },
};

// 운영 기관의 국세청 사업자 진위확인 상태 (기록이 없으면 null — 진위확인 도입 전 가입/관리자 등록 기관)
const verificationLabels: Record<string, { label: string; color: string }> = {
  VERIFIED: { label: "사업자 확인 완료", color: "#267347" },
  UNAVAILABLE: { label: "사업자 미확인 (국세청 응답 없음)", color: "#8A6D1D" },
  MISMATCH: { label: "사업자 정보 불일치", color: "#A63B3B" },
  CLOSED: { label: "휴업/폐업 사업자", color: "#A63B3B" },
};

type AdminFacilityDetail = {
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
  businessVerificationStatus: string | null;
};

type FacilityImage = {
  id: number;
  facilityId: number;
  imageUrl: string;
  sortOrder: number;
};

type Organization = {
  id: number;
  name: string;
  organizationType: string;
};

function alertMessage(title: string, message: string) {
  if (Platform.OS === "web") {
    window.alert(message);
  } else {
    Alert.alert(title, message);
  }
}

export default function EditFacilityScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const facilityId = Number(id);

  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("ACTIVE");
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [organizationsLoading, setOrganizationsLoading] = useState(true);
  const [organizationId, setOrganizationId] = useState<number | null>(null);
  const [facilityType, setFacilityType] = useState("SILVER_TOWN");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [monthlyFeeMin, setMonthlyFeeMin] = useState("");
  const [monthlyFeeMax, setMonthlyFeeMax] = useState("");
  const [introduction, setIntroduction] = useState("");
  const [admissionConditions, setAdmissionConditions] = useState("");
  const [saving, setSaving] = useState(false);

  const [photos, setPhotos] = useState<FacilityImage[]>([]);
  const [photosLoading, setPhotosLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const loadFacility = useCallback(async () => {
    try {
      const data = await apiFetch<AdminFacilityDetail>(
        `/api/admin/facilities/${facilityId}`,
      );

      setStatus(data.status);
      setVerificationStatus(data.businessVerificationStatus);
      setOrganizationId(data.organizationId);
      setFacilityType(data.facilityType);
      setName(data.name);
      setAddress(data.address);
      setPhone(data.phone);
      setMonthlyFeeMin(data.monthlyFeeMin != null ? String(data.monthlyFeeMin) : "");
      setMonthlyFeeMax(data.monthlyFeeMax != null ? String(data.monthlyFeeMax) : "");
      setIntroduction(data.introduction ?? "");
      setAdmissionConditions(data.admissionConditions ?? "");
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "시설 정보를 불러오지 못했습니다.";
      alertMessage("오류", message);
      router.back();
    } finally {
      setLoading(false);
    }
  }, [facilityId, router]);

  const loadOrganizations = useCallback(async () => {
    try {
      setOrganizationsLoading(true);
      const data = await apiFetch<Organization[]>("/api/admin/organizations");
      setOrganizations(data);
    } catch (e) {
      console.error("운영 기관 목록 조회 오류:", e);
    } finally {
      setOrganizationsLoading(false);
    }
  }, []);

  const loadPhotos = useCallback(async () => {
    try {
      setPhotosLoading(true);
      const data = await apiFetch<FacilityImage[]>(
        `/api/admin/facilities/${facilityId}/photos`,
      );
      setPhotos(data);
    } catch (e) {
      // 사진 목록 조회 실패는 폼 자체를 막지 않음
      console.error("사진 목록 조회 오류:", e);
    } finally {
      setPhotosLoading(false);
    }
  }, [facilityId]);

  // 폼은 시설마다 처음 한 번만 불러옴 — 포커스마다 다시 불러오면 저장 안 한 수정 내용이 서버 값으로 덮어써짐
  const loadedFacilityId = useRef<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!Number.isInteger(facilityId) || facilityId <= 0) {
        alertMessage("오류", "시설 번호가 올바르지 않습니다.");
        router.back();
        return;
      }

      if (loadedFacilityId.current !== facilityId) {
        loadedFacilityId.current = facilityId;
        loadFacility();
      }
      loadOrganizations();
      loadPhotos();
    }, [facilityId, loadFacility, loadOrganizations, loadPhotos, router]),
  );

  async function save() {
    if (!organizationId) {
      alertMessage("입력 확인", "운영 기관을 선택해 주세요.");
      return;
    }

    if (!name.trim() || !address.trim() || !phone.trim()) {
      alertMessage("입력 확인", "시설명, 주소, 전화번호는 필수입니다.");
      return;
    }

    const feeMin = parseFee(monthlyFeeMin);
    const feeMax = parseFee(monthlyFeeMax);

    if (Number.isNaN(feeMin) || Number.isNaN(feeMax)) {
      alertMessage("입력 확인", "월 이용료는 숫자만 입력해 주세요. (예: 1500000)");
      return;
    }

    if (feeMin != null && feeMax != null && feeMin > feeMax) {
      alertMessage("입력 확인", "최소 월 이용료가 최대 월 이용료보다 클 수 없습니다.");
      return;
    }

    setSaving(true);

    try {
      await apiFetch(`/api/admin/facilities/${facilityId}`, {
        method: "PUT",
        body: JSON.stringify({
          organizationId,
          facilityType,
          name: name.trim(),
          address: address.trim(),
          phone: phone.trim(),
          monthlyFeeMin: feeMin,
          monthlyFeeMax: feeMax,
          introduction: introduction.trim(),
          admissionConditions: admissionConditions.trim(),
        }),
      });

      alertMessage("완료", "시설 정보가 수정되었습니다.");
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "시설 수정 중 오류가 발생했습니다.";
      alertMessage("수정 실패", message);
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(nextActive: boolean) {
    const path = nextActive
      ? `/api/admin/facilities/${facilityId}/activate`
      : `/api/admin/facilities/${facilityId}`;

    try {
      await apiFetch(path, { method: nextActive ? "PUT" : "DELETE" });
      setStatus(nextActive ? "ACTIVE" : "INACTIVE");
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "상태 변경 중 오류가 발생했습니다.";
      alertMessage("실패", message);
    }
  }

  async function reverifyBusiness() {
    if (!organizationId) return;
    setVerifying(true);

    try {
      const result = await apiFetch<{ status: string; message: string }>(
        `/api/admin/organizations/${organizationId}/business-verification`,
        { method: "POST" },
      );
      setVerificationStatus(result.status);
      alertMessage("국세청 확인 결과", result.message);
    } catch (e) {
      const message = e instanceof Error ? e.message : "사업자 확인 중 오류가 발생했습니다.";
      alertMessage("확인 실패", message);
    } finally {
      setVerifying(false);
    }
  }

  async function pickAndUploadPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      alertMessage("권한 필요", "사진을 등록하려면 사진 보관함 접근 권한이 필요합니다.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return;
    }

    const formData = imageFormData(result.assets[0]);

    setUploading(true);

    try {
      await apiUpload(`/api/admin/facilities/${facilityId}/photos`, formData);
      await loadPhotos();
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "사진 업로드 중 오류가 발생했습니다.";
      alertMessage("업로드 실패", message);
    } finally {
      setUploading(false);
    }
  }

  async function deletePhoto(photoId: number) {
    try {
      await apiFetch(`/api/admin/facilities/${facilityId}/photos/${photoId}`, {
        method: "DELETE",
      });
      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "사진 삭제 중 오류가 발생했습니다.";
      alertMessage("삭제 실패", message);
    }
  }

  function confirmDeletePhoto(photoId: number) {
    if (Platform.OS === "web") {
      if (window.confirm("이 사진을 삭제하시겠습니까?")) deletePhoto(photoId);
      return;
    }

    Alert.alert("사진 삭제", "이 사진을 삭제하시겠습니까?", [
      { text: "취소", style: "cancel" },
      { text: "삭제", style: "destructive", onPress: () => deletePhoto(photoId) },
    ]);
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#39765B" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.statusRow}>
        <View style={[styles.statusBadge, { backgroundColor: statusBadge[status]?.bg }]}>
          <Text style={[styles.statusText, { color: statusBadge[status]?.fg }]}>
            {statusBadge[status]?.label ?? status}
          </Text>
        </View>

        {status === "PENDING" ? (
          <View style={styles.actionRow}>
            <Pressable style={styles.toggleButton} onPress={() => changeStatus(true)}>
              <Text style={styles.toggleButtonText}>승인하기</Text>
            </Pressable>
            <Pressable
              style={[styles.toggleButton, styles.toggleButtonDanger]}
              onPress={() => changeStatus(false)}
            >
              <Text style={[styles.toggleButtonText, styles.toggleButtonTextDanger]}>거절</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            style={[styles.toggleButton, status === "ACTIVE" && styles.toggleButtonDanger]}
            onPress={() => changeStatus(status !== "ACTIVE")}
          >
            <Text
              style={[
                styles.toggleButtonText,
                status === "ACTIVE" && styles.toggleButtonTextDanger,
              ]}
            >
              {status === "ACTIVE" ? "비활성화" : "다시 활성화"}
            </Text>
          </Pressable>
        )}
      </View>

      <View style={styles.verifyRow}>
        <Text
          style={[
            styles.verifyText,
            { color: verificationStatus ? verificationLabels[verificationStatus]?.color : "#777" },
          ]}
        >
          {verificationStatus
            ? (verificationLabels[verificationStatus]?.label ?? verificationStatus)
            : "사업자 확인 기록 없음"}
        </Text>
        {verificationStatus && verificationStatus !== "VERIFIED" && (
          <Pressable style={styles.toggleButton} onPress={reverifyBusiness} disabled={verifying}>
            {verifying ? (
              <ActivityIndicator color="#39765B" />
            ) : (
              <Text style={styles.toggleButtonText}>국세청 재확인</Text>
            )}
          </Pressable>
        )}
      </View>

      <Text style={styles.sectionTitle}>시설 사진</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoRow}>
        {photos.map((photo) => (
          <View key={photo.id} style={styles.photoWrap}>
            <Image source={{ uri: resolveImageUrl(photo.imageUrl) }} style={styles.photo} />
            <Pressable
              style={styles.photoDeleteButton}
              onPress={() => confirmDeletePhoto(photo.id)}
            >
              <Text style={styles.photoDeleteText}>삭제</Text>
            </Pressable>
          </View>
        ))}

        <Pressable
          style={styles.addPhotoButton}
          onPress={pickAndUploadPhoto}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator color="#39765B" />
          ) : (
            <Text style={styles.addPhotoText}>+ 사진 추가</Text>
          )}
        </Pressable>
      </ScrollView>

      {!photosLoading && photos.length === 0 && (
        <Text style={styles.helper}>등록된 사진이 없습니다.</Text>
      )}

      <Text style={styles.sectionTitle}>시설 정보</Text>

      <Text style={styles.label}>운영 기관</Text>
      {organizationsLoading ? (
        <ActivityIndicator color="#39765B" />
      ) : (
        <View style={styles.typeRow}>
          {organizations.map((org) => (
            <Pressable
              key={org.id}
              style={[
                styles.typeButton,
                organizationId === org.id && styles.typeButtonSelected,
              ]}
              onPress={() => setOrganizationId(org.id)}
            >
              <Text
                style={[
                  styles.typeText,
                  organizationId === org.id && styles.typeTextSelected,
                ]}
              >
                {org.name}
              </Text>
            </Pressable>
          ))}

          <Pressable
            style={[styles.typeButton, styles.addOrgButton]}
            onPress={() => router.push("/admin/organizations/new")}
          >
            <Text style={[styles.typeText, styles.addOrgText]}>+ 새 기관 등록</Text>
          </Pressable>
        </View>
      )}

      <Text style={styles.label}>시설 유형</Text>
      <View style={styles.typeRow}>
        {facilityTypes.map(([value, label]) => (
          <Pressable
            key={value}
            style={[styles.typeButton, facilityType === value && styles.typeButtonSelected]}
            onPress={() => setFacilityType(value)}
          >
            <Text
              style={[styles.typeText, facilityType === value && styles.typeTextSelected]}
            >
              {label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>시설명</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} />

      <Text style={styles.label}>주소</Text>
      <TextInput style={styles.input} value={address} onChangeText={setAddress} />

      <Text style={styles.label}>전화번호</Text>
      <TextInput
        style={styles.input}
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />

      <Text style={styles.label}>월 이용료 (최소)</Text>
      <TextInput
        style={styles.input}
        value={monthlyFeeMin}
        onChangeText={setMonthlyFeeMin}
        keyboardType="number-pad"
      />

      <Text style={styles.label}>월 이용료 (최대)</Text>
      <TextInput
        style={styles.input}
        value={monthlyFeeMax}
        onChangeText={setMonthlyFeeMax}
        keyboardType="number-pad"
      />

      <Text style={styles.label}>시설 소개</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        value={introduction}
        onChangeText={setIntroduction}
        multiline
        textAlignVertical="top"
      />

      <Text style={styles.label}>입주 조건</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        value={admissionConditions}
        onChangeText={setAdmissionConditions}
        multiline
        textAlignVertical="top"
      />

      <Pressable
        style={[styles.submitButton, saving && styles.disabledButton]}
        onPress={save}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.submitButtonText}>저장하기</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  verifyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  verifyText: {
    fontSize: 13,
    fontWeight: "700",
    flexShrink: 1,
    marginRight: 8,
  },
  container: {
    flex: 1,
    backgroundColor: "#F7F8FA",
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "#F7F8FA",
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "700",
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
  },
  toggleButton: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#39765B",
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#26352D",
    marginTop: 8,
    marginBottom: 12,
  },
  photoRow: {
    marginBottom: 8,
  },
  photoWrap: {
    marginRight: 10,
    alignItems: "center",
  },
  photo: {
    width: 120,
    height: 90,
    borderRadius: 10,
    backgroundColor: "#E8ECE7",
  },
  photoDeleteButton: {
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#D9534F",
  },
  photoDeleteText: {
    color: "#C62828",
    fontSize: 11,
    fontWeight: "700",
  },
  addPhotoButton: {
    width: 120,
    height: 90,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#39765B",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
  addPhotoText: {
    color: "#39765B",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
    marginTop: 16,
  },
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
  helper: {
    fontSize: 12,
    color: "#999",
    marginTop: 6,
  },
  multiline: {
    minHeight: 90,
    paddingTop: 12,
  },
  typeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  typeButton: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#DDE2DE",
    backgroundColor: "#FFFFFF",
  },
  typeButtonSelected: {
    backgroundColor: "#39765B",
    borderColor: "#39765B",
  },
  typeText: {
    fontSize: 13,
    color: "#555",
  },
  typeTextSelected: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  addOrgButton: {
    borderStyle: "dashed",
  },
  addOrgText: {
    color: "#39765B",
    fontWeight: "600",
  },
  submitButton: {
    backgroundColor: "#39765B",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 28,
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
