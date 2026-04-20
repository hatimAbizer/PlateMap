import type { RestaurantRow } from "@/types/database";

export function RestaurantJsonLd({ restaurant }: { restaurant: RestaurantRow }) {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: restaurant.name,
    description: restaurant.description ?? undefined,
    address: {
      "@type": "PostalAddress",
      streetAddress: restaurant.address,
      addressLocality: restaurant.city,
      addressRegion: "Karnataka",
      addressCountry: "IN",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: restaurant.lat,
      longitude: restaurant.lng,
    },
    telephone: restaurant.phone ?? undefined,
    priceRange: restaurant.price_range ?? undefined,
    servesCuisine: restaurant.cuisine_type ?? undefined,
    image: restaurant.photos?.[0] ?? undefined,
    aggregateRating:
      restaurant.avg_rating && restaurant.review_count > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: restaurant.avg_rating,
            reviewCount: restaurant.review_count,
          }
        : undefined,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
