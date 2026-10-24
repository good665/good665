import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsReady(true);
  }, []);

  if (!isReady) {
    return <View style={{ flex: 1, backgroundColor: "#fff" }} />;
  }

  // Slot -> Stack 으로 변경: 화면 이동 애니메이션과 헤더(Stack.Screen options)가 동작함
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerTintColor: "#39765B",
      }}
    />
  );
}
