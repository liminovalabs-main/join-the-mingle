/**
 * Utility functions for member demographic age calculations,
 * strictly adhering to UK GDPR privacy guards by calculating age brackets
 * rather than exposing raw date-of-birth timestamps.
 */

// Whole years from a date-of-birth string.
export function calcAge(dob?: string | null): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) {
    age--;
  }
  return age;
}

// Public age bracket shown on profiles — never the exact age (Base44 fidelity).
export function calcAgeGroup(age?: number | null): string {
  if (age == null || Number.isNaN(age)) return "";
  if (age < 30) return "20s";
  if (age < 40) return "30s";
  if (age < 50) return "40s";
  if (age < 60) return "50s";
  return "60+";
}

export function calcAgeGroupFromDob(dob?: string | null): string {
  return calcAgeGroup(calcAge(dob));
}
