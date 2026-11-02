import { fireEvent, render, screen } from "@testing-library/react-native";

import { BusinessFacilityDetailsEditor, toRequest } from "@/components/business-facility-details-editor";
import { apiFetch } from "@/lib/api";

jest.mock("@/lib/api", () => ({
  apiFetch: jest.fn(),
  apiUpload: jest.fn(),
  uploadFormData: jest.fn(),
}));
jest.mock("@/lib/alert", () => ({ alertMessage: jest.fn() }));
jest.mock("expo-image-picker", () => ({}));
jest.mock("expo-document-picker", () => ({}));

const mockFetch = apiFetch as jest.Mock;

const room = (fields: Partial<Parameters<typeof toRequest>[0][number]>) => ({
  key: 1,
  roomType: "1인실",
  area: "",
  deposit: "",
  rent: "",
  jeonse: "",
  sale: "",
  ...fields,
});

describe("불러오기 실패", () => {
  beforeEach(() => mockFetch.mockReset());

  // 저장은 방 목록 전체를 교체하므로, 빈 목록으로 저장되면 등록된 방이 모두 지워짐
  it("저장 버튼 없이 다시 시도만 보여 주고, 성공하면 입력 화면으로 돌아간다", async () => {
    mockFetch.mockRejectedValueOnce(new Error("network"));

    await render(<BusinessFacilityDetailsEditor facilityId={9} />);

    const retry = await screen.findByText("다시 시도");
    expect(screen.queryByText("저장")).toBeNull();
    expect(screen.queryByText("+ 방 종류 추가")).toBeNull();

    mockFetch.mockResolvedValueOnce({ floorPlans: [], rooms: [] });
    await fireEvent.press(retry);

    expect(await screen.findByText("저장")).toBeTruthy();
    expect(screen.queryByText("다시 시도")).toBeNull();
    expect(mockFetch).not.toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ method: "PUT" }));
  });

  it("불러오면 등록된 방을 입력칸에 채운다", async () => {
    mockFetch.mockResolvedValueOnce({
      floorPlans: [],
      rooms: [{ id: 1, roomType: "2인실", areaSqm: 26, prices: [{ dealType: "JEONSE", deposit: 500, amount: null }] }],
    });

    await render(<BusinessFacilityDetailsEditor facilityId={9} />);

    expect((await screen.findByLabelText("2인실 크기 (㎡)")).props.value).toBe("26");
    expect(screen.getByLabelText("2인실 전세금 (원)").props.value).toBe("500");
  });
});

describe("toRequest", () => {
  it("입력한 거래 유형만 보내고, 월세 보증금이 비면 0원이다", () => {
    expect(toRequest([room({ area: "16.5", rent: "1,200,000", sale: "300000000" })])).toEqual({
      rooms: [
        {
          roomType: "1인실",
          areaSqm: 16.5,
          prices: [
            { dealType: "MONTHLY", deposit: 0, amount: 1200000 },
            { dealType: "SALE", deposit: null, amount: 300000000 },
          ],
        },
      ],
    });
  });

  it("크기와 가격이 비면 null 과 빈 목록이다", () => {
    expect(toRequest([room({})]).rooms[0]).toEqual({ roomType: "1인실", areaSqm: null, prices: [] });
  });

  it.each([
    ["1e999", "크기가 Infinity"],
    ["abc", "크기가 문자"],
  ])("크기 %s (%s) 는 거절한다", (area) => {
    expect(() => toRequest([room({ area })])).toThrow("숫자로 입력");
  });

  it("2000자리 가격은 거절한다", () => {
    expect(() => toRequest([room({ sale: "9".repeat(2000) })])).toThrow("숫자로 입력");
  });

  it("보증금만 있고 월세가 없으면 거절한다", () => {
    expect(() => toRequest([room({ deposit: "1000" })])).toThrow("월세 금액");
  });
});
