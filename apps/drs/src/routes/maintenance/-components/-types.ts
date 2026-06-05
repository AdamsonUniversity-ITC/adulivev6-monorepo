/**
 * Shared types for the application catalog (documents and packages).
 * Both kinds share the same field shape with different field names; the
 * pane normalises them into a CatalogItem so a single component handles both.
 */

export type CatalogKind = 'document' | 'package';

export type CatalogItem = {
  id: string | number;
  name: string;
  price: number;
  is_active: boolean;
  allow_multiple_per_request: boolean;
};

export type CatalogRules = {
  graduate: boolean;
  undergraduate: boolean;
  enrolled: boolean;
  unenrolled: boolean;
};

export const EMPTY_CATALOG_RULES: CatalogRules = {
  graduate: false,
  undergraduate: false,
  enrolled: false,
  unenrolled: false,
};
