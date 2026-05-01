import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ScanSearch } from "lucide-react";
import api from "../utils/api";
import { setAuth } from "../utils/auth";

export default function Register() {
  const nav = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr(""); setLoading(true);
    try {
      const { data } = await api.post("/auth/register", form);
      setAuth(data.token, data.user);
      nav("/dashboard");
    } catch (e) {
      setErr(e.response?.data?.error || "Registration failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy via-navy-light to-navy flex items-center justify-center p-4">
      <div className="w-full max-w-md card p-6 sm:p-8">
        <div className="flex items-center gap-2 text-navy text-2xl font-bold mb-1">
          <ScanSearch className="text-accent" /> Create account
        </div>

        <p className="text-gray-500 text-sm mb-6">Start validating invoices in seconds</p>

        {err && <div className="mb-4 text-sm bg-rose-50 text-rose-700 border border-rose-200 px-3 py-2 rounded">{err}</div>}

        <form onSubmit={submit} className="space-y-4">

          <div>
            <label className="label">Full name</label>
            <input className="input" required value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>

          <div>
            <label className="label">Email</label>
            <input className="input" type="email" required value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>

          <div>
            <label className="label">Password (6+ chars)</label>
            <input className="input" type="password" minLength={6} required value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>

          <button disabled={loading} className="btn-amber w-full">
            {loading ? "Creating..." : "Create account"}
          </button>
        </form>

        <div className="text-sm text-center mt-6 text-gray-600">
          Already a user? <Link to="/login" className="text-amber-deep font-semibold hover:underline">Sign in</Link>
        </div>
      </div>
    </div>
  );
}