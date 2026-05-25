---
session: ses_1ab0
updated: 2026-05-23T13:21:52.272Z
---

# Session Summary

## Goal
Identify all dead/unused code in `H:\xs\src` (frontend) — unused exports, unused imports, duplicate code, dead CSS, and unused state — with grep-verified evidence for each finding.

## Constraints & Preferences
- Every claim must be backed by grep evidence; no speculation.
- File paths must be exact (`H:\xs\src/...`).
- Output structured report grouped by category.

## Progress
### Done
- [x] Explored full source tree: `api/`, `components/`, `stores/`, `pages/`, `hooks/`, `layouts/`, `lib/`, `index.css`
- [x] Read and analyzed 30+ files including all API services, stores, hooks, UI components, layout, and key pages (ReadPage, Home, DashboardPage, MainlinePage, etc.)
- [x] Verified every export from `src/api/storyService.ts` with grep for import/usage across codebase
- [x] Verified every component in `src/components/` for import usage in pages/other components
- [x] Verified all store exports (`useAuthStore`, `useStoryStore`, `useSiteConfigStore`) for usage
- [x] Verified all hooks (`useTheme`, `useEditorLock`, `useMarkdownEditor`, `useStoryDetails`) for usage
- [x] Checked `src/index.css` for dead custom CSS classes
- [x] Scanned key files (ReadPage, Home, DashboardPage, App.tsx, MainLayout, ChapterEditor, CommentSection) for unused imports and unused state variables

### In Progress
- [ ] No active work; analysis complete.

### Blocked
- (none)

## Key Decisions
- **Analysis methodology**: Used grep with exact patterns (`import.*from '@/path'`, usage of function names, JSX component references) to distinguish real use from coincidental string matches
- **Scope**: Only frontend `src/` directory; backend `api/` directory excluded per user request

## Next Steps
1. Remove all listed dead code findings (prioritize by impact: unused exports first, then unused imports, then unused state)
2. Re-check after removal to ensure no side effects (e.g., interfaces used via re-exports)
3. Consider adding ESLint `no-unused-vars` / `unused-imports` plugin to prevent regressions

## Critical Context

### FINDINGS — DEAD CODE REPORT

#### 1. UNUSED EXPORTS

**A. `src/api/storyService.ts` — Unused Interfaces**

| Interface | File | Why Dead |
|-----------|------|----------|
| `Tag` (line 36–42) | `src/api/storyService.ts` | Never imported anywhere; the only "Tag" references in codebase are the lucide-react `Tag` icon component |
| `ReadingSavepoint` (line 284–295) | `src/api/storyService.ts` | Defined but never imported or referenced in any other file |

**B. `src/components/ui/Skeleton.tsx` — Unused Exports**

| Export | File | Why Dead |
|--------|------|----------|
| `SkeletonCard` (line 12) | `src/components/ui/Skeleton.tsx` | Never imported anywhere |
| `SkeletonRow` (line 20) | `src/components/ui/Skeleton.tsx` | Never imported anywhere |
| `SkeletonLine` (line 32) | `src/components/ui/Skeleton.tsx` | Never imported anywhere |

**C. `src/components/ui/` — Unused Components**

| Component | File | Why Dead |
|-----------|------|----------|
| `Page` | `src/components/ui/Page.tsx` | Exported but never imported anywhere |
| `Card` | `src/components/ui/Card.tsx` | Exported but never imported anywhere |
| `Button` | `src/components/ui/Button.tsx` | Exported but never imported anywhere |

**D. `src/components/Empty.tsx` — Unused Component**

| Component | File | Why Dead |
|-----------|------|----------|
| `Empty` (default export) | `src/components/Empty.tsx` | Never imported anywhere; also uses `@/lib/utils` path alias which may not resolve correctly (only used here) |

**E. `src/hooks/useTheme.ts` — Unused Hook**

| Export | File | Why Dead |
|--------|------|----------|
| `useTheme` (line 5) | `src/hooks/useTheme.ts` | Defined but never imported anywhere in the codebase |

