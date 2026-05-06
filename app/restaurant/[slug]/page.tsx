import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, MapPin, Phone, Clock, Star, Share2, PenLine } from "lucide-react";

import { createServerSupabase } from "@/lib/supabase/server";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { DietaryBadge } from "@/components/restaurant/DietaryBadge";
import { PhotoCarousel } from "@/components/restaurant/PhotoCarousel";
import { FavouriteButton } from "@/components/restaurant/FavouriteButton";
import { ReviewCard, type ReviewWithAuthor } from "@/components/restaurant/ReviewCard";
import { ReviewForm } from "@/components/restaurant/ReviewForm";
import { MiniMap } from "@/components/restaurant/MiniMap";
import { RestaurantJsonLd } from "@/components/restaurant/RestaurantJsonLd";
import { AdSlot as AdsenseSlot } from "@/components/layout/AdSlot";
import type { RestaurantRow, ReviewRow, ProfileRow } from "@/types/database";
import { formatRating } from "@/lib/utils";
import { getDietaryStatus } from "@/lib/dietary";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const supabase = await createServerSupabase();
  const { data: r } = await supabase
    .from("restaurants")
    .select("name, description, city, area, dietary_categories, photos")
    .eq("slug", params.slug)
    .maybeSingle();
  if (!r) return { title: "Not found" };
  const catLabel =
    r.dietary_categories && r.dietary_categories.length
      ? r.dietary_categories.join(" · ")
      : "";
  return {
    title: `${r.name}${r.area ? ", " + r.area : ""}`,
    description:
      r.description ||
      `${r.name} — ${catLabel} restaurant in ${r.area ?? r.city}. Hours, reviews, directions.`,
    openGraph: {
      title: r.name,
      description: r.description ?? undefined,
      images: r.photos?.[0] ? [{ url: r.photos[0] }] : undefined,
    },
  };
}

const DAYS = [
  { key: "mon", label: "Mon" },
  { key: "tue", label: "Tue" },
  { key: "wed", label: "Wed" },
  { key: "thu", label: "Thu" },
  { key: "fri", label: "Fri" },
  { key: "sat", label: "Sat" },
  { key: "sun", label: "Sun" },
];

