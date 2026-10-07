# Barn Finder — Setup (Supabase + Vercel)

You'll need free accounts at https://supabase.com, https://vercel.com, and a Git host (e.g. GitHub) holding this project.

## 1. Create the Supabase project
1. In Supabase, click **New project** (the free tier is fine). Save the database password somewhere safe.
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

## 3. Deploy to Vercel
1. Push the project to your Git host.
2. In Vercel, click **Add New → Project** and import the repository. Vercel detects Next.js automatically, so keep the default build settings.
3. **Before the first deploy**, open **Environment Variables** and add both of these for all environments (Production, Preview, Development):

   | Name | Value (from Supabase → Project Settings) |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | Data API → Project URL, e.g. `https://abcd1234.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | API Keys → **publishable** key (or the legacy **anon** key) |

   Only use the publishable/anon key. **Never** use the secret/service_role key.

   > `NEXT_PUBLIC_` values are built into the app at build time. If you add or change them after a deploy, use **Deployments → ⋯ → Redeploy** to apply them.
4. Click **Deploy**. When it finishes, note your production URL, e.g. `https://barn-finder.vercel.app`, or your custom domain if you add one.

## 4. Configure authentication
In Supabase, open **Authentication**:

1. **Sign In / Providers → Email**: make sure *Enable Email provider* and *Confirm email* are **on**.
2. **URL Configuration**:
   - **Site URL**: your production URL, e.g. `https://barn-finder.vercel.app`
   - **Redirect URLs**: add `https://barn-finder.vercel.app/**`. Optionally also add `https://*-<your-vercel-team>.vercel.app/**` so preview deployments work.
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

## 5. Become the first admin
1. Open your Vercel URL and click **Log in → Create an account**, using the email you put in the schema file.
2. Click the verification link in the email. You'll land on your account page, marked **Admin**.
3. The **Admin** link now appears in the header. Promote other admins from **Admin → Users**.

## Changing domains later
If you add a custom domain in Vercel, update **Site URL** and **Redirect URLs** in Supabase to match. No app changes are needed.

## Optional: running locally
Copy `.env.example` to `.env.local`, fill in the same two values, add `http://localhost:3000/**` to Supabase's Redirect URLs, then run `npm install` and `npm run dev`.
