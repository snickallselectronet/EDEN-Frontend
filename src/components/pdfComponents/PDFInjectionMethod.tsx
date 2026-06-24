import { Text, View } from "@react-pdf/renderer";
import { styles } from "./PDFStyles";

interface Props {
  ResponseObj: any;
  anchorId?: string;
}

function PDFInjectionMethod({ ResponseObj, anchorId }: Props) {
  return (
    <View>
      {/* Invisible anchor for TOC */}
      {anchorId && (
        <Text
          id={anchorId}
          style={{ fontSize: 1, height: 0, margin: 0, padding: 0 }}
        />
      )}

      <Text style={styles.title}>Injection Testing Method</Text>

      <Text style={styles.text}>
        {`Injection testing at ${ResponseObj.name} was performed by injecting current into the earth grid from a remote location to create an EGVR. This simulates the effect of a real power system earth fault. The testing enables various parameters of the earthing system to be measured, such as the earthing system impedance and touch or step voltages around the site.

The remote injection point consisted of ${ResponseObj.reportMisc.remoteInjectionMethod} located approximately ${ResponseObj.reportMisc.distanceOfRods} m ${ResponseObj.reportMisc.directionOfRods} of ${ResponseObj.name}. The voltage traverse was run to the ${ResponseObj.reportMisc.directionOfTraverse} of the site.

A test current of ${ResponseObj.injected_I} A was injected using a portable constant current injector operating at 58 Hz. Injecting at 58 Hz enables the test signals to be isolated from any other noise or interference on the earthing system (such as 50 Hz and harmonics). Frequency-tuned meters were used to measure the 58 Hz voltages and currents.

Site safety with respect to touch and step voltages is assessed in accordance with the requirements of the EEA Guide to Power System Earthing Practice 2019.
`}
      </Text>
    </View>
  );
}

export default PDFInjectionMethod;
