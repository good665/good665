import { Stack, useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

import { useAuth } from "@/context/AuthContext";

// 로그인은 루트 _layout.tsx(AuthGate)가 이미 확인했으니, 여기서는 BUSINESS_OWNER 권한만 추가로 확인
export default function BusinessLayout() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const isBusinessOwner = user?.role === "BUSINESS_OWNER";

  useEffect(() => {
    if (!loading && !isBusinessOwner) {
      router.replace("/");
    }
  }, [loading, isBusinessOwner, router]);

  if (loading || !isBusinessOwner) {
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
      <Stack.Screen name="index" options={{ title: "내 시설 관리" }} />
      <Stack.Screen name="new" options={{ title: "시설 등록" }} />
      <Stack.Screen name="requests" options={{ title: "상담·예약 신청" }} />
      <Stack.Screen name="[id]" options={{ title: "시설 수정" }} />
    </Stack>
  );
}
