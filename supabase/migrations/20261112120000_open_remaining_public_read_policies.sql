-- Second pass of the fix in 20261105120000.
--
-- The same dashboard-side "anonymous access" cleanup that re-scoped
-- public.products also hit every other table whose read policy is named
-- "Anyone can view ...". All nine were created in this repo as
-- FOR SELECT USING (true) (delivery_companies excepted, noted below) but are
-- live as TO authenticated, so a logged-out visitor sees nothing.
--
-- What the web app actually reads while logged out:
--   community_posts, forum_topics, post_likes  -> /community (public route)
--   product_reviews                            -> ProductReviewsList
-- The rest (driver_ratings, forum_replies, post_comments, seller_ratings,
-- delivery_companies) are not read by any public page today; they are included
-- so the database matches the intent their policy names state, and so the next
-- feature that reads them does not hit the same wall.
--
-- The live definitions turned out to differ from this repo twice over: besides
-- the role list, every qual had been rewritten to (auth.uid() IS NOT NULL).
-- Widening the roles alone would therefore change nothing, because anon has no
-- uid - the qual has to go back to true as well.
--
-- delivery_companies is the one entry that is not a straight restore. Its repo
-- qual was (is_verified = true OR owner_id = auth.uid()); live, that test is
-- gone, so today every signed-in user sees unverified companies as well.
-- Narrowing that back is a behaviour change nobody asked for, so the qual below
-- keeps the present rule for signed-in users and adds anon on the verified-only
-- terms the repo intended.

-- 1. Community and forum content -------------------------------------------

DROP POLICY IF EXISTS "Anyone can view community posts" ON public.community_posts;
CREATE POLICY "Anyone can view community posts"
ON public.community_posts FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Anyone can view forum topics" ON public.forum_topics;
CREATE POLICY "Anyone can view forum topics"
ON public.forum_topics FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Anyone can view forum replies" ON public.forum_replies;
CREATE POLICY "Anyone can view forum replies"
ON public.forum_replies FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Anyone can view comments" ON public.post_comments;
CREATE POLICY "Anyone can view comments"
ON public.post_comments FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Anyone can view likes" ON public.post_likes;
CREATE POLICY "Anyone can view likes"
ON public.post_likes FOR SELECT TO anon, authenticated USING (true);

-- 2. Ratings and reviews ----------------------------------------------------

DROP POLICY IF EXISTS "Anyone can view product reviews" ON public.product_reviews;
CREATE POLICY "Anyone can view product reviews"
ON public.product_reviews FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Anyone can view seller ratings" ON public.seller_ratings;
CREATE POLICY "Anyone can view seller ratings"
ON public.seller_ratings FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Anyone can view driver ratings" ON public.driver_ratings;
CREATE POLICY "Anyone can view driver ratings"
ON public.driver_ratings FOR SELECT TO anon, authenticated USING (true);

-- 3. Delivery companies -----------------------------------------------------
-- This table carries contact_email and contact_phone. Opening the rows to anon
-- without restricting the columns would publish a scrapeable list of business
-- contact details, the same exposure migration 20251018150235 closed for seller
-- emails and driver phone numbers. Rows open; contact columns do not, by the
-- column-privilege approach 20261105120000 used on profiles. authenticated
-- keeps its full table grant, so CompanyDashboard and Dashboard are unaffected.

DROP POLICY IF EXISTS "Anyone can view verified companies" ON public.delivery_companies;
CREATE POLICY "Anyone can view verified companies"
ON public.delivery_companies FOR SELECT TO anon, authenticated
USING (is_verified = true OR auth.uid() IS NOT NULL);

REVOKE SELECT ON public.delivery_companies FROM anon;

GRANT SELECT (
  id,
  name,
  description,
  city,
  logo_url,
  rating,
  is_verified,
  created_at
) ON public.delivery_companies TO anon;

-- Verification (run in the SQL editor after applying):
--
--   select tablename, policyname, roles::text
--     from pg_policies
--    where schemaname = 'public' and cmd = 'SELECT' and policyname ilike 'anyone%'
--    order by tablename;
--
-- Every row should read {anon,authenticated}.
