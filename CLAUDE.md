# PlateMap — CLAUDE.md

## Token Rules
- No preamble. No summary of what you just did. No "Great question!".
- Skip comments unless logic is non-obvious.
- Prefer editing existing files over rewriting them.
- Ask before adding new dependencies.

---

## Project
Map-first halal/veg/vegan/jain restaurant finder. Next.js + Supabase + Leaflet. Bangalore MVP.

---

## Stack
- **Frontend**: Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Map**: Leaflet.js
- **Backend/DB/Auth**: Supabase (PostgreSQL + Auth + Storage)
- **Hosting**: Vercel (frontend), Supabase (backend)
- **Ads**: Google AdSense

---

## File Structure
```
platemap/
├── app/
│   ├── (auth)/login/          # Login + register
│   ├── (auth)/register/
│   ├── map/                   # Homepage — full-screen map
│   ├── restaurant/[slug]/     # Listing page
│   ├── search/                # Search results
│   ├── profile/               # Favourites, preferences, reviews
│   ├── claim/[id]/            # Owner claim flow
│   ├── owner/                 # Owner portal (restricted)
│   ├── admin/                 # Admin dashboard (secured subdomain)
│   └── api/                   # Route handlers
├── components/
│   ├── map/                   # MapView, Marker, FilterPanel, Legend, Popup
│   ├── restaurant/            # ListingCard, DietaryBadge, ReviewCard, PhotoCarousel
│   ├── ui/                    # shadcn components only
│   └── layout/                # Navbar, Footer
├── lib/
│   ├── supabase/              # client.ts, server.ts, types.ts
│   ├── places/                # Google Places API wrapper
│   └── utils.ts
├── hooks/                     # useMap, useAuth, useFavourites
├── types/                     # Restaurant, User, Review, Claim, Admin
├── public/
│   └── markers/               # SVG marker assets
├── .env.local                 # ← all secrets live here, never committed
└── CLAUDE.md
```

---

## Secrets — `.env.local` only
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
GOOGLE_PLACES_API_KEY=
NEXT_PUBLIC_ADSENSE_CLIENT_ID=
```
Never hardcode. Never commit.

---

## Design System — Dark Mode Only

### Colors
| Token | Value | Use |
|---|---|---|
| `--bg` | `#000000` | App background |
| `--surface` | `#0f0f0f` | Cards, panels |
| `--border` | `#1f1f1f` | Dividers, borders |
| `--text` | `#ffffff` | Primary text |
| `--muted` | `#6b7280` | Secondary text |
| `--halal` | `#795548` | Halal markers + badges |
| `--veg` | `#388E3C` | Vegetarian markers + badges |
| `--vegan` | `#7B1FA2` | Vegan markers + badges |
| `--jain` | `#9E9E9E` | Jain markers + badges |

### Typography
```css
font-family: 'Google Sans', 'Quicksand', sans-serif;
```
- Headings: Google Sans, medium/bold
- Body + UI: Quicksand, regular/medium
- Load via Google Fonts

### Components
- shadcn/ui only — no raw HTML form/button/input elements
- `dark` class on `<html>`. No light mode. No toggle.
- Tailwind: use CSS vars above, not hardcoded colors

### Anti-patterns — never do these
- No gradients, glassmorphism, or glow effects
- No emoji in UI
- No skeleton shimmer animations
- No marketing copy inside components
- No `rounded-full` buttons (use `rounded-md`)

---

## Marker System
| Category | Color | Hex |
|---|---|---|
| Halal | Brown | `#795548` |
| Vegetarian | Green | `#388E3C` |
| Vegan | Purple | `#7B1FA2` |
| Jain | Grey | `#9E9E9E` |
| Multi-category | Split circle | Both colors |

SVGs in `public/markers/`. One file per category. Keep under 1KB each.

---

## Dietary Logic
- Categories are not mutually exclusive (a restaurant can be Halal + Veg)
- Jain = admin-confirmed only
- Verified = owner claim approved by admin

---

## Key Constraints
- Map loads in <3s on 4G
- Listing pages load in <2s
- Cache all Google Places results in Supabase — don't hit the API twice
- Admin panel: separate subdomain, separate auth
- WCAG 2.1 AA — filter panel must use text + color, never color alone
