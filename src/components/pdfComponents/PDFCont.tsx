import PDFFooter from "./PDFFooter";
import { Page, Text, View, Image } from "@react-pdf/renderer";
import { styles } from "./PDFStyles";
import { useMemo, ReactNode } from "react";

// -------------------------
// Type Definitions
// -------------------------

interface ContinuityItem {
  number: number;
  name: string;
  details?: string;
  value: number;
  photo?: string;
}

interface ContinuityData {
  total: number;
  high: ContinuityItem[];
  acceptable: ContinuityItem[];
}

interface Props {
  rawData: ContinuityData;
  loadedImages: { [key: string]: string };
  anchorId?: string;
  footer?: ReactNode;
}

interface PhotoInfo {
  photoUrl: string;
  number: number;
  name: string;
  details: string;
}

interface ImageComponentProps {
  imageUrl?: string;
  number: number;
  name: string;
  details: string;
}

// -------------------------
// Image Component
// -------------------------
const ImageComponent = ({
  imageUrl,
  number,
  name,
  details,
}: ImageComponentProps) => {
  if (!imageUrl) {
    return (
      <View style={{ margin: "0 5 0 5" }}>
        <Text style={styles.text}>Error loading image</Text>
        <Text style={[styles.text, { margin: "0 auto 0 auto" }]}>
          {`${number} - ${name}`}
        </Text>
      </View>
    );
  }

  return (
    <View style={{ margin: "0 5 0 5" }}>
      <View style={{ border: "1px black solid" }}>
        <Image
          src={imageUrl}
          style={{
            maxWidth: 200,
            maxHeight: 200,
          }}
        />
      </View>
      <Text style={[styles.text, { margin: "0 auto 0 auto" }]}>
        {`${number} - ${name}`}
      </Text>
    </View>
  );
};

