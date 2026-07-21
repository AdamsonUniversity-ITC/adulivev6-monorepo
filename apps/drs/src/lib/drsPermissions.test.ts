import { describe, expect, it } from 'vitest';
import {
  DRS_STUDENT_APPLY_PERMISSION,
  getDrAdminPermissionForHost,
  getDrMaintenancePermissionForHost,
  getDrSubdomain,
  hasDrsStaffQueuePermission,
  isStudentOnlyDrsPortalUser,
} from './drsPermissions.ts';

describe('getDrSubdomain', () => {
  it('extracts tenant slug from subdomain host', () => {
    expect(getDrSubdomain('college-drs.localhost.test')).toBe('college-drs');
    expect(getDrSubdomain('shs-drs.localhost.test')).toBe('shs-drs');
  });

  it('maps bare local dev hosts to college-drs in dev', () => {
    expect(getDrSubdomain('127.0.0.1')).toBe('college-drs');
    expect(getDrSubdomain('localhost')).toBe('college-drs');
  });
});

describe('getDrMaintenancePermissionForHost', () => {
  it('returns college maintenance permission for college tenant', () => {
    expect(
      getDrMaintenancePermissionForHost('college-drs.localhost.test'),
    ).toBe('drs_college_maintenance_access');
  });

  it('returns college maintenance permission for bare dev host', () => {
    expect(getDrMaintenancePermissionForHost('127.0.0.1')).toBe(
      'drs_college_maintenance_access',
    );
  });

  it('returns null for unknown tenant', () => {
    expect(
      getDrMaintenancePermissionForHost('unknown.example.test'),
    ).toBeNull();
  });
});

describe('getDrAdminPermissionForHost', () => {
  it('matches maintenance tenant mapping', () => {
    expect(getDrAdminPermissionForHost('bed-drs.localhost.test')).toBe(
      'drs_bed_maintenance_access',
    );
  });
});

describe('isStudentOnlyDrsPortalUser', () => {
  it('is true when student has college access but not maintenance', () => {
    expect(
      isStudentOnlyDrsPortalUser(
        [DRS_STUDENT_APPLY_PERMISSION],
        'college-drs.localhost.test',
      ),
    ).toBe(true);
  });

  it('is false when user also has maintenance access', () => {
    expect(
      isStudentOnlyDrsPortalUser(
        [DRS_STUDENT_APPLY_PERMISSION, 'drs_college_maintenance_access'],
        'college-drs.localhost.test',
      ),
    ).toBe(false);
  });
});

describe('hasDrsStaffQueuePermission', () => {
  it('accepts teacher or regular user access', () => {
    expect(hasDrsStaffQueuePermission(['teacher-access'])).toBe(true);
    expect(hasDrsStaffQueuePermission(['drs_regular_user_access'])).toBe(true);
    expect(hasDrsStaffQueuePermission(['college-access'])).toBe(false);
  });
});
