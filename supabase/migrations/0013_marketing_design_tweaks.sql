-- 0013_marketing_design_tweaks.sql ───────────────────────────────────────────
-- Aligns the live marketing copy with the latest design handoff:
--   • home/contact: adds whatsappLabel + whatsappUrl alongside instagram/fb.
--   • home/testimonials: first quote was attributed to "Andrew Ugbehe / A";
--     the design uses "Mr. Ugbehe / U".
-- Both updates use jsonb merging so any other admin edits are preserved.
-- ────────────────────────────────────────────────────────────────────────────

-- ── home / contact: add whatsapp keys ────────────────────────────────────────
update public.site_sections
set
  content = content
    || jsonb_build_object(
         'whatsappLabel', 'WhatsApp · +234 901 724 6528',
         'whatsappUrl',   'https://wa.me/2349017246528'
       ),
  updated_at = now()
where page_slug = 'home'
  and section_key = 'contact';

-- ── home / testimonials: rewrite the first quote's author + initial ──────────
update public.site_sections
set
  content = jsonb_set(
    jsonb_set(
      content,
      '{quotes,0,author}', '"Mr. Ugbehe"'::jsonb, false
    ),
    '{quotes,0,initial}', '"U"'::jsonb, false
  ),
  updated_at = now()
where page_slug = 'home'
  and section_key = 'testimonials'
  and content -> 'quotes' -> 0 ->> 'author' = 'Andrew Ugbehe';
