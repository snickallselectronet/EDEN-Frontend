/**
 * PDFComponent.tsx
 * ----------------
 * Enhanced duplicate network request hardening:
 * - Idempotent mount guard (StrictMode-safe)
 * - Batch S3 image fetching (unchanged)
 * - Static asset cache -> data URIs to avoid repeated HTTP fetches by react-pdf
 * - Safer map capture (dedupe nodes)
 * - Additional guards against re-initialization
 */

import React from "react";
import html2canvas from "html2canvas";
import { AxiosInstance } from "axios";
import { Page, Text, View, Document, Image } from "@react-pdf/renderer";

// PDF section components
import { styles } from "./pdfComponents/PDFStyles";
import PDFSummary from "./pdfComponents/PDFSummary";
import PDFVT from "./pdfComponents/PDFVT";
import PDFTS from "./pdfComponents/PDFTS";
import PDFEPR from "./pdfComponents/PDFEPR";
import PDFCurrentDist from "./pdfComponents/PDFCurrentDist";
import PDFCont from "./pdfComponents/PDFCont";
import PDFEarthVis from "./pdfComponents/PDFEarthVis";
import PDFFooter from "./pdfComponents/PDFFooter";
import PDFMitigation from "./pdfComponents/PDFMitigation";
import PDFInjectionMethod from "./pdfComponents/PDFInjectionMethod";
import PDFTOC from "./pdfComponents/PDFTOC";
import PDFSoilTable from "./pdfComponents/PDFSR";
import PDFFaultTable from "./pdfComponents/PDFFaultTable";
import PDFEarthConductorSize from "./pdfComponents/PDFConductorSizing";

import { host_url } from "../constants";

const BASE_URL = import.meta.env.VITE_BASE_URL_FRONTEND as string;

const assetCache = new Map<string, string>();
const inFlightRequests = new Map<string, Promise<string>>();

async function fetchAsDataUri(url: string): Promise<string> {
  if (assetCache.has(url)) {
    return assetCache.get(url)!;
  }

  if (inFlightRequests.has(url)) {
    return inFlightRequests.get(url)!;
  }

  const fetchPromise = (async () => {
    try {
      const res = await fetch(url, {
        cache: "force-cache",
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const blob = await res.blob();
      const dataUri = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("FileReader failed"));
        reader.readAsDataURL(blob);
      });

      assetCache.set(url, dataUri);
      return dataUri;
    } catch (error) {
      console.error(`[Asset Cache] Error fetching ${url}:`, error);
      return "";
    } finally {
      inFlightRequests.delete(url);
    }
  })();

  inFlightRequests.set(url, fetchPromise);
  return fetchPromise;
}

async function preloadAssets(urls: string[]): Promise<Record<string, string>> {
  const entries = await Promise.all(
    urls.map(async (u) => {
      try {
        const dataUri = await fetchAsDataUri(u);
        return [u, dataUri] as const;
      } catch (error) {
        console.error(`[Preload Assets] Failed to load ${u}:`, error);
        return [u, ""] as const;
      }
    }),
  );
  return Object.fromEntries(entries);
}

interface Props {
  ResponseObj: any;
  VThidden: boolean;
  EPRhidden: boolean;
  TShidden: boolean;
  Conhidden: boolean;
  CTInsphidden: boolean;
  VisInsphidden: boolean;
  CurrentDisthidden: boolean;
  Mitigationhidden: boolean;
  InjectionMethodhidden: boolean;
  apiClient: AxiosInstance;
}

interface State {
  egvrImages: string[];
  eprImages: string[];
  mapImages: string[];
  earthVisImages: { [key: string]: string };
  contImages: { [key: string]: string };
  TSImages: { [key: string]: string };
  isLoading: boolean;
  error: string | null;
  isMapCapturing: boolean;
  assets: {
    logo?: string;
    splash?: string;
  };
}

const currentDate = new Date();
const day = String(currentDate.getDate()).padStart(2, "0");
const month = String(currentDate.getMonth() + 1).padStart(2, "0");
const year = currentDate.getFullYear();
const formattedDate = `${day}-${month}-${year}`;

class PDFComponent extends React.Component<Props, State> {
  state: State = {
    egvrImages: [],
    eprImages: [],
    mapImages: [],
    earthVisImages: {},
    contImages: {},
    TSImages: {},
    isLoading: true,
    error: null,
    isMapCapturing: false,
    assets: {},
  };

  private _didRun = false;

