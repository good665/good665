import { Stack, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Platform,
    Pressable,
    RefreshControl,
    StyleSheet,
    Text,
    View,
} from "react-native";

type Consultation = {
  id: number;
  facilityId: number;
  facilityName: string;
  preferredAt: string;
  consultationMethod: string;
  message: string | null;
  status: string;
  createdAt: string;
};

const API_BASE_URL =
  Platform.OS === "web" ? "http://localhost:8080" : "http://10.0.2.2:8080";

const USER_ID = 1;

export default function MyConsultationsScreen() {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  //백엔드 API를 호출해 상담 내역을 가져옴
  const fetchConsultations = async () => {
    try {
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/api/consultations/my?userId=${USER_ID}`,
      );

      if (!response.ok) {
        throw new Error(`서버 오류: ${response.status}`);
      }

      const data: Consultation[] = await response.json();
      setConsultations(data);
    } catch (e) {
      console.error("상담 목록 조회 오류:", e);
      setError(
        "상담 목록을 불러오지 못했습니다. 서버 실행 상태와 API 주소를 확인해 주세요.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  //들어올 때마다 목록을 다시 조회
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchConsultations();
    }, []),
  );

  const formatDate = (date: string) => {
    if (!date) return "-";
    return date.replace("T", " ").slice(0, 16);
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "REQUESTED":
        return "신청 완료";
      case "CONFIRMED":
        return "상담 확정";
      case "COMPLETED":
        return "상담 완료";
      case "CANCELED":
        return "취소됨";
      default:
        return status || "상태 미확인";
    }
  };

  const getMethodText = (method: string) => {
    switch (method) {
      case "PHONE":
        return "전화 상담";
      case "VISIT":
        return "방문 상담";
      case "ONLINE":
        return "온라인 상담";
      default:
        return method || "-";
    }
  };

  const cancelConsultation = async (consultationId: number) => {
    try {
      const response = await fetch(
        //1. 백엔드에 PATCH 요청을 보낸다.
        `${API_BASE_URL}/api/consultations/${consultationId}/cancel?userId=${USER_ID}`,
        {
          method: "PATCH",
        },
      );

      const result = await response.json();

      if (!response.ok) {
        //2. 성공 여부를 확인
        throw new Error(result.message || "상담 취소에 실패했습니다.");
      }

      if (Platform.OS === "web") {
        //3. 성공하면 취소 완료 메시지를 표시
        window.alert("상담 신청이 취소되었습니다.");
      } else {
        Alert.alert("취소 완료", "상담 신청이 취소되었습니다.");
      }

      await fetchConsultations(); //4. 상담 목록을 다시 조회
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "상담 취소 중 오류가 발생했습니다.";

      if (Platform.OS === "web") {
        window.alert(message);
      } else {
        Alert.alert("취소 실패", message);
      }
    }
  };
  const confirmCancel = (consultationId: number) => {
    if (Platform.OS === "web") {
      const confirmed = window.confirm("이 상담 신청을 취소하시겠습니까?");

      if (confirmed) {
        cancelConsultation(consultationId);
      }

      return;
    }

    Alert.alert("상담 신청 취소", "이 상담 신청을 취소하시겠습니까?", [
      {
        text: "아니요",
        style: "cancel",
      },
      {
        text: "취소하기",
        style: "destructive",
        onPress: () => cancelConsultation(consultationId),
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "내 상담 신청", headerShown: true }} />

      <Text style={styles.title}>내 상담 신청</Text>
      <Text style={styles.subtitle}>
        신청한 시니어 시설 상담 내역을 확인할 수 있어요.
      </Text>

      {loading ? (
        <ActivityIndicator size="large" style={styles.loader} />
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>
          <Text style={styles.retry} onPress={fetchConsultations}>
            다시 시도하기
          </Text>
        </View>
      ) : (
        <FlatList //상담 신청 내역을 목록으로 표시
          data={consultations}
          keyExtractor={(item) => String(item.id)}
          refreshControl={
            <RefreshControl //화면을 아래로 당겨 목록을 새로고침
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchConsultations();
              }}
            />
          }
          contentContainerStyle={
            consultations.length === 0 ? styles.emptyContainer : styles.list
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>아직 신청한 상담이 없습니다.</Text>
          }
          //getStatusText -> REQUESTED 같은 상태 코드를 한국어로 바꿔
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Pressable
                onPress={() => router.push(`/facilities/${item.facilityId}`)}
              >
                <Text style={styles.facilityName}>{item.facilityName} →</Text>
              </Pressable>

              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>
                  {getStatusText(item.status)}
                </Text>
              </View>

              <Text style={styles.label}>희망 상담 일시</Text>
              <Text style={styles.value}>{formatDate(item.preferredAt)}</Text>

              <Text style={styles.label}>상담 방식</Text>
              <Text style={styles.value}>
                {getMethodText(item.consultationMethod)}
              </Text>

              {item.message ? (
                <>
                  <Text style={styles.label}>요청 사항</Text>
                  <Text style={styles.value}>{item.message}</Text>
                </>
              ) : null}

              <Text style={styles.createdAt}>
                신청일: {formatDate(item.createdAt)}
              </Text>

              {["REQUESTED", "CONFIRMED"].includes(item.status) && (
                <Pressable
                  style={styles.cancelButton}
                  onPress={() => confirmCancel(item.id)}
                >
                  <Text style={styles.cancelButtonText}>신청 취소</Text>
                </Pressable>
              )}
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F8FA",
    padding: 20,
  },
  title: {
    fontSize: 25,
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 8,
    color: "#222222",
  },
  subtitle: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 20,
  },
  loader: {
    marginTop: 40,
  },
  list: {
    paddingBottom: 30,
  },
  card: {
    backgroundColor: "#FFFFFF",
    padding: 18,
    borderRadius: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E8E8E8",
  },
  facilityName: {
    fontSize: 19,
    fontWeight: "bold",
    color: "#222222",
    marginBottom: 12,
    paddingRight: 8,
  },
  statusBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#E5F3EA",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 14,
  },
  statusText: {
    color: "#267347",
    fontSize: 13,
    fontWeight: "bold",
  },
  label: {
    color: "#777777",
    fontSize: 12,
    marginTop: 10,
    marginBottom: 4,
  },
  value: {
    color: "#333333",
    fontSize: 15,
    lineHeight: 22,
  },
  createdAt: {
    color: "#999999",
    fontSize: 12,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
  },
  center: {
    alignItems: "center",
    marginTop: 40,
    paddingHorizontal: 10,
  },
  error: {
    color: "#C62828",
    textAlign: "center",
    lineHeight: 22,
  },
  retry: {
    color: "#2367D1",
    fontWeight: "bold",
    marginTop: 16,
    padding: 8,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    color: "#777777",
    fontSize: 15,
    textAlign: "center",
  },
  cancelButton: {
    marginTop: 14,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#D9534F",
    alignItems: "center",
  },

  cancelButtonText: {
    color: "#C62828",
    fontSize: 14,
    fontWeight: "bold",
  },
});
