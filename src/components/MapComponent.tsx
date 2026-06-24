// ------------------------------------------------------------
// MapComponent.tsx
// ------------------------------------------------------------
// This component renders an interactive map using Leaflet via react-leaflet.
// It displays test locations (gpsData) and optionally captures the map view
// for inclusion in PDF reports. When markers are clicked, associated photos
// are fetched securely via Auth0-protected endpoints.
// ------------------------------------------------------------

import ImageWithPresignedUrl from "./ImageWithPresignedUrl";
import {
  MapContainer,
  CircleMarker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import axios from "axios";
import { host_url } from "../constants";
import L from "leaflet";
import { useAuthenticatedApi } from "../hooks/useAuth"; // Auth0-based API helper

/* --------------------------- Type Definitions --------------------------- */

/**
 * Represents a single GPS point displayed on the map.
 */
interface GpsPoint {
  id?: string;
  text: string | number;
  lat: number;
  long: number;
  colour: string;
  photo_key: string;
}

/**
 * Component props for the map.
 */
interface Props {
  gpsData: GpsPoint[];
  isMapCapturing?: boolean; // If true, disables interactive controls and overlays static markers for capture.
  setMapCapturing?: (capturing: boolean) => void;
}

/* -------------------------- Map Event Handler -------------------------- */
/**
 * Handles Leaflet map events (movement, zoom, readiness).
 * Updates marker pixel positions whenever the map view changes.
 */
function MapEventHandler({
  onMapReady,
  gpsData,
  updateMarkerPositions,
  isMapCapturing,
}: {
  onMapReady: () => void;
  gpsData: GpsPoint[];
  updateMarkerPositions: (positions: any[]) => void;
  isMapCapturing: boolean;
}) {
  const map = useMap();
  const positionsCalculated = useRef(false);

  // --- MODIFIED SECTION ---
  // Use a ref to hold the latest gpsData. This prevents the effect
  // on line 121 from re-running just because the gpsData array
  // is a new object in memory on every render.
  const gpsDataRef = useRef(gpsData);
  useEffect(() => {
    gpsDataRef.current = gpsData;
  }, [gpsData]);
  // --- END MODIFIED SECTION ---


  // Register the Leaflet map on ready and ensure sizing is correct.
  useEffect(() => {
    const handleLoad = () => {
      const container = map.getContainer().parentElement;
      if (container) {
        (container as any)._leaflet_map = map;
        map.invalidateSize();
        onMapReady();
      }
    };
    map.whenReady(handleLoad);

    return () => {
      const container = map.getContainer().parentElement;
      if (container) delete (container as any)._leaflet_map;
    };
  }, [map, onMapReady]);

  // Center the map when capturing mode is active.
  useEffect(() => {
    if (isMapCapturing && gpsData.length > 0) {
      const center = gpsData
        .reduce(
          (acc: number[], item) => {
            acc[0] += item.lat;
            acc[1] += item.long;
            return acc;
          },
          [0, 0]
        )
        .map((sum) => sum / gpsData.length);

      map.setView([center[0], center[1]], 18, { animate: false });
      map.invalidateSize();
    }
  }, [isMapCapturing, gpsData, map]);

  // Calculate pixel positions of markers on movement or zoom.
  // --- MODIFIED SECTION ---
  useEffect(() => {
    const calculatePositions = () => {
      // Read the latest data from the ref
      const currentGpsData = gpsDataRef.current;
      const positions = currentGpsData.map((item) => {
        const latLng = L.latLng(item.lat, item.long);
        const point = map.latLngToContainerPoint(latLng);
        return { ...item, pixelPosition: point };
      });
      updateMarkerPositions(positions);
    };

    calculatePositions();
    positionsCalculated.current = true;

    map.on("moveend", calculatePositions);
    map.on("zoomend", calculatePositions);

    return () => {
      map.off("moveend", calculatePositions);
      map.off("zoomend", calculatePositions);
    };
  }, [map, updateMarkerPositions]); // <-- Removed gpsData from dependencies
  // --- END MODIFIED SECTION ---

  return null;
}

/* --------------------------- Main Map Component --------------------------- */
function MapComponent({ gpsData, isMapCapturing = false }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [markerPositions, setMarkerPositions] = useState<any[]>([]);

  // Calculate the geographic center of all points.
  const pointsCentre = useMemo(() => {
    if (gpsData.length === 0) return [0, 0];
    return gpsData
      .reduce(
        (acc: number[], item) => {
          acc[0] += item.lat;
          acc[1] += item.long;
          return acc;
        },
        [0, 0]
      )
      .map((sum) => sum / gpsData.length);
  }, [gpsData]);

  const handleMapReady = useCallback(() => setIsMapReady(true), []);
  const updateMarkerPositions = useCallback(
    (positions: any[]) => setMarkerPositions(positions),
    []
  );

  return (
    <div
      className={`map ${isMapCapturing ? "hide-controls" : ""}`}
      data-rendertype="map"
      data-ready={isMapReady}
      ref={containerRef}
      style={{ width: "100%", height: "500px", position: "relative" }}
    >
      {/* Base map container using Google Satellite imagery */}
      <MapContainer
        center={[pointsCentre[0], pointsCentre[1]]}
        zoom={18}
        scrollWheelZoom={false}
        style={{ width: "100%", height: "100%" }}
      >
        <MapEventHandler
          onMapReady={handleMapReady}
          gpsData={gpsData}
          updateMarkerPositions={updateMarkerPositions}
          isMapCapturing={isMapCapturing}
        />
        <TileLayer
          url="https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
          maxZoom={20}
          subdomains={["mt1", "mt2", "mt3"]}
        />

        {/* Display interactive markers when not capturing */}
        {!isMapCapturing &&
          gpsData.map((item: GpsPoint, index: number) => (
            <CircleMarker
              key={`marker-${item.id || item.text || "unknown"}-${index}`}
              center={[item.lat, item.long]}
              color={item.colour}
              radius={5.5}
            >
              <Popup>
                <MarkerPopupContent item={item} />
              </Popup>
            </CircleMarker>
          ))}
      </MapContainer>

      {/* Static marker overlay for screenshots / PDF capture */}
      {isMapCapturing && isMapReady && markerPositions.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            zIndex: 1000,
          }}
          className="marker-overlay"
        >
          {markerPositions.map((item, index: number) => (
            <div
              key={`overlay-${item.id || item.text || "unknown"}-${index}`}
              style={{
                position: "absolute",
                left: `${item.pixelPosition.x}px`,
                top: `${item.pixelPosition.y}px`,
                width: "14px",
                height: "14px",
                marginLeft: "-7px",
                marginTop: "-7px",
                borderRadius: "50%",
                backgroundColor: "rgba(255, 0, 0, 0.35)",
                border: "3px solid red",
                pointerEvents: "none",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------ Marker Popup Component ------------------------ */
/**
 * Displays an image popup for each GPS marker.
 * Fetches a secure, encrypted URL via an Auth0-protected endpoint.
 */
function MarkerPopupContent({ item }: { item: GpsPoint }) {
  const { imageUrl } = ImageWithPresignedUrl(item.photo_key);
  const [proxyUrl, setProxyUrl] = useState("");
  const { getAuthHeaders, isReady } = useAuthenticatedApi(); // Authenticated API headers

  useEffect(() => {
    const fetchEncryptedUrl = async () => {
      if (!isReady || !imageUrl) return;
      try {
        // Include the Auth0 Bearer token in request headers
        const headers = await getAuthHeaders();
        const response = await axios.get(`${host_url}generate-encrypted-url/`, {
          params: { url: imageUrl },
          headers,
        });

        // Build a proxied image URL to serve securely
        setProxyUrl(
          `${host_url}image-proxy/?url=${encodeURIComponent(
            response.data.encrypted_url
          )}`
        );
      } catch (error) {
        console.error("Error fetching encrypted URL:", error);
      }
    };

    fetchEncryptedUrl();
  }, [imageUrl, isReady]); // <-- This is the fix from the first loop

  return (
    <div style={{ width: "250px" }}>
      <p>Measurement: {item.text}</p>
      {proxyUrl && (
        <img
          src={proxyUrl}
          alt="No Picture on Record"
          style={{
            width: "100%",
            height: "auto",
            pointerEvents: "none",
            userSelect: "none",
          }}
          onContextMenu={(e) => e.preventDefault()}
          draggable="false"
        />
      )}
    </div>
  );
}

export default MapComponent;