  async componentDidMount() {
    if (this._didRun) return;
    this._didRun = true;

    try {
      const assets = await preloadAssets([
        `${BASE_URL}ElectroNet_Blue.png`,
        `${BASE_URL}report_splash.png`,
      ]);

      const [egvrImages, eprImages, mapImages] = await Promise.all([
        this.captureEgvrImages(),
        this.captureEprImages(),
        this.captureMapImages(),
      ]);

      const { ResponseObj } = this.props;
      const key_prefix = ResponseObj?.lres_key;

      if (!key_prefix) {
        console.warn(
          "PDFComponent: lres_key is missing. S3 images will not be loaded.",
        );
        this.setState({
          egvrImages,
          eprImages,
          mapImages,
          isLoading: false,
          assets: {
            logo: assets[`${BASE_URL}ElectroNet_Blue.png`],
            splash: assets[`${BASE_URL}report_splash.png`],
          },
        });
        return;
      }

      const visRecordValues: any[] = Object.values(
        ResponseObj.VisualInspectionRecord || {},
      );
      const visKeys = visRecordValues.flatMap((item: any) => {
        if (item && item.photos && typeof item.photos === "string") {
          return item.photos
            .split(",")
            .map((p: string) => (key_prefix + p.trim()).replace("//", "/"));
        }
        return [];
      });

      const contKeys = [
        ...(ResponseObj.ConRecord?.high || []),
        // ...(ResponseObj.ConRecord?.acceptable || []),
      ]
        .filter((i: any) => i.photo)
        .flatMap((i: any) => {
          const photos = i.photo.split(",").map((p: string) => p.trim());
          return photos.slice(0, 1);
        })
        .map((photo: string) => (key_prefix + photo).replace("//", "/"));

      const tsKeys = [
        ...(ResponseObj.TSRecord?.PA?.hazards || []),
        // ...(ResponseObj.TSRecord?.PA?.acceptable || []),
        ...(ResponseObj.TSRecord?.RA?.hazards || []),
        // ...(ResponseObj.TSRecord?.RA?.acceptable || []),
        ...(ResponseObj.TSRecord?.Step?.hazards || []),
        // ...(ResponseObj.TSRecord?.Step?.acceptable || []),
      ]
        .filter((i: any) => i.photo)
        .flatMap((i: any) => {
          const photos = i.photo.split(",").map((p: string) => p.trim());
          return photos.slice(0, 1);
        })
        .map((photo: string) => (key_prefix + photo).replace("//", "/"));

      const allUniqueKeys = [...new Set([...visKeys, ...contKeys, ...tsKeys])];

      let fullImageMap: { [key: string]: string } = {};
      if (allUniqueKeys.length > 0) {
        try {
          const response = await this.props.apiClient.post(
            `${host_url}batch-image-data/`,
            {
              keys: allUniqueKeys,
            },
          );
          fullImageMap = response.data || {};
        } catch (batchError) {
          console.error("Error fetching batch image data:", batchError);
          fullImageMap = allUniqueKeys.reduce(
            (acc, key) => {
              acc[key] = "";
              return acc;
            },
            {} as { [key: string]: string },
          );
        }
      }

      const createSubMap = (fullKeys: string[]) => {
        const subMap: { [key: string]: string } = {};
        for (const fullKey of fullKeys) {
          const originalKey = fullKey.replace(key_prefix, "");
          subMap[originalKey] = fullImageMap[fullKey] || "";
        }
        return subMap;
      };

      this.setState({
        egvrImages,
        eprImages,
        mapImages,
        earthVisImages: createSubMap(visKeys),
        contImages: createSubMap(contKeys),
        TSImages: createSubMap(tsKeys),
        isLoading: false,
        assets: {
          logo: assets[`${BASE_URL}ElectroNet_Blue.png`],
          splash: assets[`${BASE_URL}report_splash.png`],
        },
      });
    } catch (error) {
      console.error("Error during PDF data preparation:", error);
      this.setState({ isLoading: false, error: "Failed to load images" });
    }
  }

  componentWillUnmount() {
    this._didRun = false;
  }

  private async captureEgvrImages(): Promise<string[]> {
    const allCharts = document.getElementsByClassName("chart-container");
    const egvrCharts = Array.from(new Set(Array.from(allCharts))).filter(
      (e) => (e as Element).getAttribute("data-rendertype") === "egvr",
    );
    return Promise.all(
      egvrCharts.map((e) => captureChartImage(e as HTMLElement)),
    );
  }

  private async captureEprImages(): Promise<string[]> {
    const allCharts = document.getElementsByClassName("chart-container");
    const eprCharts = Array.from(new Set(Array.from(allCharts))).filter(
      (e) => (e as Element).getAttribute("data-rendertype") === "epr",
    );
    return Promise.all(
      eprCharts.map((e) => captureChartImage(e as HTMLElement)),
    );
  }

