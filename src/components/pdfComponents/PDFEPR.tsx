import PDFFooter from "./PDFFooter";
import { Page, Text, View, Image, Link } from '@react-pdf/renderer';
import { styles } from "./PDFStyles";
import { ReactNode } from "react";

interface Props {
  rawData: any;
  eprImages: any;
  footer?: ReactNode;
}


function PDFEPR({ rawData, eprImages, anchorId, footer }: Props & { anchorId?: string }) {
  return (
    <Page size="A4" style={styles.body}>
      
      {anchorId && <Text id={anchorId} style={{ fontSize: 1, height: 0 }} />}

      <Text style={styles.title}>Telecommunications EPR Contours</Text>

      <View>
        <Text style={styles.text}>
          The limits for telecommunication plant are given in the Electricity (Safety) Regulations, 2010, Regulation 33, 
          and referred to in AS/NZS 3835.1:2006, Telecommunications EPR - Code of Practice, Section 4.2. {"\n\n"}
          
          The 430 V EPR contour is applicable to faults with a primary fault duration greater than 0.5 s. 
          The 650 V EPR contour is applicable to faults with a primary fault duration less than or equal to 0.5 s. {"\n\n"}

          Chorus are also interested in the locations of the 1,500 V and 2,500 V EPR contours, as this could affect the 
          insulation on any communications cables located within these contours. The 1,500 V level relates to older cables 
          and the 2,500 V level relates to newer cables. The 1,500 V and 2,500 V EPR contours should be determined using 
          the using the highest fault level.

        </Text>
      </View>

      {/* <Text style={styles.textParagraph}>
        {"From the "}
        {rawData.length}
        {" Voltage Traverse"}
        {rawData.length == 1 ? "," : "s,"}
        {" conducted, the Telecommunication EPR Contours can be determined."}
      </Text> */}
      {rawData.map((item: any, index: any) => {
        // Parse contour string more efficiently
        const contourObj =
          typeof item.contour === "string"
            ? item.contour
                .slice(1, -1)
                .split(",")
                .reduce((obj: Record<string, number>, pair: string) => {
                  const [key, value] = pair
                    .trim()
                    .split(":")
                    .map((item) => item.trim());
                  obj[key] = value === "-1" ? -1 : parseFloat(value);
                  return obj;
                }, {})
            : item.contour;
        return (
          <View key={item.name}>
            <Text style={styles.textParagraph} key={item.name}>
              {"From the "}
              {item.name}
              {" traverse, the plot below shows the EPR traverse used to determine the EPR contours."}
            </Text>
            <Image
              src={eprImages[index]}
              style={{
                borderWidth: 0.5,      // pt border
                borderColor: "black",
                marginBottom: 8,
              }}
            />
            <Text style={[styles.text]}>
              From this traverse, it is determined that:
            </Text>
            {Object.entries(contourObj).map(([voltage, distance], index) => {
              return (
                <View style={{ 
                  flexDirection: "row", 
                  marginLeft: 17.85, // 0.63 cm indent
                  }} key={voltage}>
                  <Text style={[styles.textList, { marginRight: 6 }]}>
                    {index + 1}.
                  </Text>
                  {distance === -1 ? (
                    <Text style={styles.textList}>
                      {"The " +
                        Number(voltage).toLocaleString() +
                        " V contour does not exist."}
                    </Text>
                  ) : (
                    <Text style={styles.textList}>
                      {"The " +
                        Number(voltage).toLocaleString() +
                        " V contour is located "}
                      {Number(distance).toFixed(0)}
                      {" m from the edge of the earth grid."}
                    </Text>
                  )}
                </View>
              );
            })}

          </View>
        );
      })}
      {footer}
    </Page>
  );
}

export default PDFEPR;
