# WebCapture

API chụp ảnh preview từ HTML hoặc URL.

## Chạy

```bash
npm install
node server.js
```

Server chạy tại `http://localhost:8080`.

## API

```bash
curl -X POST http://localhost:8080/api/preview \
  -H "content-type: application/json" \
  -d '{"Type":"html","Source":"<h1>Hello</h1>","size":{"x":1200,"y":800}}' \
  --output preview.png
```

`Type` nhận `html` hoặc `url`. `Source` là nội dung HTML hoặc URL web. `size.x` và `size.y` là chiều rộng và chiều cao ảnh, giới hạn lần lượt là `2400` và `1600`.