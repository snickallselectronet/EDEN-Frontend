import MapComponent from "./MapComponent";
import ImageWithPresignedUrl from "./ImageWithPresignedUrl";

interface Props {
  rawData: any;
  photoKey: any;
}

function CTVTInspectionContent({ rawData, photoKey }: Props) {
  return (
    <div id="inspection-contents" className="content-section-container">
      <h2 className="section-title">CT & VT Inspections</h2>
      <table style={{ width: "100%", marginBottom: "1em" }}>
        <tbody>
          <tr
            style={{
              borderBottom: "1px solid var(--en-blue)",
            }}
          >
            <td>
              <b>Designation</b>
            </td>
            <td>
              <b>Red Phase Bolts</b>
            </td>
            <td>
              <b>Blue Phase Bolts</b>
            </td>
            <td>
              <b>Yellow Phase Bolts</b>
            </td>
            <td
              style={{
                width: "20%",
              }}
            >
              <b>Photo</b>
            </td>
          </tr>
          {rawData.map((item: any) => {
            return (
              <tr
                key={item["number"]}
                style={{
                  borderBottom: "1px dashed var(--en-blue)",
                }}
              >
                <td>{item["name"]}</td>
                <td>
                  <div
                    className={`${
                      item["redTopBolts"] < 2 && item["redTopType"] == "Bolted"
                        ? "bolted-warning"
                        : ""
                    }`}
                  >
                    <b>Top</b>:{" "}
                    {item["redTopBolts"] == 0 && item["redTopType"] == "Bolted"
                      ? "No Connection"
                      : item["redTopType"] +
                        (item["redTopType"] == "Bolted"
                          ? ", " +
                            item["redTopBolts"] +
                            " Bolt" +
                            (item["redTopBolts"] !== 1 ? "s" : "")
                          : "")}
                  </div>
                  <div
                    className={`${
                      item["redBtmBolts"] < 2 && item["redBtmType"] == "Bolted"
                        ? "bolted-warning"
                        : ""
                    }`}
                  >
                    <b>Bottom</b>:{" "}
                    {item["redBtmBolts"] == 0 && item["redBtmType"] == "Bolted"
                      ? "No Connection"
                      : item["redBtmType"] +
                        (item["redBtmType"] == "Bolted"
                          ? ", " +
                            item["redBtmBolts"] +
                            " Bolt" +
                            (item["redBtmBolts"] !== 1 ? "s" : "")
                          : "")}
                  </div>
                  <div>
                    <b>Down-Type</b>: {item["redDownType"]}
                  </div>
                </td>
                <td>
                  <div
                    className={`${
                      item["blueTopBolts"] < 2 &&
                      item["blueTopType"] == "Bolted"
                        ? "bolted-warning"
                        : ""
                    }`}
                  >
                    <b>Top</b>:{" "}
                    {item["blueTopBolts"] == 0 &&
                    item["blueTopType"] == "Bolted"
                      ? "No Connection"
                      : item["blueTopType"] +
                        (item["blueTopType"] == "Bolted"
                          ? ", " +
                            item["blueTopBolts"] +
                            " Bolt" +
                            (item["blueTopBolts"] !== 1 ? "s" : "")
                          : "")}
                  </div>
                  <div
                    className={`${
                      item["blueBtmBolts"] < 2 &&
                      item["blueBtmType"] == "Bolted"
                        ? "bolted-warning"
                        : ""
                    }`}
                  >
                    <b>Bottom</b>:{" "}
                    {item["blueBtmBolts"] == 0 &&
                    item["blueBtmType"] == "Bolted"
                      ? "No Connection"
                      : item["blueBtmType"] +
                        (item["blueBtmType"] == "Bolted"
                          ? ", " +
                            item["blueBtmBolts"] +
                            " Bolt" +
                            (item["blueBtmBolts"] !== 1 ? "s" : "")
                          : "")}
                  </div>
                  <div>
                    <b>Down-Type</b>: {item["blueDownType"]}
                  </div>
                </td>
                <td>
                  <div
                    className={`${
                      item["yellowTopBolts"] < 2 &&
                      item["yellowTopType"] == "Bolted"
                        ? "bolted-warning"
                        : ""
                    }`}
                  >
                    <b>Top</b>:{" "}
                    {item["yellowTopBolts"] == 0 &&
                    item["yellowTopType"] == "Bolted"
                      ? "No Connection"
                      : item["yellowTopType"] +
                        (item["yellowTopType"] == "Bolted"
                          ? ", " +
                            item["yellowTopBolts"] +
                            " Bolt" +
                            (item["yellowTopBolts"] !== 1 ? "s" : "")
                          : "")}
                  </div>
                  <div
                    className={`${
                      item["yellowBtmBolts"] < 2 &&
                      item["yellowBtmType"] == "Bolted"
                        ? "bolted-warning"
                        : ""
                    }`}
                  >
                    <b>Bottom</b>:{" "}
                    {item["yellowBtmBolts"] == 0 &&
                    item["yellowBtmType"] == "Bolted"
                      ? "No Connection"
                      : item["yellowBtmType"] +
                        (item["yellowBtmType"] == "Bolted"
                          ? ", " +
                            item["yellowBtmBolts"] +
                            " Bolt" +
                            (item["yellowBtmBolts"] !== 1 ? "s" : "")
                          : "")}
                  </div>
                  <div>
                    <b>Down-Type</b>: {item["yellowDownType"]}
                  </div>
                </td>
                <td>
                  {item["photos"]}
                  {/* <img
                      width="250"
                      src={"src/assets/" + item[1]["photo"]}
                    ></img> */}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
export default CTVTInspectionContent;
