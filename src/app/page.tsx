"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Copy, Check, Loader2, Type, Hash, Zap, BookOpen } from "lucide-react";

export default function Home() {
  const [title, setTitle] = useState("");
  const [keywords, setKeywords] = useState("");
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState("");
  const [copied, setCopied] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setContent("");

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, keywords }),
      });

      const data = await response.json();
      if (data.content) {
        setContent(data.content);
      } else {
        alert(data.error || "Something went wrong. Make sure your GEMINI_API_KEY is set in .env");
      }
    } catch (error) {
      console.error(error);
      alert("Failed to connect to the server");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!content) return;
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="min-h-screen bg-black text-white selection:bg-orange-500/30 overflow-x-hidden">
      {/* Background Glows */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-orange-600/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-orange-900/10 blur-[120px]" />
      </div>

      <div className="max-w-5xl mx-auto px-6 py-16 md:py-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-orange-500 text-sm font-medium mb-6">
            <Zap size={14} fill="currentColor" />
            <span>Powered by Gemini 1.5 Flash</span>
          </div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tight mb-6 gradient-text">
            Content AI
          </h1>
          <p className="text-zinc-400 text-xl max-w-2xl mx-auto leading-relaxed">
            Generate 1000+ words of professional, SEO-optimized, and high-converting content instantly.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-[1fr,1.2fr] gap-12 items-start">
          {/* Input Panel */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="glass p-8 rounded-[32px] sticky top-8"
          >
            <form onSubmit={handleGenerate} className="space-y-8">
              <div className="space-y-3">
                <label className="text-sm font-semibold text-zinc-300 flex items-center gap-2 px-1">
                  <Type size={16} className="text-orange-500" /> Title of Content
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="The Future of AI in 2026..."
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500/40 transition-all text-white placeholder:text-zinc-600"
                  required
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-semibold text-zinc-300 flex items-center gap-2 px-1">
                  <Hash size={16} className="text-orange-500" /> Target Keywords
                </label>
                <textarea
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="AI, Digital Marketing, Growth Strategies..."
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500/40 transition-all text-white placeholder:text-zinc-600 min-h-[120px] resize-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-600 hover:bg-orange-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-bold py-5 rounded-2xl transition-all flex items-center justify-center gap-3 group relative overflow-hidden shadow-2xl shadow-orange-600/20"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={24} />
                ) : (
                  <>
                    <Sparkles size={24} className="group-hover:rotate-12 transition-transform duration-300" />
                    <span className="text-lg">Generate Magic</span>
                  </>
                )}
              </button>
            </form>
          </motion.div>

          {/* Output Panel */}
          <div className="min-h-[500px]">
            <AnimatePresence mode="wait">
              {content ? (
                <motion.div
                  key="content"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="glass p-8 rounded-[32px] relative group border-orange-500/20"
                >
                  <div className="flex justify-between items-center mb-8 border-b border-zinc-800 pb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-600/20 flex items-center justify-center text-orange-500">
                        <BookOpen size={20} />
                      </div>
                      <h3 className="text-xl font-bold text-zinc-100">Generated Article</h3>
                    </div>
                    <button
                      onClick={copyToClipboard}
                      className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-all text-sm font-medium border border-zinc-700 active:scale-95"
                    >
                      {copied ? (
                        <>
                          <Check size={16} className="text-green-500" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy size={16} />
                          <span>Copy Content</span>
                        </>
                      )}
                    </button>
                  </div>
                  
                  <div className="prose prose-invert max-w-none prose-orange">
                    <div className="whitespace-pre-wrap text-zinc-300 leading-[1.8] text-lg font-light tracking-wide">
                      {content}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full min-h-[500px] border-2 border-dashed border-zinc-800 rounded-[32px] flex flex-col items-center justify-center p-12 text-center"
                >
                  <div className="w-20 h-20 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6 text-zinc-600 group-hover:text-orange-500 transition-colors">
                    <Sparkles size={40} />
                  </div>
                  <h3 className="text-2xl font-bold text-zinc-500 mb-2">Ready to Create?</h3>
                  <p className="text-zinc-600 max-w-xs">
                    Fill in the title and keywords to generate your high-quality content.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-24 pt-12 border-t border-zinc-900 flex flex-col md:flex-row justify-between items-center gap-6 text-zinc-500 text-sm">
          <p>© 2026 Content Studio AI. All rights reserved.</p>
          <div className="flex gap-8">
            <a href="#" className="hover:text-orange-500 transition-colors">Documentation</a>
            <a href="#" className="hover:text-orange-500 transition-colors">API Keys</a>
            <a href="#" className="hover:text-orange-500 transition-colors">Support</a>
          </div>
        </div>
      </div>
    </main>
  );
}
