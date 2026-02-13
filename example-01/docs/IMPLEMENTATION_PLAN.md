# Kế Hoạch Triển Khai (Implementation Plan)

## 1. Phân Chia Sprint

Dự án được chia làm 4 Sprint (mỗi Sprint tập trung vào một nhóm tính năng cốt lõi).

### Sprint 1: Foundation & Exchange Connectivity
- **Mục tiêu**: Thiết lập dự án và kết nối thành công WebSocket với 2 sàn.
- **Tasks**:
  1. Khởi tạo Project (npm init, dependencies, folder structure).
  2. Implement `BinanceManager`: REST Snapshot + WS Diff updates.
  3. Implement `MEXCManager`: REST Snapshot + WS Protobuf updates.
  4. Unit test cho việc duy trì Local Order Book.

### Sprint 2: Data Persistence & Pipeline
- **Mục tiêu**: Lưu trữ dữ liệu snapshot vào SQLite thành công.
- **Tasks**:
  1. Thiết kế và implement Database Module (`better-sqlite3`).
  2. Xây dựng `SnapshotEngine`: Chụp dữ liệu 1s/lần từ bộ nhớ.
  3. Xây dựng `DataNormalizer`: Chuẩn hóa format 2 sàn.
  4. Implement Database Writer: Lưu Top 20 levels.

### Sprint 3: Analysis & Logic
- **Mục tiêu**: Tính toán chênh lệch và tín hiệu Arbitrage.
- **Tasks**:
  1. Xây dựng `ComparisonEngine`: So sánh dữ liệu giữa 2 sàn.
  2. Tính toán các metrics: spread, mid_diff_bps, arb signals.
  3. Lưu trữ kết quả so sánh vào bảng `spread_comparisons`.
  4. Viết các query báo cáo cơ bản.

### Sprint 4: Hardening & Finalization
- **Mục tiêu**: Đảm bảo hệ thống chạy ổn định và đầy đủ tài liệu.
- **Tasks**:
  1. Implement cơ chế Auto-reconnect với Exponential Backoff.
  2. Thêm Logging toàn diện (Pino) và Error Handling.
  3. Viết script dọn dẹp dữ liệu cũ (Retention policy).
  4. Hoàn thiện tài liệu Handoff và hướng dẫn sử dụng.

## 2. Dependencies giữa các Task
- Cần hoàn thành `LOB Managers` (Sprint 1) trước khi làm `Snapshot Engine` (Sprint 2).
- Cần có dữ liệu trong DB (Sprint 2) để thực hiện `Comparison Engine` (Sprint 3).

## 3. Đánh giá Rủi ro (Risk Assessment)

| Rủi ro | Mức độ | Giải pháp giảm thiểu |
| :--- | :--- | :--- |
| **Mất đồng bộ dữ liệu** | Cao | Kiểm tra `version` liên tục, nếu phát hiện gap phải dừng và re-snapshot ngay lập tức. |
| **Băng thông/CPU quá tải** | Trung bình | Chỉ lưu Top 20 levels thay vì toàn bộ book. Dùng SQLite WAL mode. |
| **Sai lệch clock hệ thống** | Thấp | Sử dụng cùng một nguồn thời gian hệ thống duy nhất cho cả 2 sàn khi snapshot. |
| **Rate Limit** | Trung bình | Chỉ dùng REST API khi khởi tạo hoặc lỗi kết nối. |

## 4. Định nghĩa Hoàn thành (Definition of Done)
- Code vượt qua tất cả unit tests.
- Dữ liệu được lưu vào DB đúng định dạng và tần suất 1s.
- Có tài liệu hướng dẫn chạy hệ thống.
