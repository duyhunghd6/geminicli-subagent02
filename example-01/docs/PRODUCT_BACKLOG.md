# PRODUCT BACKLOG — LOB Collector & Comparator

## Danh sách User Stories

| ID | Tiêu đề | Mô tả | Acceptance Criteria (AC) | Priority | SP |
|:---|:---|:---|:---|:---|:---|
| **BI-001** | Kết nối & Duy trì LOB Binance | AS A System<br>I WANT to maintain a local LOB for Binance ETH/USDT<br>SO THAT I have real-time depth data. | **GIVEN** Binance REST & WS endpoints<br>**WHEN** System starts<br>**THEN** It fetches snapshot, subscribes to @depth@100ms, and applies updates correctly without gaps. | P0 | 5 |
| **BI-002** | Kết nối & Duy trì LOB MEXC (Protobuf) | AS A System<br>I WANT to maintain a local LOB for MEXC ETH/USDT using Protobuf<br>SO THAT I have real-time depth data. | **GIVEN** MEXC REST & WS Protobuf endpoints<br>**WHEN** System starts<br>**THEN** It decodes binary messages, fetches snapshot, and maintains local book with version validation. | P0 | 8 |
| **BI-003** | Khởi tạo Lưu trữ SQLite | AS A Developer<br>I WANT to have a structured SQLite database<br>SO THAT I can store snapshots and levels efficiently. | **GIVEN** Schema design in YEU-CAU.md<br>**WHEN** System initializes<br>**THEN** Tables `orderbook_snapshots`, `orderbook_levels`, `spread_comparisons` are created with indexes. | P1 | 3 |
| **BI-004** | Cơ chế Snapshot 1s | AS A System<br>I WANT to take a snapshot of both LOBs every second<br>SO THAT I can record market state for later analysis. | **GIVEN** Active LOB managers for BN and MX<br>**WHEN** Every 1000ms passes<br>**THEN** System captures top 20 levels from both and writes to DB. | P1 | 5 |
| **BI-005** | So sánh & Tính toán Spread | AS A Quantitative Analyst<br>I WANT to compare the best bid/ask and mid-price between 2 exchanges<br>SO THAT I can identify arbitrage opportunities. | **GIVEN** Snapshots from both exchanges at the same timestamp<br>**WHEN** Data is processed<br>**THEN** Calculate mid_diff, spread_bps, and arb signals (Buy BN/Sell MX or vice versa). | P1 | 5 |
| **BI-006** | Xử lý lỗi & Kết nối lại | AS A System<br>I WANT to automatically reconnect when WebSocket drops<br>SO THAT data collection is continuous. | **GIVEN** A network failure or socket close<br>**WHEN** Connection is lost<br>**THEN** System triggers exponential backoff reconnect and re-snapshots LOB. | P2 | 3 |
| **BI-007** | Truy vấn Báo cáo & Phân tích | AS A User<br>I WANT to query historical spread and arbitrage signals<br>SO THAT I can evaluate exchange performance. | **GIVEN** Data in `spread_comparisons`<br>**WHEN** User runs a query for the last hour<br>**THEN** Return mid_diff_bps and arbitrage signals sorted by time. | P2 | 3 |

**Ghi chú:**
- SP: Story Points (ước lượng tương đối).
- Tổng SP: 32.
