import { apiFetch } from "@/lib/api";
import { exchangeOAuthCode, oauthErrorMessage, parseOAuthRedirect } from "@/lib/oauth";

jest.mock("@/lib/api", () => ({ apiFetch: jest.fn() }));

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

describe("exchangeOAuthCode", () => {
  beforeEach(() => mockFetch.mockReset());

  // Android 는 딥링크가 화면과 인증 세션 양쪽에 도착할 수 있는데, 코드는 한 번만 쓸 수 있음
  it("같은 코드는 한 번만 교환한다", async () => {
    mockFetch.mockResolvedValue({ token: "t", user: {} });

    const [a, b] = await Promise.all([exchangeOAuthCode("same"), exchangeOAuthCode("same")]);

    expect(a).toBe(b);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith("/api/auth/oauth/exchange", {
      method: "POST",
      body: JSON.stringify({ code: "same" }),
    });
  });
});
