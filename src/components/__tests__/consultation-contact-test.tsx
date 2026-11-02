import { fireEvent, render, screen } from "@testing-library/react-native";

import NewConsultationScreen from "@/app/consultations/new";
import { useAuth } from "@/context/AuthContext";
import { alertMessage } from "@/lib/alert";
import { apiFetch } from "@/lib/api";

jest.mock("@/lib/api", () => ({ apiFetch: jest.fn() }));
jest.mock("@/lib/alert", () => ({ alertMessage: jest.fn() }));
jest.mock("@/context/AuthContext", () => ({ useAuth: jest.fn() }));
jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({ facilityId: "9", facilityName: "예시 시설" }),
}));

const mockFetch = apiFetch as jest.Mock;
const refreshUser = jest.fn();

const asUser = (phone: string | null) =>
  (useAuth as jest.Mock).mockReturnValue({ user: { id: 1, phone }, refreshUser });

const submit = async () => fireEvent.press(screen.getByText("상담 신청하기"));

describe("상담 신청 연락처", () => {
  beforeEach(() => {
    mockFetch.mockReset().mockResolvedValue({});
    refreshUser.mockReset().mockResolvedValue(undefined);
    (alertMessage as jest.Mock).mockReset();
  });

  it("전화번호가 있으면 입력칸 없이 신청한다", async () => {
    asUser("010-1111-2222");
    await render(<NewConsultationScreen />);

    expect(screen.queryByLabelText("연락받을 전화번호")).toBeNull();

    await submit();
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.contactPhone).toBeUndefined();
  });

  it("전화번호가 없으면 입력해야 신청된다", async () => {
    asUser(null);
    await render(<NewConsultationScreen />);

    await submit();
    expect(mockFetch).not.toHaveBeenCalled();
    expect(alertMessage).toHaveBeenCalled();

    await fireEvent.changeText(screen.getByLabelText("연락받을 전화번호"), " 010-1234-5678 ");
    await submit();

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.contactPhone).toBe("010-1234-5678");
    expect(refreshUser).toHaveBeenCalled();
  });
});
