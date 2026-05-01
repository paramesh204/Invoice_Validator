import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { UploadCloud, FileText, Trash2, Loader2 } from "lucide-react";
import api from "../utils/api";
import StatusBadge from "../components/StatusBadge.jsx";

export default function UploadDocuments() {
  const { id } = useParams();
  const nav = useNavigate();
  const [decls, setDecls] = useState([]);
  const [selectedId, setSelectedId] = useState(id || "");
  const [files, setFiles] = useState([]);
  const [results, setResults] = useState([]);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef();

  useEffect(() => {
    api.get("/declarations").then((r) => setDecls(r.data));
  }, []);
  useEffect(() => { if (id) setSelectedId(id); }, [id]);

  const onDrop = (e) => {
    e.preventDefault(); setDrag(false);
    addFiles(Array.from(e.dataTransfer.files || []));
  };
  const addFiles = (list) => {
    const pdfs = list.filter((f) => f.type === "application/pdf" || f.name.endsWith(".pdf"));
    setFiles((prev) => [...prev, ...pdfs]);
  };

  const upload = async () => {
    if (!selectedId) return alert("Pick a declaration first");
    if (!files.length) return;
    setBusy(true); setResults([]);
    const fd = new FormData();
    files.forEach((f) => fd.append("files", f));
    try {
      const { data } = await api.post(`/declarations/${selectedId}/upload`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResults(data.results);
      setFiles([]);
    } catch (e) {
      alert(e.response?.data?.error || "Upload failed");
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
          <UploadCloud className="text-accent" /> Upload Scanned PDFs
        </h1>
        <p className="text-gray-500">Step 2 — attach one or more invoice PDFs. We'll OCR & auto-match.</p>
      </div>

      <div className="card p-4 sm:p-5">
        <label className="label">Declaration</label>
        <select className="input" value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
          <option value="">— Select a declaration —</option>
          {decls.map((d) => (
            <option key={d.id} value={d.id}>{d.declaration_number} {d.vendor ? `· ${d.vendor}` : ""}</option>
          ))}
        </select>
        <div className="text-xs mt-1 text-gray-500">
          Don't see one? <Link to="/create" className="text-amber-deep font-medium">Create a declaration</Link>.
        </div>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`card p-8 text-center cursor-pointer border-2 border-dashed transition ${drag ? "border-accent bg-amber-50" : "border-gray-300 hover:bg-gray-50"}`}
      >
        <UploadCloud size={42} className="mx-auto text-accent mb-2" />
        <div className="font-semibold">Drag & drop PDFs here</div>
        <div className="text-sm text-gray-500">or click to browse · max 25MB each</div>
        <input ref={inputRef} type="file" accept="application/pdf" multiple hidden
          onChange={(e) => addFiles(Array.from(e.target.files || []))} />
      </div>

      {files.length > 0 && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Queued files ({files.length})</h3>
            <button onClick={upload} disabled={busy || !selectedId} className="btn-amber inline-flex items-center gap-2">
              {busy ? <><Loader2 size={16} className="animate-spin" /> Processing OCR...</> : "Upload & Validate"}
            </button>
          </div>
          <ul className="divide-y">
            {files.map((f, i) => (
              <li key={i} className="flex items-center justify-between py-2 text-sm">
                <span className="flex items-center gap-2 truncate"><FileText size={16} className="text-gray-500" /> {f.name}</span>
                <button onClick={() => setFiles(files.filter((_, j) => j !== i))} className="text-rose-600 hover:bg-rose-50 p-1 rounded"><Trash2 size={14} /></button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {results.length > 0 && (
        <div className="card p-4">
          <h3 className="font-semibold mb-3">Validation results</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-gray-500">
                <tr>
                  <th className="py-2">File</th>
                  <th>Extracted #</th>
                  <th>Vendor</th>
                  <th>Amount</th>
                  <th>Match</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="py-2 max-w-[180px] truncate">{r.original_name}</td>
                    <td>{r.extracted_number || "—"}</td>
                    <td className="max-w-[160px] truncate">{r.extracted_vendor || "—"}</td>
                    <td>{r.extracted_amount ? `₹${r.extracted_amount.toLocaleString("en-IN")}` : "—"}</td>
                    <td><span className="font-semibold">{r.match_score}%</span></td>
                    <td><StatusBadge status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 text-right">
            <button onClick={() => nav("/audit")} className="btn-amber">Review in Audit →</button>
          </div>
        </div>
      )}
    </div>
  );
}
