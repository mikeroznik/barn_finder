/** Helpers for reading FormData in Server Actions. */

export function text(fd: FormData, key: string, max = 500): string {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

export function optionalText(fd: FormData, key: string, max = 2000): string | null {
  return text(fd, key, max) || null;
}

export function optionalNumber(fd: FormData, key: string): number | null {
  const v = text(fd, key);
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function ids(fd: FormData, key: string): string[] {
  return fd.getAll(key).filter((v): v is string => typeof v === "string" && v.length > 0);
}

/** Address fields shared by rinks and places. */
export function readAddress(fd: FormData) {
  const country = text(fd, "country_code", 2).toUpperCase();
  return {
    street: text(fd, "street", 200),
    city: text(fd, "city", 100),
    region: optionalText(fd, "region", 100),
    postal_code: optionalText(fd, "postal_code", 20),
    country_code: /^[A-Z]{2}$/.test(country) ? country : "US",
    latitude: optionalNumber(fd, "latitude"),
    longitude: optionalNumber(fd, "longitude"),
  };
}
