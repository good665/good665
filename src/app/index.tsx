import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// Android 에뮬레이터 기준 주소
// 실제 휴대폰에서는 컴퓨터의 로컬 IP 주소로 변경해야 함
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

const categories = [
  { label: "전체", value: "ALL" },
  { label: "실버타운", value: "SILVER_TOWN" },
  { label: "요양원", value: "NURSING_HOME" },
  { label: "요양병원", value: "NURSING_HOSPITAL" },
  { label: "주야간보호", value: "DAY_CARE" },
  { label: "방문 돌봄", value: "HOME_CARE" },
];

function getTypeName(type: string) {
  return categories.find((item) => item.value === type)?.label ?? "기타";
}

function formatMoney(value: number | null) {
  if (value == null) return null;
  return `${(value / 10000).toLocaleString("ko-KR")}만 원`;
}

export default function HomeScreen() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [keyword, setKeyword] = useState("");
  const [selectedType, setSelectedType] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    async function loadFacilities() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(API_URL);

        if (!response.ok) {
          throw new Error(`서버 응답 오류: ${response.status}`);
        }

        const data: Facility[] = await response.json();
        setFacilities(data);
      } catch (e) {
        setError(
          "시설 정보를 불러오지 못했어요. 서버 주소와 실행 상태를 확인해 주세요.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadFacilities();
  }, []);

  const filteredFacilities = useMemo(() => {
    const search = keyword.trim().toLowerCase();

    return facilities.filter((facility) => {
      const matchesType =
        selectedType === "ALL" || facility.facilityType === selectedType;

      const matchesKeyword =
        !search ||
        facility.name.toLowerCase().includes(search) ||
        facility.address.toLowerCase().includes(search) ||
        facility.organizationName.toLowerCase().includes(search);

      return matchesType && matchesKeyword;
    });
  }, [facilities, keyword, selectedType]);

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={filteredFacilities}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            <Text style={styles.brand}>시니어라이프</Text>
            <Text style={styles.subtitle}>
              부모님을 위한 돌봄 시설을 찾아보세요.
            </Text>

            <TextInput
              style={styles.search}
              placeholder="시설명 또는 지역 검색"
              value={keyword}
              onChangeText={setKeyword}
              clearButtonMode="while-editing"
            />

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoryScroll}
            >
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.value}
                  style={[
                    styles.categoryButton,
                    selectedType === category.value && styles.categorySelected,
                  ]}
                  onPress={() => setSelectedType(category.value)}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      selectedType === category.value &&
                        styles.categoryTextSelected,
                    ]}
                  >
                    {category.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.sectionTitle}>추천 시설</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.7}
            onPress={() => {
              console.log("시설 카드 클릭됨:", item.id);

              router.push("/facilities/1");
            }}
          >
            <Text style={styles.facilityType}>
              {getTypeName(item.facilityType)}
            </Text>

            <Text style={styles.facilityName}>{item.name}</Text>

            <Text style={styles.address}>{item.address}</Text>

            {item.monthlyFeeMin != null && item.monthlyFeeMax != null && (
              <Text style={styles.price}>
                월 {formatMoney(item.monthlyFeeMin)} ~{" "}
                {formatMoney(item.monthlyFeeMax)}
              </Text>
            )}

            <Text style={styles.description}>상세 정보 보기 →</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator
              size="large"
              color="#347454"
              style={styles.message}
            />
          ) : (
            <Text style={styles.message}>
              {error || "검색 결과가 없습니다. 다른 검색어를 입력해 보세요."}
            </Text>
          )
        }
        ListFooterComponent={
          <Text style={styles.notice}>
            시설 정보와 이용료는 실제 기관에 확인해 주시기 바랍니다.
          </Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F8F5",
  },
  listContent: {
    padding: 20,
    paddingBottom: 32,
  },
  brand: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#285C42",
    marginTop: 12,
  },
  subtitle: {
    fontSize: 15,
    color: "#66736A",
    marginTop: 8,
    marginBottom: 22,
  },
  search: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E1E6E0",
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 14,
    fontSize: 15,
  },
  categoryScroll: {
    marginTop: 18,
    marginBottom: 24,
  },
  categoryButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E1E6E0",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    marginRight: 8,
  },
  categorySelected: {
    backgroundColor: "#347454",
    borderColor: "#347454",
  },
  categoryText: {
    fontSize: 14,
    color: "#4D5A51",
  },
  categoryTextSelected: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#263B2D",
    marginBottom: 14,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E8ECE7",
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: "#E9F1E9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  buildingIcon: {
    fontSize: 34,
    color: "#347454",
  },
  cardInfo: {
    flex: 1,
  },
  facilityType: {
    color: "#347454",
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 5,
  },
  facilityName: {
    color: "#263B2D",
    fontSize: 17,
    fontWeight: "bold",
    marginBottom: 6,
  },
  address: {
    color: "#6B756D",
    fontSize: 13,
    lineHeight: 19,
  },
  price: {
    color: "#285C42",
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 9,
  },
  description: {
    fontSize: 13,
    lineHeight: 20,
    color: "#66736A",
    marginTop: 14,
  },
  message: {
    textAlign: "center",
    marginTop: 30,
    marginBottom: 30,
    color: "#66736A",
    lineHeight: 22,
  },
  notice: {
    color: "#89928B",
    fontSize: 12,
    textAlign: "center",
    marginTop: 12,
  },
});
