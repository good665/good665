import { findTargetImage, needsCompression, TARGET_MAX_BYTES, TARGET_MIN_BYTES } from "@/lib/image-compress";

// 폭의 제곱과 화질에 비례해 커지는 단순한 사진 모델
const model = (factor: number) => {
  const calls: { width: number; quality: number }[] = [];
  const render = async (width: number, quality: number) => {
    calls.push({ width, quality });
    return { width, quality, bytes: Math.round(width * width * quality * factor) };
  };
  return { calls, render };
};

describe("findTargetImage", () => {
  it("큰 사진은 폭과 화질을 줄여 30~50KB 로 맞춘다", async () => {
    const { render, calls } = model(1);

    const result = await findTargetImage(render, 4000);

    expect(result.bytes).toBeGreaterThanOrEqual(TARGET_MIN_BYTES);
    expect(result.bytes).toBeLessThanOrEqual(TARGET_MAX_BYTES);
    // 렌더링이 느려 시도 횟수가 곧 대기 시간임
    expect(calls.length).toBeLessThanOrEqual(12);
  });

  it.each([0.05, 0.2, 0.5, 1, 2])("사진 복잡도 %s 에서도 범위 안에 들어온다", async (factor) => {
    const result = await findTargetImage(model(factor).render, 3000);

    expect(result.bytes).toBeGreaterThanOrEqual(TARGET_MIN_BYTES);
    expect(result.bytes).toBeLessThanOrEqual(TARGET_MAX_BYTES);
  });

  it("원본보다 크게 늘리지 않고, 최대 폭을 넘기지 않는다", async () => {
    const small = model(1);
    await findTargetImage(small.render, 300);
    expect(Math.max(...small.calls.map((c) => c.width))).toBe(300);

    const huge = model(1);
    await findTargetImage(huge.render, 8000);
    expect(Math.max(...huge.calls.map((c) => c.width))).toBe(1280);
  });

  it("최고 화질에도 30KB 가 안 되는 단순한 사진은 가장 큰 결과를 쓴다", async () => {
    const result = await findTargetImage(model(0.001).render, 1000);

    expect(result.bytes).toBeLessThan(TARGET_MIN_BYTES);
    expect(result.quality).toBe(0.9);
    expect(result.width).toBe(1000);
  });

  it("화질 단계가 거칠어 범위를 건너뛰면 50KB 이하 중 가장 큰 결과를 쓴다", async () => {
    const render = async (width: number, quality: number) => ({
      width,
      quality,
      bytes: quality > 0.6 ? TARGET_MAX_BYTES + 1000 : TARGET_MIN_BYTES - 1000,
    });

    const result = await findTargetImage(render, 500);

    expect(result.bytes).toBe(TARGET_MIN_BYTES - 1000);
  });

  it("아무리 줄여도 50KB 이하가 안 되면 실패를 알린다", async () => {
    const render = async (width: number, quality: number) => ({ width, quality, bytes: TARGET_MAX_BYTES + 1 });

    await expect(findTargetImage(render, 2000)).rejects.toThrow("50KB");
  });
});

describe("needsCompression", () => {
  it.each([
    [{ fileSize: 40 * 1024, mimeType: "image/jpeg" }, false],
    [{ fileSize: 10 * 1024, mimeType: "image/png" }, false],
    [{ fileSize: 50 * 1024, mimeType: "image/webp" }, false],
    [{ fileSize: 50 * 1024 + 1, mimeType: "image/jpeg" }, true],
    [{ fileSize: 40 * 1024, mimeType: "image/heic" }, true], // 서버가 받지 않는 형식은 변환
    [{ mimeType: "image/jpeg" }, true], // 크기를 모르면 줄여서 보장
    [{ fileSize: 40 * 1024 }, true],
  ])("%j → %s", (asset, expected) => {
    expect(needsCompression(asset)).toBe(expected);
  });
});
