import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FileCheck2, FileWarning, FileText, Files, ArrowRight } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import api from "../utils/api";
import StatusBadge from "../components/StatusBadge.jsx";

const Stat = ({ icon: Icon, label, value, tone }) => (
  <div className="card p-4 flex items-center gap-3">
    <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${tone}`}>
      <Icon size={22} />
    </div>
    <div>
      <div className="text-xs text-gray-500 uppercase tracking-wide">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  </div>
);

export default function Dashboard() {
  const [stats, setStats] = useState({ declarations: 0, documents: 0, approved: 0, pending: 0 });
  const [decls, setDecls] = useState([]);

  // ✅ central loader (important for refresh)
  const loadData = () => {
    api.get("/stats").then((r) => setStats(r.data)).catch(() => {});
    api.get("/declarations").then((r) => setDecls(r.data)).catch(() => {});
  };

  useEffect(() => {
    loadData();
  }, []);

  // ✅ DELETE
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this declaration?")) return;

    try {
      await api.delete(`/declarations/${id}`);
      loadData(); // refresh dashboard
    } catch (err) {
      console.error(err);
    }
  };

  // ✅ OPTIONAL UPDATE (simple prompt)
  const handleEdit = async (d) => {
    const vendor = prompt("Update vendor", d.vendor);
    if (!vendor) return;

    try {
      await api.put(`/declarations/${d.id}`, {
        ...d,
        vendor,
      });
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  // simple trend from declarations
  const trend = decls.slice(0, 14).reverse().map((d, i) => ({
    name: `#${i + 1}`,
    count: 1 + (d.status === "approved" ? 2 : 1),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-500">Real-time overview of your invoice validations</p>
        </div>
        <Link to="/create" className="btn-amber inline-flex items-center gap-2 self-start">
          New Declaration <ArrowRight size={16} />
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Stat icon={Files} label="Declarations" value={stats.declarations} tone="bg-blue-100 text-blue-700" />
        <Stat icon={FileText} label="Documents" value={stats.documents} tone="bg-violet-100 text-violet-700" />
        <Stat icon={FileCheck2} label="Approved" value={stats.approved} tone="bg-emerald-100 text-emerald-700" />
        <Stat icon={FileWarning} label="Pending" value={stats.pending} tone="bg-amber-100 text-amber-700" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="card p-4 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Validation Trend</h3>
            <span className="text-xs text-gray-500">Last submissions</span>
          </div>
          <div className="h-56">
            <ResponsiveContainer>
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="g1" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#ff9900" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="#ff9900" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="#ff9900" fill="url(#g1)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-4">
          <h3 className="font-semibold mb-3">Recent Declarations</h3>
          <div className="space-y-2 max-h-56 overflow-auto">
            {decls.length === 0 && <p className="text-sm text-gray-500">No declarations yet.</p>}

            {decls.slice(0, 8).map((d) => (
              <div key={d.id}
                className="flex items-center justify-between p-2 rounded hover:bg-gray-50 border border-gray-100">

                <Link to={`/upload/${d.id}`} className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{d.declaration_number}</div>
                  <div className="text-xs text-gray-500 truncate">{d.vendor || "—"}</div>
                </Link>

                <div className="flex items-center gap-2">
                  <StatusBadge status={d.status} />

                  {/* EDIT */}
                  <button
                    onClick={() => handleEdit(d)}
                    className="text-xs px-2 py-1 border rounded hover:bg-blue-50 text-blue-600">
                    Edit
                  </button>

                  {/* DELETE */}
                  <button
                    onClick={() => handleDelete(d.id)}
                    className="text-xs px-2 py-1 border rounded hover:bg-red-50 text-red-600">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}