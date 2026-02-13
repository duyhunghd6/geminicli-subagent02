# Lựa Chọn Công Nghệ (Tech Stack) & Thiết Kế Chi Tiết

## 1. Architecture Decision Records (ADR)

### 1.1 Ngôn ngữ lập trình: Node.js
- **Lý do**: Xử lý I/O bất đồng bộ cực tốt cho các kết nối WebSocket đồng thời. Cộng đồng hỗ trợ mạnh mẽ cho Crypto (Binance SDK, MEXC Protobuf).
- **Lựa chọn thay thế**: Go hoặc Python (Tuy nhiên Node.js phù hợp hơn với yêu cầu sử dụng các thư viện JS hiện có).

### 1.2 Cơ sở dữ liệu: SQLite (better-sqlite3)
- **Lý do**: Đơn giản (Single file), không cần quản lý server phức tạp, hiệu năng cực cao khi ghi dữ liệu cục bộ. Chế độ WAL giúp hỗ trợ tốt việc vừa ghi snapshot vừa đọc phân tích.
- **Lựa chọn thay thế**: TimescaleDB (Quá mức cần thiết cho MVP), MongoDB (Không tối ưu cho dữ liệu quan hệ/timeseries đơn giản).

### 1.3 Giao tiếp MEXC: Protobuf (Binary)
- **Lý do**: MEXC cung cấp stream Protobuf giúp giảm băng thông và tăng tốc độ xử lý so với JSON.
- **Thư viện**: `protobufjs`.

## 2. Thiết Kế Database Schema (ERD)

### 2.1 Bảng `orderbook_snapshots` (Metadata)
- Lưu thông tin tổng quát của mỗi giây chụp snapshot.
- Key Metrics: `best_bid`, `best_ask`, `mid_price`, `spread`.

### 2.2 Bảng `orderbook_levels` (Chi tiết)
- Lưu Top 20 levels của mỗi sàn.
- Quan hệ 1-n với `orderbook_snapshots`.

### 2.3 Bảng `spread_comparisons` (Phân tích)
- Lưu dữ liệu đã được tính toán sẵn để so sánh giữa 2 sàn.
- Chỉ số quan quan trọng: `mid_diff_bps`, `arb_buy_bn`, `arb_buy_mx`.

## 3. API & Data Contracts

### 3.1 Cấu trúc Dữ liệu Chuẩn hóa (Internal)
Mọi dữ liệu từ các sàn khác nhau sẽ được chuẩn hóa về định dạng sau trước khi xử lý:
```javascript
{
  exchange: 'binance',
  symbol: 'ETHUSDT',
  timestamp: 1700000000000,
  bids: [[price, qty], ...],
  asks: [[price, qty], ...],
  version: 12345678
}
```

### 3.2 Các Quy tắc Xử lý Dữ liệu
- **Độ chính xác**: Sử dụng `BigInt` hoặc xử lý string cho giá/khối lượng để tránh lỗi làm tròn số thực (floating point) trước khi lưu DB dưới dạng `REAL`.
- **Timestamp**: Sử dụng Unix Timestamp Milliseconds của hệ thống tại thời điểm nhận được dữ liệu để đảm bảo tính đồng nhất khi so sánh.
