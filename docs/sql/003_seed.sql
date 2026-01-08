-- ============================================================
-- 003_seed.sql - Demo Data Seed (Idempotent)
-- Run this after 000_all.sql to populate with professional demo data
-- Safe to run multiple times - uses ON CONFLICT DO UPDATE
-- ============================================================

-- ============================================================
-- 1. SITE SETTINGS (Update existing row)
-- ============================================================
UPDATE public.site_settings SET
  nav_config = '[
    {"id": "home", "label": "Home", "path": "/", "visible": true, "order": 0},
    {"id": "projects", "label": "Projects", "path": "/projects", "visible": true, "order": 1},
    {"id": "writing", "label": "Writing", "path": "/writing", "visible": true, "order": 2},
    {"id": "resume", "label": "Resume", "path": "/resume", "visible": true, "order": 3, "isCta": true}
  ]'::jsonb,
  home_sections = '[
    {"id": "hero", "visible": true, "order": 0},
    {"id": "experience_snapshot", "visible": true, "order": 1, "limit": 3},
    {"id": "featured_projects", "visible": true, "order": 2, "limit": 3},
    {"id": "how_i_work", "visible": true, "order": 3},
    {"id": "selected_writing_preview", "visible": true, "order": 4, "limit": 3},
    {"id": "contact_cta", "visible": true, "order": 5}
  ]'::jsonb,
  theme = '{
    "accentColor": "#135BEC",
    "defaultMode": "light",
    "font": "ibm-plex"
  }'::jsonb,
  seo = '{
    "siteTitle": "Ammar Jaber | Technical Product Manager",
    "siteDescription": "Technical Product Manager with expertise in AI/LLM products, developer platforms, and B2B SaaS. Building products that create measurable impact.",
    "canonicalUrl": "",
    "ogImage": "",
    "faviconUrl": ""
  }'::jsonb,
  pages = '{
    "resume": {
      "enabled": true,
      "pdfUrl": "",
      "showCopyText": true,
      "showDownload": true
    },
    "contact": {
      "enabled": true,
      "email": "hello@ammarjaber.com",
      "linkedin": "https://linkedin.com/in/ammarjaber",
      "calendar": "https://cal.com/ammarjaber"
    }
  }'::jsonb,
  updated_at = NOW()
WHERE id = (SELECT id FROM public.site_settings LIMIT 1);

-- ============================================================
-- 2. WRITING CATEGORIES
-- ============================================================
INSERT INTO public.writing_categories (slug, name, enabled, order_index) VALUES
  ('product-management', 'Product Management', true, 0),
  ('ai-technology', 'AI & Technology', true, 1)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  enabled = EXCLUDED.enabled,
  order_index = EXCLUDED.order_index,
  updated_at = NOW();

-- ============================================================
-- 3. WRITING ITEMS (EN + AR)
-- ============================================================
INSERT INTO public.writing_items (title, url, platform_label, category_id, language, featured, enabled, order_index, show_why, why_this_matters) VALUES
  (
    'Building LLM-Powered Features: A Product Manager''s Guide',
    'https://medium.com/@ammarjaber/llm-features-guide',
    'Medium',
    (SELECT id FROM public.writing_categories WHERE slug = 'ai-technology'),
    'EN',
    true,
    true,
    0,
    true,
    'Practical frameworks for shipping AI features that actually solve user problems, not just demo well.'
  ),
  (
    'The Art of Technical Product Specifications',
    'https://blog.ammarjaber.com/technical-specs',
    'Personal Blog',
    (SELECT id FROM public.writing_categories WHERE slug = 'product-management'),
    'EN',
    true,
    true,
    1,
    false,
    NULL
  ),
  (
    'Why Most MVP''s Fail (And How to Avoid It)',
    'https://medium.com/@ammarjaber/mvp-failures',
    'Medium',
    (SELECT id FROM public.writing_categories WHERE slug = 'product-management'),
    'EN',
    true,
    true,
    2,
    true,
    'Common anti-patterns I''ve seen in 50+ product launches and practical alternatives.'
  ),
  (
    'كيف تبني منتجات تقنية ناجحة في السوق العربي',
    'https://arabic-tech.com/articles/building-products',
    'Arabic Tech',
    (SELECT id FROM public.writing_categories WHERE slug = 'product-management'),
    'AR',
    false,
    true,
    3,
    true,
    'دروس مستفادة من بناء منتجات تقنية في منطقة الشرق الأوسط وشمال أفريقيا.'
  ),
  (
    'مستقبل الذكاء الاصطناعي في المنتجات الرقمية',
    'https://arabic-tech.com/articles/ai-future',
    'Arabic Tech',
    (SELECT id FROM public.writing_categories WHERE slug = 'ai-technology'),
    'AR',
    false,
    true,
    4,
    false,
    NULL
  ),
  (
    'API Design Principles for Developer Experience',
    'https://dev.to/ammarjaber/api-design-dx',
    'Dev.to',
    (SELECT id FROM public.writing_categories WHERE slug = 'ai-technology'),
    'EN',
    false,
    true,
    5,
    false,
    NULL
  )
