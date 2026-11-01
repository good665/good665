import { Stack, useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

import { useAuth } from "@/context/AuthContext";

// 로그인은 루트 _layout.tsx(AuthGate)가 이미 확인했으니, 여기서는 ADMIN 권한만 추가로 확인
export default function AdminLayout() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const isAdmin = user?.role === "ADMIN";

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.replace("/");
    }
  }, [loading, isAdmin, router]);

  if (loading || !isAdmin) {
    return (
      <View style={{ flex: 1, justifyContent: "center", backgroundColor: "#F7F8FA" }}>
        <ActivityIndicator size="large" color="#39765B" />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTintColor: "#39765B",
        headerTitleStyle: { color: "#26352D" },
      }}
    >
      <Stack.Screen name="index" options={{ title: "관리자" }} />
      <Stack.Screen name="facilities/index" options={{ title: "시설 관리" }} />
      <Stack.Screen name="facilities/new" options={{ title: "시설 등록" }} />
      <Stack.Screen name="facilities/[id]" options={{ title: "시설 수정" }} />
      <Stack.Screen name="organizations/new" options={{ title: "운영 기관 등록" }} />
      <Stack.Screen name="reservations/index" options={{ title: "방문 예약 관리" }} />
      <Stack.Screen name="consultations/index" options={{ title: "상담 관리" }} />
      <Stack.Screen name="subscriptions/index" options={{ title: "매출·구독 현황" }} />
    </Stack>
  );
}
