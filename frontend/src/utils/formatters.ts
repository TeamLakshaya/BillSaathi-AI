/**
 * Formatters and string helpers
 */

export function esc(v: any): string {
  return String(v ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c] || c));
}

export function money(n: number | null | undefined): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(Number(n) || 0);
}

export function date(s?: string): string {
  if (!s) return 'Not provided';
  try {
    return new Date(s + (s.includes('T') ? '' : 'T12:00:00')).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return s;
  }
}

export function badgeColor(text: string): 'teal' | 'amber' | 'red' | 'blue' {
  if (/Completed|Resolved|Ready|Reviewed/.test(text)) return 'teal';
  if (/Review|Mismatch|Duplicate|Missing/.test(text)) return 'amber';
  if (/Failed/.test(text)) return 'red';
  return 'blue';
}

export function stageHelp(i: number): string {
  return [
    'Add your case details.',
    'Select billing and medical documents.',
    'Confirm extracted fields and source references.',
    'Connect the audit service or inspect sample findings.',
    'Link documents and record notes.',
    'Prepare and edit a factual draft.',
    'Review every claim and unresolved question.'
  ][i] || '';
}

export function getNextAction(c: any): [string, string, string] {
  if (!c) return ['Start with a case to organize your bill review.', 'Create a case', 'new'];
  if (c.progress < 2) return ['Add billing and supporting documents.', 'Add documents', 'upload'];
  if (c.progress < 4) return ['Review the bill details and confirm the source information.', 'Review details', 'review'];
  if (c.progress < 5) return ['Organize the documents supporting each finding.', 'Organize evidence', 'evidence'];
  return ['Check your draft and unresolved questions.', 'Review draft', 'complaint'];
}
