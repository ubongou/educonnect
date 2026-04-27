-- EduConnect LMS — Marketing CMS schema rewrite for the redesign (Phase 2).
--
-- The client supplied a new landing + pricing design. This migration brings
-- the site_sections rows in line with the new schemas in
-- src/lib/marketing/schemas.ts:
--
--   • Adds three new sections seeded from the new defaults: home/marquee,
--     home/contact, pricing/faq.
--   • Rewrites home/hero, home/why_grid, home/how_it_works,
--     home/testimonials, home/founders, pricing/intro to match the new
--     content shapes (hero accent split, why-grid pillar numLabels,
--     dashboard-driven how-it-works, testimonial location + initial,
--     founders intro2, pricing-intro accent split).
--   • Drops the deprecated home/final_cta and pricing/info_cards rows —
--     neither section is rendered any more.
--
-- All upserts overwrite content: this is a redesign, not an additive change,
-- and admins haven't been editing the new fields yet. If any of these rows
-- have local edits we want to preserve, swap UPDATE/INSERT below for
-- ON CONFLICT DO NOTHING and then have the admin re-save through the UI.

-- ── home / hero ──────────────────────────────────────────────────────────────
insert into public.site_sections (page_slug, section_key, content)
values (
  'home',
  'hero',
  $json${
    "eyebrow": "Tutoring service · One-on-one",
    "headingPart1": "Personal Tutoring from ",
    "headingAccent": "Nigeria's Best",
    "headingPart2": " Teachers",
    "subheading": "EduConnect is a tutoring service that provides your children with private, one-on-one instruction from Nigeria's finest educators — rigorously vetted, carefully matched, and deeply invested in every child they teach.",
    "primaryCtaLabel": "Book a free session",
    "secondaryCtaLabel": "Pricing",
    "microcopy": "No commitment. Takes 15 minutes.",
    "card1Title": "Vetted teachers",
    "card1Body": "Top 3% of applicants",
    "card2Title": "Families worldwide",
    "card2Body": "UK · US · Nigeria",
    "heroImagePath": "",
    "heroImageAlt": "EduConnect student engaged in a one-on-one lesson",
    "mitBadgePath": "",
    "mitBadgeAlt": "Backed by MIT — Massachusetts Institute of Technology"
  }$json$::jsonb
)
on conflict (page_slug, section_key)
do update set content = excluded.content, updated_at = now();

-- ── home / marquee (NEW) ─────────────────────────────────────────────────────
insert into public.site_sections (page_slug, section_key, content)
values (
  'home',
  'marquee',
  $json${
    "subjects": [
      "Mathematics",
      "English",
      "Sciences",
      "Reading",
      "11+ Prep",
      "SAT & IGCSE",
      "Coding",
      "Creative Writing"
    ]
  }$json$::jsonb
)
on conflict (page_slug, section_key)
do update set content = excluded.content, updated_at = now();

-- ── home / why_grid ──────────────────────────────────────────────────────────
insert into public.site_sections (page_slug, section_key, content)
values (
  'home',
  'why_grid',
  $json${
    "eyebrow": "Why EduConnect",
    "title": "What sets our teachers apart",
    "subtitle": "We do not list tutors for parents to browse. We select, vet, and place the right teacher for each child.",
    "cards": [
      {
        "numLabel": "01 / Teachers",
        "title": "Exceptional Teachers",
        "body": "Learn from passionate educators who bring out the best in every student. Our teachers are carefully selected for their expertise, empathy, and ability to inspire confidence in learners."
      },
      {
        "numLabel": "02 / Approach",
        "title": "Flexible, Child-Centered Learning",
        "body": "We work around your schedule, not the other way around. Choose the times, formats, and goals that suit your child's needs — all while staying informed and involved every step of the way."
      },
      {
        "numLabel": "03 / Outcomes",
        "title": "Academic and Personal Growth",
        "body": "Our approach goes beyond test scores. We help students build confidence, resilience, and a genuine love for learning. Every session is a step toward becoming a more capable, self-assured learner."
      }
    ]
  }$json$::jsonb
)
on conflict (page_slug, section_key)
do update set content = excluded.content, updated_at = now();

-- ── home / how_it_works (now "data driven results") ──────────────────────────
insert into public.site_sections (page_slug, section_key, content)
values (
  'home',
  'how_it_works',
  $json${
    "eyebrow": "Data driven results",
    "title": "Track progress with real-time insights",
    "subtitle": "Watch your child's confidence, skills, and learning behaviours improve. Our dashboard gives you visibility into every session, every milestone.",
    "imagePath": "",
    "imageAlt": "EduConnect parent dashboard showing student progress and session data"
  }$json$::jsonb
)
on conflict (page_slug, section_key)
do update set content = excluded.content, updated_at = now();

-- ── home / testimonials ──────────────────────────────────────────────────────
insert into public.site_sections (page_slug, section_key, content)
values (
  'home',
  'testimonials',
  $json${
    "eyebrow": "Testimonials",
    "title": "Real results, real families",
    "quotes": [
      {
        "body": "The tutors have been outstanding — patient, professional, and deeply committed. I would wholeheartedly recommend EduConnect to any parent looking to see tangible improvement in their children's learning journey.",
        "author": "Andrew Ugbehe",
        "where": "Scotland, UK",
        "initial": "A"
      },
      {
        "body": "Since I started using this service, my child's performance has improved. The lesson teacher is good at what she does, and I have recommended their services to other parents and will continue to do so.",
        "author": "Mrs. Frilster",
        "where": "United Kingdom",
        "initial": "F"
      },
      {
        "body": "Our daughter gets excited to connect with her EduConnect tutor. Her attitude toward learning mathematics has changed completely. Her self-confidence has increased and she is eager to learn new concepts.",
        "author": "Mrs. Joanne",
        "where": "United States",
        "initial": "J"
      }
    ]
  }$json$::jsonb
)
on conflict (page_slug, section_key)
do update set content = excluded.content, updated_at = now();

