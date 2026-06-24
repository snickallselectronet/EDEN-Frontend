// Core React & Third-party Libraries
import { useState, useEffect, ReactNode } from "react";
import PDFFooter from "./PDFFooter";
import { Page, Text, View, Image } from "@react-pdf/renderer";
import { styles } from "./PDFStyles";

// --- Interface Definitions ---

/**
 * Defines the structure for a single hazard.
 */
interface MitigationHazard {
  number: string;
  name: string;
  details?: string;
}

/**
 * Defines the structure for a single, complete mitigation item.
 * This includes the base details, associated images/text,
 * and the specific hazards it applies to.
 */
interface MitigationItem {
  name: string;
  text?: string;
  appliedHazards?: MitigationHazard[];
  images?: string[];
  additionalComments?: string;
}

/**
 * Defines the shape of the main prop.
 * The 'mitigation' data can come from the server as either
 * a pre-parsed array or a JSON string that needs parsing.
 */
interface MitigationOptions {
  mitigation: string | MitigationItem[];
}

/**
 * Props for the PDFMitigation component.
 */
interface Props {
  /** The mitigation data object. */
  MitigationOptions: MitigationOptions;
  /** An optional anchor ID for PDF internal linking. */
  anchorId?: string;
  footer?: ReactNode;
}

/**
 * A component to render the "Recommended Mitigation" section of the PDF report.
 * It parses the mitigation data and formats it into a clean, readable page.
 */
function PDFMitigation({ MitigationOptions, anchorId, footer }: Props) {
  const [acceptedMitigations, setAcceptedMitigations] = useState<MitigationItem[]>([]);

  useEffect(() => {
    try {
      const source = MitigationOptions?.mitigation;

      if (typeof source === "string") {
        const parsedMitigations = JSON.parse(source);
        if (Array.isArray(parsedMitigations)) {
          setAcceptedMitigations(parsedMitigations.filter((i) => i !== null));
        } else {
          console.warn("PDFMitigation: Parsed mitigation data is not an array.");
          setAcceptedMitigations([]);
        }
      } else if (Array.isArray(source)) {
        setAcceptedMitigations(source.filter((i) => i !== null));
      } else {
        console.warn("PDFMitigation: 'source' is neither a string nor an array.");
        setAcceptedMitigations([]);
      }
    } catch (error) {
      console.error("PDFMitigation: Error parsing mitigation JSON:", error);
      setAcceptedMitigations([]);
    }
  }, [MitigationOptions]);

  return (
    <Page size="A4" style={styles.body}>
      {anchorId && <Text id={anchorId} style={{ fontSize: 1, height: 0 }} />}

      <Text style={styles.title}>Recommended Mitigation</Text>

      {/* --- Always show this explanatory line --- */}
      <Text style={[styles.text, { marginBottom: 8 }]}>
        The following mitigation options have been proposed; further detail can be provided upon request.
      </Text>

      {/* --- Render mitigation items if present --- */}
      {acceptedMitigations.length > 0 &&
        acceptedMitigations.map((item, index) => (
          <View key={index} style={{ marginTop: 10 }} wrap={false}>
            {/* Mitigation Title */}
            <Text style={styles.subtitle}>{item.name}</Text>

            {/* Description text */}
            {item.text && (
              <Text style={[styles.text, { marginBottom: 5 }]}>{item.text}</Text>
            )}

            <Text style={styles.text}>
              This mitigation applies to the following measurements:
            </Text>

            {/* --- Applied Hazards Table --- */}
            <View style={{ width: "50%", margin: "0 auto" }}>
              <View style={[styles.tableRow, styles.borderBottom]}>
                <View style={{ width: "20%" }}>
                  <Text style={[{ margin: "5 auto" }, styles.textBold]}>ID</Text>
                </View>
                <View style={{ width: "80%" }}>
                  <Text style={[{ margin: "5 0" }, styles.textBold]}>Details</Text>
                </View>
              </View>

              {item.appliedHazards?.map((hazard, idx) => (
                <View key={idx} style={styles.tableRow}>
                  <View style={{ width: "20%" }}>
                    <Text style={[{ margin: "5 auto" }, styles.text]}>
                      {hazard.number}
                    </Text>
                  </View>
                  <View style={{ width: "80%" }}>
                    <Text style={[{ margin: "5 0" }, styles.text]}>
                      {hazard.name}
                      {hazard.details?.trim() ? ` ${hazard.details}` : ""}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            {/* --- Additional Comments --- */}
            {item.additionalComments && (
              <Text style={[styles.text, { textAlign: "left", marginTop: 8 }]}>
                <Text style={{ fontWeight: "bold" }}>Recommended Mitigation:</Text>{" "}
                {item.additionalComments}
              </Text>
            )}
          </View>
        ))}

      {footer}
    </Page>
  );
}

export default PDFMitigation;