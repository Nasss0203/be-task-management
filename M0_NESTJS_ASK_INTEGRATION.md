# Taskmanly AI — Phase 5.1: NestJS Unified Ask API

Ngày: 2026-10-21. Branch: `feat/admin-access-foundation`.

## 1. Kết quả và phạm vi kiểm chứng

Đã triển khai backend Phase 5.1: endpoint Ask có authentication, Intent runtime
port/adapter, routing tới capability hiện có, kiểm tra nguồn Writing, gate thao
tác và forwarding current Page. Không thêm đường Apply, schema hoặc migration.

| Hạng mục | Trạng thái |
|---|---|
| Implementation NestJS Phase 5.1 | Implemented |
| Intent HTTP contract, routing và lỗi upstream | Tested with HTTP mocks |
| HTTP Ask với JWT strategy/guard, DTO, interceptor thật | Tested; repository người dùng và application service là mocks |
| Ask → Page Intent → access service → resolver → draft | Tested; dùng các service thật, repository/AI/planner là mocks |
| NestJS ↔ FastAPI đang chạy | Not yet tested |
| Frontend và M0 end-to-end | Not yet tested; ngoài phạm vi Phase 5.1 |

Không đồng nhất kết quả mock với live integration. Benchmark Ollama Phase 4
trong tài liệu FastAPI không chứng minh production accuracy 100%.

## 2. Source và tài liệu đã kiểm tra

Tài liệu: `../docs/quy trình AI/quy-trinh-thuc-hien.md`,
`page-resolution-plan-v2.md` (nguyên tắc, hiện trạng, M0, giới hạn, quyết định),
`intent-detection.md`, toàn bộ 139 dòng `intent_cases.jsonl`;
`../ai-taskmanly/M0_INTENT_ROUTER.md`, `M0_DATASET_REVIEW.md`,
`M0_REAL_MODEL_BENCHMARK.md`; `AI_PERMISSION_CONCURRENCY_AUDIT.md`.
Không tìm thấy AGENTS.md trong lượt tìm workspace.

Source NestJS dưới `src/modules/ai_assistant/`:

- Controller và controller tests; các DTO request, Generation/Preview response.
- `AiAssistantService`, `AiPageInstructionPlannerService`,
  `AiModificationPlannerService`, `AiConversationAccessService` và tests.
- Page Intent extraction service/port/types, Page Reference Resolver,
  Page Instruction Planning types và các regression liên quan.
- CreateConversation, CreateGeneration, ConfirmGeneration,
  ConfirmAiModificationPlan, DiscardGeneration; GetAiPageContext.
- FastApiAiRuntimeAdapter cùng Writing/Composition/Planner/Page Intent tests;
  repository conversation/generation và repository tests.
- `ai-assistant.module.ts`, `ai-assistant.types.ts`.

Đối chiếu thêm `src/main.ts`, global guards trong `src/app.module.ts`,
JwtAuthGuard/JwtStrategy, rate limit decorators, TransformInterceptor.
FastAPI: Intent schema/router, Page Intent schema/reference evidence,
Intent source rules và shared request limits. Chỉ đọc các repo lân cận.

## 3. Kế hoạch đã thực hiện

1. Chụp Git status, xác nhận branch và chạy baseline AI.
2. Viết/chạy regression trước implementation: port/service chưa tồn tại và
   dedicated planner cũ chấp nhận cả xóa/đổi tên, vẫn trả INSERT draft.
3. Thêm Intent port/types, DTO và service Ask; mở rộng adapter và DI.
4. Tái sử dụng submit, CreateConversationHandler, Page Instruction Planner,
   resolver, preview và các endpoint Confirm/Discard hiện có.
5. Đặt policy chung trước planner generation, kiểm tra cả original/extracted
   instruction; mở rộng currentPageId optional xuyên suốt Page Intent.
6. Kiểm thử HTTP, authorization, budget UTF-8 và các nhánh nghiệp vụ;
   chạy AI suite, full suite, build, scoped lint, review diff.

Rủi ro chính: conversation khác workspace/scope, model bịa Page ID hoặc đổi
thao tác unsupported thành INSERT, current Page lấn át explicit title, Writing
dịch chính câu lệnh, và thay đổi response cũ. Các lớp kiểm tra tương ứng được
giữ ở application/adapter; resolver, executor và Confirm không bị viết lại.

## 4. API cho Frontend Phase 5.3

`POST /api/v1/ai-assistant/ask`, JWT Bearer như API hiện có.
`main.ts` dùng global prefix `api` và URI version mặc định `1`; controller chỉ
khai báo `ai-assistant` + `ask`. WriteRateLimit hiện có: 80 request/phút.

