# 광고 시설 상세 1단계 (방 크기, 가격, 도면도) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 사업자가 방 크기, 가격, 도면도를 등록하고, 광고가 유효한 시설의 상세 화면에서 누구나 볼 수 있게 한다.

**Architecture:** 백엔드에 `facilitydetail` 패키지를 추가해 세 테이블을 소유권 범위로 관리한다. 공개 조회는 `FacilityService.getFacilityById`에서 광고가 유효할 때만 `FacilityResponse.premiumDetails`를 채운다. 앱은 표시와 편집을 각각 새 컴포넌트로 분리해 기존 화면에 끼운다.

**Tech Stack:** Spring Boot 3.3, MyBatis, MySQL, JUnit5/Mockito, Expo SDK 58, Expo Router, expo-document-picker

**Spec:** `docs/superpowers/specs/2026-11-03-premium-facility-details-design.md`

## Global Constraints

- 미등록 문구는 정확히 `등록한 내용이 없습니다.`
- 공개 조건: 시설 ACTIVE이고 `current_period_end > NOW()`. 기존 `premium` 계산을 그대로 쓴다.
- 광고가 유효하지 않으면 공개 API 응답에 추가 정보를 넣지 않는다.
- 다른 사업자의 시설은 404 (`NotFoundException`).
- 도면도: JPEG, PNG, PDF, 최대 20MB, 내용으로 형식 판별. 일반 사진의 5MB 제한은 유지.
- 모든 기능은 Android와 iOS에서 동작해야 한다. 네이티브 패키지와 설정은 양쪽을 확인한다.
- 가격은 방 종류별이다. 등록하지 않은 방 종류, 면적, 가격은 미등록 문구로 표시한다.
- 화면 문구와 주석은 한국어. 호출은 `apiFetch`/`apiUpload`. 패키지는 `npx expo install`.
- 테이블은 `schema.sql`에 멱등하게 추가한다.
- 사용자가 요청할 때만 커밋한다. 이 계획에는 커밋 단계가 없다.
- 실행 중인 8080 서버는 Eclipse 밖의 jar다. 테스트는 복사본에서 돌리고, `clean package`는 서버를 멈춘 뒤 실행한다.

## Review Focus

1. 구독이 만료된 시설을 공개 조회: `premiumDetails`가 null이다. (Task 3)
2. 사업자가 자기 시설 경로에 다른 시설의 도면도 id를 넣어 삭제: 404이고 파일이 남는다. (Task 2)
3. `.pdf` 이름의 실행 파일 업로드: 내용 판별로 거절된다. (Task 1)
4. 같은 거래 유형 중복, 음수 금액, 면적 0: 저장 전에 거절되고 기존 데이터가 유지된다. (Task 2)
5. 20MB를 넘는 도면도: 한국어 오류 메시지로 거절된다. `max-file-size`도 함께 올라가 있어야 서버 오류가 나지 않는다. (Task 1)

---

### Task 1: 도면도 파일 저장

**Files:**
- Modify: `demo/src/main/java/kr/tansong/demo/common/ImageStorageService.java`
- Modify: `demo/src/main/resources/application.yml:8-9`
- Test: `demo/src/test/java/kr/tansong/demo/common/ImageStorageServiceTest.java`

**Interfaces:**
- Produces: `public record StoredFloorPlan(String url, String fileType) {}` (fileType은 `IMAGE` 또는 `PDF`), `public StoredFloorPlan storeFloorPlan(Long facilityId, MultipartFile file)`

- [ ] **Step 1: 실패하는 테스트 작성.** `@TempDir` + `MockMultipartFile`:
  - `PDF_내용이면_PDF로_저장`: `%PDF-1.7` 바이트 → `fileType == "PDF"`, url이 `.pdf`로 끝남
  - `PNG_내용이면_IMAGE로_저장`
  - `확장자만_pdf인_파일은_거절`: 이름 `a.pdf`, 내용 `MZ...` → `IllegalArgumentException`
  - `WEBP는_도면도로_거절`
  - `20MB_초과는_거절`: 크기 `20*1024*1024+1` → 메시지에 `20MB`
  - `기존_사진의_5MB_제한은_유지`: 6MB → `storeFacilityImage` 거절
- [ ] **Step 2: 테스트 실패 확인.** `mvn -B -q test -Dtest=ImageStorageServiceTest` (복사본에서) → 컴파일 실패
- [ ] **Step 3: 구현.** 저장 위치 `/uploads/facilities/{facilityId}/plans/{uuid}.{ext}`. 기존 파일명, 경로 처리 방식을 재사용한다. `application.yml`의 `max-file-size: 20MB`, `max-request-size: 21MB`.
- [ ] **Step 4: 테스트 통과 확인.**

