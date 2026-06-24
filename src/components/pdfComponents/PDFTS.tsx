import PDFFooter from "./PDFFooter";
import { Page, Text, View, Image } from "@react-pdf/renderer";
import { styles } from "./PDFStyles";
import { useMemo, ReactNode } from "react";
import type { Style } from "@react-pdf/types";

// -------------------------------------------------------------------
// Type Definitions
// -------------------------------------------------------------------

interface SectionItem {
  photo?: string;
  number: number;
  name: string;
  details: string;
  value?: number;
  limit?: number;
  ground?: string;
}

interface Section {
  hazards: SectionItem[];
  acceptable: SectionItem[];
  total: number;
}

interface RawData {
  limitStandard: "IEEE80" | "IEC" | string;
  limits: { [key: string]: number };
  iec_site_class?: "Special" | string;
  PA?: Section;
  RA?: Section;
  Step?: Section;
}

interface Props {
  rawData: RawData;
  mapImages: string[];
  faultDuration: number;
  soilRes: number;
  loadedImages: { [key: string]: string }; // Pre-loaded image URLs
  anchorId?: string;
  footer?: ReactNode;
}

interface PhotoInfo {
  photoUrl: string;
  number: number;
  name: string;
  details: string;
}

interface LimitTableRowProps {
  description: string;
  touchValue: string | number;
  stepValue: string | number;
  isHeader?: boolean;
  isLastRow?: boolean;
}

interface VoltageTableProps {
  title: string;
  data: { [key: string]: number };
  soilRes: number;
  faultDuration: number;
  prefix: string;
  limitStandard?: string; // Added to help with key construction
}

interface ImageComponentProps {
  imageUrl: string | undefined;
  number: number;
  name: string;
  details: string;
}

interface SectionPhotosProps {
  sectionData: Section; // Use the defined Section type
  loadedImages: { [key: string]: string };
  sectionName: string;
}

// -------------------------------------------------------------------
// Helper Functions
// -------------------------------------------------------------------

const formatNumber = (value: any): string => {
  if (typeof value === "number") {
    return value.toLocaleString("en-US");
  }
  return value;
};

const formatLimit = (value: any): string => {
  if (typeof value === "number") {
    return Math.round(value).toLocaleString("en-US");
  }
  if (value != null) {
    return String(value);
  }
  return "N/A";
};

const chunk = <T,>(arr: T[], size: number): T[][] => {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size)
  );
};

// -------------------------------------------------------------------
// Sub-Components
// -------------------------------------------------------------------

const LimitTableRow = ({
  description,
  touchValue,
  stepValue,
  isHeader = false,
  isLastRow = false,
}: LimitTableRowProps) => {
  const rowStyle = isLastRow
    ? styles.tableRowBottomBorder
    : styles.tableRowTopMiddleBorder;
  const textColor = isHeader ? "white" : "black";
  const backgroundColor = isHeader ? "#005DA5" : "transparent";

  const valueColumnStyle: Style[] = isHeader
    ? [styles.tableCell, styles.textBold, { color: textColor, textAlign: "center" }]
    : [styles.limitTableText, { color: textColor, textAlign: "center" }];

  return (
    <View style={[styles.tableRow, rowStyle]}>
      <View
        style={[
          styles.firstAndMiddleColumn,
          {
            backgroundColor,
            width: "60%",
          },
        ]}
      >
        <Text
          style={[
            isHeader ? styles.textBold : styles.limitTableText,
            {
              color: textColor,
              marginTop: "auto",
              marginBottom: "auto",
              marginLeft: 5,
            },
          ]}
        >
          {description}
        </Text>
      </View>
      <View
        style={[
          styles.firstAndMiddleColumn,
          {
            backgroundColor,
            width: "20%",
            alignItems: "center",
            justifyContent: "center",
          },
        ]}
      >
        <Text style={valueColumnStyle}>
          {formatNumber(touchValue)}
        </Text>
      </View>
      <View
        style={[
          styles.lastColumn,
          {
            backgroundColor,
            width: "20%",
            alignItems: "center",
            justifyContent: "center",
          },
        ]}
      >
        <Text style={valueColumnStyle}>
          {formatNumber(stepValue)}
        </Text>
      </View>
    </View>
  );
};

