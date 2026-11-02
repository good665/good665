import { fireEvent, render, screen } from "@testing-library/react-native";
import { Alert, Linking } from "react-native";

import BusinessRequestsScreen from "@/app/business/requests";
import { alertMessage } from "@/lib/alert";
import { apiFetch } from "@/lib/api";

jest.mock("@/lib/api", () => ({
  apiFetch: jest.fn(),
  ApiError: class ApiError extends Error {},
}));
jest.mock("@/lib/alert", () => ({ alertMessage: jest.fn() }));
jest.mock("expo-router", () => ({
  useFocusEffect: (effect: () => void) => {
    const { useEffect } = jest.requireActual("react");
    useEffect(effect, [effect]);
  },
}));

const mockFetch = apiFetch as jest.Mock;

const request = (fields: object) => ({
  id: 7,
  facilityName: "예시 요양원",
  userName: "홍길동",
  userPhone: "010-1234-5678",
  requestedAt: "2026-11-10 10:00:00",
  consultationMethod: "PHONE",
  message: null,
  status: "REQUESTED",
  createdAt: "2026-11-03 09:00:00",
  ...fields,
});

const page = (...items: object[]) => ({ items, page: 0, hasNext: false, totalElements: items.length });

describe("사업자 신청 관리", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    jest.restoreAllMocks();
  });

  it("신청자 연락처를 보여 주고 누르면 전화를 건다", async () => {
    mockFetch.mockResolvedValue(page(request({})));
    const openURL = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);

    await render(<BusinessRequestsScreen />);
    await fireEvent.press(await screen.findByText("010-1234-5678"));

    expect(mockFetch).toHaveBeenCalledWith("/api/business/consultations?page=0&size=10");
    expect(openURL).toHaveBeenCalledWith("tel:010-1234-5678");
  });

  it("전화번호가 없으면 안내 문구를 보여 준다", async () => {
    mockFetch.mockResolvedValue(page(request({ userPhone: null })));

    await render(<BusinessRequestsScreen />);

    expect(await screen.findByText("등록된 전화번호가 없습니다.")).toBeTruthy();
  });

  it("처리가 끝난 신청에는 변경 버튼이 없다", async () => {
    mockFetch.mockResolvedValue(page(request({ status: "COMPLETED" })));

    await render(<BusinessRequestsScreen />);
    await screen.findByText("홍길동");

    expect(screen.queryAllByRole("button", { name: "확정하기" })).toHaveLength(0);
    expect(screen.queryAllByRole("button", { name: "취소하기" })).toHaveLength(0);
  });

  it("방문 예약 탭은 예약 API를 부른다", async () => {
    mockFetch.mockResolvedValue(page());

    await render(<BusinessRequestsScreen />);
    await screen.findByText("들어온 신청이 없습니다.");
    await fireEvent.press(screen.getByRole("tab", { name: "방문 예약" }));
    await screen.findByText("들어온 신청이 없습니다.");

    expect(mockFetch).toHaveBeenLastCalledWith("/api/business/reservations?page=0&size=10");
  });

  it("확인을 눌러야 상태를 바꾸고 목록을 다시 불러온다", async () => {
    mockFetch.mockResolvedValue(page(request({})));
    const alert = jest.spyOn(Alert, "alert").mockImplementation(() => {});

    await render(<BusinessRequestsScreen />);
    await fireEvent.press(await screen.findByRole("button", { name: "확정하기" }));

    expect(mockFetch).not.toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ method: "PATCH" }));

    const buttons = alert.mock.calls[0][2]!;
    await buttons[1].onPress!();

    expect(mockFetch).toHaveBeenCalledWith("/api/business/consultations/7/status", {
      method: "PATCH",
      body: JSON.stringify({ status: "CONFIRMED" }),
    });
    expect(mockFetch).toHaveBeenLastCalledWith("/api/business/consultations?page=0&size=10");
  });

  it("변경에 실패하면 알리고 최신 목록을 다시 불러온다", async () => {
    mockFetch.mockResolvedValue(page(request({})));
    const alert = jest.spyOn(Alert, "alert").mockImplementation(() => {});

    await render(<BusinessRequestsScreen />);
    await fireEvent.press(await screen.findByRole("button", { name: "취소하기" }));

    mockFetch.mockRejectedValueOnce(new Error("상태가 이미 변경되었습니다."));
    await alert.mock.calls[0][2]![1].onPress!();

    expect(alertMessage).toHaveBeenCalledWith("변경 실패", "상태가 이미 변경되었습니다.");
    expect(mockFetch).toHaveBeenLastCalledWith("/api/business/consultations?page=0&size=10");
  });
});
