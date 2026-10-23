
import { useEffect, useRef, useState } from "react";
import {
  Bot,
  Send,
  Sparkles,
  ShieldCheck,
  UserRound,
  AlertCircle,
  RotateCcw,
} from "lucide-react";
import { streamCopilotMessage } from "../lib/companyApi";
import "./Copilot.css";

const suggestions = [
  {
    title: "Analyze my liquidity risk",
    description: "Find the biggest risks in my forecast.",
    prompt:
      "Analyze my biggest liquidity risks over the next 30 days. Retrieve the relevant data and explain what I should review.",
  },
  {
    title: "Explain my cash flow",
    description: "Understand expected inflows and outflows.",
    prompt:
      "Retrieve my 30-day cash-flow forecast and explain the important inflows, outflows, and closing balances. Keep currencies separate.",
  },
  {
    title: "Simulate payment delays",
    description: "Understand the effect of late receipts.",
    prompt:
      "Run a cash-flow simulation for delayed receivables. Explain the probabilities and limitations returned by the simulation.",
  },
];

const initialMessage = {
  role: "assistant",
  content:
    "Hi! I'm your FlowPilot AI Copilot. I can investigate your cash-flow forecast, explain financial risks, and explore payment-delay scenarios using your financial tools. What would you like to understand?",
};

export default function Copilot() {
  const [messages, setMessages] = useState([initialMessage]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [conversationId, setConversationId] = useState(null);
  const messagesRef = useRef(null);
  // Follow streamed tokens only while the reader is already at the bottom.
  const followLatest = useRef(true);

  useEffect(() => {
    const list = messagesRef.current;
    if (list && followLatest.current) {
      list.scrollTop = list.scrollHeight;
    }
  }, [messages, loading]);

  function handleMessagesScroll(event) {
    const list = event.currentTarget;
    followLatest.current = list.scrollHeight - list.scrollTop - list.clientHeight < 80;
  }

  async function submitMessage(text) {
    const message = text.trim();

    if (!message || loading) return;

    followLatest.current = true;
    setInput("");
    setError("");
    setLoading(true);

    // Add an empty assistant message that will be filled token by token.
    setMessages((current) => [
      ...current,
      { role: "user", content: message },
      { role: "assistant", content: "" },
    ]);

    try {
      const result = await streamCopilotMessage(
        message,
        conversationId,
        {
          onMeta: (payload) => {
            if (payload.conversation_id) {
              setConversationId(payload.conversation_id);
            }
          },

          onToken: (token) => {
            setMessages((current) => {
              const updated = [...current];
              const lastIndex = updated.length - 1;
              const lastMessage = updated[lastIndex];

              if (lastMessage?.role === "assistant") {
                updated[lastIndex] = {
                  ...lastMessage,
                  content: lastMessage.content + token,
                };
              }

              return updated;
            });
          },
        }
      );

      if (result.conversation_id) {
        setConversationId(result.conversation_id);
      }

      // The backend's final answer is authoritative. Using it also
      // protects against any missing or incomplete streamed tokens.
      if (typeof result.answer === "string" && result.answer.trim()) {
        setMessages((current) => {
          const updated = [...current];
          const lastIndex = updated.length - 1;

          if (updated[lastIndex]?.role === "assistant") {
            updated[lastIndex] = {
              ...updated[lastIndex],
              content: result.answer,
            };
          }

          return updated;
        });
      } else {
        throw new Error("The Copilot returned an empty response.");
      }
    } catch (err) {
      setError(err.message || "Could not contact the AI Copilot.");

      // Remove the empty/partial assistant response after an error.
      setMessages((current) => {
        const updated = [...current];

        if (updated.at(-1)?.role === "assistant") {
          updated.pop();
        }

        return updated;
      });
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    submitMessage(input);
  }

  function resetChat() {
    if (loading) return;

    setMessages([initialMessage]);
    setInput("");
    setError("");
    setConversationId(null);
  }

  return (
    <section className="copilot-page">
      <header className="copilot-heading">
        <div>
          <div className="copilot-eyebrow">
            <Sparkles size={15} /> FINANCIAL INTELLIGENCE
          </div>
          <h1>AI Copilot</h1>
          <p>
            Investigate financial risks and understand your forecasts
            using FlowPilot's financial tools.
          </p>
        </div>

        <button
          className="copilot-reset"
          type="button"
          onClick={resetChat}
          disabled={loading}
        >
          <RotateCcw size={16} />
          New conversation
        </button>
      </header>

      <div className="copilot-safety">
        <ShieldCheck size={18} />
        <div>
          <strong>Read-only financial assistant</strong>
          <span>
            The Copilot can retrieve and explain financial data. It
            cannot execute payments or change your financial records.
          </span>
        </div>
      </div>

      <div className="copilot-chat">
        <div
          className="copilot-messages"
          aria-live="polite"
          ref={messagesRef}
          onScroll={handleMessagesScroll}
        >
          {messages.map((message, index) => (
            <article
              className={`copilot-message copilot-message-${message.role}`}
              key={`${index}-${message.role}`}
            >
              <div className="copilot-avatar">
                {message.role === "assistant" ? (
                  <Bot size={19} />
                ) : (
                  <UserRound size={19} />
                )}
              </div>

              <div className="copilot-bubble">
                <div className="copilot-message-label">
                  {message.role === "assistant" ? "FLOWPILOT AI" : "YOU"}
                </div>

                <div className="copilot-message-content">
                  {message.content}
                  {loading &&
                    message.role === "assistant" &&
                    index === messages.length - 1 &&
                    !message.content && (
                      <span className="copilot-pending">Investigating your financial data…</span>
                    )}
                </div>
              </div>
            </article>
          ))}

          {/* Shown once tokens are arriving; the empty bubble covers the wait before that. */}
          {loading && messages.at(-1)?.content && (
            <div className="copilot-thinking">
              <Sparkles size={17} />
              Still writing…
            </div>
          )}
        </div>

        {messages.length === 1 && (
          <div className="copilot-suggestions">
            <h3>What would you like to explore?</h3>

            {suggestions.map((suggestion) => (
              <button
                key={suggestion.title}
                className="copilot-suggestion"
                type="button"
                disabled={loading}
                onClick={() => submitMessage(suggestion.prompt)}
              >
                <span>
                  <strong>{suggestion.title}</strong>
                  <small>{suggestion.description}</small>
                </span>
                <span className="copilot-suggestion-arrow">↗</span>
              </button>
            ))}
          </div>
        )}

        {error && (
          <div className="copilot-error" role="alert">
            <AlertCircle size={17} />
            <span>{error}</span>
          </div>
        )}

        <form className="copilot-composer" onSubmit={handleSubmit}>
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask about your cash flow, liquidity risk, or payment delays..."
            aria-label="Message the AI Copilot"
            rows={2}
            maxLength={2000}
            disabled={loading}
            onKeyDown={(event) => {
              if (
                event.key === "Enter" &&
                !event.shiftKey &&
                !event.nativeEvent.isComposing
              ) {
                event.preventDefault();
                handleSubmit(event);
              }
            }}
          />

          <div className="copilot-composer-footer">
            <span>Enter to send · Shift + Enter for a new line</span>
            <button
              type="submit"
              disabled={loading || !input.trim()}
              aria-label="Send message"
            >
              <Send size={17} />
              Send
            </button>
          </div>
        </form>
      </div>

      <p className="copilot-disclaimer">
        AI-generated explanations may be inaccurate. Verify important
        financial decisions against the underlying data and business
        obligations.
      </p>
    </section>
  );
}
