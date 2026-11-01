import * as ImagePicker from "expo-image-picker";
import * as WebBrowser from "expo-web-browser";
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

import { API_BASE_URL, FACILITY_TYPE_LABELS, parseFee, resolveImageUrl } from "@/config/api";
import { apiFetch, apiUpload, imageFormData } from "@/lib/api";

const facilityTypes = Object.entries(FACILITY_TYPE_LABELS);

type MyFacilityDetail = {
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
};

type FacilityImage = {
  id: number;
  facilityId: number;
  imageUrl: string;
  sortOrder: number;
};

type SubscriptionStatus = {
  active: boolean; // 지금 상단 노출 중인지
  autoRenew: boolean; // 기간이 끝나면 자동으로 다음 달 결제되는지
  premiumUntil: string | null; // 노출 마지막 날 (다음날 내려감)
  monthlyPrice: number;
  cardRequired: boolean; // 실제 PG(토스) 모드면 결제 전에 카드 등록 필요
  cardRegistered: boolean;
  cardSummary: string | null; // 마스킹된 카드 번호
};

type SubscriptionPayment = {
  id: number;
  amount: number;
  status: string;
  pgProvider: string;
  paidAt: string;
  coveredUntil: string | null;
};

function formatWon(value: number) {
  return `${value.toLocaleString("ko-KR")}원`;
}

const statusBadge: Record<string, { label: string; bg: string; fg: string }> = {
  PENDING: { label: "승인 대기", bg: "#FFF3CD", fg: "#8A6D1D" },
  ACTIVE: { label: "운영 중", bg: "#E5F3EA", fg: "#267347" },
  INACTIVE: { label: "비활성화", bg: "#F3E5E5", fg: "#A63B3B" },
};

function alertMessage(title: string, message: string) {
  if (Platform.OS === "web") {
    window.alert(message);
  } else {
    Alert.alert(title, message);
  }
}

function confirmAction(title: string, message: string, okLabel: string, onOk: () => void) {
  if (Platform.OS === "web") {
    if (window.confirm(message)) onOk();
    return;
  }

  Alert.alert(title, message, [
    { text: "취소", style: "cancel" },
    { text: okLabel, onPress: onOk },
  ]);
}

