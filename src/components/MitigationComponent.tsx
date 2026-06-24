// Core React & Third-party Libraries
import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  Carousel,
  Modal,
  Button,
  Form,
  InputGroup,
  Alert,
} from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import DOMPurify from "dompurify"; // Used for sanitizing HTML before rendering

// API, Constants & Auth
import { API_URL } from "../../src/constants";
import { useAuth0 } from "@auth0/auth0-react";

// Environment variables
const BASE_URL = import.meta.env.VITE_BASE_URL_FRONTEND as string;

// --- Interface Definitions ---

/**
 * Props for the MitigationContent component.
 */
interface Props {
  /** The name of the current site. */
  site: string;
  /** Raw data for Touch and Step hazards. */
  tsData: any;
  /** Raw data for Continuity hazards. */
  conData: any;
  /** Existing mitigation data from the server. */
  mitigationData: any;
  /** The user's permission level (e.g., "Admin", "Viewer"). */
  userPermissions: string;
  /** Callback function to refetch site data after saving. */
  handleSiteChange: (site: string) => void;
  /** Site metadata object, passed through to the save endpoint. */
  metadata?: any;
}

/**
 * Represents a single hazard (from Touch/Step or Continuity).
 */
interface Hazard {
  number: string;
  name: string;
}

/**
 * Represents a predefined, selectable mitigation option.
 */
interface MitigationOption {
  name: string;
  images: string[];
  text?: string;
}

/**
 * Represents a mitigation option that has been "accepted" or "applied" by a user.
 * Extends the base option with user-supplied context.
 */
type AcceptedMitigation = MitigationOption & {
  additionalComments?: string;
  carouselIndex: number;
  appliedHazards: Hazard[];
};

// --- Constants ---

/**
 * A static list of all available mitigation options an Admin can choose from.
 */
const mitigationOptions: MitigationOption[] = [
  {
    name: "Stock Fence Isolation Section",
    images: [
      `${BASE_URL}isolation_stock_fence_1.png`,
      `${BASE_URL}isolation_stock_fence_2.png`,
      `${BASE_URL}isolation_section_stock_fence.png`,
    ],
    text: "The hazardous voltage measurements found on the stock fences can be mitigated by installing isolation sections along the span of the fence. Refer to the images below for examples of accepted stock fence isolation section installations.",
  },
  {
    name: "Security Fence Isolation Section",
    images: [
      `${BASE_URL}isolation_security_fence_1.png`,
      `${BASE_URL}isolation_security_fence_2.png`,
    ],
    text: "The hazardous voltage measurements found on the security fences can be mitigated by installing isolation sections along the span of the fence. Refer to the images below for examples of accepted security fence isolation section installations.",
  },
  {
    name: "Gradient Control Conductor",
    images: [
      `${BASE_URL}gradient_control_pole.png`,
      `${BASE_URL}gradient_control_transmission.jpg`,
    ],
    text: "A buried gradient control conductor can be used to mitigate hazardous touch voltages found on poles. Install the buried control conductor 1m beyond the edges of the asset and 0.5m deep. The conductor should be bonded back to the asset's local earthing.",
  },
  {
    name: "Asphalt Surface",
    images: [`${BASE_URL}asphalt.png`],
    text: "Install a 1.2 m wide, 50 mm thick layer of asphalt to increase the surface resistivity surrounding the equipment.",
  },
  {
    name: "Crushed Rock Surface",
    images: [`${BASE_URL}crushed_rock.png`],
    text: "Install a 1.2 m wide, 125±25 mm thick layer of crushed rock to increase the surface resistivity surrounding the equipment.",
  },
  {
    name: "FRP Floor Mesh",
    images: [`${BASE_URL}frp_floor_mesh_grate.png`],
    text: "Install <a href='https://frp.co.nz/fibreglass-product-range/regular-mesh/' target='_blank' rel='noopener noreferrer'>FRP Mesh</a> to insulate the personnel from conductive ground. This shall be installed with a minimum width of 1.2 m surrounding the equipment.",
  },
  {
    name: "FRP Handrail",
    images: [`${BASE_URL}frp_handrail.png`],
    text: "Replace handrails with a nonconductive variant, such as an <a href='https://www.treadwellgroup.co.nz/access-systems/handrails/' target='_blank' rel='noopener noreferrer'>FRP Handrail System</a> or equivalent.",
  },
  { name: "Continuity", images: [] },
  { name: "Buried Joints", images: [] },
  { name: "Other", images: [] },
];

