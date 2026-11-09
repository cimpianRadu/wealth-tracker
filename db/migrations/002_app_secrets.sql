-- Cheia de semnare a sesiunilor, generată de aplicație la prima pornire dacă
-- AUTH_SECRET nu e setat în env. Cine are acces la bază are oricum acces la tot.
CREATE TABLE app_secrets (
  name text PRIMARY KEY,
  value text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
