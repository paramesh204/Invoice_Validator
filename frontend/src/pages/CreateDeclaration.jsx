import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FilePlus2, ArrowRight } from "lucide-react";
import api from "../utils/api";

// auto format dd/mm/yyyy
const formatDate = (v) => {
  const s = v.replace(/\D/g, "").slice(0, 8);
  if (s.length <= 2) return s;
  if (s.length <= 4) return `${s.slice(0,2)}/${s.slice(2)}`;
  return `${s.slice(0,2)}/${s.slice(2,4)}/${s.slice(4)}`;
};

export default function CreateDeclaration() {
  const nav = useNavigate();
  const [form, setForm] = useState({ declaration_number: "", vendor: "", amount: "", invoice_date: "", notes: "" });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setErr(""); setLoading(true);
    try {
      const { data } = await api.post("/declarations", {
        ...form,
        amount: form.amount ? parseFloat(form.amount) : null,
      });
      nav(`/upload/${data.id}`);
    } catch (e) {
      setErr(e.response?.data?.error || "Failed to create");
    } finally { setLoading(false); }
  };

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 card p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-1">
          <FilePlus2 className="text-accent" />
          <h1 className="text-2xl font-bold">Create Declaration</h1>
        </div>
        <p className="text-gray-500 text-sm mb-5">Step 1 — record the declaration before uploading scanned PDFs.</p>

        {err && <div className="mb-4 text-sm bg-rose-50 text-rose-700 border border-rose-200 px-3 py-2 rounded">{err}</div>}

        <form onSubmit={submit} className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="label">Declaration / Invoice Number *</label>
            <input className="input" required placeholder="e.g. IN-7284519630842"
              value={form.declaration_number}
              onChange={(e) => setForm({ ...form, declaration_number: e.target.value })} />
          </div>
          <div>
            <label className="label">Vendor</label>
            <input className="input" placeholder="Appario Retail Private Ltd"
              value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} />
          </div>
          <div>
            <label className="label">Amount (₹)</label>
            <input className="input" type="number" step="0.01" placeholder="103717.12"
              value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          </div>
          <div>
            <label className="label">Invoice Date (dd/mm/yyyy)</label>
            <input className="input" placeholder="07/01/2026" value={form.invoice_date}
              onChange={(e) => setForm({ ...form, invoice_date: formatDate(e.target.value) })} />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Notes</label>
            <textarea className="input min-h-[90px]" value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="sm:col-span-2 flex justify-end">
            <button disabled={loading} className="btn-amber inline-flex items-center gap-2">
              {loading ? "Creating..." : "Continue to Upload"} <ArrowRight size={16} />
            </button>
          </div>
        </form>
      </div>

      <aside className="card p-5">
        <h3 className="font-semibold mb-2">Live preview</h3>
        <div className="text-sm space-y-2">
          <Row k="Declaration #" v={form.declaration_number || "—"} />
          <Row k="Vendor" v={form.vendor || "—"} />
          <Row k="Amount" v={form.amount ? `₹${Number(form.amount).toLocaleString("en-IN")}` : "—"} />
          <Row k="Date" v={form.invoice_date || "—"} />
        </div>
        <div className="mt-4 p-3 rounded bg-amber-50 border border-amber-200 text-xs text-amber-800">
          Declaration is matched against extracted invoice data — ≥70% match → APPROVED, otherwise PENDING for audit.
        </div>
      </aside>
    </div>
  );
}

const Row = ({ k, v }) => (
  <div className="flex justify-between gap-3 border-b border-dashed last:border-0 py-1">
    <span className="text-gray-500">{k}</span>
    <span className="font-medium text-right break-all">{v}</span>
  </div>
);
