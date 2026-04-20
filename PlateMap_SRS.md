
PlateMap
Halal · Vegetarian · Vegan · Jain Restaurant Finder
Software Requirements Specification (SRS)
Version 1.0   ·   April 2026   ·   Bangalore-first Launch

Field	Detail
Product Name	PlateMap
Version	1.0 (MVP)
Primary Market	Bangalore, India (Mumbai & Delhi — Phase 2)
Target Users	Muslim, Hindu Vegetarian, Vegan, and Jain communities
Platform	Web (mobile-responsive + desktop)
Language	English
Status	Pre-development
Revenue Model (v1)	Google AdSense
 
1. Introduction

1.1 Purpose
This document defines the complete software requirements for PlateMap — a web-based restaurant discovery platform that helps users find restaurants based on their dietary identity: Halal, Vegetarian, Vegan, or Jain. It serves as the single source of truth for design, development, and testing teams.
1.2 Problem Statement
India has one of the world's most diverse dietary landscapes, yet finding trustworthy options for specific dietary needs — particularly Halal certification, strict Jain food (no root vegetables, no after-sunset eating), or pure vegan menus — is frustratingly fragmented. Existing platforms like Zomato and Swiggy list dietary tags inconsistently and without verification.
PlateMap solves this with a color-coded map interface that makes dietary options immediately visible, without any searching or filtering.
1.3 Product Vision
A map-first restaurant discovery app for India's dietary communities — where your food identity is a first-class citizen, not an afterthought filter.
1.4 Scope
PlateMap v1.0 covers:
•	Color-coded interactive map of restaurants by dietary category
•	Restaurant listing pages with details, photos, and hours
•	User account system with saved favourites and dietary preferences
•	User-submitted reviews and star ratings
•	Restaurant owner claim flow for listing verification
•	Google AdSense integration for revenue
•	Mobile-responsive design (no native app in v1)

Out of scope for v1:
•	Food delivery or ordering integration
•	Native iOS / Android apps
•	Multi-language support
•	Paid featured listings (planned for v2)
•	Blog or content section (planned for v2)
1.5 Definitions

Term	Definition
Halal	Permissible under Islamic dietary law — no pork, no alcohol, meat slaughtered per Islamic rite
Vegetarian	No meat or seafood. May include dairy and eggs (lacto-ovo vegetarian)
Vegan	No animal products whatsoever — no meat, dairy, eggs, or honey
Jain	Vegetarian + no root vegetables (onion, garlic, potato, etc.), strictly plant-based above ground
Listing	A single restaurant entry in the PlateMap database
Claim	Process by which a restaurant owner verifies ownership of a listing
Verified Listing	A listing whose owner has been authenticated by PlateMap admin
MVP	Minimum Viable Product — the v1.0 launch feature set
 
2. Overall Description

2.1 Product Perspective
PlateMap is a standalone web application. In v1, it does not integrate with food delivery platforms. Restaurant data is seeded via the Google Places API and enriched manually. Users interact through a browser on any device.
2.2 User Classes

User Type	Description	Key Actions
Guest (Unauthenticated)	Any visitor who has not signed in	Browse map, view listings, read reviews
Registered User	Signed-in user with an account	Save favourites, set preferences, write reviews
Restaurant Owner	Owner who has submitted a claim	Update listing info after admin verification
Admin	PlateMap internal team	Approve claims, manage listings, moderate reviews
2.3 Operating Environment
•	Web browsers: Chrome, Safari, Firefox, Edge (latest 2 major versions)
•	Devices: Desktop, tablet, mobile (responsive design, min width 320px)
•	Internet connection: Required (no offline mode in v1)
•	Hosting: Cloud-based (e.g. Vercel for frontend, Supabase for backend)
2.4 Assumptions and Dependencies
•	Google Places API will be used to seed initial restaurant data for Bangalore
•	Dietary category data (halal/vegan/jain/veg) will be manually verified before publishing
•	Restaurant owners are not required to register — the app works without their participation
•	Google AdSense approval will be obtained before launch
•	All content will be in English for v1
 
3. System Features

3.1 Color-Coded Interactive Map
Description
The map is the core interface of PlateMap. It displays restaurant locations as colored markers based on their dietary category. Users can visually understand the food landscape of any area at a glance.
Marker Color System

