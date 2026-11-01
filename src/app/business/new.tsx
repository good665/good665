import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { FACILITY_TYPE_LABELS, parseFee } from "@/config/api";
import { alertMessage } from "@/lib/alert";
import { apiFetch } from "@/lib/api";

const facilityTypes = Object.entries(FACILITY_TYPE_LABELS);

type Organization = {
  id: number;
  name: string;
  organizationType: string;
};

export default function NewMyFacilityScreen() {
  const router = useRouter();

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
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadOrganizations() {
        try {
          setOrganizationsLoading(true);
          const data = await apiFetch<Organization[]>("/api/business/organizations");
          if (!active) return;
          setOrganizations(data);
          setOrganizationId((prev) => prev ?? data[0]?.id ?? null);
        } catch (e) {
          if (!active) return;
          const message =
            e instanceof Error ? e.message : "운영 기관 목록을 불러오지 못했습니다.";
          alertMessage("오류", message);
        } finally {
          if (active) setOrganizationsLoading(false);
        }
      }

      loadOrganizations();
      return () => {
        active = false;
      };
    }, []),
  );

  async function submit() {
    if (!organizationId) {
      alertMessage("입력 확인", "운영 기관 정보를 불러오지 못했습니다. 다시 시도해 주세요.");
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

    setLoading(true);

    try {
      await apiFetch("/api/business/facilities", {
        method: "POST",
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

      const message = "시설이 등록되었습니다. 관리자 승인 후 공개됩니다.";
      if (Platform.OS === "web") {
        window.alert(message);
      } else {
        alertMessage("등록 완료", message);
      }

      router.back();
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "시설 등록 중 오류가 발생했습니다.";

      if (Platform.OS === "web") {
        window.alert(message);
      } else {
        alertMessage("등록 실패", message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.notice}>
        등록한 시설은 관리자 승인 전까지 &quot;승인 대기&quot; 상태로, 앱 검색에는 노출되지 않습니다.
      </Text>

      <Text style={styles.label}>운영 기관</Text>
      {organizationsLoading ? (
        <ActivityIndicator color="#39765B" />
      ) : organizations.length === 0 ? (
        <Text style={styles.helper}>소속된 운영 기관이 없습니다.</Text>
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
        </View>
      )}

      <Text style={styles.label}>시설 유형</Text>
      <View style={styles.typeRow}>
        {facilityTypes.map(([value, label]) => (
          <Pressable
            key={value}
            style={[
              styles.typeButton,
              facilityType === value && styles.typeButtonSelected,
            ]}
            onPress={() => setFacilityType(value)}
          >
            <Text
              style={[
                styles.typeText,
                facilityType === value && styles.typeTextSelected,
              ]}
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
        placeholder="선택 입력"
      />

      <Text style={styles.label}>월 이용료 (최대)</Text>
      <TextInput
        style={styles.input}
        value={monthlyFeeMax}
        onChangeText={setMonthlyFeeMax}
        keyboardType="number-pad"
        placeholder="선택 입력"
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
        style={[styles.submitButton, loading && styles.disabledButton]}
        onPress={submit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.submitButtonText}>등록하기</Text>
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
  notice: {
    fontSize: 13,
    color: "#8A6D1D",
    backgroundColor: "#FFF3CD",
    padding: 12,
    borderRadius: 10,
    lineHeight: 19,
    marginBottom: 8,
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
