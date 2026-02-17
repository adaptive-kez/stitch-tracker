---
description: Comprehensive Project Audit (Security, Performance, Stack, Release Readiness)
---

# Comprehensive Project Audit Workflow

This workflow performs a deep, engineering-grade audit of the codebase, covering security, architecture, performance, and production readiness. It uses specialized skills to ensure a "project engineer" level of quality.

## Prerequisites

Ensure the following skills are installed in `.agent/skills/`:

- `production-code-audit`
- `security-scanning-security-sast`
- `web-performance-optimization`
- `architect-review`

## Workflow Steps

### Phase 1: Architecture & Stack Discovery

1. **Initialize Audit Context**
   - Goal: Understand the codebase structure, tech stack, and data flow.
   - Action: Use `production-code-audit` (Step 1: Discovery).
   - Output: `audit/architecture_overview.md`

2. **Architectural Review**
   - Goal: Evaluate design patterns, modularity, and stack choices.
   - Action: Use `architect-review` to analyze the system.
   - Focus:
     - Directory structure hygiene
     - Dependency graph (circular dependencies?)
     - State management patterns
     - API design (REST/RPC consistency)
   - Output: Update `audit/architecture_overview.md` with findings.

### Phase 2: Deep Security Scan (Full Volume)

1. **SAST & Vulnerability Scanning**
   - Goal: Detect code vulnerabilities, secrets, and insecure patterns.
   - Action: Use `security-scanning-security-sast`.
   - Steps:
     - Run `semgrep` / `eslint-plugin-security` / `bandit` (if Python).
     - Check for hardcoded secrets (using patterns).
     - Review `package.json` for known vulnerable dependencies (`npm audit`).
   - Output: `audit/security_report.md`

2. **Manual Security Review**
   - Goal: Logic flaws and configuration issues.
   - Checklist:
     - AuthZ/AuthN implementation (RBAC, session management).
     - API endpoint protection (Rate limiting, CORS, Headers).
     - Data validation (Zod/Joi schemas on boundaries).
     - Database query safety (SQL injection prevention).
   - Output: Append to `audit/security_report.md`.

### Phase 3: Performance & Throughput

1. **Frontend Performance Audit**
   - Goal: Optimize loading speed and runtime efficiency.
   - Action: Use `web-performance-optimization`.
   - Steps:
     - Bundle size analysis (`npm run build` stats).
     - Core Web Vitals assessment (LCP, FID, CLS).
     - Asset optimization check (Images, Fonts).
     - React render performance check (use of `useMemo`, `useCallback` appropriately).
   - Output: `audit/performance_report.md`

2. **Backend/API Throughput**
   - Goal: Ensure API scalability.
   - Focus:
     - N+1 query detection.
     - Database indexing review.
     - Caching strategy (Redis/KV usage).
     - Worker CPU time limits compliance.
   - Output: Append to `audit/performance_report.md`.

### Phase 4: Release Readiness & Code Quality

1. **Production Readiness Check**
   - Goal: Ensure code is robust and maintainable.
   - Action: Use `production-code-audit` (Step 2: Issue Detection).
   - Checklist:
     - Error handling (Global error boundary, Try/Catch blocks).
     - Logging & Observability.
     - Environment configuration (Validation involved).
     - Type safety (TypeScript strict mode, `no-explicit-any`).
   - Output: `audit/release_readiness.md`

2. **Final Synthesis**
   - Goal: Create a prioritized action plan.
   - Action: Consolidate all reports into a master plan.
   - Output: `audit/MASTER_PLAN.md` with:
     - 🔴 Critical Blockers (Must fix before release)
     - 🟠 Improvements (High value, can wait 1 sprint)
     - 🟢 Nice-to-Have (Backlog)

## Execution Instructions

To run this workflow:

1. Create `audit/` directory.
2. Execute each phase sequentially.
3. Review the `MASTER_PLAN.md` with the user to decide on fixes.