// -------------------------
// Main Component
// -------------------------
function PDFCont({ rawData, loadedImages, anchorId, footer }: Props) {
  // Collect all relevant photos from both "high" and "acceptable" readings
  const getAllPhotos = useMemo(() => {
    const allPhotos: PhotoInfo[] = [];

    // Add photos from high readings
    rawData.high.forEach((item: ContinuityItem) => {
      if (item.photo) {
        // FIX: Split comma-separated photos and take the first one
        const photos = item.photo.split(',').map(p => p.trim());
        const firstPhoto = photos[0];
        
        allPhotos.push({
          photoUrl: firstPhoto,
          number: item.number,
          name: item.name,
          details: item.details ?? "",
        });
      }
    });

    return allPhotos;
  }, [rawData]);

  // Utility: split array into rows
  const chunk = (arr: PhotoInfo[], size: number): PhotoInfo[][] => {
    return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
      arr.slice(i * size, i * size + size)
    );
  };

  // Format reading value
  const formatValue = (val: number) => (val >= 999 ? "> 999.0" : val.toFixed(1));

  // -------------------------
  // Render
  // -------------------------
  return (
    <Page size="A4" style={styles.body}>
      {anchorId && <Text id={anchorId} style={{ fontSize: 1, height: 0 }} />}

      <Text style={styles.title}>Continuity</Text>

      <View>
        <Text style={styles.text}>
          Injection testing does not confirm the adequacy of plant bonding to the earth grid or the
          physical condition of the earth grid conductors. This has been tested separately and
          includes all primary plant. In particular, the HV switchgear, generator neutral, and
          transformer neutral connections to earth have been checked. Tests have been carried out to
          a common reference point using a micro-ohmmeter.{"\n\n"}
          Equipment continuity tests were carried out on all primary equipment, site fencing and a
          selection of secondary equipment.{"\n\n"}
          Primary equipment has been assessed against the 10 mΩ limit detailed within the EEA Guide
          to Power System Earthing Practice 2019.{"\n\n"}
          Secondary equipment and LV equipment has been assessed against the acceptable resistance
          limit of 500 mΩ detailed within AS/NZS 3000;2018.
        </Text>
      </View>

      {/* Summary rows - WRAPPED IN THEIR OWN VIEW */}
      <View>
        <View style={styles.tableRow}>
          <View style={[styles.tableColNoBorder, styles.tableCol30]}>
            <Text style={[styles.tableCell, styles.textBold]}>
              Measurements Taken
            </Text>
          </View>
          <View style={[styles.tableColNoBorder, styles.tableCol70]}>
            <Text style={[styles.tableCell, styles.text]}>
              {rawData.total}
            </Text>
          </View>
        </View>

        <View style={styles.tableRow}>
          <View style={[styles.tableColNoBorder, styles.tableCol30]}>
            <Text style={[styles.tableCell, styles.textBold]}>
              Measured {">"} 10 mΩ
            </Text>
          </View>
          <View style={[styles.tableColNoBorder, styles.tableCol70]}>
            <Text style={[styles.tableCell, styles.text]}>
              {rawData.high.length}
            </Text>
          </View>
        </View>
      </View>

      {/* High readings table - NOW A SIBLING, NOT NESTED */}
      {rawData.high.length > 0 && (
        <View>
          <Text style={[styles.text, { margin: "5 0 5 0" }]}>
            Measurements that were taken as {">"} 10 mΩ are shown in the table below.
          </Text>

          <View style={styles.table}>
            <View style={[styles.tableRow, styles.borderBottom]}>
              <View style={{ width: "10%" }}>
                <Text style={[{ margin: "5 auto 5 auto" }, styles.textBold]}>ID</Text>
              </View>
              <View style={{ width: "40%" }}>
                <Text style={[{ margin: "5 0 5 0" }, styles.textBold]}>Description</Text>
              </View>
              <View style={{ width: "30%" }}>
                <Text style={[{ margin: "5 0 5 0" }, styles.textBold]}>Details/Notes</Text>
              </View>
              <View style={{ width: "20%" }}>
                <Text style={[{ margin: "5 auto 5 auto" }, styles.textBold]}>
                  Reading (mΩ)
                </Text>
              </View>
            </View>

            {Object.entries(rawData.high as ContinuityItem[]).map(
              ([_, item]: [string, ContinuityItem]) => (
                <View key={item.number}>
                  <View style={styles.tableRow}>
                    <View style={{ width: "10%" }}>
                      <Text style={[{ margin: "5 auto 5 auto" }, styles.text]}>
                        {item.number}
                      </Text>
                    </View>
                    <View style={{ width: "40%" }}>
                      <Text style={[{ margin: "5 0 5 0" }, styles.text]}>
                        {item.name}
                      </Text>
                    </View>
                    <View style={{ width: "30%" }}>
                      <Text style={[{ margin: "5 0 5 0" }, styles.text]}>
                        {item.details ?? "-"}
                      </Text>
                    </View>
                    <View style={{ width: "20%" }}>
                      <Text style={[{ margin: "5 auto 5 auto" }, styles.text]}>
                        {formatValue(item.value)}
                      </Text>
                    </View>
                  </View>
                </View>
              )
            )}
          </View>
        </View>
      )}

      {/* Photo grid - NOW A SIBLING WITH EXPLICIT BREAK */}
      {rawData.high.length > 0 && getAllPhotos.length > 0 && (
        <View break>
          <View>
            {chunk(getAllPhotos, 3).map((row, rowIndex) => (
              <View
                key={rowIndex}
                style={{
                  flexDirection: "row",
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: 10,
                }}
              >
                {row.map((photoInfo: PhotoInfo, index: number) => (
                  <ImageComponent
                    key={index}
                    imageUrl={loadedImages[photoInfo.photoUrl]}
                    number={photoInfo.number}
                    name={photoInfo.name}
                    details={photoInfo.details}
                  />
                ))}
              </View>
            ))}
          </View>
        </View>
      )}

      {footer}
    </Page>
  );
}

export default PDFCont;