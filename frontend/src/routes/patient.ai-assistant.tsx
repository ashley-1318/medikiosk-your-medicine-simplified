import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { 
  Send, 
  Mic, 
  Volume2, 
  Bot, 
  User, 
  Loader2, 
  AlertCircle, 
  Stethoscope, 
  ChevronRight,
  MessageSquareShare,
  MicOff,
  VolumeX
} from "lucide-react";
import { getSession } from "@/lib/session";
import { showNotification } from "@/lib/notifications";

const BACKEND = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:5000";

export const Route = createFileRoute("/patient/ai-assistant")({
  component: AssistantPage,
});

type Message = {
  role: 'user' | 'ai';
  content: string;
  is_serious?: boolean;
  time: string;
};

function AssistantPage() {
  const [session] = useState(() => getSession());
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [autoRead, setAutoRead] = useState(false);
  const [language, setLanguage] = useState<'en' | 'ta'>('en');
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. Fetch History on Mount
  useEffect(() => {
    const fetchHistory = async () => {
      if (!session?.id) return;
      try {
        const res = await fetch(`${BACKEND}/chat/history/${session.id}`);
        const data = await res.json();
        if (data && data.length > 0) {
          setMessages(data);
        } else {
          // Set initial greeting if no history
          const greeting = language === 'en' 
            ? `Hello ${session?.name?.split(' ')[0] || 'there'}. I'm your MEDIKIOSK Health Assistant. How can I help you today?`
            : `வணக்கம் ${session?.name?.split(' ')[0] || 'நண்பரே'}. நான் உங்கள் மெடிகியோஸ்க் (MEDIKIOSK) சுகாதார உதவியாளர். நான் இன்று உங்களுக்கு எப்படி உதவ முடியும்?`;
          setMessages([{ role: 'ai', content: greeting, time: new Date().toISOString() }]);
        }
      } catch (err) {
        console.error("History fetch error:", err);
      } finally {
        setHistoryLoading(false);
      }
    };
    fetchHistory();
  }, [session?.id]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Check for report context from other pages
  useEffect(() => {
    const contextStr = localStorage.getItem('health_report_context');
    if (contextStr) {
      const context = JSON.parse(contextStr);
      localStorage.removeItem('health_report_context'); // Clear it
      
      const content = language === 'en'
        ? `I see you have questions about your ${context.type}. Based on the analysis, your ${context.summary}. How can I help you understand these results better?`
        : `உங்கள் ${context.type} பற்றிய கேள்விகள் இருப்பதாக நான் காண்கிறேன். பகுப்பாய்வின் அடிப்படையில், உங்கள் ${context.summary}. இந்த முடிவுகளை நன்றாகப் புரிந்துகொள்ள நான் உங்களுக்கு எப்படி உதவ முடியும்?`;

      setMessages(prev => [...prev, {
        role: 'ai',
        content,
        time: new Date().toISOString()
      }]);
    }
  }, [language]);

  const speak = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'en' ? 'en-US' : 'ta-IN';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  const handleSend = async (text = input) => {
    if (!text.trim() || loading) return;

    const userMsg: Message = { role: 'user', content: text.trim(), time: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      if (!session?.id) return;
      const res = await fetch(`${BACKEND}/chat/health-message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          patient_id: session.id, 
          message: text.trim(),
          language 
        })
      });
      const data = await res.json();

      const aiMsg: Message = { 
        role: 'ai', 
        content: data.response, 
        is_serious: data.is_serious,
        time: new Date().toISOString() 
      };
      setMessages(prev => [...prev, aiMsg]);
      
      if (autoRead) speak(data.response);
      if (data.is_serious) {
          showNotification("Emergency Detected", "Please consider consulting a doctor immediately.");
      }
    } catch (err) {
      showNotification("Error", "AI Assistant is offline");
    } finally {
      setLoading(false);
    }
  };

  const toggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showNotification("Not Supported", "Voice input is not supported in this browser.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = language === 'en' ? 'en-US' : 'ta-IN';
    recognition.interimResults = false;
    
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setTimeout(() => handleSend(transcript), 1000);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    
    recognition.start();
  };

  const handleEscalate = async () => {
      if (!session?.id) return;
      try {
          await fetch(`${BACKEND}/prescriptions`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                  patient_id: session.id,
                  doctor_id: null, // Assign to general queue
                  status: 'consultation',
                  doctor_notes: 'Urgent AI Assistant Escalation'
              })
          });
          showNotification("Urgent Case Created", "A doctor has been notified of your situation.");
      } catch (err) {
          console.error(err);
      }
  };

  return (
    <div className="flex h-[calc(100vh-160px)] flex-col animate-fade-in">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface flex items-center gap-3">
             <div className="h-8 w-8 rounded-full bg-sidebar-accent flex items-center justify-center text-sidebar-accent-foreground">
                <Bot className="h-4 w-4" />
             </div>
             AI Health Assistant
          </h1>
          <p className="text-xs text-muted-foreground mt-1 ml-11">Powered by your health records</p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Language Selector */}
          <div className="flex bg-card rounded-full p-1 border border-border/40">
            <button 
              onClick={() => setLanguage('en')}
              className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase transition ${language === 'en' ? 'bg-surface text-white shadow-soft' : 'text-muted-foreground hover:text-surface'}`}
            >
              English
            </button>
            <button 
              onClick={() => setLanguage('ta')}
              className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase transition ${language === 'ta' ? 'bg-surface text-white shadow-soft' : 'text-muted-foreground hover:text-surface'}`}
            >
              தமிழ் (Tamil)
            </button>
          </div>

          <button 
            onClick={() => setAutoRead(!autoRead)} 
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-[10px] font-bold uppercase transition ${
              autoRead ? "bg-amber text-amber-foreground shadow-soft" : "bg-card text-muted-foreground border border-border/40"
            }`}
          >
            {autoRead ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
            Voice {autoRead ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto rounded-3xl bg-card/40 p-6 shadow-sm border border-border/40 backdrop-blur-sm">
        <div className="space-y-6">
          {historyLoading ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 py-20">
               <Loader2 className="h-8 w-8 animate-spin text-amber" />
               <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Retrieving history...</p>
            </div>
          ) : (
            <>
              {messages.map((m, i) => (
                <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} animate-fade-up`}>
                  <div className={`flex max-w-[80%] items-start gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                      m.role === 'ai' ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'bg-amber text-amber-foreground'
                    }`}>
                      {m.role === 'ai' ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                    </div>
                    <div className={`rounded-2xl px-5 py-3 shadow-sm ${
                      m.role === 'ai' ? 'bg-card text-surface' : 'bg-surface text-surface-foreground'
                    }`}>
                       <p className="text-sm leading-relaxed">{m.content}</p>
                       {m.role === 'ai' && (
                           <button onClick={() => speak(m.content)} className="mt-2 text-muted-foreground hover:text-amber transition active:scale-95">
                               <Volume2 className="h-3 w-3" />
                           </button>
                       )}
                    </div>
                  </div>
                  
                  {m.is_serious && (
                      <div className="mt-4 w-full animate-pulse-ring rounded-2xl bg-destructive/10 border border-destructive/20 p-6">
                        <div className="flex items-start gap-4">
                            <div className="h-10 w-10 rounded-full bg-destructive/20 flex items-center justify-center text-destructive">
                                <AlertCircle className="h-6 w-6" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-surface text-lg">🚨 This sounds serious</h4>
                                <p className="text-sm text-surface/70 mt-1">Based on our conversation, you should seek medical attention immediately.</p>
                                <button 
                                    onClick={handleEscalate}
                                    className="mt-4 flex items-center gap-2 rounded-full bg-destructive px-6 py-2.5 text-xs font-bold text-white hover:bg-destructive/90 transition shadow-lg"
                                >
                                    <Stethoscope className="h-4 w-4" />
                                    Consult Doctor Now
                                </button>
                            </div>
                        </div>
                      </div>
                  )}
                </div>
              ))}
            </>
          )}
          {loading && (
            <div className="flex items-center gap-2 text-muted-foreground animate-pulse ml-11">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-xs font-medium">Assistant is thinking...</span>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="mt-6 flex items-center gap-3">
        <div className="relative flex-1">
          <input 
            type="text" 
            placeholder="Ask anything about your health..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            className="w-full rounded-2xl border-none bg-card py-4 pl-6 pr-24 text-sm shadow-card focus:ring-2 focus:ring-amber"
          />
          <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-2">
            <button 
                onClick={toggleListening}
                className={`p-2 rounded-xl transition ${isListening ? 'bg-destructive text-white animate-pulse' : 'text-muted-foreground hover:bg-mint hover:text-surface'}`}
            >
                {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </button>
            <button 
                onClick={() => handleSend()}
                disabled={!input.trim() || loading}
                className="rounded-xl bg-sidebar-accent p-2 text-sidebar-accent-foreground hover:opacity-90 disabled:opacity-50"
            >
                <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
      {isListening && <p className="text-center text-[10px] font-bold uppercase tracking-widest text-destructive mt-2">Listening...</p>}
    </div>
  );
}