### Task 2: 등록 API

**Files:**
- Modify: `demo/src/main/resources/schema.sql`, `demo/src/main/java/kr/tansong/demo/DemoApplication.java` (`@MapperScan`에 새 mapper 패키지 추가)
- Create (`kr.tansong.demo.facilitydetail`): `dto/FacilityDetailsResponse.java`, `dto/FacilityDetailsRequest.java`, `mapper/FacilityDetailsMapper.java`, `service/FacilityDetailsService.java`
- Create: `demo/src/main/java/kr/tansong/demo/business/controller/BusinessFacilityDetailsController.java`
- Test: `demo/src/test/java/kr/tansong/demo/facilitydetail/service/FacilityDetailsServiceTest.java`

**Interfaces:**
- Consumes: `ImageStorageService.storeFloorPlan`, `deleteQuietly`, `BusinessFacilityMapper.findByIdForOwner`
- Produces:
  - `FacilityDetailsResponse { List<FloorPlan> floorPlans; List<Room> rooms; }`
  - `FloorPlan { Long id; String fileUrl; String fileType; String label; }`, `Room { Long id; String roomType; BigDecimal areaSqm; List<Price> prices; }`, `Price { String dealType; Long deposit; Long amount; }`
  - `FacilityDetailsService`: `FacilityDetailsResponse getPublic(Long facilityId)`, `getForOwner(Long facilityId, Long ownerUserId)`, `FacilityDetailsResponse replace(Long facilityId, Long ownerUserId, FacilityDetailsRequest request)`, `FloorPlan addFloorPlan(Long facilityId, Long ownerUserId, MultipartFile file, String label)`, `void deleteFloorPlan(Long facilityId, Long ownerUserId, Long planId)`
  - API: `GET`/`PUT /api/business/facilities/{facilityId}/details`, `POST /details/floor-plans` (multipart `file`, `label`), `DELETE /details/floor-plans/{planId}`

테이블 (`facility_id`는 모두 FK `ON DELETE CASCADE`):

| 테이블 | 열 |
|---|---|
| `facility_floor_plans` | `id`, `facility_id`, `file_url VARCHAR(500)`, `file_type VARCHAR(10)`, `label VARCHAR(30) NULL`, `sort_order INT` |
| `facility_rooms` | `id`, `facility_id`, `room_type VARCHAR(50)`, `area_sqm DECIMAL(6,2) NULL`, `sort_order INT` |
| `facility_room_prices` | `room_id` (FK `facility_rooms` `ON DELETE CASCADE`), `deal_type VARCHAR(10)`, `deposit BIGINT NULL`, `amount BIGINT NULL`, `UNIQUE (room_id, deal_type)` |

가격 뜻: `MONTHLY`는 deposit(0 이상)+amount(월세, 1 이상), `JEONSE`는 deposit(1 이상), `SALE`은 amount(1 이상). 금액 단위는 원, 상한 1조.

- [ ] **Step 1: 실패하는 테스트 작성.** Mockito:
  - `다른_사업자_시설은_모든_메서드가_NotFound`: `findByIdForOwner`가 null이면 네 메서드 모두 `NotFoundException`, 저장 호출 없음
  - `다른_시설의_도면도_id는_404이고_파일을_지우지_않음`
  - `한_방에서_거래유형_중복_거절`, `다른_방은_같은_거래유형_허용`, `면적과_가격이_없는_방_허용`, `MONTHLY_월세_없으면_거절`, `음수_금액_거절`, `SALE_보증금_무시하지_않고_거절`, `알수없는_거래유형_거절`
  - `면적_0_거절`, `방_이름_공백_거절`, `방_30개_초과_거절`
  - `검증_실패면_기존_데이터를_지우지_않음`: `verify(mapper, never()).deleteRooms(any())`
  - `도면도_20개_초과_거절`
  - `도면도_삭제시_파일도_삭제`
  - `빈_목록이면_모두_지움`
- [ ] **Step 2: 테스트 실패 확인.**
- [ ] **Step 3: 구현.** 저장은 `@Transactional`로 삭제 후 삽입. 테이블을 `schema.sql` 끝에 추가. 컨트롤러는 `BusinessFacilityImageController` 형태를 따른다.
- [ ] **Step 4: 테스트 통과 확인.**

### Task 3: 공개 조회

