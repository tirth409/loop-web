"use client";

import React, { useState, useRef, useEffect } from "react";
import { Sparkles, Send, Bot, User as UserIcon, BookOpen, AlertCircle } from "lucide-react";
import { askLoop } from "@/lib/api/insights";
import type { AskLoopResponse, InsightMessage } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Drawer } from "@/components/ui/Drawer";
import { FeedbackDetail } from "@/components/feedback/FeedbackDetail";

const SUGGESTIONS = [
  "What are users saying about onboarding?",
  "What are the biggest complaints this month?",
  "Which themes are growing fastest?",
  "What do customers like most?",
];

export default function AskLoopPage() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<InsightMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [selectedSource, setSelectedSource] = useState<any | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSubmit = async (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const q = customQuery || query;
    if (!q.trim() || loading) return;

    const userMsg: InsightMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: q.trim(),
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setQuery("");
    setLoading(true);

    try {
      const res = await askLoop({ question: q.trim(), conversationId });
      
      const assistantMsg: InsightMessage = {
        id: `msg-${Date.now() + 1}`,
        role: "assistant",
        content: res.answer,
        groundedIn: res.groundedIn,
        sources: res.sources,
        createdAt: new Date().toISOString(),
      };
      
      setMessages((prev) => [...prev, assistantMsg]);
      setConversationId(res.conversationId);
    } catch (err: any) {
      const errorMsg: InsightMessage = {
        id: `msg-${Date.now() + 1}`,
        role: "assistant",
        content: "Sorry, I encountered an error while processing your request. Please try again.",
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] -m-4 lg:-m-6">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 px-6 py-4 shrink-0 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-brand-600" />
            <h1 className="text-xl font-bold text-neutral-900">Ask LOOP</h1>
          </div>
          <p className="text-sm text-neutral-500 mt-1">
            Ask questions about what your customers are saying.
          </p>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={() => { setMessages([]); setConversationId(undefined); }}>
            New Chat
          </Button>
        )}
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 bg-neutral-50">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
              <div className="w-16 h-16 bg-brand-100 rounded-2xl flex items-center justify-center mb-6">
                <Sparkles className="h-8 w-8 text-brand-600" />
              </div>
              <h2 className="text-xl font-bold text-neutral-900 mb-2">How can I help you analyze feedback?</h2>
              <p className="text-neutral-500 max-w-md mx-auto mb-8">
                I can summarize themes, identify trends, and answer specific questions grounded in your customer data.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                {SUGGESTIONS.map((sug) => (
                  <button
                    key={sug}
                    onClick={() => handleSubmit(undefined, sug)}
                    className="p-3 bg-white border border-neutral-200 rounded-xl text-sm font-medium text-neutral-700 hover:border-brand-300 hover:bg-brand-50 transition-all text-left"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex gap-4 animate-fade-in",
                    msg.role === "user" ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  <div className="shrink-0 pt-1">
                    {msg.role === "user" ? (
                      <div className="w-8 h-8 bg-brand-600 rounded-full flex items-center justify-center">
                        <UserIcon className="h-4 w-4 text-white" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 bg-neutral-800 rounded-full flex items-center justify-center">
                        <Bot className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>
                  <div className={cn("flex flex-col max-w-[85%]", msg.role === "user" ? "items-end" : "items-start")}>
                    <div
                      className={cn(
                        "px-4 py-3 rounded-2xl shadow-sm text-sm whitespace-pre-wrap leading-relaxed",
                        msg.role === "user"
                          ? "bg-brand-600 text-white rounded-tr-none"
                          : "bg-white border border-neutral-200 text-neutral-800 rounded-tl-none"
                      )}
                    >
                      {msg.content}
                    </div>

                    {/* Sources / Grounding info for assistant messages */}
                    {msg.role === "assistant" && msg.groundedIn !== undefined && (
                      <div className="mt-2 space-y-2 w-full">
                        <div className="flex items-center gap-1.5 text-[11px] font-medium text-success-600 bg-success-50 px-2 py-1 rounded-md self-start border border-success-100">
                          <BookOpen className="h-3 w-3" /> Grounded in {msg.groundedIn} feedback items
                        </div>
                        {msg.sources && msg.sources.length > 0 && (
                          <div className="flex gap-2 flex-wrap">
                            {msg.sources.map((src, i) => (
                              <button
                                key={src.id}
                                onClick={() => setSelectedSource(src)}
                                className="text-[11px] bg-white border border-neutral-200 px-2 py-1 rounded shadow-sm hover:bg-neutral-50 hover:border-brand-300 text-neutral-600 flex items-center gap-1 transition-all"
                              >
                                Source {i + 1}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-neutral-800 rounded-full flex items-center justify-center shrink-0">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div className="bg-white border border-neutral-200 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-neutral-200 p-4 shrink-0">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto relative flex items-end gap-3">
          <div className="flex-1 relative">
            <Textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question about your feedback..."
              className="pr-12 min-h-[60px] max-h-32 resize-y shadow-sm"
              disabled={loading}
              rows={2}
            />
          </div>
          <Button
            type="submit"
            disabled={!query.trim() || loading}
            size="lg"
            className="h-[60px] px-6"
          >
            <Send className="h-5 w-5" />
          </Button>
        </form>
        <p className="text-center text-[10px] text-neutral-400 mt-3">
          AI can make mistakes. Always verify important insights against raw feedback.
        </p>
      </div>

      {/* Source Viewer Drawer */}
      <Drawer
        isOpen={!!selectedSource}
        onClose={() => setSelectedSource(null)}
        title="Source Feedback"
        size="md"
      >
        {selectedSource && <FeedbackDetail feedback={selectedSource} />}
      </Drawer>
    </div>
  );
}
