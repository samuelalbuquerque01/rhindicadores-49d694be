import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { Loader2, ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "./AuthProvider";

function FullScreen({ children }: { children: ReactNode }) {
  return <main className="flex min-h-screen items-center justify-center bg-background px-4">{children}</main>;
}

export function AuthLoading() {
  return (
    <FullScreen>
      <div className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
        <Loader2 className="h-4 w-4 animate-spin" /> Verificando acesso...
      </div>
    </FullScreen>
  );
}

export function AccessDenied({ error = false }: { error?: boolean }) {
  const { session, signOut } = useAuth();
  return (
    <FullScreen>
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 text-center shadow-[var(--shadow-card)]">
        <ShieldX className="mx-auto h-10 w-10 text-destructive" aria-hidden="true" />
        <h1 className="mt-4 text-xl font-semibold text-foreground">
          {error ? "Não foi possível verificar seu acesso" : "Acesso negado"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {error
            ? "Tente novamente em instantes. Se o problema continuar, contate o administrador."
            : "Sua conta não tem permissão para acessar o RH Insights. Solicite acesso ao administrador do RH."}
        </p>
        {session?.user.email && <p className="mt-3 text-xs text-muted-foreground">Conectado como {session.user.email}</p>}
        <div className="mt-6 flex justify-center gap-2">
          {error && <Button variant="outline" onClick={() => window.location.reload()}>Tentar novamente</Button>}
          <Button onClick={signOut}>Sair</Button>
        </div>
      </div>
    </FullScreen>
  );
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, loading, authorization } = useAuth();
  const location = useLocation();

  if (loading) return <AuthLoading />;
  if (!session) {
    const next = `${location.pathname}${location.search}`;
    return <Navigate to={`/login?next=${encodeURIComponent(next)}`} replace />;
  }
  if (authorization === "checking") return <AuthLoading />;
  if (authorization === "error") return <AccessDenied error />;
  if (authorization !== "authorized") return <AccessDenied />;
  return <>{children}</>;
}
