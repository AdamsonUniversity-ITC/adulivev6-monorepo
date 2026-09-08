export function displayRequisitionStatus(status: string | null | undefined): string {
    if (!status) return '—';

    const match = status.trim().match(/^on process(?:\s*-\s*(.+))?$/i);
    if (!match) return status;

    return match[1] ? `In Process - ${match[1]}` : 'In Process';
}
