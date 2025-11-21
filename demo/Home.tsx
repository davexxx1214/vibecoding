import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Maximize2, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// Slide components
const Slide1 = () => (
  <div className="relative w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center overflow-hidden">
    {/* Animated background elements */}
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute top-10 left-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: "2s" }}></div>
    </div>

    <div className="relative z-10 text-center px-8 max-w-4xl">
      <h1 className="text-6xl font-bold text-white mb-6 animate-fade-in">
        VibeCoding
      </h1>
      <p className="text-3xl font-semibold text-blue-300 mb-8 animate-fade-in" style={{ animationDelay: "0.2s" }}>
        The Intelligent Knowledge Graph for Code
      </p>
      <p className="text-xl text-slate-300 mb-12 animate-fade-in" style={{ animationDelay: "0.4s" }}>
        Accelerating AI-Powered Development with Persistent Project Context
      </p>
      <div className="flex justify-center gap-4 animate-fade-in" style={{ animationDelay: "0.6s" }}>
        <div className="px-6 py-2 bg-blue-600 rounded-lg text-white font-semibold">
          State Street 2025 Hackathon
        </div>
      </div>
      <p className="text-slate-400 mt-12 text-lg animate-fade-in" style={{ animationDelay: "0.8s" }}>
        Traditional code is static. We make it intelligent and dynamic for the AI era.
      </p>
    </div>
  </div>
);

const Slide2 = () => (
  <div className="relative w-full h-full bg-gradient-to-br from-white to-slate-50 flex flex-col items-center justify-center overflow-hidden p-12">
    <div className="max-w-5xl w-full">
      <h2 className="text-5xl font-bold text-slate-900 mb-12 text-center animate-slide-in">
        The AI Context Gap: Why AI Struggles with Large Codebases
      </h2>

      <div className="grid grid-cols-2 gap-8 mb-8">
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-8 animate-slide-in" style={{ animationDelay: "0.2s" }}>
          <h3 className="text-2xl font-bold text-red-700 mb-4">Developer Pain</h3>
          <p className="text-slate-700 text-lg">
            Code is complex, understanding dependencies is hard, and knowledge is lost when developers leave.
          </p>
        </div>

        <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-8 animate-slide-in" style={{ animationDelay: "0.4s" }}>
          <h3 className="text-2xl font-bold text-orange-700 mb-4">AI Limitation</h3>
          <p className="text-slate-700 text-lg">
            Current AI tools are limited to small context windows. They lack persistent, structured, and human-annotated project knowledge.
          </p>
        </div>
      </div>

      <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-8 text-center animate-slide-in" style={{ animationDelay: "0.6s" }}>
        <p className="text-xl text-slate-800 font-semibold">
          💡 <span className="text-blue-700">AI needs more than just code; it needs the knowledge *about* the code.</span>
        </p>
      </div>
    </div>
  </div>
);

const Slide3 = () => (
  <div className="relative w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col items-center justify-center overflow-hidden p-12">
    <div className="max-w-5xl w-full">
      <h2 className="text-5xl font-bold text-white mb-12 text-center animate-slide-in">
        VibeCoding: The Triad of Knowledge
      </h2>

      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg p-8 text-white text-center animate-slide-in" style={{ animationDelay: "0.2s" }}>
          <div className="text-4xl mb-4">📦</div>
          <h3 className="text-2xl font-bold mb-4">Entities</h3>
          <p className="text-blue-100">
            Code elements (Classes, Functions) and Business Concepts (API, Service) with precise location.
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg p-8 text-white text-center animate-slide-in" style={{ animationDelay: "0.4s" }}>
          <div className="text-4xl mb-4">🔗</div>
          <h3 className="text-2xl font-bold mb-4">Relations</h3>
          <p className="text-purple-100">
            Directed connections between entities: uses, calls, depends_on, extends, implements.
          </p>
        </div>

        <div className="bg-gradient-to-br from-pink-600 to-pink-700 rounded-lg p-8 text-white text-center animate-slide-in" style={{ animationDelay: "0.6s" }}>
          <div className="text-4xl mb-4">💭</div>
          <h3 className="text-2xl font-bold mb-4">Observations</h3>
          <p className="text-pink-100">
            Human-annotated, persistent notes (warnings, design decisions, TODOs).
          </p>
        </div>
      </div>

      <div className="bg-slate-700 rounded-lg p-8 text-center animate-slide-in" style={{ animationDelay: "0.8s" }}>
        <p className="text-xl text-white font-semibold">
          These three elements form a structured, persistent <span className="text-blue-300">Knowledge Graph</span> that evolves with your code.
        </p>
      </div>
    </div>
  </div>
);

