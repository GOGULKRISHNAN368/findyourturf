import { useState, useEffect, useCallback } from "react";
import { IconUsers, IconRefresh } from "../components/common/Icons";
import { getVisitors } from "../services/api";

const PAGE_SIZE = 50;

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function VisitorsManagement() {
  const [visitors, setVisitors] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (pageNum, append) => {
    try {
      append ? setLoadingMore(true) : setLoading(true);
      setError("");
      const res = await getVisitors({ page: pageNum, limit: PAGE_SIZE });
      setVisitors((prev) => (append ? [...prev, ...res.visitors] : res.visitors));
      setTotal(res.total);
      setPage(pageNum);
    } catch (err) {
      setError(err.message || "Unable to load visitors.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    load(1, false);
  }, [load]);

  const hasMore = visitors.length < total;

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0 }}>Visitors</h2>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 13 }}>
            Everyone who has completed Quick Registration on the public site. {total} total.
          </p>
        </div>
        <button className="btn btn-outline" onClick={() => load(1, false)} disabled={loading}>
          <IconRefresh size={16} /> Refresh
        </button>
      </div>

      {error && <div className="alert-banner error" style={{ marginBottom: 12 }}>{error}</div>}

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#666" }}>Loading visitors…</div>
        ) : visitors.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#666" }}>
            <IconUsers size={38} style={{ opacity: 0.4 }} />
            <h3>No visitors yet</h3>
            <p>Registrations from the public site will appear here.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e5e7eb" }}>
                  <th style={{ textAlign: "left", padding: "10px 16px", fontWeight: 700, color: "#334155" }}>Name</th>
                  <th style={{ textAlign: "left", padding: "10px 16px", fontWeight: 700, color: "#334155" }}>Phone Number</th>
                  <th style={{ textAlign: "left", padding: "10px 16px", fontWeight: 700, color: "#334155" }}>Registered</th>
                  <th style={{ textAlign: "left", padding: "10px 16px", fontWeight: 700, color: "#334155" }}>Last Visited</th>
                </tr>
              </thead>
              <tbody>
                {visitors.map((v) => (
                  <tr key={v.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "10px 16px", fontWeight: 600 }}>{v.name}</td>
                    <td style={{ padding: "10px 16px", color: "#475569" }}>{v.phone}</td>
                    <td style={{ padding: "10px 16px", color: "#64748b" }}>{formatDate(v.registeredAt)}</td>
                    <td style={{ padding: "10px 16px", color: "#64748b" }}>{formatDate(v.lastVisitedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {hasMore && (
        <div style={{ textAlign: "center", marginTop: 16 }}>
          <button className="btn btn-outline" onClick={() => load(page + 1, true)} disabled={loadingMore}>
            {loadingMore ? "Loading…" : `Load more (${visitors.length} of ${total})`}
          </button>
        </div>
      )}
    </div>
  );
}
