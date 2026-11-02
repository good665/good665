import { compressFacilityPhoto } from "@/lib/image-compress";

const mockResize = jest.fn();

// 40KB 분량의 base64 를 돌려주는 가짜 이미지 처리기
jest.mock("expo-image-manipulator", () => ({
  SaveFormat: { JPEG: "jpeg" },
  ImageManipulator: {
    manipulate: () => ({
      resize: (size: unknown) => mockResize(size),
      renderAsync: async () => ({
        saveAsync: async () => ({ uri: "file:///small.jpg", base64: "A".repeat(Math.ceil((40 * 1024 * 4) / 3)) }),
      }),
    }),
  },
}));

describe("compressFacilityPhoto", () => {
  beforeEach(() => mockResize.mockReset());

  // 웹은 height: null 을 넣으면 createImageData 오류로 실패함
  it("비율을 유지한 높이를 직접 계산해 넘긴다", async () => {
    await compressFacilityPhoto({ uri: "file:///big.png", width: 4000, height: 3000, fileSize: 5_000_000, mimeType: "image/png" });

    expect(mockResize).toHaveBeenCalledWith({ width: 1280, height: 960 });
  });

  it("줄인 결과는 JPEG 로 올린다", async () => {
    const result = await compressFacilityPhoto({ uri: "file:///big.png", width: 800, height: 600, fileSize: 5_000_000, mimeType: "image/png" });

    expect(result.uri).toBe("file:///small.jpg");
    expect(result.mimeType).toBe("image/jpeg");
    expect(result.fileName).toMatch(/\.jpg$/);
  });

  it("이미 조건에 맞는 사진은 그대로 올린다", async () => {
    const photo = { uri: "file:///ok.jpg", width: 800, height: 600, fileSize: 40 * 1024, mimeType: "image/jpeg" };

    expect(await compressFacilityPhoto(photo)).toBe(photo);
    expect(mockResize).not.toHaveBeenCalled();
  });
});
