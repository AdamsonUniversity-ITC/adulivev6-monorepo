import { describe, expect, it } from 'vitest';
import { drsDocumentTitle, drsTenantLabel } from './drsTenantLabel.ts';

describe('drsDocumentTitle', () => {
  it('names each tenant', () => {
    expect(drsDocumentTitle('college-drs.localhost.test')).toBe('DRS - College');
    expect(drsDocumentTitle('shs-drs.localhost.test')).toBe(
      'DRS - Senior High School',
    );
    expect(drsDocumentTitle('bed-drs.localhost.test')).toBe(
      'DRS - Basic Education',
    );
  });

  it('uses College for a bare local host in dev', () => {
    expect(drsTenantLabel('localhost')).toBe('College');
    expect(drsDocumentTitle('127.0.0.1')).toBe('DRS - College');
  });

  it('falls back when the host is not a tenant', () => {
    expect(drsTenantLabel('example.test')).toBeNull();
    expect(drsDocumentTitle('example.test')).toBe('DRS');
  });
});
