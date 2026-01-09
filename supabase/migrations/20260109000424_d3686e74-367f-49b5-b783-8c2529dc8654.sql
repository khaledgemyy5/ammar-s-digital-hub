-- Seed writing categories
INSERT INTO public.writing_categories (name, slug, enabled, order_index) VALUES
  ('Product Management', 'product-management', true, 0),
  ('AI & Technology', 'ai-technology', true, 1)
ON CONFLICT (slug) DO NOTHING;

-- Seed writing items (get category IDs dynamically)
INSERT INTO public.writing_items (category_id, title, url, platform_label, language, featured, enabled, order_index, show_why, why_this_matters)
SELECT 
  (SELECT id FROM public.writing_categories WHERE slug = 'ai-technology'),
  'Building LLM-Powered Features: A Product Manager''s Guide',
  'https://medium.com/@ammarjaber/llm-features-guide',
  'Medium',
  'EN'::language_type,
  true,
  true,
  0,
  true,
  'Practical frameworks for shipping AI features that actually solve user problems.'
WHERE NOT EXISTS (SELECT 1 FROM public.writing_items WHERE url = 'https://medium.com/@ammarjaber/llm-features-guide');

INSERT INTO public.writing_items (category_id, title, url, platform_label, language, featured, enabled, order_index, show_why)
SELECT 
  (SELECT id FROM public.writing_categories WHERE slug = 'product-management'),
  'The Art of Technical Product Specifications',
  'https://blog.ammarjaber.com/technical-specs',
  'Personal Blog',
  'EN'::language_type,
  true,
  true,
  1,
  false
WHERE NOT EXISTS (SELECT 1 FROM public.writing_items WHERE url = 'https://blog.ammarjaber.com/technical-specs');

INSERT INTO public.writing_items (category_id, title, url, platform_label, language, featured, enabled, order_index, show_why, why_this_matters)
SELECT 
  (SELECT id FROM public.writing_categories WHERE slug = 'product-management'),
  'Why Most MVPs Fail (And How to Avoid It)',
  'https://medium.com/@ammarjaber/mvp-failures',
  'Medium',
  'EN'::language_type,
  true,
  true,
  2,
  true,
  'Common anti-patterns I''ve seen in 50+ product launches.'
WHERE NOT EXISTS (SELECT 1 FROM public.writing_items WHERE url = 'https://medium.com/@ammarjaber/mvp-failures');

INSERT INTO public.writing_items (category_id, title, url, platform_label, language, featured, enabled, order_index, show_why, why_this_matters)
SELECT 
  (SELECT id FROM public.writing_categories WHERE slug = 'product-management'),
  'كيف تبني منتجات تقنية ناجحة في السوق العربي',
  'https://arabic-tech.com/articles/building-products',
  'Arabic Tech',
  'AR'::language_type,
  false,
  true,
  3,
  true,
  'دروس مستفادة من بناء منتجات تقنية في منطقة الشرق الأوسط.'
WHERE NOT EXISTS (SELECT 1 FROM public.writing_items WHERE url = 'https://arabic-tech.com/articles/building-products');

INSERT INTO public.writing_items (category_id, title, url, platform_label, language, featured, enabled, order_index, show_why)
SELECT 
  (SELECT id FROM public.writing_categories WHERE slug = 'ai-technology'),
  'مستقبل الذكاء الاصطناعي في المنتجات الرقمية',
  'https://arabic-tech.com/articles/ai-future',
  'Arabic Tech',
  'AR'::language_type,
  false,
  true,
  4,
  false
WHERE NOT EXISTS (SELECT 1 FROM public.writing_items WHERE url = 'https://arabic-tech.com/articles/ai-future');

INSERT INTO public.writing_items (category_id, title, url, platform_label, language, featured, enabled, order_index, show_why)
SELECT 
  (SELECT id FROM public.writing_categories WHERE slug = 'ai-technology'),
  'API Design Principles for Developer Experience',
  'https://dev.to/ammarjaber/api-design-dx',
  'Dev.to',
  'EN'::language_type,
  false,
  true,
  5,
  false
WHERE NOT EXISTS (SELECT 1 FROM public.writing_items WHERE url = 'https://dev.to/ammarjaber/api-design-dx');

