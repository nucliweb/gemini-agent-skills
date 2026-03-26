# Module 03: GEMINI.md — The Agent Protocol

In the previous module we installed the SKILLs — the "what the agent knows how to do". `GEMINI.md` defines the "how it does it": in what order, with what constraints, and when to wait for confirmation before acting.

## 1. What Is GEMINI.md

`GEMINI.md` is a file in the project root that Gemini CLI reads automatically at startup. It acts as a persistent `system prompt`, but with two advantages:

- **Lives with the code**: versioned in Git, reviewed in PRs, evolves with the project.
- **Declarative**: defines behavioral rules, not step-by-step instructions.

Without `GEMINI.md`, Gemini acts as a generic conversational assistant. With it, it acts as a specialized engineer with a reproducible work protocol.

## 2. The GEMINI.md of This Workshop

This repository already includes a [`GEMINI.md`](./GEMINI.md). Let's review each section:

### Model

```markdown
## Model
Use `gemini-2.0-flash` for all tasks in this project.
```

We use a paid model for two reasons: 1M token context window (needed when the agent loads SKILLs + code + metrics), and more precise reasoning to interpret complex decision trees.

### Role

```markdown
## Role
You are a Senior Web Performance Engineer.
Your job is to detect, diagnose, and fix Core Web Vitals issues (LCP, CLS, INP)
using Chrome DevTools MCP tools and WebPerf Skills.
```

The role limits the agent's scope. An agent without a role responds to any question. An agent with a role channels all responses through the Web Performance lens.

### Tools and Skills

```markdown
## Tools
- Always use Chrome DevTools MCP tools before speculating about the code.
- Use the installed WebPerf Skills to measure performance.
  Read the script files and inject them via `evaluate_script`.
- Never generate measurement scripts from scratch — use the pre-validated ones.
- Never guess or estimate metrics — measure them.
```

This section connects the two pieces: MCP (the executor) and Skills (the knowledge). The "never generate measurement scripts from scratch" rule is what guarantees determinism — it forces the agent to use the Skills' `.js` files instead of inventing code.

### Workflow: Sense → Analyze → Act

```markdown
## Workflow
1. **Sense**: Navigate to the URL and capture metrics using the WebPerf Skills.
2. **Analyze**: Identify the root cause from the data, not from assumptions.
3. **Report**: Specify the element, metric value, file/line, and Long Task duration when available.
4. **Wait**: Do not modify any file until the user gives explicit confirmation.
```

This is the **Progressive Disclosure** protocol applied to the agent. The `GEMINI.md` workflow defines the sequence; the SKILLs (with their decision trees and cross-skill triggers) automatically guide what to measure at each phase:

| Phase     | What the agent does                                                                                 |
|-----------|-----------------------------------------------------------------------------------------------------|
| **Sense** | Navigates to the URL, activates the relevant SKILL, runs scripts via `evaluate_script`              |
| **Analyze** | Reads results, applies `SKILL.md` decision trees, follows cross-skill triggers if needed          |
| **Report** | Presents structured diagnosis: element → value → cause → fix                                      |
| **Wait**  | Waits for confirmation before editing files                                                         |

The **Wait** phase is critical in a live workshop: it lets attendees see the diagnosis, discuss it, and decide whether the agent should apply the fix.

### Output Style

```markdown
## Output Style
- Respond in the same language the user uses.
- Be direct and technical. No filler, no preamble.
- When reporting a problem: element → metric value → root cause → proposed fix.
```

This reduces noise in responses. Without this rule, Gemini may return explanatory paragraphs where you only need: "`#hero-image` → LCP 3240ms → no fetchpriority → add `fetchpriority="high"`".

### Domain Rules

```markdown
## Web Performance Rules
- LCP target: < 2.5s. Above-the-fold images must have fetchpriority="high".
- CLS target: < 0.1. Reserve space for dynamic content before it loads.
- INP target: < 200ms. No synchronous blocking on the main thread.
```

The SKILLs' thresholds already define what is "good", "needs-improvement", and "poor". The `GEMINI.md` rules reinforce those thresholds at the project level and add corrective practices.

## 3. Demo: Before and After GEMINI.md

### Without GEMINI.md

```
gemini "Analyze the performance of localhost:3000"
```

Typical response: conversational text, estimated metrics, generic suggestions without measured evidence.

### With GEMINI.md + WebPerf Skills

```
gemini "Analyze the performance of localhost:3000"
```

Expected response:
1. The agent navigates to the URL (MCP: `navigate_page`)
2. Activates `webperf-core-web-vitals` → runs `LCP.js`, `CLS.js`, `INP.js`
3. Applies decision trees: LCP > 2.5s → runs `LCP-Sub-Parts.js`
4. Cross-skill trigger → activates `webperf-loading` → runs `Priority-Hints-Audit.js`
5. Presents structured diagnosis: element → value → cause → fix
6. Waits for confirmation before modifying code

The difference in quality, precision, and structure is the most direct demonstration of the value of both pieces.

## 4. Evolution: GEMINI.md Grows with the Project

`GEMINI.md` is not static. Every time the agent fails or succeeds in a way you want to repeat, you add a rule:

- Did the agent modify a file without permission? → Reinforce the Wait rule.
- Did it ignore an above-the-fold image without fetchpriority? → Add the explicit rule.
- Did it use a generated script instead of the SKILL? → Reinforce "never generate from scratch".

The file grows based on the team's experience with the agent, not on speculation.

---
**Next step:** See how the agent orchestrates the entire flow autonomously in `04_orchestration.md`.
