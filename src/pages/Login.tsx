import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

function safeNext(value: string | null): string {
  if (!value) return "/";
  if (!value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

export default function Login() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const next = safeNext(params.get("next"));
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [awaitingConfirm, setAwaitingConfirm] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) navigate(next, { replace: true });
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate(next, { replace: true });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate, next]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}${next}` },
      });
      setBusy(false);
      if (error) return toast.error(error.message);
      if (!data.session) setAwaitingConfirm(true);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) toast.error(error.message);
  }

  async function signInWithGoogle() {
    setBusy(true);
    window.sessionStorage.setItem("rh-insights:post-auth-path", next);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/login?next=${encodeURIComponent(next)}`,
    });
    if (result.error) {
      setBusy(false);
      toast.error(result.error.message ?? "Nao foi possivel entrar com o Google.");
      return;
    }
    if (result.redirected) return;
    navigate(next, { replace: true });
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Entrar no RH Insights</CardTitle>
          <CardDescription>
            {mode === "signin"
              ? "Acesse com seu e-mail corporativo para continuar."
              : "Crie uma conta para acessar os indicadores de RH."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {awaitingConfirm ? (
            <p className="text-sm text-muted-foreground">
              Enviamos um link de confirmacao para <strong>{email}</strong>. Confirme o e-mail para concluir o acesso.
            </p>
          ) : (
            <>
              <form className="space-y-4" onSubmit={submit}>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={busy}>
                  {mode === "signin" ? "Entrar" : "Criar conta"}
                </Button>
              </form>

              <Button variant="outline" className="w-full" onClick={signInWithGoogle} disabled={busy}>
                Continuar com Google
              </Button>

              <button
                type="button"
                className="text-sm text-muted-foreground hover:text-foreground w-full text-center"
                onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              >
                {mode === "signin" ? "Nao tem conta? Cadastre-se" : "Ja tem conta? Entrar"}
              </button>
            </>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