-- ── home / founders ──────────────────────────────────────────────────────────
insert into public.site_sections (page_slug, section_key, content)
values (
  'home',
  'founders',
  $json${
    "eyebrow": "About",
    "headingLead": "Built on one belief: ",
    "headingHighlight": "teaching quality determines everything.",
    "intro": "EduConnect was built on a simple belief: the quality of teaching determines everything. We recruit and vet Nigeria's most capable teachers, then work with families around the world to give every child access to genuinely excellent instruction.",
    "intro2": "We are a tutoring service — not a platform — and stay accountable for every teacher we place and every child we serve.",
    "founders": [
      {
        "name": "Unyime Okorosobo",
        "role": "Co-founder",
        "bio": "Unyime holds a Master's in International Education from the University of Manchester and a B.Sc. in Computer Science from Bowen University. A third-generation educator with more than 15 years in classrooms and school leadership, she was named one of Nigeria's 50 Most Inspirational Teachers in 2023. She is a Microsoft Certified Educator, has trained thousands of teachers on classroom technology integration, and runs Strategic Maths — an initiative transforming how numeracy is taught across Nigerian schools. Her work sits at the intersection of educational excellence and lasting systemic change.",
        "photoPath": "",
        "photoAlt": "Unyime Okorosobo, Co-founder of EduConnect"
      },
      {
        "name": "Grace Amoka",
        "role": "Co-founder",
        "bio": "Grace holds a degree in Computer Engineering from Covenant University and a Master's in Educational Technology from the University of Ilorin. With over nine years of experience as a teacher, coach, and education consultant, she has worked across K-12 systems on three continents, consulted for the World Bank, and served as a programme coordinator at the African Leadership Academy and Teach for Nigeria — training over 400 educators across more than seven countries. She brings rare rigour and operational depth to everything she builds.",
        "photoPath": "",
        "photoAlt": "Grace Amoka, Co-founder of EduConnect"
      }
    ]
  }$json$::jsonb
)
on conflict (page_slug, section_key)
do update set content = excluded.content, updated_at = now();

-- ── home / contact (NEW) ─────────────────────────────────────────────────────
insert into public.site_sections (page_slug, section_key, content)
values (
  'home',
  'contact',
  $json${
    "eyebrow": "Contact",
    "title": "Let's talk",
    "lead": "Have questions before booking? Send us a message and we'll get back to you within 24 hours.",
    "email": "admin@joineduconnect.com",
    "instagramLabel": "Instagram · @educonnectng",
    "instagramUrl": "https://www.instagram.com/educonnectng/",
    "facebookLabel": "Facebook · EduConnect",
    "facebookUrl": "https://www.facebook.com/profile.php?id=61572098883786"
  }$json$::jsonb
)
on conflict (page_slug, section_key)
do update set content = excluded.content, updated_at = now();

-- ── pricing / intro ──────────────────────────────────────────────────────────
insert into public.site_sections (page_slug, section_key, content)
values (
  'pricing',
  'intro',
  $json${
    "eyebrow": "Flexible pricing · No hidden fees",
    "titlePart1": "Invest in your child's ",
    "titleAccent": "learning",
    "titlePart2": "",
    "subtitle": "Our pricing is transparent and flexible. Commit to the duration that works for your family, with no hidden fees or surprise charges."
  }$json$::jsonb
)
on conflict (page_slug, section_key)
do update set content = excluded.content, updated_at = now();

-- ── pricing / faq (NEW) ──────────────────────────────────────────────────────
insert into public.site_sections (page_slug, section_key, content)
values (
  'pricing',
  'faq',
  $json${
    "eyebrow": "Questions?",
    "title": "Frequently asked",
    "intro": "Everything you need to know about EduConnect pricing and how we work. Can't find your answer? Get in touch.",
    "items": [
      {
        "question": "Can I pause or cancel my sessions?",
        "answer": "Yes. We understand that life happens. You can pause or cancel your plan at any time with 48 hours' notice. If you've already completed sessions, there are no refunds — but you keep any unused sessions you've paid for."
      },
      {
        "question": "What if my child needs more sessions than I've purchased?",
        "answer": "You can add more sessions at any time. Additional sessions are billed at the per-session rate for your plan. Just let your teacher know and we'll arrange the scheduling."
      },
      {
        "question": "Do the free sessions expire?",
        "answer": "No, they don't expire. If you purchase the 24-session or 48-session packages, your free sessions are valid for the entire duration of your plan, plus 30 days after. You can use them whenever you need."
      },
      {
        "question": "Can I change my child's teacher if it's not working out?",
        "answer": "Absolutely. We match students and teachers carefully, but if it's not the right fit, we'll work with you to find a better match at no extra cost. Your child's progress and confidence matter most to us."
      },
      {
        "question": "Do you offer corporate or group discounts?",
        "answer": "We work with schools and organizations on bulk packages. If you're interested in pricing for a group, contact us directly and we can discuss options."
      }
    ]
  }$json$::jsonb
)
on conflict (page_slug, section_key)
do update set content = excluded.content, updated_at = now();

-- ── deprecated rows: drop home/final_cta and pricing/info_cards ──────────────
-- Both sections are removed from the new design and from the section
-- registry. Their JSONB content is no longer rendered or editable.
delete from public.site_sections
 where (page_slug = 'home'    and section_key = 'final_cta')
    or (page_slug = 'pricing' and section_key = 'info_cards');
