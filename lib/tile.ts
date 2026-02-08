import { OpenLocationCode } from "open-location-code";

const olc = new OpenLocationCode();

const SLOT_DURATION_MS = 30 * 60 * 1000; // 30 minutes
const MESSAGE_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

export function latLonToTile(lat: number, lon: number): string {
  const code = olc.encode(lat, lon, 6);
  return code;
}

export function getCurrentSlot(): string {
  return String(Math.floor(Date.now() / SLOT_DURATION_MS));
}

export function getSlotExpiry(slot: string): Date {
  const slotNum = parseInt(slot, 10);
  return new Date((slotNum + 1) * SLOT_DURATION_MS);
}

export async function computeRoomHash(tile: string, slot: string): Promise<string> {
  const data = new TextEncoder().encode(tile + slot);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function computeRoomHashSync(tile: string, slot: string): string {
  const { createHash } = require("node:crypto");
  return createHash("sha256").update(tile + slot).digest("hex");
}

export function getNeighborTiles(tile: string): string[] {
  try {
    const area = olc.decode(tile);
    const lat = area.latitudeCenter;
    const lon = area.longitudeCenter;
    const latStep = area.latitudeHi - area.latitudeLo;
    const lonStep = area.longitudeHi - area.longitudeLo;

    const offsets = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],           [0, 1],
      [1, -1],  [1, 0],  [1, 1],
    ];

    return offsets.map(([dLat, dLon]) => {
      const nLat = lat + dLat * latStep;
      const nLon = lon + dLon * lonStep;
      return olc.encode(nLat, nLon, 6);
    });
  } catch {
    return [];
  }
}

export function distanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export { SLOT_DURATION_MS, MESSAGE_TTL_MS };
