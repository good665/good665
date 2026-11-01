# 프로젝트별 검토 기준 (시니어라이프)

- **API 호출**: 백엔드 호출은 `fetch`를 직접 쓰지 않고 `src/lib/api.ts`의 `apiFetch`를 사용해야 합니다.
- **토큰 저장**: 토큰은 `src/lib/storage.ts`를 통해서만 저장합니다 (네이티브는 SecureStore, 웹은 localStorage).
- **라우트 가드**: 로그인이 필요한 라우트는 화면 안에서 막지 않고 `src/app/_layout.tsx`의 `needsLogin`에 추가합니다.
- **역할 권한**: 관리자 화면은 `/api/admin/**`, 사업자 화면은 `/api/business/**`만 호출합니다. 사업자 화면에 승인/반려 같은 상태 변경 UI가 있으면 안 됩니다.
- **UI 문구**: 화면 문구와 코드 주석은 한국어로 작성합니다.
