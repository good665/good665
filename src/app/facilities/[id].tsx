import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
const API_URL =
  Platform.OS === "web"
    ? "http://localhost:8080/api/facilities"
    : "http://10.0.2.2:8080/api/facilities";
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
  introduction: string;
  admissionConditions: string;
};

function formatMoney(value: number | null) {
  if (value == null) return "별도 문의";
  return `${(value / 10000).toLocaleString("ko-KR")}만 원`;
}

function getTypeName(type: string) {
  const names: Record<string, string> = {
    SILVER_TOWN: "실버타운",
    NURSING_HOME: "요양원",
    NURSING_HOSPITAL: "요양병원",
    DAY_CARE: "주야간보호센터",
    HOME_CARE: "방문 돌봄",
    OTHER: "기타",
  };

  return names[type] ?? "기타";
}

export default function FacilityDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [facility, setFacility] = useState<Facility | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadFacility() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(API_URL);

        if (!response.ok) {
          throw new Error("시설 정보를 불러오지 못했습니다.");
        }

        const data: Facility[] = await response.json();
        const found = data.find((item) => String(item.id) === String(id));

        if (!found) {
          setError("해당 시설을 찾을 수 없습니다.");
          return;
        }

        setFacility(found);
      } catch {
        setError(
          "서버에 연결할 수 없습니다. API 주소와 서버 상태를 확인해 주세요.",
        );
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadFacility();
    }
  }, [id]);

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: "시설 상세", headerShown: true }} />

      {loading ? (
        <ActivityIndicator size="large" color="#347454" style={styles.center} />
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.buttonText}>돌아가기</Text>
          </TouchableOpacity>
        </View>
      ) : facility ? (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.hero}>
            <Text style={styles.heroIcon}>⌂</Text>
            <Text style={styles.type}>
              {getTypeName(facility.facilityType)}
            </Text>
            <Text style={styles.name}>{facility.name}</Text>
            <Text style={styles.address}>{facility.address}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.heading}>시설 소개</Text>
            <Text style={styles.body}>
              {facility.introduction || "등록된 소개가 없습니다."}
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.heading}>이용료 안내</Text>
            <Text style={styles.price}>
              월 {formatMoney(facility.monthlyFeeMin)} ~{" "}
              {formatMoney(facility.monthlyFeeMax)}
            </Text>
            <Text style={styles.muted}>
              실제 비용은 입주 조건과 추가 서비스에 따라 달라질 수 있습니다.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.heading}>입소·입주 조건</Text>
            <Text style={styles.body}>
              {facility.admissionConditions || "별도 문의"}
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.heading}>운영 기관</Text>
            <Text style={styles.body}>
              {facility.organizationName || "정보 없음"}
            </Text>
            <Text style={styles.body}>
              전화번호: {facility.phone || "정보 없음"}
            </Text>
            <Text style={styles.body}>
              주소: {facility.address || "정보 없음"}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() =>
              router.push({
                pathname: "/consultations/new",
                params: {
                  facilityId: String(facility.id),
                  facilityName: facility.name,
                },
              })
            }
          >
            <Text style={styles.buttonText}>상담 신청하기</Text>
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            개발용 테스트 시설 정보입니다. 이용 전 실제 기관에 확인해 주세요.
          </Text>
        </ScrollView>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F8F5",
  },
  content: {
    padding: 20,
    paddingBottom: 36,
  },
  hero: {
    backgroundColor: "#E9F1E9",
    padding: 24,
    borderRadius: 18,
    alignItems: "center",
    marginBottom: 18,
  },
  heroIcon: {
    fontSize: 54,
    color: "#347454",
    marginBottom: 8,
  },
  type: {
    color: "#347454",
    fontWeight: "bold",
    marginBottom: 8,
  },
  name: {
    color: "#263B2D",
    fontSize: 23,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  address: {
    color: "#66736A",
    textAlign: "center",
    lineHeight: 22,
  },
  card: {
    backgroundColor: "#FFFFFF",
    padding: 18,
    borderRadius: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E8ECE7",
  },
  heading: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#263B2D",
    marginBottom: 12,
  },
  body: {
    color: "#4D5A51",
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 6,
  },
  price: {
    color: "#285C42",
    fontSize: 19,
    fontWeight: "bold",
    marginBottom: 10,
  },
  muted: {
    color: "#7B857D",
    fontSize: 13,
    lineHeight: 20,
  },
  primaryButton: {
    backgroundColor: "#347454",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 6,
  },
  backButton: {
    backgroundColor: "#347454",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 16,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  error: {
    color: "#B42318",
    textAlign: "center",
    lineHeight: 22,
  },
  disclaimer: {
    color: "#89928B",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 19,
    marginTop: 18,
  },
});
