"use client";

import { useState, useCallback, useEffect } from "react";
import { MapPin, Crosshair } from "lucide-react";
import dynamic from "next/dynamic";
import type { ComponentType } from "react";

interface MapViewProps {
  center: [number, number];
  pin: { lat: number; lon: number } | null;
  onMapClick: (lat: number, lon: number) => void;
}

const MapView = dynamic(
  () => import("@/features/chat/components/map-view") as Promise<{ default: ComponentType<MapViewProps> }>,
  { ssr: false },
);

interface LocationPickerProps {
  onSelect: (lat: number, lon: number) => void;
  geoError?: string | null;
  onRetryGeo?: () => void;
}

const DEFAULT_CENTER: [number, number] = [40.7128, -74.006]; // NYC

export function LocationPicker({ onSelect, geoError, onRetryGeo }: LocationPickerProps) {
  const [pin, setPin] = useState<{ lat: number; lon: number } | null>(null);
  const [showMap, setShowMap] = useState(false);

  const handleMapClick = useCallback((lat: number, lon: number) => {
    setPin({ lat, lon });
  }, []);

  const handleConfirm = useCallback(() => {
    if (pin) {
      onSelect(pin.lat, pin.lon);
    }
  }, [pin, onSelect]);

  if (!showMap) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <div className="rounded-full bg-zinc-100 p-4 dark:bg-zinc-800">
          <MapPin size={32} className="text-zinc-400" />
        </div>
        <div>
          <h2 className="mb-1 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Set Your Location
          </h2>
          <p className="mb-2 text-sm text-zinc-500 dark:text-zinc-400">
            tile-chatter needs your location to find your local chat room.
          </p>
          {geoError && (
            <p className="mb-2 text-xs text-amber-600 dark:text-amber-400">
              GPS unavailable: {geoError}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2 w-full max-w-xs">
          {onRetryGeo && (
            <button
              onClick={onRetryGeo}
              className="flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 dark:bg-zinc-100 dark:text-zinc-900"
            >
              <Crosshair size={16} />
              Use GPS
            </button>
          )}
          <button
            onClick={() => setShowMap(true)}
            className="flex items-center justify-center gap-2 rounded-xl border border-zinc-300 px-6 py-2.5 text-sm font-medium text-zinc-700 transition-opacity hover:opacity-90 dark:border-zinc-600 dark:text-zinc-300"
          >
            <MapPin size={16} />
            Pick on Map
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-3" style={{ minHeight: "calc(100vh - 10rem)" }}>
      <div className="text-center">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Tap the map to set your location
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {pin
            ? `Selected: ${pin.lat.toFixed(4)}, ${pin.lon.toFixed(4)}`
            : "Tap anywhere on the map"}
        </p>
      </div>

      <div className="relative flex-1 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-700" style={{ minHeight: "300px" }}>
        <MapView
          center={DEFAULT_CENTER}
          pin={pin}
          onMapClick={handleMapClick}
        />
      </div>

      <button
        onClick={handleConfirm}
        disabled={!pin}
        className="rounded-xl bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900"
      >
        Join Room Here
      </button>
    </div>
  );
}
