-- ============================================================================
-- Optional demo data, so the dashboard and board are not empty on first login.
-- Run after schema.sql. Delete everything later with the block at the bottom.
-- ============================================================================

insert into public.products (name, priority, category, price, url, benefits, pain_points, offer) values
  ('Glow Serum 30ml', 'hero', 'Skincare', 48.00, 'https://example.com/products/glow-serum',
   'Visible brightening in 2 weeks. Fragrance free. Works under makeup.',
   'Dull skin, uneven tone, too many steps in the morning routine.',
   'Bundle with the cleanser and save 15%'),
  ('Daily Cleanser', 'core', 'Skincare', 26.00, 'https://example.com/products/daily-cleanser',
   'Does not strip the skin barrier. One pump is enough.',
   'Tight, squeaky skin after washing.',
   'Free with orders over $75'),
  ('Recovery Night Mask', 'new_launch', 'Skincare', 54.00, 'https://example.com/products/night-mask',
   'Wake up with a plumper face. Two-week supply per jar.',
   'Dry, flat looking skin in the morning.',
   'Launch price $44 for the first 500 jars'),
  ('Travel Trio', 'seasonal', 'Bundles', 39.00, 'https://example.com/products/travel-trio',
   'Carry-on sized versions of the three bestsellers.',
   'Nothing fits in hand luggage.',
   'Holiday gifting, limited run');

insert into public.creators
  (name, status, niches, platforms, handle, profile_url, email, followers, deal, rate_per_video, rights, rating, notes, last_contacted)
values
  ('Maya Ortega', 'active', '{Beauty,Lifestyle}', '{TikTok,Instagram}', '@mayadoesskin',
   'https://tiktok.com/@mayadoesskin', 'maya@example.com', 84000, 'paid_per_video', 320.00,
   'paid_90', 5, 'Best hook writer on the roster. Turns around in 4 days. Always ask for 3 hook variants.',
   current_date - 6),
  ('Dev Patel', 'active', '{Tech,Lifestyle}', '{TikTok,YouTube}', '@devtries',
   'https://youtube.com/@devtries', 'dev@example.com', 142000, 'retainer', 900.00,
   'perpetual', 4, 'Four videos a month on retainer. Strong on demo and explainer formats.',
   current_date - 2),
  ('Jas Lim', 'negotiating', '{Beauty}', '{Instagram}', '@jaslim.co',
   'https://instagram.com/jaslim.co', 'jas@example.com', 23000, 'gifted', 0.00,
   'organic_only', 4, 'Wants product plus affiliate rather than a flat fee. Worth testing once.',
   current_date - 9),
  ('Priya Raman', 'outreach_sent', '{Home,Parenting}', '{TikTok,Instagram}', '@priyaandco',
   'https://tiktok.com/@priyaandco', 'priya@example.com', 56000, null, null,
   null, null, 'First email sent, no reply yet. Follow up once more then drop.', current_date - 11),
  ('Tom Becker', 'prospect', '{Fitness}', '{YouTube}', '@tombecker',
   'https://youtube.com/@tombecker', null, 310000, null, null,
   null, null, 'Big audience but mostly male 18-24. Probably the wrong fit for skincare.', null),
  ('Noor Haddad', 'paused', '{Fashion,Beauty}', '{TikTok}', '@noorhaddad',
   'https://tiktok.com/@noorhaddad', 'noor@example.com', 67000, 'affiliate', 150.00,
   'paid_30', 3, 'On a break until January. Good unboxings, weaker on scripted pieces.', current_date - 40);

-- Content, wired to the creators and products above.
with c as (select name, id from public.creators),
     p as (select name, id from public.products)
