import { describe, expect, it, vi, afterEach } from 'vitest';
import {
  DNSSEC_NO_DNSKEY_DETAIL_TEXT,
  filterMailInfraLinesWhenCompact,
  runMailInfraChecks,
} from '@/lib/checks/mailInfra';
import { MTA_STS_ABSENT_DETAIL_TEXT } from '@/lib/parse/mtaStsRecord';
import { TLS_RPT_ABSENT_DETAIL_TEXT } from '@/lib/parse/tlsRptRecord';
import * as dohJson from '@/lib/dns/dohJson';
import * as queryTxt from '@/lib/dns/queryTxt';
import * as m365 from '@/lib/checks/microsoft365Tenant';

describe('filterMailInfraLinesWhenCompact', () => {
  it('removes absent-record boilerplate lines only', () => {
    expect(
      filterMailInfraLinesWhenCompact([
        MTA_STS_ABSENT_DETAIL_TEXT,
        'some other detail',
      ]),
    ).toEqual(['some other detail']);
    expect(filterMailInfraLinesWhenCompact([TLS_RPT_ABSENT_DETAIL_TEXT])).toEqual(
      [],
    );
    expect(
      filterMailInfraLinesWhenCompact([DNSSEC_NO_DNSKEY_DETAIL_TEXT]),
    ).toEqual([]);
  });
});

describe('runMailInfraChecks', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not fetch MTA-STS policy unless enabled', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      throw new Error('unexpected fetch');
    });

    vi.spyOn(dohJson, 'resolveMx').mockResolvedValue([]);
    vi.spyOn(dohJson, 'resolveNs').mockResolvedValue([]);
    vi.spyOn(queryTxt, 'resolveTxt').mockResolvedValue([]);
    vi.spyOn(dohJson, 'resolveDns').mockResolvedValue({
      status: dohJson.RCODE.NOERROR,
      ad: false,
      answers: [],
    } as any);
    vi.spyOn(m365, 'checkM365Tenant').mockResolvedValue({
      id: 'm365Tenant',
      title: 'Microsoft 365',
      status: 'missing',
      summary: 'No tenant probe',
      lines: [],
    });

    await runMailInfraChecks('example.com', {
      fetchMtaStsPolicy: false,
    });

    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});
