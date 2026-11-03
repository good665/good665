import type { ErrorBoundaryProps } from "expo-router";
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { AuthProvider, useAuth } from "@/context/AuthContext";

// 화면 렌더링 중 처리되지 않은 에러가 나면 흰 화면 대신 보여주는 전역 화면.
// expo-router 의 unstable_settings.screenErrorBoundary 로 등록해야 앱 전체(모든 중첩 레이아웃)에
// 적용됨 — 개별 라우트에 ErrorBoundary 를 export 하는 방식은 그 라우트에만 적용되고 전역이 아님.
function GlobalErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  const router = useRouter();

  return (
    <View style={errorStyles.container}>
      <Text style={errorStyles.title}>문제가 발생했습니다</Text>
      <Text style={errorStyles.message}>{error.message}</Text>

      <Pressable style={errorStyles.primaryButton} onPress={retry}>
        <Text style={errorStyles.primaryButtonText}>다시 시도</Text>
      </Pressable>

      <Pressable
        style={errorStyles.secondaryButton}
        onPress={() => {
          router.replace("/");
          retry();
        }}
      >
        <Text style={errorStyles.secondaryButtonText}>홈으로 돌아가기</Text>
      </Pressable>
    </View>
  );
}

export const unstable_settings = {
  screenErrorBoundary: GlobalErrorBoundary,
};

const errorStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F8FA",
    padding: 24,
    justifyContent: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#26352D",
    textAlign: "center",
    marginBottom: 10,
  },
  message: {
    fontSize: 14,
    color: "#777",
    textAlign: "center",
    marginBottom: 28,
  },
  primaryButton: {
    backgroundColor: "#39765B",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  secondaryButtonText: {
    color: "#39765B",
    fontSize: 15,
    fontWeight: "600",
  },
});

// 시설 조회는 비로그인 허용, 상담(/consultations)·방문예약(/reservations)·관리자(/admin)는 로그인 필요
// (관리자 역할 확인은 admin/_layout.tsx 에서 추가로 처리)
function AuthGate() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  const first = segments[0] as string | undefined;
  const inAuthScreen = first === "login" || first === "signup" || first === "business-signup" || first === "forgot-password";
  const needsLogin =
    first === "consultations" ||
    first === "reservations" ||
    first === "admin" ||
    first === "business" ||
    first === "account";

  useEffect(() => {
    if (loading) return;

    if (!user && needsLogin) {
      router.replace("/login");
    } else if (user && inAuthScreen) {
      // 로그인/가입 직후: 로그인 화면을 띄운 곳(예: 시설 상세)으로 돌아감, 없으면 홈
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace("/");
      }
    }
  }, [user, loading, needsLogin, inAuthScreen]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", backgroundColor: "#F7F8FA" }}>
        <ActivityIndicator size="large" color="#39765B" />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerTintColor: "#39765B",
      }}
    />
  );
}

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsReady(true);
  }, []);

  if (!isReady) {
    return <View style={{ flex: 1, backgroundColor: "#fff" }} />;
  }

  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}
