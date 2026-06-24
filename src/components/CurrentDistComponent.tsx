interface Props {
  rawData: any;
}

function CurrentDistContent({ rawData }: Props) {
  return (
    <div id="current-dist-contents" className="content-section-container">
      <h2 className="section-title">Current Distribution</h2>
      <table style={{ width: "100%" }}>
        <tbody>
          <tr>
            <td
              style={{
                width: "33%",
                textAlign: "center",
                verticalAlign: "middle",
              }}
            ></td>
            <td
              className="table-header-cell"
              style={{
                width: "33%",
                border: "1px solid gray",
                padding: "0.25em",
                textAlign: "center",
                verticalAlign: "middle",
              }}
            >
              Current (mA)
            </td>
            <td
              className="table-header-cell"
              style={{
                width: "33%",
                border: "1px solid gray",
                padding: "0.25em",
                textAlign: "center",
                verticalAlign: "middle",
              }}
            >
              Angle (&deg;)
            </td>
          </tr>
          <tr>
            <td
              className="table-header-cell"
              style={{
                padding: "0.25em",
                border: "1px solid gray",
                textAlign: "right",
              }}
            >
              Injected Current
            </td>
            <td
              style={{
                padding: "0.25em",
                border: "1px solid gray",
                textAlign: "center",
              }}
            >
              {" "}
              {rawData.inj.current.toFixed(0)}{" "}
            </td>
            <td
              style={{
                padding: "0.25em",
                border: "1px solid gray",
                textAlign: "center",
              }}
            >
              {" "}
              {rawData.inj.angle.toFixed(0)}{" "}
            </td>
          </tr>
          <tr>
            <td
              className="table-header-cell"
              style={{
                padding: "0.25em",
                border: "1px solid gray",
                textAlign: "right",
              }}
            >
              Measured Current Splits
            </td>
            <td
              style={{
                padding: "0.25em",
                border: "1px solid gray",
                textAlign: "center",
              }}
            >
              {" "}
              {rawData.meas.current.toFixed(0)}{" "}
            </td>
            <td
              style={{
                padding: "0.25em",
                border: "1px solid gray",
                textAlign: "center",
              }}
            >
              {" "}
              {rawData.meas.angle.toFixed(0)}{" "}
            </td>
          </tr>
          <tr>
            <td
              className="table-header-cell"
              style={{
                padding: "0.25em",
                border: "1px solid gray",
                textAlign: "right",
              }}
            >
              Earth Return Current
            </td>
            <td
              style={{
                padding: "0.25em",
                border: "1px solid gray",
                textAlign: "center",
              }}
            >
              {" "}
              {rawData.earth.current.toFixed(0)}{" "}
            </td>
            <td
              style={{
                padding: "0.25em",
                border: "1px solid gray",
                textAlign: "center",
              }}
            >
              {" "}
              {rawData.earth.angle.toFixed(0)}{" "}
            </td>
          </tr>
        </tbody>
      </table>
      <div className="paragraph">
        <p>
          If all external earth connections are removed, i.e. OHEW or cables
          screens, the substation's standalone grid impedance would be:
        </p>
        <table
          style={{ width: "40%", paddingTop: "1em", paddingBottom: "1em" }}
        >
          <tbody>
            <tr>
              <td>
                Z<sub>standalone</sub>
              </td>
              <td>
                = {(Math.max(rawData.egvrs) / 1000).toFixed(3)} V /{" "}
                {(rawData.earth.current / 1000).toFixed(3)} A
              </td>
            </tr>
            <tr>
              <td></td>
              <td>
                {"= "}
                {(
                  Number((Math.max(rawData.egvrs) / 1000).toFixed(3)) /
                  Number((rawData.earth.current / 1000).toFixed(3))
                ).toFixed(3)}{" "}
                Ω
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
export default CurrentDistContent;
