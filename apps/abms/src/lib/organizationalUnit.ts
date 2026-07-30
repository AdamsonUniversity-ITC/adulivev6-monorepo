export type OrganizationalUnitKind = 'Department' | 'Section';

export function organizationalUnitKey(
    kind: OrganizationalUnitKind,
    id: string | number,
): string {
    return `${kind.toLowerCase()}:${String(id)}`;
}
