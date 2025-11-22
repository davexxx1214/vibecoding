# VibeKnowledge: The Intelligent Knowledge Graph for Code

## Slide 1: Title Slide - The Challenge & The Solution (The Hook)
- **Title:** VibeKnowledge: The Intelligent Knowledge Graph for Code
- **Subtitle:** Accelerating AI-Powered Development with Persistent Project Context
- **Hackathon:** State Street 2025 Hackathon Entry
- **Visual:** A stylized image of a VS Code window with a vibrant, interconnected graph overlaying the code.
- **Key Message:** Traditional code is static. We make it intelligent and dynamic for the AI era.

## Slide 2: The Problem - The AI Context Gap
- **Title:** The AI Context Gap: Why AI Struggles with Large Codebases
- **Problem 1 (Developer Pain):** Code is complex, understanding dependencies is hard, and knowledge is lost when developers leave.
- **Problem 2 (AI Limitation):** Current AI tools (Copilot, Cursor) are limited to small context windows. They lack **persistent, structured, and human-annotated** project knowledge.
- **Visual:** A graphic showing a small, isolated code snippet (AI's current view) next to a large, complex system (the reality).
- **Key Message:** AI needs more than just code; it needs the **knowledge** *about* the code.

## Slide 3: VibeKnowledge's Core Concept - The Triad of Knowledge
- **Title:** VibeKnowledge: Building the Intelligent Knowledge Graph
- **Concept:** We transform the codebase into a structured, persistent Knowledge Graph using three core elements:
    1.  **Entities:** Code elements (Classes, Functions) and Business Concepts (API, Service) with precise location.
    2.  **Relations:** Directed connections between entities (`uses`, `calls`, `depends_on`).
    3.  **Observations:** Human-annotated, persistent notes (warnings, design decisions, TODOs) saved directly to the entity.
- **Visual:** A clean diagram illustrating the three interconnected concepts (Entity, Relation, Observation) feeding into the central "Knowledge Graph."

## Slide 4: Feature Deep Dive 1 - Visualizing Complexity (The Graph)
- **Title:** Feature 1: Visualizing Complexity & Impact Analysis
- **Key Feature:** Interactive Knowledge Graph Visualization (vis-network).
- **Benefit 1 (Understanding):** Instantly visualize the entire project architecture (Controller -> Service -> Entity layers).
- **Benefit 2 (Impact Analysis):** Quickly see all components that depend on a specific entity (e.g., modifying `UserService` affects `UserController` and `ArticleService`).
- **Benefit 3 (Architecture Health):** **Automatic detection and visual flagging of circular dependencies** (a critical architectural flaw).
- **Visual:** A screenshot or mock-up of the interactive graph visualization, highlighting the dependency arrows and a circular dependency warning.

## Slide 5: Feature Deep Dive 2 - Persistent Knowledge & AI Acceleration
- **Title:** Feature 2: Persistent Knowledge & AI Acceleration
- **Persistent Knowledge:** Observations (design notes, performance warnings) are stored in a local SQLite database (`graph.sqlite`) and committed to Git, making knowledge a first-class citizen.
- **AI Acceleration:**
    - **One-Click Export:** Generates structured Markdown/JSON of the graph for AI consumption.
    - **Integrated Context:** Automatically generates configuration files for AI tools (e.g., `.cursorrules`, `copilot-instructions.md`).
    - **Scenario Switching:** 8 built-in AI context templates (Frontend, Backend, Testing, Debugging) to instantly tailor the AI's focus.
- **Visual:** A split screen: one side showing a developer adding an "Observation" (e.g., "Needs caching"), the other side showing an AI tool using that context.

## Slide 6: Feature Deep Dive 3 - The RAG Knowledge Base (The Power)
- **Title:** Feature 3: Persistent RAG Knowledge Base (The Project Brain)
- **Concept:** A Retrieval-Augmented Generation (RAG) system for project documentation.
- **Dual Mode Flexibility:**
    - **Cloud RAG (Gemini File Search):** Hosted, multi-format support (100+ file types), ideal for public/less sensitive docs.
    - **Local RAG (OpenAI Compatible):** Data privacy focus. All vectors and documents stored locally in SQLite. Supports any OpenAI-compatible endpoint (Ollama, LocalAI).
- **Smart Q&A:** Use "Ask Question" to query project documents. Answers are grounded with source citations (Grounding Metadata).
- **Visual:** A diagram showing documents (PDF, MD, TXT) feeding into a "RAG Store" and an "Ask Question" interface with a cited answer.

## Slide 7: Use Case Scenario - Onboarding & Refactoring
- **Title:** Real-World Impact: Onboarding & Refactoring
- **Scenario 1: New Developer Onboarding:**
    - **Before:** Weeks of reading code and asking questions.
    - **With VibeKnowledge:** View the Knowledge Graph for an instant architectural overview. Use "Ask Question" on the RAG base for instant answers from documentation.
- **Scenario 2: Safe Refactoring:**
    - **Before:** Tedious global search and manual impact assessment.
    - **With VibeKnowledge:** Click on the entity to be refactored, and the graph instantly highlights all dependent components. **Assess impact in seconds.**
- **Visual:** Two side-by-side icons/images: a confused developer (Before) vs. a confident developer with a clear graph (With VibeKnowledge).

## Slide 8: Technical Architecture & Innovation
- **Title:** Technical Architecture & Key Innovations
- **Tech Stack:** VS Code Extension API, TypeScript, **sql.js (WebAssembly SQLite)** for cross-platform local persistence, vis-network for visualization.
- **Innovation 1: Cross-Platform Persistence:** Using WebAssembly SQLite eliminates external dependencies (Docker, Python/Rust) for a true "zero-setup" experience.
- **Innovation 2: Project Isolation:** Unique Store IDs (Cloud RAG) and isolated SQLite files (Local RAG) ensure multi-project work is secure and clean.
- **Innovation 3: Multi-Language Support:** Full i18n support (English/Chinese) for all UI, commands, and templates.
- **Visual:** A simple architecture diagram (VS Code UI -> Commands -> Services -> SQLite) and a callout box for the WebAssembly SQLite innovation.

## Slide 9: The State Street Connection - Value Proposition
- **Title:** VibeKnowledge: Value for Financial Services & State Street
- **Value 1: Regulatory Compliance & Audit:** Observations can be used to tag code with compliance notes, audit trails, and security warnings, making code review and auditing faster.
- **Value 2: Legacy System Modernization:** Quickly map dependencies and identify technical debt (circular dependencies, performance warnings) in large, complex legacy systems.
- **Value 3: Knowledge Retention:** Critical in high-turnover environments. The persistent knowledge graph ensures institutional knowledge is never lost.
- **Visual:** State Street logo or a relevant financial services graphic alongside the VibeKnowledge logo.

## Slide 10: Call to Action - Future & Demo
- **Title:** The Future of Code: Intelligent, Persistent, and AI-Ready
- **Summary:** VibeKnowledge is a complete, production-ready tool that bridges the gap between code, human knowledge, and AI.
- **Next Steps:**
    - **Future Plans:** Automated entity creation (AST parsing), advanced graph querying.
    - **Call to Action:** See the live demo! (Mention the NestJS RealWorld Example App demo).
- **Contact:** [Team Name / Contact Info]
- **Visual:** A final, powerful image of the Knowledge Graph, perhaps with a "Hackathon Winner" ribbon.
