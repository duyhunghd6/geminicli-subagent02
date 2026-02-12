# VISION — Hệ Thống Thu Thập & So Sánh Limit Order Book ETH/USDT

## 1. Tầm nhìn sản phẩm
Xây dựng một hệ thống backend hiệu năng cao, ổn định để thu thập, lưu trữ và phân tích dữ liệu Limit Order Book (LOB) từ các sàn giao dịch crypto hàng đầu (Binance, MEXC). Sản phẩm cung cấp dữ liệu nền tảng cho các chiến lược kinh doanh chênh lệch giá (Arbitrage) và phân tích hành vi thị trường.

## 2. Đối tượng người dùng
- Quant Traders/Developers: Cần dữ liệu LOB chất lượng cao để nghiên cứu chiến lược.
- Hệ thống Trading tự động: Sử dụng dữ liệu so sánh để tìm kiếm cơ hội Arbitrage.

## 3. Mục tiêu chính (Goals)
- **Tính chính xác**: Duy trì local order book trùng khớp với dữ liệu sàn thông qua WebSocket Diff Streams.
- **Tính thời điểm**: Snapshot dữ liệu mỗi giây (1s) với độ trễ thấp.
- **Khả năng phân tích**: Cung cấp các metrics so sánh (spread, mid-price diff, arbitrage signals) trực tiếp từ database.
- **Tính gọn nhẹ**: Sử dụng SQLite để dễ dàng triển khai và di chuyển (portable).

## 4. Phạm vi MVP (Scope)
- **Cặp giao dịch**: ETH/USDT.
- **Sàn giao dịch**: Binance (REST + WebSocket JSON) và MEXC (REST + WebSocket Protobuf).
- **Lưu trữ**: SQLite với schema tối ưu cho timeseries (Snapshots + Levels).
- **Phân tích**: So sánh chênh lệch giá (Spread) và tín hiệu Arbitrage đơn giản giữa 2 sàn.
- **Công nghệ**: Node.js, better-sqlite3, protobufjs.
