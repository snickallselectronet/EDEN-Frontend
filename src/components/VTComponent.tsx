import { Chart } from "chart.js";
import { Scatter } from "react-chartjs-2";
import annotationPlugin from "chartjs-plugin-annotation";
import { ChartOptions } from "chart.js";

Chart.register(annotationPlugin);

interface VTItem {
  name: string;
  max_egvr: number | string;
  data: { x: number; y: number }[];
}

interface Props {
  rawData: VTItem[];
  injectedCurrent: number;
}

function VTContent({ rawData, injectedCurrent }: Props) {
  return (
    <div id="vt-contents" className="content-section-container">
      <h2 className="section-title">Earth Grid Impedance</h2>

      {rawData.map((item, index) => {
        const maxEgvrNum =
          typeof item.max_egvr === "number"
            ? item.max_egvr
            : parseFloat(item.max_egvr || "0");

        const zGrid = maxEgvrNum / injectedCurrent / 1000;

        const options: ChartOptions<"scatter"> = {
          scales: {
            y: {
              min: 0,
              max: maxEgvrNum * 1.1,
              ticks: {
                callback: function (value: number | string) {
                  const num =
                    typeof value === "number"
                      ? value
                      : parseFloat(value as string);
                  return num.toFixed(0);
                },
              },
              title: {
                text: "Voltage (mV)",
                display: true,
              },
            },
            x: {
              min: 0,
              title: {
                text: "Distance (m)",
                display: true,
              },
            },
          },
          plugins: {
            title: {
              display: true,
              text: `${item.name} Traverse`,
            },
            legend: {
              display: false,
            },
            annotation: {
              annotations: {
                line1: {
                  type: "line",
                  yMin: maxEgvrNum,
                  yMax: maxEgvrNum,
                  borderColor: "black",
                  borderWidth: 2,
                },
                label1: {
                  type: "label",
                  xValue: "center",
                  yValue: maxEgvrNum,
                  backgroundColor: "black",
                  color: "white",
                  borderRadius: 5,
                  content: [`EGVR: ${maxEgvrNum.toFixed(1)} mV`],
                  font: { size: 10 },
                },
              },
            },
          },
        };

        return (
          <div
            key={`${item.name || "vt-row"}-${index}`} // ✅ unique key pattern
            className="single-vt-content"
          >
            <div className="vt-description">
              <b>Voltage Traverse Results</b>
              <table style={{ width: "100%" }}>
                <tbody>
                  <tr>
                    <td>EGVR</td>
                    <td> = {maxEgvrNum.toFixed(1)} mV</td>
                  </tr>
                  <tr>
                    <td>Injection Current</td>
                    <td> = {injectedCurrent} A</td>
                  </tr>
                  <tr>
                    <td>
                      Z<sub>grid</sub>
                    </td>
                    <td>
                      = {maxEgvrNum.toFixed(1)} mV / {injectedCurrent} A
                    </td>
                  </tr>
                  <tr>
                    <td></td>
                    <td>
                      = {zGrid < 0.1 ? zGrid.toFixed(3) : zGrid.toFixed(2)} Ω
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div
              className="chart-container"
              style={{ border: "1px solid black" }}
              data-rendertype="egvr"
            >
              <Scatter
                data={{
                  datasets: [
                    {
                      label: "Traverse Voltage",
                      data: item.data,
                      backgroundColor: "blue",
                      borderColor: "blue",
                      borderWidth: 2,
                      showLine: true,
                      tension: 0.3,
                    },
                  ],
                }}
                options={options}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default VTContent;