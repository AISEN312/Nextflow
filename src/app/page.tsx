import Link from "next/link";
import { Show, SignInButton, UserButton } from "@clerk/nextjs";
import { Zap, ArrowRight, Brain, ImageIcon, Video, Crop, Film, Type } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-6 h-6 text-purple-400" />
            <span className="text-lg font-bold text-zinc-100">NextFlow</span>
          </div>
          <div className="flex items-center gap-4">
            <Show when="signed-out">
              <SignInButton mode="modal">
                <button className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-medium transition-colors">
                  Sign In
                </button>
              </SignInButton>
            </Show>
            <Show when="signed-in">
              <Link
                href="/workflow"
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                Open Editor <ArrowRight className="w-4 h-4" />
              </Link>
              <UserButton />
            </Show>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="max-w-7xl mx-auto px-6 py-24 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 mb-6">
            <Zap className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-xs font-medium text-purple-300">
              AI-Powered Workflow Builder
            </span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-zinc-100 leading-tight mb-6">
            Build LLM Workflows
            <br />
            <span className="text-purple-400">Visually</span>
          </h1>

          <p className="text-lg text-zinc-400 max-w-2xl mx-auto mb-10">
            NextFlow is a visual workflow builder for creating, executing, and
            managing LLM pipelines. Connect nodes, chain prompts, process media,
            and run AI models — all from a beautiful drag-and-drop interface.
          </p>

          <div className="flex items-center justify-center gap-4 mb-16">
            <Show when="signed-out">
              <SignInButton mode="modal">
                <button className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2">
                  Get Started <ArrowRight className="w-4 h-4" />
                </button>
              </SignInButton>
            </Show>
            <Show when="signed-in">
              <Link
                href="/workflow"
                className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                Open Workflow Editor <ArrowRight className="w-4 h-4" />
              </Link>
            </Show>
          </div>

          {/* Node types showcase */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-4xl mx-auto">
            {[
              { icon: <Type className="w-5 h-5" />, label: "Text", color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/5" },
              { icon: <ImageIcon className="w-5 h-5" />, label: "Upload Image", color: "text-blue-400 border-blue-500/30 bg-blue-500/5" },
              { icon: <Video className="w-5 h-5" />, label: "Upload Video", color: "text-indigo-400 border-indigo-500/30 bg-indigo-500/5" },
              { icon: <Brain className="w-5 h-5" />, label: "Run LLM", color: "text-purple-400 border-purple-500/30 bg-purple-500/5" },
              { icon: <Crop className="w-5 h-5" />, label: "Crop Image", color: "text-orange-400 border-orange-500/30 bg-orange-500/5" },
              { icon: <Film className="w-5 h-5" />, label: "Extract Frame", color: "text-cyan-400 border-cyan-500/30 bg-cyan-500/5" },
            ].map((node) => (
              <div
                key={node.label}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border ${node.color} transition-all hover:scale-105`}
              >
                {node.icon}
                <span className="text-xs font-medium">{node.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="max-w-7xl mx-auto px-6 py-16 border-t border-zinc-800">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-xl bg-zinc-900/50 border border-zinc-800">
              <Brain className="w-8 h-8 text-purple-400 mb-4" />
              <h3 className="text-lg font-semibold text-zinc-100 mb-2">
                Google Gemini Integration
              </h3>
              <p className="text-sm text-zinc-400">
                Run any Gemini model with vision support. Chain prompts, send
                images, and get AI-powered results.
              </p>
            </div>
            <div className="p-6 rounded-xl bg-zinc-900/50 border border-zinc-800">
              <Zap className="w-8 h-8 text-yellow-400 mb-4" />
              <h3 className="text-lg font-semibold text-zinc-100 mb-2">
                Parallel Execution
              </h3>
              <p className="text-sm text-zinc-400">
                Independent branches execute concurrently. Nodes only wait for
                their direct dependencies.
              </p>
            </div>
            <div className="p-6 rounded-xl bg-zinc-900/50 border border-zinc-800">
              <Film className="w-8 h-8 text-cyan-400 mb-4" />
              <h3 className="text-lg font-semibold text-zinc-100 mb-2">
                Media Processing
              </h3>
              <p className="text-sm text-zinc-400">
                Crop images, extract video frames, and process media directly in
                your workflow using FFmpeg.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 px-6 py-6">
        <div className="max-w-7xl mx-auto text-center text-xs text-zinc-600">
          NextFlow — Built with Next.js, React Flow, and Google Gemini
        </div>
      </footer>
    </div>
  );
}
