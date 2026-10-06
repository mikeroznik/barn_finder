export type ModerationStatus = "live" | "disapproved";
export type SuggestionStatus = "pending" | "approved" | "rejected";
export type ReportStatus = "open" | "resolved" | "dismissed";
export type ReportTarget = "rink" | "place" | "review" | "place_comment" | "photo";

export interface Address {
  street: string;
  city: string;
  region: string | null;
  postal_code: string | null;
  country_code: string;
  latitude: number | null;
  longitude: number | null;
}

export interface Rink extends Address {
  id: string;
  name: string;
  sheet_count: number | null;
  seating_type_ids: string[];
  seating_notes: string | null;
  parking_type_ids: string[];
  parking_notes: string | null;
  amenity_ids: string[];
  status: ModerationStatus;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export type RinkSummary = Pick<
  Rink,
  "id" | "name" | "street" | "city" | "region" | "postal_code" | "country_code" | "latitude" | "longitude" | "sheet_count"
>;

export interface Place extends Address {
  id: string;
  rink_id: string;
  category_id: string;
  name: string;
  description: string | null;
  status: ModerationStatus;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

/** seating_types, parking_types */
export interface FixedListItem {
  id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
}

export interface RatingCategory extends FixedListItem {
  is_other: boolean;
}

/** amenities, place_categories */
export interface SuggestableItem {
  id: string;
  name: string;
  status: SuggestionStatus;
  suggested_by: string | null;
  sort_order: number;
  created_at: string;
}

export interface Review {
  id: string;
  rink_id: string;
  user_id: string;
  body: string;
  status: ModerationStatus;
  created_at: string;
  updated_at: string;
}

export interface ReviewRating {
  id: string;
  review_id: string;
  category_id: string;
  rating: number;
  other_label: string | null;
}

export interface PlaceComment {
  id: string;
  place_id: string;
  user_id: string;
  body: string;
  status: ModerationStatus;
  created_at: string;
  updated_at: string;
}

export interface Photo {
  id: string;
  storage_path: string;
  uploaded_by: string;
  rink_id: string | null;
  review_rating_id: string | null;
  place_id: string | null;
  caption: string | null;
  status: ModerationStatus;
  created_at: string;
}

export interface Report {
  id: string;
  target_type: ReportTarget;
  target_id: string;
  reason: string;
  reported_by: string | null;
  status: ReportStatus;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
}

export interface ChangeLogEntry {
  id: number;
  table_name: string;
  record_id: string;
  action: "INSERT" | "UPDATE" | "DELETE";
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  changed_by: string | null;
  changed_at: string;
  reverted_at: string | null;
  reverted_by: string | null;
}

export interface Profile {
  id: string;
  display_name: string;
  is_admin: boolean;
  created_at: string;
}

/** Form actions return this to useActionState. */
export interface FormState {
  error?: string;
  message?: string;
}
