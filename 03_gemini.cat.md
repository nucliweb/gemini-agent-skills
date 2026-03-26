# Mòdul 03: GEMINI.md — El Protocol de l'Agent

Al mòdul anterior vam instal·lar les SKILLs — el "què sap fer" l'agent. `GEMINI.md` defineix el "com ho fa": en quin ordre, amb quines restriccions, i quan esperar confirmació abans d'actuar.

## 1. Què és GEMINI.md

`GEMINI.md` és un fitxer a l'arrel del projecte que Gemini CLI llegeix automàticament en iniciar. Funciona com un `system prompt` persistent, però amb dos avantatges:

- **Viu amb el codi**: es versiona a Git, es revisa en PRs, evoluciona amb el projecte.
- **És declaratiu**: defineix regles de comportament, no instruccions pas a pas.

Sense `GEMINI.md`, Gemini actua com un assistent conversacional genèric. Amb ell, actua com un enginyer especialitzat amb un protocol de treball reproduïble.

## 2. El GEMINI.md d'aquest taller

Aquest repositori ja inclou un [`GEMINI.md`](./GEMINI.md). Revisem cada secció:

### Model

```markdown
## Model
Use `gemini-2.0-flash` for all tasks in this project.
```

Fem servir un model de pagament per dues raons: finestra de context d'1M tokens (necessària quan l'agent carrega SKILLs + codi + mètriques), i raonament més precís per interpretar decision trees complexos.

### Rol

```markdown
## Role
You are a Senior Web Performance Engineer.
Your job is to detect, diagnose, and fix Core Web Vitals issues (LCP, CLS, INP)
using Chrome DevTools MCP tools and WebPerf Skills.
```

El rol limita l'abast de l'agent. Un agent sense rol respon a qualsevol pregunta. Un agent amb rol canalitza totes les respostes a través de la perspectiva de Web Performance.

### Eines i Skills

```markdown
## Tools
- Always use Chrome DevTools MCP tools before speculating about the code.
- Use the installed WebPerf Skills to measure performance.
  Read the script files and inject them via `evaluate_script`.
- Never generate measurement scripts from scratch — use the pre-validated ones.
- Never guess or estimate metrics — measure them.
```

Aquesta secció connecta les dues peces: MCP (el braç executor) i Skills (el coneixement). La regla "never generate measurement scripts from scratch" és la que garanteix el determinisme — obliga l'agent a fer servir els `.js` de les Skills en lloc d'inventar codi.

### Workflow: Sense → Analyze → Act

```markdown
## Workflow
1. **Sense**: Navigate to the URL and capture metrics using the WebPerf Skills.
2. **Analyze**: Identify the root cause from the data, not from assumptions.
3. **Report**: Specify the element, metric value, file/line, and Long Task duration when available.
4. **Wait**: Do not modify any file until the user gives explicit confirmation.
```

Aquest és el protocol de **Progressive Disclosure** aplicat a l'agent. El workflow de `GEMINI.md` defineix la seqüència; les SKILLs (amb els seus decision trees i cross-skill triggers) guien automàticament què mesurar en cada fase:

| Fase       | Què fa l'agent                                                                                      |
|------------|-----------------------------------------------------------------------------------------------------|
| **Sense**  | Navega a la URL, activa la SKILL rellevant, executa scripts via `evaluate_script`                   |
| **Analyze**| Llegeix els resultats, aplica els decision trees del `SKILL.md`, segueix cross-skill triggers si cal |
| **Report** | Presenta diagnòstic estructurat: element → valor → causa → fix                                      |
| **Wait**   | Espera confirmació abans d'editar fitxers                                                           |

La fase **Wait** és crítica en un taller en directe: permet que els assistents vegin el diagnòstic, el debatin, i decideixin si l'agent ha d'aplicar el fix.

### Estil de sortida

```markdown
## Output Style
- Respond in the same language the user uses.
- Be direct and technical. No filler, no preamble.
- When reporting a problem: element → metric value → root cause → proposed fix.
```

Això redueix el soroll a les respostes. Sense aquesta regla, Gemini pot retornar paràgrafs explicatius on només necessites: "`#hero-image` → LCP 3240ms → sense fetchpriority → afegir `fetchpriority="high"`".

### Regles de domini

```markdown
## Web Performance Rules
- LCP target: < 2.5s. Above-the-fold images must have fetchpriority="high".
- CLS target: < 0.1. Reserve space for dynamic content before it loads.
- INP target: < 200ms. No synchronous blocking on the main thread.
```

Els llindars de les SKILLs ja defineixen què és "good", "needs-improvement" i "poor". Les regles de `GEMINI.md` reforcen aquests llindars a nivell de projecte i afegeixen les pràctiques correctores.

## 3. Demostració: abans i després de GEMINI.md

### Sense GEMINI.md

```
gemini "Analitza el rendiment de localhost:3000"
```

Resposta típica: text conversacional, mètriques estimades, suggeriments genèrics sense evidència mesurada.

### Amb GEMINI.md + WebPerf Skills

```
gemini "Analitza el rendiment de localhost:3000"
```

Resposta esperada:
1. L'agent navega a la URL (MCP: `navigate_page`)
2. Activa `webperf-core-web-vitals` → executa `LCP.js`, `CLS.js`, `INP.js`
3. Aplica decision trees: LCP > 2.5s → executa `LCP-Sub-Parts.js`
4. Cross-skill trigger → activa `webperf-loading` → executa `Priority-Hints-Audit.js`
5. Presenta diagnòstic estructurat: element → valor → causa → fix
6. Espera confirmació abans de modificar codi

La diferència en qualitat, precisió i estructura és la demostració més directa del valor de les dues peces.

## 4. Evolució: el GEMINI.md creix amb el projecte

`GEMINI.md` no és estàtic. Cada vegada que l'agent falla o encerta d'una manera que vols repetir, afegeixes una regla:

- L'agent va modificar un fitxer sense permís? → Reforça la regla de Wait.
- Va ignorar una imatge above-the-fold sense fetchpriority? → Afegeix la regla explícita.
- Va fer servir un script generat en lloc de la SKILL? → Reforça "never generate from scratch".

El fitxer creix en base a l'experiència de l'equip amb l'agent, no en base a especulació.

---
**Següent pas:** Veure com l'agent orquestra tot el flux de forma autònoma a `04_orchestration.cat.md`.
