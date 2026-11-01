import type { Href } from "expo-router";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

// 실제 라우트는 "/admin/facilities" 처럼 폴더 경로(끝에 /index 없이)로 동작합니다.
// 단, Expo Router 의 typed-routes 코드젠이 중첩 index 라우트를 아직 "/index" 형태로만
// 인식하는 버그성 동작이 있어 타입만 맞지 않는 것 — as Href 로 단언합니다.
const menuItems = [
  {
    title: "시설 관리",
    description: "시설 등록·수정·사진 관리, 운영 상태 변경",
    path: "/admin/facilities" as Href,
  },
  {
    title: "방문 예약 관리",
    description: "전체 방문 예약 조회 및 상태 변경",
    path: "/admin/reservations" as Href,
  },
  {
    title: "상담 관리",
    description: "전체 상담 신청 조회 및 상태 변경",
    path: "/admin/consultations" as Href,
  },
  {
    title: "매출·구독 현황",
    description: "상단 노출 매출, 노출 중인 시설, 최근 결제·실패 내역",
    path: "/admin/subscriptions" as Href,
  },
  {
    title: "공공데이터 시설 가져오기",
    description: "국민건강보험공단 장기요양기관(서울·경기)을 시설로 등록",
    path: "/admin/public-data" as Href,
  },
];

export default function AdminHomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.subtitle}>관리할 항목을 선택하세요.</Text>

      {menuItems.map((item) => (
        <Pressable
          key={item.title}
          style={styles.card}
          onPress={() => router.push(item.path)}
        >
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardDescription}>{item.description}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F8FA",
    padding: 20,
  },
  subtitle: {
    color: "#777",
    fontSize: 14,
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E8E8E8",
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#26352D",
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: 13,
    color: "#777",
    lineHeight: 19,
  },
});
