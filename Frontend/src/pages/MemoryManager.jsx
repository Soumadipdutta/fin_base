
import { useCallback, useEffect, useState } from "react";
import { Brain, RefreshCw, Trash2 } from "lucide-react";
import {
  getCopilotMemories,
  deleteCopilotMemory,
  deleteCopilotConversation
} from "../lib/companyApi";

const colors = {
  panel: "#111c30",
  border: "#24334a",
  text: "#edf3ff",
  muted: "#91a4c2",
  blue: "#6790ff",
  red: "#f07178",
};

export default function MemoryManager() {
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const loadMemories = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getCopilotMemories();
      setMemories(response.data);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Could not load saved memories."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMemories();
  }, [loadMemories]);

  async function handleDelete(memoryId) {
    if (!window.confirm("Delete this saved memory?")) return;

    setDeletingId(memoryId);
    setError("");

    try {
      await deleteCopilotMemory(memoryId);
      setMemories((current) =>
        current.filter((memory) => memory.id !== memoryId)
      );
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Could not delete this memory."
      );
    } finally {
      setDeletingId(null);
    }
  }

  async function handleDeleteConversation(conversationId) {
  if (!window.confirm("Delete this conversation and its messages?")) {
    return;
  }

  try {
    await deleteCopilotConversation(conversationId);

    setConversations((current) =>
      current.filter((conversation) => conversation.id !== conversationId)
    );

    if (conversationId === currentConversationId) {
      setCurrentConversationId(null);
      setMessages([initialMessage]);
    }
  } catch (error) {
    alert(
      error.response?.data?.detail ||
        "Could not delete the conversation."
    );
  }
}

  return (
    <div className="min-h-screen space-y-6 p-6 text-[#edf3ff]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Brain size={27} color={colors.blue} />
            <h1 className="text-2xl font-bold">Company Memory</h1>
          </div>
          <p className="mt-2 text-sm text-[#91a4c2]">
            Review the preferences and business context your Copilot remembers.
          </p>
        </div>

        <button
          onClick={loadMemories}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-[#24334a] px-4 py-2 hover:bg-[#17243a] disabled:opacity-50"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-[#91a4c2]">
          Loading saved memories...
        </p>
      ) : memories.length === 0 ? (
        <div className="rounded-xl border border-[#24334a] bg-[#111c30] p-10 text-center">
          <Brain size={32} className="mx-auto mb-3 text-[#91a4c2]" />
          <h2 className="font-semibold">No saved memories yet</h2>
          <p className="mt-2 text-sm text-[#91a4c2]">
            Ask your Copilot to remember a company preference or business detail.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {memories.map((memory) => (
            <article
              key={memory.id}
              className="rounded-xl border border-[#24334a] bg-[#111c30] p-5"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <span className="rounded-full bg-[#6790ff]/15 px-3 py-1 text-xs font-medium text-[#8eacff]">
                  {memory.category.replaceAll("_", " ")}
                </span>

                <button
                  onClick={() => handleDelete(memory.id)}
                  disabled={deletingId === memory.id}
                  aria-label="Delete memory"
                  title="Delete memory"
                  className="rounded-lg p-2 text-[#f07178] hover:bg-red-500/10 disabled:opacity-50"
                >
                  <Trash2 size={17} />
                </button>
              </div>

              <p className="whitespace-pre-wrap break-words text-sm leading-6">
                {memory.content}
              </p>

              <p className="mt-4 text-xs text-[#91a4c2]">
                Memory ID: {memory.id}
              </p>
            </article>
          ))}
        </div>
      )}

      {!loading && memories.length > 0 && (
        <p className="text-xs text-[#91a4c2]">
          {memories.length} saved {memories.length === 1 ? "memory" : "memories"}
        </p>
      )}
    </div>
  );
}
