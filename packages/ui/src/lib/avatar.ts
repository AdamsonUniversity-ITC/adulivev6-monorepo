/**
 * Matches monorepo avatar_constants + MainNavigation:
 * https://live.adamson.edu.ph/legacy/primarypicavatar/getuserimg.php?x={id}_{image_id}
 */
export const AVATAR_TYPE_CODES: Record<string, number> = {
  admin: 1,
  'super-admin': 1,
  teacher: 2,
  college: 3,
  student: 3,
  shs: 3,
  parent: 4,
  bed: 5,
  agency: 6,
};

/** Same base URL as monorepo `avatar_url` in avatar_constants.ts */
export const AVATAR_URL =
  'https://live.adamson.edu.ph/legacy/primarypicavatar/getuserimg.php?x=';

export type AuthUserLike = {
  username?: string | null;
  email?: string | null;
  image_id?: number | string | null;
  roles?: string[] | null;
  user_info?: {
    id?: number | string | null;
    fname?: string | null;
    lname?: string | null;
    emailadd?: string | null;
    [key: string]: unknown;
  } | null;
  [key: string]: unknown;
};

/**
 * Monorepo MainNavigation pattern:
 * `${avatar_url}${user_info.id}_${image_id}`
 */
export function getAvatarUrlFromAuthUser(
  user: AuthUserLike | null | undefined,
): string | null {
  const profileId = user?.user_info?.id;
  if (
    profileId === null ||
    profileId === undefined ||
    String(profileId).trim() === ''
  ) {
    return null;
  }

  const imageId =
    user?.image_id ??
    imageIdFromRoles(user?.roles) ??
    AVATAR_TYPE_CODES.teacher;

  return `${AVATAR_URL}${String(profileId).trim()}_${imageId}`;
}

export function imageIdFromRoles(
  roles: string[] | null | undefined,
): number | null {
  if (!Array.isArray(roles)) {
    return null;
  }

  for (const role of roles) {
    const key = role.trim().toLowerCase();
    if (key in AVATAR_TYPE_CODES) {
      return AVATAR_TYPE_CODES[key]!;
    }
  }

  return null;
}

export function resolveAuthDisplayName(
  user: AuthUserLike | null | undefined,
): string {
  const fname =
    typeof user?.user_info?.fname === 'string'
      ? user.user_info.fname.trim()
      : '';
  const lname =
    typeof user?.user_info?.lname === 'string'
      ? user.user_info.lname.trim()
      : '';
  const fullName = `${fname} ${lname}`.trim();
  if (fullName !== '') {
    return fullName;
  }

  const username =
    typeof user?.username === 'string' ? user.username.trim() : '';
  if (username !== '') {
    return username;
  }

  const email = typeof user?.email === 'string' ? user.email.trim() : '';
  if (email !== '') {
    const localPart = email.split('@')[0]?.trim();
    if (localPart) {
      return localPart;
    }
  }

  return 'User';
}

export function resolveAuthEmail(
  user: AuthUserLike | null | undefined,
): string {
  const fromProfile =
    typeof user?.user_info?.emailadd === 'string'
      ? user.user_info.emailadd.trim()
      : '';
  if (fromProfile !== '') {
    return fromProfile;
  }

  return typeof user?.email === 'string' ? user.email.trim() : '';
}

export function getInitialsFromDisplayName(
  name: string | null | undefined,
  fallback = '?',
): string {
  const trimmedName = name?.trim();

  if (trimmedName) {
    const parts = trimmedName.split(/\s+/).filter(Boolean);

    if (parts.length >= 2) {
      return `${parts[0]!.charAt(0)}${parts[parts.length - 1]!.charAt(0)}`.toUpperCase();
    }

    if (parts.length === 1) {
      const single = parts[0]!;
      return single.length >= 2
        ? single.slice(0, 2).toUpperCase()
        : single.charAt(0).toUpperCase();
    }
  }

  return fallback;
}
