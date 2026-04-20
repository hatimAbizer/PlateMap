export type DietaryCategory = "halal" | "veg" | "vegan" | "jain";
export type DietaryVerificationStatus = "unverified" | "verified";

export type PriceRange = "$" | "$$" | "$$$" | "$$$$";

export interface RestaurantRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  address: string;
  city: string;
  area: string | null;
  lat: number;
  lng: number;
  phone: string | null;
  website: string | null;
  cuisine_type: string | null;
  price_range: PriceRange | null;
  dietary_categories: DietaryCategory[];
  dietary_claim_status: Partial<Record<DietaryCategory, DietaryVerificationStatus>>;
  is_verified: boolean;
  claimed_by: string | null;
  hours: Record<string, { open: string; close: string } | null> | null;
  photos: string[];
  avg_rating: number | null;
  review_count: number;
  tomtom_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProfileRow {
  id: string;
  name: string | null;
  avatar_url: string | null;
  dietary_preference: DietaryCategory | "none";
  created_at: string;
  updated_at: string;
}

export interface FavouriteRow {
  user_id: string;
  restaurant_id: string;
  created_at: string;
}

export interface ReviewRow {
  id: string;
  restaurant_id: string;
  user_id: string;
  rating: number;
  text: string;
  photos: string[];
  is_flagged: boolean;
  flag_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClaimRow {
  id: string;
  restaurant_id: string;
  claimant_user_id: string;
  claimant_name: string;
  designation: string;
  business_email: string;
  phone: string;
  proof_doc_url: string | null;
  status: "pending" | "approved" | "rejected";
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  created_at: string;
}

export interface AdminRow {
  user_id: string;
  role: "admin" | "moderator";
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      restaurants: {
        Row: RestaurantRow;
        Insert: Partial<RestaurantRow> & Pick<RestaurantRow, "name" | "slug" | "address" | "city" | "lat" | "lng">;
        Update: Partial<RestaurantRow>;
        Relationships: [];
      };
      profiles: {
        Row: ProfileRow;
        Insert: Partial<ProfileRow> & Pick<ProfileRow, "id">;
        Update: Partial<ProfileRow>;
        Relationships: [];
      };
      favourites: {
        Row: FavouriteRow;
        Insert: FavouriteRow;
        Update: Partial<FavouriteRow>;
        Relationships: [];
      };
      reviews: {
        Row: ReviewRow;
        Insert: Partial<ReviewRow> & Pick<ReviewRow, "restaurant_id" | "user_id" | "rating" | "text">;
        Update: Partial<ReviewRow>;
        Relationships: [];
      };
      claims: {
        Row: ClaimRow;
        Insert: Partial<ClaimRow> & Pick<ClaimRow, "restaurant_id" | "claimant_user_id" | "claimant_name" | "designation" | "business_email" | "phone">;
        Update: Partial<ClaimRow>;
        Relationships: [];
      };
      admins: {
        Row: AdminRow;
        Insert: AdminRow;
        Update: Partial<AdminRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
