import { Platform } from "react-native";

// 실제 휴대폰에서 테스트할 때는 10.0.2.2 대신 컴퓨터의 로컬 IP(예: http://192.168.0.10:8080)로 바꾸세요.
// 운영 배포 시에는 https 주소를 사용해야 합니다.
export const API_BASE_URL =
  Platform.OS === "web" ? "http://localhost:8080" : "http://10.0.2.2:8080";

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
