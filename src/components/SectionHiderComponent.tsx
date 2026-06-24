import { useState, ChangeEvent } from "react";
import Switch from "@mui/material/Switch";

interface Props {
  ResponseObj: any;
  toggleVT: any;
  toggleEPR: any;
  toggleTS: any;
  toggleCon: any;
  toggleCTInsp: any;
  toggleCurrentDist: any;
  toggleVisInsp: any;
  toggleMitigation: any;
  // generatePDF: any;
  company: string;
}

function SectionHider({
  ResponseObj,
  toggleVT,
  toggleEPR,
  toggleTS,
  toggleCon,
  toggleCTInsp,
  toggleCurrentDist,
  toggleVisInsp,
  toggleMitigation,
  // generatePDF,
  company,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeStateVT, setActiveVT] = useState(true);
  const toggleActiveVT = () => {
    setActiveVT(!activeStateVT);
  };
  const [activeStateEPR, setActiveEPR] = useState(true);
  const toggleActiveEPR = () => {
    setActiveEPR(!activeStateEPR);
  };
  const [activeStateTS, setActiveTS] = useState(true);
  const toggleActiveTS = () => {
    setActiveTS(!activeStateTS);
  };
  const [activeStateCon, setActiveCon] = useState(true);
  const toggleActiveCon = () => {
    setActiveCon(!activeStateCon);
  };
  const [activeStateCTInsp, setActiveCTInsp] = useState(true);
  const toggleActiveCTInsp = () => {
    setActiveCTInsp(!activeStateCTInsp);
  };
  const [activeStateCurrentDist, setActiveCurrentDist] = useState(true);
  const toggleActiveCurrentDist = () => {
    setActiveCurrentDist(!activeStateCurrentDist);
  };
  const [activeStateVisInsp, setActiveVisInsp] = useState(true);
  const toggleActiveVisInsp = () => {
    setActiveVisInsp(!activeStateVisInsp);
  };
  const [activeStateMitigation, setActiveMitigation] = useState(true);
  const toggleActiveMitigation = () => {
    setActiveMitigation(!activeStateMitigation);
  };

  const [checkedVT, setCheckedVT] = useState(true);
  const [checkedEPR, setCheckedEPR] = useState(true);
  const [checkedTS, setCheckedTS] = useState(true);
  const [checkedCon, setCheckedCon] = useState(true);
  const [checkedCTInsp, setCheckedCTInsp] = useState(true);
  const [checkedCurrentDist, setCheckedCurrentDist] = useState(true);
  const [checkedVisInsp, setCheckedVisInsp] = useState(true);
  const [checkedMitigation, setCheckedMitigation] = useState(true);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const id = event.target.parentElement?.parentElement?.parentElement?.id ?? "";
    switch (id) {
      case "vt-hider":
        toggleVT();
        toggleActiveVT();
        setCheckedVT(event.target.checked);
        break;
      case "epr-hider":
        toggleEPR();
        toggleActiveEPR();
        setCheckedEPR(event.currentTarget.checked);
        break;
      case "ts-hider":
        toggleTS();
        toggleActiveTS();
        setCheckedTS(event.currentTarget.checked);
        break;
      case "con-hider":
        toggleCon();
        toggleActiveCon();
        setCheckedCon(event.currentTarget.checked);
        break;
      case "ct-insp-hider":
        toggleCTInsp();
        toggleActiveCTInsp();
        setCheckedCTInsp(event.currentTarget.checked);
        break;
      case "current-dist-hider":
        toggleCurrentDist();
        toggleActiveCurrentDist();
        setCheckedCurrentDist(event.currentTarget.checked);
        break;
      case "visual-inspection-hider":
        toggleVisInsp();
        toggleActiveVisInsp();
        setCheckedVisInsp(event.currentTarget.checked);
        break;
      case "mitigation-hider":
        toggleMitigation();
        toggleActiveMitigation();
        setCheckedMitigation(event.currentTarget.checked);
        break;
      default:
        break;
    }
  };

  const scrollTo = (ele: string) => {
    const element = document.getElementById(ele);
    if (element) {
      // Will scroll smoothly to the top of the selected section
      const headerOffset = 49;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition =
        elementPosition + window.pageYOffset - headerOffset;
      // element.scrollIntoView({ behavior: "smooth", block: "start" });
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

    return (
      <div className="nav-container-wrapper">
        <div 
          className={`nav-tab ${isOpen ? 'hidden' : ''}`}
          onClick={() => setIsOpen(true)}
        >
          <span>Navigation Menu</span>
        </div>
        <div 
          className={`nav-container ${isOpen ? 'open' : 'closed'}`}
        >
          <div 
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              padding: '10px',
              borderBottom: '1px solid #ccc'
            }}
          >
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#666'
              }}
            >
              ×
            </button>
          </div>
          <div className="nav-item">
            <div
              className={`nav-item-scroll ${activeStateVT ? "section-active" : ""}`}
              onClick={() => {
                scrollTo("vt-contents");
              }}
            >
            Earth Grid Impedance
          </div>
          <div className="nav-item-toggle" id="vt-hider">
            <Switch
              checked={checkedVT}
              onChange={handleChange}
              inputProps={{ "aria-label": "controlled" }}
              size="small"
            />
          </div>
        </div>
        {Object.keys(ResponseObj.CurrentDistRecord).length !== 0 && (
          <div className="nav-item">
            <div
              className={`nav-item-scroll ${
                activeStateCurrentDist ? "section-active" : ""
              }`}
              onClick={() => {
                scrollTo("current-dist-contents");
              }}
            >
              Current Distribution
            </div>
            <div className="nav-item-toggle" id="current-dist-hider">
              <Switch
                checked={checkedCurrentDist}
                onChange={handleChange}
                inputProps={{ "aria-label": "controlled" }}
                size="small"
              />
            </div>
          </div>
        )}
        <div className="nav-item">
          <div
            className={`nav-item-scroll ${
              activeStateEPR ? "section-active" : ""
            }`}
            onClick={() => {
              scrollTo("epr-contents");
            }}
          >
            EPR Contours
          </div>
          <div className="nav-item-toggle" id="epr-hider">
            <Switch
              checked={checkedEPR}
              onChange={handleChange}
              inputProps={{ "aria-label": "controlled" }}
              size="small"
            />
          </div>
        </div>
        <div className="nav-item">
          <div
            className={`nav-item-scroll ${activeStateTS ? "section-active" : ""}`}
            onClick={() => {
              scrollTo("touch-and-step-contents");
            }}
          >
            Touch and Step
          </div>
          <div className="nav-item-toggle" id="ts-hider">
            <Switch
              checked={checkedTS}
              onChange={handleChange}
              inputProps={{ "aria-label": "controlled" }}
              size="small"
            />
          </div>
        </div>
        {Object.keys(ResponseObj.ConRecord).length !== 0 && (
          <div className="nav-item">
            <div
              className={`nav-item-scroll ${
                activeStateCon ? "section-active" : ""
              }`}
              onClick={() => {
                scrollTo("continuity-contents");
              }}
            >
              Continuity
            </div>
            <div className="nav-item-toggle" id="con-hider">
              <Switch
                checked={checkedCon}
                onChange={handleChange}
                inputProps={{ "aria-label": "controlled" }}
                size="small"
              />
            </div>
          </div>
        )}
        {Object.keys(ResponseObj.CTInspRecord).length !== 0 && (
          <div className="nav-item">
            <div
              className={`nav-item-scroll ${
                activeStateCTInsp ? "section-active" : ""
              }`}
              onClick={() => {
                scrollTo("inspection-contents");
              }}
            >
              CT & VT Inspections
            </div>
            <div className="nav-item-toggle" id="ct-insp-hider">
              <Switch
                checked={checkedCTInsp}
                onChange={handleChange}
                inputProps={{ "aria-label": "controlled" }}
                size="small"
              />
            </div>
          </div>
        )}
        {ResponseObj.VisualInspectionRecord.length !== 0 && (
          <div className="nav-item">
            <div
              className={`nav-item-scroll ${
                activeStateVisInsp ? "section-active" : ""
              }`}
              onClick={() => {
                scrollTo("visual-inspection-contents");
              }}
            >
              Earth Connection Visual Inspections
            </div>
            <div className="nav-item-toggle" id="visual-inspection-hider">
              <Switch
                checked={checkedVisInsp}
                onChange={handleChange}
                inputProps={{ "aria-label": "controlled" }}
                size="small"
              />
            </div>
          </div>
        )}
        {(company === "ElectroNet" ||
          ResponseObj.MitigationSelection.length !== 0) && (
          <div className="nav-item">
            <div
              className={`nav-item-scroll ${
                activeStateMitigation ? "section-active" : ""
              }`}
              onClick={() => {
                scrollTo("mitigation-contents");
              }}
            >
              Mitigation
            </div>
            <div className="nav-item-toggle" id="mitigation-hider">
              <Switch
                checked={checkedMitigation}
                onChange={handleChange}
                inputProps={{ "aria-label": "controlled" }}
                size="small"
              />
            </div>
          </div>
        )}
        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "center",
            padding: "1em",
          }}
        >
          {/* <button onClick={generatePDF} id="generate_btn">
            Generate Report
          </button> */}
        </div>
      </div>
    </div>
  );
}

export default SectionHider;