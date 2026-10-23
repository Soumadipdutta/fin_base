import { useCallback, useEffect, useState } from "react";
import { Brain, Trash2 } from "lucide-react";
import PageHeader from "../components/PageHeader";
import {
  getCopilotMemories,
  deleteCopilotMemory,
} from "../lib/companyApi";
import { getErrorMessage } from "../lib/errors";

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
      setMemories(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(getErrorMessage(err, "Could not load saved memories."));
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
      setError(getErrorMessage(err, "Could not delete this memory."));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <PageHeader
        title="Company Memory"
        description="Review the preferences and business context your Copilot remembers."
        onRefresh={loadMemories}
        loading={loading}
      />

      {error && (
        <div className="panel error-panel" role="alert">
          <strong>Memory could not be updated</strong>
          <p>{error}</p>
        </div>
      )}

      {loading && !memories.length ? (
        <div className="panel empty-state">Loading saved memories…</div>
      ) : memories.length === 0 ? (
        <div className="panel empty-state">
          <div>
            <Brain size={28} className="empty-icon" />
            <strong>No saved memories yet</strong>
            <p>
              Ask the Copilot to remember a preference, for example
              “Remember that payroll always goes out on the 1st.”
            </p>
          </div>
        </div>
      ) : (
        <section className="memory-grid">
          {memories.map((memory) => (
            <article key={memory.id} className="panel memory-card">
              <div className="memory-card-top">
                <span className="status-pill status-blue">
                  {String(memory.category || "memory").replaceAll("_", " ")}
                </span>

                <button
                  className="icon-button icon-button-danger"
                  onClick={() => handleDelete(memory.id)}
                  disabled={deletingId === memory.id}
                  aria-label="Delete memory"
                  title="Delete memory"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <p className="memory-content">{memory.content}</p>
            </article>
          ))}
        </section>
      )}

      {memories.length > 0 && (
        <p className="memory-count">
          {memories.length} saved {memories.length === 1 ? "memory" : "memories"}
        </p>
      )}
    </>
  );
}