```json
{
  "workspaceId": "550e8400-e29b-41d4-a716-446655440000",
  "instruction": "Thêm checklist QA vào trang Q4",
  "selectedText": null,
  "currentPageId": null,
  "selectedPageId": null,
  "conversationId": null,
  "requestId": null
}
```

workspaceId bắt buộc UUID. instruction nonblank, tối đa 4000 ký tự;
selectedText optional/null, nonblank khi có, tối đa 8000 ký tự.
Các ID optional/null phải là UUID khi có. Field lạ, userId và capability trong
body bị global ValidationPipe từ chối. UserId luôn lấy từ `@Auth()`.
shareToken chỉ nhận từ query và chuyển cho permission services như API cũ;
không được coi là quyền mặc định. requestId thiếu/null được backend sinh UUID.

Tổng JSON compact UTF-8 gửi Intent tối đa 10000 bytes, có tính currentPageId
và JSON overhead; không truncate. Trước submit còn kiểm tra payload thực tế
của Writing/Composition và context Composition tối đa 8000 bytes.

Response HTTP 201 dùng envelope hiện có:

```json
{
  "statusCode": 201,
  "message": "AI request processed",
  "data": {
    "requestId": "backend-or-client-request-uuid",
    "intent": "OTHER",
    "status": "UNSUPPORTED_REQUEST",
    "capability": null,
    "reason": "M0_CAPABILITY_UNAVAILABLE",
    "assistantMessage": "Yêu cầu này chưa được hỗ trợ trong phiên bản hiện tại."
  }
}
```

Frontend đọc `data`, phân nhánh theo `status` và `capability`:

| Status | Nội dung nghiệp vụ |
|---|---|
| GENERATION_CREATED | capability, conversationId, generationId, generation là AiGenerationResponseDto cũ; Composition preview nằm ở generation.preview; Writing text ở generation.output_data.text |
| PLAN_GENERATED | capability=GENERATE_PAGE_MODIFICATION_PLAN, planning giữ result cũ; có conversationId, generationId và preview ở top-level |
| PLAN_NEEDS_MORE_CONTEXT | Như nhánh plan nhưng không có thao tác executable; cần hiển thị contextRequests, không Confirm |
| AMBIGUOUS_PAGE | planning.candidates chỉ chứa Page có quyền; gửi lại cùng instruction và selectedPageId người dùng chọn |
| PAGE_NOT_FOUND | planning chứa kết quả tìm trang; không tạo Generation |
| NEEDS_CLARIFICATION | reason ở top-level khi capability=null; ở planning.reason nếu đến từ Page Intent |
| UNSUPPORTED_REQUEST | OTHER chưa có capability; không dùng Writing để giả lập general QA |
| UNSUPPORTED_OPERATION | Gate từ chối; reason top-level hoặc planning.reason tùy giai đoạn kiểm tra |
| NOT_A_PAGE_MODIFICATION | Page Intent không xác nhận sửa trang; giữ planning result, không generation |

Mọi nhánh có requestId, intent và assistantMessage. Các ID trong Generation,
conversation, Page/candidates là kết quả backend/repository, không phải ID do
Intent Router sinh. Nhánh không có Generation không tạo history giả.

Xem lại lịch sử qua API conversation/messages/generations hiện có. Confirm
và Discard qua `POST /api/v1/ai-assistant/generations/:generationId/confirm`
và `/discard`; Composition giữ body teamspaceId/parentPageId như cũ.
Writing là suggestion; Confirm hiện có không hỗ trợ Writing. Frontend chỉ hiện
Confirm cho Composition/Modification plan sẵn sàng và luôn yêu cầu thao tác
tường minh từ người dùng. Không có auto-confirm/auto-apply.

## 5. Intent adapter

`AiIntentPort.classify()` không phụ thuộc NestJS HTTP classes.
Token `AI_ASSISTANT_TYPES.ports.AiIntent` dùng `useExisting` trỏ cùng runtime
adapter. Không tạo HTTP client hay cấu hình token mới.

Adapter POST `/internal/v1/intent` qua `post()` hiện có, giữ base URL,
X-Internal-Service-Token và timeout. Validate chính xác envelope
result/provider/model và nested intent/writingAction/language/needsClarification.
Enum lạ, field thiếu/lạ, pageId/title/editing instruction, sai kiểu hoặc tổ hợp
Writing/language đều fail closed bằng 502. TRANSLATE language=null được giữ
đúng schema FastAPI nhưng Ask sẽ hỏi lại. UNCLEAR phải needsClarification=true.

