import { describe, expect, it, vi, beforeEach } from 'vitest';
import { runDnsCheck } from '@/lib/checkDomain';
import * as queryTxt from '@/lib/dns/queryTxt';
import * as mailInfra from '@/lib/checks/mailInfra';

vi.mock('@/lib/checks/mailInfra', () => ({
  runMailInfraChecks: vi.fn(),
}));

vi.mock('@/lib/dns/queryTxt', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/lib/dns/queryTxt')>();
  return {
    ...mod,
    resolveTxtDetailed: vi.fn(),
  };
});

beforeEach(() => {
  vi.mocked(mailInfra.runMailInfraChecks).mockResolvedValue([]);
  vi.mocked(queryTxt.resolveTxtDetailed).mockReset();
});

function dkimLookupNames(): string[] {
  return vi.mocked(queryTxt.resolveTxtDetailed)
    .mock.calls
    .map(([name]) => name)
    .filter((name) => name.includes('_domainkey'));
}

describe('runDnsCheck DNS resolution errors', () => {
  it('marks SPF as fail when TXT lookup is non-definitive and strict mode is on', async () => {
    vi.mocked(queryTxt.resolveTxtDetailed).mockImplementation(
      async (name: string) => {
        if (name === 'example.com') {
          return { strings: [], dnsState: 'error' };
        }
        if (name === '_dmarc.example.com') {
          return { strings: ['v=DMARC1; p=reject;'], dnsState: 'ok' };
        }
        if (name.includes('._domainkey.')) {
          return { strings: [], dnsState: 'nxdomain' };
        }
        return { strings: [], dnsState: 'ok' };
      },
    );

    const r = await runDnsCheck('example.com', 'apex', {
      treatDnsResolutionErrorsAsFailure: true,
    });
    expect(r.emailAuthDnsError.spf).toBe(true);
    expect(r.full.spf.status).toBe('fail');
    expect(r.spfBreakdown[0].text).toContain('Could not resolve SPF TXT');
  });

  it('does not mark DNS error when strict mode is off', async () => {
    vi.mocked(queryTxt.resolveTxtDetailed).mockImplementation(
      async (name: string) => {
        if (name === 'example.com') {
          return { strings: [], dnsState: 'error' };
        }
        if (name === '_dmarc.example.com') {
          return { strings: ['v=DMARC1; p=reject;'], dnsState: 'ok' };
        }
        if (name.includes('._domainkey.')) {
          return { strings: [], dnsState: 'nxdomain' };
        }
        return { strings: [], dnsState: 'ok' };
      },
    );

    const r = await runDnsCheck('example.com', 'apex', {
      treatDnsResolutionErrorsAsFailure: false,
    });
    expect(r.emailAuthDnsError.spf).toBe(false);
    expect(r.full.spf.status).toBe('missing');
  });

  it('marks DKIM as fail when every selector hits DNS error', async () => {
    vi.mocked(queryTxt.resolveTxtDetailed).mockImplementation(
      async (name: string) => {
        if (name === 'example.com') {
          return { strings: ['v=spf1 -all'], dnsState: 'ok' };
        }
        if (name === '_dmarc.example.com') {
          return { strings: ['v=DMARC1; p=reject;'], dnsState: 'ok' };
        }
        if (
          name === '_domainkey.example.com' ||
          name.includes('._domainkey.')
        ) {
          return { strings: [], dnsState: 'error' };
        }
        return { strings: [], dnsState: 'ok' };
      },
    );

    const r = await runDnsCheck('example.com', 'apex', {
      treatDnsResolutionErrorsAsFailure: true,
    });
    expect(r.emailAuthDnsError.dkim).toBe(true);
    expect(r.full.dkim.status).toBe('fail');
    expect(r.dkimBreakdown.some((l) => l.text.includes('Could not resolve DKIM'))).toBe(
      true,
    );
  });
});

