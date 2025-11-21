import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import snapshot1 from "./snapshot1.png";

// --- Animation Variants ---
const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 1000 : -1000,
    opacity: 0,
    scale: 0.95,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 1000 : -1000,
    opacity: 0,
    scale: 0.95,
  }),
};

const contentVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (custom: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: custom * 0.1, duration: 0.5, ease: "easeOut" },
  }),
};

// --- Background Component ---
const AnimatedBackground = () => (
  <div className="absolute inset-0 overflow-hidden -z-10">
    <div className="absolute inset-0 bg-slate-950" />
    <motion.div
      animate={{
        scale: [1, 1.2, 1],
        rotate: [0, 90, 0],
        opacity: [0.3, 0.5, 0.3],
      }}
      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      className="absolute -top-[20%] -left-[10%] w-[60vw] h-[60vw] bg-blue-600/20 rounded-full blur-[100px]"
    />
    <motion.div
      animate={{
        scale: [1, 1.3, 1],
        rotate: [0, -60, 0],
        opacity: [0.2, 0.4, 0.2],
      }}
      transition={{ duration: 25, repeat: Infinity, ease: "linear", delay: 2 }}
      className="absolute -bottom-[20%] -right-[10%] w-[70vw] h-[70vw] bg-purple-600/20 rounded-full blur-[100px]"
    />
  </div>
);

// --- Slides ---

const Slide1 = () => (
  <div className="flex flex-col items-center justify-center h-full text-center px-12">
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.8, type: "spring" }}
      className="mb-12 relative"
    >
      <div className="absolute -inset-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur-3xl opacity-30 animate-pulse" />
      <h1 className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 relative z-10 pb-2 pr-2">
        VibeCoding
      </h1>
    </motion.div>

    <motion.p
      custom={1}
      variants={contentVariants}
      initial="hidden"
      animate="visible"
      className="text-4xl font-bold text-slate-200 mb-8 max-w-4xl leading-tight"
    >
      The Intelligent Knowledge Graph for Code
    </motion.p>

    <motion.div
      custom={2}
      variants={contentVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-6 items-center"
    >
      <div className="px-8 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-blue-200 font-semibold text-xl">
        State Street 2025 Hackathon
      </div>
      <p className="text-slate-400 text-xl max-w-2xl">
        Accelerating AI-Powered Development with Persistent Project Context
      </p>
    </motion.div>
  </div>
);

const Slide2 = () => (
  <div className="h-full flex flex-col justify-center px-20">
    <motion.h2
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      className="text-6xl font-bold text-white mb-16"
    >
      The AI Context Gap
    </motion.h2>

    <div className="grid grid-cols-2 gap-12">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-red-500/10 border border-red-500/30 p-10 rounded-3xl backdrop-blur-sm"
      >
        <h3 className="text-3xl font-bold text-red-400 mb-6 flex items-center gap-4">
          <span className="text-4xl">😫</span> Developer Pain
        </h3>
        <p className="text-slate-300 text-2xl leading-relaxed">
          Code is complex. Dependencies are hidden. <br />
          <span className="text-white font-semibold">Knowledge is lost</span> when developers leave.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-orange-500/10 border border-orange-500/30 p-10 rounded-3xl backdrop-blur-sm"
      >
        <h3 className="text-3xl font-bold text-orange-400 mb-6 flex items-center gap-4">
          <span className="text-4xl">🤖</span> AI Limitation
        </h3>
        <p className="text-slate-300 text-2xl leading-relaxed">
          AI tools lack deep context. They don't know the <br />
          <span className="text-white font-semibold">"Why"</span> behind the code.
        </p>
      </motion.div>
    </div>

    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.6 }}
      className="mt-16 p-8 bg-blue-600/20 border border-blue-500/40 rounded-2xl text-center"
    >
      <p className="text-3xl text-blue-200 font-medium">
        💡 AI needs more than just code; it needs the <span className="font-bold text-white">Knowledge Graph</span>.
      </p>
    </motion.div>
  </div>
);