/**
 * A component to display and (if Admin) manage mitigations for a report.
 */
function MitigationContent({
  site,
  tsData,
  conData,
  mitigationData,
  userPermissions,
  handleSiteChange,
  metadata,
}: Props) {
  // --- Hooks ---
  const { getAccessTokenSilently } = useAuth0();

   const canEditMitigations = ["Admin", "Reviewer", "Approver"].includes(userPermissions);
  // --- State ---
  // Modal UI state
  /** Controls the visibility of the "Add Mitigation" modal. */
  const [showModal, setShowModal] = useState(false);
  /** Holds the mitigation option currently selected in the "Add" modal. */
  const [selectedOption, setSelectedOption] = useState<MitigationOption | null>(
    null
  );
  /** Manages the text in the "Additional Comments" textarea in the modal. */
  const [additionalComments, setAdditionalComments] = useState("");
  /** Manages the active slide index for the carousel within the modal. */
  const [modalCarouselIndex, setModalCarouselIndex] = useState(0);

  // Main data state
  /** The master list of all mitigations applied to this report. */
  const [acceptedMitigations, setAcceptedMitigations] = useState<
    AcceptedMitigation[]
  >([]);
  /** Temporary state for tracking which hazards are checked in the modal. */
  const [selectedHazards, setSelectedHazards] = useState<Hazard[]>([]);

  // Modal filtering and validation state
  /** Manages the text in the hazard search/filter input within the modal. */
  const [searchTerm, setSearchTerm] = useState("");
  /** Controls the visibility of the "Please select a hazard" warning in the modal. */
  const [showWarning, setShowWarning] = useState(false);

  // Fullscreen image viewer state
  /** Holds the URL of the image to be displayed in the fullscreen overlay, or null if hidden. */
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  // Change tracking
  /** A boolean flag that tracks if any changes (add/remove) have been made. */
  const [mitigationChanged, setMitigationChanged] = useState(false);

  /**
   * Type guard to check if an object is a base MitigationOption.
   */
  const isMitigationOption = (x: any): x is MitigationOption =>
    !!x && typeof x.name === "string" && Array.isArray(x.images);

  /**
   * Helper function to ensure any object conforms to the AcceptedMitigation shape,
   * adding default values for missing fields.
   */
  const toAccepted = (
    m: MitigationOption | AcceptedMitigation
  ): AcceptedMitigation => ({
    name: m.name,
    images: Array.isArray(m.images) ? m.images : [],
    text: (m as any).text,
    additionalComments: (m as any).additionalComments ?? "",
    carouselIndex: (m as any).carouselIndex ?? 0,
    appliedHazards: (m as any).appliedHazards ?? [],
  });

  /**
   * Robustly parses the mitigation data from the server.
   * The server might send a JSON string, an array, or a wrapper object.
   * This function normalizes it into a clean AcceptedMitigation[].
   * @param input The raw `mitigationData` prop from the server.
   */
  const normalizeFromServer = (input: any): AcceptedMitigation[] => {
    if (!input) return [];
    let arr: any[] = [];
    const payload = input.mitigation ?? input; // Handle potential wrapper object

    if (Array.isArray(payload)) {
      arr = payload.filter((item: any) => item !== null);
    } else if (typeof payload === "string") {
      try {
        const parsed = JSON.parse(payload);
        if (Array.isArray(parsed))
          arr = parsed.filter((item: any) => item !== null);
      } catch {
        return []; // Return empty if JSON parsing fails
      }
    } else {
      return []; // Return empty for unknown data types
    }

    // Map the cleaned array to the full AcceptedMitigation shape
    return arr
      .map((m) =>
        isMitigationOption(m) ? toAccepted(m) : toAccepted(m as AcceptedMitigation)
      )
      .filter((m): m is AcceptedMitigation => !!m && typeof m.name === "string");
  };

  // --- Effects ---

  /**
   * Loads and normalizes the existing mitigation data when the component mounts
   * or when the `mitigationData` prop changes.
   *
   * It includes a `mitigationChanged` guard to prevent overwriting local,
   * unsaved changes with new data from the server.
   */
  useEffect(() => {
    if (mitigationChanged || !mitigationData) return;
    try {
      const normalized = normalizeFromServer(mitigationData);
      setAcceptedMitigations(normalized);
    } catch (err) {
      // console.error("Error processing mitigation data:", err);
      setAcceptedMitigations([]);
    }
  }, [mitigationData, mitigationChanged]); // Dependency on mitigationData

  // --- UI Handlers ---

  /**
   * Handles clicking a mitigation option from the "Add" list.
   * Opens the modal and pre-populates it with the selected option.
   */
  const handleOptionClick = (option: MitigationOption) => {
    setSelectedOption(option);
    setShowModal(true);
    setModalCarouselIndex(0);
    setSelectedHazards([]);
  };

  /**
   * Closes the "Add Mitigation" modal and resets all its temporary state.
   */
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedOption(null);
    setAdditionalComments("");
    setSelectedHazards([]);
    setShowWarning(false);
  };

  /**
   * Handles the "Accept Mitigation" button click in the modal.
   * Validates that at least one hazard is selected, then adds the new
   * mitigation to the `acceptedMitigations` state array.
   */
  const handleAcceptMitigation = () => {
    // Validation
    if (selectedHazards.length === 0) {
      setShowWarning(true);
      return;
    }

    if (selectedOption) {
      const newItem: AcceptedMitigation = {
        ...selectedOption,
        additionalComments,
        carouselIndex: 0,
        appliedHazards: selectedHazards,
      };
      setAcceptedMitigations((prev) => [...prev, newItem]);
      setMitigationChanged(true); // Flag that changes have been made
    }
    handleCloseModal();
  };

  /**
   * Removes an accepted mitigation from the list by its index.
   */
  const handleRemoveMitigation = (index: number) => {
    setAcceptedMitigations((prev) => prev.filter((_, i) => i !== index));
    setMitigationChanged(true); // Flag that changes have been made
  };

  /**
   * Toggles the selection of a hazard in the modal's checklist.
   */
  const handleHazardSelection = (hazard: Hazard) => {
    setSelectedHazards((prev) =>
      prev.some((h) => h.number === hazard.number)
        ? prev.filter((h) => h.number !== hazard.number)
        : [...prev, hazard]
    );
  };

  // --- Memoized Logic ---

  /**
   * Memoizes the list of filterable hazards from `tsData`.
   * This prevents re-filtering on every render, only updating when
   * the source data (`tsData`) or the `searchTerm` changes.
   */
  const filteredHazards = useMemo(() => {
    const filterHazards = (hazards: Hazard[]) =>
      hazards.filter(
        (hazard) =>
          String(hazard.number).toLowerCase().includes(searchTerm.toLowerCase()) ||
          hazard.name.toLowerCase().includes(searchTerm.toLowerCase())
      );

    return {
      Public: filterHazards(tsData.PA.hazards),
      Restricted: filterHazards(tsData.RA.hazards),
      Step: filterHazards(tsData.Step.hazards),
    };
  }, [tsData, searchTerm]);

  /**
   * Memoizes the list of filterable hazards from `conData`.
   */
  const highContinuity = useMemo(() => {
    const filterHazards = (hazards: Hazard[]) =>
      hazards.filter(
        (hazard) =>
          String(hazard.number).toLowerCase().includes(searchTerm.toLowerCase()) ||
          hazard.name.toLowerCase().includes(searchTerm.toLowerCase())
      );

    return {
      Continuity: filterHazards(conData.high),
    };
  }, [conData, searchTerm]);

  // --- API Handlers ---

  /**
   * Saves all accepted mitigations to the backend.
   * Sends the site, user permissions, mitigation array, and site metadata.
   */
  const handleSendMitigations = async () => {
    try {
      const token = await getAccessTokenSilently();
      await axios.post(
        API_URL("SaveMitigations"),
        {
          site,
          mitigations: acceptedMitigations,
          metadata: metadata,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert("Mitigations have been successfully saved.");
      setMitigationChanged(false);
      handleSiteChange(site); // Trigger a data refetch in the parent component
    } catch (error) {
      alert("There was an error saving the mitigations. Please try again.");
    }
  };

  // --- Render Helpers ---

  /**
   * Toggles the fullscreen image viewer.
   */
  const enterFullscreen = (imageSrc: string) => setFullscreenImage(imageSrc);
  const exitFullscreen = () => setFullscreenImage(null);

  /**
   * Renders either a single image or a multi-image carousel.
   * @param images Array of image URLs.
   * @param carouselIndex The current active index for the carousel.
   * @param setCarouselIndex Callback to update the carousel index.
   * @param id A unique ID for the carousel element.
   */
  const renderImages = (
    images: string[],
    carouselIndex: number,
    setCarouselIndex: (index: number) => void,
    id: string
  ) => {
    if (!images || images.length === 0) return null; // No images, render nothing

    // Render a single image if only one is provided
    if (images.length === 1) {
      return (
        <img
          className="d-block w-100"
          src={images[0]}
          alt="Mitigation"
          style={{
            maxHeight: "300px",
            objectFit: "contain",
            cursor: "pointer",
          }}
          onClick={() => enterFullscreen(images[0])}
        />
      );
    }

    // Render a carousel for multiple images
    return (
      <Carousel
        activeIndex={carouselIndex}
        onSelect={(index) => setCarouselIndex(index)}
        interval={null} // Disable auto-play
        data-bs-theme="dark" // Use dark controls
        controls={images.length >= 2}
        indicators={false}
        id={id}
      >
        {images.map((image, idx) => (
          <Carousel.Item key={idx}>
            <img
              className="d-block w-100"
              src={image}
              alt={`Slide ${idx}`}
              style={{
                maxHeight: "300px",
                objectFit: "contain",
                cursor: "pointer",
              }}
              onClick={() => enterFullscreen(image)}
            />
          </Carousel.Item>
        ))}
      </Carousel>
    );
  };

  /**
   * A sub-component for displaying an image in a fullscreen overlay.
   */
  const FullscreenImage = ({
    src,
    onClose,
  }: {
    src: string;
    onClose: () => void;
  }) => (
    <div
      style={{
        position: "fixed",
        top: "2.5%",
        left: "2.5%",
        width: "95%",
        height: "95%",
        backgroundColor: "white",
        border: "1px solid black",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
        borderRadius: "5px",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        className="btn-close"
        aria-label="Close"
        onClick={onClose}
        style={{ position: "fixed", top: "calc(5%)", right: "calc(5%)" }}
      ></button>
      <img
        src={src}
        alt="Fullscreen"
        style={{ maxWidth: "90%", maxHeight: "90%", objectFit: "contain" }}
      />
    </div>
  );

  /**
   * Sanitizes an HTML string and modifies all `<a>` tags to open in a new tab.
   * @param html The potentially unsafe HTML string.
   */
  const addTargetBlank = (html: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    doc.querySelectorAll("a").forEach((link) => {
      link.setAttribute("target", "_blank");
      link.setAttribute("rel", "noopener noreferrer");
    });
    return doc.body.innerHTML;
  };

  // --- Main Render ---

  return (
    <div id="mitigation-contents" className="content-section-container">
      <h2 className="section-title">Mitigation</h2>
      <div className="mitigation-section">
        {/* === Admin-only: Add Mitigation Section === */}
        {canEditMitigations && (
          <>
            <span style={{ fontWeight: "bold" }}>
              Add from the following mitigation options:
            </span>
            <div className="mitigation-scrollable-list">
              {mitigationOptions.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleOptionClick(option)}
                  className="mitigation-list-button"
                >
                  {option.name}
                </button>
              ))}
            </div>
          </>
        )}

        {/* === Accepted Mitigations List (Visible to all) === */}
        <div>
          {acceptedMitigations.map((mitigation, index) => (
            <div key={index} style={{ marginTop: "5px" }}>
              <div style={{ display: "flex", alignItems: "flex-start" }}>
                <h4 className="section-subtitle" style={{ marginRight: "25px", marginTop: 0 }}>{mitigation.name}</h4>
                {/* Admin-only: Remove Button */}
                {canEditMitigations && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleRemoveMitigation(index)}
                  >
                    Remove
                  </Button>
                )}
              </div>

              {/* Sanitized HTML text for the mitigation */}
              <p
                dangerouslySetInnerHTML={{
                  __html: addTargetBlank(
                    DOMPurify.sanitize(mitigation.text || "")
                  ),
                }}
              />

              {mitigation.additionalComments && (
                <p>
                  <strong>Additional Comments:</strong>{" "}
                  {mitigation.additionalComments}
                </p>
              )}

              {/* Two-column layout: Applied Hazards and Images */}
              <div className="mitigation-choices">
                <div
                  style={{ width: "50%", paddingLeft: "3px", paddingRight: "3px" }}
                >
                  <span>
                    This mitigation applies to the following measurements:
                  </span>
                  <table style={{ width: "100%" }}>
                    <thead>
                      <tr
                        style={{ borderBottom: "1px solid var(--en-blue)" }}
                      >
                        <th>ID</th>
                        <th>Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mitigation.appliedHazards.map((hazard) => (
                        <tr key={hazard.number + "-" + hazard.name}>
                          <td>{hazard.number}</td>
                          <td>{hazard.name}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ width: "50%", paddingLeft: "15px" }}>
                  {/* Render the image carousel for this specific mitigation */}
                  {renderImages(
                    mitigation.images,
                    mitigation.carouselIndex,
                    (newIndex) => {
                      // Update the carousel index in the main state
                      const updated = [...acceptedMitigations];
                      updated[index] = {
                        ...updated[index],
                        carouselIndex: newIndex,
                      };
                      setAcceptedMitigations(updated);
                    },
                    `mitigation-carousel-${index}` // Unique ID
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* === Admin-only: Unsaved Changes Alert === */}
        {canEditMitigations && mitigationChanged && (
          <Alert variant="success" className="mt-3">
            <Alert.Heading>Changes Made</Alert.Heading>
            <p>
              Changes have been made to mitigation. Would you like to save them?
            </p>
            <hr />
            <div className="d-flex justify-content-end">
              <Button
                onClick={handleSendMitigations}
                variant="outline-success"
              >
                Save
              </Button>
            </div>
          </Alert>
        )}
      </div>

      {/* === Add Mitigation Modal === */}
      <Modal show={showModal} onHide={handleCloseModal} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>{selectedOption?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {/* Sanitized HTML text for the selected option */}
          <p
            dangerouslySetInnerHTML={{
              __html: addTargetBlank(
                DOMPurify.sanitize(selectedOption?.text || "")
              ),
            }}
          />
          <div className="mitigation-choices">
            {/* Modal Column 1: Hazard Checklist */}
            <div
              style={{ width: "50%", paddingLeft: "3px", paddingRight: "3px" }}
            >
              <Form.Group>
                <Form.Label>
                  Choose which measurements this applies to:
                </Form.Label>
                <InputGroup className="mb-3">
                  <Form.Control
                    placeholder="Filter..."
                    aria-label="Filter hazards"
                    aria-describedby="search-addon"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </InputGroup>

                {/* Scrollable checklist for all hazards, grouped by type */}
                <div
                  style={{
                    maxHeight: "300px",
                    overflowY: "auto",
                    paddingLeft: "5px",
                  }}
                >
                  {/* Public Hazards */}
                  {filteredHazards.Public.length > 0 && (
                    <>
                      <div style={{ fontWeight: "bold" }}>Public</div>
                      {filteredHazards.Public.map((hazard) => (
                        <Form.Check
                          type="checkbox"
                          id={`hazard-${hazard.number}`}
                          label={`${hazard.number}: ${hazard.name}`}
                          checked={selectedHazards.some(
                            (h) => h.number === hazard.number
                          )}
                          onChange={() => handleHazardSelection(hazard)}
                          key={hazard.number}
                        />
                      ))}
                    </>
                  )}

                  {/* Restricted Hazards */}
                  {filteredHazards.Restricted.length > 0 && (
                    <>
                      <div style={{ fontWeight: "bold" }}>Restricted</div>
                      {filteredHazards.Restricted.map((hazard) => (
                        <Form.Check
                          type="checkbox"
                          id={`hazard-${hazard.number}`}
                          label={`${hazard.number}: ${hazard.name}`}
                          checked={selectedHazards.some(
                            (h) => h.number === hazard.number
                          )}
                          onChange={() => handleHazardSelection(hazard)}
                          key={hazard.number}
                        />
                      ))}
                    </>
                  )}

                  {/* Step Hazards */}
                  {filteredHazards.Step.length > 0 && (
                    <>
                      <div style={{ fontWeight: "bold" }}>Step</div>
                      {filteredHazards.Step.map((hazard) => (
                        <Form.Check
                          type="checkbox"
                          id={`hazard-${hazard.number}`}
                          label={`${hazard.number}: ${hazard.name}`}
                          checked={selectedHazards.some(
                            (h) => h.number === hazard.number
                          )}
                          onChange={() => handleHazardSelection(hazard)}
                          key={hazard.number}
                        />
                      ))}
                    </>
                  )}

                  {/* Continuity Hazards */}
                  {highContinuity.Continuity.length > 0 && (
                    <>
                      <div style={{ fontWeight: "bold" }}>Continuity</div>
                      {highContinuity.Continuity.map((hazard) => (
                        <Form.Check
                          type="checkbox"
                          id={`hazard-${hazard.number}`}
                          label={`${hazard.number}: ${hazard.name}`}
                          checked={selectedHazards.some(
                            (h) => h.number === hazard.number
                          )}
                          onChange={() => handleHazardSelection(hazard)}
                          key={hazard.number}
                        />
                      ))}
                    </>
                  )}

                  {/* Miscellaneous Hazards */}
                  <div style={{ fontWeight: "bold" }}>Miscellaneous</div>
                  {["Buried Joint Inspection", "Other"].map((misc, idx) => (
                    <Form.Check
                      type="checkbox"
                      id={`Misc ${idx}`}
                      label={misc}
                      checked={selectedHazards.some((h) => h.name === misc)}
                      onChange={() =>
                        handleHazardSelection({
                          number: `Misc ${idx}`,
                          name: misc,
                        })
                      }
                      key={`Misc ${idx}`}
                    />
                  ))}
                </div>
              </Form.Group>
            </div>

            {/* Modal Column 2: Images */}
            <div style={{ width: "50%", paddingLeft: "15px" }}>
              {selectedOption &&
                renderImages(
                  selectedOption.images,
                  modalCarouselIndex,
                  setModalCarouselIndex,
                  "modal-carousel"
                )}
            </div>
          </div>

          {/* Additional Comments Textarea */}
          <Form.Group className="mt-3">
            <Form.Label>Additional Comments</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={additionalComments}
              onChange={(e) => setAdditionalComments(e.target.value)}
            />
          </Form.Group>

          {/* Validation Warning */}
          {showWarning && (
            <Alert
              variant="warning"
              onClose={() => setShowWarning(false)}
              dismissible
            >
              Please select at least one hazard before accepting the mitigation.
            </Alert>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Close
          </Button>
          <Button variant="primary" onClick={handleAcceptMitigation}>
            Accept Mitigation
          </Button>
        </Modal.Footer>
      </Modal>

      {/* === Fullscreen Image Viewer === */}
      {fullscreenImage && (
        <FullscreenImage src={fullscreenImage} onClose={exitFullscreen} />
      )}
    </div>
  );
}

export default MitigationContent;