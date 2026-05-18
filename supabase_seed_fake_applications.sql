INSERT INTO applications (
  user_id,
  job_title,
  company_name,
  job_description,
  job_url,
  generated_cv,
  generated_cover_letter,
  deadline,
  persons_of_interest,
  status,
  created_at,
  updated_at
) VALUES
-- Application 1: Want to Apply
(
  '3d0e986f-8678-4821-94eb-bbb08b096be7',
  'Senior Product Manager',
  'Spotify',
  'We are looking for a Senior Product Manager to lead our podcast strategy. You will work with cross-functional teams to define product roadmaps, drive adoption, and deliver impact at scale.',
  'https://www.spotify.com/careers/job/senior-product-manager',
  'FREDDIE MARTYN
fmartyn24@gmail.com

---

SENIOR PRODUCT MANAGER

Innovative product leader with 8+ years driving user engagement and monetization across streaming platforms. Track record of launching features that increased daily active users by 40% and subscription conversion by 28%.',
  'I have followed Spotify''s evolution from a music streaming disruption to an audio platform, and I''m excited about the opportunity to lead podcast strategy. My experience scaling engagement metrics aligns directly with your growth objectives.',
  '2026-06-15',
  'Sarah Chen (VP Product, sarah.chen@spotify.com)
Marcus Williams (Director of Podcasts, marcus.w@spotify.com)',
  'draft',
  NOW(),
  NOW()
),

-- Application 2: Draft
(
  '3d0e986f-8678-4821-94eb-bbb08b096be7',
  'Head of Marketing',
  'Notion',
  'Lead marketing strategy for Notion''s enterprise expansion. Build teams, own go-to-market for new products, and drive brand awareness globally. This role reports directly to the CEO.',
  'https://www.notion.so/careers/head-of-marketing',
  'FREDDIE MARTYN
fmartyn24@gmail.com

---

HEAD OF MARKETING

Strategic marketing leader who has built category-defining campaigns for B2B SaaS. Led Politico Pro''s expansion into new verticals, growing from 50K to 200K enterprise users.',
  'Notion is redefining how teams work. Your emphasis on simplicity and power reflects a unique philosophy. I believe my background scaling awareness in competitive markets can help Notion become the default workspace for knowledge workers.',
  '2026-07-01',
  'Ivan Zhao (CEO, ivan@notion.so)
Akshay Kothari (COO, akshay@notion.so)',
  'draft',
  NOW() - INTERVAL '5 days',
  NOW() - INTERVAL '2 days'
),

-- Application 3: Applied
(
  '3d0e986f-8678-4821-94eb-bbb08b096be7',
  'VP Product Strategy',
  'The New York Times',
  'Own product strategy for the Times'' subscription and membership initiatives. Drive innovation in digital journalism, work with editorial teams, and set the product vision for next-generation news.',
  'https://nytimes.com/careers/vp-product-strategy',
  'FREDDIE MARTYN
fmartyn24@gmail.com

---

VP PRODUCT STRATEGY

Product strategist with proven success scaling editorial products. Built Politico Pro from concept to category leader, achieving 95% gross retention and $80M+ ARR.',
  'The Times'' mission to provide trustworthy journalism at scale is compelling. My background scaling editorial products—understanding subscriber psychology, building retention moats, and driving monetization—directly addresses your strategic priorities.',
  '2026-08-30',
  'Meredith Kopit Levien (CEO, m.levien@nytimes.com)
Katharine Viner (EIC, k.viner@nytimes.com)',
  'applied',
  NOW() - INTERVAL '30 days',
  NOW() - INTERVAL '15 days'
);
