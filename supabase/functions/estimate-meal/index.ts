// Estimate calories & macros from a text description or a meal photo.
// Deploy: supabase functions deploy estimate-meal
import { gemini, json, corsHeaders } from '../_shared/gemini.ts';

const SYSTEM = `You are a precise nutrition estimator. Given a meal (text or photo),
return realistic per-item calorie and macro estimates for the portions implied.
Respond ONLY with JSON of shape:
{"foods":[{"name":string,"servings":number,"kcal":number,"protein_g":number,"carb_g":number,"fat_g":number}]}
Use grams for macros. Keep names short. If unsure, give your best estimate.`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { mode, description, imageBase64 } = await req.json();

    const parts =
      mode === 'photo' && imageBase64
        ? [
            { text: 'Estimate the foods, portions and macros in this meal photo.' },
            { inline_data: { mime_type: 'image/jpeg', data: imageBase64 } },
          ]
        : [{ text: `Estimate macros for: ${description}` }];

    const raw = await gemini(parts, { json: true, system: SYSTEM });
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = { foods: [] };
    }
    return json(parsed);
  } catch (e) {
    return json({ error: (e as Error).message, foods: [] }, 400);
  }
});
