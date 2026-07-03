# Nhật ký phát triển — Note System Backend

Ghi lại quá trình dựng backend từ đầu, kèm **lý do** cho các quyết định và **những vấn đề đã gặp + cách xử lý**. Hữu ích để onboard người mới và nhớ vì sao mọi thứ được làm như vậy.

---

## 0. Khởi tạo

- Dự án tạo bằng NestJS CLI (`nest new`) trong thư mục `server/`.
- **Xoá `.git` thừa**: `nest new` tự tạo một repo git riêng bên trong `server/`. Đã xoá để tránh repo lồng repo.

---

## 1. Thiết kế cơ sở dữ liệu (Prisma)

**Quyết định**: PostgreSQL + multi-user + phân loại bằng tag.

Schema gồm 3 model với quan hệ `User ──1:N──> Note ──N:M──> Tag`:
- `id` dùng `cuid()` (chuỗi) thay vì auto-increment — không lộ số lượng bản ghi.
- Note↔Tag dùng **implicit many-to-many** của Prisma (tự sinh bảng nối) — đơn giản, không cần khai báo thủ công.
- Xoá User → cascade xoá Note của họ.

---

## 2. Kết nối Supabase — chuỗi sự cố đáng nhớ

Đây là phần tốn công nhất. Ba lỗi liên tiếp:

| Vấn đề | Nguyên nhân | Cách xử lý |
|---|---|---|
| `P1001: Can't reach database server` | Host trực tiếp `db.<ref>.supabase.co` **chỉ phân giải ra IPv6**; mạng nội bộ không có IPv6 | Chuyển sang **Connection Pooler** (có IPv4) |
| `prisma migrate dev` treo vô hạn | Dùng **Transaction pooler (port 6543)** — không hỗ trợ shadow database cho migration | Đổi sang **Session pooler (port 5432)** |
| `prisma db push` báo "Schema engine error" | Cũng do transaction pooler 6543 không chạy được DDL | Đổi port `6543 → 5432` |

**Bài học**: với Supabase + Prisma, dùng **Session pooler (5432)** cho `DATABASE_URL` là an toàn nhất cho cả runtime lẫn migration. Cuối cùng `npx prisma db push` đồng bộ schema thành công.

**Prisma 7 vs 6**: ban đầu npm cài Prisma 7 (mới nhất), nhưng Prisma 7 bỏ `url` trong `datasource` và bắt buộc `prisma.config.ts` + driver adapter — phức tạp. Đã **hạ về Prisma 6** để giữ mẫu `url = env("DATABASE_URL")` quen thuộc, đơn giản.

---

## 3. Chuẩn hoá response (main.ts)

Xây tầng `common/` để mọi API trả về nhất quán:
- **`TransformInterceptor`**: bọc response thành công vào envelope `{ success, statusCode, message, data, timestamp }`.
- **`@ResponseMessage('...')`**: decorator + `Reflector` để mỗi route đặt message riêng.
- **`AllExceptionsFilter`**: bắt mọi lỗi, trả envelope lỗi thống nhất + ghi log kèm stack.
- **`LoggingInterceptor`**: log request/response + thời gian, **chỉ bật khi dev** (`NODE_ENV !== 'production'`).
- Thêm `ValidationPipe` (whitelist + transform) và CORS.

Tất cả được đăng ký global trong `main.ts`.

---

## 4. Swagger

- Cài `@nestjs/swagger`, cấu hình `DocumentBuilder` (title, version, **BearerAuth** cho JWT), mount UI tại `/api`.
- DTO gắn `@ApiProperty`, controller gắn `@ApiTags` / `@ApiOperation` để tài liệu đầy đủ.

---

## 5. PrismaService

- `PrismaService extends PrismaClient`, tự `$connect` trong `onModuleInit` và `$disconnect` trong `onModuleDestroy`.
- `PrismaModule` đánh dấu `@Global()` → mọi module inject `PrismaService` không cần import lại.
- Thêm log xác nhận kết nối DB trong `main.ts`.

---

## 6. DTO cho Notes & Tags