Color	Category	Hex Code
Brown	Halal	#795548
Green	Vegetarian	#388E3C
Purple	Vegan	#7B1FA2
Grey / White	Jain	#9E9E9E
Split / Badge	Multiple categories (e.g. Halal + Veg)	Combination
Functional Requirements
•	The map shall load centered on the user's current location (with permission) or default to Bangalore city center
•	Each restaurant shall appear as a circular color-coded marker on the map
•	Markers shall be clustered when zoomed out to avoid visual clutter
•	Tapping or clicking a marker shall open a popup with: restaurant name, category badge, cuisine type, rating, and a 'View Details' button
•	A restaurant that qualifies for multiple categories shall display a split-color marker with both category colors
•	The map shall support zoom (scroll/pinch) and pan (drag) interactions
•	A floating filter panel shall allow users to toggle visibility of each category layer (Halal, Veg, Vegan, Jain)
•	A search bar at the top shall allow users to search by restaurant name or area within Bangalore
3.2 Restaurant Listing Page
Description
Each restaurant has a dedicated page with full details, accessible from the map popup or search results.
Functional Requirements
•	Each listing page shall display: name, address, phone number, dietary category badges, cuisine type, price range, opening hours, photos, average rating, and total review count
•	A 'Get Directions' button shall open Google Maps with the restaurant's coordinates
•	A dietary badge (e.g. 'Halal Certified', 'Pure Veg', 'Jain Friendly') shall be prominently displayed
•	Verified listings shall display a green checkmark badge
•	The page shall display the 10 most recent user reviews with pagination
•	A 'Write a Review' button shall be visible — clicking it prompts login if not signed in
•	If the listing is unclaimed, a small 'Are you the owner? Claim this listing' link shall appear at the bottom
3.3 User Account System
Description
Users can register and log in to access personalized features: saving favourites and setting dietary preferences.
Functional Requirements
•	Users shall be able to register via email/password or Google OAuth
•	Users shall be able to log in and log out
•	Users shall be able to set their dietary preference (Halal / Vegetarian / Vegan / Jain / No preference) — this preference filters the map by default on login
•	Users shall be able to save restaurants to a 'Favourites' list from any listing page
•	A 'My Favourites' page shall display all saved restaurants in a list view with map markers
•	Users shall be able to delete their account and all associated data
•	Password reset via email shall be supported
3.4 Reviews and Ratings
Description
Registered users can submit star ratings and written reviews for any restaurant.
Functional Requirements
•	Only registered and logged-in users may submit a review
•	Each review shall include: star rating (1–5), written text (min 20 characters, max 500 characters), and optional photo upload (max 3 photos, 5MB each)
•	A user may submit only one review per restaurant. They may edit or delete their own review
•	Reviews shall display: username, date posted, star rating, review text, and photos
•	The average rating shall be recalculated automatically when a new review is submitted
•	Admin shall be able to remove reviews that violate community guidelines
•	A 'Report Review' button shall be available on every review for users to flag inappropriate content
3.5 Restaurant Claim Flow
Description
Restaurant owners can submit a claim request to verify they are the authorised representative of a listing. This is not self-service — all claims are reviewed by PlateMap admin.
Functional Requirements
•	Any user can click 'Claim this listing' on an unclaimed restaurant page
•	The claim form shall collect: claimant's name, designation (owner/manager/PR), business email, phone number, and a proof document upload (business registration, FSSAI license, or GST certificate)
•	Upon submission, the claim shall enter a 'Pending Review' state
•	Admin shall receive an email notification for each new claim
•	Admin shall approve or reject the claim via an admin dashboard
•	Upon approval, the claimant shall receive an email with login credentials to a restricted owner portal
•	The owner portal shall allow the owner to update: phone number, opening hours, description, photos, and dietary certification details
•	Changes made by owners shall go live immediately but be flagged for admin review
•	Claimed listings shall display a 'Verified by PlateMap' badge
3.6 Admin Dashboard
Description
An internal panel for the PlateMap team to manage listings, claims, reviews, and data quality.
Functional Requirements
•	Admin shall be able to add, edit, or unpublish any restaurant listing
•	Admin shall be able to approve or reject owner claim requests
•	Admin shall be able to remove reviews flagged by users
•	Admin shall be able to manually override the dietary category of any listing
•	Admin shall have access to basic analytics: page views, top-searched areas, most-saved restaurants
 
4. Non-Functional Requirements

