# Módulo 03: GEMINI.md — El Protocolo del Agente

En el módulo anterior instalamos las SKILLs — el "qué sabe hacer" el agente. `GEMINI.md` define el "cómo lo hace": en qué orden, con qué restricciones, y cuándo esperar confirmación antes de actuar.

## 1. Qué es GEMINI.md

`GEMINI.md` es un archivo en la raíz del proyecto que Gemini CLI lee automáticamente al arrancar. Funciona como un `system prompt` persistente, pero con dos ventajas:

- **Vive con el código**: se versiona en Git, se revisa en PRs, evoluciona con el proyecto.
- **Es declarativo**: define reglas de comportamiento, no instrucciones paso a paso.

Sin `GEMINI.md`, Gemini actúa como un asistente conversacional genérico. Con él, actúa como un ingeniero especializado con un protocolo de trabajo reproducible.

## 2. El GEMINI.md de este taller

Este repositorio ya incluye un [`GEMINI.md`](./GEMINI.md). Vamos a revisar cada sección:

### Modelo

```markdown
## Model
Use `gemini-2.0-flash` for all tasks in this project.
```

Usamos un modelo de pago por dos razones: ventana de contexto de 1M tokens (necesaria cuando el agente carga SKILLs + código + métricas), y razonamiento más preciso para interpretar decision trees complejos.

### Rol

```markdown
## Role
You are a Senior Web Performance Engineer.
Your job is to detect, diagnose, and fix Core Web Vitals issues (LCP, CLS, INP)
using Chrome DevTools MCP tools and WebPerf Skills.
```

El rol limita el scope del agente. Un agente sin rol responde a cualquier pregunta. Un agente con rol canaliza todas las respuestas a través de la perspectiva de Web Performance.

### Herramientas y Skills

```markdown
## Tools
- Always use Chrome DevTools MCP tools before speculating about the code.
- Use the installed WebPerf Skills to measure performance.
  Read the script files and inject them via `evaluate_script`.
- Never generate measurement scripts from scratch — use the pre-validated ones.
- Never guess or estimate metrics — measure them.
```

Esta sección conecta las dos piezas: MCP (el brazo ejecutor) y Skills (el conocimiento). La regla "never generate measurement scripts from scratch" es la que garantiza el determinismo — fuerza al agente a usar los `.js` de las Skills en lugar de inventar código.

### Workflow: Sense → Analyze → Act

```markdown
## Workflow
1. **Sense**: Navigate to the URL and capture metrics using the WebPerf Skills.
2. **Analyze**: Identify the root cause from the data, not from assumptions.
3. **Report**: Specify the element, metric value, file/line, and Long Task duration when available.
4. **Wait**: Do not modify any file until the user gives explicit confirmation.
```

Este es el protocolo de **Progressive Disclosure** aplicado al agente. El workflow de `GEMINI.md` define la secuencia; las SKILLs (con sus decision trees y cross-skill triggers) guían automáticamente qué medir en cada fase:

| Fase | Qué hace el agente |
|------|-------------------|
| **Sense** | Navega a la URL, activa la SKILL relevante, ejecuta scripts via `evaluate_script` |
| **Analyze** | Lee los resultados, aplica los decision trees del `SKILL.md`, sigue cross-skill triggers si es necesario |
| **Report** | Presenta diagnóstico estructurado: elemento → valor → causa → fix |
| **Wait** | Espera confirmación antes de editar archivos |

La fase **Wait** es crítica en un taller en vivo: permite que los asistentes vean el diagnóstico, lo discutan, y decidan si el agente debe aplicar el fix.

### Estilo de salida

```markdown
## Output Style
- Respond in the same language the user uses.
- Be direct and technical. No filler, no preamble.
- When reporting a problem: element → metric value → root cause → proposed fix.
```

Esto reduce el ruido en las respuestas. Sin esta regla, Gemini puede devolver párrafos explicativos donde solo necesitas: "`#hero-image` → LCP 3240ms → sin fetchpriority → añadir `fetchpriority="high"`".

### Reglas de dominio

```markdown
## Web Performance Rules
- LCP target: < 2.5s. Above-the-fold images must have fetchpriority="high".
- CLS target: < 0.1. Reserve space for dynamic content before it loads.
- INP target: < 200ms. No synchronous blocking on the main thread.
```

Los umbrales de las SKILLs ya definen qué es "good", "needs-improvement" y "poor". Las reglas de `GEMINI.md` refuerzan esos umbrales a nivel de proyecto y añaden las prácticas correctivas.

## 3. Demostración: antes y después de GEMINI.md

### Sin GEMINI.md

```
gemini "Analiza el rendimiento de localhost:3000"
```

Respuesta típica: texto conversacional, métricas estimadas, sugerencias genéricas sin evidencia medida.

### Con GEMINI.md + WebPerf Skills

```
gemini "Analiza el rendimiento de localhost:3000"
```

Respuesta esperada:
1. El agente navega a la URL (MCP: `navigate_page`)
2. Activa `webperf-core-web-vitals` → ejecuta `LCP.js`, `CLS.js`, `INP.js`
3. Aplica decision trees: LCP > 2.5s → ejecuta `LCP-Sub-Parts.js`
4. Cross-skill trigger → activa `webperf-loading` → ejecuta `Priority-Hints-Audit.js`
5. Presenta diagnóstico estructurado: elemento → valor → causa → fix
6. Espera confirmación antes de modificar código

La diferencia en calidad, precisión y estructura es la demostración más directa del valor de ambas piezas.

## 4. Evolución: el GEMINI.md crece con el proyecto

`GEMINI.md` no es estático. Cada vez que el agente falla o acierta de una forma que quieres repetir, añades una regla:

- ¿El agente modificó un archivo sin permiso? → Refuerza la regla de Wait.
- ¿Ignoró una imagen above-the-fold sin fetchpriority? → Añade la regla explícita.
- ¿Usó un script generado en lugar de la SKILL? → Refuerza "never generate from scratch".

El archivo crece en base a la experiencia del equipo con el agente, no en base a especulación.

---
**Siguiente paso:** Ver cómo el agente orquesta todo el flujo de forma autónoma en `04_orchestration.es.md`.