describe('runDnsCheck DKIM probe order', () => {
  it('checks fallback selectors when there is no wildcard record', async () => {
    vi.mocked(queryTxt.resolveTxtDetailed).mockImplementation(
      async (name: string) => {
        if (name === 'example.com') {
          return { strings: ['v=spf1 -all'], dnsState: 'ok' };
        }
        if (name === '_dmarc.example.com') {
          return { strings: ['v=DMARC1; p=reject;'], dnsState: 'ok' };
        }
        if (name === 'default._domainkey.example.com') {
          return { strings: ['v=DKIM1; k=rsa; p=MII'], dnsState: 'ok' };
        }
        if (name.includes('_domainkey')) {
          return { strings: [], dnsState: 'nxdomain' };
        }
        return { strings: [], dnsState: 'ok' };
      },
    );

    const r = await runDnsCheck('example.com');

    expect(r.dkim.selector).toBe('default');
    expect(r.full.dkim.status).toBe('pass');
    expect(dkimLookupNames()).toEqual([
      '_domainkey.example.com',
      'google._domainkey.example.com',
      'default._domainkey.example.com',
    ]);
  });

  it('chooses a valid selector before considering wildcard DKIM', async () => {
    vi.mocked(queryTxt.resolveTxtDetailed).mockImplementation(
      async (name: string) => {
        if (name === 'example.com') {
          return { strings: ['v=spf1 -all'], dnsState: 'ok' };
        }
        if (name === '_dmarc.example.com') {
          return { strings: ['v=DMARC1; p=reject;'], dnsState: 'ok' };
        }
        if (name === 'google._domainkey.example.com') {
          return { strings: ['v=DKIM1; k=rsa; p=MII'], dnsState: 'ok' };
        }
        if (name === '*._domainkey.example.com') {
          return { strings: ['not a DKIM record'], dnsState: 'ok' };
        }
        if (name.includes('_domainkey')) {
          return { strings: [], dnsState: 'nxdomain' };
        }
        return { strings: [], dnsState: 'ok' };
      },
    );

    const r = await runDnsCheck('example.com');

    expect(r.dkim.selector).toBe('google');
    expect(dkimLookupNames()).toEqual([
      '_domainkey.example.com',
      'google._domainkey.example.com',
    ]);
  });

  it('stops at null DKIM on _domainkey', async () => {
    vi.mocked(queryTxt.resolveTxtDetailed).mockImplementation(
      async (name: string) => {
        if (name === 'example.com') {
          return { strings: ['v=spf1 -all'], dnsState: 'ok' };
        }
        if (name === '_dmarc.example.com') {
          return { strings: ['v=DMARC1; p=reject;'], dnsState: 'ok' };
        }
        if (name === '_domainkey.example.com') {
          return { strings: ['v=DKIM1; p='], dnsState: 'ok' };
        }
        if (name.includes('_domainkey')) {
          return { strings: [], dnsState: 'nxdomain' };
        }
        return { strings: [], dnsState: 'ok' };
      },
    );

    const r = await runDnsCheck('example.com');

    expect(r.dkim.selector).toBe('_domainkey');
    expect(r.full.dkim.status).toBe('pass');
    expect(dkimLookupNames()).toEqual(['_domainkey.example.com']);
  });

  it('tries MX provider selectors before fallback selectors', async () => {
    vi.mocked(mailInfra.runMailInfraChecks).mockResolvedValue([
      {
        id: 'mx',
        title: 'MX',
        status: 'pass',
        summary: 'Microsoft 365',
        lines: [],
        providerProfile: {
          name: 'Microsoft 365',
          dkimSelectors: ['selector1', 'selector2'],
        },
      },
    ]);
    vi.mocked(queryTxt.resolveTxtDetailed).mockImplementation(
      async (name: string) => {
        if (name === 'example.com') {
          return { strings: ['v=spf1 -all'], dnsState: 'ok' };
        }
        if (name === '_dmarc.example.com') {
          return { strings: ['v=DMARC1; p=reject;'], dnsState: 'ok' };
        }
        if (name === 'selector2._domainkey.example.com') {
          return { strings: ['v=DKIM1; k=rsa; p=MII'], dnsState: 'ok' };
        }
        if (name.includes('_domainkey')) {
          return { strings: [], dnsState: 'nxdomain' };
        }
        return { strings: [], dnsState: 'ok' };
      },
    );

    const r = await runDnsCheck('example.com');

    expect(r.dkim.selector).toBe('selector2');
    expect(dkimLookupNames()).toEqual([
      '_domainkey.example.com',
      'selector1._domainkey.example.com',
      'selector2._domainkey.example.com',
    ]);
  });
});