Giữ mapping cũ: upstream HTTP 401/422/502/503/504 → NestJS 502; timeout Axios
→ 504; network không có response → 503. Không forward raw upstream body.
Không log token/source/raw output; có regression giám sát Logger/console.

## 6. Orchestration và conversation

Ask kiểm tra workspace read trước AI. currentPageId nếu có phải qua PAGE_READ
và thuộc workspace đã chọn. Conversation supplied phải thuộc user, đúng
workspace, active và không LEGACY; tiếp tục qua AiConversationAccessService.

- CREATE_PAGE → GENERATE_PAGE_COMPOSITION → submit; conversation GLOBAL.
  Không chuyển PAGE conversation thành GLOBAL. Khi thiếu conversation dùng
  CreateConversationHandler. Selected text nếu có được đưa vào context dữ liệu.
- WRITING → sáu capability writing.* hiện có. Selected text ưu tiên;
  inline chỉ nhận dạng source rõ ràng sau dấu hai chấm ngoài ngoặc hoặc một
  đoạn quoted duy nhất. Page title không là source; không tự tải Page content.
  TRANSLATE đối chiếu canonical language với đích trong directive gốc, không
  lấy language từ selected/inline data. Không có default language.
- MODIFY_PAGE → gate → AiPageInstructionPlannerService. Khi supplied
  conversation phải PAGE; planner cũ kiểm tra workspace/Page/ownership trong
  transaction sau authorized resolution. Khi thiếu dùng luồng planner cũ.
- OTHER/UNCLEAR/needsClarification → business response, không submit/planner
  generation, không tạo Page hoặc conversation giả.

requestId được giữ ở response, message metadata và generation input. Đây là
correlation ID theo flow hiện có, không bổ sung idempotency/deduplication.

## 7. Unsupported operation gate

Policy application dùng positive insertion grammar + supported content/row
objects, phân tách các mệnh đề ghép, kiểm tra toàn bộ suffix bằng allowlist.
Quoted labels/titles là dữ liệu; câu `Thêm heading "Delete Account"` được nhận.
Các verb mutation khác ngoài quotes bị chặn thêm. Không chỉ là blacklist regex.

Gate chặn update/delete/rename/rewrite/translation/move/reorder và mệnh đề
unknown trước mọi Modification Planner generation. Tạo database/table mới
cũng chưa được planner hỗ trợ; chỉ thêm dòng vào database sẵn có. Không đổi
yêu cầu đó thành INSERT hoặc CREATE_DATABASE_ROWS thay thế.

Policy áp dụng ở Ask, ở Page Instruction Planner cho cả original/extracted
instruction, và tại entry point AiModificationPlannerService.generate().
Dedicated endpoint theo pageId không bypass được: trả 422 với status
UNSUPPORTED_OPERATION; from-instruction có business result tương ứng.
Không đổi payload thành công của endpoint cũ.

Giới hạn có chủ đích: M0 grammar bảo thủ, một số cách diễn đạt hợp lệ vẫn bị
từ chối; tên/nội dung tự do nên đặt trong ngoặc kép. Không tuyên bố hỗ trợ mọi
câu natural language hoặc toàn bộ thao tác MODIFY_PAGE trong dataset.

## 8. Current Page và Confirm safety

PageIntentExtractor/extraction service/adapter nhận currentPageId optional;
caller cũ chỉ truyền instruction vẫn gọi/gửi contract cũ. Page Instruction
Planner forward context này. Adapter chỉ nhận implicit CURRENT_PAGE khi có
currentPageId và bằng chứng insertion được hỗ trợ; explicit current markers
giữ tương thích. Named Page không được model redirect thành CURRENT_PAGE.

Resolver hiện có vẫn ưu tiên explicit TITLE, kiểm tra workspace/PAGE_READ,
lọc candidates và chỉ nhận selectedPageId từ tập authorized mới nhất.
Planner target mismatch vẫn bị từ chối. Không fuzzy auto-select.

Confirm, fingerprint, stale rejection, UnitOfWork, PersistenceContext,
transaction locks và permission writer serialization Phase 1 giữ nguyên.
Không sửa resolver, executor hoặc Confirm/Discard handlers.

## 9. File Phase 5.1

Tạo mới dưới `src/modules/ai_assistant/`:

1. application/ports/ai-intent.port.ts
2. application/dto/request/ask-ai.request.dto.ts
3. application/dto/response/ai-ask.response.ts
4. application/services/ai-ask.service.ts
5. application/services/ai-instruction-evidence.ts
6. application/services/ai-modification-operation.policy.ts
7. application/services/ai-writing-source.ts
8. application/services/ai-ask.service.spec.ts
9. application/services/ai-ask-page-routing.spec.ts
10. application/services/ai-modification-operation.policy.spec.ts
11. application/services/ai-writing-source.spec.ts
12. infrastructure/runtime/fast-api-intent.adapter.spec.ts
13. presentation/http/controllers/ai-ask.http.spec.ts