ON CONFLICT (url) DO UPDATE SET
  title = EXCLUDED.title,
  platform_label = EXCLUDED.platform_label,
  category_id = EXCLUDED.category_id,
  language = EXCLUDED.language,
  featured = EXCLUDED.featured,
  enabled = EXCLUDED.enabled,
  order_index = EXCLUDED.order_index,
  show_why = EXCLUDED.show_why,
  why_this_matters = EXCLUDED.why_this_matters,
  updated_at = NOW();

-- ============================================================
-- 4. PROJECTS (6 Total: 3 Public, 2 Confidential, 1 Concept)
-- ============================================================

-- Project 1: PUBLIC - AI Recommendation Engine (Featured)
INSERT INTO public.projects (slug, title, summary, tags, status, detail_level, featured, published, sections_config, content, metrics, confidential_message) VALUES
  (
    'ai-recommendation-engine',
    'AI-Powered Recommendation Engine',
    'Led the development of an LLM-based recommendation system that increased conversion rates by 35% through personalized product suggestions and real-time user intent understanding.',
    ARRAY['AI/LLM', 'E-commerce', 'Product'],
    'PUBLIC',
    'FULL',
    true,
    true,
    '[
      {"id": "overview", "visible": true, "order": 0},
      {"id": "problem", "visible": true, "order": 1},
      {"id": "approach", "visible": true, "order": 2},
      {"id": "execution", "visible": true, "order": 3},
      {"id": "impact", "visible": true, "order": 4},
      {"id": "learnings", "visible": true, "order": 5}
    ]'::jsonb,
    '{
      "overview": "Designed and shipped an AI-powered recommendation system for a major e-commerce platform serving 2M+ monthly active users. The system uses LLM embeddings to understand product semantics and user intent in real-time.",
      "problem": "The existing recommendation engine relied on basic collaborative filtering, resulting in generic suggestions that didn''t account for user context or intent. Conversion rates were stagnant at 2.1%, and users complained about irrelevant recommendations.",
      "your_role": "Technical Product Manager leading a cross-functional team of 5 engineers, 2 ML specialists, and 1 designer. Responsible for product strategy, technical architecture decisions, and stakeholder alignment.",
      "approach": "We built a hybrid system combining LLM embeddings for semantic understanding with real-time behavioral signals. Key decisions: (1) Used OpenAI embeddings for product catalog, (2) Built custom intent classifier, (3) Implemented A/B testing framework for continuous optimization.",
      "execution": "12-week development cycle with 2-week sprints. Shipped MVP to 5% of users, iterated based on metrics, then rolled out to 100%. Handled edge cases like cold-start problem with content-based fallbacks.",
      "impact": "35% increase in conversion rate (2.1% → 2.8%), 20% increase in average order value, 15% reduction in bounce rate. System now processes 10M+ recommendations daily with <50ms latency.",
      "learnings": "Key insight: personalization works best when combined with clear user intent signals. Next time, I''d invest earlier in the A/B testing infrastructure and build better observability from day one."
    }'::jsonb,
    '[
      {"label": "Conversion Increase", "value": "+35%"},
      {"label": "AOV Increase", "value": "+20%"},
      {"label": "Daily Recommendations", "value": "10M+"},
      {"label": "Latency", "value": "<50ms"}
    ]'::jsonb,
    NULL
  )
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  summary = EXCLUDED.summary,
  tags = EXCLUDED.tags,
  status = EXCLUDED.status,
  detail_level = EXCLUDED.detail_level,
  featured = EXCLUDED.featured,
  published = EXCLUDED.published,
  sections_config = EXCLUDED.sections_config,
  content = EXCLUDED.content,
  metrics = EXCLUDED.metrics,
  updated_at = NOW();

