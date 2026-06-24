import { styles } from "./PDFStyles";
import { Text } from "@react-pdf/renderer";

// Create a new Date object to get the current date and time
const currentDate = new Date();
// Get the individual components of the date (day, month, and year)
const day = String(currentDate.getDate()).padStart(2, "0"); // Ensure two digits with leading zero
const month = String(currentDate.getMonth() + 1).padStart(2, "0"); // Months are 0-based, so add 1
const year = currentDate.getFullYear();

// Combine the components into the desired format
const formattedDate = `${day}-${month}-${year}`;

interface Props {
  reportMisc?: {
    reportNumber?: string | string[];
    revision?: string | string[];
    [key: string]: any;
  };
}

function PDFFooter({ reportMisc }: Props) {
  // Extract dynamic values safely
  const reportRef = reportMisc?.reportNumber?.[0] || "";
  const revision = reportMisc?.revision?.[0] || "";

  return (
    <>
      <Text style={styles.footerLeft} fixed>
        {reportRef}, {revision}, Report Generated {formattedDate}.
      </Text>
      <Text
        style={styles.footerRight}
        render={({ pageNumber }) => `${pageNumber}`}
        fixed
      />
    </>
  );
}

export default PDFFooter;