**F. `src/stores/useSiteConfigStore.ts` — Unused Store Actions**

| Action | File | Why Dead |
|--------|------|----------|
| `resetConfig` (line 129) | `src/stores/useSiteConfigStore.ts` | Declared in interface and implemented, but never called anywhere |
| `clearError` (line 134) | `src/stores/useSiteConfigStore.ts` | Declared in interface and implemented, but never called anywhere |

#### 2. UNUSED IMPORTS

**A. `src/pages/read/ReadPage.tsx`**

| Import | Line | Why Dead |
|--------|------|----------|
| `Plus` from lucide-react | 10 | Imported but never rendered as `<Plus />` anywhere in JSX |

**B. `src/pages/read/CommentSection.tsx`**

| Import | Line | Why Dead |
|--------|------|----------|
| `User` from lucide-react | 4 | Imported but never rendered as `<User />` in JSX |
| `Trash2` from lucide-react | 4 | Imported but never rendered as `<Trash2 />` in JSX |

**C. `src/pages/DashboardPage.tsx`**

| Import | Line | Why Dead |
|--------|------|----------|
| `Story` from ../api/storyService | 4 | Imported but never used as a type annotation |
| `Branch` from ../api/storyService | 4 | Imported but never used as a type annotation |
| `Spinoff` from ../api/storyService | 4 | Imported but never used as a type annotation |
| `Booklist` from ../api/storyService | 4 | Imported but never used as a type annotation |
| `User as UserIcon` from lucide-react | 16 | Imported but never rendered as `<UserIcon />` in JSX |
| `ShieldCheck` from lucide-react | 17 | Imported but never rendered as `<ShieldCheck />` in JSX |

**D. `src/layouts/MainLayout.tsx`** (massive unused lucide-react imports)

| Import | Line | Why Dead |
|--------|------|----------|
| `BookOpen` from lucide-react | 3 | Never rendered as `<BookOpen />` in this file |
| `Library` from lucide-react | 3 | Never rendered as `<Library />` in this file |
| `LogIn` from lucide-react | 3 | Never rendered as `<LogIn />` in this file |
| `ChevronLeft` from lucide-react | 3 | Never rendered as `<ChevronLeft />` in this file |
| `ChevronRight` from lucide-react | 3 | Never rendered as `<ChevronRight />` in this file |
| `Globe` from lucide-react | 3 | Never rendered as `<Globe />` in this file |
| `Sparkles` from lucide-react | 3 | Never rendered as `<Sparkles />` in this file |
| `Coins` from lucide-react | 3 | Never rendered as `<Coins />` in this file |

**E. `src/components/Editor/ChapterEditor.tsx`**

| Import | Line | Why Dead |
|--------|------|----------|
| `Underline` from lucide-react | 5 | Imported but never rendered as `<Underline />` in JSX |

**F. `src/components/StoryTree/StoryBranchTree.tsx`**

| Import | Line | Why Dead |
|--------|------|----------|
| `Position` from reactflow | 8 | Imported but never used as `Position.Left` etc. in this file (only used in CustomNodes.tsx) |

#### 3. UNUSED STATE

**A. `src/pages/mainline/hooks/useStoryDetails.ts` — Unused State**

| Variable | Line | Why Dead |
|----------|------|----------|
| `readingHistory` state | 46 | Declared as `useState<any[]>([])` but `setReadingHistory` is never called anywhere in the file; it's always an empty array. Passed to StoryBranchTree but provides no real data. |
| The `setReadingHistory` setter | 46 | Never called, never used. |

**B. `src/pages/DashboardPage.tsx` — Unused Destructured Variable**

| Variable | Line | Why Dead |
|----------|------|----------|
| `isStoriesError` | 33 | Destructured from `useQuery` but never referenced anywhere in the file body or JSX |

#### 4. MISCELLANEOUS

**A. `src/index.css`**

No dead custom CSS classes found. Only Tailwind directives and one utility `.pb-safe` which is used by `MobileNavbar` (line 19: `pb-safe`).

