interface Props {
  rawData: any;
}

function Summary({ rawData }: Props) {
  return (
    <div id="summary-contents" className="content-section-container">
      <h2 className="section-title">Conclusions</h2>
      <table style={{ width: "100%", fontFamily: "Calibri, sans-serif" }}>
        <tbody>
          <tr>
            <td style={{ width: "30%", verticalAlign: "top" }}>
              <b>Site</b>
            </td>
            <td style={{ width: "70%", paddingBottom: "1em" }}>
              {rawData.name} Substation
            </td>
          </tr>

          <tr>
            <td style={{ verticalAlign: "top" }}>
              <b>Date Tested</b>
            </td>
            <td style={{ paddingBottom: "1em" }}>
              {rawData.reportMisc?.dateTested
                ? new Date(rawData.reportMisc.dateTested).toLocaleDateString()
                : "N/A"}
            </td>
          </tr>

          <tr>
            <td style={{ verticalAlign: "top" }}>
              <b>Fault Conditions</b>
            </td>
            <td style={{ paddingBottom: "1em" }}>
              {rawData.fault_I.toLocaleString()} A,{" "}
              {rawData.fault_s.toFixed(2)} seconds
            </td>
          </tr>

          <tr>
            <td style={{ verticalAlign: "top" }}>
              <b>Fault Scenario</b>
            </td>
            <td style={{ paddingBottom: "1em" }}>
              {rawData.reportMisc?.faultScenario || "N/A"}
            </td>
          </tr>

          <tr>
            <td style={{ verticalAlign: "top" }}>
              <b>Injected Current</b>
            </td>
            <td style={{ paddingBottom: "1em" }}>
              {rawData.injected_I} A
            </td>
          </tr>

          <tr>
            <td style={{ verticalAlign: "top" }}>
              <b>Earth Grid Voltage Rise</b>
            </td>
            <td style={{ paddingBottom: "1em" }}>
              {rawData.VTRecord.map((item: any, index: number) => {
                const egvr = item.max_egvr / rawData.injected_I / 1000;
                const formattedValue =
                  egvr < 0.1 ? egvr.toFixed(3) : egvr.toFixed(2);

                // CHANGED: Added .toLocaleString() to the end
                const EGVR = Math.round(
                  parseFloat(formattedValue) * rawData.fault_I
                ).toLocaleString();

                return (
                  <div
                    key={`${item.name || "egvr-row"}-${index}`} 
                  >
                    <div>
                      {EGVR} V
                      <br />
                    </div>
                  </div>
                );
              })}
            </td>
          </tr>

          <tr>
            <td style={{ verticalAlign: "top" }}>
              <b>Earth Grid Impedance</b>
            </td>
            <td style={{ paddingBottom: "1em" }}>
              {rawData.VTRecord.map((item: any, index: number) => (
                <div
                  key={`${item.name || "imp-row"}-${index}`} 
                >
                  <div>
                    From the {item.name} Traverse:{" "}
                    <b>
                      {item.max_egvr / rawData.injected_I / 1000 < 0.1
                        ? (
                            item.max_egvr / rawData.injected_I / 1000
                          ).toFixed(3)
                        : (
                            item.max_egvr / rawData.injected_I / 1000
                          ).toFixed(2)}{" "}
                      Ω
                    </b>
                    <br />
                  </div>

                  {Object.keys(rawData.CurrentDistRecord).length !== 0 && (
                    <>
                      Grid Only Impedance:{" "}
                      <b>
                        {(
                          Number(
                            (
                              Math.max(rawData.CurrentDistRecord.egvrs) / 1000
                            ).toFixed(3)
                          ) /
                          Number(
                            (
                              rawData.CurrentDistRecord.earth.current / 1000
                            ).toFixed(3)
                          )
                        ).toFixed(3)}{" "}
                        Ω
                      </b>
                    </>
                  )}
                </div>
              ))}
            </td>
          </tr>

          {rawData.EPRRecord.length !== 0 && (
            <tr>
              <td style={{ verticalAlign: "top" }}>
                <b>Telecommunications EPR Contours</b>
              </td>
              <td style={{ paddingBottom: "1em" }}>
                {rawData.EPRRecord.map((item: any, index: number) => {
                  const contourObj =
                    typeof item.contour === "string"
                      ? item.contour
                          .slice(1, -1)
                          .split(",")
                          .reduce((obj: Record<string, number>, pair: string) => {
                            const [key, value] = pair
                              .trim()
                              .split(":")
                              .map((v) => v.trim());
                            obj[key] =
                              value === "-1" ? -1 : parseFloat(value);
                            return obj;
                          }, {})
                      : item.contour;

                  return (
                    <div
                      key={`${item.name || "epr-row"}-${index}`} 
                      style={{ marginBottom: "0.5em" }}
                    >
                      <div>
                        With respect to the telecommunications related EPR
                        contours:
                      </div>
                      <ol style={{ marginTop: "0.25em", paddingLeft: "2em" }}>
                        {Object.entries(contourObj).map(
                          ([voltage, distance], idx) => (
                            <li
                              key={`${voltage || "v"}-${idx}`} 
                              style={{ marginBottom: "0.25em" }}
                            >
                              {distance === -1 ? (
                                <>
                                  The {Number(voltage).toLocaleString()} V
                                  contour does not exist
                                </>
                              ) : (
                                <>
                                  The {Number(voltage).toLocaleString()} V
                                  contour is located{" "}
                                  <b>{Number(distance).toFixed(0)}</b> m from
                                  the edge of the earth grid
                                </>
                              )}
                            </li>
                          )
                        )}
                      </ol>
                    </div>
                  );
                })}
              </td>
            </tr>
          )}

          <tr>
            <td style={{ verticalAlign: "top" }}>
              <b>Topsoil Resistivity</b>
            </td>
            <td style={{ paddingBottom: "1em" }}>
              <b>{rawData.soil_R} Ω-m</b>
            </td>
          </tr>

          {Object.keys(rawData.TSRecord).length !== 0 && (
            <tr>
              <td style={{ verticalAlign: "top" }}>
                <b>Touch and Step</b>
              </td>
              <td style={{ paddingBottom: "1em" }}>
                <b>{rawData.TSRecord.PA.total}</b> public access touch voltage
                measurements were taken,{" "}
                <b>{rawData.TSRecord.PA.hazards.length}</b> were found to be
                hazardous
                <br />
                <b>{rawData.TSRecord.RA.total}</b> restricted access touch
                voltage measurements were taken,{" "}
                <b>{rawData.TSRecord.RA.hazards.length}</b> were found to be
                hazardous
                <br />
                <b>{rawData.TSRecord.Step.total}</b> step voltage measurements
                were taken,{" "}
                <b>{rawData.TSRecord.Step.hazards.length}</b> were found to be
                hazardous
              </td>
            </tr>
          )}

          {Object.keys(rawData.ConRecord).length !== 0 && (
            <tr>
              <td style={{ verticalAlign: "top" }}>
                <b>Continuity</b>
              </td>
              <td style={{ paddingBottom: "1em" }}>
                <b>{rawData.ConRecord.total}</b> measurements were taken,{" "}
                <b>{rawData.ConRecord.high.length}</b> measurements were above 10
                mΩ
              </td>
            </tr>
          )}

          {Object.keys(rawData.CTInspRecord).length !== 0 && (
            <tr>
              <td style={{ verticalAlign: "top" }}>
                <b>CT & VT Inspections</b>
              </td>
              <td style={{ paddingBottom: "1em" }}>
                <b>{rawData.CTInspRecord.length}</b> CT and VT earth connections
                were inspected. See the CT & VT Inspection section for further
                details.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Summary;
