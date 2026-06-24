// ------------------------------------------------------------
// App.tsx
// ------------------------------------------------------------
// Main authenticated React app for the ElectroNet client portal.
// Handles:
// - Authentication via Auth0
// - Data fetching and navigation
// - QA Panel logic
// - Route handling (BrowserRouter is defined in main.tsx)
// ------------------------------------------------------------

import { useEffect, useMemo, useState } from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { CategoryScale } from "chart.js";
import { PDFViewer } from "@react-pdf/renderer";
import Chart from "chart.js/auto";
import Modal from "react-bootstrap/Modal";

// Auth
import { useAuth0 } from "@auth0/auth0-react";

// Utilities
import { useApi } from "./utilities/api";

// Components
import Summary from "./components/SummaryComponent";
import VTContent from "./components/VTComponent";
import EPRContent from "./components/EPRComponent";
import ContinuityContent from "./components/ContinuityComponent";
import CTVTInspectionContent from "./components/CTVTInspectionComponent";
import SectionHider from "./components/SectionHiderComponent";
import TouchAndStepContent from "./components/TouchAndStepComponent";
import PDFComponent from "./components/PDFComponent";
import CurrentDistContent from "./components/CurrentDistComponent";
import VisualInspectionContent from "./components/VisualInspectionComponent";
import MitigationContent from "./components/MitigationComponent";
import Header from "./components/Header";
import QAPanel from "./components/QAPanel";
import AdminProcessing from "./components/AdminProcessing";

// Constants
import { API_URL, QA_URL } from "../src/constants";
const BASE_URL = import.meta.env.VITE_BASE_URL_FRONTEND as string;

// Chart setup
Chart.register(CategoryScale);

// ------------------------------------------------------------
// Types and constants
// ------------------------------------------------------------

interface SiteMapping {
  [key: string]: string;
}

const QA_DEFAULT = {
  revision: "Rev00",
  qa_step: "prepare",
  preparer: "",
  prepare_date: "",
  reviewer: "",
  review_date: "",
  review_complete: "no",
  approver: "",
  approve_date: "",
  approve_complete: "no",
  comments: [] as any[],
  qa_log: [] as any[],
};