Sửa 12 file đã có: module, DI types; page-intent port/extraction service,
page-instruction-planning types; modification planner và tests;
page-instruction planner và tests; FastAPI adapter; controller và tests.
Thêm báo cáo này ở root backend. Không sửa package.json trong Phase 5.1.

## 10. Verification

- Baseline AI trước implementation: 37 suites PASS, 341 tests PASS,
  21 PostgreSQL opt-in tests SKIP thuộc 2 suites.
- Targeted regression sau implementation: 12 suites, 257 tests PASS.
- AI Backend: 43 suites PASS, 500 tests PASS, 21 PostgreSQL opt-in SKIP.
- Backend build: PASS; chỉ build CLI/migration artifacts, không chạy migration
  trên database ứng dụng.
- ESLint 13 file TypeScript mới: PASS, 0 errors/warnings, dùng cấu hình repo
  và --max-warnings 0. Lint chỉ sửa format trong file mới/đoạn đã thay đổi.
- Scoped lint các file cũ có lỗi baseline; không tuyên bố toàn lint PASS.
  Đối chiếu source HEAD bằng ESLint lintText: các file này có tổng 200 errors,
  5 warnings từ trước, chủ yếu formatting và test doubles chưa typed. Không
  mass-format hoặc sửa mocks ngoài phạm vi để làm xanh lint.
- git diff --check: PASS.

Full backend suite cuối: 139 suites PASS, 4 FAIL, 2 SKIP; 1259 tests PASS,
8 FAIL, 22 SKIP. Vì vậy không tuyên bố full backend suite PASS.
Sáu lỗi ngoài AI khớp baseline đã được tái hiện trên HEAD trong audit
Phase 1: PermissionGuard mocks (4), template listing thiếu findByIdForUpdate
(1), internal template render missing-config fixture (1). Không sửa các file đó.
Hai lỗi initdb dưới sandbox được kiểm chứng bằng chạy lại riêng suite migration
ngoài sandbox: 7/7 PASS trên PostgreSQL 18 tạm/cô lập. Đây không phải test
live AI và không phải migration database business.

Lệnh chính được thực thi bằng npm.cmd/npx.cmd vì PowerShell chặn các wrapper
.ps1; không thay execution policy:

```powershell
npx.cmd jest src/modules/ai_assistant --runInBand --silent
npx.cmd jest --runInBand --silent
npx.cmd jest --runInBand --silent --runTestsByPath src/database/migration-workflow.spec.ts
npm.cmd run build
git diff --check
```

Lệnh migration test thứ ba được chạy lại ngoài sandbox trên cluster tạm.
Targeted gồm 12 suite adapter/Ask/Writing/policy/Page Intent/planner/controller.
ESLint chạy scoped với cấu hình repo; so sánh baseline dùng source lấy qua
`git show HEAD:<path>` rồi ESLint API lintText, không checkout/reset source.
Kết quả lint các file cũ: HEAD=200 errors/5 warnings, current=200/5.

## 11. Git safety

Git status trước sửa có package.json; bốn file AI lock/concurrency;
hai repository Page Share/settings; audit và bốn file fixture/helper untracked.
Các thay đổi Phase 1 đó được giữ nguyên. Chỉ thêm/sửa source backend đã liệt kê.

Không git add/commit/push/merge/reset/stash/clean; không sửa .env, token,
FastAPI/frontend, schema hoặc dữ liệu business. File mới còn untracked và
file sửa còn unstaged để người dùng review.

## 12. Remaining risks và Phase 5.2

Chưa đo latency/accuracy của Ask với FastAPI/Ollama thật, chưa chạy frontend
end-to-end và không chạy lại các PostgreSQL opt-in concurrency tests Phase 1
trong Phase 5.1. Các test Confirm/fingerprint/race hiện có vẫn PASS trong AI
suite; không thay thế chúng bằng mock integration mới.

Phase 5.2 cần được cho phép riêng: cấu hình AI_INTERNAL_TOKEN đồng bộ hợp lệ
giữa hai runtime, giữ token validation, dùng môi trường cô lập và Page thử có
quyền rõ ràng để kiểm chứng preview/confirm/discard thật. Không dùng APP_ENV=test
để chạy development runtime và không tái sử dụng mock tests làm bằng chứng live.

Không tự triển khai Phase 5.2, Frontend Phase 5.3 hoặc các milestone tiếp theo.
