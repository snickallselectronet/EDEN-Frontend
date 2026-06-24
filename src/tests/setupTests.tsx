// src/tests/setupTests.tsx
import "@testing-library/jest-dom";
import { afterEach, vi } from "vitest";

/* -------------------- Global DOM stubs -------------------- */

// Silence jsdom’s “Not implemented: window.alert”
vi.spyOn(window, "alert").mockImplementation(() => {});

// matchMedia polyfill (some UI libs rely on it)
if (!window.matchMedia) {
  window.matchMedia = () => ({
    matches: false,
    media: "",
    onchange: null,
    addListener: () => {},            // deprecated but still used by some libs
    removeListener: () => {},         // deprecated but still used by some libs
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}

// rAF/cAF polyfill (animations, charts, etc.)
if (!globalThis.requestAnimationFrame) {
  globalThis.requestAnimationFrame = (cb: FrameRequestCallback) =>
    setTimeout(cb, 0) as unknown as number;
  globalThis.cancelAnimationFrame = (id: number) => clearTimeout(id);
}

/* -------------------- Library mocks -------------------- */

// html2canvas (used by PDF/screenshot flows)
vi.mock("html2canvas", () => ({
  default: async () => ({ toDataURL: () => "data:image/png;base64,fake" }),
}));

// Auth (adjust/remove if not used)
try {
  vi.mock("@auth0/auth0-react", () => ({
    useAuth0: () => ({
      isLoading: false,
      isAuthenticated: true,
      user: { name: "Test User", email: "test@example.com" },
      loginWithRedirect: vi.fn(),
      logout: vi.fn(),
    }),
  }));
} catch {
  /* ignore if not installed/used */
}

// Leaflet + react-leaflet — only what your app calls (harmless if unused)
try {
  vi.mock("react-leaflet", () => ({
    MapContainer: ({ children }: any) => <div data-testid="map">{children}</div>,
    TileLayer: () => null,
    CircleMarker: ({ children }: any) => <div data-testid="marker">{children}</div>,
    Popup: ({ children }: any) => <div>{children}</div>,
    useMap: () => ({
      setView: vi.fn(),
      invalidateSize: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
      getContainer: () => ({ parentElement: {} }),
      whenReady: (cb: () => void) => cb(),
      latLngToContainerPoint: vi.fn(() => ({ x: 0, y: 0 })),
    }),
  }));

  vi.mock("leaflet", () => ({
    default: {
      latLng: (lat: number, lng: number) => ({ lat, lng }),
      icon: () => ({}),
    },
    latLng: (lat: number, lng: number) => ({ lat, lng }),
    icon: () => ({}),
  }));
} catch {
  /* ignore if not installed/used */
}

/**
 * axios — global lightweight mock.
 * Ensures components using axios/axios.create never hit the network.
 * Per-test, do: `axios.post.mockResolvedValueOnce(...)` or `.mockRejectedValueOnce(...)`.
 */
vi.mock("axios", () => {
  const m: any = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  };
  m.create = vi.fn(() => m);
  return { default: m };
});

/* -------------------- Test cleanup -------------------- */

afterEach(() => {
  vi.clearAllMocks();
  vi.clearAllTimers();
});
