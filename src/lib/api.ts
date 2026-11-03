import { File as ExpoFile } from "expo-file-system";
import { Platform } from "react-native";

import { API_BASE_URL } from "@/config/api";
import { getToken } from "@/lib/storage";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

// 토큰이 만료/무효일 때 AuthContext 가 로그아웃 처리하도록 연결하는 훅
let unauthorizedHandler: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

const DEFAULT_MESSAGES: Record<number, string> = {
  400: "요청 내용을 확인해 주세요.",
  401: "로그인이 필요합니다.",
  403: "권한이 없습니다.",
  404: "요청한 정보를 찾을 수 없습니다.",
  500: "서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
};

/**
 * 모든 API 호출의 공통 진입점.
 * - 저장된 토큰이 있으면 Authorization 헤더를 자동으로 붙임
 * - 서버의 {message} 를 ApiError 로 변환
 * - 네트워크 실패는 status 0 으로 구분
 */
export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = await getToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) ?? {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  } catch {
    throw new ApiError(
      "서버에 연결할 수 없습니다. 네트워크와 서버 실행 상태를 확인해 주세요.",
      0,
    );
  }

  const text = await response.text();
  let data: any = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    // 요청 도중 다시 로그인했다면 옛 토큰의 401 로 새 세션을 로그아웃시키지 않음
    if (response.status === 401 && token && token === (await getToken())) {
      unauthorizedHandler?.();
    }

    throw new ApiError(
      data?.message ??
        DEFAULT_MESSAGES[response.status] ??
        `요청에 실패했습니다. (${response.status})`,
      response.status,
    );
  }

  return data as T;
}

// 업로드용 FormData (image picker, document picker 결과 공용).
// 앱의 전역 fetch(SDK 58 부터 expo/fetch)는 {uri,name,type} 를 지원하지 않아 expo-file-system 의 File 을 넣고,
// 웹은 expo-file-system 을 지원하지 않으므로 picker 가 주는 실제 File 을 넣음
export function uploadFormData(asset: {
  uri: string;
  fileName?: string | null;
  name?: string;
  file?: File;
}) {
  const formData = new FormData();
  const name = asset.fileName ?? asset.name ?? `photo-${Date.now()}.jpg`;

  if (Platform.OS === "web" && asset.file) {
    formData.append("file", asset.file, name);
  } else {
    formData.append("file", new ExpoFile(asset.uri) as unknown as Blob);
  }

  return formData;
}

/**
 * multipart/form-data 업로드 전용 진입점 (사진 업로드 등).
 * Content-Type 은 지정하지 않음 — fetch 가 boundary 를 포함해 자동으로 설정해야 함.
 */
export async function apiUpload<T = unknown>(
  path: string,
  formData: FormData,
): Promise<T> {
  const token = await getToken();

  const headers: Record<string, string> = {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers,
      body: formData,
    });
  } catch (e) {
    // 연결 문제가 아닌 오류도 여기로 오므로 원인을 남김
    console.warn("업로드 요청 실패", e);
    if (e instanceof Error && e.message.includes("FileSystemFile")) {
      throw new ApiError("첨부한 파일을 읽지 못했습니다. 파일을 다시 선택해 주세요.", 0);
    }
    throw new ApiError(
      "서버에 연결할 수 없습니다. 네트워크와 서버 실행 상태를 확인해 주세요.",
      0,
    );
  }

  const text = await response.text();
  let data: any = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    // 요청 도중 다시 로그인했다면 옛 토큰의 401 로 새 세션을 로그아웃시키지 않음
    if (response.status === 401 && token && token === (await getToken())) {
      unauthorizedHandler?.();
    }

    throw new ApiError(
      data?.message ??
        DEFAULT_MESSAGES[response.status] ??
        `요청에 실패했습니다. (${response.status})`,
      response.status,
    );
  }

  return data as T;
}
