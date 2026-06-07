# 项目管理框架

> **版本:** 1.0 | **生效日期:** 2026-06-04 | **适用范围:** h:/xs 全栈项目
> **团队规模:** 1-2 人 | **发布节奏:** 周发布 | **工具:** CodeBuddy Task + Markdown

---

## 一、为什么需要这个框架

当前项目在工程层面已有良好纪律（零 tsc error、零 ESLint error、三层 code review），但项目管理层面缺乏结构：
- 83 个扁平任务无分层，P0 安全漏洞和拼写修复混在同一列表
- 工作按报错驱动而非主动规划
- CODE_REVIEW.md 的 Phase 路线图自 2026-05 后未更新
- 没有 sprint 边界，没有 release note，没有可见的 roadmap

**目标：在不增加 overhead 的前提下，让项目从"失控的高产出"变为"可控的高产出"。**

---

## 二、核心结构：Epic → Story → Task

```
Epic（史诗）
  ├── Story 1（用户故事）
  │     ├── Task 1.1
  │     └── Task 1.2
  ├── Story 2
  │     └── Task 2.1
  └── ...
```

**层级规则：**
- **Epic**: 横跨 1-4 周的大目标（如"安全加固"、"UI 升级"）
- **Story**: 1-3 天可完成的用户可见功能或改进（如"修复 Helmet CSP 配置"）
- **Task**: 30 分钟到半天的具体实现步骤（如"配置 CSP directives"）

在 CodeBuddy 中，Epic 用 Markdown 文件记录，Story 和 Task 用 Task 系统。

---

## 三、周迭代节奏

```
周一 09:00  Sprint Planning (15 min)
   ├── Review backlog → 挑选本周 Story → 拆 Task → 设定 Sprint Goal
周三 17:00  Mid-Sprint Check (5 min)
   ├── 有无阻塞？是否需要砍 scope？
周五 17:00  Release + Retro (15 min)
   ├── 合并 → 打 tag → 写 release note → 回顾 → 更新 backlog
```

**这是上限，不是下限。** 1-2 人团队不需要 60 分钟的站会。如果 solo 开发，planning 和 retro 可以合并到 10 分钟的自我复盘。

---

## 四、Sprint Planning 模板

每次 planning 产出三个东西：

### 4.1 Sprint Goal（一句话）
```
本周目标：完成安全加固 P0 项（Helmet CSP + JWT 密钥管理 + CORS 收紧）
```

### 4.2 Sprint Backlog（本周要做的 Story）
从 Roadmap 中按优先级挑选，原则：
- **一个 sprint 不超过 3-5 个 Story**（1-2 人团队的周容量）
- **P0 永远在最前面**
- **如果本周有紧急 bug，优先处理并相应减少计划 Story**

### 4.3 不在本周范围内的（明确排除）
主动列出来，避免 scope creep。

---

## 五、Release Process

每次周五发布流程：

```bash
# 1. 质量门禁
npm run check          # tsc + build（前后端）
npm run lint           # ESLint
npm test               # 测试

# 2. 更新 CHANGELOG
# 在 docs/CHANGELOG.md 中追加本周变更

# 3. 打 tag
git tag -a v0.$(date +%y.%m.%d) -m "Sprint $(date +%Y-W%V)"

# 4. 更新 Roadmap
# 把本周完成的 Story 从 Roadmap 中标记为完成
```

---

## 六、Backlog 管理

### 6.1 优先级定义

| 标签 | 含义 | 示例 |
|------|------|------|
| **P0 - Critical** | 安全漏洞、数据丢失、核心功能不可用 | SQL 注入、JWT 密钥泄露 |
| **P1 - High** | 用户体验严重受损、性能大幅下降 | alert() 弹窗、无分页 |
| **P2 - Medium** | 代码质量、技术债、改进项 | JSON-as-string、静态方法 |
| **P3 - Low** | 锦上添花、未来考虑 | CI/CD、监控面板 |

### 6.2 Backlog 清理节奏
- **每周 Sprint Retro 后**：移除已完成、重排优先级
- **每月初**：检查所有 P2/P3 项是否仍然相关，删除过时项

---

## 七、关键文档

| 文档 | 用途 | 更新频率 |
|------|------|----------|
| `docs/PM_FRAMEWORK.md` | 本文件 — PM 方法论 | 按需 |
| `docs/ROADMAP.md` | 产品路线图（Epic 级） | 每月 |
| `docs/CHANGELOG.md` | 版本变更记录 | 每周发布时 |
| `docs/RISK_REGISTER.md` | 风险登记册 | 每周 |
| `.workbuddy/memory/YYYY-MM-DD.md` | 每日工作日志 | 每天 |

---

## 八、Definition of Done

一个 Story 只有在以下全部满足时才视为 Done：

- [ ] tsc 零 error（前后端）
- [ ] vite build 通过
- [ ] ESLint 零 error
- [ ] 新增功能有测试覆盖（如适用）
- [ ] 手动冒烟测试通过
- [ ] 相关文档已更新
- [ ] 已在 CHANGELOG 记录

---

## 九、反模式警告

以下是 1-2 人团队最容易踩的坑：

| 反模式 | 后果 | 纠正 |
|--------|------|------|
| **跳过 planning 直接开干** | 一周结束时发现做了不该做的事 | 哪怕 5 分钟也先写 Sprint Goal |
| **所有任务都标 P0** | 真正的 P0 被淹没 | P0 不超过 sprint backlog 的 30% |
| **在 sprint 中途加任务** | sprint 永远完不成 | 新需求进 backlog，下个 sprint 再说 |
| **不写 release note** | 三周后忘了改了什么 | 周五花 5 分钟写 3 条要点 |
| **技术债不进 backlog** | 永远在"以后修" | P2/P3 技术债也要排进 backlog |
