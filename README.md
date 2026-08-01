# WebCapture

API chụp ảnh preview từ HTML hoặc URL.

## Chạy

```bash
npm install
node server.js
```

Server chạy tại `http://localhost:8080`.

## Deploy trên Render

Tạo một Web Service với:

- **Build Command:** `npm install`
- **Start Command:** `node server.js`
- **Environment:** Node

Project tự cài Chromium vào `node_modules` trong lúc build, nên không cần thêm lệnh cài browser riêng trên Render.

Nếu chạy trên Linux ngoài Replit và gặp lỗi Chromium thiếu thư viện hệ thống, chạy thêm:

```bash
npx playwright install --with-deps chromium
```

## API

```bash
curl -X POST http://localhost:8080/api/preview \
  -H "content-type: application/json" \
  -d '{"Type":"html","Source":"<h1>Hello</h1>","size":{"x":1200,"y":800}}' \
  --output preview.png
```

`Type` nhận `html` hoặc `url`. `Source` là nội dung HTML hoặc URL web. `size.x` và `size.y` là chiều rộng và chiều cao ảnh, giới hạn lần lượt là `2400` và `1600`.