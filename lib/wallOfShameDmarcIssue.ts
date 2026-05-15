import { analyzeDmarc } from '@/lib/parse/dmarc';

export const WALL_OF_SHAME_DMARC_ISSUES_NEW =
  'https://github.com/jkerai1/DMARC-WallOfShame/issues/new';

/** Max chars for DMARC TXT prefilled via URL (avoid GitHub URI limits). */
export const WALL_OF_SHAME_DMARC_RECORD_URL_MAX = 3500;

function truncateForUrlSnippet(s: string, max: number): string {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

/** MXToolbox SuperTool deep link (matches Wall of Shame issue template placeholder). */
export function mxtoolboxDmarcLookupUrl(domain: string): string {
  return `https://mxtoolbox.com/SuperTool.aspx?action=${encodeURIComponent(`dmarc:${domain}`)}`;
}

/** Maps analysed DMARC TXT to the Wall of Shame issue form dropdown value. */
export function inferWallOfShameDmarcIssueType(
  dmarcRecords: readonly string[],
): string {
  const a = analyzeDmarc([...dmarcRecords]);
  if (a.multipleRecords) {
    return 'Malformed / invalid DMARC record';
  }
  if (!a.present) {
    return 'No DMARC record (missing)';
  }
  if (a.policy === 'none') {
    return "DMARC policy set to 'none' (p=none)";
  }
  return 'Malformed / invalid DMARC record';
}

/** DMARC TXT snippet for GitHub issue URL prefilling (may be empty). */
export function formatWallOfShameDmarcRecordForUrl(
  dmarcRecords: readonly string[],
  maxChars: number = WALL_OF_SHAME_DMARC_RECORD_URL_MAX,
): string {
  if (!dmarcRecords.length) return '';
  const joined =
    dmarcRecords.length === 1
      ? dmarcRecords[0]
      : dmarcRecords.join('\n---\n');
  return truncateForUrlSnippet(joined, maxChars);
}

/** Builds the prefilled DMARC Wall of Shame GitHub issue form URL. */
export function buildWallOfShameDmarcIssueUrl(
  orgName: string,
  domain: string,
  dmarcRecords: readonly string[],
): string {
  const params = new URLSearchParams();
  params.set('template', 'dmarc_submission.yml');
  params.set('title', `[DMARC] ${domain}`);
  params.set('org_name', orgName);
  params.set('domain', domain);
  params.set('issue_type', inferWallOfShameDmarcIssueType(dmarcRecords));
  const dmarcSnippet = formatWallOfShameDmarcRecordForUrl(dmarcRecords);
  if (dmarcSnippet) {
    params.set('dmarc_record', dmarcSnippet);
  }
  params.set('lookup_url', mxtoolboxDmarcLookupUrl(domain));
  return `${WALL_OF_SHAME_DMARC_ISSUES_NEW}?${params}`;
}
