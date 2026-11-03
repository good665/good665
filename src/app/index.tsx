import type { Href } from "expo-router";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { useAuth } from "@/context/AuthContext";
import { ApiError, apiFetch } from "@/lib/api";

const PAGE_SIZE = 10;

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
  premium: boolean; // 상단노출(광고) 결제 중인 시설
};

type FacilityPage = {
  items: Facility[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
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
  const router = useRouter();
  const { user, logout } = useAuth();

  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  const [selectedType, setSelectedType] = useState("ALL");

  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);

  const [loading, setLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(false); // 페이지 번호를 눌러 다른 페이지를 불러오는 중
  const listRef = useRef<FlatList<Facility>>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // 응답이 뒤섞여 도착해도 "가장 최근 요청"의 결과만 반영하기 위한 번호표
  const requestId = useRef(0);
  // 광고 시설끼리의 무작위 순서 — 새로 검색할 때마다 바꾸고, 다른 페이지에는 같은 값을 보내 중복/누락을 막음
  const shuffleSeed = useRef(0);

  // 검색어 입력이 멈추고 0.4초 뒤에 서버에 요청
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedKeyword(keyword.trim()), 400);
    return () => clearTimeout(timer);
  }, [keyword]);

  const fetchPage = useCallback(
    async (pageToLoad: number, newSearch: boolean) => {
      const myId = ++requestId.current;
      if (newSearch) shuffleSeed.current = Math.floor(Math.random() * 1_000_000_000);

      try {
        setError("");

        const params = new URLSearchParams({
          page: String(pageToLoad),
          size: String(PAGE_SIZE),
          seed: String(shuffleSeed.current),
        });

        if (selectedType !== "ALL") params.set("type", selectedType);
        if (debouncedKeyword) params.set("keyword", debouncedKeyword);

        const data = await apiFetch<FacilityPage>(
          `/api/facilities/search?${params.toString()}`,
        );

        if (myId !== requestId.current) return;

        setFacilities(data.items);
        setPage(data.page);
        setTotalPages(data.totalPages);
        setTotal(data.totalElements);
        if (!newSearch) listRef.current?.scrollToOffset({ offset: 0, animated: false });
      } catch (e) {
        if (myId !== requestId.current) return;

        if (newSearch) setFacilities([]);
        setError(
          e instanceof ApiError
            ? e.message
            : "시설 정보를 불러오지 못했어요. 서버 주소와 실행 상태를 확인해 주세요.",
        );
      } finally {
        if (myId === requestId.current) {
          setLoading(false);
          setPageLoading(false);
          setRefreshing(false);
        }
      }
    },
    [selectedType, debouncedKeyword],
  );

  // 카테고리/검색어가 바뀌면 첫 페이지부터 다시 조회
  useEffect(() => {
    setLoading(true);
    fetchPage(0, true);
  }, [fetchPage]);

  const goToPage = (target: number) => {
    if (loading || pageLoading || target === page || target < 0 || target >= totalPages) return;

    setPageLoading(true);
    fetchPage(target, false);
  };

  // 현재 페이지 주변으로 최대 5개 번호만 표시 (예: 3 4 [5] 6 7)
  const pageStart = Math.max(0, Math.min(page - 2, totalPages - 5));
  const pageNumbers = Array.from(
    { length: Math.min(5, totalPages) },
    (_, i) => pageStart + i,
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        ref={listRef}
        data={facilities}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchPage(0, true);
            }}
          />
        }
        ListHeaderComponent={
          <View>
            <View style={styles.authBar}>
              {user ? (
                <>
                  {user.role === "ADMIN" && (
                    <TouchableOpacity onPress={() => router.push("/admin" as Href)}>
                      <Text style={styles.authLink}>관리자</Text>
                    </TouchableOpacity>
                  )}
                  {user.role === "BUSINESS_OWNER" && (
                    <TouchableOpacity onPress={() => router.push("/business" as Href)}>
                      <Text style={styles.authLink}>내 시설 관리</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity accessibilityRole="link" onPress={() => router.push("/account")}>
                    <Text style={styles.authLink}>{user.name}님</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={logout}>
                    <Text style={styles.authLink}>로그아웃</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity onPress={() => router.push("/login")}>
                  <Text style={styles.authLink}>로그인 / 회원가입</Text>
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.brand}>시니어라이프</Text>
            <Text style={styles.subtitle}>
              부모님을 위한 돌봄 시설을 찾아보세요.
            </Text>

            <View style={styles.shortcutRow}>
              <TouchableOpacity
                style={[styles.consultationButton, styles.shortcutButton]}
                activeOpacity={0.8}
                onPress={() =>
                  router.push((user ? "/reservations" : "/login") as Href)
                }
              >
                <Text style={styles.consultationButtonText}>
                  내 방문 예약 확인하기 →
                </Text>
                <Text style={styles.consultationButtonSubtext}>
                  예약한 방문 일정과 진행 상태를 확인하세요.
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.consultationButton, styles.shortcutButton]}
                activeOpacity={0.8}
                onPress={() => router.push(user ? "/consultations" : "/login")}
              >
                <Text style={styles.consultationButtonText}>
                  내 상담 신청 확인하기 →
                </Text>
                <Text style={styles.consultationButtonSubtext}>
                  신청한 상담 일정과 진행 상태를 확인하세요.
                </Text>
              </TouchableOpacity>
            </View>

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

            <Text style={styles.sectionTitle}>
              추천 시설{!loading && !error ? ` (${total})` : ""}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.7}
            onPress={() => {
              router.push(`/facilities/${item.id}`);
            }}
          >
            <View style={styles.cardTopRow}>
              <Text style={styles.facilityType}>
                {getTypeName(item.facilityType)}
              </Text>
              {item.premium && (
                <View style={styles.adBadge}>
                  <Text style={styles.adBadgeText}>광고</Text>
                </View>
              )}
            </View>

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
          <View>
            {totalPages > 1 && !loading && (
              <View style={styles.pager}>
                <TouchableOpacity
                  style={styles.pageArrow}
                  disabled={page === 0 || pageLoading}
                  onPress={() => goToPage(page - 1)}
                  accessibilityLabel="이전 페이지"
                >
                  <Text style={[styles.pageArrowText, page === 0 && styles.pageDisabled]}>‹ 이전</Text>
                </TouchableOpacity>

                {pageNumbers.map((n) => (
                  <TouchableOpacity
                    key={n}
                    style={[styles.pageButton, n === page && styles.pageButtonActive]}
                    disabled={pageLoading}
                    onPress={() => goToPage(n)}
                    accessibilityLabel={`${n + 1}페이지`}
                  >
                    <Text style={[styles.pageText, n === page && styles.pageTextActive]}>{n + 1}</Text>
                  </TouchableOpacity>
                ))}

                <TouchableOpacity
                  style={styles.pageArrow}
                  disabled={page >= totalPages - 1 || pageLoading}
                  onPress={() => goToPage(page + 1)}
                  accessibilityLabel="다음 페이지"
                >
                  <Text style={[styles.pageArrowText, page >= totalPages - 1 && styles.pageDisabled]}>
                    다음 ›
                  </Text>
                </TouchableOpacity>
              </View>
            )}
            {pageLoading && <ActivityIndicator color="#347454" />}
            {totalPages > 1 && !loading && (
              <Text style={styles.pageInfo}>
                {page + 1} / {totalPages.toLocaleString("ko-KR")} 페이지
              </Text>
            )}
            <Text style={styles.notice}>
              시설 정보와 이용료는 실제 기관에 확인해 주시기 바랍니다.
            </Text>
          </View>
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
  pager: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
  },
  pageButton: {
    minWidth: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D9DED8",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  pageButtonActive: {
    backgroundColor: "#347454",
    borderColor: "#347454",
  },
  pageText: {
    fontSize: 14,
    color: "#26352D",
    fontWeight: "600",
  },
  pageTextActive: {
    color: "#FFFFFF",
  },
  pageArrow: {
    height: 36,
    paddingHorizontal: 8,
    justifyContent: "center",
  },
  pageArrowText: {
    fontSize: 14,
    color: "#347454",
    fontWeight: "600",
  },
  pageDisabled: {
    color: "#BBBBBB",
  },
  pageInfo: {
    textAlign: "center",
    fontSize: 12,
    color: "#888",
    marginTop: 8,
  },
  listContent: {
    padding: 20,
    paddingBottom: 32,
  },
  authBar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 14,
  },
  authText: {
    color: "#4D5A51",
    fontSize: 13,
  },
  authLink: {
    color: "#347454",
    fontSize: 13,
    fontWeight: "bold",
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

  shortcutRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 24,
  },
  shortcutButton: {
    flex: 1,
    marginBottom: 0,
  },

  consultationButton: {
    backgroundColor: "#347454",
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 14,
    marginBottom: 24,
  },

  consultationButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },

  consultationButtonSubtext: {
    color: "#E5F0E8",
    fontSize: 12,
    marginTop: 6,
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
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  facilityType: {
    color: "#347454",
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 5,
  },
  adBadge: {
    borderWidth: 1,
    borderColor: "#B8C2BA",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  adBadgeText: {
    color: "#6B756D",
    fontSize: 11,
    fontWeight: "bold",
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
