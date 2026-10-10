import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AuthorizationState = "checking" | "authorized" | "denied" | "error";

interface AuthContextValue {
  session: Session | null;
  loading: boolean;
  authorization: AuthorizationState;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

type RpcFn = (fn: string) => Promise<{ data: unknown; error: { code?: string; message?: string } | null }>;

/**
 * Authorization source: public.is_rh_data_reader() (RH reader list).
 * Until that database function is approved and published, a missing function
 * means "authorization list not configured yet" and authenticated users are allowed.
 */
async function checkRhAuthorization(): Promise<AuthorizationState> {
  const { data, error } = await (supabase.rpc as unknown as RpcFn)("is_rh_data_reader");
  if (error) {
    const missing = error.code === "PGRST202" || error.code === "42883";
    return missing ? "authorized" : "error";
  }
  return data === true ? "authorized" : "denied";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setLoading(false);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const userId = session?.user.id;
  const authQuery = useQuery({
    queryKey: ["rh-authorization", userId],
    queryFn: checkRhAuthorization,
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const authorization: AuthorizationState = !userId
    ? "denied"
    : authQuery.isLoading
      ? "checking"
      : authQuery.isError
        ? "error"
        : authQuery.data ?? "checking";

  const signOut = async () => {
    await supabase.auth.signOut();
    queryClient.clear();
  };

  return (
    <AuthContext.Provider value={{ session, loading, authorization, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