  private async captureMapImages(): Promise<string[]> {
    try {
      this.setState({ isMapCapturing: true });
      await new Promise((r) => setTimeout(r, 1000));

      const allMaps = document.getElementsByClassName("map");
      const mapElements = Array.from(new Set(Array.from(allMaps)))
        .filter((e) => (e as Element).getAttribute("data-rendertype") === "map")
        .filter((e) => {
          const el = e as HTMLElement;
          const rect = el.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        });

      const images = await Promise.all(
        mapElements.map((element) =>
          html2canvas(element as HTMLElement, {
            useCORS: true,
            allowTaint: true,
            backgroundColor: null,
            scale: 2,
            logging: false,
          }).then((canvas) => canvas.toDataURL("image/png")),
        ),
      );

      this.setState({ isMapCapturing: false });
      return images;
    } catch (error) {
      this.setState({ isMapCapturing: false });
      console.error("Failed to capture map images:", error);
      return [];
    }
  }

  render() {
    const { isLoading, error, assets } = this.state;
    const { ResponseObj } = this.props;

    if (isLoading) {
      return this.renderLoadingPage("Loading... Please do not close window");
    }

    if (error) {
      return this.renderLoadingPage(`Error: ${error}`);
    }

    if (!ResponseObj) {
      return this.renderLoadingPage("No data available");
    }

    const misc = ResponseObj?.reportMisc ?? {};
    const reportMisc = {
      reportNumber: Array.isArray(misc.reportNumber)
        ? misc.reportNumber
        : [misc.reportNumber || ""],
      revision: Array.isArray(misc.revision)
        ? misc.revision
        : [misc.revision || ""],
      projectNumber: Array.isArray(misc.projectNumber)
        ? misc.projectNumber
        : [misc.projectNumber || ""],
    };

    return (
      <Document>
        <Page size="A4" style={styles.frontPage}>
          <Image
            style={styles.image}
            src={assets.logo || `${BASE_URL}ElectroNet_Blue.png`}
          />
          <Text style={styles.frontPageTitle}>
            {ResponseObj.name} {"Substation \n"}
            Earth Testing Report
          </Text>
          <Image
            style={styles.frontPageSplash}
            src={assets.splash || `${BASE_URL}report_splash.png`}
          />
          <View style={[styles.table, styles.frontPageTable]}>
            <View style={styles.tableRow}>
              <View style={{ width: "33%" }}>
                <Text style={[styles.frontPageDetails, { marginLeft: 57 }]}>
                  Report Reference:
                </Text>
                <Text style={[styles.frontPageDetails, { marginLeft: 57 }]}>
                  {reportMisc.reportNumber[0]}, {reportMisc.revision[0]}
                </Text>
              </View>

              <View
                style={{
                  width: "33%",
                  borderLeftWidth: 1,
                  borderColor: "white",
                }}
              >
                <Text style={[{ marginLeft: 10 }, styles.frontPageDetails]}>
                  Project Reference
                </Text>
                <Text style={[{ marginLeft: 10 }, styles.frontPageDetails]}>
                  {reportMisc.projectNumber[0]}
                </Text>
              </View>

              <View
                style={{
                  width: "33%",
                  borderLeftWidth: 1,
                  borderColor: "white",
                }}
              >
                <Text style={[{ marginLeft: 10 }, styles.frontPageDetails]}>
                  Prepared for:
                </Text>
                <Text style={[{ marginLeft: 10 }, styles.frontPageDetails]}>
                  {ResponseObj.client || ""}
                </Text>
              </View>
            </View>
          </View>
          {/* Main Page Footer: Passed reportMisc here as well */}
          <PDFFooter reportMisc={reportMisc} />
        </Page>

        <PDFTOC
          ResponseObj={ResponseObj}
          items={[
            { id: "sec-summary", label: "Conclusions", show: true },
            {
              id: "sec-injection",
              label: "Injection Testing Method",
              show: true,
            },
            { id: "sec-soil", label: "Soil Resistivity", show: true },
            {
              id: "sec-fault",
              label: "Fault Current and Duration",
              show: true,
            },
            {
              id: "sec-vt",
              label: "Earth Grid Impedance",
              show: this.props.VThidden,
            },
            {
              id: "sec-currentdist",
              label: "Current Distribution",
              show:
                this.props.CurrentDisthidden &&
                Object.keys(ResponseObj.CurrentDistRecord || {}).length !== 0,
            },
            {
              id: "sec-epr",
              label: "Telecommunications EPR Contours",
              show: this.props.EPRhidden,
            },
            {
              id: "sec-ts",
              label: "Touch and Step Voltage Measurements",
              show: this.props.TShidden,
            },
            {
              id: "sec-cont",
              label: "Continuity",
              show:
                this.props.Conhidden &&
                Object.keys(ResponseObj.ConRecord || {}).length !== 0,
            },
            {
              id: "sec-vis",
              label: "Visual Inspection",
              show:
                this.props.VisInsphidden &&
                (ResponseObj.VisualInspectionRecord || []).length !== 0,
            },
            {
              id: "sec-conductor",
              label: "Earth Conductor Sizing",
              show:
                ResponseObj?.reportMisc?.conductorSizing &&
                ResponseObj.reportMisc.conductorSizing !== "{}",
            },
            {
              id: "sec-mitigation",
              label: "Recommended Mitigation",
              show:
                this.props.Mitigationhidden &&
                ResponseObj.MitigationSelection.length,
            },
          ]}
          footer={<PDFFooter reportMisc={reportMisc} />}
        />

        <PDFSummary
          ResponseObj={ResponseObj}
          anchorId="sec-summary"
          footer={<PDFFooter reportMisc={reportMisc} />}
        />

        {this.renderConditionalSections(reportMisc)}
      </Document>
    );
  }

