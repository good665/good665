import * as DocumentPicker from "expo-document-picker";
import { Platform } from "react-native";

import { apiUpload } from "@/lib/api";
import { pickPdf } from "@/lib/file-pickers";

jest.mock("@/lib/storage", () => ({ getToken: jest.fn().mockResolvedValue(null) }));
jest.mock("@/lib/alert", () => ({ alertMessage: jest.fn() }));
jest.mock("expo-file-system", () => ({ File: class {} }));
jest.mock("expo-image-picker", () => ({}));
jest.mock("expo-document-picker", () => ({ getDocumentAsync: jest.fn() }));

const getDocument = DocumentPicker.getDocumentAsync as jest.Mock;

describe("pickPdf", () => {
  beforeEach(() => getDocument.mockReset().mockResolvedValue({ canceled: true, assets: null }));
  afterEach(() => {
    Platform.OS = "ios";
  });

  // Android 는 캐시 복사본을 expo-file-system 권한 검사가 막으므로 원본 content:// 를 읽음
  it("Android 는 캐시로 복사하지 않는다", async () => {
    Platform.OS = "android";
    await pickPdf();
    expect(getDocument).toHaveBeenCalledWith({ type: "application/pdf", copyToCacheDirectory: false });
  });

  it("iOS 는 캐시로 복사한다", async () => {
    Platform.OS = "ios";
    await pickPdf();
    expect(getDocument).toHaveBeenCalledWith({ type: "application/pdf", copyToCacheDirectory: true });
  });

  it("취소하면 null, 고르면 파일을 돌려준다", async () => {
    expect(await pickPdf()).toBeNull();

    const asset = { uri: "content://a", name: "a.pdf" };
    getDocument.mockResolvedValue({ canceled: false, assets: [asset] });
    expect(await pickPdf()).toBe(asset);
  });
});

describe("apiUpload 오류 안내", () => {
  const original = globalThis.fetch;
  const failWith = (error: Error) => {
    globalThis.fetch = jest.fn().mockRejectedValue(error) as unknown as typeof fetch;
    jest.spyOn(console, "warn").mockImplementation(() => {});
  };

  afterEach(() => {
    globalThis.fetch = original;
    jest.restoreAllMocks();
  });

  it("파일을 못 읽으면 네트워크가 아니라 파일 문제로 안내한다", async () => {
    failWith(new Error("Call to function 'FileSystemFile.bytes' has been rejected."));

    await expect(apiUpload("/x", new FormData())).rejects.toThrow("파일을 읽지 못했습니다");
  });

  it("그 외 실패는 연결 문제로 안내한다", async () => {
    failWith(new TypeError("Network request failed"));

    await expect(apiUpload("/x", new FormData())).rejects.toThrow("서버에 연결할 수 없습니다");
  });
});
