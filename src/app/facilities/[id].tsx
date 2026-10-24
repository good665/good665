import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { API_BASE_URL, getFacilityTypeName } from "@/config/api";

const API_URL = `${API_BASE_URL}/api/facilities`;

type Facility = {
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
};

function formatPrice(price: number | null | undefined) {
  if (price == null) {
    return "정보 없음";
  }

  return `${price.toLocaleString("ko-KR")}원`;
}

export default function FacilityDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [facility, setFacility] = useState<Facility | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function fetchFacility() {
      if (!id || Array.isArray(id)) {
        setError("시설 정보가 올바르지 않습니다.");
        setLoading(false);
        return;
      }

      const facilityId = Number(id);

      if (!Number.isInteger(facilityId) || facilityId <= 0) {
        setError("시설 번호가 올바르지 않습니다.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_URL}/${facilityId}`);

        if (response.status === 404) {
          throw new Error("해당 시설을 찾을 수 없습니다.");
        }

        if (!response.ok) {
          throw new Error("시설 정보를 불러오지 못했습니다.");
        }

        const found: Facility = await response.json();

        if (active) {
          setFacility(found);
        }
      } catch (e) {
        if (active) {
          setError(
            e instanceof Error
              ? e.message
              : "시설 정보를 불러오는 중 오류가 발생했습니다.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    fetchFacility();

    return () => {
      active = false;
    };
  }, [id]);

  function goToConsultation() {
    if (!facility) {
      return;
    }

    router.push({
      pathname: "/consultations/new",
      params: {
        facilityId: String(facility.id),
        facilityName: facility.name,
      },
    });
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>시설 정보를 불러오는 중...</Text>
      </View>
    );
  }

  if (error || !facility) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>
          {error || "시설 정보를 찾을 수 없습니다."}
        </Text>

        <Pressable style={styles.secondaryButton} onPress={() => router.back()}>
          <Text style={styles.secondaryButtonText}>이전 화면</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backText}>‹ 목록으로 돌아가기</Text>
        </Pressable>

        <View style={styles.hero}>
          <Text style={styles.category}>
            {getFacilityTypeName(facility.facilityType)}
          </Text>

          <Text style={styles.title}>{facility.name}</Text>

          <Text style={styles.organization}>
            운영 기관: {facility.organizationName}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>시설 정보</Text>

          <InfoRow label="주소" value={facility.address} />
          <InfoRow label="전화번호" value={facility.phone} />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>월 이용 비용</Text>

          <Text style={styles.price}>
            {formatPrice(facility.monthlyFeeMin)}
            {" ~ "}
            {formatPrice(facility.monthlyFeeMax)}
          </Text>

          <Text style={styles.notice}>
            실제 비용은 입주 조건과 서비스에 따라 달라질 수 있습니다.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>시설 소개</Text>

          <Text style={styles.bodyText}>
            {facility.introduction || "등록된 시설 소개가 없습니다."}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>입주 조건</Text>

          <Text style={styles.bodyText}>
            {facility.admissionConditions || "등록된 입주 조건이 없습니다."}
          </Text>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <Pressable style={styles.consultButton} onPress={goToConsultation}>
          <Text style={styles.consultButtonText}>이 시설 상담 신청하기</Text>
        </Pressable>
      </View>
    </View>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || "정보 없음"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F8FA",
  },
  content: {
    padding: 20,
    paddingBottom: 30,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#F7F8FA",
  },
  loadingText: {
    marginTop: 12,
    color: "#555",
  },
  errorText: {
    color: "#C62828",
    textAlign: "center",
    marginBottom: 16,
  },
  backText: {
    fontSize: 15,
    color: "#39765B",
    marginBottom: 20,
  },
  hero: {
    backgroundColor: "#E7F2EB",
    padding: 24,
    borderRadius: 18,
    marginBottom: 18,
  },
  category: {
    fontSize: 13,
    color: "#39765B",
    marginBottom: 10,
    fontWeight: "600",
  },
  title: {
    fontSize: 25,
    fontWeight: "700",
    color: "#20352A",
    lineHeight: 34,
  },
  organization: {
    fontSize: 14,
    color: "#52645A",
    marginTop: 12,
  },
  card: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#26352D",
    marginBottom: 16,
  },
  infoRow: {
    marginBottom: 14,
  },
  infoLabel: {
    fontSize: 13,
    color: "#777",
    marginBottom: 5,
  },
  infoValue: {
    fontSize: 15,
    color: "#26352D",
    lineHeight: 23,
  },
  price: {
    fontSize: 19,
    fontWeight: "700",
    color: "#39765B",
    lineHeight: 29,
  },
  notice: {
    fontSize: 12,
    color: "#777",
    marginTop: 10,
    lineHeight: 18,
  },
  bodyText: {
    fontSize: 15,
    lineHeight: 25,
    color: "#444",
  },
  bottomBar: {
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  consultButton: {
    backgroundColor: "#39765B",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  consultButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    backgroundColor: "#39765B",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  secondaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
