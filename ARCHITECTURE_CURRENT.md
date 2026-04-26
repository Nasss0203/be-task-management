# Back Task - Current Architecture (Baseline)

## 1) Tong quan he thong

- Kieu he thong: `modular monolith`
- Runtime: `Node.js`
- Framework: `NestJS` + `TypeScript`
- Persistence: `PostgreSQL` qua `TypeORM`
- Cac module nghiep vu chinh: `auth`, `users`, `workspaces`, `projects`, `boards`, `tasks`, `roles`, `permissions`, `workspace_invites`, `comments`, `attachments`, `notifications`

He thong hien tai duoc to chuc theo huong tach module theo domain nghiep vu, thay vi tach theo technical-layer thuan.

## 2) Kieu kien truc hien tai

### System architecture

- Tong the la `modular monolith`:
  - Mot app backend duy nhat duoc deploy chung.
  - Nhieu module nghiep vu duoc dong goi rieng trong cung codebase.

### Implementation architecture

- Dang theo huong `layered architecture` (gan voi clean architecture thuc dung):
  - `controller` (vao HTTP)
  - `applications` (use-case orchestration)
  - `services` (business logic)
  - `repositories` (data access)
  - `domain/entities/models/interfaces` (mo hinh va hop dong)

- Pattern su dung ro:
  - `Dependency Injection` (providers + tokens)
  - `Repository pattern`
  - `Module pattern`
  - `Strategy pattern` trong auth (Passport strategies)

## 3) Cau truc thu muc cap cao

`src/`

- `app.module.ts`: composition root, import cac module nghiep vu
- `main.ts`: bootstrap app, global pipes/interceptors/filters
- `common/`: thanh phan dung chung
  - guards, decorators, interceptors, filters, strategies
- `database/`: cau hinh TypeORM, datasource, migrations
- `modules/`: cac bounded-context nghiep vu

Mau cau truc module thuong thay:

- `controller/`
- `applications/`
- `services/`
- `repositories/`
- `interfaces/`
- `domain/entities` + `domain/models`
- `dto/`

## 4) Luong request tong quat

1. Client goi API vao `controller`.
2. `controller` goi `application` theo use-case.
3. `application` dieu phoi `service` va `repository`.
4. `repository` thao tac DB qua TypeORM.
5. Ket qua duoc tra nguoc ve controller -> response.

Cross-cutting concern nhu auth/guard/validation duoc xu ly bo sung trong `common` va pipeline NestJS.

## 5) DDD-lite: dang o dau

Codebase co dau hieu `DDD-lite`:

- Da co module theo domain.
- Da co tach entities/models/interfaces.
- Da co abstraction qua DI tokens.

Nhung chua dat tactical DDD day du:

- Chua ro aggregate boundaries trong nhieu module.
- Chua tach manh `Entity` va `Value Object`.
- Chua thay domain events/saga/factory/specification duoc ap dung nhat quan.

=> Danh gia: huong kien truc tot cho giai doan hien tai, can bo sung test + governance de giu chat luong khi scale.

## 6) Diem manh hien tai

- Cau truc module ro, de scale team.
- Kha nang maintain tot hon code tron tang.
- De mo rong use-case moi theo module.
- Co san bo setup lint/test/type.

## 7) Diem can cai thien

- Test coverage cho business flow con thap.
- Validation DTO chua dong nhat giua cac module.
- TypeScript strictness chua cao (`noImplicitAny: false`, ...).
- Co kha nang co dependency chua dung den.
- Chua co architecture decision records (ADR) va governance rule ro rang.

## 8) Khuyen nghi baseline truoc khi cai tien

1. Chot architecture principles ngan gon cho team (1 trang).
2. Chuan hoa API input validation cho tat ca endpoint public.
3. Bao phu test cho flow auth/tasks/projects truoc.
4. Dat quality gate cho CI (lint + test + build bat buoc).

---

File nay la baseline "as-is architecture" de team thong nhat hien trang truoc khi thuc hien roadmap cai tien.

## 9) Architecture rules hiện tại

### Dependency direction

Luồng phụ thuộc chuẩn:

controller -> application -> service -> repository -> database

Quy tắc:

- Controller không chứa business logic.
- Controller không gọi repository trực tiếp.
- Application chịu trách nhiệm điều phối use-case.
- Application được phép mở transaction thông qua UnitOfWork.
- Service chứa business logic thuộc domain.
- Repository chỉ thao tác database và không xử lý business rule phức tạp.
- Repository không gọi service/application/controller.
- DTO chỉ dùng ở boundary HTTP/application, không nên lan sâu vào domain quá nhiều.

### Transaction boundary

Transaction nên đặt ở application layer khi một use-case cần ghi nhiều bảng hoặc gọi nhiều service.

Ví dụ:

- Register user -> tạo workspace mặc định -> tạo role -> tạo page/project/board/status/priority.
- Accept workspace invite -> cập nhật invite -> thêm user vào workspace -> assign role.
- Create workspace by template -> tạo workspace -> tạo page/project/board theo template.

### Error handling

- Repository có thể throw `NotFoundException` khi không tìm thấy entity nếu method mang ý nghĩa bắt buộc tồn tại.
- Service/application chịu trách nhiệm throw lỗi nghiệp vụ như conflict, forbidden, bad request.
- Controller không tự format lỗi, lỗi được xử lý bởi global exception filter.

### Validation

- DTO phải validate input public endpoint bằng `class-validator`.
- Không tin dữ liệu từ client.
- Các field như `workspaceId`, `projectId`, `boardId`, `taskId` phải được kiểm tra ownership/access ở service/application layer.