export default function EditMyFacilityScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const facilityId = Number(id);

  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("PENDING");
  const [facilityType, setFacilityType] = useState("SILVER_TOWN");
  const [organizationId, setOrganizationId] = useState<number | null>(null);
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

  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [payments, setPayments] = useState<SubscriptionPayment[]>([]);
  const [subscriptionBusy, setSubscriptionBusy] = useState(false);
  // 카드 등록 창을 연 뒤 — 브라우저에서 돌아오면 사용자가 새로고침을 눌러 결과를 확인
  const [cardPending, setCardPending] = useState(false);

  const loadFacility = useCallback(async () => {
    try {
      const data = await apiFetch<MyFacilityDetail>(`/api/business/facilities/${facilityId}`);

      setStatus(data.status);
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

  const loadPhotos = useCallback(async () => {
    try {
      setPhotosLoading(true);
      const data = await apiFetch<FacilityImage[]>(
        `/api/business/facilities/${facilityId}/photos`,
      );
      setPhotos(data);
    } catch (e) {
      console.error("사진 목록 조회 오류:", e);
    } finally {
      setPhotosLoading(false);
    }
  }, [facilityId]);

  const loadSubscription = useCallback(async () => {
    try {
      const [status, history] = await Promise.all([
        apiFetch<SubscriptionStatus>(`/api/business/facilities/${facilityId}/subscription`),
        apiFetch<SubscriptionPayment[]>(
          `/api/business/facilities/${facilityId}/subscription/payments`,
        ),
      ]);
      setSubscription(status);
      setPayments(history);
    } catch (e) {
      console.error("상단 노출 구독 조회 오류:", e);
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
      loadPhotos();
      loadSubscription();
    }, [facilityId, loadFacility, loadPhotos, loadSubscription, router]),
  );

  async function save() {
    if (!organizationId) {
      alertMessage("오류", "운영 기관 정보를 불러오지 못했습니다.");
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
      await apiFetch(`/api/business/facilities/${facilityId}`, {
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
      await apiUpload(`/api/business/facilities/${facilityId}/photos`, formData);
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
      await apiFetch(`/api/business/facilities/${facilityId}/photos/${photoId}`, {
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

  async function changeSubscription(method: "POST" | "DELETE", doneMessage: string) {
    setSubscriptionBusy(true);

    try {
      const updated = await apiFetch<SubscriptionStatus>(
        `/api/business/facilities/${facilityId}/subscription`,
        { method },
      );
      setSubscription(updated);
      await loadSubscription();
      alertMessage("완료", doneMessage);
    } catch (e) {
      const message = e instanceof Error ? e.message : "처리 중 오류가 발생했습니다.";
      alertMessage("처리 실패", message);
    } finally {
      setSubscriptionBusy(false);
    }
  }

  async function startCardRegistration() {
    setSubscriptionBusy(true);

    try {
      const { registerUrl } = await apiFetch<{ registerUrl: string }>(
        `/api/business/facilities/${facilityId}/subscription/card-registration`,
        { method: "POST" },
      );
      setCardPending(true);
      await WebBrowser.openBrowserAsync(API_BASE_URL + registerUrl);
    } catch (e) {
      const message = e instanceof Error ? e.message : "카드 등록을 시작하지 못했습니다.";
      alertMessage("카드 등록 실패", message);
    } finally {
      setSubscriptionBusy(false);
    }
  }

  async function finishCardRegistration() {
    setCardPending(false);
    await loadSubscription();
  }

  function confirmSubscribe() {
    const price = formatWon(subscription?.monthlyPrice ?? 0);
    confirmAction(
      "상단 노출 결제",
      `월 ${price}이 결제되고, 매월 같은 금액이 자동으로 결제됩니다. 진행하시겠습니까?`,
      "결제하기",
      () => changeSubscription("POST", "결제가 완료되었습니다. 지금부터 검색 결과 상단에 노출됩니다."),
    );
  }

  function confirmCancelAutoRenew() {
    confirmAction(
      "자동 연장 해지",
      `${subscription?.premiumUntil}까지는 계속 노출되고, 다음날부터 검색 상단에서 내려갑니다. 해지하시겠습니까?`,
      "해지하기",
      () => changeSubscription("DELETE", "자동 연장이 해지되었습니다."),
    );
  }

  function renderSubscription() {
    if (status !== "ACTIVE") {
      return <Text style={styles.helper}>관리자 승인 후 신청할 수 있습니다.</Text>;
    }

    if (!subscription) {
      return <ActivityIndicator color="#39765B" />;
    }

    const price = formatWon(subscription.monthlyPrice);

    // 실제 PG 모드에서 카드가 없으면 결제·자동 연장 대신 카드 등록부터
    if (subscription.cardRequired && !subscription.cardRegistered) {
      return (
        <>
          <Text style={styles.subscriptionText}>
            {subscription.active
              ? `${subscription.premiumUntil}까지 노출 중입니다. 자동 연장하려면`
              : `월 ${price}으로 검색 결과 맨 위에 '광고' 표시와 함께 노출됩니다. 결제하려면`}{" "}
            먼저 매월 자동 결제할 카드를 등록해 주세요. (토스페이먼츠)
          </Text>
          <Pressable
            style={[styles.subscribeButton, subscriptionBusy && styles.disabledButton]}
            onPress={startCardRegistration}
            disabled={subscriptionBusy}
          >
            {subscriptionBusy ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>결제 카드 등록</Text>
            )}
          </Pressable>
          {cardPending && (
            <Pressable style={styles.secondaryButton} onPress={finishCardRegistration}>
              <Text style={styles.secondaryButtonText}>카드 등록을 마쳤어요 · 새로고침</Text>
            </Pressable>
          )}
        </>
      );
    }

    let description: string;
    let buttonLabel: string;
    let onPress: () => void;
    let outline = false;

    if (subscription.active && subscription.autoRenew) {
      description = `${subscription.premiumUntil}까지 노출 중입니다. 그날 밤 다음 달 이용료 ${price}이 자동 결제됩니다.`;
      buttonLabel = "자동 연장 해지";
      onPress = confirmCancelAutoRenew;
      outline = true;
    } else if (subscription.active) {
      description = `자동 연장이 해지되었습니다. ${subscription.premiumUntil}까지 노출되고 다음날 상단에서 내려갑니다.`;
      buttonLabel = "자동 연장 다시 켜기 (추가 결제 없음)";
      onPress = () => changeSubscription("POST", "자동 연장이 다시 켜졌습니다.");
    } else {
      description = `월 ${price}으로 검색 결과 맨 위에 '광고' 표시와 함께 노출됩니다. 매월 자동 결제되며 언제든 해지할 수 있습니다.`;
      buttonLabel = `월 ${price} 결제하기`;
      onPress = confirmSubscribe;
    }

    return (
      <>
        {subscription.active && (
          <View style={[styles.statusBadge, styles.premiumBadge]}>
            <Text style={[styles.statusText, styles.premiumBadgeText]}>상단 노출 중</Text>
          </View>
        )}
        <Text style={styles.subscriptionText}>{description}</Text>

        <Pressable
          style={[
            outline ? styles.outlineButton : styles.subscribeButton,
            subscriptionBusy && styles.disabledButton,
          ]}
          onPress={onPress}
          disabled={subscriptionBusy}
        >
          {subscriptionBusy ? (
            <ActivityIndicator color={outline ? "#C62828" : "#FFFFFF"} />
          ) : (
            <Text style={outline ? styles.outlineButtonText : styles.submitButtonText}>
              {buttonLabel}
            </Text>
          )}
        </Pressable>

        {subscription.cardRequired ? (
          <View style={styles.cardRow}>
            <Text style={styles.helper}>결제 카드: {subscription.cardSummary ?? "등록됨"}</Text>
            <Pressable onPress={startCardRegistration} disabled={subscriptionBusy}>
              <Text style={styles.cardChangeText}>카드 변경</Text>
            </Pressable>
          </View>
        ) : (
          <Text style={styles.helper}>현재는 모의 결제로 처리되어 실제 금액은 청구되지 않습니다.</Text>
        )}
        {cardPending && (
          <Pressable style={styles.secondaryButton} onPress={finishCardRegistration}>
            <Text style={styles.secondaryButtonText}>카드 변경을 마쳤어요 · 새로고침</Text>
          </Pressable>
        )}

        {payments.length > 0 && (
          <View style={styles.paymentList}>
            <Text style={styles.paymentTitle}>결제 내역</Text>
            {payments.map((payment) => (
              <Text key={payment.id} style={styles.paymentRow}>
                {payment.paidAt} · {formatWon(payment.amount)} ·{" "}
                {payment.status === "PAID" ? "결제 완료" : "결제 실패"}
                {payment.coveredUntil ? ` (~${payment.coveredUntil})` : ""}
              </Text>
            ))}
          </View>
        )}
      </>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#39765B" />
      </View>
    );
  }

  const badge = statusBadge[status] ?? statusBadge.PENDING;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
        <Text style={[styles.statusText, { color: badge.fg }]}>{badge.label}</Text>
      </View>

      {status === "PENDING" && (
        <Text style={styles.notice}>
          관리자 승인 전에는 검색 결과에 노출되지 않습니다. 정보를 수정해도 승인 상태는 유지됩니다.
        </Text>
      )}

      <Text style={styles.sectionTitle}>검색 상단 노출 (광고)</Text>
      <View style={styles.subscriptionCard}>{renderSubscription()}</View>

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
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "700",
  },
  notice: {
    fontSize: 13,
    color: "#8A6D1D",
    backgroundColor: "#FFF3CD",
    padding: 12,
    borderRadius: 10,
    lineHeight: 19,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#26352D",
    marginTop: 8,
    marginBottom: 12,
  },
  subscriptionCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDE2DE",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  premiumBadge: {
    backgroundColor: "#E5F3EA",
    marginBottom: 8,
  },
  premiumBadgeText: {
    color: "#267347",
  },
  subscriptionText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  subscribeButton: {
    backgroundColor: "#39765B",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 14,
  },
  outlineButton: {
    borderWidth: 1,
    borderColor: "#D9534F",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 14,
  },
  outlineButtonText: {
    color: "#C62828",
    fontSize: 15,
    fontWeight: "700",
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#39765B",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  secondaryButtonText: {
    color: "#39765B",
    fontSize: 14,
    fontWeight: "700",
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardChangeText: {
    color: "#39765B",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 6,
  },
  paymentList: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#EEF0EE",
    paddingTop: 10,
  },
  paymentTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#555",
    marginBottom: 6,
  },
  paymentRow: {
    fontSize: 12,
    color: "#666",
    lineHeight: 20,
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
