// Configure constants for backend endpoints in one place.
// Uses env vars so you can switch between localhost and the dev server
// without touching code.
//
// .env.local example:
//   VITE_BASE_URL_BACKEND=http://localhost:8000
//   VITE_BACKEND_API_PREFIX=         (leave empty for localhost)
//
// .env.dev example:
//   VITE_BASE_URL_BACKEND=https://dev.electronetgroup.nz
//   VITE_BACKEND_API_PREFIX=/portalapi

const BACKEND_BASE_URL =
  import.meta.env.VITE_BASE_URL_BACKEND || "http://localhost:8000";

const BACKEND_API_PREFIX =
  import.meta.env.VITE_BACKEND_API_PREFIX || "";

// Helper to join base + prefix safely
const withPrefix = (path: string) =>
  `${BACKEND_BASE_URL}${BACKEND_API_PREFIX}${path}`;

// ---------------- Public helpers ----------------

// Testdata routes (existing pattern)
export const API_URL = (name: string) => withPrefix(`/api/testdata/${name}/`);

// S3 presigned URL helper
export const S3_photoUrl = (name: string) =>
  withPrefix(`/s3-presigned-url/${name}/`);

// Base host (useful where you construct absolute links)
export const host_url = withPrefix(`/`);

// NEW: QA endpoint (replaces old UpdateQA)
// Backend view: /api/QA_view/  (POST)
export const QA_URL = () => withPrefix(`/api/QA_view/`);
