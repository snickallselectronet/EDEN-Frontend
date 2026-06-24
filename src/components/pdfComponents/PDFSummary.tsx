import PDFFooter from "./PDFFooter";
import { Page, Text, View, Link } from "@react-pdf/renderer";
import { styles } from "./PDFStyles";
import { ReactNode } from "react";

interface Props {
  ResponseObj: any;
  footer?: React.ReactNode;
}

function PDFSummary({ ResponseObj, anchorId, footer }: Props & { anchorId?: string }) {
  return (
    <Page size="A4" style={styles.body}>

    {anchorId && <Text id={anchorId} style={{ fontSize: 1, height: 0, margin: 0, padding: 0 }} />}

      <Text style={styles.title}>Conclusions</Text>
      <View style={styles.tableNoBorder}>
        <View style={styles.tableRow}>
          <View style={[styles.tableColNoBorder, styles.tableCol30]}>
            <Text style={[styles.tableCell, styles.textBold]}>Site</Text>
          </View>
          <View style={[styles.tableColNoBorder, styles.tableCol70]}>
            <Text style={[styles.tableCell, styles.text]}>
              {ResponseObj.name + " Substation"} 
            </Text>
          </View>
        </View>


        <View style={styles.tableRow}>
          <View style={[styles.tableColNoBorder, styles.tableCol30]}>
            <Text style={[styles.tableCell, styles.textBold]}
            >Date Tested</Text>
          </View>
          <View style={[styles.tableColNoBorder, styles.tableCol70]}>
            <Text style={[styles.tableCell, styles.text]}>
              {ResponseObj.reportMisc.dateTested}
            </Text>
          </View>
        </View>



        <View style={styles.tableRow}>
          <View style={[styles.tableColNoBorder, styles.tableCol30]}>
            <Text style={[styles.tableCell, styles.textBold]}>
              Fault Conditions
            </Text>
          </View>
          <View style={[styles.tableColNoBorder, styles.tableCol70]}>
            <Text style={[styles.tableCell, styles.text]}>
              {ResponseObj.fault_I.toLocaleString() +
                " A, " +
                ResponseObj.fault_s +
                " seconds"}
            </Text>
          </View>
        </View>

        <View style={styles.tableRow}>
          <View style={[styles.tableColNoBorder, styles.tableCol30]}>
            <Text style={[styles.tableCell, styles.textBold]}>
              Fault Scenario
            </Text>
          </View>
          <View style={[styles.tableColNoBorder, styles.tableCol70]}>
            <Text style={[styles.tableCell, styles.text]}>
              {ResponseObj.reportMisc.faultScenario}
            </Text>
          </View>
        </View>


        <View style={styles.tableRow}>
          <View style={[styles.tableColNoBorder, styles.tableCol30]}>
            <Text style={[styles.tableCell, styles.textBold]}>
              Injected Current
            </Text>
          </View>
          <View style={[styles.tableColNoBorder, styles.tableCol70]}>
            <Text style={[styles.tableCell, styles.text]}>
              {ResponseObj.injected_I + " A"}
            </Text>
          </View>
        </View>
        <View style={styles.tableRow}>
          <View style={[styles.tableColNoBorder, styles.tableCol30]}>
            <Text style={[styles.tableCell, styles.textBold, styles.noWrap]}>
              Earth Grid Voltage Rise
            </Text>
          </View>
          <View style={[styles.tableColNoBorder, styles.tableCol70]}>
            {ResponseObj.VTRecord.map((item: any) => {
              const egvr = item.max_egvr / ResponseObj.injected_I / 1000;
              const formattedValue = egvr < 0.1 ? egvr.toFixed(3) : egvr.toFixed(2);
              const EGVR = Math.round(parseFloat(formattedValue) * ResponseObj.fault_I);

              return (
                <Text key={item.name} style={[styles.tableCell, styles.text]}>
                  {EGVR + " V"}
                </Text>
              );
            })}
          </View>
        </View>
        <View style={styles.tableRow}>
          <View style={[styles.tableColNoBorder, styles.tableCol30]}>
            <Text style={[styles.tableCell, styles.textBold, styles.noWrap]}>
              Earth Grid Impedance
            </Text>
          </View>
          <View style={[styles.tableColNoBorder, styles.tableCol70]}>
            <Text style={[styles.tableCell, styles.text]}>
              {ResponseObj.VTRecord.map((item: any) => {
                return (
                  <View key={item.name}>
                    <Text style={styles.text}>
                      {"From the " + item.name + " Traverse: "}{" "}
                      <Text style={styles.text}>
                        {item.max_egvr / ResponseObj.injected_I / 1000 < 0.1
                          ? (
                              item.max_egvr /
                              ResponseObj.injected_I /
                              1000
                            ).toFixed(3)
                          : (
                              item.max_egvr /
                              ResponseObj.injected_I /
                              1000
                            ).toFixed(2)}
                        {" Ω\n"}
                      </Text>
                    </Text>
                    {Object.keys(ResponseObj.CurrentDistRecord).length !==
                      0 && (
                      <Text style={styles.text}>
                        Grid Only Impedance:{" "}
                        <Text style={styles.textBold}>
                          {(
                            Number(
                              (
                                Math.max(ResponseObj.CurrentDistRecord.egvrs) /
                                1000
                              ).toFixed(3)
                            ) /
                            Number(
                              (
                                ResponseObj.CurrentDistRecord.earth.current /
                                1000
                              ).toFixed(3)
                            )
                          ).toFixed(3)}{" "}
                          Ω
                        </Text>
                      </Text>
                    )}
                  </View>
                );
              })}
            </Text>
          </View>
        </View>
        {ResponseObj.EPRRecord.length != 0 && (
          <View style={styles.tableRow}>
            <View style={[styles.tableColNoBorder, styles.tableCol30]}>
              <Text style={[styles.tableCell, styles.textBold, styles.noWrap]}>
                Telecommunications EPR Contours
              </Text>
            </View>
            <View style={[styles.tableColNoBorder, styles.tableCol70]}>
              {ResponseObj.EPRRecord.map((item: any) => {
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
                  <View key={item.name} style={styles.tableCell}>
                    <Text style={styles.text}>
                      {/* {"From the " + item.name + " traverse:"} */}
                      {"With respect to the telecommunications related EPR contours:"}
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
                                " V contour does not exist"}
                            </Text>
                          ) : (
                            <Text style={styles.textList}>
                              {"The " +
                                Number(voltage).toLocaleString() +
                                " V contour is located "}
                              {Number(distance).toFixed(0)}
                              {" m from the edge of the earth grid"}
                            </Text>
                          )}
                        </View>
                      );
                    })}
                  </View>
                );
              })}
            </View>
          </View>
        )}
        <View style={styles.tableRow}>
          <View style={[styles.tableColNoBorder, styles.tableCol30]}>
            <Text style={[styles.tableCell, styles.textBold]}>
              Topsoil Resistivity
            </Text>
          </View>
          <View style={[styles.tableColNoBorder, styles.tableCol70]}>
            <Text style={[styles.tableCell, styles.text]}>
              {ResponseObj.soil_R} Ω-m
            </Text>
          </View>
        </View>
        {Object.keys(ResponseObj.TSRecord).length != 0 && (
          <View style={styles.tableRow}>
            <View style={[styles.tableColNoBorder, styles.tableCol30]}>
              <Text style={[styles.tableCell, styles.textBold]}>
                Touch and Step
              </Text>
            </View>
            <View style={[styles.tableColNoBorder, styles.tableCol70]}>
              <Text style={[styles.tableCell, styles.text]}>
                <Text style={styles.textBold}>
                  {ResponseObj.TSRecord.PA.total}
                </Text>
                {" public access touch voltage measurements were taken, "}
                <Text style={styles.textBold}>
                  {ResponseObj.TSRecord.PA.hazards.length}
                </Text>
                {" were found to be hazardous\n"}
              </Text>
              <Text style={[styles.tableCell, styles.text]}>
                <Text style={styles.textBold}>
                  {ResponseObj.TSRecord.RA.total}
                </Text>
                {" Restricted access touch voltage measurements were taken, "}
                <Text style={styles.textBold}>
                  {ResponseObj.TSRecord.RA.hazards.length}
                </Text>
                {" were found to be hazardous"}
              </Text>
              <Text style={[styles.tableCell, styles.text]}>
                <Text style={styles.textBold}>
                  {ResponseObj.TSRecord.Step.total}
                </Text>
                {" step voltage measurements were taken, "}
                <Text style={styles.textBold}>
                  {ResponseObj.TSRecord.Step.hazards.length}
                </Text>
                {" were found to be hazardous"}
              </Text>
            </View>
          </View>
        )}
        {Object.keys(ResponseObj.ConRecord).length != 0 && (
          <View style={styles.tableRow}>
            <View style={[styles.tableColNoBorder, styles.tableCol30]}>
              <Text style={[styles.tableCell, styles.textBold]}>
                Continuity
              </Text>
            </View>
            <View style={[styles.tableColNoBorder, styles.tableCol70]}>
              <Text style={[styles.tableCell, styles.text]}>
                <Text style={styles.textBold}>
                  {ResponseObj.ConRecord.total}
                </Text>
                {" measurements were taken, "}
                <Text style={styles.textBold}>
                  {ResponseObj.ConRecord.high.length}
                </Text>
                {" measurements were recorded above 10 mΩ"}
              </Text>
            </View>
          </View>
        )}
        {Object.keys(ResponseObj.CTInspRecord).length != 0 && (
          <View style={styles.tableRow}>
            <View style={[styles.tableColNoBorder, styles.tableCol30]}>
              <Text style={[styles.tableCell, styles.textBold]}>
                CT & VT Inspections
              </Text>
            </View>
            <View style={[styles.tableColNoBorder, styles.tableCol70]}>
              <Text style={[styles.tableCell, styles.text]}>
                <Text style={styles.textBold}>
                  {ResponseObj.CTInspRecord.length}
                </Text>
                {
                  " CT and VT earth connections were inspected. See the CT & VT Inspection section for further details"
                }
              </Text>
            </View>
          </View>
        )}

        <Text>
          {'\n'}
        </Text>

        <View style={styles.tableRow}>
          <View style={[styles.tableColNoBorder, styles.tableCol30]}>
            <Text style={[styles.tableCell, styles.textBold]}>
              View Full Report Here:
            </Text>
          </View>
          <View style={[styles.tableColNoBorder, styles.tableCol70]}>
            <Link
              src="https://eden.electronetgroup.com/portal/" 
              style={[styles.tableCell, styles.text, styles.noWrap, { color: "black", textDecoration: "none" }]}
            >
              {"https://eden.electronetgroup.com/portal/"}
            </Link>
          </View>
        </View>
        
      </View>
      {footer}
    </Page>
  );
}

export default PDFSummary;
