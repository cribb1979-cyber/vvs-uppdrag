// Edge Function: identify-material
//
// Tar emot ett foto (base64) av en rördel och ber Claude identifiera den, så
// att läraren slipper skriva namn och felalternativ för hand i
// quizfråge-editorn. Nyckeln till Anthropic ligger ENDAST som ett Supabase
// Edge Function-secret (`supabase secrets set ANTHROPIC_API_KEY=...`) -- den
// skickas aldrig till klienten/appen, till skillnad från EXPO_PUBLIC_*-variabler.
//
// Skyddad mot missbruk/kostnad: kräver en inloggad, GODKÄND lärare (inte en
// anonym elevsession och inte en lärare som väntar på godkännande).

import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ANTHROPIC_MODEL = "claude-haiku-4-5-20251001";

const SYSTEM_PROMPT =
  "Du är expert på VVS-material (rör, kopplingar, ventiler, fittings) för svensk yrkesutbildning åk 1-3. " +
  "Titta på bilden och identifiera vilken rördel eller komponent det är. " +
  "Svara ENDAST med kompakt JSON, ingen text utanför JSON-objektet, exakt detta format: " +
  '{"name":"kort svenskt namn, t.ex. \'Vinkelkoppling 90°\'","wrong_answers":["tre rimliga men felaktiga namn på liknande delar"]}. ' +
  "Om du är osäker, gör ditt bästa fackmässiga gissning ändå -- lämna aldrig name tomt.";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicKey) {
      return json({ error: "AI-nyckel saknas i serverkonfigurationen." }, 500);
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Inte inloggad." }, 401);
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || user.is_anonymous) {
      return json({ error: "Endast lärare kan använda AI-förslag." }, 403);
    }

    const { data: profile } = await supabase.from("profiles").select("status").eq("id", user.id).single();
    if (!profile || profile.status !== "approved") {
      return json({ error: "Endast godkända lärare kan använda AI-förslag." }, 403);
    }

    const body = await req.json();
    const imageBase64: string | undefined = body?.imageBase64;
    const mimeType: string = body?.mimeType || "image/jpeg";
    if (!imageBase64) {
      return json({ error: "Ingen bild skickades." }, 400);
    }

    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 300,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: mimeType, data: imageBase64 } },
              { type: "text", text: "Vilken rördel är detta?" },
            ],
          },
        ],
      }),
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      console.error("Anthropic API error", anthropicRes.status, errText);
      return json({ error: "AI-tjänsten svarade inte." }, 502);
    }

    const anthropicData = await anthropicRes.json();
    const text: string = anthropicData?.content?.[0]?.text ?? "";

    let parsed: { name?: string; wrong_answers?: string[] } = {};
    try {
      const match = text.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(match ? match[0] : text);
    } catch {
      return json({ error: "Kunde inte tolka AI-svaret." }, 502);
    }

    if (!parsed.name) {
      return json({ error: "AI:n kunde inte identifiera delen." }, 502);
    }

    return json({
      name: parsed.name,
      wrong_answers: Array.isArray(parsed.wrong_answers) ? parsed.wrong_answers.slice(0, 3) : [],
    });
  } catch (e) {
    console.error("identify-material failed", e);
    return json({ error: "Något gick fel." }, 500);
  }
});

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "content-type": "application/json" },
  });
}