-- Project 2: PUBLIC - Developer Platform (Featured)
INSERT INTO public.projects (slug, title, summary, tags, status, detail_level, featured, published, sections_config, content, metrics, confidential_message) VALUES
  (
    'developer-platform-redesign',
    'Developer Platform & API Redesign',
    'Led complete redesign of a developer platform serving 50K+ developers. Improved onboarding completion by 60% through simplified authentication, interactive documentation, and better error handling.',
    ARRAY['Developer Experience', 'API', 'Platform'],
    'PUBLIC',
    'FULL',
    true,
    true,
    '[
      {"id": "overview", "visible": true, "order": 0},
      {"id": "problem", "visible": true, "order": 1},
      {"id": "approach", "visible": true, "order": 2},
      {"id": "impact", "visible": true, "order": 3},
      {"id": "learnings", "visible": true, "order": 4}
    ]'::jsonb,
    '{
      "overview": "Redesigned a B2B developer platform from the ground up, focusing on developer experience and time-to-first-API-call. The platform serves enterprise customers building integrations with our core product.",
      "problem": "Developer onboarding had a 40% drop-off rate. Documentation was outdated, authentication was complex (requiring 7 steps), and error messages were cryptic. NPS was -15 among developers.",
      "your_role": "Product Manager working directly with platform engineering team (8 engineers) and developer relations. Led user research, defined product requirements, and drove cross-team alignment.",
      "approach": "Conducted 30+ developer interviews to understand pain points. Key changes: (1) Reduced auth from 7 steps to 2, (2) Built interactive API explorer, (3) Added code snippets in 8 languages, (4) Implemented better error messages with suggested fixes.",
      "impact": "Onboarding completion improved from 60% to 96%. Time-to-first-API-call reduced from 45min to 8min. Developer NPS increased from -15 to +42. Support tickets decreased by 40%.",
      "learnings": "Developers value working examples over comprehensive documentation. The biggest wins came from reducing friction in authentication and providing copy-paste code snippets."
    }'::jsonb,
    '[
      {"label": "Onboarding Completion", "value": "96%"},
      {"label": "Time to First Call", "value": "8min"},
      {"label": "Developer NPS", "value": "+42"},
      {"label": "Support Tickets", "value": "-40%"}
    ]'::jsonb,
    NULL
  )
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  summary = EXCLUDED.summary,
  tags = EXCLUDED.tags,
  status = EXCLUDED.status,
  detail_level = EXCLUDED.detail_level,
  featured = EXCLUDED.featured,
  published = EXCLUDED.published,
  sections_config = EXCLUDED.sections_config,
  content = EXCLUDED.content,
  metrics = EXCLUDED.metrics,
  updated_at = NOW();

