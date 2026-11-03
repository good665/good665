import { File as ExpoFile } from "expo-file-system";
import { Platform } from "react-native";

import { uploadFormData } from "@/lib/api";

jest.mock("@/lib/storage", () => ({ getToken: jest.fn() }));
jest.mock("expo-file-system", () => ({
  File: class {
    uri: string;
    constructor(uri: string) {
      this.uri = uri;
    }
    bytes() {
      return Promise.resolve(new Uint8Array());
    }
  },
}));

describe("uploadFormData", () => {
  let append: jest.SpyInstance;

  beforeEach(() => {
    append = jest.spyOn(FormData.prototype, "append").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    Platform.OS = "ios";
  });

  // SDK 58 의 전역 fetch(expo/fetch)는 {uri, name, type} 를 지원하지 않아 앱에서 모든 업로드가 실패함
  it.each(["ios", "android"] as const)("%s 는 expo-file-system 의 File 을 넣는다", (os) => {
    Platform.OS = os;

    uploadFormData({ uri: "file:///cache/a.jpg", fileName: "a.jpg" });

    const part = append.mock.calls[0][1];
    expect(append.mock.calls[0][0]).toBe("file");
    expect(part).toBeInstanceOf(ExpoFile);
    expect(part.uri).toBe("file:///cache/a.jpg");
    expect(typeof part.bytes).toBe("function");
  });

  it("웹은 브라우저의 File 을 파일 이름과 함께 넣는다", () => {
    Platform.OS = "web";
    const file = new Blob(["x"]) as File;

    uploadFormData({ uri: "blob:x", fileName: "a.jpg", file });

    expect(append).toHaveBeenCalledWith("file", file, "a.jpg");
  });
});
