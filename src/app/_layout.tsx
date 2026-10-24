import { Slot } from "expo-router"; // Expo Router 사용 시
import { useEffect, useState } from "react";
import { View } from "react-native";

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // 핸드폰 자바스크립트 엔진이 완전히 준비되었을 때 true로 변경
    setIsReady(true);
  }, []);

  // 준비가 안 되었을 때는 빈 화면을 보여주어 eval() 에러를 방어함
  if (!isReady) {
    return <View style={{ flex: 1, backgroundColor: "#fff" }} />;
  }

  // 준비가 끝나면 그제야 실제 앱 화면들을 로드
  return <Slot />;
}