-- Project 3: PUBLIC - Mobile App Growth (Featured)
INSERT INTO public.projects (slug, title, summary, tags, status, detail_level, featured, published, sections_config, content, metrics, confidential_message) VALUES
  (
    'mobile-app-growth-engine',
    'Mobile App Growth & Retention Engine',
    'Built a data-driven growth engine that increased 30-day retention by 45% through personalized onboarding flows, smart notifications, and gamification elements.',
    ARRAY['Growth', 'Mobile', 'Data'],
    'PUBLIC',
    'FULL',
    true,
    true,
    '[
      {"id": "overview", "visible": true, "order": 0},
      {"id": "problem", "visible": true, "order": 1},
      {"id": "approach", "visible": true, "order": 2},
      {"id": "impact", "visible": true, "order": 3}
    ]'::jsonb,
    '{
      "overview": "Designed and implemented a comprehensive growth system for a consumer mobile app with 500K+ downloads. Focused on activation, retention, and referral loops.",
      "problem": "The app had strong acquisition (100K+ monthly downloads) but poor retention (only 15% retained after 30 days). Users weren''t discovering core features and churned before experiencing value.",
      "approach": "Built segmented onboarding based on user intent (collected during signup). Implemented progressive disclosure of features. Added streak-based gamification and smart notification system that adapts to user behavior.",
      "impact": "30-day retention increased from 15% to 22% (+45%). Daily active users grew 3x over 6 months. Referral rate increased by 60% through new sharing mechanics."
    }'::jsonb,
    '[
      {"label": "30-Day Retention", "value": "+45%"},
      {"label": "DAU Growth", "value": "3x"},
      {"label": "Referral Rate", "value": "+60%"}
    ]'::jsonb,
    NULL
  )
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  summary = EXCLUDED.summary,
  tags = EXCLUDED.tags,
  status = EXCLUDED.status,
  detail_level = EXCLUDED.detail_level,
  featured = EXCLUDED.featured,
  published = EXCLUDED.published,
  sections_config = EXCLUDED.sections_config,
  content = EXCLUDED.content,
  metrics = EXCLUDED.metrics,
  updated_at = NOW();

-- Project 4: CONFIDENTIAL - Enterprise SaaS
INSERT INTO public.projects (slug, title, summary, tags, status, detail_level, featured, published, sections_config, content, metrics, confidential_message) VALUES
  (
    'enterprise-saas-platform',
    'Enterprise SaaS Platform',
    'Led product strategy for a B2B SaaS platform serving Fortune 500 companies. Drove 200% ARR growth through strategic feature development and enterprise-grade security improvements.',
    ARRAY['Enterprise', 'B2B SaaS', 'Strategy'],
    'CONFIDENTIAL',
    'SUMMARY',
    false,
    true,
    '[
      {"id": "overview", "visible": true, "order": 0},
      {"id": "impact", "visible": true, "order": 1}
    ]'::jsonb,
    '{
      "overview": "Managed product roadmap for an enterprise workflow automation platform. Focused on compliance, security, and scalability requirements for large enterprise customers.",
      "impact": "Grew ARR from $2M to $6M over 18 months. Landed 3 Fortune 500 customers. Achieved SOC 2 Type II and HIPAA compliance."
    }'::jsonb,
    '[
      {"label": "ARR Growth", "value": "200%"},
      {"label": "Fortune 500 Customers", "value": "3"},
      {"label": "Compliance", "value": "SOC 2 + HIPAA"}
    ]'::jsonb,
    'This project contains confidential business information. Details have been intentionally limited to protect proprietary data and client relationships.'
  )
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  summary = EXCLUDED.summary,
  tags = EXCLUDED.tags,
  status = EXCLUDED.status,
  detail_level = EXCLUDED.detail_level,
  featured = EXCLUDED.featured,
  published = EXCLUDED.published,
  sections_config = EXCLUDED.sections_config,
  content = EXCLUDED.content,
  metrics = EXCLUDED.metrics,
  confidential_message = EXCLUDED.confidential_message,
  updated_at = NOW();

