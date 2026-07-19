import { useState, useEffect, useRef } from "react";
import {
  X,
  Send,
  BookOpen,
  TrendingUp,
  Brain,
  FileText,
  Target,
  Loader2,
  Minimize2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

interface Message {
  role: "user" | "assistant";
  content: string;
  mode?: string;
}

interface AssistantResponse {
  answer: string;
  whyMatters: string;
  nextAction: string;
  action?: {
    type?: string;
    redirectPath?: string | null;
    meta?: Record<string, any>;
  };
  data?: any;
}

const modes = [
  { id: "explain", label: "Explain", icon: BookOpen, color: "bg-blue-500" },
  {
    id: "next-step",
    label: "Next Step",
    icon: TrendingUp,
    color: "bg-green-500",
  },
  { id: "quiz", label: "Quiz", icon: Brain, color: "bg-purple-500" },
  { id: "summary", label: "Summary", icon: FileText, color: "bg-orange-500" },
  { id: "weakness", label: "Improve", icon: Target, color: "bg-red-500" },
];

export default function AIAssistant() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const token = localStorage.getItem("libraxpert_token");
    if (!token) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Please login first to use the AI Study Assistant. I can only help logged-in users with library resources.",
        },
      ]);
      setInput("");
      return;
    }

    const userMessage: Message = {
      role: "user",
      content: input,
      mode: selectedMode || undefined,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await axios.post<AssistantResponse>(
        `${API_URL}/api/assistant/chat`,
        { message: input, mode: selectedMode },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      const assistantMessage: Message = {
        role: "assistant",
        content: formatResponse(response.data),
        mode: selectedMode || undefined,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      const redirectPath = response.data?.action?.redirectPath;
      if (redirectPath) {
        navigate(redirectPath);
      }
      setSelectedMode(null);
    } catch (error: any) {
      console.error("Assistant error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            error.response?.status === 401
              ? "Session expired. Please login again."
              : error.response?.data?.error ||
                "Something went wrong. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const formatResponse = (data: AssistantResponse) => {
    let formatted = `${data.answer}\n\n`;
    if (data.whyMatters)
      formatted += `💡 **Why this matters:** ${data.whyMatters}\n\n`;
    if (data.nextAction) formatted += `🎯 **Next action:** ${data.nextAction}`;
    return formatted;
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full transition-all duration-300 shadow-lg z-50 hover:scale-110 bg-gradient-to-r from-green-300 to-purple-600"
        size="icon"
      >
        <img
          src="/bot.png"
          alt="Assistant Bot"
          className="h-12 w-12 object-contain"
        />
      </Button>
    );
  }

  return (
    <Card
      ref={cardRef}
      className="fixed bottom-6 right-6 w-96 h-[600px] shadow-2xl z-50 flex flex-col border-2 animate-in slide-in-from-bottom-5 duration-300"
    >
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
        <div className="flex items-center gap-2">
          <img
            src="/bot.png"
            alt="Assistant Bot"
            className="h-6 w-6 object-contain"
          />
          <div>
            <h3 className="font-semibold">LibraXpert Assistant</h3>
            <p className="text-xs opacity-90">Your study guide</p>
          </div>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="text-white hover:bg-white/20 h-8 w-8"
          >
            <Minimize2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="text-white hover:bg-white/20 h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground py-8 animate-in fade-in duration-500">
            <img
              src="/bot.png"
              alt="Assistant Bot"
              className="h-12 w-12 mx-auto mb-3 opacity-80 object-contain"
            />
            <p className="text-sm">
              Ask me about books, fines, borrowing, or recommendations!
            </p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`mb-4 animate-in slide-in-from-${msg.role === "user" ? "right" : "left"}-2 duration-300 ${msg.role === "user" ? "text-right" : "text-left"}`}
          >
            <div
              className={`inline-block max-w-[85%] p-3 rounded-lg ${
                msg.role === "user" ? "bg-blue-600 text-white" : "bg-muted"
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-muted-foreground animate-in fade-in duration-300">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Thinking...</span>
            <div className="flex gap-1">
              <span
                className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                style={{ animationDelay: "0ms" }}
              ></span>
              <span
                className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
                style={{ animationDelay: "150ms" }}
              ></span>
              <span
                className="w-2 h-2 bg-pink-500 rounded-full animate-bounce"
                style={{ animationDelay: "300ms" }}
              ></span>
            </div>
          </div>
        )}
      </ScrollArea>

      <div className="p-3 border-t space-y-2">
        <div className="flex gap-1 flex-wrap">
          {modes.map((mode) => {
            const Icon = mode.icon;
            return (
              <Badge
                key={mode.id}
                variant={selectedMode === mode.id ? "default" : "outline"}
                className={`cursor-pointer text-xs transition-all duration-200 hover:scale-105 ${selectedMode === mode.id ? mode.color + " text-white" : ""}`}
                onClick={() =>
                  setSelectedMode(selectedMode === mode.id ? null : mode.id)
                }
              >
                <Icon className="h-3 w-3 mr-1" />
                {mode.label}
              </Badge>
            );
          })}
        </div>
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask about books, fines, borrowing..."
            disabled={loading}
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            size="icon"
            className="transition-all duration-200 hover:scale-105"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
