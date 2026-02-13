# SPRINT PLAN — PI 1 Completion (Phase 3)

## Mục Tiêu Sprint
Hoàn thành Program Increment 1 (PI 1): Đảm bảo việc thu thập dữ liệu (LOB) ổn định, lưu trữ snapshot định kỳ, và thực hiện so sánh cơ bản giữa 2 sàn (Binance, MEXC).

## Phân Chia Tasks

### Dev Agent 1: Connectivity & Storage Pipeline
**Nhiệm vụ trọng tâm**: Đảm bảo đầu vào (LOB) chính xác và lưu trữ được snapshot.

1.  **Refine BI-001 & BI-002 (LOB Managers)**:
    -   Viết Unit Tests cụ thể cho `BinanceManager` và `MEXCManager` (Mock axios/ws).
    -   Kiểm tra logic xử lý Buffer và Gap detection.
    -   Đảm bảo `start()`, `fetchSnapshot()`, `handleUpdate()` hoạt động đúng flow.

2.  **Implement BI-004 (Snapshot Engine)**:
    -   Tạo `src/engine/SnapshotEngine.js`.
    -   Logic: Định kỳ 1s (setInterval) lấy `getSnapshot()` từ 2 managers.
    -   Lưu vào bảng `orderbook_snapshots` và `orderbook_levels` thông qua `database.js`.

### Dev Agent 2: Analysis & Logic
**Nhiệm vụ trọng tâm**: Xử lý dữ liệu snapshot để tìm cơ hội Arbitrage.

1.  **Implement BI-005 (Comparison Logic)**:
    -   Tạo `src/engine/ComparisonEngine.js`.
    -   Logic: Nhận đầu vào là 2 objects Snapshot (Price/Qty).
    -   Tính toán: `spread`, `mid_price`, `mid_diff_bps`, `arb_signal`.

2.  **Implement Persistence for Analysis**:
    -   Viết method trong `ComparisonEngine` (hoặc mở rộng `SnapshotEngine`) để lưu kết quả vào bảng `spread_comparisons`.
    -   Đảm bảo dữ liệu được đồng bộ thời gian (timestamp match).

## Tiêu chí Nghiệm thu (Definition of Done) cho Sprint này
-   **Coverage**: Tất cả logic mới phải có Unit Test.
-   **Build**: `npm run build` (nếu có) hoặc code valid syntax.
-   **Test**: `npm test` phải PASS 100%.
-   **Artifacts**: Handoff documents từ mỗi Dev.
