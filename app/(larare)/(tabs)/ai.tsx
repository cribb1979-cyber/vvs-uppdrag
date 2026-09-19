import { UnderDevelopment } from "@/components/UnderDevelopment";

export default function Ai() {
  return (
    <UnderDevelopment
      title="AI-assistent"
      note="Kräver en Anthropic API-nyckel kopplad till en Supabase Edge Function (så att nyckeln aldrig hamnar i appen). Inte konfigurerat ännu — inga svar simuleras här."
    />
  );
}
