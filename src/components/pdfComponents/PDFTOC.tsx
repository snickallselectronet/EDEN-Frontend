import React from "react";
import { Page, View, Text, Link } from "@react-pdf/renderer";
import {
  styles,
  revisionLeftTableStyles,
  revisionRightTableStyles,
} from "./PDFStyles";
import PDFFooter from "./PDFFooter";
import { ReactNode } from "react";

export type TocItem = { id: string; label: string; show: boolean };

interface PDFTOCProps {
  items: TocItem[];
  ResponseObj: any;
  footer?: ReactNode;
}

const PDFTOC = ({ items, ResponseObj, footer }: PDFTOCProps) => {
  // Extract data from response object
  const reportMisc = ResponseObj?.reportMisc ?? {};
  
  const qaStatus = ResponseObj?.qaStatus?.[0]
    ? JSON.parse(ResponseObj.qaStatus[0]).qa
    : {};

  const revision = reportMisc.revision || "Rev00";
  const dateTested = qaStatus.approve_date || "dd/mm/yyyy";
  const client = ResponseObj.client || "[client names]";

  const preparer = qaStatus.preparer || "F. Surname";
  const reviewer = qaStatus.reviewer || "F. Surname";
  const approver = qaStatus.approver || "F. Surname";

  const revRows: (string | number | null | undefined)[][] = [
    [revision, dateTested, `First issue to ${client}`, "Prepared", "", preparer],
    ["", "", "", "Reviewed", "", reviewer],
    ["", "", "", "Approved", "", approver],
  ];

  const [firstRow, ...tailRows] = revRows;
  const BODY_ROW_HEIGHT = 22;
  const mergedBodyRowHeight = (tailRows.length + 1) * BODY_ROW_HEIGHT;

  return (
    <Page size="A4" style={styles.body}>
      {/* Title */}
      <Text style={styles.title}>Contents</Text>

      {/* Table of Contents */}
      <View style={{ marginTop: 12 }}>
        {items.filter((i) => i.show).map((i, idx) => (
          <View key={i.id} style={{ flexDirection: "row" as const, marginBottom: 6 }}>
            <Text style={[styles.text, { marginRight: 6 }]}>{idx + 1}.</Text>
            <Link
              src={`#${i.id}`}
              style={{
                textDecoration: "none",
                color: "black",
                flex: 1,
              }}
            >
              <Text style={styles.text}>{i.label}</Text>
            </Link>
          </View>
        ))}
      </View>

      {/* Revision History Section */}
      <Text style={[styles.subtitle, { marginTop: 20 }]}>Revision History</Text>

      <View style={{ flexDirection: "row" as const }}>
        {/* LEFT TABLE */}
        <View style={revisionLeftTableStyles.table}>
          {/* Header */}
          <View style={revisionLeftTableStyles.row}>
            <View
              style={[
                revisionLeftTableStyles.headerCol,
                revisionLeftTableStyles.colRev,
              ]}
            >
              {/* Fix: remove `margin` props from Text style */}
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: "bold",
                  color: "white",
                  textAlign: "center",
                }}
              >
                Rev
              </Text>
            </View>

            <View
              style={[
                revisionLeftTableStyles.headerCol,
                revisionLeftTableStyles.colDate,
              ]}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: "bold",
                  color: "white",
                  textAlign: "center",
                }}
              >
                Date
              </Text>
            </View>

            {/* <View
              style={[
                revisionLeftTableStyles.headerCol,
                revisionLeftTableStyles.colDesc,
              ]}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: "bold",
                  color: "white",
                  textAlign: "center",
                }}
              >
                Description
              </Text>
            </View> */}
          </View>

          {/* Body (single tall row) */}
          <View style={revisionLeftTableStyles.row}>
            <View
              style={[
                revisionLeftTableStyles.col,
                revisionLeftTableStyles.colRev,
                { minHeight: mergedBodyRowHeight, justifyContent: "center" as const },
              ]}
            >
              <Text style={revisionLeftTableStyles.cell}>{firstRow[0]}</Text>
            </View>
            <View
              style={[
                revisionLeftTableStyles.col,
                revisionLeftTableStyles.colDate,
                { minHeight: mergedBodyRowHeight, justifyContent: "center" as const },
              ]}
            >
              <Text style={revisionLeftTableStyles.cell}>{firstRow[1]}</Text>
            </View>
            {/* <View
              style={[
                revisionLeftTableStyles.col,
                revisionLeftTableStyles.colDesc,
                { minHeight: mergedBodyRowHeight, justifyContent: "center" as const },
              ]}
            >
              <Text
                style={[
                  revisionLeftTableStyles.cell,
                  revisionLeftTableStyles.cellLeft,
                ]}
              >
                {firstRow[2]}
              </Text>
            </View> */}
          </View>
        </View>

        {/* RIGHT TABLE */}
        <View style={revisionRightTableStyles.table}>
          {/* Header */}
          <View style={revisionRightTableStyles.row}>
            <View
              style={[
                revisionRightTableStyles.headerCol,
                revisionRightTableStyles.colStatus,
              ]}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: "bold",
                  color: "white",
                  textAlign: "center",
                }}
              >
                Status
              </Text>
            </View>
            <View
              style={[
                revisionRightTableStyles.headerCol,
                revisionRightTableStyles.colName,
              ]}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: "bold",
                  color: "white",
                  textAlign: "center",
                }}
              >
                Name
              </Text>
            </View>
          </View>

          {/* Body rows */}
          {revRows.map((r, idx) => (
            <View key={idx} style={revisionRightTableStyles.row}>
              <View
                style={[
                  revisionRightTableStyles.col,
                  revisionRightTableStyles.colStatus,
                  { height: BODY_ROW_HEIGHT },
                ]}
              >
                <Text style={revisionRightTableStyles.cell}>{r[3] ?? "-"}</Text>
              </View>
              <View
                style={[
                  revisionRightTableStyles.col,
                  revisionRightTableStyles.colName,
                  { height: BODY_ROW_HEIGHT },
                ]}
              >
                <Text style={revisionRightTableStyles.cell}>{r[5] ?? "-"}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Footer */}
      {footer}
    </Page>
  );
};

export default PDFTOC;