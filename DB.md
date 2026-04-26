## Database overview

The Supabase database has these tables (already created):

### `employees`
Stores each field worker.
- `id` — uuid, primary key
- `name` — worker's full name
- `phone` — contact number
- `daily_rate` — how much they earn per day (in ₹)
- `default_site_id` — which site they usually go to (foreign key → sites)
- `is_active` — whether they are currently employed
- `joined_date` — when they joined

### `sites`
Client locations where workers are deployed.
- `id` — uuid, primary key
- `name` — site name (e.g. "Koramangala Villa")
- `client_name` — client's name
- `client_phone` — client contact
- `monthly_rate` — fixed monthly billing amount (in ₹)
- `is_active` — whether site is currently active

### `attendance`
One row per employee per day.
- `employee_id` — which worker (foreign key → employees)
- `site_id` — where they worked that day (foreign key → sites)
- `date` — the date
- `status` — "present", "absent", or "half"
- `advance_amount` — money given to worker that day (default 0)
- `advance_reason` — why advance was given
- `comment` — any note for the day
- Unique constraint on (employee_id, date) — only one record per person per day

### `site_expenses`
Costs incurred at a site (materials, fuel, tools etc).
- `site_id` — which site
- `date` — expense date
- `description` — what was bought
- `category` — one of: materials, fuel, tools, transport, general
- `amount` — cost in ₹

### `extra_services`
One-off work done at a site beyond the monthly contract, billed additionally.
- `site_id` — which site
- `date` — when done
- `description` — what was done (e.g. "event garden setup")
- `amount` — extra billing amount in ₹

### Auth
Auth is handled by Supabase. Users are created manually in the Supabase dashboard (Authentication → Users). The app uses `@supabase/ssr` for server-side session management. Middleware at `src/middleware.ts` already protects all routes and redirects unauthenticated users to `/login`.