insert into public.content (
  title, status, formats, platforms, goal, usage, hook, brief, caption,
  creator_id, product_id, due_date, post_date, rights_expire_on,
  live_url, views, likes, comments, ad_spend, revenue, board_position
)
values
  ('Maya — 30 day serum results', 'posted',
   '{"Before & After",Testimonial}', '{TikTok,"Instagram Reels","Meta Ads"}', 'social_proof', 'both',
   'I took a photo every morning for 30 days and did not expect this',
   'Daily selfie montage, no filter, natural light only. Close on texture at day 1 and day 30.',
   'Day 1 vs day 30, same lighting, no filter. Serum linked below.',
   (select id from c where name = 'Maya Ortega'),
   (select id from p where name = 'Glow Serum 30ml'),
   current_date - 30, current_date - 24, current_date + 66,
   'https://tiktok.com/@mayadoesskin/video/1', 412000, 38400, 1920, 1800.00, 7420.00, 1),

  ('Dev — why your cleanser is the problem', 'posted',
   '{"Problem / Solution","Product Demo"}', '{TikTok,"YouTube Shorts"}', 'traffic', 'organic',
   'Your skin is not dry, your cleanser is just too harsh',
   'Talking head opener, then side by side foam test against a drugstore cleanser.',
   'The squeaky clean feeling is not a good sign.',
   (select id from c where name = 'Dev Patel'),
   (select id from p where name = 'Daily Cleanser'),
   current_date - 21, current_date - 15, null,
   'https://tiktok.com/@devtries/video/2', 96000, 7100, 540, null, null, 2),

  ('Maya — night mask unboxing', 'posted',
   '{Unboxing}', '{Instagram,TikTok}', 'awareness', 'organic',
   'The packaging on this actually made me gasp',
   'Unboxing in one take. Show the jar weight and the spatula.',
   'New launch, and the jar is heavier than it looks.',
   (select id from c where name = 'Maya Ortega'),
   (select id from p where name = 'Recovery Night Mask'),
   current_date - 14, current_date - 9, current_date + 12,
   'https://instagram.com/p/3', 58000, 4300, 210, null, null, 3),

  ('Noor — travel trio for carry-on', 'awaiting_approval',
   '{"Routine / GRWM",Unboxing}', '{TikTok}', 'sales', 'organic',
   'Everything in this bag is under 100ml and I am not checking a bag',
   'Pack-with-me format. End on the trio laid out flat.',
   null,
   (select id from c where name = 'Noor Haddad'),
   (select id from p where name = 'Travel Trio'),
   current_date + 3, null, null,
   null, null, null, null, null, null, 1),

  ('Dev — serum vs the viral dupe', 'editing',
   '{Review,"Product Demo"}', '{"YouTube Shorts",TikTok}', 'sales', 'both',
   'I bought the dupe so you do not have to',
   'Blind test with two unlabelled bottles. Keep the verdict honest, no overclaiming.',
   null,
   (select id from c where name = 'Dev Patel'),
   (select id from p where name = 'Glow Serum 30ml'),
   current_date + 5, null, null,
   null, null, null, null, null, null, 1),

  ('Maya — morning routine, 3 steps', 'filming',
   '{"Routine / GRWM"}', '{TikTok,"Instagram Reels"}', 'engagement', 'organic',
   'My entire morning routine is three steps and 90 seconds',
   'Shoot in natural light before 9am. Keep it to one continuous take if possible.',
   null,
   (select id from c where name = 'Maya Ortega'),
   (select id from p where name = 'Daily Cleanser'),
   current_date + 7, null, null,
   null, null, null, null, null, null, 1),

  ('Jas — first gifted collab', 'brief_sent',
   '{Testimonial}', '{Instagram}', 'social_proof', 'organic',
   null,
   'Test collaboration. One reel, organic only, affiliate code JAS10.',
   null,
   (select id from c where name = 'Jas Lim'),
   (select id from p where name = 'Glow Serum 30ml'),
   current_date + 12, null, null,
   null, null, null, null, null, null, 1),

  ('Night mask launch — hero ad cut', 'scripting',
   '{"Product Demo",Campaign}', '{"Meta Ads","TikTok Ads"}', 'sales', 'paid',
   null,
   'Needs 4 hook variants for ad testing. Script the body once, swap only the first 3 seconds.',
   null,
   null,
   (select id from p where name = 'Recovery Night Mask'),
   current_date + 10, null, null,
   null, null, null, null, null, null, 1),

  ('Priya — home spa night', 'idea',
   '{Lifestyle}', '{TikTok}', 'awareness', 'organic',
   null,
   'Only if Priya replies. Evening wind-down framing, mask as the centrepiece.',
   null,
   (select id from c where name = 'Priya Raman'),
   (select id from p where name = 'Recovery Night Mask'),
   null, null, null,
   null, null, null, null, null, null, 1),

  ('Founder story — why we made the serum', 'idea',
   '{"Founder Story","Brand Film"}', '{YouTube,Instagram}', 'awareness', 'organic',
   null,
   'Longer piece for the product page. Needs a filming day booked.',
   null,
   null,
   (select id from p where name = 'Glow Serum 30ml'),
   null, null, null,
   null, null, null, null, null, null, 2),

  ('Travel trio — gifting bundle promo', 'scheduled',
   '{"Promo / Sale",Carousel}', '{Instagram,Facebook}', 'sales', 'organic',
   'Three bestsellers, one bag, under forty dollars',
   'Carousel: hero shot, what is inside, price, how to gift it.',
   'The trio is back for the holidays. Limited run.',
   null,
   (select id from p where name = 'Travel Trio'),
   current_date + 2, current_date + 4, null,
   null, null, null, null, null, null, 1),

  ('Maya — serum ad, hook test B', 'posted',
   '{"Problem / Solution"}', '{"Meta Ads"}', 'sales', 'paid',
   'Stop buying serums until you hear this',
   'Same body as the 30 day cut, different opener. Running as a paid test.',
   null,
   (select id from c where name = 'Maya Ortega'),
   (select id from p where name = 'Glow Serum 30ml'),
   current_date - 18, current_date - 12, current_date + 20,
   null, 88000, 2100, 95, 1200.00, 2640.00, 4),

  ('Dev — cleanser demo, retired cut', 'archived',
   '{"Product Demo"}', '{TikTok}', 'traffic', 'organic',
   null,
   'Superseded by the harsh cleanser version. Keeping the raw footage only.',
   null,
   (select id from c where name = 'Dev Patel'),
   (select id from p where name = 'Daily Cleanser'),
   null, current_date - 70, null,
   null, 9400, 300, 12, null, null, 1);

-- ----------------------------------------------------------------------------
-- To wipe the demo data later (keeps your team and roles intact):
--
--   delete from public.content;
--   delete from public.creators;
--   delete from public.products;
-- ----------------------------------------------------------------------------
