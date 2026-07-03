# Note System — Backend API

Backend cho **hệ thống note lưu trữ**: người dùng đăng ký/đăng nhập, tạo và quản lý ghi chú (note), phân loại note bằng tag. Xây dựng bằng **NestJS + Prisma + PostgreSQL (Supabase)**.

---

## Công nghệ

| Thành phần | Phiên bản | Vai trò |
|---|---|---|
| [NestJS](https://nestjs.com) | 11 | Framework backend (module hoá, DI) |
| [Prisma](https://www.prisma.io) | 6 | ORM + migration cho PostgreSQL |
| PostgreSQL (Supabase) | — | Cơ sở dữ liệu |
| `@nestjs/jwt` + `bcrypt` | 11 / 6 | Xác thực JWT + băm mật khẩu |
| `@nestjs/config` | 4 | Nạp biến môi trường từ `.env` |
| `@nestjs/swagger` | 11 | Tài liệu API tự động |
| `class-validator` / `class-transformer` | — | Validate & biến đổi dữ liệu đầu vào |

---

## Tính năng

- ✅ **Xác thực**: đăng ký, đăng nhập, làm mới token, đăng xuất — access token (15m) + refresh token (7d) với **secret riêng biệt**.
- ✅ **Response chuẩn hoá**: mọi API trả về một envelope thống nhất (thành công & lỗi).
- ✅ **Validation tự động** cho dữ liệu đầu vào qua DTO.
- ✅ **Tài liệu Swagger** tại `/api`.
- ✅ **Logging HTTP** khi phát triển (request/response + thời gian).
- 🚧 **Notes / Tags**: đã dựng khung module + DTO + schema; phần CRUD service đang phát triển.

---

## Cấu trúc thư mục

```
server/
├── prisma/
│   └── schema.prisma            # Model User, Note, Tag
├── src/
│   ├── main.ts                  # Bootstrap: pipe, interceptor, filter, Swagger
│   ├── app.module.ts            # Module gốc (ConfigModule, JwtModule global, Prisma, Auth, Notes, Tags)
│   ├── common/                  # Tầng dùng chung
│   │   ├── decorators/          # @ResponseMessage()
│   │   ├── interceptors/        # TransformInterceptor, LoggingInterceptor
│   │   └── filters/             # AllExceptionsFilter
│   ├── prisma/                  # PrismaModule (global) + PrismaService
│   └── modules/
│       ├── auth/                # Đăng ký/đăng nhập/refresh, JWT, hash, guard
│       ├── notes/              # Module note (đang phát triển)
│       └── tags/               # Module tag (đang phát triển)
└── .env                         # DATABASE_URL, JWT secrets (KHÔNG commit)
```

---

## Cài đặt & chạy

### Yêu cầu
- Node.js 18+
- Một database PostgreSQL (khuyến nghị Supabase)

### Các bước

```bash
cd server
npm install
```

Tạo file `.env` trong thư mục `server/`:

```env
# Kết nối PostgreSQL — dùng Session pooler (port 5432) của Supabase
DATABASE_URL="postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres"

# JWT — access & refresh dùng secret RIÊNG
JWT_ACCESS_SECRET="<chuỗi ngẫu nhiên đủ dài>"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_SECRET="<chuỗi ngẫu nhiên khác>"
JWT_REFRESH_EXPIRES_IN="7d"
```

Đồng bộ schema vào database:

```bash
npx prisma db push      # đẩy schema thẳng vào DB (dev)
# hoặc: npx prisma migrate dev --name init   (có lịch sử migration)
```

Chạy server:

```bash
npm run start:dev       # chế độ watch
```

- API: `http://localhost:4000`
- **Swagger UI**: `http://localhost:4000/api`

> ⚠️ **Supabase**: dùng **Session pooler (port 5432)** cho `DATABASE_URL`. Kết nối trực tiếp `db.<ref>.supabase.co` chỉ hỗ trợ IPv6 (nhiều mạng không tới được), và Transaction pooler (6543) không chạy được `prisma migrate`/`db push`.

---

## Cơ sở dữ liệu

```
User ──1:N──> Note ──N:M──> Tag
```

- **User**: `id`, `email` (unique), `name?`, `password` (đã băm), timestamps.
- **Note**: `id`, `title`, `content?`, `isArchived`, `authorId`, `tags[]`, timestamps.
- **Tag**: `id`, `name` (unique), `notes[]`.

Quan hệ Note↔Tag là **implicit many-to-many** của Prisma (tự sinh bảng nối).

---

## Định dạng response

**Thành công:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Đăng nhập thành công",
  "data": { },
  "timestamp": "2026-07-03T..."
}
```

**Lỗi:**
```json
{
  "success": false,
  "statusCode": 401,
  "message": "Mật khẩu không chính xác",
  "error": "Unauthorized",
  "path": "/auth/login",
  "timestamp": "2026-07-03T..."
}
```

---

## API xác thực

| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/auth/register` | Đăng ký (email, password, name?) → trả user + tokens |
| POST | `/auth/login` | Đăng nhập → trả user + tokens |
| POST | `/auth/refresh` | Cấp token mới từ `refreshToken` |
| POST | `/auth/logout` | Đăng xuất (stateless — client tự xoá token) |

> **Ghi chú**: logout hiện là stateless. Muốn thu hồi token phía server cần bổ sung nơi lưu refresh token trong DB.

---

## Script hữu ích

```bash
npm run start:dev     # chạy watch mode
npm run build         # build production
npx tsc --noEmit      # kiểm tra kiểu (typecheck)
npx prisma studio     # xem/sửa dữ liệu bằng GUI
npx prisma generate   # sinh lại Prisma Client
```
