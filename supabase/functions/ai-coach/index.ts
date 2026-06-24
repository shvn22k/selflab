// 24/7 coach: chat replies + morning/evening briefings, grounded in the user's
// own data snapshot. Deploy: supabase functions deploy ai-coach
import { gemini, json, corsHeaders } from '../_shared/gemini.ts';

function systemPrompt(ctx: Record<string, unknown>): string {
  return `You are ${ctx.coachName ?? 'Atlas'}, a sharp, warm personal health & fitness coach who
lives with the user 24/7. You know their data and speak directly to them.
Their primary goal is: ${ctx.goal ?? 'lose fat'}.
Be concise, specific and encouraging — never generic. Reference their real numbers.
Today's snapshot (JSON): ${JSON.stringify(ctx)}.
When giving a plan use short lines. Avoid medical claims. Keep replies under 160 words unless asked.`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { messages, context, mode } = await req.json();
    const ctx = context ?? {};

    if (mode === 'morning' || mode === 'evening') {
      const ask =
        mode === 'morning'
          ? 'Write a short morning briefing: a one-line read on readiness, the calorie/protein target for today, a suggested training focus, and one priority. Use the data.'
          : "Write a short evening recap: how the day went vs targets (calories, protein, steps, habits), one win, and one thing to improve tomorrow.";
      const content = await gemini([{ text: ask }], { system: systemPrompt(ctx) });
      return json({ content });
    }

    const history = (messages ?? [])
      .map((m: { role: string; content: string }) => `${m.role === 'user' ? 'User' : 'Coach'}: ${m.content}`)
      .join('\n');
    const reply = await gemini([{ text: `${history}\nCoach:` }], { system: systemPrompt(ctx) });
    return json({ reply });
  } catch (e) {
    return json({ error: (e as Error).message }, 400);
  }
});
