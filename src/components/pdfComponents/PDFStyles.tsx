import { StyleSheet} from "@react-pdf/renderer";


// Create styles
export const styles = StyleSheet.create({
  body: {
    padding: 57,
    fontFamily: "Calibri",
  },
  frontPage: {
    padding: 0,
    fontFamily: "Calibri",
  },
  title: {
    fontSize: 14,
    marginTop: 12,
    marginBottom: 12,
    textAlign: "left",
    color: "#005da5",
    fontFamily: "Cambria",
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 12,
    marginTop: 12,
    marginBottom: 12,
    textAlign: "left",
    fontFamily: "Cambria",
    fontWeight: "bold",
    color: "#005da5",
  },
  frontPageTitle: {
    paddingTop: 325,
    paddingLeft: 57,
    fontSize: 26,
    color: "#005DA5",
    fontFamily: "Cambria",
    fontWeight: "bold",
  },
  frontPageSplash: {
    position: "absolute",
    top: 475,
    left: 0,
    right: 0,
    width: 595,
    height: 142,
  },
  image: {
    position: "absolute",
    top: 57,
    left: 57,
    width: 295,
    height: 91,
  },
  frontPageTable: {
    marginTop: 135,
  },
  frontPageDetails: {
    fontSize: 14,
    fontWeight: "bold",
    color: "white",
    fontFamily: "Calibri",
  },
  text: {
    fontSize: 11,
    marginBottom: 8,
  },
  textList: {
    fontSize: 11,
    marginBottom: 4,
  },
  limitTableText: {
    fontSize: 9,
    fontFamily: "Calibri",
  },
  textParagraph: {
    fontSize: 11,
    textAlign: "justify" as const,
    marginBottom: 7,
  },
  textBold: {
    fontSize: 11,
    fontWeight: "bold",
  },
  textSubscript: {
    fontSize: 7,
    position: "relative" as const,
    top: 6,
  },
  noWrap: {
    ...( { wrap: false } as any ),
  },
  table: {
    display: "flex" as const,
    flexDirection: "column" as const,
    width: "auto",
  },
  borderBottom: {
    borderStyle: "solid" as const,
    borderColor: "#005DA5",
    borderWidth: 1,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  tableNoBorder: {
    display: "flex" as const,
    flexDirection: "column" as const,
    width: "100%",
  },
  tableRow: {
    display: "flex" as const,
    flexDirection: "row" as const,
  },
  tableRowTopMiddleBorder: {
    borderTop: 1,
    borderColor: "#000",
  },
  tableRowBottomBorder: {
    borderTop: 1,
    borderBottom: 1,
    borderColor: "#000",
  },
  tableCol: {
    width: "25%",
  },
  tableColNoBorder: {
    borderWidth: 0,
  },
  tableHeaderCell: {
    backgroundColor: "#005DA5",
    color: "white",
  },
  tableColBorder: {
    flex: 1,
    display: "flex" as const,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  firstAndMiddleColumn: {
    borderLeft: 1,
  },
  lastColumn: {
    borderRight: 1,
    borderLeft: 1,
  },
  tableCol30: {
    width: "25%",
  },
  tableCol70: {
    width: "80%",
    paddingLeft: 20,
  },
  tableCell: {
    marginTop: 5,
    marginBottom: 5,
  },
  centre: {},
  footerLeft: {
    position: "absolute" as const,
    fontSize: 9,
    bottom: 30,
    left: 57,
    right: 0,
    textAlign: "left" as const,
    color: "grey",
    fontFamily: "Calibri",
  },
  footerRight: {
    position: "absolute" as const,
    fontSize: 9,
    bottom: 30,
    left: 0,
    right: 57,
    textAlign: "right" as const,
    color: "grey",
    fontFamily: "Calibri",
  },
});

export const soilTableStyles = {
  table: {
    display: "flex" as const,
    flexDirection: "column" as const,
    width: "100%",
    borderStyle: "solid" as const,
    borderWidth: 1,
    borderColor: "#999999",
    marginVertical: 10,
  },
  row: {
    flexDirection: "row" as const,
  },
  headerCol: {
    flex: 1,
    borderStyle: "solid" as const,
    borderWidth: 1,
    borderColor: "#999999",
    backgroundColor: "#005DA5",
    height: 28,
    justifyContent: "center" as const,
  },
  col: {
    flex: 1,
    borderStyle: "solid" as const,
    borderWidth: 1,
    borderColor: "#999999",
    justifyContent: "center" as const,
  },
  headerCell: {
    fontSize: 11,
    fontWeight: "bold",
    color: "white",
    textAlign: "center" as const,
    margin: 4,
  },
  cell: {
    fontSize: 9,
    color: "black",
    textAlign: "center" as const,
    margin: 4,
  },
};

export const revisionLeftTableStyles = {
  table: {
    display: "flex" as const,
    flexDirection: "column" as const,
    width: "40%" as const,
    borderStyle: "solid" as const,
    borderWidth: 1,
    borderColor: "#999999",
    borderRightWidth: 0,
    marginTop: 10,
  },
  row: { flexDirection: "row" as const },
  headerCol: {
    borderStyle: "solid" as const,
    borderWidth: 1,
    borderColor: "#999999",
    backgroundColor: "#005DA5",
    justifyContent: "center" as const,
  },
  col: {
    borderStyle: "solid" as const,
    borderWidth: 1,
    borderColor: "#999999",
    justifyContent: "center" as const,
  },
  colRev: { width: "50%" as const },
  colDate: { width: "50%" as const },
  // colDesc: { width: "45%" as const, borderRightWidth: 0 },
  // headerCell: {
  //   fontSize: 10,
  //   fontWeight: "bold",
  //   color: "white",
  //   textAlign: "center" as const,
  //   margin: 3,
  // },
  cell: { fontSize: 9, margin: 3, textAlign: "center" as const },
  cellLeft: { textAlign: "left" as const, paddingLeft: 6 },
};

export const revisionRightTableStyles = {
  table: {
    display: "flex" as const,
    flexDirection: "column" as const,
    width: "60%" as const,
    borderStyle: "solid" as const,
    borderWidth: 1,
    borderColor: "#999999",
    marginTop: 10,
  },
  row: { flexDirection: "row" as const },
  headerCol: {
    borderStyle: "solid" as const,
    borderWidth: 1,
    borderColor: "#999999",
    backgroundColor: "#005DA5",
    justifyContent: "center" as const,
  },
  col: {
    borderStyle: "solid" as const,
    borderWidth: 1,
    borderColor: "#999999",
    justifyContent: "center" as const,
  },
  colStatus: { width: "50%" as const },
  colName: { width: "50%" as const },
  headerCell: {
    fontSize: 10,
    fontWeight: "bold",
    color: "white",
    textAlign: "center" as const,
    margin: 3,
  },
  cell: { fontSize: 9, margin: 3, textAlign: "center" as const },
};

export const faultTableStyles = {
  table: {
    display: "flex" as const,
    flexDirection: "column" as const,
    width: "100%",
    borderStyle: "solid" as const,
    borderWidth: 1,
    borderColor: "#999999",
    marginVertical: 10,
  },
  row: {
    flexDirection: "row" as const,
  },
  headerCol: {
    borderStyle: "solid" as const,
    borderWidth: 1,
    borderColor: "#999999",
    backgroundColor: "#005DA5",
    justifyContent: "center" as const,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  col: {
    borderStyle: "solid" as const,
    borderWidth: 1,
    borderColor: "#999999",
    justifyContent: "center" as const,
    paddingVertical: 3,
    paddingHorizontal: 4,
  },
  colFault: { width: "12%" as const },
  colLocations: { width: "28%" as const },
  colPFC: { width: "15%" as const },
  colERC: { width: "15%" as const },
  colPrimary: { width: "15%" as const },
  colSecondary: { width: "15%" as const },
  headerCell: {
    fontSize: 11,
    fontWeight: "bold",
    color: "white",
    textAlign: "center" as const,
    lineHeight: 1.1,
  },
  cell: {
    fontSize: 9,
    color: "black",
    textAlign: "center" as const,
    lineHeight: 1.1,
  },
  cellLeft: {
    fontSize: 9,
    color: "black",
    textAlign: "left" as const,
    lineHeight: 1.1,
  },
};
