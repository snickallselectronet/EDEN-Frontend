import { Page, View, Text, Link } from "@react-pdf/renderer";
import { soilTableStyles } from "./PDFStyles";
import { styles } from "./PDFStyles";

interface Props {
  ResponseObj: any;
  anchorId?: string;
}

const PDFSoilTable = ({ ResponseObj, anchorId }: Props) => {
  // Parse soil data (array with a single JSON string)
  const soilArray = ResponseObj?.reportMisc?.soilData ?? [];
  const soilString = Array.isArray(soilArray) ? soilArray[0] : soilArray;

  let soilData: any = {};
  try {
    soilData =
      typeof soilString === "string"
        ? JSON.parse(soilString)
        : soilString || {};
  } catch (err) {
    console.error("Error parsing soil data:", err);
  }

  // Build dynamic layer list from keys p1, p2, p3, ...
  const layers = Object.entries(soilData ?? {})
    .filter(([k, v]) => /^p\d+$/i.test(k) && v && typeof v === "object")
    .map(([k, v]) => {
      const idx = Number(String(k).slice(1)); // "p12" -> 12
      return { key: k.toLowerCase(), idx, data: v as any };
    })
    .filter((x) => Number.isFinite(x.idx))
    .sort((a, b) => a.idx - b.idx);

  // Simple formatters for numbers / thickness
  const fmt = (v: any) => {
    if (v === null || v === undefined || v === "" || Number.isNaN(Number(v))) {
      return "-";
    }
    // Force commas for thousands using Regex
    return String(Number(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const fmtThk = (v: any, isLastRow: boolean = false) => {
    // Always show infinity for the last row (third layer)
    if (isLastRow) {
      return "∞";
    }
    if (v === null || v === undefined || v === "" || Number.isNaN(Number(v))) {
      return "-";
    }
    if (Number(v) === 0) {
      return "∞";
    }
    return String(Number(v));
  };

  return (
    <View>
      {anchorId && <Text id={anchorId} style={{ fontSize: 1, height: 0 }} />}

      <Text style={styles.title}>Soil Resistivity</Text>

      <View>
        <Text style={styles.text}>
          A soil resistivity test was carried out by ElectroNet using the Wenner
          method. CDEGS software was used to determine the following soil
          resistivity structure based on the test results.
        </Text>
      </View>

      <View style={soilTableStyles.table}>
        {/* Header Row */}
        <View style={soilTableStyles.row}>
          <View style={soilTableStyles.headerCol}>
            <Text style={soilTableStyles.headerCell as any}>Layer</Text>
          </View>
          <View style={soilTableStyles.headerCol}>
            <Text style={soilTableStyles.headerCell as any}>
              Resistivity (Ω·m)
            </Text>
          </View>
          <View style={soilTableStyles.headerCol}>
            <Text style={soilTableStyles.headerCell as any}>
              Layer Thickness (m)
            </Text>
          </View>
        </View>

        {/* Body Rows */}
        {layers.length > 0 &&
          layers.map((layer, i) => {
            const isLastRow = i === layers.length - 1;
            // Display label: ρ₁, ρ₂ ... using numeric suffix
            const rhoLabel = `ρ${String(layer.idx).replace(/\d/g, (d) => "₀₁₂₃₄₅₆₇₈₉"[Number(d)])}`;

            return (
              <View style={soilTableStyles.row} key={layer.key}>
                <View style={soilTableStyles.col}>
                  <Text style={soilTableStyles.cell}>{rhoLabel}</Text>
                </View>
                <View style={soilTableStyles.col}>
                  <Text style={soilTableStyles.cell}>
                    {fmt(layer.data?.resistivity)}
                  </Text>
                </View>
                <View style={soilTableStyles.col}>
                  <Text style={soilTableStyles.cell}>
                    {fmtThk(layer.data?.thickness, isLastRow)}
                  </Text>
                </View>
              </View>
            );
          })}
      </View>

      <View>
        <Text style={styles.text}>
          Conservatively, ElectroNet has used the lowest recorded topsoil
          resistivity of {fmt(ResponseObj?.soil_R)} Ω·m to define the tolerable
          touch and step voltage limits.
        </Text>
      </View>
    </View>
  );
};

export default PDFSoilTable;