import snapshot1 from "./snapshot1.png";

const Slide4 = () => (
  <div className="relative w-full h-full bg-gradient-to-br from-white to-slate-50 flex flex-col items-center justify-center overflow-hidden p-12">
    <div className="max-w-6xl w-full flex gap-12 items-center">
      <div className="flex-1">
        <h2 className="text-4xl font-bold text-slate-900 mb-8 animate-slide-in">
          Feature 1: Visualizing Complexity
        </h2>

        <div className="space-y-6 mb-8">
          <div className="bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-green-500 p-4 animate-slide-in" style={{ animationDelay: "0.2s" }}>
            <h3 className="text-lg font-bold text-green-800 mb-1">🕸️ Understanding</h3>
            <p className="text-slate-700 text-sm">
              Instantly visualize the entire project architecture (Controller → Service → Entity).
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-blue-500 p-4 animate-slide-in" style={{ animationDelay: "0.4s" }}>
            <h3 className="text-lg font-bold text-blue-800 mb-1">⚡ Impact Analysis</h3>
            <p className="text-slate-700 text-sm">
              Quickly see all components that depend on a specific entity.
            </p>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 border-l-4 border-red-500 p-4 animate-slide-in" style={{ animationDelay: "0.6s" }}>
            <h3 className="text-lg font-bold text-red-800 mb-1">⚠️ Architecture Health</h3>
            <p className="text-slate-700 text-sm">
              Automatic detection of circular dependencies.
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 animate-slide-in" style={{ animationDelay: "0.8s" }}>
        <div className="relative rounded-xl overflow-hidden shadow-2xl border-4 border-slate-200 transform hover:scale-105 transition-transform duration-500">
          <img src={snapshot1} alt="Interactive Graph Visualization" className="w-full h-auto object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
        </div>
        <p className="text-center text-slate-500 text-sm mt-4 italic">
          Interactive Graph Visualization powered by vis-network
        </p>
      </div>
    </div>
  </div>
);

const Slide5 = () => (
  <div className="relative w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col items-center justify-center overflow-hidden p-12">
    <div className="max-w-5xl w-full">
      <h2 className="text-5xl font-bold text-white mb-12 text-center animate-slide-in">
        Feature 2: Persistent Knowledge & AI Acceleration
      </h2>

      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-8 text-white animate-slide-in" style={{ animationDelay: "0.2s" }}>
          <h3 className="text-2xl font-bold mb-3">📝 Persistent Knowledge</h3>
          <p className="text-blue-100">
            Observations (design notes, performance warnings) are stored in local SQLite and committed to Git, making knowledge a first-class citizen.
          </p>
        </div>

        <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg p-8 text-white animate-slide-in" style={{ animationDelay: "0.4s" }}>
          <h3 className="text-2xl font-bold mb-3">🤖 One-Click Export</h3>
          <p className="text-purple-100">
            Generates structured Markdown/JSON of the graph for AI consumption.
          </p>
        </div>

        <div className="bg-gradient-to-r from-pink-600 to-pink-700 rounded-lg p-8 text-white animate-slide-in" style={{ animationDelay: "0.6s" }}>
          <h3 className="text-2xl font-bold mb-3">🎯 Scenario Switching</h3>
          <p className="text-pink-100">
            8 built-in AI context templates (Frontend, Backend, Testing, Debugging) to instantly tailor the AI's focus.
          </p>
        </div>

        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg p-8 text-white animate-slide-in" style={{ animationDelay: "0.8s" }}>
          <h3 className="text-2xl font-bold mb-3">⚙️ Integrated Context</h3>
          <p className="text-green-100">
            Automatically generates configuration files for AI tools (.cursorrules, copilot-instructions.md).
          </p>
        </div>
      </div>
    </div>
  </div>
);

