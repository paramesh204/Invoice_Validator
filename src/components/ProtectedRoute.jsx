import { Navigate } from "react-router-dom";
import { isAuthed } from "../utils/auth";
export default function ProtectedRoute({ children }) {
  return isAuthed() ? children : <Navigate to="/login" replace />;
}
