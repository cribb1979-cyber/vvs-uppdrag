import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabase";
import type { AiMode, RevealMode } from "./database.types";

export interface StudentSessionData {
  participant_id: string;
  session_expires_at: string;
  assignment: {
    id: string;
    title: string;
    description: string;
    reveal_mode: RevealMode;
    ai_mode: AiMode;
    steps: { key: string; label: string; open: boolean }[];
  };
  plan_locked: boolean;
  plan_submitted_at: string | null;
}

export class TeacherSignedInError extends Error {}

async function ensureAnonymousAuth() {
  const { data } = await supabase.auth.getSession();
  if (data.session && !data.session.user.is_anonymous) {
    throw new TeacherSignedInError("Du är inloggad som lärare på den här enheten. Logga ut för att gå med som elev.");
  }
  if (!data.session) {
    const { error } = await supabase.auth.signInAnonymously();
    if (error) throw error;
  }
}

export async function joinSession(code: string): Promise<StudentSessionData> {
  await ensureAnonymousAuth();
  const { data, error } = await supabase.rpc("join_session", { session_code: code.trim().toUpperCase() });
  if (error) throw error;
  return data as unknown as StudentSessionData;
}

export function useStudentSession(code: string | undefined) {
  const [data, setData] = useState<StudentSessionData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!code) return;
    setLoading(true);
    setError(null);
    try {
      const result = await joinSession(code);
      setData(result);
    } catch (e) {
      setData(null);
      setError(e instanceof Error ? e.message : "Kunde inte ansluta till uppdraget.");
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, error, loading, refresh };
}
