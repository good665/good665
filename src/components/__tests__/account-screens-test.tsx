import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";

import AccountScreen from "@/app/account";
import ForgotPasswordScreen from "@/app/forgot-password";
import { useAuth } from "@/context/AuthContext";
import { alertMessage } from "@/lib/alert";
import { apiFetch } from "@/lib/api";

const mockReplace = jest.fn();

jest.mock("@/lib/api", () => ({ apiFetch: jest.fn() }));
jest.mock("@/lib/alert", () => ({ alertMessage: jest.fn() }));
jest.mock("@/context/AuthContext", () => ({ useAuth: jest.fn() }));
jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: mockReplace, back: jest.fn(), canGoBack: () => true }),
}));

const mockFetch = apiFetch as jest.Mock;
const logout = jest.fn();

const asUser = (role: string, email = "a@b.com") =>
  (useAuth as jest.Mock).mockReturnValue({ user: { id: 1, name: "홍길동", email, phone: null, role }, logout });

beforeEach(() => {
  mockFetch.mockReset();
  mockReplace.mockReset();
  logout.mockReset().mockResolvedValue(undefined);
  (alertMessage as jest.Mock).mockReset();
});

describe("회원 탈퇴", () => {
  const withdrawCalls = () => mockFetch.mock.calls.filter((c) => c[0] === "/api/account/withdraw");

  const mockAccount = (socialOnly: boolean) =>
    mockFetch.mockImplementation(async (path: string) => (path === "/api/account" ? { socialOnly } : {}));

  it("비밀번호 없이는 진행하지 않는다", async () => {
    asUser("USER");
    mockAccount(false);
    await render(<AccountScreen />);

    await fireEvent.press(await screen.findByRole("button", { name: "회원 탈퇴" }));

    expect(await screen.findByText("비밀번호를 입력해 주세요.")).toBeTruthy();
    expect(withdrawCalls()).toHaveLength(0);
  });

  it("확인을 눌러야 탈퇴하고 로그아웃한다", async () => {
    asUser("USER");
    mockAccount(false);
    const alert = jest.spyOn(Alert, "alert").mockImplementation(() => {});
    await render(<AccountScreen />);

    await fireEvent.changeText(await screen.findByLabelText("비밀번호 확인"), "pw12345678");
    await fireEvent.press(screen.getByRole("button", { name: "회원 탈퇴" }));
    expect(withdrawCalls()).toHaveLength(0);

    await alert.mock.calls[0][2]![1].onPress!();

    expect(withdrawCalls()[0][1].body).toBe(JSON.stringify({ password: "pw12345678" }));
    expect(logout).toHaveBeenCalled();
    expect(alertMessage).toHaveBeenCalledWith("탈퇴 완료", expect.any(String));
    alert.mockRestore();
  });

  it("실패하면 로그아웃하지 않고 안내한다", async () => {
    asUser("USER");
    mockFetch.mockImplementation(async (path: string) => {
      if (path === "/api/account") return { socialOnly: true };
      throw new Error("비밀번호가 올바르지 않습니다.");
    });
    const alert = jest.spyOn(Alert, "alert").mockImplementation(() => {});
    await render(<AccountScreen />);

    await fireEvent.press(await screen.findByRole("button", { name: "회원 탈퇴" }));
    await alert.mock.calls[0][2]![1].onPress!();

    expect(await screen.findByText("비밀번호가 올바르지 않습니다.")).toBeTruthy();
    expect(logout).not.toHaveBeenCalled();
    alert.mockRestore();
  });

  it("소셜 계정은 비밀번호 칸이 없고 임시 이메일을 보여 주지 않는다", async () => {
    asUser("USER", "kakao_1@social.invalid");
    mockAccount(true);
    await render(<AccountScreen />);

    await screen.findByRole("button", { name: "회원 탈퇴" });
    expect(screen.queryByLabelText("비밀번호 확인")).toBeNull();
    expect(screen.queryByText("kakao_1@social.invalid")).toBeNull();
  });

  it("사업자에게는 결제와 시설 처리 내용을 알린다", async () => {
    asUser("BUSINESS_OWNER");
    mockAccount(false);
    await render(<AccountScreen />);

    expect(await screen.findByText(/자동 결제가 해지/)).toBeTruthy();
    expect(screen.getByText(/시설이 비공개/)).toBeTruthy();
  });

  it("관리자에게는 탈퇴 버튼이 없다", async () => {
    asUser("ADMIN");
    mockAccount(false);
    await render(<AccountScreen />);

    expect(await screen.findByText("관리자 계정은 앱에서 탈퇴할 수 없습니다.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "회원 탈퇴" })).toBeNull();
  });
});

describe("비밀번호 찾기", () => {
  const toCodeStep = async () => {
    mockFetch.mockResolvedValue({});
    await render(<ForgotPasswordScreen />);
    await fireEvent.changeText(screen.getByLabelText("이메일"), " a@b.com ");
    await fireEvent.press(screen.getByRole("button", { name: "코드 받기" }));
    await screen.findByLabelText("재설정 코드");
    mockFetch.mockClear();
  };

  const fill = async (code: string, password: string, confirm: string) => {
    await fireEvent.changeText(screen.getByLabelText("재설정 코드"), code);
    await fireEvent.changeText(screen.getByLabelText("새 비밀번호"), password);
    await fireEvent.changeText(screen.getByLabelText("새 비밀번호 확인"), confirm);
    await fireEvent.press(screen.getByRole("button", { name: "비밀번호 변경" }));
  };

  it("이메일 없이는 요청하지 않는다", async () => {
    await render(<ForgotPasswordScreen />);
    await fireEvent.press(screen.getByRole("button", { name: "코드 받기" }));

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("메일 서비스가 꺼져 있으면 서버 안내를 보여 주고 다음 단계로 가지 않는다", async () => {
    mockFetch.mockRejectedValue(new Error("지금은 비밀번호 찾기를 사용할 수 없습니다."));
    await render(<ForgotPasswordScreen />);
    await fireEvent.changeText(screen.getByLabelText("이메일"), "a@b.com");
    await fireEvent.press(screen.getByRole("button", { name: "코드 받기" }));

    expect(await screen.findByText(/사용할 수 없습니다/)).toBeTruthy();
    expect(screen.queryByLabelText("재설정 코드")).toBeNull();
  });

  it("코드 형식이 틀리거나 비밀번호가 다르면 보내지 않는다", async () => {
    await toCodeStep();

    await fill("123", "Newpass123", "Newpass123");
    expect(mockFetch).not.toHaveBeenCalled();

    await fill("123456", "Newpass123", "Other12345");
    expect(mockFetch).not.toHaveBeenCalled();
    expect(await screen.findByText("새 비밀번호가 서로 다릅니다.")).toBeTruthy();
  });

  it("변경에 성공하면 로그인 화면으로 간다", async () => {
    await toCodeStep();

    await fill("123456", "Newpass123", "Newpass123");

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/login"));
    expect(mockFetch).toHaveBeenCalledWith("/api/auth/password-reset/confirm", {
      method: "POST",
      body: JSON.stringify({ email: "a@b.com", code: "123456", newPassword: "Newpass123" }),
    });
  });
});