4.1 Performance
•	The map shall load and render markers within 3 seconds on a standard 4G mobile connection
•	Individual listing pages shall load within 2 seconds
•	The system shall support up to 5,000 concurrent users in v1 without degradation
4.2 Usability
•	The map interface shall be operable with one hand on a mobile device
•	All interactive elements shall meet WCAG 2.1 AA contrast requirements
•	The color-coding system shall include a visible legend on the map at all times for accessibility
•	Filter toggles shall have both color and text labels — not color alone — to support color-blind users
4.3 Security
•	All user passwords shall be hashed using bcrypt (min 10 salt rounds)
•	All API endpoints shall require authentication tokens where applicable
•	User data shall not be sold or shared with third parties
•	File uploads (review photos, claim documents) shall be scanned and stored in a private S3-equivalent bucket
•	Admin panel shall be accessible only via a separate, secured subdomain
4.4 Scalability
•	The database schema shall support adding new cities without structural changes
•	Dietary categories shall be configurable — adding a new category (e.g. Kosher) shall not require code changes
4.5 SEO and Discoverability
•	Every restaurant listing page shall have a unique, readable URL slug (e.g. /bangalore/al-baik-halal-koramangala)
•	Listing pages shall include meta title, meta description, and Open Graph tags
•	A sitemap.xml shall be auto-generated and submitted to Google Search Console
•	The map page shall include structured data (Schema.org Restaurant markup) for top listings
 
5. Data Requirements

5.1 Data Sources
•	Primary seed: Google Places API — pulls name, address, coordinates, phone, photos, opening hours, and user ratings
•	Manual enrichment: Dietary category, certification status, and Jain-specific tags added by PlateMap team
•	Community updates: Owner portal edits and admin overrides
5.2 Core Data Entities

Entity	Key Fields
Restaurant	id, name, slug, address, city, lat, lng, phone, cuisine_type, price_range, dietary_categories[], is_verified, claimed_by, hours, photos[], avg_rating, review_count, created_at
User	id, name, email, password_hash, dietary_preference, favourites[], created_at
Review	id, restaurant_id, user_id, rating, text, photos[], created_at, is_flagged
Claim	id, restaurant_id, claimant_user_id, business_email, phone, proof_doc_url, status (pending/approved/rejected), reviewed_by, created_at
Admin	id, email, password_hash, role
5.3 Dietary Category Logic
A restaurant can belong to one or more dietary categories. The categories are not mutually exclusive — for example, a restaurant can be both Halal and offer Vegetarian options. The assignment rules are:
•	Halal: The restaurant uses halal-certified meat across its entire menu, or is a designated halal restaurant
•	Vegetarian: The restaurant serves no meat or seafood. Dairy and eggs may be present
•	Vegan: The restaurant serves no animal products. May be a dedicated vegan restaurant or have a clearly marked vegan section
•	Jain: The restaurant explicitly caters to Jain dietary needs — no root vegetables, no meat, no eggs. Must be verified by admin
 
6. UI / UX Requirements

6.1 Key Screens

Screen	Description
Home / Map View	Full-screen map with colored markers, floating filter panel, search bar at top, and user location button
Restaurant Listing Page	Details, photos carousel, dietary badges, hours, reviews, directions button
Search Results	List view of restaurants matching a search query, sortable by rating or distance
User Profile	Dietary preference setting, favourites list, reviews written
Login / Register	Simple email + Google OAuth screen
Owner Claim Form	Multi-step form: contact info → proof upload → confirmation
Owner Portal	Restricted dashboard to update listing details
Admin Dashboard	Internal management panel for listings, claims, reviews
6.2 Design Principles
•	Map-first: The map is the homepage, not a search results page
•	Color as language: The four dietary colors must be instantly recognizable and consistent across all screens
•	Mobile primary: All interactions must be smooth on a 375px mobile screen before being adapted for desktop
•	Minimal friction: Users should be able to find a restaurant within 3 taps from the homepage without logging in
•	Trust signals: Verified badges, review counts, and photo-verified listings build credibility
6.3 Map Legend
A persistent, collapsible legend shall appear in the bottom-left corner of the map on all screen sizes. It shall display each dietary category with its color swatch and label. On mobile, the legend shall be collapsed by default with an expand icon.
 
7. Recommended Technical Stack


Layer	Technology	Reason
Frontend	Next.js (React)	SEO-friendly SSR, fast page loads, great ecosystem
Map Library	Leaflet.js or Google Maps JS API	Leaflet is free and open; Google Maps has better India data
Styling	Tailwind CSS	Fast, responsive design without custom CSS overhead
Backend / DB	Supabase (PostgreSQL)	Free tier, built-in auth, real-time, easy REST API
Auth	Supabase Auth + Google OAuth	Handles email + social login out of the box
File Storage	Supabase Storage or Cloudinary	For review photos and claim documents
Data Seeding	Google Places API	Best coverage for Bangalore restaurants
Hosting	Vercel (frontend) + Supabase (backend)	Free tiers sufficient for early traffic
Analytics	Google Analytics 4	Track page views, map interactions, popular searches
Revenue	Google AdSense	Passive ad revenue on listing pages and map view
 
