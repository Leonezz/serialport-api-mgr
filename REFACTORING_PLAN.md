# Frontend Refactoring Plan

**Project:** serialport-api-mgr
**Date:** 2026-01-09
**Status:** Planning Phase

## Executive Summary

This plan outlines a comprehensive 6-phase refactoring of the frontend codebase to:
- **Reduce codebase by 1,310 lines** (34% reduction in components)
- **Improve type safety** (eliminate `any` types in 22 files)
- **Enhance performance** (80% reduction in unnecessary re-renders)
- **Better code organization** (logical directory structure)
- **Eliminate code duplication** (770 lines of duplicated code)

**Target:** App.tsx reduction from 773 → 400 lines through extraction of business logic to custom hooks.

---

## Phase Breakdown

### PHASE 1: Foundation - Cleanup & Quick Wins
**Duration:** 2-3 hours | **Risk:** LOW | **Lines Saved:** ~250

**Goals:**
1. Remove unused legacy code (useProjectState.ts - 159 lines)
2. Centralize magic numbers to constants file
3. Fix type safety issues (22 files using `any`)
4. Replace deprecated `substr()` with `substring()`

**Key Deliverables:**
- ✨ Create `/src/lib/constants.ts` with TIMING, BUFFER_SIZES
- ❌ Delete `/src/hooks/useProjectState.ts`
- 📝 Fix type safety in App.tsx, geminiService.ts, utils.ts

---

### PHASE 2: Extract Shared UI Components
**Duration:** 3-4 hours | **Risk:** LOW | **Lines Saved:** ~160

**Goals:**
1. Create reusable `<Modal>` wrapper component
2. Refactor all 8 modals to use shared Modal component
3. Eliminate duplicated modal boilerplate

**Key Deliverables:**
- ✨ Create `/src/components/ui/Modal.tsx`
- 📝 Update 8 modal components (each saves ~20 lines)

---

### PHASE 3: Deduplicate Framing Config UI
**Duration:** 4-5 hours | **Risk:** MEDIUM | **Lines Saved:** ~330

**Goals:**
1. Extract duplicated framing configuration UI (appears 3×)
2. Create single FramingConfigEditor component
3. Support all 5 framing strategies in one component

**Key Deliverables:**
- ✨ Create `/src/components/shared/FramingConfigEditor.tsx`
- 📝 Replace framing UI in ControlPanel, CommandFormModal, CommandEditor

**Duplications Eliminated:**
- ControlPanel.tsx lines 428-553 (~125 lines)
- CommandFormModal.tsx lines 260-382 (~122 lines)
- CommandEditor.tsx lines 298-382 (~85 lines)

---

### PHASE 4: Extract Business Logic from App.tsx
**Duration:** 6-8 hours | **Risk:** MEDIUM | **Lines Saved:** ~350

**Goals:**
1. Reduce App.tsx from 773 → 400 lines
2. Extract business logic to 3 custom hooks
3. Separate concerns (validation, framing, command execution)
4. Make business logic testable

**Key Deliverables:**

**1. `/src/hooks/useValidation.ts` (~204 lines)**
- Validation registration & checking
- Pattern matching, regex, script validation
- Timeout handling

**2. `/src/hooks/useFraming.ts` (~83 lines)**
- Frame processing logic
- Framing strategy handling
- Override management

**3. `/src/hooks/useCommandExecution.ts` (~245 lines)**
- Command sending logic
- Sequence execution
- Parameter handling, scripting integration

**4. Refactored App.tsx (~400 lines)**
- UI coordination only
- Event handling
- Component composition

---

### PHASE 5: Optimize State Management & Performance
**Duration:** 4-5 hours | **Risk:** MEDIUM | **Lines Saved:** ~120

**Goals:**
1. Create Zustand selectors for optimized subscriptions
2. Simplify sessionSlice update patterns
3. Add devtools & persist middleware
4. Add React performance optimizations (useCallback, useMemo)

**Key Deliverables:**
- ✨ Create `/src/lib/selectors.ts` (useActiveSession, useStoreActions)
- 📝 Add helper function to sessionSlice (updateActiveSession)
- 📝 Add middleware to store.ts (devtools, persist)
- 📝 Optimize App.tsx and ControlPanel with useCallback

**Performance Improvements:**
- App.tsx: Change from 30+ property subscription → selective selectors
- Reduced re-renders: ~80% improvement
- State persistence: Auto-save to localStorage
- Debug capability: Redux DevTools integration

---

### PHASE 6: Organize File Structure & Final Cleanup
**Duration:** 3-4 hours | **Risk:** LOW | **Lines Saved:** ~100

**Goals:**
1. Reorganize components into logical directories
2. Extract remaining duplicated components
3. Consolidate utility functions
4. Standardize error handling

**Key Deliverables:**

**1. Directory Reorganization:**
```
src/components/
├── modals/          # 8 modal components (moved)
├── shared/          # Shared business components (new)
├── ui/              # UI primitives (existing)
├── console/         # Console components (existing)
└── [layout]         # ControlPanel, Sidebar, etc.
```

**2. Shared Components:**
- ✨ `/src/components/shared/ProtocolWizard.tsx` (saves ~70 lines)
- ✨ `/src/components/shared/ParameterEditor.tsx` (saves ~40 lines)

**3. Utility Functions:**
- Add `applyLineEnding()` to dataUtils.ts (replace 4 duplications)
- Add `getErrorMessage()` to utils.ts (standardize error handling)

---

## Testing Strategy

**After Each Phase:**
1. ✅ TypeScript compiles without errors
2. ✅ App launches successfully
3. ✅ Manual feature testing (see checklist)
4. ✅ Git commit with clear message

