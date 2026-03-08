import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Send, Loader2, Bot, User, Lightbulb } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { smartSearch } from "@/services/ai";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const QUICK_PROMPTS = [
  "Best practices for organic farming",
  "How to improve soil health naturally",
  "When should I plant tomatoes?",
  "How to reduce post-harvest losses",
];

const PersonalAssistantTool = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg) return;

    const userMsg: Message = { role: "user", content: msg };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const result = await smartSearch(
        `You are DuraHub's personal AI farming assistant. Answer helpfully and concisely. User question: "${msg}"`
      );
      setMessages((prev) => [...prev, { role: "assistant", content: result }]);
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to get response.", variant: "destructive" });
      setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I couldn't process that. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-lg border-0 max-w-3xl mx-auto">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2">
          <Sparkles className="h-5 w-5 text-violet-600" />
          <span>Personal AI Assistant</span>
          <Badge variant="outline" className="ml-auto text-xs">Powered by Gemini</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {/* Chat area */}
        <div ref={scrollRef} className="h-[400px] overflow-y-auto px-6 py-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-12 space-y-4">
              <Bot className="h-16 w-16 mx-auto text-violet-300" />
              <div>
                <h3 className="font-semibold text-lg">Hi! I'm your farming assistant 🌾</h3>
                <p className="text-sm text-muted-foreground mt-1">Ask me anything about agriculture, crops, weather, or market trends.</p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center mt-4">
                {QUICK_PROMPTS.map((prompt) => (
                  <Button
                    key={prompt}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => sendMessage(prompt)}
                  >
                    <Lightbulb className="h-3 w-3 mr-1" />
                    {prompt}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot className="h-4 w-4 text-violet-600" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-violet-600 text-white rounded-br-sm"
                    : "bg-muted rounded-bl-sm"
                }`}
              >
                {msg.content}
              </div>
              {msg.role === "user" && (
                <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center flex-shrink-0 mt-1">
                  <User className="h-4 w-4 text-white" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                <Bot className="h-4 w-4 text-violet-600" />
              </div>
              <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3">
                <Loader2 className="h-4 w-4 animate-spin text-violet-600" />
              </div>
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="border-t p-4 flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder="Ask me anything about farming..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button onClick={() => sendMessage()} disabled={isLoading || !input.trim()} className="bg-violet-600 hover:bg-violet-700">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PersonalAssistantTool;
