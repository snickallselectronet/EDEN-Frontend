import React, { useState, useMemo, ChangeEvent } from "react";

interface Header {
  key: string;
  label: string;
}

interface SortableTableProps {
  headers: Header[];
  data: Record<string, any>[];
  initialSortKey: string;
  initialSortDirection?: "ascending" | "descending";
}

const SortableTable: React.FC<SortableTableProps> = ({
  headers,
  data,
  initialSortKey,
  initialSortDirection = "descending",
}) => {
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "ascending" | "descending";
  }>({
    key: initialSortKey,
    direction: initialSortDirection,
  });

  const [filterText, setFilterText] = useState<string>("");

  const handleFilterChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFilterText(event.target.value);
  };

  const filteredData = useMemo(() => {
    return data.filter((item) =>
      headers.some((header) => {
        const value = item[header.key];
        return (
          value &&
          value.toString().toLowerCase().includes(filterText.toLowerCase())
        );
      })
    );
  }, [data, headers, filterText]);

  const sortedData = useMemo(() => {
    let sortableData = [...filteredData];
    if (sortConfig.key) {
      sortableData.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableData;
  }, [filteredData, sortConfig]);

  const requestSort = (key: string) => {
    let direction: "ascending" | "descending" = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    } else if (
      sortConfig.key === key &&
      sortConfig.direction === "descending"
    ) {
      direction = "ascending";
    }
    setSortConfig({ key, direction });
  };

  return (
    <>
      <input
        type="text"
        placeholder="Filter..."
        value={filterText}
        onChange={handleFilterChange}
        className="filter-input"
      />
      <table style={{ width: "100%" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid var(--en-blue)" }}>
            {headers.map((header, index) => (
              <th
                key={`${header.key}-${index}`} 
                onClick={() => requestSort(header.key)}
                style={{ cursor: "pointer" }}
              >
                {header.label}
                <span className="sort-symbol">
                  {sortConfig.key === header.key
                    ? sortConfig.direction === "ascending"
                      ? " ▲"
                      : " ▼"
                    : null}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((item, rowIndex) => (
            <tr key={`row-${rowIndex}`}> 
              {headers.map((header, colIndex) => (
                <td key={`${header.key}-${colIndex}`}>
                  {item[header.key] === "nan"
                    ? "-"
                    : typeof item[header.key] === "number" &&
                      header.key !== "number"
                    ? item[header.key].toFixed(1)
                    : item[header.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
};

export default SortableTable;
