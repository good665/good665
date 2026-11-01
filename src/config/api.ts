import { Platform } from "react-native";

// EAS 빌드는 eas.json 의 EXPO_PUBLIC_API_BASE_URL 을 씀 (실기기 = PC 의 와이파이 IP, 운영 = https 서버 주소).
// 값이 없으면 개발용 기본값: 웹은 localhost, 안드로이드 에뮬레이터는 PC 를 가리키는 10.0.2.2
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  (Platform.OS === "web" ? "http://localhost:8080" : "http://10.0.2.2:8080");

export const FACILITY_TYPE_LABELS: Record<string, string> = {
  SILVER_TOWN: "실버타운",
  NURSING_HOME: "요양원",
  NURSING_HOSPITAL: "요양병원",
  DAY_CARE: "주야간보호",
  HOME_CARE: "방문 돌봄",
};

export function getFacilityTypeName(type: string) {
  return FACILITY_TYPE_LABELS[type] ?? "기타";
}

// 서버가 내려주는 사진 경로는 "/uploads/..." 같은 상대 경로라 API 서버 주소를 붙여줘야 함
export function resolveImageUrl(path: string) {
  if (/^https?:\/\//.test(path)) {
    return path;
  }

  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

// 월 이용료 입력 → 숫자. "1,500,000" 처럼 쉼표/공백은 허용, 빈칸은 null, 숫자가 아니면 NaN.
// NaN 을 그대로 보내면 JSON 에서 null 이 되어 기존 값이 조용히 지워지므로 호출하는 쪽에서 막아야 함
export function parseFee(text: string): number | null {
  const digits = text.replace(/[,\s]/g, "");
  if (!digits) return null;
  return /^\d+$/.test(digits) ? Number(digits) : NaN;
}