**B. Duplicate Code**

No significant duplicates found between utility functions/helpers. The `cn()` utility in `src/lib/utils.ts` is only used by the dead `Empty.tsx` component, making it effectively dead code as well (but the utility itself could be useful if reused). `Skeleton` components in `ui/Skeleton.tsx` use inline Tailwind classes rather than duplicating CSS; the main duplication risk is in the two `timeAgo`-like helpers in Home.tsx (hand-rolled) vs any other date formatting — none found elsewhere.

**C. Dead re-exports from `src/api/storyService.ts`**

The following line 411–418 re-exports from `interactionService.ts`:
```
export { interactionService } from './interactionService';
export { InteractionStats, LikeResponse, ShareResponse, RatingRequest, ShareConfig } from './interactionService';
```
These ARE used — the types are consumed by `InteractionBar`, `RatingComponent`, `LikeButton`, `ShareButton`, and `BooklistDetailPage`.

### Notable Observations
- `useEditorLock` and `useMarkdownEditor` hooks are both properly used only by `ChapterEditor`
- `cn()` utility in `lib/utils.ts` is imported only by the dead `Empty.tsx` component
- All API service files (`revenueService.ts`, `mediaService.ts`, `moderationService.ts`, `reviewWorkflowService.ts`, `editorialService.ts`, `mergeService.ts`) have active consumers
- `Position` import in `StoryBranchTree.tsx` is dead because `Position` is only used in `CustomNodes.tsx` (which is imported as `nodeTypes` object)
- `Plus` in `ReadPage.tsx` is dead — the "Add bookmark" functionality uses `<BookMarked>` not `<Plus>`

## File Operations
### Read
- `H:\xs\`
- `H:\xs\src`
- `H:\xs\src\App.tsx`
- `H:\xs\src\api\mediaService.ts`
- `H:\xs\src\api\mergeService.ts`
- `H:\xs\src\api\revenueService.ts`
- `H:\xs\src\api\storyService.ts`
- `H:\xs\src\components\AppErrorBoundary.tsx`
- `H:\xs\src\components\Editor\ChapterEditor.tsx`
- `H:\xs\src\components\Empty.tsx`
- `H:\xs\src\components\Interaction\InteractionBar.tsx`
- `H:\xs\src\components\Interaction\index.ts`
- `H:\xs\src\components\MobileNavbar.tsx`
- `H:\xs\src\components\Modal.tsx`
- `H:\xs\src\components\PermissionGate.tsx`
- `H:\xs\src\components\StoryTree\CustomNodes.tsx`
- `H:\xs\src\components\StoryTree\StoryBranchTree.tsx`
- `H:\xs\src\components\ui\Button.tsx`
- `H:\xs\src\components\ui\Card.tsx`
- `H:\xs\src\components\ui\Page.tsx`
- `H:\xs\src\components\ui\Skeleton.tsx`
- `H:\xs\src\hooks\useEditorLock.ts`
- `H:\xs\src\hooks\useMarkdownEditor.ts`
- `H:\xs\src\hooks\useTheme.ts`
- `H:\xs\src\index.css`
- `H:\xs\src\layouts\MainLayout.tsx`
- `H:\xs\src\lib\utils.ts`
- `H:\xs\src\pages\DashboardPage.tsx`
- `H:\xs\src\pages\Home.tsx`
- `H:\xs\src\pages\mainline\MainlinePage.tsx`
- `H:\xs\src\pages\mainline\components\StoryHeader.tsx`
- `H:\xs\src\pages\mainline\hooks\useStoryDetails.ts`
- `H:\xs\src\pages\read\CommentSection.tsx`
- `H:\xs\src\pages\read\ReadPage.tsx`
- `H:\xs\src\stores\useAuthStore.ts`
- `H:\xs\src\stores\useSiteConfigStore.ts`
- `H:\xs\src\stores\useStoryStore.ts`
- `H:\xs\src\tsconfig.json`
- `H:\xs\src\vite.config.ts`

### Modified
- (none)
