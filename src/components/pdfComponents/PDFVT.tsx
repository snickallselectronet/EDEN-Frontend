import { Page, Text, View, Image, Link } from '@react-pdf/renderer';
import { styles } from "./PDFStyles";

interface VTRecordItem {
  name: string;
  max_egvr: number;
  data: Array<{ x: number; y: number }>;
}

interface Props {
  ResponseObj: {
    VTRecord: VTRecordItem[];
    injected_I: number;
  };
  egvrImages: string[]; // Array of base64 image strings
  anchorId?: string;
}

function formatNumber(value: number): string {
  return Math.round(value).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function numberToWord(num: number): string {
  const words: { [key: number]: string } = {
    1: "One",
    2: "Two",
    3: "Three",
    4: "Four",
    5: "Five",
  };
  return words[num] || num.toString();
}

function PDFVT({ ResponseObj, egvrImages, anchorId }: Props) {
  // Guard: If no voltage traverses, don't render anything
  if (!ResponseObj.VTRecord || ResponseObj.VTRecord.length === 0) {
    return null;
  }

  return (
    <View>
      {anchorId && <Text id={anchorId} style={{ fontSize: 1, height: 0, margin: 0, padding: 0 }} />}

      <Text style={styles.title}>Earth Grid Impedance</Text>

      <Text style={styles.textParagraph}>
        {numberToWord(ResponseObj.VTRecord.length)}
        {" voltage traverse"}
        {ResponseObj.VTRecord.length === 1 ? " was" : "s were"}
        {" conducted."}
      </Text>

      {ResponseObj.VTRecord.map((item: VTRecordItem, index: number) => {
        const impedance = item.max_egvr / ResponseObj.injected_I / 1000;
        const impedanceFormatted = impedance < 0.1 
          ? impedance.toFixed(3) 
          : impedance.toFixed(2);

        return (
          <View key={`${item.name}-${index}`} wrap={false}>
            <Text style={styles.textParagraph}>
              {"From the "}
              {item.name}
              {" traverse, the maximum test EGVR was measured to be "}
              {formatNumber(item.max_egvr)}
              {" mV."}
            </Text>
            
            {/* Only render image if it exists */}
            {egvrImages[index] && (
              <Image
                src={egvrImages[index]}
                style={{
                  borderWidth: 0.5,
                  borderColor: "black",
                  marginBottom: 8,
                }}
              />
            )}

            <Text style={[styles.textParagraph]}>
              The Earthing System Impedance from this traverse is calculated to be:
            </Text>

            <View style={styles.tableRow}>
              <Text style={[styles.textParagraph, { width: "15%" }]}>
                Z<Text style={styles.textSubscript}>grid</Text>
              </Text>
              <Text style={[styles.textParagraph, { width: "85%" }]}>
                = {formatNumber(item.max_egvr)} mV / {ResponseObj.injected_I} A
              </Text>
            </View>

            <View style={styles.tableRow}>
              <Text style={[styles.textParagraph, { width: "15%" }]}></Text>
              <Text style={[styles.textParagraph, { width: "85%" }]}>
                = {impedanceFormatted} Ω
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

export default PDFVT;