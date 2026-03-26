# Milestones

## v1.0 Portfolio MVP (Shipped: 2026-03-26)

**Phases completed:** 2 phases, 3 formal plans + 8 quick tasks
**Files changed:** 76 | **Timeline:** 2026-03-09 → 2026-03-26 (17 days)
**Git range:** `feat(01-01)` → `quick-8`

**Key accomplishments:**
- `POST /api/query` endpoint with 200-entry FIFO SHA-256 cache, deprecating `/api/chat`
- Memory safety: `topicCache` capped at 100 entries, `conversations` Map at 200 / 20 msgs per conversation
- Vercel + Railway deployment — cross-origin session cookies, trust proxy, GET /health, deploy configs
- ColdStartBanner (3s delay + exponential backoff) and three-state RateLimitBanner (info/warning/blocked)
- ReactFlow ERD visualizer with FK edges, layered auto-layout, AI table descriptions, and FK hover highlighting
- SQL Server connection support added alongside PostgreSQL
- GitHub Actions CI/CD pipeline auto-promoting to production branch on main pass

### Known Gaps
- **DEPL-06**: Supabase demo DB env vars not confirmed set in Railway — manual dashboard action required
- **ERD deviations**: `reactflow@11` used instead of `@xyflow/react v12`; custom layout instead of dagre; MiniMap not implemented; row count badge missing
- **No VERIFICATION.md files** created during execute-phase for either formal phase

---