-- Seed projects
INSERT INTO public.projects (slug, title, summary, tags, status, detail_level, featured, published, sections_config, content, metrics) VALUES
  (
    'ai-recommendation-engine',
    'AI-Powered Recommendation Engine',
    'Led the development of an LLM-based recommendation system that increased conversion rates by 35% through personalized product suggestions.',
    ARRAY['AI/LLM', 'E-commerce', 'Product'],
    'PUBLIC',
    'FULL',
    true,
    true,
    '[{"id":"snapshot","visible":true,"order":0},{"id":"problem_framing","visible":true,"order":1},{"id":"approach_decisions","visible":true,"order":2},{"id":"outcome_learnings","visible":true,"order":3}]'::jsonb,
    '{"snapshot":{"problem":"E-commerce platform had low conversion rates due to generic, one-size-fits-all product recommendations","role":"Technical Product Manager leading a cross-functional team of 5 engineers and 2 data scientists","approach":"Built LLM-powered personalization using embeddings and real-time user signals","outcome":"35% increase in conversion rate, 20% increase in average order value"},"problem_framing":"Our e-commerce platform was showing the same products to all users regardless of their preferences. This resulted in low engagement rates (under 2% CTR) and missed revenue opportunities.","approach_decisions":"We evaluated rule-based filtering, traditional ML, and LLM-based semantic understanding. We chose LLMs for deeper product/user intent understanding. Key decisions: OpenAI embeddings + hybrid retrieval system.","outcome_learnings":"System exceeded our 20% improvement target. Key learnings: Real-time personalization > batch processing. Combining semantic search with behavioral signals improved accuracy. A/B testing at scale was critical."}'::jsonb,
    '{"conversion_increase":"+35%","aov_increase":"+20%","daily_recommendations":"10M+"}'::jsonb
  ),
  (
    'developer-platform-redesign',
    'Developer Platform & API Redesign',
    'Led complete redesign of a developer platform serving 50K+ developers. Improved onboarding completion by 60%.',
    ARRAY['Developer Experience', 'API', 'Platform'],
    'PUBLIC',
    'FULL',
    true,
    true,
    '[{"id":"snapshot","visible":true,"order":0},{"id":"problem_framing","visible":true,"order":1},{"id":"approach_decisions","visible":true,"order":2},{"id":"outcome_learnings","visible":true,"order":3}]'::jsonb,
    '{"snapshot":{"problem":"Developer onboarding had 40% drop-off rate, complex authentication (7 steps), and poor NPS (-15)","role":"Product Manager leading platform team with 4 engineers","approach":"Reduced auth from 7 steps to 2, built interactive API explorer, added code snippets in 8 languages","outcome":"Onboarding completion improved to 96%. Time-to-first-API-call reduced to 8min. Developer NPS increased to +42"},"problem_framing":"Developers were abandoning our platform before making their first API call. Root causes: complex OAuth flow, poor documentation, no interactive testing tools.","approach_decisions":"We focused on reducing friction. Decisions: Magic link auth, in-browser API playground, auto-generated SDKs. Trade-off: Security vs convenience - chose OAuth with refresh tokens for balance.","outcome_learnings":"Developer experience is product. Time-to-first-value is the most important metric. Interactive documentation beats static docs every time."}'::jsonb,
    '{"onboarding_completion":"96%","time_to_first_call":"8min","developer_nps":"+42"}'::jsonb
  ),
  (
    'mobile-app-growth-engine',
    'Mobile App Growth & Retention Engine',
    'Built a data-driven growth engine that increased 30-day retention by 45% through personalized onboarding and gamification.',
    ARRAY['Growth', 'Mobile', 'Data'],
    'PUBLIC',
    'FULL',
    true,
    true,
    '[{"id":"snapshot","visible":true,"order":0},{"id":"problem_framing","visible":true,"order":1},{"id":"outcome_learnings","visible":true,"order":2}]'::jsonb,
    '{"snapshot":{"problem":"Strong acquisition (100K+ monthly downloads) but poor retention (15% after 30 days). Users churned before experiencing value.","role":"Growth PM working with data science and mobile teams","approach":"Personalized onboarding based on user intent, progressive feature disclosure, gamification elements","outcome":"30-day retention increased to 22% (+45%). DAU grew 3x over 6 months. Referral rate increased by 60%."},"problem_framing":"Users downloaded the app expecting one thing, got another experience. No personalization, no clear path to value.","outcome_learnings":"Retention is a product problem, not a marketing problem. Understanding user intent during onboarding is crucial. Gamification works when tied to real value, not just points."}'::jsonb,
    '{"retention_increase":"+45%","dau_growth":"3x","referral_increase":"+60%"}'::jsonb
  ),
  (
    'enterprise-saas-platform',
    'Enterprise SaaS Platform',
    'Led product strategy for a B2B SaaS platform serving Fortune 500 companies. Drove 200% ARR growth.',
    ARRAY['Enterprise', 'B2B SaaS', 'Strategy'],
    'CONFIDENTIAL',
    'SUMMARY',
    false,
    true,
    '[{"id":"snapshot","visible":true,"order":0}]'::jsonb,
    '{"snapshot":{"problem":"Enterprise customers needed workflow automation with compliance requirements (SOC 2, HIPAA)","role":"Senior PM leading enterprise product line","approach":"Built configurable workflow engine with audit trails and compliance controls","outcome":"200% ARR growth, 3 Fortune 500 customers acquired"}}'::jsonb,
    '{"arr_growth":"200%","fortune_500_customers":"3"}'::jsonb
  ),
  (
    'fintech-payment-infrastructure',
    'Fintech Payment Infrastructure',
    'Architected payment processing infrastructure handling $50M+ monthly transactions.',
    ARRAY['Fintech', 'Payments', 'Infrastructure'],
    'CONFIDENTIAL',
    'MINIMAL',
    false,
    true,
    '[{"id":"snapshot","visible":true,"order":0}]'::jsonb,
    '{"snapshot":{"problem":"Payment failures causing revenue loss and customer churn","role":"Technical PM for payments infrastructure","approach":"Smart retry logic, multi-provider failover, fraud detection integration","outcome":"Payment failure rate reduced by 60%, $50M+ monthly volume processed"}}'::jsonb,
    '{"monthly_volume":"$50M+","failure_reduction":"-60%"}'::jsonb
  ),
  (
    'ai-agent-framework',
    'AI Agent Orchestration Framework',
    'Exploring a framework for orchestrating multiple AI agents to handle complex, multi-step tasks.',
    ARRAY['AI/LLM', 'Agents', 'Framework'],
    'CONCEPT',
    'SUMMARY',
    false,
    true,
    '[{"id":"snapshot","visible":true,"order":0},{"id":"approach_decisions","visible":true,"order":1}]'::jsonb,
    '{"snapshot":{"problem":"Complex tasks require coordination between multiple specialized AI agents with error handling and human oversight","role":"Exploring as a side project / proof of concept","approach":"Hierarchical agent architecture with checkpoints and human-in-the-loop workflows","outcome":"In exploration phase - building POC"},"approach_decisions":"Investigating hierarchical agents, peer-to-peer collaboration, and checkpoint patterns. Key challenge: How to maintain context across agent handoffs while ensuring reliability."}'::jsonb,
    '{}'::jsonb
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

-- Update site_settings with complete configuration
UPDATE public.site_settings SET
  nav_config = '[{"id":"home","label":"Home","path":"/","visible":true,"order":0},{"id":"projects","label":"Projects","path":"/projects","visible":true,"order":1},{"id":"writing","label":"Writing","path":"/writing","visible":true,"order":2},{"id":"resume","label":"Resume","path":"/resume","visible":true,"order":3,"isCta":true}]'::jsonb,
  home_sections = '[{"id":"hero","visible":true,"order":0},{"id":"experience_snapshot","visible":true,"order":1,"limit":3},{"id":"featured_projects","visible":true,"order":2,"limit":3},{"id":"how_i_work","visible":true,"order":3},{"id":"selected_writing_preview","visible":true,"order":4,"limit":3},{"id":"contact_cta","visible":true,"order":5}]'::jsonb,
  theme = '{"accentColor":"#135BEC","defaultMode":"light","font":"ibm-plex"}'::jsonb,
  seo = '{"siteTitle":"Ammar Jaber | Technical Product Manager","siteDescription":"Technical Product Manager with expertise in AI/LLM products, developer platforms, and B2B SaaS. Building products that bridge cutting-edge technology and real user needs."}'::jsonb,
  pages = '{"resume":{"enabled":true,"pdfUrl":"","showCopyText":true,"showDownload":true},"contact":{"enabled":true,"email":"hello@ammarjaber.com","linkedin":"https://linkedin.com/in/ammarjaber","calendar":"https://cal.com/ammarjaber"}}'::jsonb,
  updated_at = NOW()
WHERE id IS NOT NULL;