# 代码审查标准与流程

> **版本:** 1.1 | **生效日期:** 2026-05-27 | **适用范围:** h:/xs 全栈项目

---

## 一、审查分层体系

代码审查分三层，由机器到人，逐层过滤：

```
第 0 层：自动化检查（编译器 + Linter + 格式化）
   ↓ 通过
第 1 层：自审清单（提交者自查）
   ↓ 通过
第 2 层：人工审查（同行 Review）
```

**原则：第 0 层不过，不进第 1 层；第 1 层不过，不进第 2 层。**

---

## 二、第 0 层：自动化检查

### 2.1 编译检查（零容忍）

```bash
# 前端
cd h:/xs && npx tsc -b --noEmit

# 后端
cd h:/xs/api && npx tsc --noEmit
```

**规则：** 任何 PR / 提交前，两条命令必须零错误通过。当前 `strict: false`，不作为长期状态——建议逐步开启 `strict: true`。

### 2.2 Lint 检查

```bash
npm run lint    # eslint .
```

**当前 ESLint 配置：**

```js
// eslint.config.js（关键规则）
rules: {
  'no-console': ['warn', { allow: ['info', 'warn', 'error'] }],
  '@typescript-eslint/no-explicit-any': 'warn',   // 渐进消除 any
  '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
  'react-hooks/exhaustive-deps': 'warn',
  'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
}
```

当前：**0 errors**，607 warnings（`any` 类型历史债务）。警报到 `warn` 级别，不阻塞提交，但会进入 Review 记录。

### 2.3 格式化

项目已配置 Prettier（`.prettierrc`），配合 husky + lint-staged 在提交时自动格式化。**禁止手动格式化——工具自动处理。**

```json
// .prettierrc
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "all",
  "printWidth": 100
}
```

提交前检查：`npm run format:check`（应永远通过，因为 pre-commit hook 已自动处理）。

### 2.4 测试（目标状态）

当前仅 2 个测试文件。**不要求一步到位达到高覆盖率**，但新增功能应附带测试：

- **API 端点：** 关键路径的集成测试（正确路径 + 权限拒绝 + 边界输入）
- **UI 组件：** 交互组件（LikeButton、RatingComponent 等）必须有测试
- **工具函数：** 纯函数必须有单元测试

```bash
npm test    # vitest
```

---

## 三、第 1 层：自审清单

提交者在发起 Review 前，必须逐项自查。**用此清单做自我 Review，发现问题先修再提交。**

### 🔴 安全检查（Blocker — 必须通过）

| 检查项        | 说明                                                                          | 反面案例                                                             |
| ------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| **输入验证**  | 所有 `req.body` / `req.query` / `req.params` 是否验证类型和边界？             | `parseInt(req.query.limit)` 可被传 `1e6`                             |
| **认证/授权** | 写操作是否有 auth 中间件？权限检查是否正确（资源作者 / 父资源作者 / admin）？ | 漏掉 `optionalAuthenticate` 导致未登录可写                           |
| **注入防护**  | SQL/NoSQL 注入？Prisma 参数化查询是否都用了 `$1` 占位符而非字符串拼接？       | `prisma.$queryRawUnsafe('SELECT ... ' + userInput)`                  |
| **分页上限**  | 所有 `limit` / `take` 参数是否有上限保护？                                    | `BranchService.getBranches(limit)` 无上限，`limit=1000000` 可打爆 DB |
| **敏感信息**  | 是否有 token / 密码 / 密钥硬编码或输出到日志？                                | `console.log(token)`                                                 |
| **文件操作**  | 文件上传是否有类型/大小限制？路径穿越防护？                                   | `fs.writeFileSync(req.body.path, ...)`                               |

### 🟡 正确性检查（Should Fix — 强烈建议）

| 检查项           | 说明                                                                | 反面案例                                               |
| ---------------- | ------------------------------------------------------------------- | ------------------------------------------------------ |
| **API 响应格式** | 所有 `res.json()` 是否用统一格式 `{ success: true, data: ... }`？   | `res.json(result)` 裸返回                              |
| **事件目标**     | 事件处理器中获取尺寸/位置是否用 `e.currentTarget` 而非 `e.target`？ | `e.target.getBoundingClientRect()` 在点击子元素时取错  |
| **空值处理**     | `undefined` / `null` / 空数组 / 空字符串是否都有兜底？              | `data.items.map(...)` 当 `items` 为 `undefined` 时崩溃 |
| **异步错误处理** | 所有 `async/await` 是否有 try-catch？（至少在边界层）               | `await fetchData()` 无 catch，接口挂了白屏             |
| **状态一致性**   | 乐观更新失败后是否回滚？多设备数据合并策略是否正确？                | P1-9：时间戳覆盖导致数据丢失                           |
| **依赖数组**     | `useEffect` / `useCallback` / `useMemo` 依赖数组是否完整？          | 缺依赖导致闭包陷阱                                     |

### 💭 代码质量（Nice to Have）

| 检查项         | 说明                                                                      |
| -------------- | ------------------------------------------------------------------------- |
| **类型安全**   | 禁止 `as any`，优先用类型守卫或泛型；接口字段应完整定义而非靠断言绕过     |
| **控制台清洁** | 无残留 `console.log`（`console.warn/error` 允许）                         |
| **消除硬编码** | URL / 配置值应从环境变量或配置文件中读取，而非写死在代码中                |
| **命名**       | 变量/函数名能准确表达意图，不使用 `data` / `temp` / `result` 等无意义命名 |
| **重复代码**   | 3 行以上重复逻辑应提取为函数/组件/工具方法                                |
| **注释**       | 复杂逻辑有注释说明 "为什么这样做"，而非注释 "做了什么"                    |

