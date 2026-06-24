import React, { useState, useEffect, ChangeEvent } from "react";
import MapComponent from "./MapComponent";
import SortableTable from "./SortableTable";
import Switch from "@mui/material/Switch";

interface RecordItem {
  number: number;
  name: string;
  details: string;
  value: number;
  longitude: number;
  latitude: number;
  photo: string;
}

interface Props {
  rawData: {
    total: number;
    high: RecordItem[];
    acceptable: RecordItem[];
  };
  photoKey: string;
}

function ContinuityContent({ rawData, photoKey }: Props) {
  const [listType, setListType] = useState<"high" | "acceptable" | "all" | "none">("high");
  const [checkedAcceptable, setCheckedAcceptable] = useState(false);
  const [checkedHigh, setCheckedHigh] = useState(true);
  const [contList, setContList] = useState<RecordItem[]>(rawData["high"]);

  const highMeasurementNumbers = new Set(rawData["high"].map((item) => item.number));

  useEffect(() => {
    if (contList.length === 0) {
      setCheckedHigh(false);
    }
  }, [contList]);

  useEffect(() => {
    if (listType === "none") {
      setContList([]);
    } else if (listType === "all") {
      const combinedList = [...rawData["high"], ...rawData["acceptable"]].sort(
        (a, b) => a.value - b.value
      );
      setContList(combinedList);
    } else {
      setContList(rawData[listType]);
    }
  }, [listType, rawData]);

  const handleChange = (event: ChangeEvent<HTMLInputElement>, type: "high" | "acceptable") => {
    const isChecked = event.target.checked;
    if (type === "high") {
      setCheckedHigh(isChecked);
      setCheckedAcceptable((prevCheckedAcceptable) => {
        const newCheckedAcceptable = prevCheckedAcceptable;
        if (newCheckedAcceptable && isChecked) {
          setListType("all");
        } else if (!newCheckedAcceptable && isChecked) {
          setListType("high");
        } else if (!newCheckedAcceptable && !isChecked) {
          setListType("none");
        } else if (newCheckedAcceptable && !isChecked) {
          setListType("acceptable");
        }
        return newCheckedAcceptable;
      });
    } else {
      setCheckedAcceptable(isChecked);
      setCheckedHigh((prevCheckedHigh) => {
        const newCheckedHigh = prevCheckedHigh;
        if (isChecked && newCheckedHigh) {
          setListType("all");
        } else if (isChecked && !newCheckedHigh) {
          setListType("acceptable");
        } else if (!isChecked && !newCheckedHigh) {
          setListType("none");
        } else if (!isChecked && newCheckedHigh) {
          setListType("high");
        }
        return newCheckedHigh;
      });
    }
  };

  // Added index and unique key generation
  const contLocations = contList.map((item, index) => {
    const isHigh = highMeasurementNumbers.has(item.number);
    
    return {
      key: `marker-${item.number || item.name || "unknown"}-${index}`,
      text: item.number,
      long: item.longitude,
      lat: item.latitude,
      colour: isHigh ? "red" : "#5bb7ff",
      // FIX: Use empty string "" instead of undefined to satisfy TypeScript
      photo_key: isHigh ? `${photoKey}${item.photo.split(", ")[0]}` : "",
    };
  });

  const tableHeaders = [
    { key: "number", label: "ID" },
    { key: "name", label: "Description" },
    { key: "details", label: "Details/Notes" },
    { key: "value", label: "Reading (mΩ)" },
  ];

  return (
    <div id="continuity-contents" className="content-section-container">
      <h2 className="section-title">Continuity</h2>

      <table style={{ width: "100%", marginBottom: "1em" }}>
        <tbody>
          <tr>
            <td style={{ width: "30%" }}>
              <b>Measurements Taken:</b>
            </td>
            <td style={{ width: "30%" }}>{rawData["total"]}</td>
            <td style={{ width: "40%" }}>
              <Switch
                checked={checkedAcceptable}
                onChange={(event) => handleChange(event, "acceptable")}
                inputProps={{ "aria-label": "controlled" }}
                size="small"
              />{" "}
              <span style={{ marginLeft: "5px" }}>Acceptable Measurements</span>
            </td>
          </tr>
          <tr>
            <td>
              <b>Measured &gt; 10 mΩ</b>
            </td>
            <td>{rawData["high"].length}</td>
            <td style={{ width: "40%" }}>
              <Switch
                checked={checkedHigh}
                onChange={(event) => handleChange(event, "high")}
                inputProps={{ "aria-label": "controlled" }}
                size="small"
              />{" "}
              <span style={{ marginLeft: "5px" }}>High Measurements</span>
            </td>
          </tr>
        </tbody>
      </table>

      {contList.length > 0 && (
        <>
          <div style={{ marginBottom: "1em" }}>
            <SortableTable
              headers={tableHeaders}
              data={contList}
              initialSortKey="value"
              initialSortDirection="descending"
            />
          </div>

          {/* contLocations now includes unique keys */}
          <MapComponent gpsData={contLocations} />
        </>
      )}
    </div>
  );
}

export default ContinuityContent;