import MapComponent from "./MapComponent";
import SortableTable from "./SortableTable";
import { useState, useEffect } from "react";
import type { ChangeEvent } from "react"; // <-- FIX 1: IMPORT TYPE
import Switch from "@mui/material/Switch";

// --- ADD THIS TYPE ---
// Define a simple type for the items in the hazard/acceptable lists
interface TsListItem {
  number: number;
  name: string;
  value: number;
  limit: number;
  ground: string;
  longitude: number;
  latitude: number;
  photo: string;
  details?: string; // Added details as it seems to be used
}
// --- END TYPE ---

interface Props {
  rawData: any;
  photoKey: any;
  isMapCapturing: any;
  setMapCapturing: any;
}

// Create a function to extract and concatenate hazards
function extractHazards(rawData: any) {
  // Handle the new structure
  if (rawData) {
    const hazards: TsListItem[] = [
      ...(rawData.PA?.hazards || []),
      ...(rawData.RA?.hazards || []),
      ...(rawData.Step?.hazards || []),
    ];

    // Add the extracted hazards to rawData to maintain the original usage
    rawData.hazards = hazards;

    return rawData;
  }

  // Return empty array if neither structure is found
  return [];
}

function TSSectionComponent({
  rawData,
  photoKey,
  isMapCapturing,
  setMapCapturing,
}: Props) {
  const tableHeaders = [
    { key: "number", label: "ID" },
    { key: "name", label: "Description" },
    { key: "value", label: "Touch Voltage (V)" },
    { key: "limit", label: "Limit (V)" },
    { key: "ground", label: "Surface Type" },
  ];

  const [listType, setListType] = useState("hazards");
  const [checkedAcceptable, setCheckedAcceptable] = useState(false);
  const [checkedHazards, setCheckedHazards] = useState(true);
  // --- APPLY TYPE ---
  const [tsList, setTSList] = useState<TsListItem[]>(rawData["hazards"]);

  useEffect(() => {
    if (tsList.length === 0) {
      setCheckedHazards(false);
    }
  }, [tsList]);

  useEffect(() => {
    if (listType === "none") {
      setTSList([]);
    } else if (listType === "all") {
      // Combine lists into a single array
      // --- APPLY TYPE ---
      const combinedList: TsListItem[] = (rawData["hazards"] || []).concat(
        rawData["acceptable"] || []
      );

      // --- FIX 2: ADD TYPES TO SORT ---
      combinedList.sort((a: TsListItem, b: TsListItem) => a.value - b.value);
      setTSList(combinedList);
    } else {
      // --- APPLY TYPE ---
      setTSList((rawData[listType] || []) as TsListItem[]);
    }
  }, [listType, rawData]); // Added rawData as dependency

  // --- FIX 1: ADD TYPES ---
  const handleChange = (
    event: ChangeEvent<HTMLInputElement>,
    type: "hazards" | "acceptable"
  ) => {
    const isChecked = event.target.checked;
    if (type === "hazards") {
      setCheckedHazards(isChecked);
      setCheckedAcceptable((prevCheckedAcceptable) => {
        const newCheckedAcceptable = prevCheckedAcceptable;
        if (newCheckedAcceptable && isChecked) {
          setListType("all");
        } else if (!newCheckedAcceptable && isChecked) {
          setListType("hazards");
        } else if (!newCheckedAcceptable && !isChecked) {
          setListType("none");
        } else if (newCheckedAcceptable && !isChecked) {
          setListType("acceptable");
        }
        return newCheckedAcceptable;
      });
    } else if (type === "acceptable") {
      setCheckedAcceptable(isChecked);
      setCheckedHazards((prevCheckedHazards) => {
        const newCheckedHazards = prevCheckedHazards;
        if (isChecked && newCheckedHazards) {
          setListType("all");
        } else if (isChecked && !newCheckedHazards) {
          setListType("acceptable");
        } else if (!isChecked && !newCheckedHazards) {
          setListType("none");
        } else if (!isChecked && newCheckedHazards) {
          setListType("hazards");
        }
        return newCheckedHazards;
      });
    }
  };

  var locations = [];
  // --- APPLY TYPE ---
  for (let i = 0; i < tsList.length; i++) {
    const item: TsListItem = tsList[i];
    // Add a check for latitude/longitude
    if (item.latitude && item.longitude) {
      locations.push({
        text: item.number,
        colour: item.value > item.limit ? "red" : "#5bb7ff",
        long: item.longitude,
        lat: item.latitude,
        photo_key: photoKey + (item.photo?.split(", ")[0] || ""),
      });
    }
  }

  return (
    <>
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
              <span style={{ marginLeft: "5" }}> Acceptable Measurements</span>
            </td>
          </tr>
          <tr>
            <td>
              <b>Hazardous Voltages:</b>
            </td>
            <td>{rawData["hazards"]?.length || 0}</td>
            <td>
              <Switch
                checked={checkedHazards}
                onChange={(event) => handleChange(event, "hazards")}
                inputProps={{ "aria-label": "controlled" }}
                size="small"
              />
              <span style={{ marginLeft: "5" }}> Hazardous Measurements</span>
            </td>
          </tr>
        </tbody>
      </table>
      {tsList.length > 0 ? (
        <>
          <div style={{ marginBottom: "1em" }}>
            <SortableTable
              headers={tableHeaders}
              data={tsList}
              initialSortKey="value"
              initialSortDirection="descending"
            />
          </div>
          <MapComponent
            gpsData={locations}
            isMapCapturing={isMapCapturing}
            setMapCapturing={setMapCapturing}
          />
        </>
      ) : null}
    </>
  );
}
export default TSSectionComponent;