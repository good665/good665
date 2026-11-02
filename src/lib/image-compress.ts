import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { Platform } from "react-native";

export const TARGET_MIN_BYTES = 30 * 1024;
export const TARGET_MAX_BYTES = 50 * 1024;

const MAX_WIDTH = 1280;
const MIN_WIDTH = 200;
const BEST_QUALITY = 0.9;
const WORST_QUALITY = 0.3;
const SEARCH_STEPS = 6;
const SERVER_TYPES = ["image/jpeg", "image/png", "image/webp"];

type Rendered = { bytes: number };

/**
 * 폭과 화질을 조절해 30~50KB 결과를 찾음. 화질을 먼저 맞춰 보고, 가장 낮은 화질로도 크면 폭을 줄임.
 * 아주 단순한 사진처럼 범위에 못 미치면 50KB 이하 중 가장 큰 결과를 씀.
 */
export async function findTargetImage<T extends Rendered>(
  render: (width: number, quality: number) => Promise<T>,
  sourceWidth: number,
): Promise<T> {
  let best: T | null = null;
  const inRange = (r: T) => r.bytes >= TARGET_MIN_BYTES && r.bytes <= TARGET_MAX_BYTES;
  const remember = (r: T) => {
    if (r.bytes <= TARGET_MAX_BYTES && (!best || r.bytes > best.bytes)) best = r;
  };

  let width = Math.min(sourceWidth, MAX_WIDTH);

  while (true) {
    const top = await render(width, BEST_QUALITY);
    remember(top);
    if (inRange(top)) return top;
    if (top.bytes < TARGET_MIN_BYTES) return best ?? top;

    const bottom = await render(width, WORST_QUALITY);
    remember(bottom);
    if (inRange(bottom)) return bottom;

    if (bottom.bytes < TARGET_MIN_BYTES) {
      let low = WORST_QUALITY;
      let high = BEST_QUALITY;
      for (let step = 0; step < SEARCH_STEPS; step++) {
        const quality = (low + high) / 2;
        const middle = await render(width, quality);
        remember(middle);
        if (inRange(middle)) return middle;
        if (middle.bytes > TARGET_MAX_BYTES) high = quality;
        else low = quality;
      }
      return best ?? bottom;
    }

    if (width <= MIN_WIDTH) break;
    // 용량은 폭의 제곱에 비례하므로 목표 폭을 바로 계산해 시도 횟수를 줄임
    const estimated = width * Math.sqrt(TARGET_MAX_BYTES / bottom.bytes);
    width = Math.max(MIN_WIDTH, Math.round(Math.min(estimated, width * 0.9)));
  }

  if (best) return best;
  throw new Error("사진 용량을 50KB 이하로 줄이지 못했습니다. 다른 사진을 선택해 주세요.");
}

type PickedPhoto = {
  uri: string;
  width: number;
  height: number;
  fileName?: string | null;
  fileSize?: number;
  mimeType?: string;
  file?: File;
};

/** 이미 50KB 이하이고 서버가 받는 형식이면 원본 그대로 올림 */
export function needsCompression(photo: { fileSize?: number; mimeType?: string }) {
  return (
    photo.fileSize === undefined ||
    photo.fileSize > TARGET_MAX_BYTES ||
    !SERVER_TYPES.includes(photo.mimeType ?? "")
  );
}

function base64Bytes(base64: string) {
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  return Math.floor((base64.length * 3) / 4) - padding;
}

/** 사업자 시설 사진을 30~50KB JPEG 로 줄여 업로드할 수 있는 형태로 돌려줌 */
export async function compressFacilityPhoto(photo: PickedPhoto) {
  if (!needsCompression(photo)) return photo;

  const result = await findTargetImage(async (width, quality) => {
    const context = ImageManipulator.manipulate(photo.uri);
    // 웹은 height: null 을 지원하지 않아 비율을 직접 계산
    context.resize({ width, height: Math.round((width * photo.height) / photo.width) });
    const image = await context.renderAsync();
    const saved = await image.saveAsync({ compress: quality, format: SaveFormat.JPEG, base64: true });
    return { uri: saved.uri, base64: saved.base64 ?? "", bytes: base64Bytes(saved.base64 ?? "") };
  }, photo.width);

  const fileName = `photo-${Date.now()}.jpg`;

  if (Platform.OS === "web") {
    // 웹은 업로드에 실제 File 이 필요함
    const bytes = Uint8Array.from(atob(result.base64), (c) => c.charCodeAt(0));
    return { uri: result.uri, fileName, mimeType: "image/jpeg", file: new File([bytes], fileName, { type: "image/jpeg" }) };
  }
  return { uri: result.uri, fileName, mimeType: "image/jpeg" };
}
