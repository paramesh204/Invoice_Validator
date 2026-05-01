import { useEffect, useState } from "react";
import { Search, ShieldCheck, CheckCircle2, XCircle } from "lucide-react";
import api from "../utils/api";
import StatusBadge from "../components/StatusBadge.jsx";

export default function AuditPage() {
  const [docs, setDocs] = useState([]);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [sel, setSel] = useState(null);

  const load = () => api.get("/documents").then((r) => setDocs(r.data));
  useEffect(() => { load(); }, []);

  const filtered = docs.filter((d) => {
    if (filter !== "all" && d.status !== filter) return false;
    if (!q) return true;
    const s = q.toLowerCase();
    return (
      d.original_name?.toLowerCase().includes(s) ||
      d.declaration_number?.toLowerCase().includes(s) ||
      d.extracted_number?.toLowerCase().includes(s) ||
      d.extracted_vendor?.toLowerCase().includes(s)
    );
  });

  const setStatus = async (id, status) => {
    await api.patch(`/documents/${id}`, { status });
    load();
    if (sel?.id === id) setSel({ ...sel, status });
  };

  // ✅ DELETE FUNCTION (NEW)
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this document?")) return;

    try {
      await api.delete(`/documents/${id}`);
      load();

      if (sel?.id === id) setSel(null);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <ShieldCheck className="text-accent" /> Audit
          </h1>
          <p className="text-gray-500">Step 3 — manually review pending documents and confirm matches.</p>
        </div>
        <div className="flex gap-2 self-start">
          {["all", "pending", "approved", "rejected"].map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded text-sm capitalize border ${filter === f ? "bg-navy text-white border-navy" : "bg-white border-gray-300"}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="card p-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-3 text-gray-400" />
          <input className="input pl-9" placeholder="Search by file, declaration, vendor..."
            value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="card p-3 lg:col-span-1 max-h-[70vh] overflow-auto">
          {filtered.length === 0 && <p className="text-sm text-gray-500 p-3">No documents.</p>}
          <ul className="divide-y">
            {filtered.map((d) => (
              <li key={d.id}>
                <button onClick={() => setSel(d)}
                  className={`w-full text-left p-3 hover:bg-gray-50 ${sel?.id === d.id ? "bg-amber-50" : ""}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold truncate">{d.original_name}</div>
                      <div className="text-xs text-gray-500 truncate">Decl: {d.declaration_number}</div>
                    </div>
                    <StatusBadge status={d.status} />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Match: {d.match_score}%</div>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="card p-4 lg:col-span-2">
          {!sel && <p className="text-gray-500 text-sm">Select a document to inspect.</p>}
          {sel && (
            <>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <h3 className="font-semibold truncate">{sel.original_name}</h3>
                  <div className="text-xs text-gray-500">Document #{sel.id}</div>
                </div>
                <StatusBadge status={sel.status} />
              </div>

              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <Field k="Declaration #" v={sel.declaration_number} />
                <Field k="Extracted #" v={sel.extracted_number || "—"}
                  match={sel.declaration_number && sel.extracted_number?.toLowerCase().includes(sel.declaration_number.toLowerCase().replace(/\W/g,"").slice(0,6))} />
                <Field k="Vendor" v={sel.extracted_vendor || "—"} />
                <Field k="Amount" v={sel.extracted_amount ? `₹${sel.extracted_amount.toLocaleString("en-IN")}` : "—"} />
                <Field k="Date" v={sel.extracted_date || "—"} />
                <Field k="Match score" v={`${sel.match_score}%`} />
              </div>

              <div className="mt-4">
                <h4 className="text-sm font-semibold mb-1">OCR text (preview)</h4>
                <pre className="text-xs bg-gray-50 border border-gray-200 rounded p-3 max-h-48 overflow-auto whitespace-pre-wrap">
                  {sel.ocr_text || "(no text extracted)"}
                </pre>
              </div>

              {/* ✅ UPDATED ACTION BUTTONS */}
              <div className="mt-4 flex flex-wrap gap-2 justify-end">
                <a href={`/uploads/${sel.filename}`} target="_blank" rel="noreferrer"
                  className="px-3 py-1.5 rounded border border-gray-300 text-sm hover:bg-gray-50">
                  Open PDF
                </a>

                {/* DELETE */}
                <button
                  onClick={() => handleDelete(sel.id)}
                  className="px-3 py-1.5 rounded border border-red-300 text-red-700 hover:bg-red-50 text-sm">
                  Delete
                </button>

                <button onClick={() => setStatus(sel.id, "rejected")}
                  className="px-3 py-1.5 rounded border border-rose-300 text-rose-700 hover:bg-rose-50 text-sm inline-flex items-center gap-1">
                  <XCircle size={14} /> Reject
                </button>

                <button onClick={() => setStatus(sel.id, "approved")}
                  className="btn-amber inline-flex items-center gap-1">
                  <CheckCircle2 size={14} /> Approve
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const Field = ({ k, v, match }) => (
  <div className={`p-2 rounded border ${match ? "border-emerald-300 bg-emerald-50" : "border-gray-200"}`}>
    <div className="text-xs text-gray-500">{k}</div>
    <div className="font-medium break-words">{v}</div>
  </div>
);