  private renderLoadingPage(text: string) {
    return (
      <Document>
        <Page size="A4" style={styles.body}>
          <Text>{text}</Text>
        </Page>
      </Document>
    );
  }

  private renderConditionalSections(reportMisc: any) {
    const {
      ResponseObj,
      VThidden,
      EPRhidden,
      TShidden,
      Conhidden,
      VisInsphidden,
      CurrentDisthidden,
      Mitigationhidden,
    } = this.props;

    return (
      <>
        <Page size="A4" style={styles.body}>
          <PDFInjectionMethod
            ResponseObj={ResponseObj}
            anchorId="sec-injection"
          />
          <PDFFooter reportMisc={reportMisc} />
        </Page>

        <Page size="A4" style={styles.body}>
          <PDFSoilTable ResponseObj={ResponseObj} anchorId="sec-soil" />
          <PDFFooter reportMisc={reportMisc} />
        </Page>

        <Page size="A4" style={styles.body}>
          <PDFFaultTable ResponseObj={ResponseObj} anchorId="sec-fault" />
          <PDFFooter reportMisc={reportMisc} />
        </Page>

        {(VThidden || CurrentDisthidden) && (
          <Page size="A4" style={styles.body}>
            {VThidden && (
              <PDFVT
                ResponseObj={ResponseObj}
                egvrImages={this.state.egvrImages}
                anchorId="sec-vt"
              />
            )}
            {Object.keys(ResponseObj.CurrentDistRecord || {}).length !== 0 &&
              CurrentDisthidden && (
                <PDFCurrentDist
                  rawData={ResponseObj.CurrentDistRecord}
                  anchorId="sec-currentdist"
                />
              )}
            <PDFFooter reportMisc={reportMisc} />
          </Page>
        )}

        {EPRhidden && (
          <PDFEPR
            rawData={ResponseObj.EPRRecord}
            eprImages={this.state.eprImages}
            anchorId="sec-epr"
            footer={<PDFFooter reportMisc={reportMisc} />}
          />
        )}

        {TShidden && (
          <PDFTS
            rawData={ResponseObj.TSRecord}
            mapImages={this.state.mapImages}
            faultDuration={ResponseObj.fault_s}
            soilRes={ResponseObj.soil_R}
            loadedImages={this.state.TSImages}
            anchorId="sec-ts"
            footer={<PDFFooter reportMisc={reportMisc} />}
          />
        )}

        {Object.keys(ResponseObj.ConRecord || {}).length !== 0 && Conhidden && (
          <PDFCont
            rawData={ResponseObj.ConRecord}
            loadedImages={this.state.contImages}
            anchorId="sec-cont"
            footer={<PDFFooter reportMisc={reportMisc} />}
          />
        )}

        {(ResponseObj.VisualInspectionRecord || []).length !== 0 &&
          VisInsphidden && (
            <PDFEarthVis
              rawData={ResponseObj.VisualInspectionRecord}
              loadedImages={this.state.earthVisImages}
              anchorId="sec-vis"
              footer={<PDFFooter reportMisc={reportMisc} />}
            />
          )}

        {ResponseObj?.reportMisc?.conductorSizing &&
          ResponseObj.reportMisc.conductorSizing !== "{}" && (
            <Page size="A4" style={styles.body}>
              <PDFEarthConductorSize
                ResponseObj={ResponseObj}
                anchorId="sec-conductor"
              />
              <PDFFooter reportMisc={reportMisc} />
            </Page>
          )}

        {Mitigationhidden && ResponseObj.MitigationSelection.length && (
          <PDFMitigation
            MitigationOptions={{ mitigation: ResponseObj.MitigationSelection }}
            anchorId="sec-mitigation"
            footer={<PDFFooter reportMisc={reportMisc} />}
          />
        )}
      </>
    );
  }
}

const captureChartImage = (element: HTMLElement): Promise<string> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        width: element.offsetWidth,
        height: element.offsetHeight,
        backgroundColor: null,
      })
        .then((canvas) => resolve(canvas.toDataURL("image/png", 1.0)))
        .catch((err) => {
          console.error("html2canvas failed:", err);
          reject(err);
        });
    }, 500);
  });
};

export default PDFComponent;