const VoltageTable = ({
  title,
  data,
  soilRes,
  faultDuration,
  prefix,
  limitStandard,
}: VoltageTableProps) => {
  // Helper to construct keys safely, handling the "IEC" prefix if needed
  const getKey = (baseKey: string) => {
    // If data has the exact key, use it
    if (data[baseKey] !== undefined) return baseKey;
    // If standard is IEC and we don't find the base key, try prepending "IEC"
    if ((limitStandard === "IEC" || Object.keys(data).some(k => k.startsWith("IEC"))) && !baseKey.startsWith("IEC")) {
       return `IEC${baseKey}`;
    }
    return baseKey;
  };

  const rows = [
    {
      description:
        "Loaded tolerable limit (any surface or between two conductors)",
      touchKey: getKey(`Reach${prefix}Asph`), // Usually Reach values are consistent across surfaces
      // CORRECTED: Use Step...Metal for the loaded step limit, not Reach
      stepKey: getKey(`Step${prefix}Metal`), 
    },
    {
      description: `${soilRes} Ω-m surface (natural ground typical)`,
      touchKey: getKey(`Touch${prefix}NG`),
      stepKey: getKey(`Step${prefix}NG`),
    },
    {
      description: "50 Ω-m surface (300 mm wet concrete)",
      touchKey: getKey(`Touch${prefix}Conc`),
      stepKey: getKey(`Step${prefix}Conc`),
    },
    {
      description: "3,000 Ω-m surface (100 mm crushed rock layer over natural)",
      touchKey: getKey(`Touch${prefix}CR`),
      stepKey: getKey(`Step${prefix}CR`),
    },
    {
      description: "15,000 Ω-m surface (50 mm asphalt layer over natural)",
      touchKey: getKey(`Touch${prefix}Asph`),
      stepKey: getKey(`Step${prefix}Asph`),
    },
  ];

  return (
    <>
      <Text
        style={[
          styles.textBold,
          title.includes("Shoes") ? { marginTop: 5 } : {},
        ]}
      >
        {title}
      </Text>
      <View style={styles.tableNoBorder}>
        <LimitTableRow
          description="Tolerable Limits"
          touchValue={`Touch Voltage (V)\n${faultDuration} s`}
          stepValue={`Step Voltage (V)\n${faultDuration} s`}
          isHeader={true}
        />
        {rows.map((row, index) => (
          <LimitTableRow
            key={index}
            description={row.description}
            touchValue={data[row.touchKey]}
            stepValue={data[row.stepKey]}
            isLastRow={index === rows.length - 1}
          />
        ))}
      </View>
    </>
  );
};

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

const SectionPhotos = ({
  sectionData,
  loadedImages,
  sectionName,
}: SectionPhotosProps) => {
  const getAllPhotos = useMemo(() => {
    const allPhotos: PhotoInfo[] = [];

    sectionData.hazards.forEach((item) => {
      if (item.photo) {
        const photos = item.photo.split(',').map(p => p.trim());
        const firstPhoto = photos[0];
        
        allPhotos.push({
          photoUrl: firstPhoto,
          number: item.number,
          name: item.name,
          details: item.details,
        });
      }
    });

    return allPhotos;
  }, [sectionData]);

  if (getAllPhotos.length === 0) return null;

  return (
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
  );
};

// -------------------------------------------------------------------
// Main Component
// -------------------------------------------------------------------