**Files:**
- Modify: `demo/src/main/java/kr/tansong/demo/facility/dto/FacilityResponse.java`, `demo/src/main/java/kr/tansong/demo/facility/service/FacilityService.java`
- Test: `demo/src/test/java/kr/tansong/demo/facility/service/FacilityServiceDetailsTest.java`

**Interfaces:**
- Consumes: `FacilityDetailsService.getPublic`
- Produces: `FacilityResponse.premiumDetails` (`FacilityDetailsResponse`, 광고가 유효하지 않으면 null)

- [ ] **Step 1: 실패하는 테스트 작성.** `광고_유효하면_premiumDetails_채움`, `광고_만료면_null이고_조회하지_않음`, `시설이_없으면_null`
- [ ] **Step 2: 테스트 실패 확인.**
- [ ] **Step 3: 구현.** `getFacilityById`에서만 채운다. 목록과 검색은 건드리지 않는다.
- [ ] **Step 4: 전체 테스트 통과 확인.** 복사본에서 `mvn -B -q test`. 기존 테스트의 생성자 변경도 함께 고친다.

### Task 4: 상세 화면 표시

**Files:**
- Create: `src/components/facility-premium-details.tsx`
- Modify: `src/app/facilities/[id].tsx`

**Interfaces:**
- Consumes: 공개 응답의 `premiumDetails`
- Produces: `export type FacilityDetails`, `export const EMPTY_TEXT = "등록한 내용이 없습니다."`, `export function FacilityPremiumDetails({ details }: { details: FacilityDetails })`

- [ ] **Step 1: 컴포넌트 구현.** 시안 순서대로 도면도, 방 크기, 가격. 사진은 누르면 `Modal`로 크게, PDF는 `Linking.openURL`. 면적은 `16㎡ (약 4.8평)`, 평은 `㎡ / 3.3058`을 소수 첫째 자리로. 가격 탭은 월세, 전세, 매매이고 탭 안에 방 종류별 가격을 보여 준다. 방이 없거나 면적, 해당 거래 유형 가격이 없으면 그 자리에 `EMPTY_TEXT`.
- [ ] **Step 2: 화면에 연결.** `premiumDetails`가 있을 때만 시설 소개 앞에 표시한다. 일반 시설과 공공데이터 시설 화면은 그대로다.
- [ ] **Step 3: 확인.** `npx tsc --noEmit`, `npx expo lint` 새 지적 없음.

### Task 5: 사업자 등록 화면

**Files:**
- Create: `src/components/business-facility-details-editor.tsx`
- Modify: `src/app/business/[id].tsx`, `package.json` (`npx expo install expo-document-picker`)

**Interfaces:**
- Consumes: Task 2 API, `FacilityDetails` 타입
- Produces: `export function BusinessFacilityDetailsEditor({ facilityId }: { facilityId: number })`

- [ ] **Step 1: 버전 문서 확인.** `https://docs.expo.dev/versions/v58.0.0/sdk/document-picker/`에서 현재 API를 확인한다.
- [ ] **Step 2: 패키지 설치.**
- [ ] **Step 3: 편집기 구현.** 도면도 추가(`image/jpeg`, `image/png`, `application/pdf`)와 삭제, 층 이름 입력. 방 종류 행 추가·삭제, 면적(선택), 방마다 거래 유형별 가격 입력, 저장 버튼. "광고 중일 때만 공개됩니다" 안내. 오류는 `alertMessage`.
- [ ] **Step 4: 화면에 연결.** 시설 사진 섹션 아래에 넣는다. 시설 사진 코드는 바꾸지 않는다.
- [ ] **Step 5: 확인.** `npx tsc --noEmit`, `npx expo lint`, `npx expo-doctor`.

### Task 6: 실제 동작 확인

- [ ] **Step 1: 서버 교체.** 서버를 멈추고 `clean package` 후 실행 설정의 환경변수로 재시작한다. 테이블 생성을 확인한다.
- [ ] **Step 2: API 확인.** 광고 중인 시설의 사업자 계정으로 등록 → 공개 조회에 보임. 다른 사업자는 404. 일반 시설은 `premiumDetails` null. PDF와 사진 실제 업로드.
- [ ] **Step 3: 브라우저 확인.** `127.0.0.1:8081`에서 등록 화면, 상세 화면, 미등록 문구 확인. 시험 데이터 정리.
- [ ] **Step 4: 사용자에게 보고.** 실제 기기 PDF 열기는 새 APK로 확인이 필요함을 알린다.
