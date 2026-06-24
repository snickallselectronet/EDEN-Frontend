import PDFFooter from "./PDFFooter";
import { Page, Text, View, Image, Link } from '@react-pdf/renderer';
import { styles } from "./PDFStyles";

interface Props {
  rawData: any;
}

// --- ADDED: Helper function for number formatting ---
const fmt = (v: any) => {
  if (v === null || v === undefined || v === "" || isNaN(Number(v))) return "";
  return new Intl.NumberFormat("en-NZ", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(v));
};

function PDFCurrentDist({ rawData, anchorId }: Props & { anchorId?: string }) {
  return (
    <View>
      {anchorId && <Text id={anchorId} style={{ fontSize: 1, height: 0 }} />}

      <View> 
        <Text style={styles.title}>Current Distribution</Text>
        <View style={styles.tableNoBorder}>
          
          {/* --- Header Row --- */}
          <View style={[styles.tableRow, styles.tableRowTopMiddleBorder]}>
            <View
              style={[
                styles.tableColBorder,
                styles.firstAndMiddleColumn,
                { backgroundColor: "#005DA5", width: "40%" },
              ]}
            >
              <Text style={[styles.tableCell, styles.text]}></Text>
            </View>
            <View
              style={[
                styles.tableColBorder,
                styles.firstAndMiddleColumn,
                { backgroundColor: "#005DA5", width: "30%" },
              ]}
            >
              <Text
                style={[styles.tableCell, styles.textBold, { color: "white" }]}
              >
                Current (mA)
              </Text>
            </View>
            <View
              style={[
                styles.tableColBorder,
                styles.lastColumn,
                { backgroundColor: "#005DA5", width: "30%" },
              ]}
            >
              <Text
                style={[styles.tableCell, styles.textBold, { color: "white" }]}
              >
                Angle (&deg;)
              </Text>
            </View>
          </View>
          
          {/* --- Data Row 1: Injected Current --- */}
          <View style={[styles.tableRow, styles.tableRowTopMiddleBorder]}>
            <View
              style={[
                styles.tableColBorder,
                styles.firstAndMiddleColumn,
                { backgroundColor: "#005DA5", width: "40%" },
              ]}
            >
              <Text
                style={[styles.tableCell, styles.textBold, { color: "white" }]}
              >
                Injected Current
              </Text>
            </View>
            <View style={[styles.tableColBorder, styles.firstAndMiddleColumn, { width: "30%" }]}>
              <Text style={[styles.tableCell, styles.text]}>
                {fmt(rawData.inj.current)}
              </Text>
            </View>
            <View style={[styles.tableColBorder, styles.lastColumn, { width: "30%" }]}>
              <Text style={[styles.tableCell, styles.text]}>
                {fmt(rawData.inj.angle)}
              </Text>
            </View>
          </View>

          {/* --- Data Row 2: Measured Current Splits --- */}
          <View style={[styles.tableRow, styles.tableRowTopMiddleBorder]}>
            <View
              style={[
                styles.tableColBorder,
                styles.firstAndMiddleColumn,
                { backgroundColor: "#005DA5", width: "40%" },
              ]}
            >
              <Text
                style={[styles.tableCell, styles.textBold, { color: "white" }]}
              >
                Measured Current Splits
              </Text>
            </View>
            <View style={[styles.tableColBorder, styles.firstAndMiddleColumn, { width: "30%" }]}>
              <Text style={[styles.tableCell, styles.text]}>
                {fmt(rawData.meas.current)}
              </Text>
            </View>
            <View style={[styles.tableColBorder, styles.lastColumn, { width: "30%" }]}>
              <Text style={[styles.tableCell, styles.text]}>
                {fmt(rawData.meas.angle)}
              </Text>
            </View>
          </View>

          <View style={[styles.tableRow, styles.tableRowBottomBorder]}>
            <View
              style={[
                styles.tableColBorder,
                styles.firstAndMiddleColumn,
                { backgroundColor: "#005DA5", width: "40%" },
              ]}
            >
              <Text
                style={[styles.tableCell, styles.textBold, { color: "white" }]}
              >
                Earth Return Current
              </Text>
            </View>
            <View style={[styles.tableColBorder, styles.firstAndMiddleColumn, { width: "30%" }]}>
              <Text style={[styles.tableCell, styles.text]}>
                {fmt(rawData.earth.current)}
              </Text>
            </View>
            <View style={[styles.tableColBorder, styles.lastColumn, { width: "30%" }]}>
              <Text style={[styles.tableCell, styles.text]}>
                {fmt(rawData.earth.angle)}
              </Text>
            </View>
          </View>
        </View>

        {/* --- Standalone Impedance Calculation --- */}
        <Text style={[styles.textParagraph, { marginTop: 7 }]}>
          If all external earth connections are removed, i.e. OHEW or cables
          screens, the substation's standalone grid impedance would be:
        </Text>
        <View style={styles.tableRow}>
          <Text style={[styles.textParagraph, { width: "15%" }]}>
            Z<Text style={styles.textSubscript}>standalone</Text>
          </Text>
          <Text style={[styles.textParagraph, { width: "85%" }]}>
            = {(Math.max(rawData.egvrs) / 1000).toFixed(3)} V /{" "}
            {(rawData.earth.current / 1000).toFixed(3)} A
          </Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={[styles.textParagraph, { width: "15%" }]}></Text>
          <Text style={[styles.textParagraph, { width: "85%" }]}>
            {"= "}
            {(
              Number((Math.max(rawData.egvrs) / 1000).toFixed(3)) /
              Number((rawData.earth.current / 1000).toFixed(3))
            ).toFixed(3)}{" "}
            Ω
          </Text>
        </View>
      </View>
      
    </View>
  );
}

export default PDFCurrentDist;