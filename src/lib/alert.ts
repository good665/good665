import { Alert, Platform } from "react-native";

// react-native-web 의 Alert.alert 는 아무것도 띄우지 않으므로 웹에서는 window.alert 사용
export function alertMessage(title: string, message: string) {
  if (Platform.OS === "web") {
    window.alert(message);
  } else {
    Alert.alert(title, message);
  }
}