- `CreateNoteDto`: `title` (bắt buộc), `content?`, `isArchived?`, `tagIds?: string[]`.
- `CreateTagDto`: `name` (bắt buộc, max 50).
- Update DTO dùng `PartialType` từ **`@nestjs/swagger`** (giữ cả validation lẫn metadata Swagger).

**Quyết định thiết kế quan trọng**: `authorId` **không** nằm trong DTO — sẽ lấy từ user đăng nhập (JWT) để client không giả mạo chủ note. DTO mô tả *cái client được phép gửi*, khác với schema (mô tả *cái DB lưu*).

Sự cố nhỏ: thiếu `@nestjs/mapped-types` khi `nest g resource` sinh code dùng `PartialType` → đã cài bổ sung.

---

## 7. Xác thực (Auth)

Lắp dần các mảnh:
- Cài `@nestjs/jwt`, `bcrypt`, `@nestjs/config`.
- **`HashPasswordService`**: `hash()` / `compare()` bằng bcrypt.
- **`JwtUtilsService`**: ký & verify token.
- **`JwtAuthGuard`**: đọc Bearer token từ header, verify, gắn `user` vào request.
- **`ConfigModule.forRoot({ isGlobal: true })`**: cần thiết vì runtime của Nest không tự đọc `.env` (trước đó chỉ Prisma tự nạp `DATABASE_URL`).

### Sự cố DI (2 lỗi liên tiếp)
1. **`UnknownExportException`**: `AuthModule` export `JwtModule` mà không import nó (đã chuyển sang AppModule).
   → Đánh dấu `JwtModule.registerAsync({ global: true })` ở AppModule, bỏ export ở AuthModule.
2. **`UnknownDependenciesException`**: `AuthService` inject `JwtUtilsService` nhưng chưa khai báo provider.
   → Thêm `JwtUtilsService` vào `providers` của AuthModule.

---

## 8. Chuẩn hoá access / refresh token

**Vấn đề**: `JwtUtilsService` hardcode `expiresIn: '15m'` / `'7d'` và cả hai token dùng **chung một secret**.

**Chuẩn hoá** (bảo mật tốt hơn):
- Tách 4 biến env: `JWT_ACCESS_SECRET` / `JWT_ACCESS_EXPIRES_IN` (15m) và `JWT_REFRESH_SECRET` / `JWT_REFRESH_EXPIRES_IN` (7d).
- `JwtUtilsService` truyền secret + hạn **riêng** cho từng loại token; thêm `verifyAccess()` / `verifyRefresh()`.
- Global `JwtModule` mặc định dùng access secret → `JwtAuthGuard` verify access token đúng mà không phải sửa guard.

**Vì sao tách secret**: nếu access secret bị lộ, refresh token vẫn an toàn.

**Kiểm chứng**: script độc lập xác nhận 2 secret khác nhau, access hết hạn 900s / refresh 604800s, và verify chéo bị từ chối đúng.

---

## 9. Hoàn thiện Auth endpoints

- `AuthService`: `register` (kiểm tra trùng email → hash → tạo user → trả tokens), `login` (so mật khẩu → ký tokens), `refresh` (verify refresh token → cấp token mới), `logout` (stateless).
- `AuthController`: map `POST /auth/register|login|refresh|logout` với `@ResponseMessage` + `@ApiOperation`.

**Kiểm chứng end-to-end** (chạy thật với DB Supabase):
- ✅ register → tạo user + trả access/refresh token
- ✅ login sai mật khẩu → 401 "Mật khẩu không chính xác"
- ✅ refresh với token hợp lệ → cấp access token mới
- ✅ refresh với token rác → 401
- User test đã được xoá khỏi DB sau khi kiểm tra.

---

## Việc còn lại (TODO)

- [ ] CRUD đầy đủ cho **Notes** (map `authorId` từ JWT + `tags: { connect }`).
- [ ] CRUD đầy đủ cho **Tags**.
- [ ] Gắn `@UseGuards(JwtAuthGuard)` + decorator `@CurrentUser()` cho các route cần bảo vệ.
- [ ] (Tuỳ chọn) Lưu refresh token trong DB để **logout thu hồi token** phía server.
- [ ] Viết test (unit/e2e) cho auth và các module.
