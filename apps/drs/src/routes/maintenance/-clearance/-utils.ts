export type DepartmentUser = {
  user_id: number;
  user?: {
    id: number;
    name?: string | null;
    email?: string | null;
  } | null;
  teacher?: {
    emp_no?: string | number | null;
    full_name?: string | null;
    fname?: string | null;
    mname?: string | null;
    lname?: string | null;
    email?: string | null;
    position?: string | null;
  } | null;
  employee?: {
    emp_no?: string | null;
    name?: string | null;
    email?: string | null;
    position?: string | null;
    department?: string | null;
  } | null;
  role?: string | null;
};

export type Department = {
  id: number | string;
  created_at?: Date | string | null;
  department_name?: string | null;
  description?: string | null;
  name?: string | null;
  restrict_assigned_users_to_course_programs?: boolean;
  users?: DepartmentUser[] | null;
};

/**
 * Department endpoints have inconsistent response shapes (sometimes an array,
 * sometimes wrapped in `{ data }`). This normaliser keeps consumers tidy.
 */
export const getDepartments = (response: unknown): Department[] => {
  if (Array.isArray(response)) {
    return response as Department[];
  }

  if (
    response &&
    typeof response === 'object' &&
    'data' in response &&
    Array.isArray((response as { data: unknown }).data)
  ) {
    return (response as { data: Department[] }).data;
  }

  return [];
};

export const getDepartmentName = (department: Department): string =>
  department.name ?? department.department_name ?? 'Unnamed department';

export const getDepartmentUsers = (department: Department): DepartmentUser[] =>
  Array.isArray(department.users) ? department.users : [];

export const formatCreatedAt = (value?: Date | string | null): string => {
  if (!value) return 'N/A';

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';

  return date.toLocaleDateString();
};