**Comprehensive Testing Checklist:**
- [ ] Connect/disconnect serial port
- [ ] Send manual commands (TEXT, HEX, BINARY)
- [ ] Execute saved commands with parameters
- [ ] Run sequences with delays
- [ ] Test all 5 framing strategies
- [ ] Test validation (pattern, regex, script, timeout)
- [ ] Test pre/post scripts
- [ ] Create/edit/delete commands, sequences
- [ ] Session management (create, rename, delete, switch)
- [ ] All modals open/close correctly
- [ ] Theme switching works
- [ ] Toast notifications display
- [ ] System logs record operations

---

## Impact Analysis

### Code Metrics

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| **Total Component Lines** | 3,815 | 2,505 | **-1,310 (-34%)** |
| **App.tsx Size** | 773 | ~400 | **-373 (-48%)** |
| **Largest Component** | 774L | ~560L | **-214 (-28%)** |
| **Code Duplication** | 770 lines | 0 | **-770 (-100%)** |
| **Files with `:any`** | 22 | 0 | **-22 (-100%)** |
| **Modal Boilerplate** | 160 lines | 0 | **-160 (-100%)** |

### Architecture Improvements

**Before:**
- ❌ App.tsx handles 5+ concerns (connection, validation, framing, scripting, UI)
- ❌ Framing UI duplicated in 3 places
- ❌ Modal structure duplicated 8 times
- ❌ 22 files use unsafe `any` types
- ❌ App.tsx subscribes to 30+ store properties
- ❌ No state persistence
- ❌ Flat component structure

**After:**
- ✅ Separated concerns (App.tsx = UI only, hooks = business logic)
- ✅ Single FramingConfigEditor component
- ✅ Single Modal wrapper component
- ✅ 100% type-safe codebase
- ✅ Selective store subscriptions (2-5 properties)
- ✅ Automatic state persistence
- ✅ Organized directory structure

### Performance Improvements

- **Re-render reduction:** ~80% (selective selectors vs full store subscription)
- **Bundle size:** ~1,310 fewer lines = smaller bundle
- **Developer experience:** Redux DevTools, better file organization
- **Maintainability:** Separated concerns, testable hooks

---

## Risk Mitigation

### Medium Risk Phases (3, 4, 5):

**Phase 3 - Framing Config Extraction:**
- **Risk:** Breaking framing behavior
- **Mitigation:** Test all 5 strategies thoroughly, maintain exact UI behavior

**Phase 4 - Logic Extraction:**
- **Risk:** Breaking validation/command execution
- **Mitigation:** Extract incrementally, test after each hook creation

**Phase 5 - State Optimization:**
- **Risk:** Performance regressions, state bugs
- **Mitigation:** Use React DevTools to verify re-renders, extensive testing

### General Mitigation:
- ✅ Incremental changes (each phase is independently valuable)
- ✅ Git commits after each phase
- ✅ Comprehensive testing checklist
- ✅ Type safety catches many errors at compile time

---

## Dependencies & Sequencing

**Sequential (Must Complete in Order):**
1. Phase 1 → Phase 2-6 (foundation for all)
2. Phase 4 → Phase 5 (optimize new structure)

**Parallel (Can Do Simultaneously):**
- Phase 2 & Phase 3 (after Phase 1 completes)
- Phase 6 can start alongside Phase 5

**Recommended Sequence:**
1. Phase 1 (foundation)
2. Phase 2 + Phase 3 (in parallel or sequential)
3. Phase 4 (major refactor)
4. Phase 5 (optimization)
5. Phase 6 (cleanup)

---

## Critical Files Reference

**Will Be Deleted:**
- `/src/hooks/useProjectState.ts` (159 lines, unused)

**Will Be Created:**
- `/src/lib/constants.ts`
- `/src/lib/selectors.ts`
- `/src/components/ui/Modal.tsx`
- `/src/components/shared/FramingConfigEditor.tsx`
- `/src/components/shared/ProtocolWizard.tsx`
- `/src/components/shared/ParameterEditor.tsx`
- `/src/hooks/useValidation.ts`
- `/src/hooks/useFraming.ts`
- `/src/hooks/useCommandExecution.ts`

**Will Be Heavily Modified:**
- `/src/App.tsx` (773 → 400 lines)
- `/src/lib/store.ts` (add middleware)
- `/src/lib/slices/sessionSlice.ts` (simplify updates)
- `/src/components/ControlPanel.tsx` (use shared components)
- `/src/components/CommandFormModal.tsx` (use shared components)
- `/src/components/RightSidebar/CommandEditor.tsx` (use shared components)
- All 8 modal components (use Modal wrapper)

**Will Be Moved:**
- 8 modal components → `/src/components/modals/`

---

## Success Criteria

**Phase Completion:**
- ✅ All TypeScript errors resolved
- ✅ All features functional (testing checklist passes)
- ✅ No new runtime errors
- ✅ Git commit with clear message

**Overall Success:**
- ✅ Codebase reduced by >1,000 lines
- ✅ App.tsx < 450 lines
- ✅ Zero `:any` types in codebase
- ✅ All components organized in logical directories
- ✅ State persistence working
- ✅ Performance improvement measurable (React DevTools profiler)

---

## Next Steps

1. **Get approval for this plan**
2. **Start with Phase 1** (low-risk foundation)
3. **Test thoroughly after each phase**
4. **Proceed sequentially through phases**
5. **Measure impact** (line count, performance, developer velocity)

---

**Questions or concerns?** Review each phase and verify the approach aligns with project goals.
