import { View, Text } from "@react-pdf/renderer";
import { styles, faultTableStyles } from "./PDFStyles";

interface Props {
  ResponseObj: any;
  anchorId?: string;
}

// --- ADDED STYLES ---

// --- MODIFIED --- (Re-balanced widths for multi-line headers)
const colWidths = {
  fault: { width: "10%" },
  locations: { width: "24%" },
  pfc: { width: "16.5%" },
  erc: { width: "16.5%" },
  primary: { width: "16.5%" },
  secondary: { width: "16.5%" },
};

// Style for center-aligning data in numeric/duration columns
const numericCell = {
  textAlign: "center" as const,
};

// --- MODIFIED --- (Added new style for centering header text)
const headerCellCentered = {
  textAlign: "center" as const,
};

const headerLeftAligned = {
  textAlign: "left" as const,
};
// --- END ADDED STYLES ---

const PDFFaultTable = ({ ResponseObj, anchorId }: Props) => {
  // 1. Load and parse fault data
  const raw = ResponseObj?.reportMisc?.faultData;
  let faultData: any[] = [];

  try {
    if (Array.isArray(raw)) {
      // Case: backend returned array
      if (typeof raw[0] === "string") {
        // Sometimes array of one JSON string
        faultData = JSON.parse(raw[0] || "[]");
      } else {
        faultData = raw;
      }
    } else if (typeof raw === "string") {
      // Case: single JSON string
      faultData = JSON.parse(raw || "[]");
    } else if (raw && typeof raw === "object") {
      // Case: single object — wrap in array
      faultData = [raw];
    } else {
      faultData = [];
    }
  } catch (err) {
    console.error("Error parsing fault data:", err);
    faultData = [];
  }

  // Always guarantee array type
  if (!Array.isArray(faultData)) faultData = [];

  // 2. Drop empty rows
  const trim = (v: any) =>
    v === undefined || v === null ? "" : String(v).trim();

  faultData = faultData.filter((r: any) => {
    const hasText =
      trim(r.fault) !== "" ||
      trim(r.fault_locations) !== "" ||
      trim(r.duration_primary) !== "" ||
      trim(r.duration_secondary) !== "";
    const hasNumber =
      (r.prospective_fault_current !== "" &&
        r.prospective_fault_current !== null &&
        r.prospective_fault_current !== undefined) ||
      (r.earth_return_current !== "" &&
        r.earth_return_current !== null &&
        r.earth_return_current !== undefined);
    return hasText || hasNumber;
  });

  // 3. Helpers
  const asNumber = (v: any): number | null => {
    if (v === "" || v === null || v === undefined) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  const fmtNum = (v: any) => {
    const n = asNumber(v);
    // Handle N/A or other non-numeric strings
    if (n === null && asString(v).toLowerCase() === "n/a") return "N/A";
    if (n === null) return "";
    return n.toLocaleString("en-NZ");
  };

  const asString = (v: any) => {
    const str = trim(v);
    // Standardize common null/empty values
    if (str.toLowerCase() === "n/a" || str === "-") return "N/A";
    return str;
  }
    

  const worstFaultI = fmtNum(ResponseObj?.fault_I);
  const worstFaultS = fmtNum(ResponseObj?.fault_s);
  const faultScenarioArr = ResponseObj?.reportMisc?.faultScenario;
  const faultScenario =
    Array.isArray(faultScenarioArr)
      ? trim(faultScenarioArr[0])
      : trim(faultScenarioArr);

  // 4. Render
  return (
    <View>
      {anchorId && <Text id={anchorId} style={{ fontSize: 1, height: 0 }} />}

      <Text style={styles.title}>Fault Current and Duration</Text>

      <View>
        <Text style={styles.text}>
          Prospective earth return fault currents and fault durations are shown
          below. ElectroNet has Calculated the earth return currents.
        </Text>
      </View>

      <View style={faultTableStyles.table}>
        
        {/* --- MODIFIED HEADER SECTION --- */}
        <View style={faultTableStyles.row}>
          <View
            style={[
              faultTableStyles.headerCol,
              faultTableStyles.colFault,
              colWidths.fault,
            ]}
          >
            {/* Added centering style */}
            <Text style={[faultTableStyles.headerCell as any, headerCellCentered]}>Fault</Text>
          </View>
          <View
            style={[
              faultTableStyles.headerCol,
              faultTableStyles.colLocations,
              colWidths.locations,
            ]}
          >
            {/* Added centering style and line break */}
            <Text style={[faultTableStyles.headerCell as any, headerLeftAligned]}>
              Fault Locations
            </Text>
          </View>
          <View
            style={[
              faultTableStyles.headerCol,
              faultTableStyles.colPFC,
              colWidths.pfc,
            ]}
          >
            {/* Added centering style and line breaks */}
            <Text style={[faultTableStyles.headerCell as any, headerCellCentered]}>
              Prospective{"\n"}Fault{"\n"}Current (A)
            </Text>
          </View>
          <View
            style={[
              faultTableStyles.headerCol,
              faultTableStyles.colERC,
              colWidths.erc,
            ]}
          >
            {/* Added centering style and line breaks */}
            <Text style={[faultTableStyles.headerCell as any, headerCellCentered]}>
              Earth{"\n"}Return{"\n"}Current (A)
            </Text>
          </View>
          <View
            style={[
              faultTableStyles.headerCol,
              faultTableStyles.colPrimary,
              colWidths.primary,
            ]}
          >
            {/* Added centering style and line breaks */}
            <Text style={[faultTableStyles.headerCell as any, headerCellCentered]}>
              Fault{"\n"}Duration –{"\n"}Primary (s)
            </Text>
          </View>
          <View
            style={[
              faultTableStyles.headerCol,
              faultTableStyles.colSecondary,
              colWidths.secondary,
            ]}
          >
            {/* Added centering style and line breaks */}
            <Text style={[faultTableStyles.headerCell as any, headerCellCentered]}>
              Fault{"\n"}Duration –{"\n"}Secondary (s)
            </Text>
          </View>
        </View>
        {/* --- END MODIFIED HEADER SECTION --- */}


        {/* Body - Apply widths AND text alignment */}
        {faultData.map((r: any, i: number) => (
          <View key={i} style={faultTableStyles.row}>
            <View
              style={[
                faultTableStyles.col,
                faultTableStyles.colFault,
                colWidths.fault, // Apply width
              ]}
            >
              <Text style={faultTableStyles.cell as any}>
                {asString(r.fault)}
              </Text>
            </View>
            <View
              style={[
                faultTableStyles.col,
                faultTableStyles.colLocations,
                colWidths.locations, // Apply width
              ]}
            >
              <Text style={faultTableStyles.cellLeft as any}>
                {asString(r.fault_locations)}
              </Text>
            </View>
            <View
              style={[
                faultTableStyles.col,
                faultTableStyles.colPFC,
                colWidths.pfc, // Apply width
                numericCell, // Apply center align
              ]}
            >
              <Text style={faultTableStyles.cell as any}>
                {fmtNum(r.prospective_fault_current)}
              </Text>
            </View>
            <View
              style={[
                faultTableStyles.col,
                faultTableStyles.colERC,
                colWidths.erc, // Apply width
                numericCell, // Apply center align
              ]}
            >
              <Text style={faultTableStyles.cell as any}>
                {fmtNum(r.earth_return_current)}
              </Text>
            </View>
            <View
              style={[
                faultTableStyles.col,
                faultTableStyles.colPrimary,
                colWidths.primary, // Apply width
                numericCell, // Apply center align
              ]}
            >
              <Text style={faultTableStyles.cell as any}>
                {asString(r.duration_primary)}
              </Text>
            </View>
            <View
              style={[
                faultTableStyles.col,
                faultTableStyles.colSecondary,
                colWidths.secondary, // Apply width
                numericCell, // Apply center align
              ]}
            >
              <Text style={faultTableStyles.cell as any}>
                {asString(r.duration_secondary)}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {(worstFaultI || worstFaultS || faultScenario) && (
        <View>
          <Text style={styles.text}>
            The EEA Earthing Guide to Power System Earthing Practice states that the primary protection fault duration should be
            used for determining tolerable touch and step voltage limits. The
            worst-case fault current is {worstFaultI} A, {` ${worstFaultS}`} s
            {faultScenario ? ` for a ${faultScenario}.` : "."}
          </Text>
        </View>
      )}
    </View>
  );
};

export default PDFFaultTable;