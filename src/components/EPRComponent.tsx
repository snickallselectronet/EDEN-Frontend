import { Chart, ChartOptions } from "chart.js";
import { Scatter } from "react-chartjs-2";
import annotationPlugin from "chartjs-plugin-annotation";

Chart.register(annotationPlugin);

interface ContourMap {
  [key: string]: number;
}

interface EPRItem {
  name: string;
  contour: ContourMap | string;
  data: { x: number; y: number }[];
}

interface Props {
  rawData: EPRItem[];
  allData: any;
}

function EPRContent({ rawData, allData }: Props) {
  return (
    <div id="epr-contents" className="content-section-container">
      <h2 className="section-title">Telecommunications EPR Contours</h2>
      <div>
        {rawData.map((item, index) => {
          // Parse contour safely
          const parsedContour: ContourMap =
            typeof item.contour === "string"
              ? item.contour
                  .slice(1, -1)
                  .split(",")
                  .reduce((obj: Record<string, number>, pair: string) => {
                    const [key, value] = pair
                      .trim()
                      .split(":")
                      .map((part) => part.trim());
                    obj[key] = value === "-1" ? -1 : parseFloat(value);
                    return obj;
                  }, {})
              : item.contour;

          const maxDist =
            item.data && item.data.length
              ? item.data[item.data.length - 1].x
              : 0;
          const maxVal = item.data && item.data.length ? item.data[0].y : 0;

          const chartData = {
            datasets: [
              {
                label: "EPR Contour",
                data: item.data,
                backgroundColor: "blue",
                borderColor: "blue",
                borderWidth: 2,
                showLine: true,
                tension: 0.3,
              },
            ],
          };

          // Sort contours
          const sortedEntries = Object.entries(parsedContour).sort(
            (a, b) => parseFloat(b[0]) - parseFloat(a[0])
          );
          const newContour = Object.fromEntries(sortedEntries);

          const EPRcolours = [
            "blue",
            "red",
            "green",
            "rgb(245,213,19)",
            "#CC13F5",
          ];
          const textcolours = ["white", "white", "white", "black", "white"];

          const annotations: Record<string, any> = {};
          sortedEntries.forEach(([voltageStr, distanceVal], idx) => {
            const voltage = parseFloat(voltageStr);
            const distance = distanceVal;
            const exists = distance !== -1;
            const colour = EPRcolours[idx % EPRcolours.length];
            const textColour = textcolours[idx % textcolours.length];

            annotations[`${voltage}_box`] = {
              type: "box",
              xMin: 0,
              yMin: 0,
              xMax: Number(distance),
              yMax: voltage,
              display: exists,
              borderColor: colour,
              borderWidth: 2,
              backgroundColor: "rgba(0, 0, 0, 0.0)",
            };

            annotations[`${voltage}_label`] = {
              type: "label",
              yValue: voltage,
              xValue: Number(distance) + maxDist * 0.12,
              backgroundColor: colour,
              color: textColour,
              borderRadius: 5,
              content: [`${voltage.toLocaleString()} V Contour: ${distance} m`],
              font: { size: 10 },
              display: exists,
            };
          });

          const options: ChartOptions<"scatter"> = {
            scales: {
              y: {
                min: 0,
                max: Math.ceil((maxVal * 1.1) / 50) * 50,
                title: {
                  text: "Voltage (V)",
                  display: true,
                },
              },
              x: {
                min: 0,
                max: Math.ceil((maxDist * 1.1) / 50) * 50,
                title: {
                  text: "Distance (m)",
                  display: true,
                },
              },
            },
            plugins: {
              title: {
                display: true,
                text: `${item.name} Traverse EPR Contours`,
              },
              legend: {
                display: false,
              },
              annotation: {
                annotations,
              },
            },
          };

          return (
            <div
              key={`${item.name || "epr-row"}-${index}`}
              className="single-epr-content"
            >
              <div className="epr-description">
                <b>EPR Contours</b>
                <table style={{ width: "100%" }}>
                  <tbody>
                    <tr>
                      <td>
                        <b>EGVR:</b>
                      </td>
                      <td>
                        {(() => {
                          const egvr =
                            allData.VTRecord[0].max_egvr /
                            allData.injected_I /
                            1000;
                          const formattedValue =
                            egvr < 0.1 ? egvr.toFixed(3) : egvr.toFixed(2);
                          const EGVR = Math.round(
                            parseFloat(formattedValue) * allData.fault_I
                          );
                          return `${EGVR} V`;
                        })()}
                      </td>
                    </tr>

                    <tr>
                      <td colSpan={2} style={{ height: "0.75em" }}></td>
                    </tr>

                    {Object.entries(newContour).map(([voltage, distance]) => (
                      <tr
                        key={`${voltage}-${index}`}
                      >
                        <td>
                          <b>{`${Number(voltage).toLocaleString()} V Contour:`}</b>
                        </td>
                        <td>
                          {distance === -1
                            ? "Does not exist."
                            : `${distance} m`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div
                className="chart-container"
                style={{ border: "1px solid black" }}
                data-rendertype="epr" // <-- ********** FIX IS HERE **********
              >
                <Scatter data={chartData} options={options} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default EPRContent;