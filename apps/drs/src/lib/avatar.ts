const AVATAR_TYPE_CODES: Record<string, number> = {
  admin: 1,
  teacher: 2,
  college: 3,
  student: 3,
  parent: 4,
  bed: 5,
  agency: 6,
};

const AVATAR_IDNO_BASE =
  'https://live.adamson.edu.ph/legacy/primarypicavatar/getuserimg_idno.php?x=';

export function getAvatarUrlByType(
  type: string | null | undefined,
  id: string | number | null | undefined,
): string | null {
  if (id === null || id === undefined || String(id).trim() === '') {
    return null;
  }

  const typeCode = AVATAR_TYPE_CODES[type ?? ''];
  if (!typeCode) {
    return null;
  }

  return `${AVATAR_IDNO_BASE}${String(id).trim()}_${typeCode}`;
}
