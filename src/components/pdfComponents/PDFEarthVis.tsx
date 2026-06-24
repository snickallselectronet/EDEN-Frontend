import { useMemo, ReactNode } from "react";
import PDFFooter from "./PDFFooter";
import { Page, Text, View, Image } from "@react-pdf/renderer";
import { styles } from "./PDFStyles";

// -----------------------------------------
// Types
// -----------------------------------------

interface VisualInspectionRecord {
  number: number;
  name: string;
  photos?: string;
  overallCond?: string;
  corrosion?: string;
  damaged?: string;
}

interface Props {
  rawData: VisualInspectionRecord[] | Record<string, VisualInspectionRecord>;
  loadedImages: { [key: string]: string };
  anchorId?: string;
  footer?: ReactNode;
}

interface PhotoInfo {
  photoUrl: string;
  number: number;
  name: string;
}

interface ImageComponentProps {
  imageUrl: string | undefined;
  number: number;
  name: string;
}

// -----------------------------------------
// Image Component
// -----------------------------------------
const ImageComponent = ({ imageUrl, number, name }: ImageComponentProps) => {
  if (!imageUrl) {
    return (
      <View style={{ margin: "0 5 0 5" }}>
        <Text style={styles.text}>Error loading image</Text>
        <Text style={[styles.text, { margin: "0 auto 0 auto" }]}>
          {number + " - " + name}
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
        {number + " - " + name}
      </Text>
    </View>
  );
};

// -----------------------------------------
// Main Component
// -----------------------------------------
function PDFEarthVis({ rawData, loadedImages, anchorId, footer }: Props) {
  // Function to get all photos from the data
  const getAllPhotos = useMemo(() => {
    const allPhotos: PhotoInfo[] = [];

    // Handle either array or object input
    const dataArray = Array.isArray(rawData)
      ? rawData
      : Object.values(rawData || {});

    dataArray.forEach((item: VisualInspectionRecord) => {
      if (item.photos) {
        const photoArray = item.photos.split(',').map(p => p.trim());
        const firstPhoto = photoArray[0];  
        
        allPhotos.push({
          photoUrl: firstPhoto,
          number: item.number,
          name: item.name,
        });
      }
    });
    return allPhotos;
  }, [rawData]);

  // Function to get 3 random photos
  const getRandomPhotos = useMemo(() => {
    const photos = [...getAllPhotos];
    const randomPhotos: PhotoInfo[] = [];
    const numPhotos = Math.min(3, photos.length);

    for (let i = 0; i < numPhotos; i++) {
      const randomIndex = Math.floor(Math.random() * photos.length);
      randomPhotos.push(photos[randomIndex]);
      photos.splice(randomIndex, 1);
    }

    // Sort by photo number
    return randomPhotos.sort(
      (a: PhotoInfo, b: PhotoInfo) => a.number - b.number
    );
  }, [getAllPhotos]);

  const chunk = (arr: PhotoInfo[], size: number): PhotoInfo[][] => {
    return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
      arr.slice(i * size, i * size + size)
    );
  };

  // -----------------------------------------
  // Render
  // -----------------------------------------
  return (
    <Page size="A4" style={styles.body}>
      {anchorId && <Text id={anchorId} style={{ fontSize: 1, height: 0 }} />}

      <Text style={styles.title}>Visual Inspection</Text>

      <View>
        <Text style={styles.text}>
          The injection tests do not confirm the physical condition of the earth
          grid conductors, and continuity testing may not indicate corrosion or
          other partial/gradual damage. Visual inspections can be undertaken to
          establish physical conduction.
        </Text>
      </View>

      {/* --- TABLE SECTION --- */}
      <View style={{ marginBottom: 10 }}>
        <View>
          <Text style={[styles.text, { margin: "5 0 5 0" }]}>
            {Array.isArray(rawData)
              ? rawData.length === 1
                ? "One earth connection was"
                : rawData.length > 1
                ? "Multiple earth connections were"
                : ""
              : Object.keys(rawData).length === 1
              ? "One earth connection was"
              : "Multiple earth connections were"}{" "}
            visually inspected. See the table below for details.
          </Text>

          {/* Table header */}
          <View style={[styles.tableRow, styles.borderBottom]}>
            <View style={[{ width: "10%" }]}>
              <Text style={[{ margin: "5 0 5 0" }, styles.textBold]}>ID</Text>
            </View>
            <View style={[{ width: "35%" }]}>
              <Text style={[{ margin: "5 0 5 0" }, styles.textBold]}>
                Description
              </Text>
            </View>
            <View style={[{ width: "25%" }]}>
              <Text style={[{ margin: "5 auto 5 auto" }, styles.textBold]}>
                Overall Condition
              </Text>
            </View>
            <View style={[{ width: "15%" }]}>
              <Text style={[{ margin: "5 auto 5 auto" }, styles.textBold]}>
                Corrosion
              </Text>
            </View>
            <View style={[{ width: "15%" }]}>
              <Text style={[{ margin: "5 auto 5 auto" }, styles.textBold]}>
                Damage
              </Text>
            </View>
          </View>

          {/* Data rows */}
          {Object.entries(rawData as Record<string, VisualInspectionRecord>)
            .sort(
              (
                a: [string, VisualInspectionRecord],
                b: [string, VisualInspectionRecord]
              ) => a[1].number - b[1].number
            )
            .map(([key, item]) => (
              <View key={key}>
                <View style={styles.tableRow}>
                  <View style={[{ width: "10%" }]}>
                    <Text style={[{ margin: "5 0 5 0" }, styles.text]}>
                      {item.number}
                    </Text>
                  </View>
                  <View style={[{ width: "35%" }]}>
                    <Text style={[{ margin: "5 0 5 0" }, styles.text]}>
                      {item.name}
                    </Text>
                  </View>
                  <View style={[{ width: "25%" }]}>
                    <Text style={[{ margin: "5 auto 5 auto" }, styles.text]}>
                      {item.overallCond}
                    </Text>
                  </View>
                  <View style={[{ width: "15%" }]}>
                    <Text style={[{ margin: "5 auto 5 auto" }, styles.text]}>
                      {item.corrosion ?? "None"}
                    </Text>
                  </View>
                  <View style={[{ width: "15%" }]}>
                    <Text style={[{ margin: "5 auto 5 auto" }, styles.text]}>
                      {item.damaged ?? "None"}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
        </View>
      </View>

      {/* --- IMAGE SECTION (Now outside the previous View to force break) --- */}
      <View break>
        <Text style={[styles.text, { margin: "5 0 5 0" }]}>
          The below images show examples of the earth connections found throughout the site.
        </Text>
        <View>
          {chunk(getRandomPhotos, 3).map((row, rowIndex) => (
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
                />
              ))}
            </View>
          ))}
        </View>
      </View>

      {footer}
    </Page>
  );
}

export default PDFEarthVis;