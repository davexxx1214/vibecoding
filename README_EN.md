# VibeCoding - VS Code Knowledge Graph Extension

> Transform your codebase into an intelligent knowledge network for more efficient AI programming

A VS Code extension based on Knowledge Graph and SQLite that helps developers understand and manage complex relationships in codebases, while providing persistent project context for AI programming.

## 📋 Table of Contents

- [Core Philosophy](#core-philosophy)
- [Current Status](#current-status)
  - [Internationalization Support](#internationalization-support-completed)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Core Features](#core-features)
- [Technical Architecture](#technical-architecture)
- [Development Guide](#development-guide)
- [Demo Documentation](#demo-documentation)

---

## 🎯 Core Philosophy

VibeCoding transforms your VS Code workspace into an **intelligent knowledge graph** through three core concepts:

### 1. Entities
Elements in your codebase with precise code locations:
- Code elements: Function, Class, Interface, Variable
- File system: File, Directory
- Business concepts: API, Service, Component, Database

### 2. Relations
Connections between entities:
- `uses` - Usage relationship
- `calls` - Call relationship
- `extends` - Inheritance relationship
- `implements` - Implementation relationship
- `depends_on` - Dependency relationship

### 3. Observations
Notes and comments about entities - the core value of knowledge graph:
- Performance warnings and optimization suggestions
- Design decision documentation
- Bug records and fix history
- Refactoring todos
- Team collaboration notes

**Core Value**:
- 🧠 **Code Understanding Assistant** - Visualize code relationships, quickly understand complex systems
- 📝 **Project Memory System** - Persistently save design decisions, refactoring notes, performance warnings
- 🤖 **AI Programming Accelerator** - Deep integration with Cursor and GitHub Copilot, providing project context to AI
- 👥 **Team Knowledge Sharing** - Knowledge graph can be tracked by Git for seamless team collaboration

---

## ✅ Current Status

**All core features completed!** 🎉

VibeCoding is a fully functional VS Code knowledge graph extension with three core modules:

### 1️⃣ Knowledge Graph Management
- ✅ Complete CRUD for entities, relations, and observations
- ✅ SQLite local persistent storage
- ✅ Interactive graph visualization (vis-network)
- ✅ Full VS Code UI integration

### 2️⃣ AI Collaboration Features
- ✅ Deep integration with Cursor and GitHub Copilot
- ✅ Knowledge graph export (Markdown / JSON)
- ✅ Dependency chain analysis and circular dependency detection
- ✅ Automatic tech stack detection (JS/TS projects)
- ✅ Quick context export

### 3️⃣ Persistent Knowledge Base (RAG)
- ✅ Google Gemini File Search cloud hosting
- ✅ Automatic document indexing to cloud (incremental)
- ✅ Intelligent Q&A (Ask Question)
- ✅ Multi-format support (100+ formats)
- ✅ Complete project isolation

**Codebase**: ~5000+ lines TypeScript

### 🌐 Internationalization Support (Completed) ✨

VibeCoding has completed a full multi-language support system:

- ✅ **Language Switching Framework**: Complete i18n service and type system
- ✅ **Chinese & English**: Full support for UI, commands, and prompts in both languages
- ✅ **Dynamic Switching**: Runtime language switching, no restart required
- ✅ **Date Localization**: Date/time automatically formatted based on language (zh-CN / en-US)
- ✅ **Quick Switch**: Language switch button added to view title bars

**Switching Methods**:
1. **Settings**: Settings → Search "Knowledge Graph Language" → Select `zh` or `en`
2. **Command**: Command Palette → "Knowledge: Switch Language" → Select language
3. **Quick Button**: Knowledge Graph/RAG view title bar → Click language icon 🌐

**Internationalized Modules**:
- ✅ All commands and menus (entities, relations, observations, RAG, export, etc.)
- ✅ UI providers (tree view, hover, CodeLens)
- ✅ Export service (Markdown/JSON export content)
- ✅ RAG features (Q&A, indexing, Store management)
- ✅ Extension activation and error messages
- ✅ Progress indicators and success messages

---

## 🚀 Quick Start

### Installation

```bash
# 1. Clone repository
git clone https://github.com/yourusername/vibecoding.git
cd vibecoding

# 2. Install dependencies
npm install

# 3. Compile
npm run compile

# 4. Press F5 in VS Code to start debugging
```

### Basic Usage

#### Knowledge Graph Features
1. **Create Entity**: Select code → Right-click → "Knowledge: Create Entity from Selection"
2. **Add Observation**: Hover over entity → Click "Add Observation"
3. **View Knowledge Graph**: Click "Knowledge Graph" icon in sidebar
4. **Search**: Command Palette → "Knowledge: Search Graph"

#### RAG Knowledge Base Features 🆕
**Cloud Mode (Gemini)**:
1. **Configure API Key**: Settings → Search "Gemini API Key" → Enter your key
2. **Add Documents**: Create `Knowledge/` folder in project root, add documents
3. **Auto-indexing**: Documents automatically uploaded to Gemini, no manual action required

**Local Mode (OpenAI Compatible)** 🆕:
1. **Switch Mode**: Settings → Search "RAG Mode" → Select `local`
2. **Configure API**: Set `Local: Api Base` (e.g., `http://localhost:11434/v1` or other OpenAI-compatible endpoint)
3. **Configure Models**:
   - `Local: Embedding Model` (e.g., `text-embedding-3-small` or `nomic-embed-text`)
   - `Local: Inference Model` (e.g., `gpt-4.1` or `llama3`)
4. **Rebuild Index**: After switching configuration, run `Knowledge: Rebuild RAG Index`

---

## 📁 Project Structure

```
vibecoding/
├── src/
│   ├── extension.ts                  # ✅ Extension entry point
│   ├── services/                     # ✅ Core service layer
│   │   ├── database.ts               # Database service
│   │   ├── entityService.ts          # Entity management
│   │   ├── relationService.ts        # Relation management
│   │   └── observationService.ts     # Observation management
│   ├── providers/                    # ✅ VS Code UI providers
│   │   ├── hoverProvider.ts          # Hover provider
│   │   ├── codeLensProvider.ts       # CodeLens
│   │   └── treeDataProvider.ts       # Tree view
│   ├── ui/                          # ✅ Command handlers
│   │   └── commands/
│   │       └── entityCommands.ts
│   ├── i18n/                        # ✅ Internationalization
│   │   ├── i18nService.ts           # i18n service
│   │   ├── types.ts                 # Type definitions
│   │   ├── zh.ts                    # Chinese
│   │   └── en.ts                    # English
│   └── utils/                       # ✅ Utilities
│       └── types.ts                 # Type definitions
├── package.json                      # Extension configuration
├── tsconfig.json                     # TypeScript config
├── README.md                         # Project documentation (Chinese)
├── README_EN.md                      # Project documentation (English)
├── Demo.md                           # Demo guide (Chinese)
└── Demo_en.md                        # Demo guide (English)

Legend:
  ✅ Implemented
  🔜 Planned
```

### Data Storage

```
Project Root/
├── .vscode/
│   └── .knowledge/
│       └── graph.sqlite              # Knowledge graph database (includes RAG index)
└── Knowledge/                        # ✅ RAG document knowledge base
    ├── architecture.md               # Architecture docs
    ├── api-guide.md                  # API guide
    └── decisions/                    # Design decisions
        └── adr-001.md
```

**RAG Store Isolation Mechanism**:
- Each project automatically generates a unique Store ID (based on project path hash)
- Multiple projects can use the same Gemini API Key
- Document indexes are completely isolated, no confusion
- Store information stored in local SQLite database

---

## ✨ Core Features

### 🗂️ Knowledge Graph Management

#### Basic Graph Features
- ✅ **Entity Management**: Manually create and manage code entities (Function, Class, Interface, Variable, etc.)
- ✅ **Relation Management**: Establish relations between entities (uses, calls, extends, implements, depends_on)
- ✅ **Observations**: Add notes, warnings, TODOs, design decisions to entities
- ✅ **Fuzzy Search**: Quickly search entities and observations
- ✅ **Data Persistence**: Local SQLite database storage

#### UI Integration
- ✅ **Sidebar Tree View**: Display all entities and relations grouped by type
- ✅ **Hover Tips**: Show entity info, observations, relation network on hover
- ✅ **CodeLens**: Display entity statistics above code
- ✅ **Context Menu**: Quick create entity, add observation, establish relation
- ✅ **Command Palette**: Complete command set for quick access to all features

#### Visualization
- ✅ **Interactive Graph**: Graphical display based on vis-network
- ✅ **Auto Layout**: Nodes automatically arranged to avoid overlap
- ✅ **Multi-edge Separation**: Multiple relations in same direction automatically shown with different arcs
- ✅ **Circular Dependency Detection**: Automatically identify and mark circular dependencies
- ✅ **Double-click Navigation**: Double-click node to jump to code location
- ✅ **Drag Interaction**: Support node dragging, zoom, pan

---

### 🤖 AI Collaboration Features

#### Knowledge Graph Export
- ✅ **Markdown Export**: Generate AI-readable formatted documents
- ✅ **JSON Export**: Structured data export
- ✅ **Dependency Chain Analysis**: Recursively build dependency tree, detect circular dependencies, count transitive dependencies
- ✅ **Grouped by Type**: Entities, relations, observations categorized

#### AI Tool Integration
- ✅ **Cursor Integration**: Auto-generate `.cursorrules` configuration file
- ✅ **GitHub Copilot Integration**: Auto-generate `.github/copilot-instructions.md`
- ✅ **Tech Stack Detection**: Automatically extract dependency info from `package.json` (supports JS/TS projects)
- ✅ **One-click Generation**: Generate all AI config files at once
- ✅ **Smart Categorization**: Automatically categorize warnings, TODOs, known issues

#### Quick Context Export
- ✅ **Entity Context**: Copy complete context of single entity to clipboard
- ✅ **File Context**: Export all entities and relations of current file
- ✅ **AI Summary**: Generate project overview for AI understanding

---

### ☁️ Persistent Knowledge Base (RAG)

#### Cloud RAG System
- ✅ **Google Gemini File Search**: Use Gemini's hosted vector search service
- ✅ **Auto-indexing**: Monitor `Knowledge/` folder, auto-upload new documents to cloud
- ✅ **Incremental Indexing**: Already indexed documents won't be re-uploaded, fast startup
- ✅ **Multi-format Support**: Native support for PDF, TXT, MD, DOCX, JSON, code, etc. (100+ formats)
- ✅ **Semantic Search**: Gemini automatically chunks, embeds, and retrieves

#### Local RAG (Custom Vector Store)
- ✅ **Privacy-first**: Documents and vectors only exist in local SQLite database, never leave the machine
- ✅ **Zero dependency**: Built with sql.js (WebAssembly SQLite) + in-memory cache, works on Win/macOS/Linux without Docker or native modules
- ✅ **Lightweight & maintainable**: Simple cosine similarity retrieval fits VS Code scenarios and is easy to debug
- ✅ **Portable data**: All vectors stored in `.vscode/.knowledge/graph.sqlite`, easy to back up or review with the project

#### Intelligent Q&A
- ✅ **Ask Question**: Intelligent Q&A based on document content
- ✅ **Source Tracing**: Show source documents of answers (Grounding Metadata)
- ✅ **Markdown Display**: Q&A results displayed as formatted Markdown documents
- ✅ **Copy & Save**: Support copying content or saving as file

#### Project Management
- ✅ **Project Isolation**: Each project has independent File Search Store, completely isolated
- ✅ **API Key Configuration**: Manage Gemini API Key through VS Code settings
- ✅ **Auto-reconnect**: Auto re-initialize when API Key is updated
- ✅ **View Store Info**: Real-time view of cloud and local document statistics
- ✅ **Index Rebuild**: Rebuild RAG Index command for complete sync between local and cloud

#### Sidebar Management
- ✅ **Documents (RAG) View**: Display list of indexed documents
- ✅ **Quick Actions**: Question mark (Ask Question), info icon (View Store Info), refresh icon (Rebuild Index)
- ✅ **Connection Test**: Test Gemini API connection status

---

## 🏗️ Technical Architecture

### Tech Stack

| Layer | Technology | Description |
|-------|-----------|-------------|
| **Extension Framework** | VS Code Extension API | Official extension development framework |
| **Language** | TypeScript | Type-safe, great developer experience |
| **Database** | sql.js | WebAssembly SQLite, cross-platform compatible |
| **Search** | LIKE fuzzy query | Simple and efficient, suitable for small/medium projects |
| **Visualization** | vis-network | Interactive graph visualization |
| **Document Conversion** | MarkItDown (Python CLI) | Stage 2, multi-format support |
| **RAG System** | Google Gemini File Search API | Stage 2, managed RAG |
| **Code Parsing** | TypeScript Compiler API | Used in Stage 3 |

### Core Data Flow

```
User Action
  ↓
VS Code UI (TreeView / Hover / CodeLens / Menu)
  ↓
Commands (entityCommands.ts)
  ↓
Services (entityService / relationService / observationService)
  ↓
Database (database.ts → SQLite)
  ↓
Stored in .vscode/.knowledge/graph.sqlite
```

### Database Schema

```sql
-- Entities table
CREATE TABLE entities (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    file_path TEXT NOT NULL,
    start_line INTEGER NOT NULL,
    end_line INTEGER NOT NULL,
    description TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

-- Relations table
CREATE TABLE relations (
    id TEXT PRIMARY KEY,
    source_entity_id TEXT NOT NULL,
    target_entity_id TEXT NOT NULL,
    verb TEXT NOT NULL,
    created_at INTEGER NOT NULL
);

-- Observations table
CREATE TABLE observations (
    id TEXT PRIMARY KEY,
    entity_id TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

-- Index optimization
CREATE INDEX idx_entities_type ON entities(type);
CREATE INDEX idx_entities_file_path ON entities(file_path);
CREATE INDEX idx_entities_name ON entities(name);
```

---

## 🛠️ Development Guide

### Requirements

- Node.js >= 16.x
- VS Code >= 1.80.0
- TypeScript >= 4.9.0

### Development Commands

```bash
# Install dependencies
npm install

# Compile
npm run compile

# Watch mode (for development)
npm run watch

# Run tests
npm test

# Package extension
npm run package

# Code lint
npm run lint
```

### Debugging

1. Open project in VS Code
2. Press `F5` to start debugging
3. A new VS Code window will open (Extension Development Host)
4. Test extension features in the new window

### Code Standards

- Use TypeScript strict mode
- Use async/await instead of callbacks
- Error handling with try/catch
- Naming conventions:
  - File names: camelCase.ts
  - Class names: PascalCase
  - Functions/variables: camelCase
  - Constants: UPPER_SNAKE_CASE

---

## 📖 Demo Documentation

For detailed demo guide and usage scenarios, see:

- **[Demo_en.md](./Demo_en.md)** - Complete demo guide
  - Demo based on NestJS RealWorld Example App
  - Includes 5 practical usage scenarios
  - Complete demo script from basic features to AI collaboration
  - Persistent knowledge base and document conversion demo

---

## 📚 References

### Official Documentation
- [VS Code Extension API](https://code.visualstudio.com/api)
- [sql.js Documentation](https://sql.js.org/)
- [vis-network Documentation](https://visjs.github.io/vis-network/)
- [TypeScript Compiler API](https://github.com/Microsoft/TypeScript/wiki/Using-the-Compiler-API)
- [Google File Search Tool](https://ai.google.dev/gemini-api/docs/file-search)

