# Waterpoint Next.js Frontend

Next.js frontend cho site Waterpoint (Nam Long Group, Bến Lức – Long An; ERA Vietnam
độc quyền phân phối Aquaria & Park Village), chuyển từ bản static
`WP-THUCTE-VERCEL-20260912` sang kiến trúc wrapper giống `D:\ERA\PGBL`.

## Kiến trúc

- **Next.js 16 (App Router) + React 19 + Tailwind v4**, TypeScript, dev port **1236**.
- 3 tab là các trang HTML tĩnh + krpano (360°) đặt trong `public/waterpoint/`,
  được nhúng qua iframe full màn hình (`WaterpointFrame`), forward nguyên query string:
  - `/` → `public/waterpoint/index.html` — **Thực tế** (7 cảnh flycam thật, có điểm nối)
  - `/tong-quan/` → `public/waterpoint/tong-quan/index.html` — **Tổng quan** (8 phân khu + 20 POI)
  - `/giohang/` → `public/waterpoint/giohang/index.html` — **Giỏ hàng** (góc nhìn nadir, lớp mã lô gắn sau)
- `next.config.ts`: `trailingSlash: true`, `images.unoptimized: true`.
- 404 tự redirect về trang chủ.

## Lệnh

```bash
npm install
npm run dev     # http://localhost:1236
npm run build
npm run start
```

## Ghi chú

- Ảnh panorama tiles rất nặng (~80 MB) — nằm trong `public/waterpoint/pano/`, đã
  gitignore? KHÔNG, cần commit để deploy. Nếu repo Git lớn, cân nhắc Git LFS.
- Tham số `?tool=1` (tool chấm điểm bay nội bộ) hoạt động bình thường qua iframe.
- `skin/logo-era.png` hiện thiếu ở bản gốc → logo góc trái không hiển thị
  (trang tự remove qua `onerror`). Cần bổ sung file này vào `public/waterpoint/skin/`.
