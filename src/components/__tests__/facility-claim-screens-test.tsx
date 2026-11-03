import { fireEvent, render, screen } from "@testing-library/react-native";
import { Alert, Linking } from "react-native";

import AdminFacilityClaimsScreen from "@/app/admin/claims";
import FacilityClaimScreen from "@/app/business/claim";
import { alertMessage } from "@/lib/alert";
import { apiFetch, apiUpload } from "@/lib/api";
import { pickPdf } from "@/lib/file-pickers";

jest.mock("@/lib/api", () => ({
  apiFetch: jest.fn(),
  apiUpload: jest.fn(),
  uploadFormData: jest.fn(() => {
    const parts: Record<string, string> = {};
    return { parts, append: (k: string, v: string) => (parts[k] = v) };
  }),
}));
jest.mock("@/lib/alert", () => ({ alertMessage: jest.fn() }));
jest.mock("@/lib/file-pickers", () => ({ pickDocumentPhoto: jest.fn(), pickPdf: jest.fn() }));
jest.mock("expo-router", () => ({
  useFocusEffect: (effect: () => void) => {
    const { useEffect } = jest.requireActual("react");
    useEffect(effect, [effect]);
  },
}));

const mockFetch = apiFetch as jest.Mock;
const mockUpload = apiUpload as jest.Mock;

const facility = { id: 10, name: "예시 요양원", address: "서울 예시구", phone: null, facilityType: "NURSING_HOME", myPending: false };

const route = (responses: Record<string, unknown>) =>
  mockFetch.mockImplementation(async (path: string) => {
    const key = Object.keys(responses).find((k) => path.startsWith(k));
    return key ? responses[key] : {};
  });

beforeEach(() => {
  mockFetch.mockReset();
  mockUpload.mockReset().mockResolvedValue({});
  (alertMessage as jest.Mock).mockReset();
  (pickPdf as jest.Mock).mockReset();
});

describe("사업자 소유권 신청", () => {
  const data = (over = {}) => ({
    "/api/business/facility-claims/claimable": { items: [{ ...facility, ...over }] },
    "/api/business/organizations": [{ id: 5, name: "내 기관" }],
    "/api/business/facility-claims": [],
  });

  const searchAndSelect = async () => {
    await render(<FacilityClaimScreen />);
    await fireEvent.changeText(await screen.findByLabelText("시설 검색어"), "예시");
    await fireEvent.press(screen.getByText("검색"));
    await fireEvent.press(await screen.findByText("예시 요양원"));
  };

  it("한 글자로는 검색하지 않는다", async () => {
    route(data());
    await render(<FacilityClaimScreen />);
    await fireEvent.changeText(await screen.findByLabelText("시설 검색어"), "예");
    await fireEvent.press(screen.getByText("검색"));

    expect(alertMessage).toHaveBeenCalled();
    expect(mockFetch).not.toHaveBeenCalledWith(expect.stringContaining("claimable"));
  });

  it("서류가 없으면 신청하지 않는다", async () => {
    route(data());
    await searchAndSelect();
    await fireEvent.press(await screen.findByText("소유권 신청하기"));

    expect(mockUpload).not.toHaveBeenCalled();
    expect(alertMessage).toHaveBeenCalledWith("입력 확인", expect.stringContaining("증빙 서류"));
  });

  it("시설·기관·서류를 함께 보낸다", async () => {
    route(data());
    (pickPdf as jest.Mock).mockResolvedValue({ uri: "file:///a.pdf", name: "등록증.pdf" });
    await searchAndSelect();
    await fireEvent.press(await screen.findByText("PDF 선택"));
    expect(await screen.findByText("첨부됨: 등록증.pdf")).toBeTruthy();

    await fireEvent.press(screen.getByText("소유권 신청하기"));

    const [path, form] = mockUpload.mock.calls[0];
    expect(path).toBe("/api/business/facility-claims");
    expect(form.parts).toEqual({ facilityId: "10", organizationId: "5" });
  });

  it("이미 신청한 시설은 고를 수 없다", async () => {
    route(data({ myPending: true }));
    await searchAndSelect();

    expect(screen.getByText("이미 신청하여 검토 중입니다.")).toBeTruthy();
    expect(screen.queryByText("소유권 신청하기")).toBeNull();
  });
});

describe("관리자 소유권 심사", () => {
  const claim = {
    id: 7,
    facilityName: "예시 요양원",
    facilityAddress: "서울 예시구",
    facilityType: "NURSING_HOME",
    organizationName: "신청 기관",
    businessRegistrationNumber: "1234567890",
    verificationStatus: "VERIFIED",
    requesterName: "홍길동",
    requesterPhone: "010-1111-2222",
    requesterEmail: "a@b.com",
    message: null,
    status: "PENDING",
    rejectReason: null,
    createdAt: "2026-11-03 09:00",
    hasDocument: true,
  };

  beforeEach(() => route({ "/api/admin/facility-claims": { items: [claim], url: "/doc?sig=x" } }));

  const calledWith = (path: string) => mockFetch.mock.calls.some((c) => c[0] === path);

  it("승인은 확인을 눌러야 실행된다", async () => {
    const alert = jest.spyOn(Alert, "alert").mockImplementation(() => {});
    await render(<AdminFacilityClaimsScreen />);
    await fireEvent.press(await screen.findByText("승인하기"));

    expect(calledWith("/api/admin/facility-claims/7/approve")).toBe(false);
    await alert.mock.calls[0][2]![1].onPress!();
    expect(calledWith("/api/admin/facility-claims/7/approve")).toBe(true);
    alert.mockRestore();
  });

  it("거절 사유가 없으면 거절하지 않는다", async () => {
    await render(<AdminFacilityClaimsScreen />);
    await fireEvent.press(await screen.findByText("거절하기"));
    await fireEvent.press(await screen.findByText("거절 확정"));

    expect(calledWith("/api/admin/facility-claims/7/reject")).toBe(false);
    expect(alertMessage).toHaveBeenCalledWith("입력 확인", expect.stringContaining("거절 사유"));

    await fireEvent.changeText(screen.getByLabelText("거절 사유"), " 서류가 흐립니다 ");
    await fireEvent.press(screen.getByText("거절 확정"));

    expect(mockFetch).toHaveBeenCalledWith("/api/admin/facility-claims/7/reject", {
      method: "POST",
      body: JSON.stringify({ reason: "서류가 흐립니다" }),
    });
  });

  it("서류는 서명된 주소로 연다", async () => {
    const open = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);
    await render(<AdminFacilityClaimsScreen />);
    await fireEvent.press(await screen.findByText("증빙 서류 보기"));

    expect(calledWith("/api/admin/facility-claims/7/document-link")).toBe(true);
    expect(open).toHaveBeenCalledWith(expect.stringMatching(/\/doc\?sig=x$/));
    open.mockRestore();
  });
});