function PDFTS({
  rawData,
  mapImages,
  faultDuration,
  soilRes,
  loadedImages,
  anchorId,
  footer,
}: Props) {
  // helper function to render hazard + acceptable rows
  const renderHazardTable = (section: Section) => {
    const hazards = section.hazards;
    const acceptable = section.acceptable;
    const rows: JSX.Element[] = [];

    if (hazards.length > 0) {
      hazards.forEach((item: SectionItem) => {
        rows.push(
          <View key={item.number}>
            <View style={styles.tableRow}>
              <View style={{ width: "10%" }}>
                <Text style={[{ margin: "5 auto 5 auto" }, styles.text]}>
                  {item.number}
                </Text>
              </View>
              <View style={{ width: "40%" }}>
                <Text style={[{ margin: "5 0 5 0" }, styles.text]}>
                  {item.name +
                    (!isNaN(Number(item.details)) ? " " + item.details : "")}
                </Text>
              </View>
              <View style={{ width: "20%" }}>
                <Text style={[{ margin: "5 auto 5 auto" }, styles.text]}>
                  {item.value != null ? item.value.toFixed(1) : "N/A"}
                </Text>
              </View>
              <View style={{ width: "15%" }}>
                <Text style={[{ margin: "5 auto 5 auto" }, styles.text]}>
                  {formatLimit(item.limit)}
                </Text>
              </View>
              <View style={{ width: "15%" }}>
                <Text style={[{ margin: "5 auto 5 auto" }, styles.text]}>
                  {item.ground}
                </Text>
              </View>
            </View>
          </View>
        );
      });
    } else {
      acceptable.slice(0, 4).forEach((item: SectionItem) => {
        rows.push(
          <View key={item.number}>
            <View style={styles.tableRow}>
              <View style={{ width: "10%" }}>
                <Text style={[{ margin: "5 auto 5 auto" }, styles.text]}>
                  {item.number}
                </Text>
              </View>
              <View style={{ width: "40%" }}>
                <Text style={[{ margin: "5 0 5 0" }, styles.text]}>
                  {item.name +
                    (!isNaN(Number(item.details)) ? " " + item.details : "")}
                </Text>
              </View>
              <View style={{ width: "20%" }}>
                <Text style={[{ margin: "5 auto 5 auto" }, styles.text]}>
                  {item.value != null ? item.value.toFixed(1) : "N/A"}
                </Text>
              </View>
              <View style={{ width: "15%" }}>
                <Text style={[{ margin: "5 auto 5 auto" }, styles.text]}>
                  {formatLimit(item.limit)}
                </Text>
              </View>
              <View style={{ width: "15%" }}>
                <Text style={[{ margin: "5 auto 5 auto" }, styles.text]}>
                  {item.ground}
                </Text>
              </View>
            </View>
          </View>
        );
      });
    }

    return rows;
  };

  // helper to render a full section
  const renderSection = (
    section: Section | undefined,
    title: string,
    sectionName: string,
    breakBefore: boolean = false,
    keyProp?: string
  ) => {
    if (!section || section.total <= 0) return null;

    return (
      <View key={keyProp} break={breakBefore} style={{ marginBottom: 10 }}>
        <Text style={styles.subtitle}>{title}</Text>

        {/* Counts */}
        <View style={styles.tableRow}>
          <View style={[styles.tableColNoBorder, styles.tableCol30]}>
            <Text style={[styles.tableCell, styles.textBold]}>
              Measurements Taken
            </Text>
          </View>
          <View style={[styles.tableColNoBorder, styles.tableCol70]}>
            <Text style={[styles.tableCell, styles.text]}>{section.total}</Text>
          </View>
        </View>

        <View style={styles.tableRow}>
          <View style={[styles.tableColNoBorder, styles.tableCol30]}>
            <Text style={[styles.tableCell, styles.textBold]}>
              Hazardous Voltages
            </Text>
          </View>
          <View style={[styles.tableColNoBorder, styles.tableCol70]}>
            <Text style={[styles.tableCell, styles.text]}>
              {section.hazards.length}
            </Text>
          </View>
        </View>

        {/* Table - always render */}
        <Text style={[styles.text, { margin: "5 0 5 0" }]}>
          {section.hazards.length > 0
            ? section.hazards.length < 4
              ? "The highest measurements are shown in the table below."
              : "The hazardous measurements are shown in the table below."
            : "Representative acceptable measurements are shown in the table below."}
        </Text>

        <View style={styles.table}>
          <View style={[styles.tableRow, styles.borderBottom]}>
            <View style={{ width: "10%" }}>
              <Text style={[{ margin: "5 auto 5 auto" }, styles.textBold]}>
                ID
              </Text>
            </View>
            <View style={{ width: "40%" }}>
              <Text style={[{ margin: "5 0 5 0" }, styles.textBold]}>
                Description
              </Text>
            </View>
            <View style={{ width: "20%" }}>
              <Text style={[{ margin: "5 auto 5 auto" }, styles.textBold]}>
                Touch Voltage (V)
              </Text>
            </View>
            <View style={{ width: "15%" }}>
              <Text style={[{ margin: "5 auto 5 auto" }, styles.textBold]}>
                Limit (V)
              </Text>
            </View>
            <View style={{ width: "15%" }}>
              <Text style={[{ margin: "5 auto 5 auto" }, styles.textBold]}>
                Surface Type
              </Text>
            </View>
          </View>

          {renderHazardTable(section)}
        </View>

        {/* Images - only if hazards exist */}
        {section.hazards.length > 0 && (
          // FORCE PAGE BREAK BEFORE IMAGES
          <View break>
            <SectionPhotos
              sectionData={{ ...section, acceptable: [], hazards: section.hazards }}
              loadedImages={loadedImages}
              sectionName={sectionName}
            />
          </View>
        )}
      </View>
    );
  };

  return (
    <Page size="A4" style={styles.body}>
      {anchorId && (
        <Text
          id={anchorId}
          style={{ fontSize: 1, height: 0, margin: 0, padding: 0 }}
        />
      )}

      <Text style={styles.title}>Touch and Step Voltage Measurements</Text>

      {/* Voltage Limits */}
      <View style={{ marginBottom: 10 }}>
        <Text style={styles.subtitle}>
          {rawData.limitStandard} Tolerable Limits
        </Text>
        {rawData.limitStandard === "IEEE80" ? (
          <>
            <VoltageTable
              title="Tolerable Limits for Public Access:"
              data={rawData.limits}
              soilRes={soilRes}
              faultDuration={faultDuration}
              prefix="PA"
              limitStandard={rawData.limitStandard}
            />
            <VoltageTable
              title="Tolerable Limits for Restricted Access:"
              data={rawData.limits}
              soilRes={soilRes}
              faultDuration={faultDuration}
              prefix="RA"
              limitStandard={rawData.limitStandard}
            />
          </>
        ) : rawData.limitStandard === "IEC" ? (
          <>
            {rawData.iec_site_class === "Special" && (
              <VoltageTable
                title="Tolerable Limits (Barefoot):"
                data={rawData.limits}
                soilRes={soilRes}
                faultDuration={faultDuration}
                prefix="Special"
                limitStandard={rawData.limitStandard}
              />
            )}
            <VoltageTable
              title="Tolerable Limits (With Shoes):"
              data={rawData.limits}
              soilRes={soilRes}
              faultDuration={faultDuration}
              prefix="Normal"
              limitStandard={rawData.limitStandard}
            />
          </>
        ) : (
          <Text>No table available for this standard.</Text>
        )}
      </View>

      {/* Sections */}
      {(() => {
        const sections = [
          {
            key: "PA",
            data: rawData.PA,
            title: "Public Access Touch Voltages",
            name: "Public Access touch",
          },
          {
            key: "RA",
            data: rawData.RA,
            title: "Restricted Access Touch Voltages",
            name: "Restricted Access touch",
          },
          {
            key: "STEP",
            data: rawData.Step,
            title: "Step Voltages",
            name: "step",
          },
        ].filter((s) => s.data && s.data.total > 0);

        const out: (JSX.Element | null)[] = []; // Can be null
        let prevHadHazards = false;

        for (const s of sections) {
          // If the previous section had images (hazards), force this NEW section onto a new page
          // This matches the requirement: Images -> Page Break -> Next Section
          const breakBefore = prevHadHazards; 
          out.push(
            renderSection(
              s.data,
              s.title,
              s.name,
              breakBefore,
              `section-${s.key}`
            )
          );
          prevHadHazards =
            Array.isArray(s.data?.hazards) && s.data.hazards.length > 0;
        }

        return out;
      })()}

      {footer}
    </Page>
  );
}

export default PDFTS;