8. Constraints & Risks


Constraint / Risk	Impact	Mitigation
Google Places API costs at scale	High API calls = real money	Cache all API results in Supabase; only call API for new listings or updates
Dietary category accuracy	Wrong tags damage trust	Manual admin verification for every listing before publishing
Google AdSense approval	May take 2–4 weeks; requires original content	Start building review content before applying; launch with 50+ listings
Restaurant data freshness	Hours/phone numbers change	Owner claim flow + periodic admin audit of top listings
Jain category complexity	Hard to verify without direct contact	Only mark Jain after explicit owner confirmation or community report
Low initial traffic	AdSense revenue negligible without traffic	SEO-optimize every listing page; target 'halal food Bangalore' keywords
 
9. Launch Plan


Phase	Timeline	Goal	Key Deliverables
Phase 0 — Prep	Weeks 1–2	Data + setup	Seed 100+ Bangalore listings, set up Supabase + Vercel, apply for AdSense
Phase 1 — MVP	Weeks 3–6	Core product live	Map, listing pages, user auth, favourites, reviews
Phase 2 — Verify	Weeks 7–8	Trust + quality	Owner claim flow, admin dashboard, verified badges
Phase 3 — Grow	Months 3–4	Traffic + revenue	SEO optimization, AdSense live, Mumbai data seeded
Phase 4 — Scale	Months 5–6	Monetize further	Paid featured listings (v2), Delhi launch, newsletter
 
10. Revenue Model

10.1 v1 Revenue: Google AdSense
PlateMap v1 will generate revenue exclusively through Google AdSense display ads. This is the simplest approach — no sales effort required, and it runs passively once approved.
Where Ads Will Appear
•	Restaurant listing pages: One banner ad below the photo carousel, one sidebar ad on desktop
•	Search results page: One ad unit between results at position 4–5
•	Map view: A small banner at the bottom on mobile (non-intrusive)
AdSense Revenue Estimate

Stage	Monthly Visitors	Est. Page Views	Est. Monthly Revenue (INR)
Early (Month 1–2)	500–1,000	2,000–4,000	₹500 – ₹1,500
Growing (Month 3–4)	5,000–10,000	20,000–40,000	₹5,000 – ₹15,000
Traction (Month 5–6)	20,000–50,000	80,000–200,000	₹20,000 – ₹60,000
Scale (Month 7–12)	1,00,000+	4,00,000+	₹1,00,000+

Note: AdSense RPM (Revenue Per Mille) for food/restaurant content in India typically ranges from ₹25–₹80 per 1,000 page views. Higher RPM is achieved by targeting English-language, metro-based, high-intent users — which PlateMap's audience naturally is.
10.2 v2 Revenue Streams (Post-Launch)
Once PlateMap has traffic and a verified restaurant base, the following revenue streams become viable:

Revenue Stream	How It Works	Est. Price	When to Add
Featured Listings	Restaurants pay to appear at the top of search results and have a highlighted marker	₹500–₹1,500/month	Month 4–5
Verified Badge (Paid)	Restaurants pay for priority claim review and a prominent verified badge	₹300–₹800 one-time	Month 5
Affiliate Links	Link to Zomato/Swiggy for each restaurant; earn commission on orders placed	3–5% per order	Month 4
Direct Banner Ads	Sell ad space directly to local food brands or FMCG companies at 5–10x AdSense rates	₹5,000–₹20,000/month	Month 6+
City Licensing	Charge local entrepreneurs to operate PlateMap in a new city under your brand	Revenue share	Year 2
10.3 Key Insight
The fastest path to real money is not AdSense alone — it is building enough verified, high-quality listings that restaurant owners see value in paying for visibility. Every verified listing you add is both a trust signal for users and a future paying customer for PlateMap.
Focus the first 3 months entirely on content quality and SEO. Revenue follows traffic.
 
Appendix: Dietary Category Quick Reference


Category	Meat	Seafood	Dairy	Eggs	Root Veg	Alcohol	Certification Needed
Halal	Halal only	Allowed	Allowed	Allowed	Allowed	None	Halal cert preferred
Vegetarian	None	None	Allowed	Allowed	Allowed	Allowed	No
Vegan	None	None	None	None	Allowed	Allowed	No, but menu check req.
Jain	None	None	Allowed	None	None	None	Owner confirmation req.

— End of Document —
