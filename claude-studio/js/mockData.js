// ==========================================================================
// Claude Studio - Comprehensive Realistic Mock Data
// 22+ Conversations, 8 Projects, 15 Prompt Templates, 10 Knowledge Files
// ==========================================================================

window.ClaudeStudio = window.ClaudeStudio || {};

window.ClaudeStudio.MockData = (function () {
  const now = Date.now();
  const ONE_HOUR = 3600 * 1000;
  const ONE_DAY = 24 * ONE_HOUR;

  // 1. Projects (8 Realistic Projects)
  const projects = [
    {
      id: 'proj-1',
      name: 'OmniFlow Analytics',
      description: 'Next-generation streaming analytics pipeline with sub-second event aggregation and ClickHouse integration.',
      color: '#d97757',
      icon: 'layers',
      instructions: 'You are assisting with high-throughput event processing in Go and TypeScript. Always optimize for memory efficiency and zero allocations in hot paths.',
      chatsCount: 6,
      filesCount: 4,
      updatedAt: now - ONE_HOUR * 2,
      isPinned: true,
      tasks: [
        { id: 't-1-1', title: 'Zero-allocation ring buffer for UDP/gRPC stream ingestion', priority: 'high', completed: true },
        { id: 't-1-2', title: 'ClickHouse bulk insert writer with backpressure timeout', priority: 'high', completed: true },
        { id: 't-1-3', title: 'Prometheus histogram exporter for p99 event processing latency', priority: 'medium', completed: true },
        { id: 't-1-4', title: 'Load test pipeline at 250k events/sec sustained throughput', priority: 'high', completed: false },
        { id: 't-1-5', title: 'Automated failover recovery tests for cluster partition', priority: 'low', completed: false }
      ]
    },
    {
      id: 'proj-2',
      name: 'NeuralSearch RAG Engine',
      description: 'Hybrid semantic and sparse retrieval framework using Qdrant vector database and ColBERT reranking.',
      color: '#8b7cf6',
      icon: 'cpu',
      instructions: 'Provide production Python 3.12 code using async httpx and Pydantic v2. Include strict type hinting and latency telemetry.',
      chatsCount: 4,
      filesCount: 3,
      updatedAt: now - ONE_HOUR * 5,
      isPinned: true,
      tasks: [
        { id: 't-2-1', title: 'Configure Qdrant vector collections with HNSW indexing', priority: 'high', completed: true },
        { id: 't-2-2', title: 'Integrate ColBERT v2 sparse and dense hybrid reranker', priority: 'high', completed: true },
        { id: 't-2-3', title: 'Implement async sliding chunker with token boundary preservation', priority: 'medium', completed: false },
        { id: 't-2-4', title: 'Benchmark semantic query recall vs BM25 baseline', priority: 'medium', completed: false }
      ]
    },
    {
      id: 'proj-3',
      name: 'Aether Design System',
      description: 'Accessible WCAG AAA component tokens, CSS fluid layouts, and headless Radix primitives.',
      color: '#5fbf9a',
      icon: 'compass',
      instructions: 'Design with subtle tactile physics, warm muted tones, accessible contrast, and zero external runtime dependencies.',
      chatsCount: 3,
      filesCount: 2,
      updatedAt: now - ONE_DAY * 1,
      isPinned: false,
      tasks: [
        { id: 't-3-1', title: 'Audit APCA contrast ratios for dark and light surfaces', priority: 'high', completed: true },
        { id: 't-3-2', title: 'Design modular spring animation tokens in CSS custom properties', priority: 'medium', completed: true },
        { id: 't-3-3', title: 'Compose headless Combobox with keyboard navigation', priority: 'high', completed: true },
        { id: 't-3-4', title: 'Publish responsive typography scale tokens', priority: 'low', completed: false }
      ]
    },
    {
      id: 'proj-4',
      name: 'Hyperion Trading Desk',
      description: 'Algorithmic backtesting engine and order execution simulator with interactive SVG order books.',
      color: '#e0a84a',
      icon: 'zap',
      instructions: 'Focus on deterministic floating point calculation, risk limits validation, and WebSocket backpressure handling.',
      chatsCount: 5,
      filesCount: 3,
      updatedAt: now - ONE_DAY * 2,
      isPinned: false,
      tasks: [
        { id: 't-4-1', title: 'Simulate L2 order book depth with SVG price-ladder viz', priority: 'high', completed: true },
        { id: 't-4-2', title: 'Implement fixed-point decimal arithmetic for trade matching', priority: 'high', completed: true },
        { id: 't-4-3', title: 'Add maximum drawdown and Sharpe ratio calculation modules', priority: 'medium', completed: false },
        { id: 't-4-4', title: 'WebSocket reconnection state-machine with backoff', priority: 'medium', completed: false }
      ]
    },
    {
      id: 'proj-5',
      name: 'Kroma Video Encoder',
      description: 'Hardware-accelerated AV1 and WebM video processing daemon for high-fidelity anime broadcasting.',
      color: '#e5636b',
      icon: 'play',
      instructions: 'Focus on FFmpeg libavcodec bindings, HDR color spaces, and distributed chunk transcoding.',
      chatsCount: 2,
      filesCount: 1,
      updatedAt: now - ONE_DAY * 3,
      isPinned: false,
      tasks: [
        { id: 't-5-1', title: 'Write C bindings for SVT-AV1 preset 6 CBR encoding', priority: 'high', completed: true },
        { id: 't-5-2', title: 'Implement HDR10 PQ curve color metadata preservation', priority: 'medium', completed: false },
        { id: 't-5-3', title: 'Distributed chunk splitter with audio stream pass-through', priority: 'high', completed: false }
      ]
    },
    {
      id: 'proj-6',
      name: 'Prism Mobile SDK',
      description: 'Cross-platform offline-first mobile sync bridge utilizing SQLite-Vec and CRDT state synchronizers.',
      color: '#38bdf8',
      icon: 'file-code',
      instructions: 'Prioritize minimal battery drain, deterministic conflict resolution, and end-to-end payload encryption.',
      chatsCount: 3,
      filesCount: 2,
      updatedAt: now - ONE_DAY * 4,
      isPinned: false,
      tasks: [
        { id: 't-6-1', title: 'Automerge CRDT document tree synchronization', priority: 'high', completed: true },
        { id: 't-6-2', title: 'SQLite-Vec extension compilation for iOS and Android', priority: 'high', completed: true },
        { id: 't-6-3', title: 'Battery-efficient background push trigger handler', priority: 'low', completed: false }
      ]
    },
    {
      id: 'proj-7',
      name: 'Khmer NLP Toolkit',
      description: 'Dictionary-free syllable break and semantic word segmentation model tailored for low-resource languages.',
      color: '#d97757',
      icon: 'book-open',
      instructions: 'Include bilingual documentation in Khmer and English. Handle Unicode normalization sequences rigorously.',
      chatsCount: 4,
      filesCount: 2,
      updatedAt: now - ONE_DAY * 5,
      isPinned: false,
      tasks: [
        { id: 't-7-1', title: 'Khmer Unicode cluster segmentation algorithm (KCC)', priority: 'high', completed: true },
        { id: 't-7-2', title: 'Dictionary trie integration with longest-matching lookahead', priority: 'high', completed: true },
        { id: 't-7-3', title: 'Zero-width space (ZWSP) boundary insertion benchmark', priority: 'medium', completed: true },
        { id: 't-7-4', title: 'Bilingual documentation with interactive web playground', priority: 'medium', completed: false }
      ]
    },
    {
      id: 'proj-8',
      name: 'CloudCore Operator',
      description: 'Kubernetes custom operator for managing self-healing stateful multi-cloud LLM inference clusters.',
      color: '#a855f7',
      icon: 'terminal',
      instructions: 'Write idiomatic Go controller-runtime patterns. Implement rate-limiting, exponential backoff, and Prometheus metrics.',
      chatsCount: 2,
      filesCount: 1,
      updatedAt: now - ONE_DAY * 6,
      isPinned: false,
      tasks: [
        { id: 't-8-1', title: 'Define CRD schema for v1alpha1 LLMInferenceCluster', priority: 'high', completed: true },
        { id: 't-8-2', title: 'Reconcile loop with GPU node selector and tolerations', priority: 'high', completed: false },
        { id: 't-8-3', title: 'Dynamic horizontal autoscaler based on token queue depth', priority: 'medium', completed: false }
      ]
    }
  ];

  // 2. Knowledge Files (10 Realistic Files)
  const files = [
    {
      id: 'file-1',
      name: 'system-architecture-spec.md',
      size: '42.8 KB',
      sizeBytes: 43820,
      type: 'markdown',
      projectId: 'proj-1',
      uploadedAt: now - ONE_HOUR * 8,
      content: `# OmniFlow Architecture Specification\n\n## Overview\nOmniFlow is a distributed, event-driven streaming intelligence platform designed for sub-second aggregations.\n\n## Core Ingestion Invariants\n- Max event size: 128KB\n- Protocol buffers over mTLS\n- Partition key: tenant_id:shard_hash\n- Target p99 ingestion latency: <= 12ms`
    },
    {
      id: 'file-2',
      name: 'rag-vector-schema.json',
      size: '12.4 KB',
      sizeBytes: 12690,
      type: 'json',
      projectId: 'proj-2',
      uploadedAt: now - ONE_HOUR * 14,
      content: `{\n  "$schema": "https://json-schema.org/draft/2020-12/schema",\n  "collection_name": "knowledge_embeddings_v3",\n  "vectors": {\n    "dense_bert": { "size": 1536, "distance": "Cosine" },\n    "colbert_multivector": { "size": 128, "distance": "MaxSim" }\n  }\n}`
    },
    {
      id: 'file-3',
      name: 'aether-tokens.css',
      size: '18.1 KB',
      sizeBytes: 18534,
      type: 'css',
      projectId: 'proj-3',
      uploadedAt: now - ONE_DAY * 1,
      content: `:root {\n  --color-canvas: #0e0d0c;\n  --color-surface: #161513;\n  --color-accent: #d97757;\n  --radius-sm: 6px;\n  --radius-md: 10px;\n  --radius-lg: 14px;\n  --font-serif: "Newsreader", serif;\n  --font-sans: "Inter", sans-serif;\n  --font-mono: "JetBrains Mono", monospace;\n}`
    },
    {
      id: 'file-4',
      name: 'order-matching-engine.ts',
      size: '56.2 KB',
      sizeBytes: 57548,
      type: 'typescript',
      projectId: 'proj-4',
      uploadedAt: now - ONE_DAY * 2,
      content: `export interface Order {\n  id: string;\n  symbol: string;\n  side: 'BUY' | 'SELL';\n  price: number;\n  quantity: number;\n  timestamp: number;\n}\n\nexport class OrderBook {\n  private bids: Map<number, Order[]> = new Map();\n  private asks: Map<number, Order[]> = new Map();\n}`
    },
    {
      id: 'file-5',
      name: 'video-pipeline-benchmark.py',
      size: '24.9 KB',
      sizeBytes: 25497,
      type: 'python',
      projectId: 'proj-5',
      uploadedAt: now - ONE_DAY * 3,
      content: `import asyncio\nimport time\n\nasync def benchmark_chunk_encode(chunk_id: int):\n    start = time.perf_counter()\n    # Simulating AV1 SVT hardware encoder stream\n    await asyncio.sleep(0.04)\n    return {"chunk": chunk_id, "fps": 120.4, "vmaf": 96.8}`
    },
    {
      id: 'file-6',
      name: 'crdt-sync-state.json',
      size: '8.3 KB',
      sizeBytes: 8499,
      type: 'json',
      projectId: 'proj-6',
      uploadedAt: now - ONE_DAY * 4,
      content: `{\n  "client_id": "client_node_77x",\n  "logical_clock": 1048,\n  "vector_clock": { "node_a": 412, "node_b": 636 },\n  "pending_mutations_count": 0\n}`
    },
    {
      id: 'file-7',
      name: 'khmer-segmentation-rules.md',
      size: '31.5 KB',
      sizeBytes: 32256,
      type: 'markdown',
      projectId: 'proj-7',
      uploadedAt: now - ONE_DAY * 5,
      content: `# Khmer Word Segmentation Invariants\n\n## Syllable Boundaries\n1. Consonant Clusters (ព្យញ្ជនៈផ្ញើជើង): [ក-អ] followed by COENG (U+17D2)\n2. Dependent Vowels (ស្រៈនិស្ស័យ): U+17B6 to U+17C5\n3. Diacritics (វណ្ណយុត្តិ): U+17C6 to U+17D1`
    },
    {
      id: 'file-8',
      name: 'k8s-operator-crds.yaml',
      size: '14.2 KB',
      sizeBytes: 14540,
      type: 'yaml',
      projectId: 'proj-8',
      uploadedAt: now - ONE_DAY * 6,
      content: `apiVersion: apiextensions.k8s.io/v1\nkind: CustomResourceDefinition\nmetadata:\n  name: llmclusters.ai.claude.io\nspec:\n  group: ai.claude.io\n  names:\n    kind: LLMCluster\n    plural: llmclusters`
    },
    {
      id: 'file-9',
      name: 'security-threat-model.pdf',
      size: '124.0 KB',
      sizeBytes: 126976,
      type: 'pdf',
      projectId: 'proj-1',
      uploadedAt: now - ONE_DAY * 7,
      content: `Threat Model: STRIDE analysis for API Gateway, JWT verification, and automated rate limiting policies.`
    },
    {
      id: 'file-10',
      name: 'sqlite-vec-benchmark.csv',
      size: '88.4 KB',
      sizeBytes: 90521,
      type: 'csv',
      projectId: 'proj-6',
      uploadedAt: now - ONE_DAY * 8,
      content: `dimension,index_type,recall_at_10,latency_ms\n384,hnsw,0.984,1.42\n768,hnsw,0.979,2.15\n1536,hnsw,0.971,4.38`
    }
  ];

  // 3. Prompt Library (15 Realistic Production Prompt Templates)
  const prompts = [
    {
      id: 'prompt-1',
      title: 'Principal Architecture Review',
      category: 'Architecture',
      description: 'Perform an exhaustive critique of a proposed backend architecture for bottlenecks, failure domains, and scalability.',
      template: 'Act as a Principal Systems Architect. Review the following architecture for {{system_name}}.\nContext: {{context}}\nIdentify:\n1. Single points of failure\n2. p99 latency hot-paths\n3. Data consistency tradeoffs\n4. Recommended concrete refactors.',
      variables: ['system_name', 'context'],
      isFavorite: true,
      usageCount: 142
    },
    {
      id: 'prompt-2',
      title: 'Real Production UI Component',
      category: 'Frontend',
      description: 'Generate a 100% complete, accessible, zero-placeholder UI component with realistic state and styling.',
      template: 'Build a production-grade {{component_name}} in {{framework}}.\nRequirements:\n- Zero placeholders or TODO comments\n- Strict WCAG AAA keyboard navigation and ARIA attributes\n- Micro-animations using CSS variables\n- Responsive container query support for mobile & desktop\nState needed: {{state_details}}',
      variables: ['component_name', 'framework', 'state_details'],
      isFavorite: true,
      usageCount: 289
    },
    {
      id: 'prompt-3',
      title: 'SQL & Database Index Optimizer',
      category: 'Database',
      description: 'Analyze complex query execution plans, missing indexes, and lock contention.',
      template: 'Analyze this SQL query running on {{database_engine}}:\n```sql\n{{query_text}}\n```\nProvide:\n1. Execution plan explanation\n2. Optimal composite indexes\n3. Query rewrite avoiding table scans\n4. Benchmark expectations.',
      variables: ['database_engine', 'query_text'],
      isFavorite: false,
      usageCount: 88
    },
    {
      id: 'prompt-4',
      title: 'Security & Penetration Audit',
      category: 'Security',
      description: 'Inspect source code for OWASP Top 10 vulnerabilities, SSRF, IDOR, and injection flaws.',
      template: 'Conduct a thorough security review of this code:\n```{{language}}\n{{code_snippet}}\n```\nHighlight severe vulnerabilities, concrete exploits, and secure defensive implementations.',
      variables: ['language', 'code_snippet'],
      isFavorite: true,
      usageCount: 174
    },
    {
      id: 'prompt-5',
      title: 'Unit & Fuzz Testing Suite',
      category: 'Testing',
      description: 'Generate high-coverage unit tests with property-based and boundary condition testing.',
      template: 'Write a comprehensive test suite for this module using {{test_runner}}:\n{{source_code}}\nCover:\n- Happy paths\n- Edge cases & null inputs\n- Concurrency race conditions\n- Error handling assertions.',
      variables: ['test_runner', 'source_code'],
      isFavorite: false,
      usageCount: 96
    },
    {
      id: 'prompt-6',
      title: 'Refactor for Pure Functions & Clean Code',
      category: 'Refactoring',
      description: 'Refactor complex spaghetti code into modular, functional, testable pure components.',
      template: 'Refactor this {{language}} implementation into clean, idiomatic patterns:\n```\n{{code}}\n```\nPreserve all existing behaviors while eliminating side-effects, deep nesting, and mutable global state.',
      variables: ['language', 'code'],
      isFavorite: false,
      usageCount: 65
    },
    {
      id: 'prompt-7',
      title: 'Technical Specification Document (RFC)',
      category: 'Documentation',
      description: 'Draft a comprehensive Request For Comments (RFC) document for cross-team engineering consensus.',
      template: 'Write an RFC document for {{feature_name}} at {{company_or_team}}.\nSections required: Context & Problem Statement, Goals & Non-Goals, Proposed Architecture, Alternatives Considered, Migration Plan, Security & Privacy.',
      variables: ['feature_name', 'company_or_team'],
      isFavorite: true,
      usageCount: 112
    },
    {
      id: 'prompt-8',
      title: 'Bilingual Khmer & English Translator',
      category: 'Language',
      description: 'Translate technical and software documentation accurately between Khmer and English with natural phrasing.',
      template: 'Translate the following technical text between {{source_lang}} and {{target_lang}}:\n"{{text_to_translate}}"\nMaintain precise computing terminology, correct Khmer spelling rules (អក្ខរាវិរុទ្ធ), and professional formatting.',
      variables: ['source_lang', 'target_lang', 'text_to_translate'],
      isFavorite: true,
      usageCount: 204
    },
    {
      id: 'prompt-9',
      title: 'API Endpoint Spec (OpenAPI 3.1)',
      category: 'API Design',
      description: 'Design robust RESTful or GraphQL schema with strict request validation and error schemas.',
      template: 'Design an OpenAPI 3.1 specification for {{resource_name}} handling {{operations}}.\nInclude JSON Schema validation, authentication headers, 400/401/404/429 error responses, and pagination parameters.',
      variables: ['resource_name', 'operations'],
      isFavorite: false,
      usageCount: 52
    },
    {
      id: 'prompt-10',
      title: 'Docker & Multi-Stage Production Build',
      category: 'DevOps',
      description: 'Craft minimal, hardened, rootless Dockerfiles with layer caching and zero CVE vulnerabilities.',
      template: 'Create a production-hardened multi-stage Dockerfile for a {{app_type}} application.\nEnsure non-root execution, cache mounts for package managers, scratch/distroless base images, and healthcheck commands.',
      variables: ['app_type'],
      isFavorite: false,
      usageCount: 78
    },
    {
      id: 'prompt-11',
      title: 'Incident Postmortem & RCA',
      category: 'Operations',
      description: 'Draft a blameless root cause analysis (RCA) document with timeline and preventative action items.',
      template: 'Draft a blameless postmortem for incident: {{incident_title}}.\nDetails: {{incident_summary}}\nInclude: Timeline (UTC), Root Cause Analysis (5 Whys), Impact Analysis, What Went Well, Where We Got Lucky, and Preventative Action Items with owners.',
      variables: ['incident_title', 'incident_summary'],
      isFavorite: false,
      usageCount: 39
    },
    {
      id: 'prompt-12',
      title: 'CSS Glassmorphism & Fluid Styling',
      category: 'Frontend',
      description: 'Generate high-end aesthetic CSS variables, glassmorphic cards, and smooth micro-interactions.',
      template: 'Design a bespoke CSS theme for {{theme_concept}}.\nInclude CSS variables for light and dark modes, backdrop-filter blur treatments, custom scrollbars, and tactile active button states.',
      variables: ['theme_concept'],
      isFavorite: true,
      usageCount: 167
    },
    {
      id: 'prompt-13',
      title: 'Algorithm & Data Structure Optimizer',
      category: 'Algorithms',
      description: 'Reduce algorithmic time complexity from O(N^2) to O(N log N) or O(N) using advanced data structures.',
      template: 'Analyze the time and space complexity of this algorithm:\n```\n{{algorithm_code}}\n```\nProvide a mathematical Big-O analysis and an optimized rewrite with proof of correctness.',
      variables: ['algorithm_code'],
      isFavorite: false,
      usageCount: 91
    },
    {
      id: 'prompt-14',
      title: 'Interactive HTML/JS Sandbox Artifact',
      category: 'Artifacts',
      description: 'Generate a self-contained single-file HTML preview with interactive controls, charts, and animations.',
      template: 'Create a self-contained, interactive single-file HTML artifact that demonstrates {{demo_purpose}}.\nInclude inline CSS and vanilla JavaScript with zero external scripts. Ensure immediate rendering inside an iframe.',
      variables: ['demo_purpose'],
      isFavorite: true,
      usageCount: 310
    },
    {
      id: 'prompt-15',
      title: 'Kubernetes Pod Disruption & HPA Spec',
      category: 'DevOps',
      description: 'Configure production Kubernetes autoscaling, affinity rules, and zero-downtime rolling updates.',
      template: 'Write Kubernetes deployment manifests for {{service_name}} handling {{rps_load}} req/sec.\nInclude PodDisruptionBudget, HorizontalPodAutoscaler with custom metrics, anti-affinity rules, and readiness probes.',
      variables: ['service_name', 'rps_load'],
      isFavorite: false,
      usageCount: 44
    }
  ];

  // 4. Conversations (22 Realistic, Pre-populated Conversations with full history)
  const conversations = [
    {
      id: 'chat-1',
      title: 'Interactive SVG Chart Component',
      projectId: 'proj-3',
      isPinned: true,
      createdAt: now - ONE_HOUR * 1,
      updatedAt: now - ONE_HOUR * 1,
      messages: [
        {
          id: 'm-1-1',
          role: 'user',
          timestamp: now - ONE_HOUR * 1 - 60000,
          content: 'Can you build an interactive, pure SVG area chart component in vanilla JS? It needs smooth Bezier curves, a glowing gradient fill, hover tooltips showing data points, and no external libraries.'
        },
        {
          id: 'm-1-2',
          role: 'assistant',
          timestamp: now - ONE_HOUR * 1,
          content: `Here is a complete, production-grade **Interactive SVG Area Chart** built with zero external dependencies. It features cubic Bezier curve interpolation, an animated gradient fill, responsive coordinates calculation, and a smooth hover crosshair tooltip.\n\n### Key Technical Highlights\n- **Cubic Bezier Smoothing**: Computes natural control points based on neighboring coordinates.\n- **Sub-pixel Precision**: Scales dynamically across high-DPI displays.\n- **Interactive Scrubbing**: Debounced pointermove event listener tracking exact nearest data points.\n\n\`\`\`html\n<div class="chart-container" style="background:#161513; border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:20px; font-family:'Inter', sans-serif;">\n  <div style="display:flex; justify-content:space-between; margin-bottom:12px;">\n    <div>\n      <span style="font-size:12px; color:#9b968e; text-transform:uppercase; letter-spacing:0.05em;">Throughput</span>\n      <h3 style="margin:2px 0 0; color:#ece9e4; font-size:22px; font-weight:600;">142.8k <span style="font-size:13px; color:#5fbf9a;">+18.4%</span></h3>\n    </div>\n    <div style="display:flex; gap:6px;">\n      <button style="background:rgba(217,119,87,0.15); color:#d97757; border:1px solid rgba(217,119,87,0.3); padding:4px 10px; border-radius:6px; font-size:12px; font-weight:600;">Live</button>\n    </div>\n  </div>\n  <svg id="liveChart" viewBox="0 0 600 200" style="width:100%; height:auto; overflow:visible;">\n    <defs>\n      <linearGradient id="areaGlow" x1="0" y1="0" x2="0" y2="1">\n        <stop offset="0%" stop-color="#d97757" stop-opacity="0.45"/>\n        <stop offset="100%" stop-color="#d97757" stop-opacity="0.0"/>\n      </linearGradient>\n    </defs>\n    <path id="chartArea" fill="url(#areaGlow)"/>\n    <path id="chartLine" fill="none" stroke="#d97757" stroke-width="2.5" stroke-linecap="round"/>\n    <circle id="scrubPoint" r="5" fill="#ece9e4" stroke="#d97757" stroke-width="2" style="display:none; transition:transform 0.08s ease;"/>\n  </svg>\n</div>\n\`\`\`\n\nI have generated a live interactive preview for this in the Artifacts panel on the right. You can test hovering and previewing it immediately!`,
          hasArtifact: true,
          artifact: {
            title: 'Interactive SVG Chart Component',
            type: 'html',
            language: 'html',
            content: `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  body { margin:0; padding:24px; background:#0e0d0c; color:#ece9e4; font-family:-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display:flex; justify-content:center; }
  .card { width:100%; max-width:640px; background:#161513; border:1px solid rgba(255,255,255,0.08); border-radius:14px; padding:24px; box-shadow:0 12px 32px rgba(0,0,0,0.5); }
  .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:16px; }
  .stat-label { font-size:12px; color:#9b968e; text-transform:uppercase; letter-spacing:0.06em; font-weight:600; }
  .stat-val { font-size:26px; font-weight:700; margin-top:4px; display:flex; align-items:center; gap:8px; }
  .badge { font-size:12px; font-weight:600; background:rgba(95,191,154,0.15); color:#5fbf9a; padding:2px 8px; border-radius:6px; border:1px solid rgba(95,191,154,0.3); }
  svg { width:100%; height:180px; overflow:visible; cursor:crosshair; }
  .tooltip { position:absolute; pointer-events:none; background:#1d1b19; border:1px solid rgba(255,255,255,0.12); padding:4px 8px; border-radius:6px; font-size:12px; font-weight:600; color:#ece9e4; box-shadow:0 6px 16px rgba(0,0,0,0.4); display:none; }
</style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div>
        <div class="stat-label">Real-time Stream Aggregations</div>
        <div class="stat-val">142,890 <span class="badge">+18.4%</span></div>
      </div>
      <div style="font-size:12px; color:#9b968e;">Updated Just Now</div>
    </div>
    <div style="position:relative;">
      <svg id="chart" viewBox="0 0 600 180">
        <defs>
          <linearGradient id="glow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#d97757" stop-opacity="0.5"/>
            <stop offset="100%" stop-color="#d97757" stop-opacity="0"/>
          </linearGradient>
        </defs>
        <path id="area" fill="url(#glow)"/>
        <path id="line" fill="none" stroke="#d97757" stroke-width="2.5" stroke-linecap="round"/>
        <line id="scrubLine" y1="0" y2="180" stroke="rgba(255,255,255,0.2)" stroke-dasharray="3 3" style="display:none;"/>
        <circle id="point" r="5" fill="#ece9e4" stroke="#d97757" stroke-width="2.5" style="display:none;"/>
      </svg>
      <div id="tip" class="tooltip"></div>
    </div>
  </div>
  <script>
    const data = [24, 38, 30, 48, 62, 55, 78, 64, 88, 79, 95, 110, 102, 125, 142];
    const max = Math.max(...data) * 1.15;
    const min = 0;
    const width = 600, height = 180;
    const step = width / (data.length - 1);
    
    const pts = data.map((v, i) => ({
      x: i * step,
      y: height - ((v - min) / (max - min)) * (height - 30) - 15,
      val: v
    }));

    function getCurvedPath(points) {
      let d = \`M \${points[0].x} \${points[0].y}\`;
      for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i];
        const p1 = points[i + 1];
        const mx = (p0.x + p1.x) / 2;
        d += \` C \${mx} \${p0.y}, \${mx} \${p1.y}, \${p1.x} \${p1.y}\`;
      }
      return d;
    }

    const linePath = getCurvedPath(pts);
    document.getElementById('line').setAttribute('d', linePath);
    const areaPath = \`\${linePath} L \${width} \${height} L 0 \${height} Z\`;
    document.getElementById('area').setAttribute('d', areaPath);

    const svg = document.getElementById('chart');
    const point = document.getElementById('point');
    const scrubLine = document.getElementById('scrubLine');
    const tip = document.getElementById('tip');

    svg.addEventListener('mousemove', (e) => {
      const rect = svg.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / rect.width) * width;
      let nearest = pts[0];
      let minDist = Infinity;
      pts.forEach(p => {
        const d = Math.abs(p.x - mouseX);
        if (d < minDist) { minDist = d; nearest = p; }
      });

      point.style.display = 'block';
      point.setAttribute('cx', nearest.x);
      point.setAttribute('cy', nearest.y);

      scrubLine.style.display = 'block';
      scrubLine.setAttribute('x1', nearest.x);
      scrubLine.setAttribute('x2', nearest.x);

      tip.style.display = 'block';
      tip.style.left = ((nearest.x / width) * rect.width) + 'px';
      tip.style.top = ((nearest.y / height) * rect.height - 30) + 'px';
      tip.textContent = nearest.val.toLocaleString() + ' req/s';
    });

    svg.addEventListener('mouseleave', () => {
      point.style.display = 'none';
      scrubLine.style.display = 'none';
      tip.style.display = 'none';
    });
  </script>
</body>
</html>`
          }
        }
      ]
    },
    {
      id: 'chat-2',
      title: 'ClickHouse Partitioning Strategy',
      projectId: 'proj-1',
      isPinned: true,
      createdAt: now - ONE_HOUR * 3,
      updatedAt: now - ONE_HOUR * 2,
      messages: [
        {
          id: 'm-2-1',
          role: 'user',
          timestamp: now - ONE_HOUR * 3,
          content: 'We are ingesting 80 million events per day in ClickHouse. How should we partition and order our tables to avoid part mutations and small-part merge amplification?'
        },
        {
          id: 'm-2-2',
          role: 'assistant',
          timestamp: now - ONE_HOUR * 2,
          content: `To handle 80M daily events without triggering the dreaded \`Too many parts in all data parts in table\` error in ClickHouse, adhere strictly to these partitioning invariants:\n\n### 1. Partition By Month or Week (NEVER by Day or Hour)\nPartitioning by day creates ~365 active partitions per year. When combined with ingestion buffer flushes, this generates tens of thousands of unmerged parts.\n\n\`\`\`sql\nCREATE TABLE events_stream (\n    tenant_id UInt32,\n    event_type LowCardinality(String),\n    user_id UUID,\n    timestamp DateTime64(3, 'UTC'),\n    payload String\n)\nENGINE = ReplicatedReplacingMergeTree('/clickhouse/tables/{shard}/events_stream', '{replica}', timestamp)\nPARTITION BY toYYYYMM(timestamp)\nORDER BY (tenant_id, event_type, toStartOfHour(timestamp), user_id)\nSETTINGS index_granularity = 8192, parts_to_throw_insert = 300;\n\`\`\`\n\n### 2. Primary Key Ordering Rules\n- **Order from low cardinality to high cardinality**.\n- Placing \`tenant_id\` first enables instant partition pruning for multi-tenant queries.\n- Placing \`toStartOfHour(timestamp)\` before \`user_id\` clusters chronological time-ranges within the same granule.`
        }
      ]
    },
    {
      id: 'chat-3',
      title: 'Qdrant ColBERT Reranking Pipeline',
      projectId: 'proj-2',
      isPinned: false,
      createdAt: now - ONE_HOUR * 5,
      updatedAt: now - ONE_HOUR * 4,
      messages: [
        {
          id: 'm-3-1',
          role: 'user',
          timestamp: now - ONE_HOUR * 5,
          content: 'How do we implement ColBERT multi-vector MaxSim reranking over initial vector search results in Python?'
        },
        {
          id: 'm-3-2',
          role: 'assistant',
          timestamp: now - ONE_HOUR * 4,
          content: `Here is the optimized async ColBERT MaxSim reranker. Instead of performing naive all-pairs matrix multiplication, it computes the token-level maximum dot product across query tokens and document token embeddings:\n\n\`\`\`python\nimport numpy as np\nfrom typing import List, Dict\n\ndef colbert_maxsim(query_embeddings: np.ndarray, doc_embeddings: np.ndarray) -> float:\n    \"\"\"\n    Computes ColBERT MaxSim score.\n    query_embeddings: shape (Q_tokens, D_dim)\n    doc_embeddings: shape (D_tokens, D_dim)\n    \"\"\"\n    # Compute cosine similarity / dot-product matrix (Q_tokens x D_tokens)\n    sim_matrix = np.dot(query_embeddings, doc_embeddings.T)\n    # Max across document tokens for each query token, then sum across query tokens\n    max_per_query_token = np.max(sim_matrix, axis=1)\n    return float(np.sum(max_per_query_token))\n\`\`\`\n\nThis guarantees that semantic nuances captured by multi-vectors rank documents with 18% higher recall at 5 compared to single dense vector pooling.`
        }
      ]
    },
    {
      id: 'chat-4',
      title: 'Khmer Syllable Segmenter in JS',
      projectId: 'proj-7',
      isPinned: false,
      createdAt: now - ONE_HOUR * 7,
      updatedAt: now - ONE_HOUR * 6,
      messages: [
        {
          id: 'm-4-1',
          role: 'user',
          timestamp: now - ONE_HOUR * 7,
          content: 'សូមសរសេរកូដ JavaScript ដើម្បីកាត់ព្យាង្គភាសាខ្មែរ (Khmer Syllable Segmetation) ដោយប្រើ Regex ត្រឹមត្រូវតាមក្បួនខ្នាត។'
        },
        {
          id: 'm-4-2',
          role: 'assistant',
          timestamp: now - ONE_HOUR * 6,
          content: `នេះជាកូដ JavaScript ពេញលេញ និងត្រឹមត្រូវ ១០០% សម្រាប់កាត់ព្យាង្គភាសាខ្មែរ ដោយផ្អែកលើ Unicode ranges [U+1780 - U+17D2]៖\n\n\`\`\`javascript\n/**\n * Khmer Syllable Segmenter using deterministic Unicode regular expressions\n */\nexport function segmentKhmerSyllables(text) {\n  if (!text) return [];\n  \n  // Pattern matching Khmer Consonant + Subscripts + Vowels + Diacritics\n  const khmerPattern = /(?:[\\u1780-\\u17AF\\u17E0-\\u17E9](?:\\u17D2[\\u1780-\\u17AF])*(?:[\\u17B6-\\u17C5])*(?:[\\u17C6-\\u17D1\\u17D3])?|[\\s\\S])/gu;\n  \n  return text.match(khmerPattern) || [text];\n}\n\n// ឧទាហរណ៍នៃការប្រើប្រាស់:\nconst input = \"សួស្តីកម្ពុជា\";\nconst syllables = segmentKhmerSyllables(input);\nconsole.log(syllables); // [\"សួ\", \"ស្តី\", \"ក\", \"ម្ពុ\", \"ជា\"]\n\`\`\`\n\nកូដនេះដោះស្រាយបញ្ហាព្យញ្ជនៈផ្ញើជើង (Coeng) និងស្រៈនិស្ស័យបានយ៉ាងរលូន ដោយមិនបែកបាក់តួអក្សរឡើយ។`
        }
      ]
    },
    {
      id: 'chat-5',
      title: 'Low-latency Order Book Simulator',
      projectId: 'proj-4',
      isPinned: false,
      createdAt: now - ONE_DAY * 1 - ONE_HOUR * 2,
      updatedAt: now - ONE_DAY * 1,
      messages: [
        {
          id: 'm-5-1',
          role: 'user',
          timestamp: now - ONE_DAY * 1 - ONE_HOUR * 2,
          content: 'Write a TypeScript order book data structure that supports insert, match, and cancel in sub-microsecond time.'
        },
        {
          id: 'm-5-2',
          role: 'assistant',
          timestamp: now - ONE_DAY * 1,
          content: `For sub-microsecond latency, we use double-ended arrays indexed by price ticks rather than a standard tree, eliminating dynamic node allocation during execution:\n\n\`\`\`typescript\nexport class LowLatencyBook {\n  private bids: Float64Array;\n  private asks: Float64Array;\n  private readonly tickSize: number;\n  \n  constructor(maxTicks: number = 10000, tickSize: number = 0.01) {\n    this.bids = new Float64Array(maxTicks);\n    this.asks = new Float64Array(maxTicks);\n    this.tickSize = tickSize;\n  }\n  \n  public updateLevel(side: 'BID' | 'ASK', priceIndex: number, qty: number): void {\n    if (side === 'BID') this.bids[priceIndex] = qty;\n    else this.asks[priceIndex] = qty;\n  }\n}\n\`\`\``
        }
      ]
    },
    {
      id: 'chat-6',
      title: 'Tailwind to Vanilla CSS Token Migration',
      projectId: 'proj-3',
      isPinned: false,
      createdAt: now - ONE_DAY * 1 - ONE_HOUR * 4,
      updatedAt: now - ONE_DAY * 1 - ONE_HOUR * 3,
      messages: [
        {
          id: 'm-6-1',
          role: 'user',
          timestamp: now - ONE_DAY * 1 - ONE_HOUR * 4,
          content: 'How can we purge Tailwind from our codebase while retaining strict 4px spacing rhythm and design tokens in pure CSS?'
        },
        {
          id: 'm-6-2',
          role: 'assistant',
          timestamp: now - ONE_DAY * 1 - ONE_HOUR * 3,
          content: `We establish mathematical CSS primitives using \`calc()\` based on a single spacing unit:\n\n\`\`\`css\n:root {\n  --space-unit: 4px;\n  --space-1: calc(var(--space-unit) * 1); /* 4px */\n  --space-2: calc(var(--space-unit) * 2); /* 8px */\n  --space-3: calc(var(--space-unit) * 3); /* 12px */\n  --space-4: calc(var(--space-unit) * 4); /* 16px */\n  --space-6: calc(var(--space-unit) * 6); /* 24px */\n  --space-8: calc(var(--space-unit) * 8); /* 32px */\n}\n\`\`\`\nThis eliminates build-time PostCSS dependencies while giving 100% runtime flexibility.`
        }
      ]
    },
    {
      id: 'chat-7',
      title: 'FFmpeg AV1 Hardware Pipeline',
      projectId: 'proj-5',
      isPinned: false,
      createdAt: now - ONE_DAY * 2,
      updatedAt: now - ONE_DAY * 2,
      messages: [
        {
          id: 'm-7-1',
          role: 'user',
          timestamp: now - ONE_DAY * 2,
          content: 'What are the optimal SVT-AV1 preset parameters for 4K 60fps anime encoding with high film-grain retention?'
        },
        {
          id: 'm-7-2',
          role: 'assistant',
          timestamp: now - ONE_DAY * 2,
          content: `Use the following command for anime encoding. The key is enabling \`film-grain\` synthesis so clean line art is preserved without blocky quantization artifacts:\n\n\`\`\`bash\nffmpeg -i input_4k.mkv -c:v libsvtav1 -preset 5 -crf 22 \\\n  -svtav1-params tune=0:film-grain=12:film-grain-denoise=0:enable-restoration=1 \\\n  -pix_fmt yuv420p10le -c:a libopus -b:a 192k output_av1.mkv\n\`\`\``
        }
      ]
    },
    {
      id: 'chat-8',
      title: 'CRDT Conflict Resolution in SQLite',
      projectId: 'proj-6',
      isPinned: false,
      createdAt: now - ONE_DAY * 2 - ONE_HOUR * 6,
      updatedAt: now - ONE_DAY * 2 - ONE_HOUR * 5,
      messages: [
        {
          id: 'm-8-1',
          role: 'user',
          timestamp: now - ONE_DAY * 2 - ONE_HOUR * 6,
          content: 'How do we store LWW (Last-Write-Wins) registers in SQLite tables with offline client sync?'
        },
        {
          id: 'm-8-2',
          role: 'assistant',
          timestamp: now - ONE_DAY * 2 - ONE_HOUR * 5,
          content: `Store metadata columns for \`hlc_timestamp\` (Hybrid Logical Clock) and \`client_id\` directly alongside records:\n\n\`\`\`sql\nCREATE TABLE documents (\n    id TEXT PRIMARY KEY,\n    title TEXT,\n    content TEXT,\n    hlc_wall_ms INTEGER,\n    hlc_counter INTEGER,\n    client_id TEXT\n);\n\`\`\``
        }
      ]
    },
    {
      id: 'chat-9',
      title: 'Kubernetes Rolling Update Zero-Downtime',
      projectId: 'proj-8',
      isPinned: false,
      createdAt: now - ONE_DAY * 3,
      updatedAt: now - ONE_DAY * 3,
      messages: [
        {
          id: 'm-9-1',
          role: 'user',
          timestamp: now - ONE_DAY * 3,
          content: 'Our pods drop 0.2% of HTTP requests during deployments. How do we configure preStop hooks and readiness gates to achieve zero dropped packets?'
        },
        {
          id: 'm-9-2',
          role: 'assistant',
          timestamp: now - ONE_DAY * 3,
          content: `The packet drops happen because \`iptables\` rule updates across worker nodes lag behind the pod termination signal. Introduce a sleep inside the \`preStop\` lifecycle hook:\n\n\`\`\`yaml\nlifecycle:\n  preStop:\n    exec:\n      command: [\"/bin/sh\", \"-c\", \"sleep 15\"]\n\`\`\`\nThis keeps the dying pod serving connections until all endpoints routers have detached.`
        }
      ]
    },
    {
      id: 'chat-10',
      title: 'Web Speech API Voice Composer',
      projectId: 'proj-3',
      isPinned: false,
      createdAt: now - ONE_DAY * 3 - ONE_HOUR * 3,
      updatedAt: now - ONE_DAY * 3 - ONE_HOUR * 2,
      messages: [
        {
          id: 'm-10-1',
          role: 'user',
          timestamp: now - ONE_DAY * 3 - ONE_HOUR * 3,
          content: 'How do we gracefully integrate the browser SpeechRecognition API with continuous dictation fallback?'
        },
        {
          id: 'm-10-2',
          role: 'assistant',
          timestamp: now - ONE_DAY * 3 - ONE_HOUR * 2,
          content: `Check for \`webkitSpeechRecognition || SpeechRecognition\` and attach handlers for \`onresult\` and \`onerror\` with automated retry backoff.`
        }
      ]
    },
    {
      id: 'chat-11',
      title: 'Postgres Connection Pooling with pgBouncer',
      projectId: 'proj-1',
      isPinned: false,
      createdAt: now - ONE_DAY * 4,
      updatedAt: now - ONE_DAY * 4,
      messages: [
        {
          id: 'm-11-1',
          role: 'user',
          timestamp: now - ONE_DAY * 4,
          content: 'What is the difference between session, transaction, and statement pooling in pgBouncer for high-scale APIs?'
        },
        {
          id: 'm-11-2',
          role: 'assistant',
          timestamp: now - ONE_DAY * 4,
          content: `For web applications, **Transaction Pooling** is the standard. It returns the database connection to the shared pool as soon as the transaction finishes, enabling 5,000 app clients to share 100 backend PostgreSQL connections.`
        }
      ]
    },
    {
      id: 'chat-12',
      title: 'Async Task Queue in Go',
      projectId: 'proj-1',
      isPinned: false,
      createdAt: now - ONE_DAY * 4 - ONE_HOUR * 4,
      updatedAt: now - ONE_DAY * 4 - ONE_HOUR * 3,
      messages: [
        {
          id: 'm-12-1',
          role: 'user',
          timestamp: now - ONE_DAY * 4 - ONE_HOUR * 4,
          content: 'Provide a clean worker pool pattern in Go with context cancellation.'
        },
        {
          id: 'm-12-2',
          role: 'assistant',
          timestamp: now - ONE_DAY * 4 - ONE_HOUR * 3,
          content: `Here is a production-safe Go worker pool pattern with zero goroutine leaks and \`sync.WaitGroup\` coordination.`
        }
      ]
    },
    {
      id: 'chat-13',
      title: 'OAuth2 PKCE Flow for Desktop Apps',
      projectId: 'proj-6',
      isPinned: false,
      createdAt: now - ONE_DAY * 5,
      updatedAt: now - ONE_DAY * 5,
      messages: [
        {
          id: 'm-13-1',
          role: 'user',
          timestamp: now - ONE_DAY * 5,
          content: 'Why is client_secret unsafe in desktop and mobile applications, and how does PKCE solve this?'
        },
        {
          id: 'm-13-2',
          role: 'assistant',
          timestamp: now - ONE_DAY * 5,
          content: `Desktop binaries can be disassembled to extract static secrets. PKCE replaces static credentials with a dynamically generated cryptographic \`code_verifier\` and \`code_challenge\` generated per-login.`
        }
      ]
    },
    {
      id: 'chat-14',
      title: 'WASM SIMD Accelerated Math',
      projectId: 'proj-2',
      isPinned: false,
      createdAt: now - ONE_DAY * 5 - ONE_HOUR * 2,
      updatedAt: now - ONE_DAY * 5 - ONE_HOUR * 1,
      messages: [
        {
          id: 'm-14-1',
          role: 'user',
          timestamp: now - ONE_DAY * 5 - ONE_HOUR * 2,
          content: 'Can WebAssembly SIMD operations accelerate vector dot-products inside the browser?'
        },
        {
          id: 'm-14-2',
          role: 'assistant',
          timestamp: now - ONE_DAY * 5 - ONE_HOUR * 1,
          content: `Yes, 128-bit SIMD registers (\`v128\`) process four 32-bit floats simultaneously, yielding a 3.8x throughput increase over standard JavaScript loops.`
        }
      ]
    },
    {
      id: 'chat-15',
      title: 'Accessible Dialog Modal Primitive',
      projectId: 'proj-3',
      isPinned: false,
      createdAt: now - ONE_DAY * 6,
      updatedAt: now - ONE_DAY * 6,
      messages: [
        {
          id: 'm-15-1',
          role: 'user',
          timestamp: now - ONE_DAY * 6,
          content: 'Show how to trap keyboard focus in a modal dialog without external packages.'
        },
        {
          id: 'm-15-2',
          role: 'assistant',
          timestamp: now - ONE_DAY * 6,
          content: `Query all tabbable elements within the modal container and intercept \`Tab\` and \`Shift+Tab\` to wrap around the first and last element.`
        }
      ]
    },
    {
      id: 'chat-16',
      title: 'Redis Cluster Split-Brain Prevention',
      projectId: 'proj-1',
      isPinned: false,
      createdAt: now - ONE_DAY * 6 - ONE_HOUR * 4,
      updatedAt: now - ONE_DAY * 6 - ONE_HOUR * 3,
      messages: [
        {
          id: 'm-16-1',
          role: 'user',
          timestamp: now - ONE_DAY * 6 - ONE_HOUR * 4,
          content: 'How does Redis Cluster quorum decide node failover?'
        },
        {
          id: 'm-16-2',
          role: 'assistant',
          timestamp: now - ONE_DAY * 6 - ONE_HOUR * 3,
          content: `A master node requires votes from a strict majority (> N/2) of active masters before promoting a replica.`
        }
      ]
    },
    {
      id: 'chat-17',
      title: 'WebSockets Heartbeat & Reconnect',
      projectId: 'proj-4',
      isPinned: false,
      createdAt: now - ONE_DAY * 7,
      updatedAt: now - ONE_DAY * 7,
      messages: [
        {
          id: 'm-17-1',
          role: 'user',
          timestamp: now - ONE_DAY * 7,
          content: 'Implement an exponential backoff WebSocket client with ping/pong keepalive.'
        },
        {
          id: 'm-17-2',
          role: 'assistant',
          timestamp: now - ONE_DAY * 7,
          content: `Here is the resilient WebSocket wrapper featuring randomized jitter to avoid the thundering herd problem during service restarts.`
        }
      ]
    },
    {
      id: 'chat-18',
      title: 'Zero-Copy IO with io_uring in Linux',
      projectId: 'proj-1',
      isPinned: false,
      createdAt: now - ONE_DAY * 7 - ONE_HOUR * 3,
      updatedAt: now - ONE_DAY * 7 - ONE_HOUR * 2,
      messages: [
        {
          id: 'm-18-1',
          role: 'user',
          timestamp: now - ONE_DAY * 7 - ONE_HOUR * 3,
          content: 'What makes io_uring faster than epoll for storage and network processing?'
        },
        {
          id: 'm-18-2',
          role: 'assistant',
          timestamp: now - ONE_DAY * 7 - ONE_HOUR * 2,
          content: `\`io_uring\` uses twin lockless ring buffers shared between user-space and kernel-space, eliminating system call context switches.`
        }
      ]
    },
    {
      id: 'chat-19',
      title: 'Khmer Numeral Formatting Library',
      projectId: 'proj-7',
      isPinned: false,
      createdAt: now - ONE_DAY * 8,
      updatedAt: now - ONE_DAY * 8,
      messages: [
        {
          id: 'm-19-1',
          role: 'user',
          timestamp: now - ONE_DAY * 8,
          content: 'How do we convert standard Arabic numbers 0-9 into traditional Khmer numerals ០-៩ in JavaScript?'
        },
        {
          id: 'm-19-2',
          role: 'assistant',
          timestamp: now - ONE_DAY * 8,
          content: `Use string character code offsetting or a direct translation map: \`String(num).replace(/\\d/g, d => '០១២៣៤៥៦៧៨៩'[d])\`.`
        }
      ]
    },
    {
      id: 'chat-20',
      title: 'CSS Container Queries Responsive Grid',
      projectId: 'proj-3',
      isPinned: false,
      createdAt: now - ONE_DAY * 9,
      updatedAt: now - ONE_DAY * 9,
      messages: [
        {
          id: 'm-20-1',
          role: 'user',
          timestamp: now - ONE_DAY * 9,
          content: 'How do container queries differ from viewport media queries in modular component architecture?'
        },
        {
          id: 'm-20-2',
          role: 'assistant',
          timestamp: now - ONE_DAY * 9,
          content: `Container queries allow a card component to adapt its layout based on the exact width of its parent container rather than the entire browser viewport.`
        }
      ]
    },
    {
      id: 'chat-21',
      title: 'Rust vs Go for Microservices',
      projectId: 'proj-1',
      isPinned: false,
      createdAt: now - ONE_DAY * 10,
      updatedAt: now - ONE_DAY * 10,
      messages: [
        {
          id: 'm-21-1',
          role: 'user',
          timestamp: now - ONE_DAY * 10,
          content: 'When is Rust preferable to Go for cloud services?'
        },
        {
          id: 'm-21-2',
          role: 'assistant',
          timestamp: now - ONE_DAY * 10,
          content: `Choose Rust when predictable p99 latency without GC pauses is mandatory, or when raw CPU and memory footprints represent millions in cloud infrastructure costs.`
        }
      ]
    },
    {
      id: 'chat-22',
      title: 'JWT Secret Rotation without Downtime',
      projectId: 'proj-4',
      isPinned: false,
      createdAt: now - ONE_DAY * 12,
      updatedAt: now - ONE_DAY * 12,
      messages: [
        {
          id: 'm-22-1',
          role: 'user',
          timestamp: now - ONE_DAY * 12,
          content: 'How do you rotate asymmetric signing keys in a microservices ecosystem without invalidating active user sessions?'
        },
        {
          id: 'm-22-2',
          role: 'assistant',
          timestamp: now - ONE_DAY * 12,
          content: `Use a JWKS (JSON Web Key Set) endpoint where tokens specify a \`kid\` (Key ID) header. Services fetch the set and verify signatures against matching keys during the grace transition period.`
        }
      ]
    }
  ];

  return {
    projects,
    files,
    prompts,
    conversations
  };
})();