import snapshot2 from "./snapshot2.png";

const Slide3 = () => (
  <div className="h-full flex flex-col justify-center px-12">
    <motion.h2
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-5xl font-bold text-white mb-12 text-center"
    >
      The Triad of Knowledge
    </motion.h2>

    <div className="flex gap-12 items-center">
      <div className="w-1/2 space-y-6">
        {[
          { icon: "📦", title: "Entities", color: "blue", desc: "Code elements (Classes, Functions) & Business Concepts." },
          { icon: "🔗", title: "Relations", color: "purple", desc: "Directed connections: uses, calls, depends_on." },
          { icon: "💭", title: "Observations", color: "pink", desc: "Human-annotated, persistent notes & design decisions." },
        ].map((item, index) => (
          <motion.div
            key={item.title}
            custom={index}
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            whileHover={{ scale: 1.02, x: 10 }}
            className={`bg-${item.color}-500/10 border border-${item.color}-500/30 p-6 rounded-2xl backdrop-blur-sm flex items-center gap-6`}
          >
            <div className="text-4xl bg-slate-900/50 p-3 rounded-xl">{item.icon}</div>
            <div className="text-left">
              <h3 className={`text-2xl font-bold text-${item.color}-400 mb-1`}>{item.title}</h3>
              <p className="text-slate-300 text-lg leading-tight">{item.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.8, x: 50 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="w-1/2"
      >
        <div className="relative group">
          <div className="absolute -inset-4 bg-gradient-to-br from-pink-500 to-blue-600 rounded-3xl blur-2xl opacity-30 group-hover:opacity-50 transition-opacity duration-500" />
          <img
            src={snapshot2}
            alt="Triad of Knowledge Diagram"
            className="relative rounded-2xl shadow-2xl border border-slate-700/50 w-full object-cover transform transition-transform duration-500 group-hover:scale-[1.02]"
          />
        </div>
      </motion.div>
    </div>
  </div>
);

const Slide4 = () => (
  <div className="h-full flex flex-col justify-center px-16">
    <div className="flex gap-16 items-center">
      <div className="flex-1">
        <motion.h2
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-5xl font-bold text-white mb-10"
        >
          Visualizing Complexity
        </motion.h2>

        <div className="space-y-6">
          {[
            { title: "Understanding", desc: "Instantly visualize architecture.", color: "green" },
            { title: "Impact Analysis", desc: "See dependencies before you break them.", color: "blue" },
            { title: "Health Check", desc: "Spot circular dependencies instantly.", color: "red" },
          ].map((item, index) => (
            <motion.div
              key={item.title}
              custom={index}
              variants={contentVariants}
              initial="hidden"
              animate="visible"
              className={`p-6 rounded-xl bg-slate-800/50 border-l-4 border-${item.color}-500 backdrop-blur-sm`}
            >
              <h3 className={`text-2xl font-bold text-${item.color}-400 mb-1`}>{item.title}</h3>
              <p className="text-slate-300 text-lg">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ duration: 0.8 }}
        className="flex-1 relative group"
      >
        <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur-2xl opacity-40 group-hover:opacity-60 transition-opacity duration-500" />
        <img
          src={snapshot1}
          alt="Graph Visualization"
          className="relative rounded-xl shadow-2xl border border-slate-700/50 w-full object-cover transform transition-transform duration-500 group-hover:scale-[1.02]"
        />
      </motion.div>
    </div>
  </div>
);

import snapshot4 from "./snapshot4.png";

const Slide5 = () => (
  <div className="h-full flex flex-col justify-center px-20">
    <motion.h2
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="text-5xl font-bold text-white mb-12 text-center"
    >
      Persistent Knowledge & AI Acceleration
    </motion.h2>

    <div className="grid grid-cols-2 gap-12 items-center">
      <motion.div
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="space-y-6"
      >
        <div className="bg-slate-800/40 p-8 rounded-3xl border border-slate-700 backdrop-blur-sm">
          <h3 className="text-3xl font-bold text-blue-400 mb-4">📝 Persistent Knowledge</h3>
          <p className="text-slate-300 text-xl leading-relaxed">
            Observations are stored in <code className="bg-slate-900 px-2 py-1 rounded text-yellow-400">graph.sqlite</code> and committed to Git. Knowledge becomes a first-class citizen of your repo.
          </p>
        </div>

        <div className="relative group overflow-hidden rounded-2xl border border-slate-700/50 shadow-2xl">
          <div className="absolute inset-0 bg-blue-500/10 group-hover:bg-transparent transition-colors duration-300" />
          <img
            src={snapshot4}
            alt="Persistent Knowledge UI"
            className="w-full object-cover transform group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      </motion.div>

      <div className="space-y-6">
        {[
          { title: "One-Click Export", desc: "Generate Markdown/JSON for AI context.", icon: "🤖" },
          { title: "Scenario Switching", desc: "Context templates for Frontend, Backend, Testing.", icon: "🎯" },
          { title: "Auto-Config", desc: "Generates .cursorrules & copilot-instructions.md.", icon: "⚙️" },
        ].map((item, index) => (
          <motion.div
            key={item.title}
            custom={index + 2}
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            whileHover={{ scale: 1.02, x: 10 }}
            className="bg-slate-800/40 p-6 rounded-2xl border border-slate-700 flex items-center gap-6 backdrop-blur-sm"
          >
            <div className="text-4xl bg-slate-900/50 p-3 rounded-xl">{item.icon}</div>
            <div>
              <h4 className="text-xl font-bold text-white">{item.title}</h4>
              <p className="text-slate-400">{item.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </div>
);

const Slide6 = () => (
  <div className="h-full flex flex-col justify-center px-20">
    <motion.h2
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="text-6xl font-bold text-white mb-16 text-center"
    >
      RAG Knowledge Base
    </motion.h2>

    <div className="flex gap-12 justify-center">
      <motion.div
        whileHover={{ scale: 1.05 }}
        className="w-1/3 bg-gradient-to-b from-blue-900/40 to-slate-900/40 border border-blue-500/30 p-10 rounded-3xl backdrop-blur-sm"
      >
        <div className="text-5xl mb-6">☁️</div>
        <h3 className="text-3xl font-bold text-blue-400 mb-4">Cloud RAG</h3>
        <p className="text-slate-400 text-lg mb-6">Powered by Google Gemini File Search.</p>
        <ul className="space-y-3 text-slate-300 text-lg">
          <li>✓ Hosted & Managed</li>
          <li>✓ 100+ File Formats</li>
          <li>✓ Semantic Search</li>
        </ul>
      </motion.div>

      <motion.div
        whileHover={{ scale: 1.05 }}
        className="w-1/3 bg-gradient-to-b from-green-900/40 to-slate-900/40 border border-green-500/30 p-10 rounded-3xl backdrop-blur-sm"
      >
        <div className="text-5xl mb-6">💾</div>
        <h3 className="text-3xl font-bold text-green-400 mb-4">Local RAG</h3>
        <p className="text-slate-400 text-lg mb-6">Privacy-first, offline-capable.</p>
        <ul className="space-y-3 text-slate-300 text-lg">
          <li>✓ 100% Local SQLite</li>
          <li>✓ OpenAI Compatible</li>
          <li>✓ Secure & Private</li>
        </ul>
      </motion.div>
    </div>
  </div>
);

const Slide7 = () => (
  <div className="h-full flex flex-col justify-center px-20">
    <motion.h2
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="text-5xl font-bold text-white mb-16 text-center"
    >
      Real-World Impact
    </motion.h2>

    <div className="space-y-8">
      <motion.div
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="bg-slate-800/50 p-10 rounded-3xl border-l-8 border-green-500 flex items-center gap-10"
      >
        <div className="text-6xl">👶</div>
        <div>
          <h3 className="text-3xl font-bold text-white mb-2">Onboarding</h3>
          <p className="text-slate-300 text-xl">
            From <span className="text-red-400 line-through">weeks of confusion</span> to <span className="text-green-400 font-bold">minutes of clarity</span>.
            New devs explore the graph instead of reading stale docs.
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-slate-800/50 p-10 rounded-3xl border-l-8 border-blue-500 flex items-center gap-10"
      >
        <div className="text-6xl">🔧</div>
        <div>
          <h3 className="text-3xl font-bold text-white mb-2">Refactoring</h3>
          <p className="text-slate-300 text-xl">
            Assess impact in seconds. Click an entity, see every dependency.
            <span className="text-blue-400 font-bold"> Refactor with confidence.</span>
          </p>
        </div>
      </motion.div>
    </div>
  </div>
);

const Slide8 = () => (
  <div className="h-full flex flex-col justify-center px-20 text-center">
    <motion.h2
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="text-7xl font-bold text-white mb-12"
    >
      The Future of Code
    </motion.h2>

    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="text-4xl text-blue-400 font-semibold mb-20"
    >
      Intelligent. Persistent. AI-Ready.
    </motion.p>

    <div className="flex justify-center gap-8">
      <motion.div
        whileHover={{ scale: 1.1 }}
        className="bg-white/10 backdrop-blur-md px-12 py-6 rounded-2xl border border-white/20"
      >
        <p className="text-2xl text-white font-bold">🚀 Try the Demo</p>
      </motion.div>
      <motion.div
        whileHover={{ scale: 1.1 }}
        className="bg-blue-600 px-12 py-6 rounded-2xl shadow-lg shadow-blue-600/30"
      >
        <p className="text-2xl text-white font-bold">⭐ Star on GitHub</p>
      </motion.div>
    </div>

    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1 }}
      className="mt-20 text-slate-500 text-xl"
    >
      State Street 2025 Hackathon
    </motion.p>
  </div>
);

const slides = [Slide1, Slide2, Slide3, Slide4, Slide5, Slide6, Slide7, Slide8];

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const paginate = (newDirection: number) => {
    const nextSlide = currentSlide + newDirection;
    if (nextSlide >= 0 && nextSlide < slides.length) {
      setDirection(newDirection);
      setCurrentSlide(nextSlide);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        paginate(1);
      } else if (e.key === "ArrowLeft") {
        paginate(-1);
      } else if (e.key === "f" || e.key === "F") {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen();
          setIsFullscreen(true);
        } else {
          document.exitFullscreen();
          setIsFullscreen(false);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentSlide]);

  const CurrentSlide = slides[currentSlide];

  return (
    <div className="w-screen h-screen bg-slate-950 text-slate-100 overflow-hidden relative font-sans selection:bg-blue-500/30">
      <AnimatedBackground />

      {/* Slide Container */}
      <div className="absolute inset-0 flex items-center justify-center">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentSlide}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
            className="w-full h-full max-w-[1600px] mx-auto"
          >
            <CurrentSlide />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-6 flex justify-between items-end bg-gradient-to-t from-slate-950 to-transparent z-50">
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => paginate(-1)}
            disabled={currentSlide === 0}
            className="text-slate-400 hover:text-white hover:bg-white/10"
          >
            <ChevronLeft className="w-8 h-8" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => paginate(1)}
            disabled={currentSlide === slides.length - 1}
            className="text-slate-400 hover:text-white hover:bg-white/10"
          >
            <ChevronRight className="w-8 h-8" />
          </Button>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="flex gap-1 mb-2">
            {slides.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentSlide ? "w-8 bg-blue-500" : "w-2 bg-slate-700"
                  }`}
              />
            ))}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen();
                setIsFullscreen(true);
              } else {
                document.exitFullscreen();
                setIsFullscreen(false);
              }
            }}
            className="text-slate-400 hover:text-white hover:bg-white/10"
          >
            {isFullscreen ? <Minimize2 /> : <Maximize2 />}
          </Button>
        </div>
      </div>
    </div>
  );
}
