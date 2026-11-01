// 상담 신청·방문 예약 폼이 함께 쓰는 날짜/시간 입력 처리

const pad = (n: number) => String(n).padStart(2, "0");

/** 기본 희망 날짜: 내일 (YYYY-MM-DD) */
export function getTomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * "YYYY-MM-DD" + "HH:mm" 입력이 실제 존재하는 미래 시각인지 확인합니다.
 * @returns 문제가 있으면 [알림 제목, 메시지], 괜찮으면 null
 */
export function checkFutureDateTime(date: string, time: string, now = new Date()): [string, string] | null {
  if (!date.trim() || !time.trim()) {
    return ["입력 확인", "희망 날짜와 시간을 입력해 주세요."];
  }

  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!dateMatch) {
    return ["날짜 형식 확인", "날짜를 YYYY-MM-DD 형식으로 입력해 주세요."];
  }

  const year = Number(dateMatch[1]);
  const month = Number(dateMatch[2]);
  const day = Number(dateMatch[3]);
  const selectedDate = new Date(year, month - 1, day);

  // 2월 30일처럼 Date 가 다음 달로 넘겨 버리는 날짜 걸러내기
  if (
    selectedDate.getFullYear() !== year ||
    selectedDate.getMonth() !== month - 1 ||
    selectedDate.getDate() !== day
  ) {
    return ["날짜 확인", "실제로 존재하는 날짜를 입력해 주세요."];
  }

  const timeMatch = /^(\d{2}):(\d{2})$/.exec(time);
  if (!timeMatch) {
    return ["시간 형식 확인", "시간을 HH:mm 형식으로 입력해 주세요."];
  }

  const hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);
  if (hour > 23 || minute > 59) {
    return ["시간 확인", "올바른 시간을 입력해 주세요."];
  }

  if (new Date(year, month - 1, day, hour, minute) <= now) {
    return ["시간 확인", "현재 시각 이후의 날짜와 시간을 선택해 주세요."];
  }

  return null;
}
