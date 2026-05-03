import { Routes, Route, Navigate } from "react-router";
import { TRPCProvider } from "./providers/trpc";
import { useAuth } from "./hooks/use-auth";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <AuthGuard>
            <Dashboard />
          </AuthGuard>
        }
      />
      <Route
        path="/admin"
        element={
          <AuthGuard>
            <Admin />
          </AuthGuard>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <TRPCProvider>
      <AppRoutes />
    </TRPCProvider>
  );
}
