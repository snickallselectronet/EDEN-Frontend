import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Auth0Provider } from "@auth0/auth0-react";
import App from "./App.tsx";
import "bootstrap/dist/css/bootstrap.css";
import "./App.css";

import { Font } from "@react-pdf/renderer";

import calibriRegular from "./assets/Fonts/Calibri/calibri.ttf";
import calibriBold from "./assets/Fonts/Calibri/calibrib.ttf";
import cambriaBold from "./assets/Fonts/Cambria/cambriab.ttf";


let fontsLoaded = false;

// Helper to convert imported font to data URI
async function loadFontAsDataURI(fontModule: any): Promise<string> {
  const response = await fetch(fontModule);
  const blob = await response.blob();
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}

// Register fonts with data URIs (runs once at startup)
async function initializeFonts() {
  // Guard: Only load fonts once
  if (fontsLoaded) {
    return;
  }

  fontsLoaded = true;

  try {
    const [calibriReg, calibriB, cambriaB] = await Promise.all([
      loadFontAsDataURI(calibriRegular),
      loadFontAsDataURI(calibriBold),
      loadFontAsDataURI(cambriaBold),
    ]);

    Font.register({
      family: "Calibri",
      fonts: [
        { src: calibriReg },
        { src: calibriB, fontWeight: "bold" },
      ],
    });

    Font.register({
      family: "Cambria",
      fonts: [{ src: cambriaB, fontWeight: "bold" }],
    });

  } catch (error) {
    console.error("Error loading fonts:", error);
    fontsLoaded = false; // Reset on error so it can retry
  }
}

// Initialize fonts before rendering
initializeFonts();

// Environment variables
const domain = import.meta.env.VITE_AUTH0_DOMAIN as string;
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID as string;
const callback = import.meta.env.VITE_AUTH0_CALLBACK as string;
const audience = import.meta.env.VITE_AUTH0_AUDIENCE as string;

// Root entrypoint
ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <Auth0Provider
    domain={domain}
    clientId={clientId}
    authorizationParams={{
      redirect_uri: callback,
      audience,
      scope: "openid profile email",
    }}
  >
    <BrowserRouter basename={import.meta.env.VITE_BASE_URL_FRONTEND || ""}>
      <App />
    </BrowserRouter>
  </Auth0Provider>
);