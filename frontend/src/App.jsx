import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import CreateDeclaration from "./pages/CreateDeclaration.jsx";
import UploadDocuments from "./pages/UploadDocuments.jsx";
import AuditPage from "./pages/AuditPage.jsx";
import AppShell from "./components/AppShell.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

const Wrap = ({ children }) => (
  <ProtectedRoute><AppShell>{children}</AppShell></ProtectedRoute>
);

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<Wrap><Dashboard /></Wrap>} />
      <Route path="/create" element={<Wrap><CreateDeclaration /></Wrap>} />
      <Route path="/upload" element={<Wrap><UploadDocuments /></Wrap>} />
      <Route path="/upload/:id" element={<Wrap><UploadDocuments /></Wrap>} />
      <Route path="/audit" element={<Wrap><AuditPage /></Wrap>} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