// ------------------------------------------------------------
// AuthenticatedApp
// ------------------------------------------------------------
function AuthenticatedApp() {
  const api = useApi();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth0();

  // Extract Auth0 user claims
  const company =
    user?.["https://electronetclientportal.com/user/company"] ?? null;
  const roles: string[] =
    user?.["https://electronetclientportal.com/user/roles"] ?? [];
  const userName =
    user?.["https://electronetclientportal.com/user/name"] ??
    user?.name ??
    user?.email ??
    null;

  // Role-based permissions
  const userRole = roles.includes("ELECTRONET_ADMIN")
    ? "Admin"
    : roles.includes("ELECTRONET_ADMIN_APPROVER")
      ? "Approver"
      : roles.includes("ELECTRONET_ADMIN_REVIEWER")
        ? "Reviewer"
        : "Viewer";

  const canSeeQA =
    roles.includes("ELECTRONET_ADMIN") ||
    roles.includes("ELECTRONET_ADMIN_APPROVER") ||
    roles.includes("ELECTRONET_ADMIN_REVIEWER");

  // ------------------------------------------------------------
  // State variables
  // ------------------------------------------------------------
  const [sitesLoading, setLoading] = useState(true);
  const [isLoadedbutnotSelected, setLoadedbutnotSelected] = useState(false);
  const [ResponseObj, setResponseObj] = useState<any>();
  const [AllSites, setAllSites] = useState<any[]>();
  const [siteClientMap, setSiteClientMap] = useState<SiteMapping>({});

  // Section visibility toggles
  const [VThidden, setVTHidden] = useState(true);
  const [EPRhidden, setEPRHidden] = useState(true);
  const [TShidden, setTSHidden] = useState(true);
  const [Conhidden, setConHidden] = useState(true);
  const [CTInsphidden, setCTInspHidden] = useState(true);
  const [CurrentDisthidden, setCurrentDistHidden] = useState(true);
  const [VisInsphidden, setVisInspHidden] = useState(true);
  const [MitigationHidden, setMitigationHidden] = useState(true);

  // UI + QA states
  const [modalIsOpen, setIsOpen] = useState(false);
  const [qaObject, setQaObject] = useState(QA_DEFAULT);
  const [isMapCapturing, setMapCapturing] = useState(false);
  const [methIsOpen, setMethOpen] = useState(false);

  const generateMeth = () => setMethOpen(true);
  const generatePDF = () => setIsOpen(true);

  // ------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------
  const handleClose = () => setIsOpen(false);
  const handleMethClose = () => setMethOpen(false);

  function resetStates() {
    setVTHidden(true);
    setEPRHidden(true);
    setTSHidden(true);
    setConHidden(true);
    setCTInspHidden(true);
    setCurrentDistHidden(true);
    setVisInspHidden(true);
    setMitigationHidden(true);
    setIsOpen(false);
  }

  const pdfDocument = useMemo(() => {
    if (!ResponseObj) {
      return undefined;
    }
    return (
      <PDFComponent
        ResponseObj={ResponseObj}
        VThidden={VThidden}
        EPRhidden={EPRhidden}
        TShidden={TShidden}
        Conhidden={Conhidden}
        CTInsphidden={CTInsphidden}
        VisInsphidden={VisInsphidden}
        CurrentDisthidden={CurrentDisthidden}
        Mitigationhidden={MitigationHidden}
        InjectionMethodhidden={true}
        apiClient={api.client}
      />
    );
  }, [
    ResponseObj,
    VThidden,
    EPRhidden,
    TShidden,
    Conhidden,
    CTInsphidden,
    VisInsphidden,
    CurrentDisthidden,
    MitigationHidden,
  ]);

  // ------------------------------------------------------------
  // QA Update Handler
  // ------------------------------------------------------------
  const handleQAUpdate = async (updatedQA: any) => {
    setQaObject(updatedQA);

    setResponseObj((prev: any) => {
      if (!prev) return prev;
      const nextQaWrapper = [JSON.stringify({ qa: updatedQA })];
      return { ...prev, qaStatus: nextQaWrapper };
    });

    try {
      const payload = {
        site: ResponseObj?.name,
        qa: updatedQA,
        metadata: location.state?.metadata || {},
      };
      await api.post(QA_URL(), payload);
    } catch (error) {
      console.error("Error updating QA Information:", error);
      alert("Error updating QA information. Please try again.");
    }
  };

  // ------------------------------------------------------------
  // Fetch all sites
  // ------------------------------------------------------------
  useEffect(() => {
    api
      .get(API_URL("GetAll"))
      .then((response) => {
        setAllSites(response);
        const mapping: SiteMapping = {};
        response.forEach(
          (item: [string, string]) => (mapping[item[0]] = item[1]),
        );
        setSiteClientMap(mapping);
        setLoadedbutnotSelected(true);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching sites:", error);
        setLoading(false);
      });
  }, [api]);

  // ------------------------------------------------------------
  // Derive route data
  // ------------------------------------------------------------
  const derivedRouteState = useMemo(() => {
    const state = location.state as {
      siteName: string;
      client: string;
      metadata?: any;
    } | null;
    if (state?.siteName && state?.client) return state;
    const segments = location.pathname.split("/").filter(Boolean);
    if (segments.length === 0) return null;
    const siteName = segments[0];
    const client = siteClientMap[siteName];
    if (!client) return null;
    return { siteName, client };
  }, [location.state, location.pathname, siteClientMap]);

  // ------------------------------------------------------------
  // Fetch data for selected site
  // ------------------------------------------------------------
  useEffect(() => {
    if (location.pathname === "/") {
      setLoadedbutnotSelected(true);
      setResponseObj(undefined);
      resetStates();
      return;
    }

    if (Object.keys(siteClientMap).length === 0) return;

    const routeState = derivedRouteState;
    if (!routeState) {
      setLoadedbutnotSelected(true);
      setResponseObj(undefined);
      resetStates();
      return;
    }

    const { siteName, client, metadata } = routeState;
    setLoadedbutnotSelected(false);
    setLoading(true);
    resetStates();

    const params: any = { client };
    if (metadata) params.metadata = JSON.stringify(metadata);

    api
      .get(API_URL(siteName), { params })
      .then((response) => {
        setResponseObj(response);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error:", error);
        setLoading(false);
        setLoadedbutnotSelected(true);
      });
  }, [location.pathname, derivedRouteState, siteClientMap, api]);

  // ------------------------------------------------------------
  // Navigation handlers
  // ------------------------------------------------------------
  const handleSiteChange = (name: string, client: string, metadata?: any) => {
    if (name === "home") {
      setLoadedbutnotSelected(true);
      resetStates();
      navigate("/", { replace: true });
    } else {
      setLoadedbutnotSelected(false);
      setLoading(true);
      resetStates();
      navigate(`/${name}/`, { state: { siteName: name, client, metadata } });
    }
  };

  const handleGoToProcessing = () => navigate("/processing");
  // ------------------------------------------------------------
  // Render Section
  // ------------------------------------------------------------
  if (sitesLoading) {
    return (
      <>
        <h1 className="loading-screen">Loading Site...</h1>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <img width="20%" src={`${BASE_URL}ElectroNet_Blue.png`} />
        </div>
      </>
    );
  }
  console.log(ResponseObj);
  return (
    <>
      <Modal
        dialogClassName="pdf-modal"
        show={methIsOpen}
        onHide={handleMethClose}
      >
        <Modal.Header closeButton>
          <Modal.Title>Test Methodology</Modal.Title>
        </Modal.Header>
        <object
          data={`${BASE_URL}test_methodology.pdf`}
          type="application/pdf"
          width="100%"
          height="800px"
        ></object>
      </Modal>
      <Header
        handleSiteChange={handleSiteChange}
        AllSites={AllSites}
        userPermissions={userRole}
        toggleProcessing={handleGoToProcessing}
        showProcessing={false}
      />

      {isLoadedbutnotSelected ? (
        <div className="starting-screen">
          <img
            width="30%"
            src={`${BASE_URL}ElectroNet_Blue.png`}
            style={{ marginBottom: "20px" }}
          />
          <h2>Select Site</h2>
          <div className="scrollable-list" style={{ marginBottom: "20px" }}>
            {AllSites?.map((item: any, index: number) => {
              const siteName = item[0];
              const ownerName = item[1]; // Client Name
              const testDate = item[2];
              const revision = item[3];
              const metadata = item[5];

              // Standardize date format to NZ/International style (DD/MM/YYYY)
              const formattedDate = testDate
                ? new Date(testDate).toLocaleDateString("en-GB", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                  })
                : "No date";

              return (
                <button
                  onClick={() =>
                    handleSiteChange(siteName, ownerName, metadata)
                  }
                  className="list-button"
                  key={`${siteName}-${revision}-${index}`}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                      width: "100%",
                    }}
                  >
                    {/* 1. Site Name (Bold, 16px) */}
                    <span style={{ fontWeight: "bold", fontSize: "16px" }}>
                      {siteName}
                    </span>

                    {/* 2. Client Name (New line, smaller font, slightly lighter color) */}
                    <span
                      style={{
                        fontSize: "12px",
                        color: "rgba(255, 255, 255, 0.7)",
                        marginTop: "2px",
                      }}
                    >
                      Client: {ownerName}
                    </span>

                    {/* 3. Revision and Date */}
                    <div
                      style={{
                        display: "flex",
                        gap: "12px",
                        fontSize: "14px",
                        color: "#ffffffff",
                        marginTop: "4px",
                      }}
                    >
                      <span>{revision || "Rev00"}</span>
                      <span>•</span>
                      <span>{formattedDate}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          <button
            id="methodology_btn"
            onClick={generateMeth}
            style={{
              marginBottom: "2vh",
              padding: "8px 16px",
              border: "none",
              borderRadius: "6px",
              backgroundColor: "rgb(0, 95, 163)",
              color: "white",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Test Methodology
          </button>
        </div>
      ) : (
        <>
          <Modal
            dialogClassName="pdf-modal"
            show={modalIsOpen}
            onHide={handleClose}
            size="lg"
          >
            <Modal.Header closeButton>
              <Modal.Title>Earth Testing Report</Modal.Title>
            </Modal.Header>
            <PDFViewer style={{ width: "100%", height: "800px" }}>
              {pdfDocument}
            </PDFViewer>
          </Modal>

          {ResponseObj && (
            <div className="main-container">
              <SectionHider
                ResponseObj={ResponseObj}
                toggleVT={() => setVTHidden((v) => !v)}
                toggleEPR={() => setEPRHidden((v) => !v)}
                toggleTS={() => setTSHidden((v) => !v)}
                toggleCon={() => setConHidden((v) => !v)}
                toggleCTInsp={() => setCTInspHidden((v) => !v)}
                toggleCurrentDist={() => setCurrentDistHidden((v) => !v)}
                toggleVisInsp={() => setVisInspHidden((v) => !v)}
                toggleMitigation={() => setMitigationHidden((v) => !v)}
                company={company}
              />

              {canSeeQA && (
                <QAPanel
                  siteName={ResponseObj.name}
                  currentUser={userName}
                  userRole={userRole}
                  onUpdateQA={handleQAUpdate}
                  qaStatus={ResponseObj.qaStatus}
                />
              )}

              <div className="content-container">
                <h1 className="page-title">
                  {ResponseObj.name} Substation Earth Testing Report
                </h1>

                <button
                  id="generate_btn"
                  onClick={generatePDF}
                  style={{
                    marginBottom: "2vh",
                    padding: "8px 16px",
                    border: "none",
                    borderRadius: "6px",
                    backgroundColor: "#004e9a",
                    color: "white",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Generate Report
                </button>
                <Summary rawData={ResponseObj} />
                {VThidden && (
                  <VTContent
                    rawData={ResponseObj.VTRecord}
                    injectedCurrent={ResponseObj.injected_I}
                  />
                )}
                {Object.keys(ResponseObj.CurrentDistRecord).length !== 0 &&
                  CurrentDisthidden && (
                    <CurrentDistContent
                      rawData={ResponseObj.CurrentDistRecord}
                    />
                  )}
                {EPRhidden && (
                  <EPRContent
                    rawData={ResponseObj.EPRRecord}
                    allData={ResponseObj}
                  />
                )}
                {TShidden && (
                  <TouchAndStepContent
                    rawData={ResponseObj.TSRecord}
                    faultDuration={ResponseObj.fault_s}
                    soilRes={ResponseObj.soil_R}
                    photoKey={ResponseObj.lres_key}
                    isMapCapturing={isMapCapturing}
                    setMapCapturing={setMapCapturing}
                  />
                )}
                {Object.keys(ResponseObj.ConRecord).length !== 0 &&
                  Conhidden && (
                    <ContinuityContent
                      rawData={ResponseObj.ConRecord}
                      photoKey={ResponseObj.lres_key}
                    />
                  )}
                {Object.keys(ResponseObj.CTInspRecord).length !== 0 &&
                  CTInsphidden && (
                    <CTVTInspectionContent
                      rawData={ResponseObj.CTInspRecord}
                      photoKey={ResponseObj.hres_key}
                    />
                  )}
                {Object.keys(ResponseObj.VisualInspectionRecord).length !== 0 &&
                  VisInsphidden && (
                    <VisualInspectionContent
                      rawData={ResponseObj.VisualInspectionRecord}
                      photoKey={ResponseObj.hres_key}
                    />
                  )}
                {(canSeeQA || ResponseObj.MitigationSelection.length !== 0) &&
                  MitigationHidden && (
                    <MitigationContent
                      site={ResponseObj.name}
                      tsData={ResponseObj.TSRecord}
                      conData={ResponseObj.ConRecord}
                      mitigationData={ResponseObj.MitigationSelection}
                      userPermissions={userRole ?? ""}
                      handleSiteChange={(siteName: string) => {
                        handleSiteChange(
                          siteName,
                          derivedRouteState!.client,
                          location.state?.metadata,
                        );
                      }}
                      metadata={location.state?.metadata}
                    />
                  )}
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}

// ------------------------------------------------------------
// App Wrapper
// ------------------------------------------------------------
function App() {
  const { isLoading, isAuthenticated, loginWithRedirect } = useAuth0();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      loginWithRedirect({ authorizationParams: { prompt: "login" } });
    }
  }, [isLoading, isAuthenticated, loginWithRedirect]);

  if (isLoading) {
    return (
      <>
        <h1 className="loading-screen">Loading User...</h1>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <img width="20%" src={`${BASE_URL}ElectroNet_Blue.png`} />
        </div>
      </>
    );
  }

  if (isAuthenticated) {
    return (
      <Routes>
        <Route path="/" element={<AuthenticatedApp />} />
        <Route path="/processing" element={<AdminProcessing />} />
        <Route path="/:siteName/*" element={<AuthenticatedApp />} />
      </Routes>
    );
  }

  return null;
}

export default App;
