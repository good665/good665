import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { Platform } from "react-native";

import { alertMessage } from "@/lib/alert";

/** 도면도·증빙 서류용 사진 선택. 권한이 없거나 취소하면 null */
export async function pickDocumentPhoto() {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    alertMessage("권한 필요", "파일을 첨부하려면 사진 보관함 접근 권한이 필요합니다.");
    return null;
  }

  // quality 1 은 원본을 그대로 복사해 iPhone HEIC 가 서버에서 거절됨 → JPEG 로 변환되도록 지정
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    quality: 0.9,
    preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
  });
  return result.canceled ? null : (result.assets?.[0] ?? null);
}

/** PDF 선택. 취소하면 null */
export async function pickPdf() {
  // Android 는 캐시 복사본을 expo-file-system 권한 검사가 막으므로(Expo Go) 원본 content:// 를 그대로 읽음
  const result = await DocumentPicker.getDocumentAsync({
    type: "application/pdf",
    copyToCacheDirectory: Platform.OS !== "android",
  });
  return result.canceled ? null : (result.assets?.[0] ?? null);
}
