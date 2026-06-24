import { Text, View } from "@react-pdf/renderer";
import { styles } from "./PDFStyles";

interface Props {
  ResponseObj: any;
  anchorId?: string;
}

function PDFEarthConductorSize({ ResponseObj, anchorId }: Props) {
  const conductorSizingRaw = ResponseObj?.reportMisc?.conductorSizing || [];
  let conductorSizing: any = {};

  try {
    if (Array.isArray(conductorSizingRaw) && conductorSizingRaw.length > 0) {
      conductorSizing =
        typeof conductorSizingRaw[0] === "string"
          ? JSON.parse(conductorSizingRaw[0])
          : conductorSizingRaw[0];
    } else if (typeof conductorSizingRaw === "string") {
      conductorSizing = JSON.parse(conductorSizingRaw);
    } else {
      conductorSizing = conductorSizingRaw;
    }
  } catch (e) {
    console.error("Error parsing conductorSizing:", e);
  }

  const isTranspower = ResponseObj?.client_TP || false;

  // Simple number formatter for commas
  const fmt = (v: any) => {
    if (v === null || v === undefined || v === "" || isNaN(Number(v))) return v;
    return new Intl.NumberFormat("en-NZ", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number(v));
  };

  // Extract values with defaults
  const faultDuration = conductorSizing.fault_duration || "3.0";
  const faultCurrent = conductorSizing.fault_current || "XXX";
  const primarySize = conductorSizing.primary_size || "XX";
  const buriedSize = conductorSizing.buried_size || "XX";

  // Calculate 70% of fault current for buried conductors
  const buriedFaultCurrent =
    faultCurrent !== "XXX"
      ? fmt(Number(faultCurrent) * 0.7)
      : "XXX";

  // Temperature based on client type
  const buriedTemp = isTranspower ? "20" : "25";
  const primaryTemp = "30";

  return (
    <View>
      {anchorId && (
        <Text
          id={anchorId}
          style={{ fontSize: 1, height: 0, margin: 0, padding: 0 }}
        />
      )}

      <Text style={styles.title}>Earth Conductor Sizing</Text>

      <Text style={styles.text}>
        The earthing conductor sizing is reviewed as per the EEA Guide, with the following criteria:
      </Text>

      <View style={{ marginLeft: 20, marginBottom: 8 }}>
        <Text style={styles.text}>
          1. The minimum conductor size for connections to primary equipment should be based on the maximum fault current.
        </Text>
        <Text style={styles.text}>
          2. The minimum conductor size for the buried earth grid conductors should be based on 70 % of the maximum fault current.
        </Text>
        <Text style={styles.text}>
          3. All conductor sizes should be based on a fault duration of 3.0 s.
        </Text>
        <Text style={styles.text}>
          4. The initial or ambient temperature used is 30°C for above ground conductor ratings. The initial or ambient temperature used is 25°C for buried connections.
        </Text>
        <Text style={styles.text}>
          5. All conductor sizes are determined based on IEEE Std 80, section 11.3.1, equations.
        </Text>
        <Text style={styles.text}>
          6. Where conductors use a bolted joint (i.e., for above ground conductors), the maximum conductor temperature is 250°C.
        </Text>
        <Text style={styles.text}>
          7. Where conductors use a brazed or exothermically welded joint (i.e., for buried conductors), the maximum conductor temperature is 400°C.
        </Text>
        <Text style={styles.text}>
          8. ElectroNet has capped the minimum conductor size to be 35 mm².
        </Text>
      </View>

      <Text style={styles.subtitle}>Connections to Primary Equipment</Text>

      <Text style={styles.text}>
        The following criteria were used to calculate the minimum conductor size for connections to primary equipment (bolted joints):
      </Text>

      <View style={{ marginLeft: 20, marginBottom: 8 }}>
        <Text style={styles.text}>1. Fault duration: {faultDuration} s</Text>
        <Text style={styles.text}>2. Fault current: {fmt(faultCurrent)} A</Text>
        <Text style={styles.text}>3. Ambient air temperature: {primaryTemp}°C</Text>
        <Text style={styles.text}>4. Maximum allowable conductor temperature: 250°C</Text>
      </View>

      <Text style={styles.text}>
        The calculated minimum conductor size is {fmt(primarySize)} mm².
      </Text>

      <Text style={styles.subtitle}>Buried Earth Conductors</Text>

      <Text style={styles.text}>
        The following design criteria were used to calculate the minimum conductor size for direct buried earth conductor (brazed or welded joints):
      </Text>

      <View style={{ marginLeft: 20, marginBottom: 8 }}>
        <Text style={styles.text}>1. Fault duration: {faultDuration} s</Text>
        <Text style={styles.text}>
          2. Fault current: {buriedFaultCurrent} A (70 % of {fmt(faultCurrent)} A)
        </Text>
        <Text style={styles.text}>3. Ambient soil temperature: {buriedTemp}°C</Text>
        <Text style={styles.text}>4. Maximum allowable temperature: 400°C</Text>
      </View>

      <Text style={styles.text}>
        The calculated minimum conductor size is {fmt(buriedSize)} mm².
      </Text>
    </View>
  );
}

export default PDFEarthConductorSize;
