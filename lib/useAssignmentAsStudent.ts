import { useCallback, useEffect, useState } from "react";
import { ensureAnonymousAuth, type StudentSessionData } from "./useStudentSession";
import { getErrorMessage } from "./errors";
import { supabase } from "./supabase";

// Motsvarigheten till joinSession/useStudentSession, men för
// klassregister-flödet (läsårslång kod, ingen tidsbegränsad QR-session).
// Kräver att redeem_student_code redan körts för den här enheten.
export async function openAssignmentAsStudent(assignmentId: string): Promise<StudentSessionData> {
  await ensureAnonymousAuth();
  const { data, error } = await supabase.rpc("open_assignment_as_student", { p_assignment_id: assignmentId });
  if (error) throw error;
  return data as unknown as StudentSessionData;
}

export function useAssignmentAsStudent(assignmentId: string | undefined) {
  const [data, setData] = useState<StudentSessionData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!assignmentId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await openAssignmentAsStudent(assignmentId);
      setData(result);
    } catch (e) {
      console.error("Kunde inte öppna uppdraget:", e);
      setData(null);
      setError(getErrorMessage(e, "Kunde inte öppna uppdraget."));
    } finally {
      setLoading(false);
    }
  }, [assignmentId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, error, loading, refresh };
}
