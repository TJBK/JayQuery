import { describe, expect, it } from 'vitest';
import {
  WALL_OF_SHAME_DMARC_ISSUES_NEW,
  buildWallOfShameDmarcIssueUrl,
  formatWallOfShameDmarcRecordForUrl,
  inferWallOfShameDmarcIssueType,
  mxtoolboxDmarcLookupUrl,
  WALL_OF_SHAME_DMARC_RECORD_URL_MAX,
} from '@/lib/wallOfShameDmarcIssue';

describe('mxtoolboxDmarcLookupUrl', () => {
  it('builds SuperTool action dmarc:<domain> with encoded action param', () => {
    expect(mxtoolboxDmarcLookupUrl('example.com')).toBe(
      'https://mxtoolbox.com/SuperTool.aspx?action=dmarc%3Aexample.com',
    );
  });

  it('encodes special characters in the domain', () => {
    expect(mxtoolboxDmarcLookupUrl('bad host')).toContain(
      encodeURIComponent('dmarc:bad host'),
    );
  });
});

describe('inferWallOfShameDmarcIssueType', () => {
  it('returns missing when there are no DMARC TXT records', () => {
    expect(inferWallOfShameDmarcIssueType([])).toBe(
      'No DMARC record (missing)',
    );
  });

  it('returns missing when TXT is not DMARC-shaped', () => {
    expect(inferWallOfShameDmarcIssueType(['v=spf1 ~all'])).toBe(
      'No DMARC record (missing)',
    );
  });

  it('returns p=none option when policy is none', () => {
    expect(
      inferWallOfShameDmarcIssueType(['v=DMARC1; p=none; rua=mailto:a@b.co']),
    ).toBe("DMARC policy set to 'none' (p=none)");
  });

  it('returns malformed when multiple DMARC records exist', () => {
    expect(
      inferWallOfShameDmarcIssueType([
        'v=DMARC1; p=reject;',
        'v=DMARC1; p=none;',
      ]),
    ).toBe('Malformed / invalid DMARC record');
  });

  it('returns malformed when DMARC exists but policy tag is invalid', () => {
    expect(
      inferWallOfShameDmarcIssueType(['v=DMARC1; p=monitor;']),
    ).toBe('Malformed / invalid DMARC record');
  });

  it('returns malformed for strict reject when used as catch-all for non-none weak configs', () => {
    expect(
      inferWallOfShameDmarcIssueType(['v=DMARC1; p=reject;']),
    ).toBe('Malformed / invalid DMARC record');
  });
});

describe('formatWallOfShameDmarcRecordForUrl', () => {
  it('returns empty string when there are no records', () => {
    expect(formatWallOfShameDmarcRecordForUrl([])).toBe('');
  });

  it('returns the single record verbatim when within limit', () => {
    const rec = 'v=DMARC1; p=none;';
    expect(formatWallOfShameDmarcRecordForUrl([rec])).toBe(rec);
  });

  it('joins multiple records with a separator line', () => {
    const a = 'v=DMARC1; p=reject;';
    const b = 'v=DMARC1; p=none;';
    expect(formatWallOfShameDmarcRecordForUrl([a, b])).toBe(`${a}\n---\n${b}`);
  });

  it('truncates long records with an ellipsis suffix', () => {
    const inner = 'x'.repeat(100);
    const rec = `v=DMARC1; p=none; note=${inner}`;
    const max = 40;
    const out = formatWallOfShameDmarcRecordForUrl([rec], max);
    expect(out.length).toBe(max);
    expect(out.endsWith('…')).toBe(true);
    expect(out.startsWith('v=DMARC1;')).toBe(true);
  });

  it('respects default max length constant behaviour', () => {
    const long = 'v=DMARC1; ' + 'z'.repeat(WALL_OF_SHAME_DMARC_RECORD_URL_MAX);
    const out = formatWallOfShameDmarcRecordForUrl([long]);
    expect(out.length).toBe(WALL_OF_SHAME_DMARC_RECORD_URL_MAX);
    expect(out.endsWith('…')).toBe(true);
  });
});

describe('buildWallOfShameDmarcIssueUrl', () => {
  function parseIssueUrl(url: string): URLSearchParams {
    const u = new URL(url);
    expect(u.origin + u.pathname).toBe(WALL_OF_SHAME_DMARC_ISSUES_NEW);
    return u.searchParams;
  }

  it('sets template, title, org, domain, issue type, lookup, and omits dmarc_record when absent', () => {
    const url = buildWallOfShameDmarcIssueUrl(
      'ACME Corp',
      'example.com',
      [],
    );
    const q = parseIssueUrl(url);
    expect(q.get('template')).toBe('dmarc_submission.yml');
    expect(q.get('title')).toBe('[DMARC] example.com');
    expect(q.get('org_name')).toBe('ACME Corp');
    expect(q.get('domain')).toBe('example.com');
    expect(q.get('issue_type')).toBe('No DMARC record (missing)');
    expect(q.has('dmarc_record')).toBe(false);
    expect(q.get('lookup_url')).toBe(mxtoolboxDmarcLookupUrl('example.com'));
  });

  it('includes dmarc_record when records exist', () => {
    const rec = 'v=DMARC1; p=none;';
    const url = buildWallOfShameDmarcIssueUrl('Co', 'x.test', [rec]);
    const q = parseIssueUrl(url);
    expect(q.get('dmarc_record')).toBe(rec);
    expect(q.get('issue_type')).toBe("DMARC policy set to 'none' (p=none)");
  });

  it('encodes organisation names with ampersands and preserves round-trip via URLSearchParams', () => {
    const url = buildWallOfShameDmarcIssueUrl(
      'Foo & Bar Ltd',
      'brand.example',
      [],
    );
    const q = parseIssueUrl(url);
    expect(q.get('org_name')).toBe('Foo & Bar Ltd');
    expect(url).toContain('org_name=');
  });

  it('uses malformed issue type for multiple DMARC TXTs', () => {
    const url = buildWallOfShameDmarcIssueUrl(
      'Co',
      'dup.example',
      ['v=DMARC1; p=reject;', 'v=DMARC1; p=none;'],
    );
    expect(parseIssueUrl(url).get('issue_type')).toBe(
      'Malformed / invalid DMARC record',
    );
    expect(parseIssueUrl(url).get('dmarc_record')).toContain('\n---\n');
  });
});