const Slide6 = () => (
  <div className="relative w-full h-full bg-gradient-to-br from-white to-slate-50 flex flex-col items-center justify-center overflow-hidden p-12">
    <div className="max-w-5xl w-full">
      <h2 className="text-5xl font-bold text-slate-900 mb-12 text-center animate-slide-in">
        Feature 3: Persistent RAG Knowledge Base
      </h2>

      <div className="grid grid-cols-2 gap-8 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 rounded-lg p-8 animate-slide-in" style={{ animationDelay: "0.2s" }}>
          <h3 className="text-2xl font-bold text-blue-800 mb-4">☁️ Cloud RAG (Gemini)</h3>
          <ul className="text-slate-700 space-y-2">
            <li>✓ Hosted, multi-format support (100+ file types)</li>
            <li>✓ Ideal for public/less sensitive docs</li>
            <li>✓ Semantic search powered by Gemini</li>
          </ul>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300 rounded-lg p-8 animate-slide-in" style={{ animationDelay: "0.4s" }}>
          <h3 className="text-2xl font-bold text-green-800 mb-4">💾 Local RAG (Private)</h3>
          <ul className="text-slate-700 space-y-2">
            <li>✓ Data privacy focus</li>
            <li>✓ All vectors stored locally in SQLite</li>
            <li>✓ Any OpenAI-compatible endpoint</li>
          </ul>
        </div>
      </div>

      <div className="bg-slate-100 rounded-lg p-8 animate-slide-in" style={{ animationDelay: "0.6s" }}>
        <h3 className="text-2xl font-bold text-slate-900 mb-4">🤖 Smart Q&A</h3>
        <p className="text-slate-700 text-lg">
          Use "Ask Question" to query project documents. Answers are grounded with source citations (Grounding Metadata).
        </p>
      </div>
    </div>
  </div>
);

