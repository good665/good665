import { apiFetch } from "@/lib/api";
import {
  createOAuthChallenge,
  exchangeOAuthCode,
  oauthErrorMessage,
  parseOAuthRedirect,
} from "@/lib/oauth";
import { clearOAuthVerifier, getOAuthVerifier, saveOAuthVerifier } from "@/lib/storage";

jest.mock("@/lib/api", () => ({ apiFetch: jest.fn() }));
jest.mock("@/lib/storage", () => {
  let value: string | null = null;
  return {
    saveOAuthVerifier: jest.fn(async (v: string) => {
      value = v;
    }),
    getOAuthVerifier: jest.fn(async () => value),
    clearOAuthVerifier: jest.fn(async () => {
      value = null;
    }),
  };
});
jest.mock("expo-crypto", () => {
  const nodeCrypto = jest.requireActual("crypto");
  return {
    CryptoDigestAlgorithm: { SHA256: "SHA-256" },
    CryptoEncoding: { BASE64: "base64" },
    getRandomBytesAsync: async (n: number) => new Uint8Array(nodeCrypto.randomBytes(n)),
    digestStringAsync: async (_: string, data: string) =>
      nodeCrypto.createHash("sha256").update(data).digest("base64"),
  };
});

const mockFetch = apiFetch as jest.Mock;

describe("parseOAuthRedirect", () => {
  it("앱 주소에서 코드를 꺼낸다", () => {
    expect(parseOAuthRedirect("tansongmobile://oauth-callback?code=abc-1_2")).toEqual({ code: "abc-1_2" });
  });

  it("오류를 꺼낸다", () => {
    expect(parseOAuthRedirect("http://localhost:8081/oauth-callback?error=email_exists")).toEqual({
      error: "email_exists",
    });
  });

  it("코드도 오류도 없으면 실패로 본다", () => {
    expect(parseOAuthRedirect("tansongmobile://oauth-callback")).toEqual({ error: "failed" });
  });
});

describe("oauthErrorMessage", () => {
  it("기존 이메일 안내와 알 수 없는 오류 안내를 구분한다", () => {
    expect(oauthErrorMessage("email_exists")).toContain("이미 가입된 이메일");
    expect(oauthErrorMessage("cancelled")).toContain("취소");
    expect(oauthErrorMessage("<script>")).toBe(oauthErrorMessage("failed"));
  });
});

describe("createOAuthChallenge", () => {
  it("verifier 를 저장하고 그 SHA-256 을 base64url 로 돌려준다", async () => {
    const challenge = await createOAuthChallenge();
    const verifier = await getOAuthVerifier();

    expect(verifier).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(challenge).toMatch(/^[A-Za-z0-9_-]{43}$/);
    const expected = jest
      .requireActual("crypto")
      .createHash("sha256")
      .update(verifier!)
      .digest("base64url");
    expect(challenge).toBe(expected);
  });

  it("매번 다른 값을 만든다", async () => {
    const first = await createOAuthChallenge();
    expect(await createOAuthChallenge()).not.toBe(first);
  });
});

describe("exchangeOAuthCode", () => {
  beforeEach(async () => {
    mockFetch.mockReset();
    await saveOAuthVerifier("my-verifier");
  });

  // Android 는 딥링크가 화면과 인증 세션 양쪽에 도착할 수 있는데, 코드는 한 번만 쓸 수 있음
  it("같은 코드는 한 번만 교환하고 verifier 를 함께 보낸 뒤 지운다", async () => {
    mockFetch.mockResolvedValue({ token: "t", user: {} });

    const [a, b] = await Promise.all([exchangeOAuthCode("same"), exchangeOAuthCode("same")]);

    expect(a).toBe(b);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith("/api/auth/oauth/exchange", {
      method: "POST",
      body: JSON.stringify({ code: "same", codeVerifier: "my-verifier" }),
    });
    expect(clearOAuthVerifier).toHaveBeenCalled();
    expect(await getOAuthVerifier()).toBeNull();
  });

  // 남이 보낸 로그인 링크를 연 경우 이 기기에는 verifier 가 없음
  it("이 기기에서 시작하지 않은 로그인은 서버에 보내지 않는다", async () => {
    await clearOAuthVerifier();

    await expect(exchangeOAuthCode("from-link")).rejects.toThrow("다시 시도");
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
