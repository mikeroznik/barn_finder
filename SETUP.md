# Barn Finder — Setup

## 1. Create the Supabase project
1. Sign in at https://supabase.com and click **New project** (the free tier is fine). Save the database password somewhere safe.
2. Wait for the project to finish provisioning.

## 2. Create the database
1. Open `supabase/migrations/20261006000001_schema.sql` and replace `CHANGE_ME@example.com` with **your** email address. That account becomes the first admin when it signs up.
2. In Supabase, go to **SQL Editor → New query**, paste the whole file, and click **Run**.
3. Open a new query, paste `supabase/migrations/20261006000002_admin_users.sql`, and click **Run**. This powers the admin Users page.
4. Open a new query, paste `supabase/seed/rinks_oh_pa_mi.sql`, and click **Run**. This adds 87 rinks.

> Already ran the schema without changing the email? Run this in the SQL Editor:
> `update public.app_settings set value = 'you@example.com' where key = 'initial_admin_email';`
> If you've already signed up, run this as well:
> `update public.profiles set is_admin = true where id = (select id from auth.users where email = 'you@example.com');`

## 3. Configure authentication
In **Authentication**:

1. **Sign In / Providers → Email**: make sure *Enable Email provider* and *Confirm email* are **on**.
2. **URL Configuration**:
   - **Site URL**: `http://localhost:3000` (change it to your real domain when you deploy)
   - **Redirect URLs**: add `http://localhost:3000/**`
3. **Emails → Templates**. These links let verification work even when the email is opened on a different device than the one used to sign up.
   - **Confirm signup**: replace the link in the message body with
     `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/account`
   - **Reset password**: replace the link with
     `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/account/password`

   For example, the Confirm signup body can be:
   ```html
   <h2>Welcome to Barn Finder</h2>
   <p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/account">Confirm your email</a></p>
   ```

> **Email limits:** Supabase's built-in email only sends a few messages per hour. That's fine for testing. Before launch, add a provider such as Resend or SendGrid under **Project Settings → Authentication → SMTP Settings**. No code changes are needed.

## 4. Connect the app
1. In Supabase, go to **Project Settings → API Keys** (the project URL is under **Data API**).
2. In the project folder, copy `.env.example` to `.env.local` and fill in both values:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable key, or the legacy "anon" key>
   ```
   Only use the **publishable/anon** key. Never put the secret/service_role key in this app.
3. Install and run:
   ```
   npm install
   npm run dev
   ```
   Then open http://localhost:3000.

## 5. Deploy to Vercel (later)
1. Push the project to a Git host, then import it in Vercel.
2. Add the same two environment variables in Vercel.
3. In Supabase, set **Site URL** to your Vercel domain and add `https://<your-domain>/**` to **Redirect URLs**.
