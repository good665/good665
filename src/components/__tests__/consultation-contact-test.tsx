import { fireEvent, render, screen } from "@testing-library/react-native";

import NewConsultationScreen from "@/app/consultations/new";
import NewReservationScreen from "@/app/reservations/new";
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

const LABEL = "연락받을 전화번호";
const sentPhone = () => JSON.parse(mockFetch.mock.calls[0][1].body).contactPhone;

describe.each([
  ["상담 신청", NewConsultationScreen, "상담 신청하기"],
  ["방문 예약", NewReservationScreen, "방문 예약하기"],
])("%s 연락처", (_, Screen, submitLabel) => {
  const submit = async () => fireEvent.press(screen.getByText(submitLabel));

  beforeEach(() => {
    mockFetch.mockReset().mockResolvedValue({});
    refreshUser.mockReset().mockResolvedValue(undefined);
    (alertMessage as jest.Mock).mockReset();
  });

  it("저장된 번호를 미리 채우고, 그대로 신청하면 사용자 정보를 다시 읽지 않는다", async () => {
    asUser("010-1111-2222");
    await render(<Screen />);

    expect(screen.getByLabelText(LABEL).props.value).toBe("010-1111-2222");

    await submit();
    expect(sentPhone()).toBe("010-1111-2222");
    expect(refreshUser).not.toHaveBeenCalled();
  });

  it("번호를 고쳐서 신청하면 새 번호를 보내고 사용자 정보를 갱신한다", async () => {
    asUser("010-1234-567");
    await render(<Screen />);

    await fireEvent.changeText(screen.getByLabelText(LABEL), " 010-1234-5678 ");
    await submit();

    expect(sentPhone()).toBe("010-1234-5678");
    expect(refreshUser).toHaveBeenCalled();
  });

  it("번호가 비어 있으면 신청하지 않고 안내한다", async () => {
    asUser(null);
    await render(<Screen />);

    await submit();

    expect(mockFetch).not.toHaveBeenCalled();
    expect(alertMessage).toHaveBeenCalled();
  });
});