---

## 四、第 2 层：人工审查流程

### 4.1 何时需要审查

| 变更类型                | 需要审查  |
| ----------------------- | --------- |
| 新建 API 端点           | ✅ 必须   |
| 修改权限逻辑            | ✅ 必须   |
| 数据库 Schema 变更      | ✅ 必须   |
| 核心业务逻辑变更        | ✅ 必须   |
| 组件重构（>50 行变化）  | ✅ 推荐   |
| Bug 修复（>10 行）      | ✅ 推荐   |
| 文案/样式微调（<10 行） | ❌ 可跳过 |

### 4.2 审查者职责

1. **先跑第 0 层：** `npm run check` + `npm run lint`，确认零错误
2. **逐文件阅读：** 按变更文件列表，从头到尾读 diff，不跳读
3. **标记优先级：** 用 🔴🟡💭 标记问题
4. **写总结：** 说明整体评价、关键风险、改进建议

### 4.3 审查评论格式

```
🔴 **安全问题：缺少分页上限**
`api/src/services/BranchService.ts:45`
getBranches 的 limit 参数未做上限保护。

**风险：** 攻击者可传 limit=1000000 导致数据库压力/内存溢出。

**建议：**
const safeLimit = Math.max(1, Math.min(limit || 20, 200));
```

### 4.4 审查决策

| 结果                | 含义                              |
| ------------------- | --------------------------------- |
| **Approve**         | 无 🔴 问题，代码可合并            |
| **Request Changes** | 有 🔴 问题，必须修复后重新审查    |
| **Comment**         | 仅有 🟡💭，不阻塞合并，但建议修复 |

### 4.5 提交者响应

1. 🔴 问题：必须修复，不可争论（除非审查者误判，此时讨论澄清）
2. 🟡 问题：建议修复，如有合理理由可说明并保留，但需在 PR 中注明原因
3. 💭 问题：自行决定是否采纳

---

## 五、项目专用规则

基于历史缺陷总结的红色禁区：

### 5.1 后端

- **API 响应格式必须统一：** `res.json({ success: true, data: result })` 或 `{ success: false, error: 'message' }`——绝不允许 `res.json(result)` 裸返回
- **所有列表查询必须有分页上限：** `Math.min(limit, 200)` 天花板 + 合理默认值
- **权限检查遵循三级体系：** 资源作者 > 父资源作者 > admin——需在 Service 层显式检查，不可仅靠中间件
- **Prisma 查询必须声明 select/include：** 不允许 `findMany()` 无 select（返回所有字段 + 密码泄露风险）

### 5.2 前端

- **事件处理：位置/尺寸计算用 `e.currentTarget`，不用 `e.target`**——这是历史高频 Bug
- **禁止 `as any`：** 如果是类型不完整，补充接口定义；如果是第三方库，用 `declare module` 扩展
- **禁止硬编码 localhost：** 用 `window.location.hostname` 或环境变量动态推断
- **Toast 代替 alert：** 用户提示统一用 `addToast(type, message)`，不用 `alert()`
- **乐观更新必须处理失败回滚：** `toggleLike` 等操作先更新 UI，API 失败后恢复原状态

### 5.3 数据库

- **Schema 变更必须创建 Migration：** 不能手动改 DB
- **所有外键关系必须有索引：** 高频查询字段（`authorId`, `storyId`, `branchId`）必须加索引
- **软删除优于硬删除：** 核心实体（Story/Chapter/Branch）优先用 `deletedAt` 软删除

---

## 六、渐进路线图

当前项目不可能一夜之间达到以上全部标准。建议按以下优先级逐步推进：

| 阶段                  | 目标                                                 | 状态               |
| --------------------- | ---------------------------------------------------- | ------------------ |
| **Phase 1（已完成）** | 启用 `no-console` 规则，修复所有 `as any`            | ✅ 2026-05-27 完成 |
| **Phase 2（已完成）** | Prettier 统一格式化，husky+lint-staged 强制执行      | ✅ 2026-05-27 完成 |
| **Phase 3（已完成）** | 为所有 API 端点添加分页上限和输入验证                | ✅ 2026-05-27 完成 |
| **Phase 4（待安排）** | 为核心交互组件（LikeButton/Bookmark/Rating）补充测试 | 待开始             |
| **Phase 5（待安排）** | 逐步迁移到 `strict: true`                            | 按文件渐进         |

---

## 附录 A：快速自审脚本

将此段添加到 `package.json` scripts：

```json
"review:check": "npm run check && npm run lint && npm test"
```

提交前运行：

```bash
npm run review:check
```

三条全绿再发起 Review。

## 附录 B：常见错误速查

| 错误模式                  | 检测方式                                     | 严重度 |
| ------------------------- | -------------------------------------------- | ------ |
| `as any`                  | `grep -rn "as any" src/`                     | 🟡     |
| `console.log`             | ESLint `no-console`                          | 🟡     |
| `e.target` 在事件处理中   | grep `e.target.getBoundingClientRect`        | 🔴     |
| `res.json(result)` 裸返回 | grep `res.json(result)` api/src/controllers/ | 🟡     |
| 无上限 `take: limit`      | grep `take: limit` api/src/services/         | 🔴     |
| localhost 硬编码          | grep `localhost` src/                        | 🟡     |