const Slide7 = () => (
  <div className="relative w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col items-center justify-center overflow-hidden p-12">
    <div className="max-w-5xl w-full">
      <h2 className="text-5xl font-bold text-white mb-12 text-center animate-slide-in">
        Real-World Impact: Onboarding & Refactoring
      </h2>

      <div className="space-y-6">
        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg p-8 text-white animate-slide-in" style={{ animationDelay: "0.2s" }}>
          <h3 className="text-2xl font-bold mb-4">👶 New Developer Onboarding</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-semibold text-green-100 mb-2">Before:</p>
              <p className="text-green-50">Weeks of reading code and asking questions</p>
            </div>
            <div>
              <p className="font-semibold text-green-100 mb-2">With VibeCoding:</p>
              <p className="text-green-50">View the Knowledge Graph for instant architectural overview. Use Ask Question on RAG base for instant answers from documentation.</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-8 text-white animate-slide-in" style={{ animationDelay: "0.4s" }}>
          <h3 className="text-2xl font-bold mb-4">🔧 Safe Refactoring</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-semibold text-blue-100 mb-2">Before:</p>
              <p className="text-blue-50">Tedious global search and manual impact assessment</p>
            </div>
            <div>
              <p className="font-semibold text-blue-100 mb-2">With VibeCoding:</p>
              <p className="text-blue-50">Click on the entity to be refactored, and the graph instantly highlights all dependent components. Assess impact in seconds.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const Slide8 = () => (
  <div className="relative w-full h-full bg-gradient-to-br from-white to-slate-50 flex flex-col items-center justify-center overflow-hidden p-12">
    <div className="max-w-5xl w-full">
      <h2 className="text-5xl font-bold text-slate-900 mb-12 text-center animate-slide-in">
        Technical Architecture & Innovation
      </h2>

      <div className="mb-8 animate-slide-in" style={{ animationDelay: "0.2s" }}>
        <h3 className="text-2xl font-bold text-slate-900 mb-4">Tech Stack</h3>
        <p className="text-slate-700 text-lg mb-4">
          VS Code Extension API • TypeScript • sql.js (WebAssembly SQLite) • vis-network visualization
        </p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 rounded-lg p-6 animate-slide-in" style={{ animationDelay: "0.4s" }}>
          <h3 className="text-xl font-bold text-blue-800 mb-3">🌍 Cross-Platform</h3>
          <p className="text-slate-700">
            WebAssembly SQLite eliminates external dependencies for true "zero-setup" experience.
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-300 rounded-lg p-6 animate-slide-in" style={{ animationDelay: "0.6s" }}>
          <h3 className="text-xl font-bold text-purple-800 mb-3">🔒 Project Isolation</h3>
          <p className="text-slate-700">
            Unique Store IDs ensure multi-project work is secure and clean.
          </p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300 rounded-lg p-6 animate-slide-in" style={{ animationDelay: "0.8s" }}>
          <h3 className="text-xl font-bold text-green-800 mb-3">🌐 Multi-Language</h3>
          <p className="text-slate-700">
            Full i18n support (English/Chinese) for all UI, commands, and templates.
          </p>
        </div>
      </div>
    </div>
  </div>
);

const Slide9 = () => (
  <div className="relative w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col items-center justify-center overflow-hidden p-12">
    <div className="max-w-5xl w-full">
      <h2 className="text-5xl font-bold text-white mb-12 text-center animate-slide-in">
        VibeCoding: Value for Financial Services & State Street
      </h2>

      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-8 text-white animate-slide-in" style={{ animationDelay: "0.2s" }}>
          <h3 className="text-2xl font-bold mb-3">📋 Regulatory Compliance & Audit</h3>
          <p className="text-blue-100">
            Observations can be used to tag code with compliance notes, audit trails, and security warnings, making code review and auditing faster.
          </p>
        </div>

        <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg p-8 text-white animate-slide-in" style={{ animationDelay: "0.4s" }}>
          <h3 className="text-2xl font-bold mb-3">🏛️ Legacy System Modernization</h3>
          <p className="text-purple-100">
            Quickly map dependencies and identify technical debt (circular dependencies, performance warnings) in large, complex legacy systems.
          </p>
        </div>

        <div className="bg-gradient-to-r from-pink-600 to-pink-700 rounded-lg p-8 text-white animate-slide-in" style={{ animationDelay: "0.6s" }}>
          <h3 className="text-2xl font-bold mb-3">💾 Knowledge Retention</h3>
          <p className="text-pink-100">
            Critical in high-turnover environments. The persistent knowledge graph ensures institutional knowledge is never lost.
          </p>
        </div>
      </div>
    </div>
  </div>
);

const Slide10 = () => (
  <div className="relative w-full h-full bg-gradient-to-br from-white to-slate-50 flex flex-col items-center justify-center overflow-hidden p-12">
    <div className="max-w-5xl w-full text-center">
      <h2 className="text-5xl font-bold text-slate-900 mb-8 animate-slide-in">
        The Future of Code
      </h2>
      <p className="text-3xl font-semibold text-blue-600 mb-12 animate-slide-in" style={{ animationDelay: "0.2s" }}>
        Intelligent, Persistent, and AI-Ready
      </p>

      <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 rounded-lg p-12 mb-8 animate-slide-in" style={{ animationDelay: "0.4s" }}>
        <p className="text-xl text-slate-800 mb-6">
          VibeCoding is a complete, production-ready tool that bridges the gap between code, human knowledge, and AI.
        </p>

        <div className="space-y-4">
          <p className="text-lg text-slate-700">
            <span className="font-bold text-blue-700">✨ Future Plans:</span> Automated entity creation (AST parsing), advanced graph querying
          </p>
          <p className="text-lg text-slate-700">
            <span className="font-bold text-blue-700">🎬 Live Demo:</span> NestJS RealWorld Example App demonstration
          </p>
        </div>
      </div>

      <div className="text-center animate-slide-in" style={{ animationDelay: "0.6s" }}>
        <p className="text-2xl font-bold text-slate-900 mb-4">Thank You!</p>
        <p className="text-xl text-slate-600">State Street 2025 Hackathon</p>
      </div>
    </div>
  </div>
);

const slides = [Slide1, Slide2, Slide3, Slide4, Slide5, Slide6, Slide7, Slide8, Slide9, Slide10];

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
      } else if (e.key === "ArrowLeft") {
        setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
      } else if (e.key === "f" || e.key === "F") {
        setIsFullscreen(!isFullscreen);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  const CurrentSlide = slides[currentSlide];

  return (
    <div className={`w-screen h-screen bg-slate-900 flex flex-col ${isFullscreen ? "fixed inset-0 z-50" : ""}`}>
      {/* Main slide area */}
      <div className="flex-1 overflow-hidden">
        <CurrentSlide />
      </div>

      {/* Controls */}
      <div className="bg-slate-950 border-t border-slate-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)}
            className="text-white border-slate-600 hover:bg-slate-800"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
            className="text-white border-slate-600 hover:bg-slate-800"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-white text-sm font-medium">
            {currentSlide + 1} / {slides.length}
          </span>
          <div className="w-48 h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${((currentSlide + 1) / slides.length) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="text-white border-slate-600 hover:bg-slate-800"
            title="Fullscreen (F)"
          >
            <Maximize2 className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Keyboard hints */}
      <div className="bg-slate-900 px-6 py-2 text-center text-xs text-slate-400">
        Use arrow keys or space to navigate • Press F for fullscreen
      </div>

      {/* Global styles for animations */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fadeIn 0.8s ease-out forwards;
          opacity: 0;
        }

        .animate-slide-in {
          animation: slideIn 0.6s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
}
