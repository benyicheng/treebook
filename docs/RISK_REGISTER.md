# 风险登记册

> **更新日期:** 2026-06-04 | **下次审查:** 2026-06-06（周五 Sprint Retro）

---

## 风险矩阵

| ID | 风险描述 | 影响 | 概率 | 等级 | 缓解措施 | 负责人 | 状态 |
|----|----------|------|------|------|----------|--------|------|
| R1 | SQLite 并发写瓶颈导致生产环境不可用 | 4-High | 3-Likely | 🔴 12 | v0.5.0 PostgreSQL 迁移 | - | Open |
| R2 | JWT 硬编码回退密钥被利用 | 5-Critical | 2-Unlikely | 🔴 10 | 已修复（config/jwt.ts 强制检查） | - | ✅ Closed |
| R3 | Socket.IO 无认证导致身份冒用 | 4-High | 3-Likely | 🔴 12 | S1.2: Socket.IO JWT 认证 | - | Open |
| R4 | CORS 全开导致 CSRF 攻击 | 4-High | 2-Unlikely | 🟡 8 | S1.3: CORS 收紧 | - | Open |
| R5 | CSP 禁用导致 XSS 攻击面扩大 | 4-High | 3-Likely | 🔴 12 | S1.1: Helmet CSP 配置 | - | Open |
| R6 | 无速率限制导致暴力破解/DoS | 3-Medium | 3-Likely | 🟡 9 | S1.4: express-rate-limit | - | Open |
| R7 | FTS5 触发器语法损坏导致数据更新失败 | 4-High | 3-Likely | 🔴 12 | 已修复（DELETE 替代 INSERT VALUES('delete')） | - | ✅ Closed |
| R8 | 前端测试覆盖不足导致回归风险 | 3-Medium | 4-Very Likely | 🟡 12 | v0.5.0 测试覆盖率提升 | - | Open |
| R9 | 后端测试覆盖不足导致 API 回归 | 4-High | 3-Likely | 🔴 12 | v0.5.0 测试覆盖率提升 | - | Open |
| R10 | SQLite→PostgreSQL 迁移期间数据丢失 | 5-Critical | 2-Unlikely | 🔴 10 | 完整备份 + 迁移脚本 + 验证 | - | Open |
| R11 | 单人开发导致知识孤岛 | 3-Medium | 4-Very Likely | 🟡 12 | 文档完善 + 代码注释 + 架构记录 | - | Open |

---

## 风险等级说明

| 等级 | 数值 | 响应策略 |
|------|------|----------|
| 🔴 Critical (15-25) | 不可接受，必须立即缓解 | 本周修复 |
| 🟠 High (10-14) | 需在本月内缓解 | 加入当前或下个 sprint |
| 🟡 Medium (5-9) | 持续监控，适时处理 | 加入 backlog |
| 🟢 Low (1-4) | 可接受 | 记录但不追踪 |

---

**影响评分:** 1=可忽略 2=轻微 3=中等 4=严重 5=灾难
**概率评分:** 1=几乎不可能 2=不太可能 3=可能 4=很可能 5=几乎确定
