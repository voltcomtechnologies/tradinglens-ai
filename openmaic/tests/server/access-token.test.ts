import { describe, expect, test, vi } from 'vitest';

import { createAccessToken, verifyAccessToken } from '@/lib/server/access-token';

describe('access token signing', () => {
  test('verifies tokens signed with the same access code', async () => {
    vi.setSystemTime(new Date('2026-06-25T00:00:00Z'));

    const token = await createAccessToken('demo-code');

    expect(await verifyAccessToken(token, 'demo-code')).toBe(true);
    expect(await verifyAccessToken(token, 'other-code')).toBe(false);
    expect(await verifyAccessToken('bad-token', 'demo-code')).toBe(false);

    vi.useRealTimers();
  });
});
