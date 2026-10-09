# Doomz

**The Offline-First Civilization Operating System & Grid-Down Assistant**

Doomz AI is a zero-cloud, high-performance local AI platform built for dooms day. Designed to run completely on-device without internet or cloud dependencies, Doomz acts as an interactive digital vault to preserve human knowledge, deliver emergency medical triage, analyze local supply stockpiles, and guide societal reconstruction when power grids and cell networks fail.

---

## 🌟 Key Features

- **⚡ 100% Grid-Down Execution:** Zero cloud API dependencies. Runs completely offline via local Ollama inference.
- **🎩 Persona "Hat Swapping":** Dynamically adjusts system prompts and specialist personas (*Medic, Agronomist, Engineer, Arbiter*) across a single fast local model without multi-agent token overhead.
- **📦 Stockpile & Inventory Analyzer:** Track local food, medical, and tool reserves with one-click AI rationing and supply gap analysis powered by local WASM database storage.
- **🧪 Interactive Periodic Table Vault:** Embedded elements guide allowing users to inspect chemical elements and ask the AI how to harvest or synthesize them using raw post-grid materials.
- **🔋 Battery Preservation / Low-Power Standby Mode:** Instant VRAM/GPU unload feature (`keep_alive: 0`) designed for energy conservation.
- **🔒 Absolute Privacy:** All queries, local inventory logs, and document embeddings remain strictly on-device.

---

## 🏛️ Civilization Pillars

Doomz AI structures survival knowledge into specialized modules:

1. **🌾 Food & Agriculture:** Soil pH, seed preservation, crop rotation, and post-grid farming.
2. **🩺 Medicine & Field Triage:** Emergency first aid, wound treatment, field sanitation, and natural antiseptics.
3. **⛺ Shelter & Engineering:** Structural design, timber framing, bio-sand water filtration, and off-grid energy generation.
4. **🧼 Hygiene & Public Health:** Waste management, disease prevention, and sanitation in resource-scarce environments.
5. **⚡ Energy & Utilities:** Solar array wiring, battery maintenance, biogas production, and basic DC circuitry.
6. **📜 Historical & Tech Vault:** Preserved principles of physics, chemistry, metallurgy, and basic manufacturing.
7. **⚖️ Governance & Law:** Resource rationing, barter contracts, conflict resolution, and local administration.

---

## 🛠️ Architecture & Tech Stack

```text
┌────────────────────────────────────────────────────────┐
│               REACT FRONTEND (Vite / Tailwind)         │
│   - Specialist Modules & Personas ("Hats")             │
│   - Interactive Elements Vault & Stockpile UI          │
│   - Low Power / Standby Mode Toggle                    │
└──────────────────────────┬─────────────────────────────┘
                           │ Local HTTP / SSE Streaming
                           ▼
┌────────────────────────────────────────────────────────┐
│               HONO BACKEND SERVER (Bun Runtime)        │
│   - Sub-10ms native execution & CORS bridge            │
│   - PGlite WASM (Local disk storage: `./pgdata`)       │
│   - OpenAI Agents SDK adapter connected to Ollama      │
└──────────────────────────┬─────────────────────────────┘
                           │ Local REST ([http://127.0.0.1:11434/v1](http://127.0.0.1:11434/v1))
                           ▼
┌────────────────────────────────────────────────────────┐
│            LOCAL OLLAMA INFERENCE ENGINE               │
│   - Model: Llama-3.2-3B / Qwen-2.5-3B (Quantized)      │
│   - High speed (~40+ tok/s) on 4GB VRAM / 16GB RAM     │
└────────────────────────────────────────────────────────┘