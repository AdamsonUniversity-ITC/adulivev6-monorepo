export type PersonDisplayInput = {
  name?: string | null;
  emp_no?: string | null;
  student_no?: string | null;
  agency_no?: string | null;
  person_type?: string | null;
  type?: string | null;
  email?: string | null;
  hr_section_id?: number | null;
  hr_section_name?: string | null;
};

const AVATAR_TYPES = {
  employee: 2,
  student: 3,
  bed: 5,
  agency: 6,
} as const;

const AVATAR_BASE =
  "https://live.adamson.edu.ph/legacy/primarypicavatar/getuserimg_idno.php";

export function resolvePersonType(
  person: PersonDisplayInput,
): keyof typeof AVATAR_TYPES | null {
  const raw = person.person_type ?? person.type ?? null;
  if (
    raw === "employee" ||
    raw === "student" ||
    raw === "bed" ||
    raw === "agency"
  ) {
    return raw;
  }
  if (person.emp_no) return "employee";
  if (person.agency_no) return "agency";
  if (person.student_no) return "student";
  return null;
}

export function getPersonAvatarId(person: PersonDisplayInput): string | null {
  const type = resolvePersonType(person);
  if (type === "employee") return person.emp_no?.trim() || null;
  if (type === "agency") return person.agency_no?.trim() || null;
  if (type === "student" || type === "bed") {
    return person.student_no?.trim() || null;
  }
  return (
    person.emp_no?.trim() ||
    person.student_no?.trim() ||
    person.agency_no?.trim() ||
    null
  );
}

export function getPersonAvatarUrl(person: PersonDisplayInput): string | null {
  const type = resolvePersonType(person);
  const id = getPersonAvatarId(person);
  if (!type || !id) return null;
  return `${AVATAR_BASE}?x=${encodeURIComponent(id)}_${AVATAR_TYPES[type]}`;
}

export function getPersonDisplayName(
  person: PersonDisplayInput,
  fallback = "Unknown",
): string {
  const name = person.name?.trim();
  return name || fallback;
}

export function getPersonInitials(
  person: PersonDisplayInput,
  fallback = "?",
): string {
  const name = person.name?.trim();
  if (name) {
    const cleaned = name.includes(",")
      ? name
          .split(",")
          .map((part) => part.trim())
          .filter(Boolean)
          .reverse()
          .join(" ")
      : name;
    const parts = cleaned.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0]!.charAt(0)}${parts[parts.length - 1]!.charAt(0)}`.toUpperCase();
    }
    if (parts.length === 1) {
      return parts[0]!.slice(0, 2).toUpperCase();
    }
  }

  const id = getPersonAvatarId(person);
  return id?.slice(0, 2).toUpperCase() || fallback;
}

export function getPersonSecondaryLine(
  person: PersonDisplayInput,
  mode: "identity" | "section" = "identity",
): string {
  if (mode === "section") {
    return person.hr_section_name?.trim() || "";
  }

  const bits = [
    person.emp_no ? `Emp ${person.emp_no}` : null,
    person.student_no ? `Student ${person.student_no}` : null,
    person.agency_no ? `Agency ${person.agency_no}` : null,
    person.email ?? null,
  ].filter(Boolean);

  return bits.join(" · ");
}
