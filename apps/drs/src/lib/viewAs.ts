import type { AuthUser } from '@/lib/fetchAuthUser.ts';

export const VIEW_AS_STORAGE_KEY = 'drs.viewAsUserId';
export const VIEW_AS_HEADER = 'X-Drs-View-As-User-Id';

export function readViewAsUserId(): string | null {
  if (typeof sessionStorage === 'undefined') {
    return null;
  }

  const value = sessionStorage.getItem(VIEW_AS_STORAGE_KEY);
  return value !== null && /^\d+$/.test(value) && value !== '0' ? value : null;
}

export function startViewAs(userId: number): void {
  sessionStorage.setItem(VIEW_AS_STORAGE_KEY, String(userId));
}

export function stopViewAs(): void {
  sessionStorage.removeItem(VIEW_AS_STORAGE_KEY);
}

export function viewAsLabel(user: AuthUser): string {
  const info = user.user_info;
  const person = [info?.fname, info?.lname].filter(Boolean).join(' ').trim();
  if (person) {
    return person;
  }

  if (typeof user.name === 'string' && user.name.trim() !== '') {
    return user.name.trim();
  }

  if (typeof user.email === 'string' && user.email.trim() !== '') {
    return user.email.trim();
  }

  const empNo = info?.emp_no;
  if (typeof empNo === 'string' && empNo.trim() !== '') {
    return empNo.trim();
  }

  return `User ${user.view_as?.target_user_id ?? user.id}`;
}
