import { CheckCircle2, Clock, XCircle } from "lucide-react";

export default function StatusBadge({ status }) {
  if (status === "approved") return <span className="badge badge-green"><CheckCircle2 size={12} /> Approved</span>;
  if (status === "rejected") return <span className="badge badge-red"><XCircle size={12} /> Rejected</span>;
  return <span className="badge badge-amber"><Clock size={12} /> Pending</span>;
}
