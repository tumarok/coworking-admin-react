// @vitest-environment node
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createMockServer } from '../mock/server.mjs';
import {
  bookingSchema,
  dashboardSchema,
  locationSchema,
  loginResponseSchema,
  memberSchema,
  pageOf,
  roomSchema,
} from '../src/shared/api/contract';

import { createApi } from './core/api';
import { createNodeServer } from './node';

/**
 * One scenario suite, two implementations: the TypeScript mock (server/) and the zero-dependency
 * one (mock/). Every response is parsed with the shared contract, so both stay interchangeable.
 */
const NOW = Date.parse('2026-10-14T09:00:00.000Z');

const IMPLEMENTATIONS: [string, () => Server][] = [
  ['TypeScript mock (server/)', () => createNodeServer(createApi({ now: NOW, clock: () => NOW }))],
  ['zero-dependency mock (mock/)', () => createMockServer({ now: NOW }) as Server],
];

describe.each(IMPLEMENTATIONS)('%s', (_name, make) => {
  let server: Server;
  let base = '';
  let auth = '';

  const call = async (method: string, path: string, body?: unknown) => {
    const res = await fetch(`${base}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...(auth ? { Authorization: auth } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await res.text();
    return { status: res.status, body: text ? (JSON.parse(text) as unknown) : undefined };
  };

  beforeAll(async () => {
    server = make();
    await new Promise<void>((resolve) => server.listen(0, resolve));
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/v1`;
    const login = await call('POST', '/auth/login', {
      email: 'admin@coworking.test',
      password: 'demo1234',
    });
    auth = `Bearer ${loginResponseSchema.parse(login.body).token}`;
  });
  afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));

  it('guards the API with a token', async () => {
    const saved = auth;
    auth = '';
    expect((await call('GET', '/rooms')).status).toBe(401);
    expect(
      (await call('POST', '/auth/login', { email: 'admin@coworking.test', password: 'nope' }))
        .status,
    ).toBe(401);
    auth = saved;
  });

  it('pages and filters lists in the contract shape', async () => {
    const page = await call('GET', '/locations?page=1&limit=2');
    const parsed = pageOf(locationSchema).parse(page.body);
    expect(parsed.items).toHaveLength(2);
    expect(parsed.total).toBeGreaterThanOrEqual(4);

    const active = pageOf(memberSchema).parse((await call('GET', '/members?status=active')).body);
    expect(active.items.every((m) => m.status === 'active')).toBe(true);
  });

  it('rejects invalid input with field errors', async () => {
    const res = await call('POST', '/locations', { name: 'X' });
    expect(res.status).toBe(422);
    expect(res.body).toMatchObject({ fieldErrors: { name: expect.any(String) } });
  });

  it('refuses to delete a location that still has rooms', async () => {
    const [first] = pageOf(locationSchema).parse((await call('GET', '/locations')).body).items;
    expect((await call('DELETE', `/locations/${first?.id}`)).status).toBe(409);
  });

  it('enforces booking rules, conflicts, transitions and bulk results the same way', async () => {
    const location = locationSchema.parse(
      (
        await call('POST', '/locations', {
          name: 'Parity Hub',
          city: 'Kyiv',
          address: '1 Test Street',
          timezone: 'Europe/Kyiv',
          opensAt: '08:00',
          closesAt: '20:00',
          status: 'active',
        })
      ).body,
    );
    const room = roomSchema.parse(
      (
        await call('POST', '/rooms', {
          locationId: location.id,
          name: 'Quartz',
          type: 'meeting_room',
          capacity: 4,
          hourlyRate: 2000,
          amenities: ['whiteboard'],
          status: 'available',
        })
      ).body,
    );
    const [member] = pageOf(memberSchema).parse(
      (await call('GET', '/members?status=active&limit=1')).body,
    ).items;
    // 10:00–11:00 in Kyiv (UTC+2 in January).
    const slot = {
      roomId: room.id,
      memberId: member?.id,
      startsAt: '2027-01-11T08:00:00.000Z',
      endsAt: '2027-01-11T09:00:00.000Z',
      attendees: 2,
      notes: null,
    };

    const created = await call('POST', '/bookings', slot);
    expect(created.status).toBe(201);
    const booking = bookingSchema.parse(created.body);
    expect(booking).toMatchObject({ status: 'pending', totalPrice: 2000 });

    const overlap = await call('POST', '/bookings', slot);
    expect(overlap.status).toBe(409);
    expect(overlap.body).toMatchObject({ conflicts: [{ id: booking.id }] });

    const crowded = await call('POST', '/bookings', {
      ...slot,
      startsAt: '2027-01-12T08:00:00.000Z',
      endsAt: '2027-01-12T09:00:00.000Z',
      attendees: 5,
    });
    expect(crowded.status).toBe(422);
    expect(crowded.body).toMatchObject({ fieldErrors: { attendees: expect.any(String) } });

    const night = await call('POST', '/bookings', {
      ...slot,
      startsAt: '2027-01-12T20:00:00.000Z',
      endsAt: '2027-01-12T21:00:00.000Z',
    });
    expect(night.status).toBe(422);
    expect(night.body).toMatchObject({ fieldErrors: { startsAt: expect.any(String) } });

    expect(
      (await call('POST', `/bookings/${booking.id}/status`, { status: 'completed' })).status,
    ).toBe(409);
    expect(
      (await call('POST', `/bookings/${booking.id}/status`, { status: 'confirmed' })).status,
    ).toBe(200);

    const bulk = await call('POST', '/bookings/bulk', {
      ids: [booking.id, 'bk_missing'],
      action: 'cancel',
    });
    expect(bulk.body).toEqual({
      updated: [booking.id],
      failed: [{ id: 'bk_missing', reason: 'Booking not found' }],
    });
  });

  it('builds a dashboard in the contract shape', async () => {
    const res = await call('GET', '/dashboard?date=2026-10-14');
    expect(res.status).toBe(200);
    expect(() => dashboardSchema.parse(res.body)).not.toThrow();
  });
});