export default async function RestaurantPage({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = await createServerSupabase();

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("*")
    .eq("slug", params.slug)
    .maybeSingle<RestaurantRow>();

  if (!restaurant) notFound();

  const { data: { user } } = await supabase.auth.getUser();

  const { data: rawReviews } = await supabase
    .from("reviews")
    .select("*")
    .eq("restaurant_id", restaurant.id)
    .eq("is_flagged", false)
    .order("created_at", { ascending: false })
    .limit(10);

  const reviews = (rawReviews ?? []) as ReviewRow[];

  const authorIds = Array.from(new Set(reviews.map((r) => r.user_id)));
  let profilesById: Record<string, ProfileRow> = {};
  if (authorIds.length > 0) {
    const { data: profs } = await supabase
      .from("profiles")
      .select("id, name, avatar_url")
      .in("id", authorIds);
    profilesById = Object.fromEntries(
      ((profs ?? []) as any[]).map((p) => [p.id, p as ProfileRow])
    );
  }

  const reviewsWithAuthor: ReviewWithAuthor[] = reviews.map((rv) => ({
    id: rv.id,
    rating: rv.rating,
    text: rv.text,
    photos: rv.photos,
    created_at: rv.created_at,
    user_id: rv.user_id,
    is_flagged: rv.is_flagged,
    author_name: profilesById[rv.user_id]?.name ?? null,
  }));

  let isFavourite = false;
  let myReview: ReviewRow | null = null;
  if (user) {
    const { data: favRow } = await supabase
      .from("favourites")
      .select("user_id")
      .eq("user_id", user.id)
      .eq("restaurant_id", restaurant.id)
      .maybeSingle();
    isFavourite = !!favRow;

    const { data: mine } = await supabase
      .from("reviews")
      .select("*")
      .eq("user_id", user.id)
      .eq("restaurant_id", restaurant.id)
      .maybeSingle<ReviewRow>();
    myReview = mine;
  }

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${restaurant.lat},${restaurant.lng}`;

  return (
    <main className="min-h-[100dvh] bg-bg text-text">
      <RestaurantJsonLd restaurant={restaurant} />
      <Navbar />

      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 py-6 md:py-10">
        {/* breadcrumb */}
        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-muted mb-5">
          <Link href="/" className="hover:text-text transition-colors">
            Map
          </Link>
          <span>/</span>
          <Link
            href={`/search${restaurant.area ? `?q=${encodeURIComponent(restaurant.area)}` : ""}`}
            className="hover:text-text transition-colors"
          >
            {restaurant.area ?? restaurant.city}
          </Link>
          <span>/</span>
          <span className="text-text normal-case tracking-normal">{restaurant.name}</span>
        </div>

        <div className="grid lg:grid-cols-[1.4fr_1fr] gap-8 lg:gap-12 items-start">
          {/* LEFT — main content */}
          <div>
            <header>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 mb-2">
                    {restaurant.dietary_categories.map((c) => (
                      <DietaryBadge
                        key={c}
                        category={c}
                        status={getDietaryStatus(c, restaurant.dietary_claim_status, restaurant.is_verified)}
                        size="md"
                      />
                    ))}
                    {restaurant.is_verified && (
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.14em] font-semibold text-verified border border-verified/40 rounded-sm px-2 py-1">
                        <Star className="h-3 w-3 fill-verified text-verified" />
                        Verified by PlateMap
                      </span>
                    )}
                  </div>

                  <h1 className="font-display text-3xl md:text-5xl font-semibold tracking-tight text-text">
                    {restaurant.name}
                  </h1>

                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
                    {restaurant.cuisine_type && (
                      <span className="uppercase tracking-[0.14em]">
                        {restaurant.cuisine_type}
                      </span>
                    )}
                    {restaurant.price_range && (
                      <span className="num">{restaurant.price_range}</span>
                    )}
                    <span className="num">
                      {restaurant.lat.toFixed(4)}, {restaurant.lng.toFixed(4)}
                    </span>
                  </div>
                </div>

                <div className="hidden md:flex flex-col items-end">
                  <div className="flex items-center gap-1.5">
                    <Star className="h-5 w-5 fill-text text-text" strokeWidth={1.5} />
                    <span className="font-display text-3xl font-semibold text-text num">
                      {formatRating(restaurant.avg_rating)}
                    </span>
                  </div>
                  <span className="text-[10px] uppercase tracking-[0.18em] text-muted num mt-1">
                    {restaurant.review_count} reviews
                  </span>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <a
                  href={directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-text text-bg text-xs uppercase tracking-[0.14em] font-semibold hover:bg-text/90 transition-colors"
                >
                  Get directions
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
                <FavouriteButton
                  restaurantId={restaurant.id}
                  initial={isFavourite}
                  userId={user?.id ?? null}
                />
                {restaurant.phone && (
                  <a
                    href={`tel:${restaurant.phone}`}
                    className="inline-flex items-center gap-2 h-9 px-3 rounded-md border border-border bg-surface text-text text-xs uppercase tracking-[0.14em] font-semibold hover:bg-surface-2 transition-colors"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    Call
                  </a>
                )}
              </div>
            </header>

            <div className="mt-6">
              <PhotoCarousel photos={restaurant.photos} name={restaurant.name} />
            </div>

            {restaurant.description && (
              <section className="mt-8">
                <div className="label-xs mb-2">About</div>
                <p className="text-base text-text leading-relaxed max-w-prose">
                  {restaurant.description}
                </p>
              </section>
            )}

            {/* Reviews */}
            <section className="mt-10 pt-8 border-t border-border">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="label-xs">Reviews</div>
                  <h2 className="font-display text-xl font-semibold mt-1">
                    {restaurant.review_count}{" "}
                    <span className="text-muted font-normal">
                      {restaurant.review_count === 1 ? "review" : "reviews"}
                    </span>
                  </h2>
                </div>
                {user ? (
                  myReview ? (
                    <span className="text-[10px] uppercase tracking-[0.14em] text-muted flex items-center gap-1">
                      <PenLine className="h-3 w-3" /> You've reviewed
                    </span>
                  ) : null
                ) : (
                  <Link
                    href={`/login?next=/restaurant/${restaurant.slug}`}
                    className="text-[10px] uppercase tracking-[0.14em] text-muted hover:text-text"
                  >
                    Sign in to review →
                  </Link>
                )}
              </div>

              {user && (
                <ReviewForm
                  restaurantId={restaurant.id}
                  userId={user.id}
                  existing={myReview}
                />
              )}

              <div className="mt-4">
                {reviewsWithAuthor.length === 0 ? (
                  <div className="border border-border rounded-md p-8 text-center">
                    <div className="label-xs mb-2">No reviews yet</div>
                    <p className="text-sm text-muted">
                      Be the first to share what you ate here.
                    </p>
                  </div>
                ) : (
                  <div>
                    {reviewsWithAuthor.map((rv) => (
                      <ReviewCard
                        key={rv.id}
                        review={rv}
                        currentUserId={user?.id ?? null}
                      />
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Claim */}
            {!restaurant.claimed_by && (
              <aside className="mt-10 pt-8 border-t border-border">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div className="label-xs">Ownership</div>
                    <h3 className="font-display text-base font-semibold mt-1">
                      Are you the owner?
                    </h3>
                    <p className="text-sm text-muted mt-1 max-w-md">
                      Claim this listing to keep hours, photos, and dietary
                      certification up to date.
                    </p>
                  </div>
                  <Link
                    href={`/claim/${restaurant.id}`}
                    className="inline-flex items-center gap-2 h-9 px-4 rounded-md border border-border bg-surface text-text text-xs uppercase tracking-[0.14em] font-semibold hover:bg-surface-2 transition-colors"
                  >
                    Claim this listing
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </aside>
            )}
          </div>

          {/* RIGHT — sidebar info */}
          <aside className="lg:sticky lg:top-20 space-y-6">
            <div className="rounded-md border border-border overflow-hidden">
              <MiniMap
                lat={restaurant.lat}
                lng={restaurant.lng}
                categories={restaurant.dietary_categories}
                verified={restaurant.is_verified}
              />
              <div className="p-4 space-y-3">
                <InfoRow
                  icon={<MapPin className="h-3.5 w-3.5" />}
                  label="Address"
                  value={restaurant.address}
                />
                {restaurant.phone && (
                  <InfoRow
                    icon={<Phone className="h-3.5 w-3.5" />}
                    label="Phone"
                    value={
                      <a
                        href={`tel:${restaurant.phone}`}
                        className="text-text num hover:underline"
                      >
                        {restaurant.phone}
                      </a>
                    }
                  />
                )}
                <InfoRow
                  icon={<Clock className="h-3.5 w-3.5" />}
                  label="Hours"
                  value={<HoursBlock hours={restaurant.hours} />}
                />
              </div>
            </div>

            {/* AdSense slot */}
            <AdSlot />
          </aside>
        </div>
      </div>

      <Footer />
    </main>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-muted">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-[9px] uppercase tracking-[0.18em] text-muted">
          {label}
        </div>
        <div className="text-sm text-text mt-0.5 break-words">{value}</div>
      </div>
    </div>
  );
}

function HoursBlock({
  hours,
}: {
  hours: Record<string, { open: string; close: string } | null> | null;
}) {
  if (!hours) return <span className="text-muted text-xs">Hours not listed</span>;
  const todayIdx = new Date().getDay(); // 0=Sun
  const todayKey = DAYS[(todayIdx + 6) % 7].key; // reorder so Mon first
  return (
    <div className="text-[11px] num space-y-0.5">
      {DAYS.map((d) => {
        const h = hours[d.key];
        const isToday = d.key === todayKey;
        return (
          <div
            key={d.key}
            className={`flex justify-between gap-3 ${isToday ? "text-text" : "text-muted"}`}
          >
            <span className="w-8 uppercase tracking-[0.14em] text-[9px]">
              {d.label}
              {isToday && <span className="ml-1 text-verified">•</span>}
            </span>
            <span>{h ? `${h.open} – ${h.close}` : "Closed"}</span>
          </div>
        );
      })}
    </div>
  );
}

function AdSlot() {
  const slot = process.env.NEXT_PUBLIC_ADSENSE_SLOT_RESTAURANT ?? process.env.NEXT_PUBLIC_ADSENSE_SLOT_ID ?? "auto";
  return (
    <div className="border border-border rounded-md p-4 text-center">
      <div className="label-xs mb-2">Sponsored</div>
      <AdsenseSlot slot={slot} />
    </div>
  );
}
