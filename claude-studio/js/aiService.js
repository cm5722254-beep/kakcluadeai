// ==========================================================================
// Claude Studio - AI Streaming Engine & Model Service
// Handles local streaming simulation, stop controller, and artifact generation
// Structured so sendToModel() can easily connect to a real Anthropic/FCC endpoint
// ==========================================================================

window.ClaudeStudio = window.ClaudeStudio || {};

window.ClaudeStudio.AIService = (function () {
  let activeAbortController = null;

  /**
   * Main entry point to send messages to the AI model
   */
  async function sendToModel({ messages, model, fileContext, onChunk, onDone, onError }) {
    if (activeAbortController) {
      activeAbortController.abort();
    }
    activeAbortController = new AbortController();
    const signal = activeAbortController.signal;

    const lastMsg = messages[messages.length - 1]?.content || '';
    
    try {
      // Simulate intelligent contextual response generation
      const { fullText, artifact } = generateContextualResponse(lastMsg, messages, fileContext);

      let currentIndex = 0;
      let accumulated = '';
      const chunkSize = 4; // characters per tick
      const intervalMs = 18;

      function streamTick() {
        if (signal.aborted) {
          onDone({ text: accumulated, aborted: true, artifact: null });
          return;
        }

        if (currentIndex < fullText.length) {
          const nextChunk = fullText.slice(currentIndex, currentIndex + chunkSize);
          accumulated += nextChunk;
          currentIndex += chunkSize;
          onChunk(accumulated);
          setTimeout(streamTick, intervalMs);
        } else {
          activeAbortController = null;
          onDone({ text: fullText, aborted: false, artifact });
        }
      }

      setTimeout(streamTick, 120);
    } catch (err) {
      activeAbortController = null;
      onError(err);
    }
  }

  function stopGeneration() {
    if (activeAbortController) {
      activeAbortController.abort();
      activeAbortController = null;
      return true;
    }
    return false;
  }

  function generateContextualResponse(prompt, messages, fileContext) {
    const lower = prompt.toLowerCase();
    let fullText = '';
    let artifact = null;

    // Check if Khmer language prompt
    const isKhmer = /[\u1780-\u17FF]/.test(prompt);

    if (isKhmer) {
      fullText = `សួស្តី! ខ្ញុំបានវិភាគសំណើរបស់អ្នករួចរាល់ហើយ៖

### ១. ការពន្យល់សង្ខេប (Overview)
ផ្អែកលើសំណួររបស់អ្នក ទាក់ទងនឹង **"${prompt.slice(0, 40)}..."** ខ្ញុំបានរៀបចំស្ថាបត្យកម្ម និងកូដគំរូយ៉ាងច្បាស់លាស់ ដោយគ្មានកាត់បន្ថយ ឬប្រើ Placeholder ឡើយ។

### ២. ដំណោះស្រាយបច្ចេកទេស (Implementation)
\`\`\`javascript
// Production implementation logic
export async function executeTask(payload) {
  try {
    const validated = validateInput(payload);
    const result = await processPipeline(validated);
    return { success: true, data: result };
  } catch (error) {
    console.error('Execution failure:', error);
    return { success: false, error: error.message };
  }
}
\`\`\`

តើអ្នកចង់ឱ្យខ្ញុំបន្ថែម Unit Tests ឬកែសម្រួលផ្នែកណាទៀតដែរទេ?`;
      return { fullText, artifact: null };
    }

    // Check for UI / Chart / Dashboard / Component requests
    if (lower.includes('chart') || lower.includes('dashboard') || lower.includes('component') || lower.includes('ui') || lower.includes('svg')) {
      const artifactTitle = 'Realtime Stream Metrics Dashboard';
      const artifactHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${artifactTitle}</title>
<style>
  :root {
    --bg: #0e0d0c;
    --card: #161513;
    --border: rgba(255, 255, 255, 0.08);
    --accent: #d97757;
    --text: #ece9e4;
    --muted: #9b968e;
    --mint: #5fbf9a;
  }
  * { box-sizing: border-box; margin:0; padding:0; }
  body {
    background: var(--bg);
    color: var(--text);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    padding: 24px;
    display: flex;
    justify-content: center;
  }
  .dashboard {
    width: 100%;
    max-width: 720px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 10px 24px rgba(0,0,0,0.4);
  }
  .header { display:flex; justify-content:space-between; align-items:center; }
  .title { font-size: 13px; font-weight:600; text-transform:uppercase; letter-spacing:0.06em; color:var(--muted); }
  .grid { display:grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
  .kpi-card { background: rgba(255,255,255,0.02); border: 1px solid var(--border); border-radius: 8px; padding: 14px; }
  .kpi-val { font-size: 22px; font-weight: 700; color: #fff; margin-top: 4px; }
  .kpi-trend { font-size: 11px; color: var(--mint); font-weight: 600; }
  svg { width: 100%; height: 160px; overflow: visible; margin-top: 14px; }
  .btn {
    background: var(--accent);
    color: #fff;
    border: none;
    padding: 8px 14px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.2s;
  }
  .btn:hover { opacity: 0.85; }
</style>
</head>
<body>
  <div class="dashboard">
    <div class="card header">
      <div>
        <div class="title">System Performance Telemetry</div>
        <div style="font-size: 18px; font-weight:600; margin-top:2px;">Live Operational Health</div>
      </div>
      <button class="btn" onclick="randomizeData()">Refresh Data</button>
    </div>

    <div class="grid">
      <div class="kpi-card">
        <div class="title">Throughput</div>
        <div class="kpi-val" id="kpi-1">128.4k</div>
        <span class="kpi-trend">↑ 14.8% vs last hr</span>
      </div>
      <div class="kpi-card">
        <div class="title">p99 Latency</div>
        <div class="kpi-val" id="kpi-2">12.4 ms</div>
        <span class="kpi-trend" style="color:#5fbf9a;">↓ 2.1 ms optimal</span>
      </div>
      <div class="kpi-card">
        <div class="title">Availability</div>
        <div class="kpi-val" id="kpi-3">99.99%</div>
        <span class="kpi-trend">Nominal State</span>
      </div>
    </div>

    <div class="card">
      <div class="title">Request Volume (Events / Sec)</div>
      <svg id="chart" viewBox="0 0 600 160">
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#d97757" stop-opacity="0.5"/>
            <stop offset="100%" stop-color="#d97757" stop-opacity="0"/>
          </linearGradient>
        </defs>
        <path id="chartArea" fill="url(#areaGrad)"/>
        <path id="chartLine" fill="none" stroke="#d97757" stroke-width="2.5" stroke-linecap="round"/>
      </svg>
    </div>
  </div>

  <script>
    let pts = [28, 42, 35, 50, 68, 59, 84, 72, 95, 88, 104, 120, 115, 138, 148];
    function renderChart() {
      const width = 600, height = 160;
      const max = Math.max(...pts) * 1.15;
      const step = width / (pts.length - 1);
      const coords = pts.map((v, i) => ({
        x: i * step,
        y: height - (v / max) * (height - 24) - 12
      }));

      let d = 'M ' + coords[0].x + ' ' + coords[0].y;
      for (let i = 0; i < coords.length - 1; i++) {
        const mx = (coords[i].x + coords[i + 1].x) / 2;
        d += ' C ' + mx + ' ' + coords[i].y + ', ' + mx + ' ' + coords[i + 1].y + ', ' + coords[i + 1].x + ' ' + coords[i + 1].y;
      }
      document.getElementById('chartLine').setAttribute('d', d);
      document.getElementById('chartArea').setAttribute('d', d + ' L ' + width + ' ' + height + ' L 0 ' + height + ' Z');
    }

    function randomizeData() {
      pts = pts.map(v => Math.max(20, Math.floor(v + (Math.random() * 26 - 12))));
      document.getElementById('kpi-1').innerText = (pts[pts.length - 1] * 0.95).toFixed(1) + 'k';
      document.getElementById('kpi-2').innerText = (10 + Math.random() * 4).toFixed(1) + ' ms';
      renderChart();
    }
    renderChart();
  </script>
</body>
</html>`;

      artifact = {
        title: artifactTitle,
        type: 'html',
        language: 'html',
        content: artifactHtml
      };

      fullText = `I have designed and built a zero-placeholder, standalone **${artifactTitle}** component with high-fidelity visual styling.\n\n### Technical Architecture\n1. **Zero External Dependencies**: Pure vanilla HTML, CSS, and SVG.\n2. **Dynamic Spline Interpolation**: Uses cubic Bezier curves to render continuous streaming coordinates.\n3. **Tactile Interactivity**: Live data refresh with real-time DOM updates.\n\n\`\`\`html\n<!-- Core SVG Layout -->\n<svg viewBox="0 0 600 160">\n  <path id="chartArea" fill="url(#areaGrad)"/>\n  <path id="chartLine" fill="none" stroke="#d97757" stroke-width="2.5"/>\n</svg>\n\`\`\`\n\nI have opened this component as an interactive sandbox in the **Artifacts panel on the right**. You can toggle between **Preview** and **Code**, or inspect the live behavior!`;
      return { fullText, artifact };
    }

    // Default deep technical reply
    fullText = `Here is the comprehensive, production-grade analysis for your request:\n\n### Architectural Invariants\nTo ensure resilience and sub-second response times, we apply three core design principles:\n\n1. **Deterministic Latency Budgets**: Each downstream dependency has an explicit timeout and circuit breaker.\n2. **Stateless Scale-out**: State is pushed into partitioned persistent stores, allowing workers to restart with zero warm-up.\n3. **Strict Validation**: All network inputs undergo schema validation at the gateway edge.\n\n\`\`\`typescript\nexport interface TelemetryConfig {\n  serviceName: string;\n  sampleRate: number;\n  exportIntervalMs: number;\n}\n\nexport class MetricsCollector {\n  private buffer: Map<string, number> = new Map();\n\n  constructor(private readonly config: TelemetryConfig) {}\n\n  public record(metric: string, value: number): void {\n    const current = this.buffer.get(metric) || 0;\n    this.buffer.set(metric, current + value);\n  }\n}\n\`\`\`\n\n### Next Steps\n- Would you like me to generate comprehensive unit tests covering edge cases?\n- Or should we expand the concurrency model for this component?`;

    return { fullText, artifact: null };
  }

  return {
    sendToModel,
    stopGeneration
  };
})();
