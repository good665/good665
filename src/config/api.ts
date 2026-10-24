import { Platform } from "react-native";

// 실제 휴대폰에서 테스트할 때는 10.0.2.2 대신 컴퓨터의 로컬 IP로 바꾸세요.
export const API_BASE_URL =
  Platform.OS === "web" ? "http://localhost:8080" : "http://10.0.2.2:8080";

// 로그인 기능 전까지 임시 사용자
export const USER_ID = 1;

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