-- Project 5: CONFIDENTIAL - Fintech Integration
INSERT INTO public.projects (slug, title, summary, tags, status, detail_level, featured, published, sections_config, content, metrics, confidential_message) VALUES
  (
    'fintech-payment-integration',
    'Fintech Payment Infrastructure',
    'Architected payment processing infrastructure handling $50M+ monthly transactions. Reduced payment failures by 60% and improved checkout conversion.',
    ARRAY['Fintech', 'Payments', 'Infrastructure'],
    'CONFIDENTIAL',
    'MINIMAL',
    false,
    true,
    '[
      {"id": "overview", "visible": true, "order": 0}
    ]'::jsonb,
    '{
      "overview": "Led the redesign of payment infrastructure for a high-growth fintech. Implemented redundant payment routing, smart retry logic, and real-time fraud detection."
    }'::jsonb,
    '[
      {"label": "Monthly Volume", "value": "$50M+"},
      {"label": "Failure Reduction", "value": "-60%"}
    ]'::jsonb,
    'Payment infrastructure details are confidential due to security and regulatory requirements. This summary provides high-level context only.'
  )
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  summary = EXCLUDED.summary,
  tags = EXCLUDED.tags,
  status = EXCLUDED.status,
  detail_level = EXCLUDED.detail_level,
  featured = EXCLUDED.featured,
  published = EXCLUDED.published,
  sections_config = EXCLUDED.sections_config,
  content = EXCLUDED.content,
  metrics = EXCLUDED.metrics,
  confidential_message = EXCLUDED.confidential_message,
  updated_at = NOW();

-- Project 6: CONCEPT - AI Agent Framework
INSERT INTO public.projects (slug, title, summary, tags, status, detail_level, featured, published, sections_config, content, metrics, confidential_message) VALUES
  (
    'ai-agent-framework',
    'AI Agent Orchestration Framework',
    'Exploring a framework for orchestrating multiple AI agents to handle complex, multi-step tasks. Focused on reliability, observability, and graceful degradation.',
    ARRAY['AI/LLM', 'Agents', 'Framework'],
    'CONCEPT',
    'SUMMARY',
    false,
    true,
    '[
      {"id": "overview", "visible": true, "order": 0},
      {"id": "approach", "visible": true, "order": 1}
    ]'::jsonb,
    '{
      "overview": "A conceptual exploration of how to build reliable AI agent systems. This is an ongoing research project exploring patterns for agent coordination, error handling, and human-in-the-loop workflows.",
      "approach": "Investigating three main patterns: (1) Hierarchical agents with supervisor, (2) Peer-to-peer agent collaboration, (3) Human-in-the-loop checkpoints. Building prototypes to test reliability and cost trade-offs."
    }'::jsonb,
    NULL,
    NULL
  )
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  summary = EXCLUDED.summary,
  tags = EXCLUDED.tags,
  status = EXCLUDED.status,
  detail_level = EXCLUDED.detail_level,
  featured = EXCLUDED.featured,
  published = EXCLUDED.published,
  sections_config = EXCLUDED.sections_config,
  content = EXCLUDED.content,
  metrics = EXCLUDED.metrics,
  updated_at = NOW();

-- ============================================================
-- 5. SAMPLE ANALYTICS EVENTS (Optional - for demo dashboard)
-- ============================================================
INSERT INTO public.analytics_events (sid, event, path, ref) VALUES
  (extensions.uuid_generate_v4()::text, 'page_view', '/', NULL),
  (extensions.uuid_generate_v4()::text, 'page_view', '/projects', NULL),
  (extensions.uuid_generate_v4()::text, 'project_view', '/projects/ai-recommendation-engine', 'ai-recommendation-engine'),
  (extensions.uuid_generate_v4()::text, 'project_view', '/projects/developer-platform-redesign', 'developer-platform-redesign'),
  (extensions.uuid_generate_v4()::text, 'resume_download', '/resume', NULL),
  (extensions.uuid_generate_v4()::text, 'contact_click', '/contact', 'linkedin'),
  (extensions.uuid_generate_v4()::text, 'writing_click', '/writing', 'llm-features-guide'),
  (extensions.uuid_generate_v4()::text, 'page_view', '/writing', NULL),
  (extensions.uuid_generate_v4()::text, 'page_view', '/', NULL),
  (extensions.uuid_generate_v4()::text, 'page_view', '/projects', NULL);

-- Done!
SELECT 'Seed completed successfully!' AS result;
