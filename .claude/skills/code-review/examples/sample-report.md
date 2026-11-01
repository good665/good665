# 리뷰 보고 예시

- **심각도**: 높음
- **위치**: `src/app/consultations/new.tsx:42`
- **문제**: `fetch`로 백엔드를 직접 호출해서 인증 토큰이 붙지 않고, 401 응답 시 자동 로그아웃도 동작하지 않습니다.
- **개선안**: `apiFetch("/api/consultations", { method: "POST", body: ... })`로 교체합니다.
