import React, { useState, useEffect } from "react";
import Modal from "react-bootstrap/Modal";
import ImageWithPresignedUrl from "./ImageWithPresignedUrl";
import axios from "axios";
import { host_url } from "../constants";
import { useAuthenticatedApi } from "../hooks/useAuth"; // <-- CHANGE: Import hook

interface Props {
  rawData: any;
  photoKey: any;
}

interface ImageComponentProps {
  imageUrl: string;
}

const ImageComponent: React.FC<ImageComponentProps> = ({ imageUrl }) => {
  const { imageUrl: url, loading, error } = ImageWithPresignedUrl(imageUrl);
  const [proxyUrl, setProxyUrl] = useState("");
  const { getAuthHeaders, isReady } = useAuthenticatedApi(); // <-- CHANGE: Call hook

  useEffect(() => {
    const fetchEncryptedUrl = async () => {
      try {
        const headers = await getAuthHeaders(); // <-- CHANGE: Get auth headers
        const response = await axios.get(`${host_url}generate-encrypted-url/`, {
          params: { url },
          headers: headers, // <-- CHANGE: Pass headers to axios
        });
        setProxyUrl(
          `${host_url}image-proxy/?url=${encodeURIComponent(
            response.data.encrypted_url
          )}`
        );
      } catch (error) {
        console.error("Error fetching encrypted URL:", error);
      }
    };

    // <-- CHANGE: Check for auth readiness
    if (url && isReady) {
      fetchEncryptedUrl();
    }
  }, [url, isReady, getAuthHeaders]); // <-- CHANGE: Update dependency array

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error loading image</p>;

  return (
    <>
      {proxyUrl && (
        <img
          src={proxyUrl}
          alt="No Picture on Record"
          style={{ width: "100%", height: "auto" }}
        />
      )}
    </>
  );
};

function VisualInspectionContent({ rawData, photoKey }: Props) {
  const [modalContent, setModalContent] = useState<any>(null);
  const [modalHeader, setModalHeader] = useState<string>("");
  const [isModalOpen, setModalOpen] = useState<boolean>(false);

  const handleOpenModal = (header: string, content: any) => {
    setModalHeader(header);
    setModalContent(content);
    setModalOpen(true);
  };
  const handleCloseModal = () => setModalOpen(false);

  const handleOpenModalWithImages = (item: any) => {
    const images = item.photos
      .split(", ")
      .map((photoUrl: string, index: number) => (
        <ImageComponent
          key={`${photoUrl}-${index}`}
          imageUrl={photoKey + photoUrl}
        />
      ));

    handleOpenModal(`${item.name} Earth Connection`, images);
  };

  return (
    <>
      <div id="visual-inspection-contents" className="content-section-container">
        <h2 className="section-title">Visual Inspections</h2>
        <p>
          {rawData.length === 1
            ? "One earth connection was "
            : rawData.length > 1
            ? "Multiple earth connections were "
            : ""}
          visually inspected. See the table below for details.
        </p>
        <table style={{ width: "100%", marginBottom: "1em" }}>
          <tbody>
            <tr
              style={{
                borderBottom: "1px solid var(--en-blue)",
              }}
            >
              <td>
                <b>Description</b>
              </td>
              <td>
                <b>Overall Condition</b>
              </td>
              <td>
                <b>Corrosion</b>
              </td>
              <td>
                <b>Damage</b>
              </td>
              <td style={{ width: "20%" }}>
                <b>Photos</b>
              </td>
            </tr>

            {rawData.map((item: any, index: number) => (
              <tr
                key={`${item.number}-${item.name}-${index}`}
                style={
                  {
                    // borderBottom: "1px dashed var(--en-blue)",
                  }
                }
              >
                <td>{item.name}</td>
                <td>{item.overallCond}</td>
                <td>{item.corrosion ?? "None"}</td>
                <td>{item.damaged ?? "None"}</td>
                <td>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handleOpenModalWithImages(item);
                    }}
                  >
                    View
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal show={isModalOpen} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{modalHeader}</Modal.Title>
        </Modal.Header>
        <Modal.Body
          style={{
            alignItems: "center",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {modalContent}
        </Modal.Body>
      </Modal>
    </>
  );
}

export default VisualInspectionContent;