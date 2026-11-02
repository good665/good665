import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { getFacilityTypeName, resolveImageUrl } from "@/config/api";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";

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
  photos: string[] | null;
  publicData?: boolean; // 공공데이터로 들여온 시설 — 받을 운영자가 없어 전화 문의만 가능
};

function formatPrice(price: number | null | undefined) {
  if (price == null) {
    return "정보 없음";
  }

  return `${price.toLocaleString("ko-KR")}원`;
}

export default function FacilityDetailScreen() {
  const router = useRouter();
  const { user } = useAuth();
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

        const found = await apiFetch<Facility>(`/api/facilities/${facilityId}`);

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

    // 상담 신청은 로그인 필요
    if (!user) {
      router.push("/login");
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

  function goToReservation() {
    if (!facility) {
      return;
    }

    // 방문 예약도 로그인 필요
    if (!user) {
      router.push("/login");
      return;
    }

    router.push({
      pathname: "/reservations/new",
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

        {facility.photos && facility.photos.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.gallery}
            contentContainerStyle={styles.galleryContent}
          >
            {facility.photos.map((photo, index) => (
              <Image
                key={`${photo}-${index}`}
                source={{ uri: resolveImageUrl(photo) }}
                style={styles.galleryImage}
                resizeMode="cover"
              />
            ))}
          </ScrollView>
        )}

        <View style={styles.hero}>
          <Text style={styles.category}>{getFacilityTypeName(facility.facilityType)}</Text>

          <Text style={styles.title}>{facility.name}</Text>

          <Text style={styles.organization}>
            {facility.publicData ? "정보 출처" : "운영 기관"}: {facility.organizationName}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>시설 정보</Text>

          <InfoRow label="주소" value={facility.address} />
          <InfoRow label="전화번호" value={facility.phone} />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>월 이용 비용</Text>

          {facility.publicData ? (
            <Text style={styles.price}>시설에 문의</Text>
          ) : (
            <>
              <Text style={styles.price}>
                {formatPrice(facility.monthlyFeeMin)}
                {" ~ "}
                {formatPrice(facility.monthlyFeeMax)}
              </Text>

              <Text style={styles.notice}>
                실제 비용은 입주 조건과 서비스에 따라 달라질 수 있습니다.
              </Text>
            </>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>시설 소개</Text>

          <Text style={styles.bodyText}>
            {/* 공공데이터 소개의 첫 줄은 상단 "정보 출처"와 같은 내용이라 생략 */}
            {(facility.publicData
              ? facility.introduction?.replace(/^정보 출처:.*\n/, "")
              : facility.introduction) || "등록된 시설 소개가 없습니다."}
          </Text>
        </View>

        {!facility.publicData && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>입주 조건</Text>

            <Text style={styles.bodyText}>
              {facility.admissionConditions || "등록된 입주 조건이 없습니다."}
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.bottomBar}>
        {facility.publicData ? (
          facility.phone ? (
            <Pressable
              style={styles.consultButton}
              accessibilityRole="button"
              onPress={() => Linking.openURL(`tel:${facility.phone}`)}
            >
              <Text style={styles.consultButtonText}>전화 걸기</Text>
            </Pressable>
          ) : (
            <Text style={styles.noPhoneText}>등록된 전화번호가 없습니다.</Text>
          )
        ) : (
          <>
            <Pressable
              style={[styles.consultButton, styles.reserveButton]}
              onPress={goToReservation}
            >
              <Text style={styles.reserveButtonText}>방문 예약하기</Text>
            </Pressable>

            <Pressable style={styles.consultButton} onPress={goToConsultation}>
              <Text style={styles.consultButtonText}>상담 신청하기</Text>
            </Pressable>
          </>
        )}
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
  gallery: {
    marginBottom: 18,
  },
  galleryContent: {
    gap: 10,
  },
  galleryImage: {
    width: 220,
    height: 150,
    borderRadius: 14,
    backgroundColor: "#E8ECE7",
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
    flexDirection: "row",
    gap: 10,
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  noPhoneText: {
    flex: 1,
    textAlign: "center",
    fontSize: 15,
    color: "#777",
    paddingVertical: 16,
  },
  consultButton: {
    flex: 1,
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
  reserveButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#39765B",
  },
  reserveButtonText: {
    color: "#39765B",
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
