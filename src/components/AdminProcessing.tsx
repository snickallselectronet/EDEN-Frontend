// Core React & Third-party Libraries
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import Form from "react-bootstrap/Form";

// API & Constants
import { API_URL, host_url } from "../constants";

// Material-UI Components
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Box,
  Button,
  IconButton,
  FormControlLabel,
  Switch,
  InputAdornment,
  OutlinedInput,
  FormLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  FormHelperText,
} from "@mui/material";

// Custom Hooks
import { useAuthenticatedApi } from "../hooks/useAuth";

// Components
import Header from "./Header";
// Type Definitions

interface Site {
  name: string;
  size: string;
  modified_time: string;
}

interface DBSite {
  report_uuid: string;
  site_name: string;
  client_name: string;
  revision: string;
  test_date: string;
  metadata?: {
    record_ids: {
      siteOwnerUuid: string;
      siteUuid: string;
      testEventUuid: string;
    };
    test_report_uuid: string;
  };
}

type FaultField = "fault" | "locations" | "pfc" | "erc" | "tprim" | "tsec";

interface FaultRow {
  fault: string;
  locations: string;
  pfc: string;
  erc: string;
  tprim: string;
  tsec: string;
}

function AdminProcessing() {
  const navigate = useNavigate();
  const { getAuthHeaders, isReady } = useAuthenticatedApi();

  // S3 Sites State
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);

  // Database Sites State
  const [dbSites, setDbSites] = useState<DBSite[]>([]);
  const [dbLoading, setDbLoading] = useState(true);
  const [dbError, setDbError] = useState<any>(null);
  const [selectedDbSite, setSelectedDbSite] = useState<DBSite | null>(null);

  // Client Management State
  const [clients, setClients] = useState<string[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [isNewClient, setIsNewClient] = useState(false);
  const [newClientName, setNewClientName] = useState("");

  // Processing State
  const [readyToConfigure, setReadyToConfigure] = useState(false);
  const [mode, setMode] = useState<"new" | "revision" | null>(null);
  const [baseReportUuid, setBaseReportUuid] = useState<string>("");
  const [transferLoad, setTransferLoad] = useState(false);
  const [transferSuccess, setTransferSuccess] = useState(false);
  const [hasStartedTransfer, setHasStartedTransfer] = useState(false);
  const [uprevLoad, setUprevLoad] = useState(false);
  const [customNotification, setCustomNotification] = useState<string | null>(
    null,
  );
  const [serverError, setServerError] = useState<string | null>(null);
  const [showNotification, setShowNotification] = useState(false);
  const [revisionWarning, setRevisionWarning] = useState<string | null>(null);

  // Site Configuration State
  const [siteNameConfig, setSiteNameConfig] = useState("");
  const [siteAbbreviationConfig, setSiteAbbreviationConfig] = useState("");
  const [countryConfig, setCountryConfig] = useState("NZ");
  const [standardConfig, setStandardConfig] = useState("IEC");
  const [iecClassConfig, setIecClassConfig] = useState("Normal");
  const [transpowerConfig, setTranspowerConfig] = useState(false);
  const [maxVoltageConfig, setMaxVoltageConfig] = useState<number | string>("");
  const [normaliseAngleConfig, setNormaliseAngleConfig] = useState(true);
  const [fillEmptyCurrentAngleConfig, setFillEmptyCurrentAngleConfig] =
    useState(true);
  const [defaultCurrentAngleConfig, setDefaultCurrentAngleConfig] = useState<
    number | string
  >(1.0);
  const [northAdjustmentConfig, setNorthAdjustmentConfig] = useState<
    number | string
  >(0.0);
  const [eastAdjustmentConfig, setEastAdjustmentConfig] = useState<
    number | string
  >(0.0);
  const [contoursConfig, setContoursConfig] = useState<number[]>([
    2500, 1500, 650, 430,
  ]);
  const [faultCurrent, setFaultCurrent] = useState<number | false>(false);
  const [faultDuration, setFaultDuration] = useState<number | false>(false);
  const [topSoilRes, setTopSoilRes] = useState<number | false>(false);
  const [testCurrent, setTestCurrent] = useState<number | false>(false);
  const [eg0TextInput, setEg0TextInput] = useState("");
  const [eg0PrimaryConfig, setEg0PrimaryConfig] = useState<
    Record<string, number>
  >({});
  const [eg0BackupConfig, setEg0BackupConfig] = useState<
    Record<string, number>
  >({});

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Report Details State
  const [reportNumber, setReportNumber] = useState("");
  const [reportRevision, setReportRevision] = useState("");
  const [projectNumber, setProjectNumber] = useState("");
  const [dateTested, setDateTested] = useState("");
  const [testers, setTesters] = useState("");
  const [faultScenario, setFaultScenario] = useState("");
  const remoteInjectionOptions = [
    "eight driven rods",
    "distribution transformer",
  ];
  const [remoteInjectionMethod, setRemoteInjectionMethod] = useState(
    remoteInjectionOptions[0],
  );
  const [distanceOfRods, setDistanceOfRods] = useState<string>("");
  const directions = [
    "North",
    "North-East",
    "East",
    "South-East",
    "South",
    "South-West",
    "West",
    "North-West",
  ];
  const [directionOfRods, setDirectionOfRods] = useState("");
  const [directionOfTraverse, setDirectionOfTraverse] = useState("");

  // Conductor Sizing State
  const [conductorFaultDuration, setConductorFaultDuration] =
    useState<string>("");
  const [conductorFaultCurrent, setConductorFaultCurrent] =
    useState<string>("");
  const [conductorPrimarySize, setConductorPrimarySize] = useState<string>("");
  const [conductorBuriedSize, setConductorBuriedSize] = useState<string>("");

  // Soil Table State
  interface SoilLayer {
    resistivity: string;
    thickness: string;
  }

  // Set default soil table to display
  const [soilLayers, setSoilLayers] = useState<SoilLayer[]>([
    { resistivity: "", thickness: "" },
    { resistivity: "", thickness: "" },
    { resistivity: "", thickness: "" },
  ]);

  const handleSoilTableChange = (
    index: number,
    field: keyof SoilLayer,
    value: string,
  ) => {
    setSoilLayers((prev) =>
      prev.map((layer, i) =>
        i === index ? { ...layer, [field]: value } : layer,
      ),
    );
  };

  const addLayer = () => {
    setSoilLayers([...soilLayers, { resistivity: "", thickness: "" }]);
  };

  const removeLayer = (index: number) => {
    if (soilLayers.length > 1) {
      setSoilLayers(soilLayers.filter((_, i) => i !== index));
    }
  };

  // Fault Table State - Initialize with 2 rows
  const [faultTable, setFaultTable] = useState<FaultRow[]>(
    Array.from({ length: 2 }, (_: unknown, i: number) => ({
      fault: `F${i + 1}`,
      locations: "",
      pfc: "",
      erc: "",
      tprim: "",
      tsec: "",
    })),
  );

  const handleFaultTableChange = (
    idx: number,
    field: FaultField,
    value: string,
  ) => {
    setFaultTable((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const addFaultRow = () => {
    setFaultTable((prev) => [
      ...prev,
      {
        fault: `F${prev.length + 1}`,
        locations: "",
        pfc: "",
        erc: "",
        tprim: "",
        tsec: "",
      },
    ]);
  };

  const removeFaultRow = (idx: number) => {
    if (faultTable.length > 1) {
      setFaultTable((prev) => {
        const filtered = prev.filter((_, i) => i !== idx);
        // Optional: Re-index labels (F1, F2, F3...) so they remain sequential
        return filtered.map((row, i) => ({ ...row, fault: `F${i + 1}` }));
      });
    }
  };

  // Configuration Change Handlers
  const handleSiteNameChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setSiteNameConfig(e.target.value);
  const handleSiteAbbreviationChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => setSiteAbbreviationConfig(e.target.value);
  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) =>
    setCountryConfig(e.target.value);
  const handleStandardChange = (e: React.ChangeEvent<HTMLSelectElement>) =>
    setStandardConfig(e.target.value);
  const handleIecClassChange = (e: React.ChangeEvent<HTMLSelectElement>) =>
    setIecClassConfig(e.target.value);
  const handleTPChange = (_: any, checked: boolean) =>
    setTranspowerConfig(checked);
  const handleNormaliseAngleChange = (_: any, checked: boolean) =>
    setNormaliseAngleConfig(checked);
  const handleEmtpyAngleChange = (_: any, checked: boolean) =>
    setFillEmptyCurrentAngleConfig(checked);
  const handleMaxVoltageChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setMaxVoltageConfig(e.target.value === "" ? "" : Number(e.target.value));
  const handleDefaultCurrentAngleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) =>
    setDefaultCurrentAngleConfig(
      e.target.value === "" ? "" : Number(e.target.value),
    );
  const handleNorthAdjustmentChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) =>
    setNorthAdjustmentConfig(
      e.target.value === "" ? "" : Number(e.target.value),
    );
  const handleEastAdjustmentChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setEastAdjustmentConfig(
      e.target.value === "" ? "" : Number(e.target.value),
    );

  const handleContourChange = (index: number, value: string) => {
    const newContours = [...contoursConfig];
    newContours[index] = value === "" ? 0 : Number(value);
    setContoursConfig(newContours);
  };

  const handleFaultCurrentChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFaultCurrent(e.target.value === "" ? false : Number(e.target.value));
  const handleFaultDurationChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFaultDuration(e.target.value === "" ? false : Number(e.target.value));
  const handleTopSoilResChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setTopSoilRes(e.target.value === "" ? false : Number(e.target.value));
  const handleTestCurrentChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setTestCurrent(e.target.value === "" ? false : Number(e.target.value));

  // Parse EG0 configuration text input
  const parseEg0Text = (text: string) => {
    const lines = text
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    const primary: Record<string, number> = {};
    const backup: Record<string, number> = {};
    let current = "";
    lines.forEach((line) => {
      if (line.startsWith("[EG0_Primary]")) current = "primary";
      else if (line.startsWith("[EG0_Backup]")) current = "backup";
      else {
        const [k, v] = line.split("=").map((p) => p.trim());
        if (k && v !== undefined) {
          const num = Number(v);
          if (!isNaN(num)) {
            if (current === "primary") primary[k] = num;
            else if (current === "backup") backup[k] = num;
          }
        }
      }
    });
    setEg0PrimaryConfig(primary);
    setEg0BackupConfig(backup);
  };

  // Fetch available clients on component mount
  useEffect(() => {
    if (!isReady) return;
    const fetchClients = async () => {
      try {
        const headers = await getAuthHeaders();
        const response = await axios.get(API_URL("GetClients"), { headers });
        setClients(response.data);
      } catch (err) {
        console.error("Error fetching clients:", err);
      }
    };
    fetchClients();
  }, [isReady, getAuthHeaders]);

  // Fetch raw data sites from S3
  useEffect(() => {
    const fetchSites = async () => {
      if (!isReady) return;
      try {
        const headers = await getAuthHeaders();
        const response = await axios.get(`${host_url}get_s3_rawData_list/`, {
          headers,
        });
        setSites(response.data);
        setLoading(false);
      } catch (err) {
        setError("Failed to fetch sites");
        setLoading(false);
        console.error("Error fetching sites:", err);
      }
    };
    fetchSites();
  }, [isReady, getAuthHeaders]);

  // Fetch existing sites from database
  useEffect(() => {
    const fetchDbSites = async () => {
      if (!isReady) return;
      try {
        const headers = await getAuthHeaders();
        const response = await axios.get(API_URL("GetAll"), { headers });

        const transformedData: DBSite[] = response.data.map((site: any[]) => ({
          report_uuid: site[4],
          site_name: site[0],
          client_name: site[1],
          test_date: site[2],
          revision: site[3] || "Rev00",
          metadata: site[5],
        }));

        setDbSites(transformedData);
        setDbLoading(false);
      } catch (err) {
        setDbError("Failed to fetch database sites");
        setDbLoading(false);
        console.error("Error fetching database sites:", err);
      }
    };
    fetchDbSites();
  }, [isReady, getAuthHeaders]);

  const handleSiteSelection = (site: Site) => {
    setSelectedSite(site);
    setSelectedDbSite(null);
    setHasStartedTransfer(false);
    setTransferLoad(false);
    setTransferSuccess(false);
  };

  const parseRevisionNumber = (rev?: string) => {
    if (!rev) return -1;
    const m = rev.match(/Rev(\d+)/i);
    return m ? Number(m[1]) : -1;
  };

  const setSoilLayersFromRevision = (soilData: any) => {
    let obj: any;
    try {
      obj = typeof soilData === "string" ? JSON.parse(soilData) : soilData;
    } catch (e) {
      console.error("Failed to parse soil table JSON:", e);
      return;
    }

    // Expect shape: { p1:{resistivity, thickness}, p2:{...}, ... }
    const layers = Object.entries(obj)
      .filter(([k, v]) => /^p\d+$/i.test(k) && v && typeof v === "object")
      .map(([k, v]) => {
        const idx = Number(String(k).slice(1)); // "p12" -> 12
        const layer = v as any;

        return {
          idx,
          resistivity:
            layer?.resistivity === "" ||
            layer?.resistivity === null ||
            layer?.resistivity === undefined
              ? ""
              : String(layer.resistivity),
          thickness:
            layer?.thickness === "" ||
            layer?.thickness === null ||
            layer?.thickness === undefined
              ? ""
              : String(layer.thickness),
        };
      })
      .filter((x) => Number.isFinite(x.idx))
      .sort((a, b) => a.idx - b.idx)
      .map(({ resistivity, thickness }) => ({ resistivity, thickness }));

    if (layers.length > 0) {
      setSoilLayers(layers);
    }
  };

  const setFaultTableFromRevision = (faultData: any) => {
    let arr: any[] = [];
    try {
      // faultData is typically a JSON string like: "[{...},{...}]"
      const parsed =
        typeof faultData === "string" ? JSON.parse(faultData) : faultData;
      arr = Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error("Failed to parse faultData JSON:", e);
      return;
    }

    const rows: FaultRow[] = arr.map((r: any, i: number) => ({
      // Keep the fault label if present; otherwise fall back to F{n}
      fault: (r?.fault ?? `F${i + 1}`).toString(),

      // API uses fault_locations; UI state uses locations
      locations: (r?.fault_locations ?? r?.locations ?? "").toString(),

      // UI stores strings for number inputs
      pfc:
        r?.prospective_fault_current === "" ||
        r?.prospective_fault_current === null ||
        r?.prospective_fault_current === undefined
          ? ""
          : String(r.prospective_fault_current),

      erc:
        r?.earth_return_current === "" ||
        r?.earth_return_current === null ||
        r?.earth_return_current === undefined
          ? ""
          : String(r.earth_return_current),

      // durations are strings in your example, keep as strings
      tprim: (r?.duration_primary ?? r?.tprim ?? "").toString(),
      tsec: (r?.duration_secondary ?? r?.tsec ?? "").toString(),
    }));

    if (rows.length > 0) setFaultTable(rows);
  };

  const setConductorSizingFromRevision = (conductorSizing: any) => {
    // Expect shape: {\"fault_duration\": 3, \"fault_current\": 546, \"primary_size\": 35, \"buried_size\": 35}
    let obj: any;
    try {
      obj =
        typeof conductorSizing === "string"
          ? JSON.parse(conductorSizing)
          : conductorSizing;
    } catch (e) {
      console.error("Failed to parse soil table JSON:", e);
      return;
    }
    setConductorFaultDuration(obj.fault_duration);
    setConductorBuriedSize(obj.buried_size);
    setConductorFaultCurrent(obj.fault_current);
    setConductorPrimarySize(obj.primary_size);
  };

  const isOlderRevision = (selected: DBSite, all: DBSite[]) => {
    // Compare within same site (and same client, to be stricter)
    const sameSite = all.filter(
      (s) =>
        s.site_name === selected.site_name &&
        s.client_name === selected.client_name,
    );

    const latest = sameSite.reduce((best, cur) => {
      return parseRevisionNumber(cur.revision) >
        parseRevisionNumber(best.revision)
        ? cur
        : best;
    }, sameSite[0]);

    const selectedNum = parseRevisionNumber(selected.revision);
    const latestNum = parseRevisionNumber(latest?.revision);

    return {
      isOlder: selectedNum >= 0 && latestNum >= 0 && selectedNum < latestNum,
      latestRevision: latest?.revision ?? "",
      latestReportUuid: latest?.report_uuid ?? "",
    };
  };

  const handleDbSiteSelection = (site: DBSite) => {
    setSelectedDbSite(site);
    setSelectedSite(null);
    setHasStartedTransfer(false);
    setTransferLoad(false);
    setTransferSuccess(false);
  };

  const handleClientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setHasStartedTransfer(false);
    setTransferLoad(false);
    setTransferSuccess(false);
    if (value === "new") {
      setIsNewClient(true);
      setSelectedClient("");
    } else {
      setIsNewClient(false);
      setSelectedClient(value);
    }
  };

  const cancelProcessing = () => {
    // Clear revision selection + warnings
    setRevisionWarning(null);
    setSelectedDbSite(null);
    setBaseReportUuid("");
    setMode(null);

    // Exit configuration mode
    setReadyToConfigure(false);
    setHasStartedTransfer(false);
    setTransferLoad(false);
    setTransferSuccess(false);

    // Optional: clear any partially filled config
    setSiteNameConfig("");
    setReportRevision("");
  };

  const parseContourKeys = (contourRaw: any): number[] => {
    // String like "{2500.0: 2.4, 1500.0: 5.0, ...}"
    if (typeof contourRaw === "string") {
      // Extract numbers before ":" (the keys)
      const keys = [...contourRaw.matchAll(/([0-9]+(?:\.[0-9]+)?)\s*:/g)]
        .map((m) => Number(m[1]))
        .filter((n) => Number.isFinite(n));

      // Remove duplicates + sort desc
      return Array.from(new Set(keys)).sort((a, b) => b - a);
    }

    // Fallback: your default
    return [2500, 1500, 650, 430];
  };

  const incrementRevision = (rev?: string): string => {
    if (!rev) return "Rev00";

    const match = rev.match(/Rev(\d+)/i);
    if (!match) return "Rev00";

    const num = Number(match[1]) + 1;
    return `Rev${num.toString().padStart(2, "0")}`;
  };

  // Transfer raw data from S3 to database, check if site exists already processed or not
  const handleProcessing = async () => {
    const clientName = isNewClient ? newClientName : selectedClient;

    setCustomNotification(null);
    setServerError(null);
    setTransferSuccess(false);
    setShowNotification(false);

    if (!selectedSite) {
      alert("Please select a site first");
      return;
    }
    if (clientName === "") {
      alert("Please select a client first");
      return;
    }

    try {
      const headers = await getAuthHeaders();
      // READ-ONLY: no DB writes here
      const resp = await axios.get(
        `${host_url}preflight_transfer/${selectedSite.name}/${clientName}/`,
        { headers },
      );

      // Allowed to proceed with NEW site config
      setMode("new");
      // Basic prefill from preflight response
      setSiteNameConfig(resp.data.site_name ?? "");
      setReportRevision("Rev00");
      // Gate to show the configuration form now
      setReadyToConfigure(true);
      // Optional: dim the left/right lists to indicate we’re in “config” mode
      setHasStartedTransfer(true);
    } catch (err: any) {
      if (err.response?.status === 409) {
        // Site exists -> steer to "Create New Revision"
        const srv = err.response?.data;
        setCustomNotification(
          srv?.latest_revision
            ? `Site already exists. Please use “Create New Revision” (latest: ${srv.latest_revision}).`
            : `Site already exists. Please use “Create New Revision”.`,
        );
        setShowNotification(true);
      } else {
        setServerError(err.response?.data?.error ?? err.message);
      }
    }
  };

  // Create a new revision of an existing site
  const handleUprev = async () => {
    if (!selectedDbSite) {
      alert("Please select a site first");
      return;
    }

    // Warn if not latest revision
    const check = isOlderRevision(selectedDbSite, dbSites);
    if (check.isOlder) {
      setRevisionWarning(
        `Warning: You selected ${selectedDbSite.revision}, but the latest is ${check.latestRevision}. ` +
          `Proceeding will create a revision off an older base.`,
      );
    }

    try {
      const headers = await getAuthHeaders();
      // READ-ONLY: fetch data to prefill form; no DB writes here
      const resp = await axios.get(
        `${host_url}processing_prefill?report_uuid=${selectedDbSite.report_uuid}`,
        { headers },
      );

      setMode("revision");
      setBaseReportUuid(selectedDbSite.report_uuid);

      // Prefill fields
      setSiteNameConfig(selectedDbSite.site_name);
      setSelectedClient(selectedDbSite.client_name);
      if (resp.data.country) setCountryConfig(resp.data.country);
      setStandardConfig(resp.data.TSRecord.limitStandard);
      setMaxVoltageConfig(resp.data.VTRecord[0].max_egvr);
      setFaultCurrent(resp.data.fault_I);
      setFaultDuration(resp.data.fault_s);
      setTestCurrent(resp.data.injected_I);
      setContoursConfig(parseContourKeys(resp.data?.EPRRecord?.[0]?.contour));
      setReportNumber(resp.data.reportMisc.reportNumber);
      setReportRevision(incrementRevision(resp.data?.reportMisc?.revision));
      setProjectNumber(resp.data.reportMisc.projectNumber);
      setDateTested(resp.data.reportMisc.dateTested);
      setTesters(resp.data.reportMisc.testers);
      setFaultScenario(resp.data.reportMisc.faultScenario);
      setRemoteInjectionMethod(resp.data.reportMisc.remoteInjectionMethod);
      setDistanceOfRods(resp.data.reportMisc.distanceOfRods);
      setDirectionOfRods(resp.data.reportMisc.directionOfRods);
      setDirectionOfTraverse(resp.data.reportMisc.directionOfTraverse);
      setTopSoilRes(resp.data.soil_R);
      setSoilLayersFromRevision(resp.data.reportMisc.soilData);
      setFaultTableFromRevision(resp.data.reportMisc.faultData);
      setConductorSizingFromRevision(resp.data.reportMisc.conductorSizing);

      setReadyToConfigure(true);
      setHasStartedTransfer(true);
    } catch (error: any) {
      setServerError(error.response?.data?.error ?? error.message);
    }
  };

  // Submit site configuration and process
  const handleSubmitProcessing = async () => {
    const clientName = selectedDbSite
      ? selectedDbSite.client_name
      : isNewClient
        ? newClientName
        : selectedClient;

    // 1. Clear previous error states and notifications
    setErrors({});
    setServerError(null);
    setCustomNotification(null);
    setShowNotification(false);

    const newErrors: Record<string, string> = {};

    if (!siteNameConfig) newErrors.siteNameConfig = "Please enter a Site Name";
    if (!siteAbbreviationConfig)
      newErrors.siteAbbreviationConfig = "Please enter a Site Abbreviation";
    if (!countryConfig) newErrors.countryConfig = "Please select a Country";
    if (!standardConfig)
      newErrors.standardConfig = "Please select an Applied Standard";
    if (standardConfig === "IEC" && !iecClassConfig)
      newErrors.iecClassConfig = "Please select an IEC Site Class";
    if (defaultCurrentAngleConfig === "")
      newErrors.defaultCurrentAngleConfig =
        "Please enter a Default Current Angle";
    if (northAdjustmentConfig === "")
      newErrors.northAdjustmentConfig = "Please enter a North Adjustment";
    if (eastAdjustmentConfig === "")
      newErrors.eastAdjustmentConfig = "Please enter an East Adjustment";
    if (contoursConfig.some((v) => v === 0 || v === undefined))
      newErrors.contoursConfig = "Please fill in all Contour values";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Filter and format fault table rows
    const populatedFaultRows = faultTable
      .filter(
        (r) =>
          (r.fault?.trim()?.length ?? 0) > 0 ||
          (r.locations?.trim()?.length ?? 0) > 0 ||
          r.pfc !== "" ||
          r.erc !== "" ||
          r.tprim.trim() !== "" ||
          r.tsec.trim() !== "",
      )
      .map((r) => ({
        fault: r.fault.trim(),
        fault_locations: r.locations.trim(),
        prospective_fault_current: r.pfc === "" ? "" : Number(r.pfc),
        earth_return_current: r.erc === "" ? "" : Number(r.erc),
        duration_primary: r.tprim.trim(),
        duration_secondary: r.tsec.trim(),
      }));

    // Build configuration object
    const configObj = {
      site_name: siteNameConfig,
      abbr_site_name: siteAbbreviationConfig,
      country: countryConfig,
      applied_standard: standardConfig,
      iec_site_class: iecClassConfig,
      client_TP: transpowerConfig,
      client_name: clientName,
      max_voltage_override: maxVoltageConfig === "" ? false : maxVoltageConfig,
      normalise_angle: normaliseAngleConfig,
      fill_current_angle_na: fillEmptyCurrentAngleConfig,
      default_current_angle:
        defaultCurrentAngleConfig === "" ? 0 : defaultCurrentAngleConfig,
      north_adjustment:
        northAdjustmentConfig === "" ? 0 : northAdjustmentConfig,
      east_adjustment: eastAdjustmentConfig === "" ? 0 : eastAdjustmentConfig,

      fault_current: faultCurrent,
      fault_duration: faultDuration,
      top_soil_res: topSoilRes,
      test_current: testCurrent,

      contours: contoursConfig,

      EG0_Primary: eg0PrimaryConfig,
      EG0_Backup: eg0BackupConfig,

      report_misc: {
        report_number: reportNumber,
        report_revision: reportRevision || "Rev00",
        project_number: projectNumber,
        date_tested: dateTested,
        testers,
        fault_scenario: faultScenario,
        remote_injection_method: remoteInjectionMethod,
        distance_of_rods: distanceOfRods === "" ? "" : Number(distanceOfRods),
        direction_of_rods: directionOfRods,
        direction_of_traverse: directionOfTraverse,
        fault_table: populatedFaultRows,
        soil_table: soilLayers.reduce(
          (acc, layer, index) => {
            const key = `p${index + 1}`;
            acc[key] = {
              resistivity:
                layer.resistivity === "" ? "" : Number(layer.resistivity),
              thickness: layer.thickness === "" ? "" : Number(layer.thickness),
            };
            return acc;
          },
          {} as Record<
            string,
            { resistivity: number | string; thickness: number | string }
          >,
        ),
        conductorSizing: {
          fault_duration:
            conductorFaultDuration === "" ? "" : Number(conductorFaultDuration),
          fault_current:
            conductorFaultCurrent === "" ? "" : Number(conductorFaultCurrent),
          primary_size:
            conductorPrimarySize === "" ? "" : Number(conductorPrimarySize),
          buried_size:
            conductorBuriedSize === "" ? "" : Number(conductorBuriedSize),
        },
      },
    };

    setHasStartedTransfer(true);
    setTransferLoad(true);

    try {
      const headers = await getAuthHeaders();
      const finalHeaders = { ...headers, "Content-Type": "application/json" };

      if (mode === "new" && selectedSite) {
        // single-commit for NEW site
        await axios.post(
          `${host_url}processing_new/`,
          {
            s3_filename: selectedSite.name,
            client: selectedDbSite
              ? selectedDbSite.client_name
              : isNewClient
                ? newClientName
                : selectedClient,
            config: configObj,
          },
          { headers: finalHeaders },
        );
      } else if (mode === "revision" && baseReportUuid) {
        // single-commit for REVISION
        await axios.post(
          `${host_url}processing_revision/`,
          {
            base_report_uuid: baseReportUuid,
            config: configObj,
          },
          { headers: finalHeaders },
        );
      } else {
        throw new Error("Invalid processing mode or missing identifiers.");
      }

      setTransferLoad(false);
      setTransferSuccess(true);
    } catch (err: any) {
      setTransferLoad(false);
      const message =
        err.response?.data?.error ??
        err.message ??
        "Failed to process site. Please try again.";
      setServerError(message);
    }
  };

  if (loading && dbLoading) return <div className="p-4">Loading sites...</div>;
  if (error || dbError)
    return <div className="p-4 text-red-500">{error || dbError}</div>;

  // Format sites data for Header component
  const allSitesForHeader = [
    ...dbSites.map((s) => [
      s.site_name,
      s.client_name,
      s.test_date,
      s.revision,
      s.report_uuid,
      s.metadata,
    ]),
  ];

  return (
    <>
      <Header
        handleSiteChange={(name: string, client: string, metadata?: any) => {
          if (name === "home") {
            navigate("/");
          } else {
            navigate(`/${name}/`, {
              state: { siteName: name, client, metadata },
            });
          }
        }}
        AllSites={allSitesForHeader}
        userPermissions="Admin"
        toggleProcessing={() => {
          navigate("/");
        }}
        showProcessing={true}
      />

      <div className="processing-container" style={{ padding: "20px" }}>
        {customNotification &&
          showNotification && ( // Check the new visibility state
            <div
              style={{
                display: "flex",
                justifyContent: "center", // Center the inner content horizontally
                margin: "20px auto 20px auto", // Center the outer block on the page
                maxWidth: "800px", // Make the container narrower
              }}
            >
              <div
                style={{
                  flexGrow: 1, // Allow the notification content to take available space
                  display: "flex",
                  justifyContent: "space-between", // Space out text and button
                  alignItems: "flex-start", // Align text/button to top
                  border: "1px solid #ff9800",
                  backgroundColor: "#fff3e0",
                  color: "#e65100",
                  fontWeight: "bold",
                  padding: "12px",
                  textAlign: "left", // Reset text alignment for better flow
                  whiteSpace: "pre-wrap",
                  borderRadius: "4px",
                }}
              >
                {/* Notification Text Content */}
                <span
                  style={{ flexGrow: 1, paddingRight: "20px" }} // Give text content space
                  dangerouslySetInnerHTML={{ __html: customNotification }}
                />

                {/* Close Button */}
                <button
                  onClick={() => setShowNotification(false)} // Hides the notification
                  style={{
                    background: "none",
                    border: "none",
                    color: "#e65100",
                    fontSize: "1.2rem",
                    fontWeight: "bold",
                    cursor: "pointer",
                    padding: "0 5px",
                    lineHeight: 1,
                    marginLeft: "10px",
                  }}
                >
                  &times;{" "}
                  {/* HTML entity for multiplication sign, used as 'X' */}
                </button>
              </div>
            </div>
          )}

        {/* Display True Server Error (Optional, for actual failures) */}
        {serverError && (
          <div
            style={{
              // ... (Your red error styling) ...
              color: "red",
              padding: "10px",
              textAlign: "center",
              margin: "10px 20px",
              border: "1px solid red",
            }}
          >
            {serverError}
          </div>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "20px",
            opacity:
              (hasStartedTransfer &&
                (transferLoad || uprevLoad || transferSuccess)) ||
              readyToConfigure
                ? 0.5
                : 1,
            pointerEvents:
              (hasStartedTransfer &&
                (transferLoad || uprevLoad || transferSuccess)) ||
              readyToConfigure
                ? "none"
                : "auto",
          }}
        >
          {/* New Site from S3 Section */}
          <div style={{ width: "45%", margin: "0px 10px" }}>
            <span style={{ fontWeight: "bold", fontSize: "18px" }}>
              New Site from S3
            </span>
            <div
              style={{
                width: "100%",
                height:
                  transferLoad || uprevLoad || transferSuccess
                    ? "200px"
                    : "400px",
                border: "1px solid gray",
                borderRadius: "3px",
                overflow: "scroll",
              }}
            >
              {sites.map((record, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    marginBottom: "5px",
                    padding: "5px",
                    borderBottom: "1px solid #eee",
                  }}
                >
                  <input
                    type="radio"
                    id={`s3-record-${index}`}
                    name="recordSelection"
                    value={record.name}
                    checked={selectedSite?.name === record.name}
                    onChange={() => handleSiteSelection(record)}
                    style={{ marginRight: "10px", marginTop: "4px" }}
                  />
                  <label
                    htmlFor={`s3-record-${index}`}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      cursor: "pointer",
                    }}
                  >
                    <span style={{ fontWeight: "bold" }}>{record.name}</span>
                    <span style={{ fontSize: "0.9em", color: "#666" }}>
                      Size: {record.size}
                    </span>
                    <span style={{ fontSize: "0.9em", color: "#666" }}>
                      Modified: {record.modified_time}
                    </span>
                  </label>
                </div>
              ))}
            </div>
            <div
              style={{
                marginTop: "20px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <FormControl style={{ width: "80%" }}>
                <InputLabel id="select-client-label">Select Client</InputLabel>
                <Select
                  labelId="select-client-label"
                  id="select-client"
                  value={isNewClient ? "new" : selectedClient}
                  label="Select Client"
                  onChange={handleClientChange as any}
                  disabled={!!selectedDbSite}
                >
                  <MenuItem value=""></MenuItem>
                  <MenuItem value="new">+ Add new client</MenuItem>
                  {clients.map((item: string) => (
                    <MenuItem key={item} value={item}>
                      {item}
                    </MenuItem>
                  ))}
                </Select>
                {isNewClient && (
                  <TextField
                    id="outlined-basic"
                    label="New Client"
                    variant="outlined"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    style={{ marginTop: "12px" }}
                    disabled={!!selectedDbSite}
                  />
                )}
              </FormControl>
              <button
                className="electronet_btn"
                style={{ width: "80%", padding: "10px" }}
                onClick={handleProcessing}
                disabled={!!selectedDbSite}
              >
                Begin Processing
              </button>
            </div>
          </div>

          <div
            style={{ width: "2px", backgroundColor: "#ccc", margin: "0 10px" }}
          ></div>

          {/* Uprev Existing Site Section */}
          <div style={{ width: "45%", margin: "0px 10px" }}>
            <span style={{ fontWeight: "bold", fontSize: "18px" }}>
              Uprev Existing Site
            </span>
            <div
              style={{
                width: "100%",
                height:
                  transferLoad || uprevLoad || transferSuccess
                    ? "200px"
                    : "400px",
                border: "1px solid gray",
                borderRadius: "3px",
                overflow: "scroll",
                marginTop: "10px",
              }}
            >
              {dbLoading ? (
                <div style={{ padding: "10px" }}>Loading database sites...</div>
              ) : dbError ? (
                <div style={{ padding: "10px", color: "red" }}>{dbError}</div>
              ) : (
                dbSites.map((record, index) => (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      marginBottom: "5px",
                      padding: "5px",
                      borderBottom: "1px solid #eee",
                    }}
                  >
                    <input
                      type="radio"
                      id={`db-record-${index}`}
                      name="recordSelection"
                      value={record.report_uuid}
                      checked={
                        selectedDbSite?.report_uuid === record.report_uuid
                      }
                      onChange={() => handleDbSiteSelection(record)}
                      style={{ marginRight: "10px", marginTop: "4px" }}
                    />
                    <label
                      htmlFor={`db-record-${index}`}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        cursor: "pointer",
                      }}
                    >
                      <span style={{ fontWeight: "bold" }}>
                        {record.site_name}
                      </span>
                      <span style={{ fontSize: "0.9em", color: "#666" }}>
                        Client: {record.client_name}
                      </span>
                      <span style={{ fontSize: "0.9em", color: "#666" }}>
                        Revision: {record.revision}
                      </span>
                      <span style={{ fontSize: "0.9em", color: "#666" }}>
                        Test Date:{" "}
                        {new Date(record.test_date).toLocaleDateString()}
                      </span>
                    </label>
                  </div>
                ))
              )}
            </div>
            <div
              style={{
                marginTop: "20px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <button
                className="electronet_btn"
                style={{ width: "80%", padding: "10px" }}
                onClick={handleUprev}
                disabled={!!selectedSite}
              >
                Create New Revision
              </button>
            </div>
          </div>
        </div>

        {/* Processing Status Messages */}
        {hasStartedTransfer && (transferLoad || uprevLoad) && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginTop: "12px",
              borderTop: "1px solid var(--en-blue)",
              color: "red",
              fontWeight: "bold",
              paddingTop: "12px",
            }}
          >
            <span>
              {transferLoad
                ? "Transferring data to database, please wait."
                : "Creating new revision, please wait."}
            </span>
          </div>
        )}
        {hasStartedTransfer &&
          !transferLoad &&
          !uprevLoad &&
          transferSuccess && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginTop: "12px",
                borderTop: "1px solid var(--en-blue)",
                color: "green",
                fontWeight: "bold",
                paddingTop: "12px",
              }}
            >
              <span>
                {selectedSite
                  ? "Transfer complete."
                  : "Revision created successfully."}
              </span>
            </div>
          )}

        {/* Configuration Form - visible after preflight/prefill, BEFORE any write */}
        {readyToConfigure && (
          <div
            style={{
              marginTop: "12px",
              borderTop: "1px solid var(--en-blue)",
            }}
          >
            {(selectedSite || selectedDbSite) && !revisionWarning && (
              <div
                style={{
                  color: "#000000",
                  backgroundColor: "rgb(165 211 231)",
                  padding: "10px",
                  textAlign: "center",
                  margin: "10px 20px",
                  borderRadius: "4px",
                  fontWeight: "bold",
                  whiteSpace: "pre-wrap",
                }}
              >
                <span>
                  {selectedSite
                    ? `Now configuring ${selectedSite.name}.`
                    : `Now configuring new revision of ${selectedDbSite?.site_name}, based on ${selectedDbSite?.revision}.`}
                </span>
                <button
                  className="electronet_btn"
                  style={{
                    marginLeft: "10px",
                    padding: "6px 14px",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                  onClick={cancelProcessing}
                >
                  Cancel
                </button>
              </div>
            )}

            {revisionWarning && (
              <div
                style={{
                  color: "#8a6d3b",
                  backgroundColor: "#fcf8e3",
                  border: "1px solid #faebcc",
                  padding: "10px",
                  textAlign: "center",
                  margin: "10px 20px",
                  borderRadius: "4px",
                  fontWeight: "bold",
                  whiteSpace: "pre-wrap",
                }}
              >
                <span>{revisionWarning}</span>
                <button
                  className="electronet_btn"
                  style={{
                    marginLeft: "10px",
                    backgroundColor: "#f3e6aa",
                    color: "#8a6d3b",
                    padding: "6px 14px",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                  onClick={cancelProcessing}
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Site Configuration Fields */}
            <Box
              component="form"
              sx={{ "& .MuiTextField-root": { m: 1, width: "25ch" } }}
              noValidate
              autoComplete="off"
              style={{ marginTop: "12px" }}
            >
              <div>
                <TextField
                  id="site-name"
                  value={siteNameConfig}
                  label="Site Name"
                  onChange={handleSiteNameChange}
                  required
                  error={!!errors.siteNameConfig}
                  helperText={errors.siteNameConfig}
                />
                <TextField
                  id="site-abbreviation"
                  value={siteAbbreviationConfig}
                  label="Site Abbreviation"
                  onChange={handleSiteAbbreviationChange}
                  required
                  error={!!errors.siteAbbreviationConfig}
                  helperText={errors.siteAbbreviationConfig}
                />
                <FormControl
                  style={{ width: "25ch", margin: "8px" }}
                  required
                  error={!!errors.countryConfig}
                >
                  <InputLabel id="country-label">Country</InputLabel>
                  <Select
                    labelId="country-label"
                    id="country"
                    value={countryConfig}
                    label="Country"
                    onChange={handleCountryChange as any}
                  >
                    <MenuItem value="NZ">New Zealand</MenuItem>
                    <MenuItem value="AU">Australia</MenuItem>
                  </Select>
                  <FormHelperText>{errors.countryConfig}</FormHelperText>
                </FormControl>
                <FormControl
                  style={{ width: "25ch", margin: "8px" }}
                  required
                  error={!!errors.standardConfig}
                >
                  <InputLabel id="standard-label">Applied Standard</InputLabel>
                  <Select
                    labelId="standard-label"
                    id="standard"
                    value={standardConfig}
                    label="Applied Standard"
                    onChange={handleStandardChange as any}
                  >
                    <MenuItem value="IEC">IEC</MenuItem>
                    <MenuItem value="IEEE80">IEEE 80</MenuItem>
                  </Select>
                  <FormHelperText>{errors.standardConfig}</FormHelperText>
                </FormControl>
                {standardConfig === "IEC" && (
                  <FormControl
                    style={{ width: "25ch", margin: "8px" }}
                    required={standardConfig === "IEC"}
                    error={!!errors.iecClassConfig}
                  >
                    <InputLabel id="iec-site-class-label">
                      IEC Site Class
                    </InputLabel>
                    <Select
                      labelId="iec-site-class-label"
                      id="iec-site-class"
                      value={iecClassConfig}
                      label="IEC Site Class"
                      onChange={handleIecClassChange as any}
                    >
                      <MenuItem value="Normal">Normal</MenuItem>
                      <MenuItem value="Special">Special</MenuItem>
                    </Select>
                    <FormHelperText>{errors.iecClassConfig}</FormHelperText>
                  </FormControl>
                )}
                {countryConfig === "NZ" && (
                  <FormControlLabel
                    style={{ width: "25ch", margin: "8px", padding: "8px 0" }}
                    label="Transpower Site"
                    control={
                      <Switch
                        checked={transpowerConfig}
                        onChange={handleTPChange}
                      />
                    }
                  />
                )}

                <TextField
                  id="max-voltage"
                  label="Max Voltage Override"
                  value={maxVoltageConfig}
                  onChange={handleMaxVoltageChange}
                  type="number"
                />

                <FormControlLabel
                  style={{ width: "25ch", margin: "8px" }}
                  label="Normalise Angle"
                  control={
                    <Switch
                      checked={normaliseAngleConfig}
                      onChange={handleNormaliseAngleChange}
                    />
                  }
                />
                <FormControlLabel
                  style={{ width: "25ch", margin: "8px" }}
                  label="Fill Empty Angle"
                  control={
                    <Switch
                      checked={fillEmptyCurrentAngleConfig}
                      onChange={handleEmtpyAngleChange}
                    />
                  }
                />
                <TextField
                  id="default-current-angle"
                  label="Default Current Angle"
                  value={defaultCurrentAngleConfig}
                  onChange={handleDefaultCurrentAngleChange}
                  type="number"
                  required
                  error={!!errors.defaultCurrentAngleConfig}
                  helperText={errors.defaultCurrentAngleConfig}
                />
                <TextField
                  id="north-adjust"
                  label="North Adjustment"
                  value={northAdjustmentConfig}
                  onChange={handleNorthAdjustmentChange}
                  type="number"
                  required
                  error={!!errors.northAdjustmentConfig}
                  helperText={errors.northAdjustmentConfig}
                />
                <TextField
                  id="east-adjust"
                  label="East Adjustment"
                  value={eastAdjustmentConfig}
                  onChange={handleEastAdjustmentChange}
                  type="number"
                  required
                  error={!!errors.eastAdjustmentConfig}
                  helperText={errors.eastAdjustmentConfig}
                />
                <TextField
                  id="fault-current"
                  label="Fault Current (A)"
                  value={faultCurrent === false ? "" : faultCurrent}
                  onChange={handleFaultCurrentChange}
                  type="number"
                />
                <TextField
                  id="fault-duration"
                  label="Fault Duration (s)"
                  value={faultDuration === false ? "" : faultDuration}
                  onChange={handleFaultDurationChange}
                  type="number"
                />
                <TextField
                  id="test-current"
                  label="Test Current (A)"
                  value={testCurrent === false ? "" : testCurrent}
                  onChange={handleTestCurrentChange}
                  type="number"
                />

                <FormLabel style={{ marginTop: "6px" }}>
                  Paste EG0 Values
                </FormLabel>
                <TextField
                  id="eg0-text"
                  label="EG0 Configuration"
                  multiline
                  rows={4}
                  fullWidth
                  value={eg0TextInput}
                  onChange={(e) => {
                    setEg0TextInput(e.target.value);
                    parseEg0Text(e.target.value);
                  }}
                  placeholder={`Paste values like:
[EG0_Primary]
Touch_PA_NG = 498.0
...
[EG0_Backup]
Touch_PA_NG = 182.0
...`}
                />
              </div>
            </Box>

            {/* Contour Values */}
            <FormLabel style={{ marginTop: "6px" }}>Contour Values</FormLabel>
            <Box
              component="form"
              sx={{ "& .MuiTextField-root": { m: 1, width: "25ch" } }}
              noValidate
              autoComplete="off"
              style={{ display: "flex", justifyContent: "center" }}
            >
              {contoursConfig.map((val, i) => (
                <FormControl
                  key={i}
                  sx={{ m: 1, width: "20ch" }}
                  variant="outlined"
                  error={!!errors.contoursConfig}
                >
                  <OutlinedInput
                    id={`contour-${i}`}
                    value={val}
                    onChange={(e) => handleContourChange(i, e.target.value)}
                    type="number"
                    endAdornment={
                      <InputAdornment position="end">V</InputAdornment>
                    }
                  />
                </FormControl>
              ))}
            </Box>
            {errors.contoursConfig && (
              <FormHelperText error sx={{ ml: 2, textAlign: "center" }}>
                {errors.contoursConfig}
              </FormHelperText>
            )}

            {/* Additional Test Details */}
            <FormLabel style={{ marginTop: "12px" }}>
              Additional Test Details
            </FormLabel>
            <Box
              component="div"
              sx={{ "& .MuiTextField-root": { m: 1, width: "25ch" } }}
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "center",
              }}
            >
              <TextField
                id="report-number"
                label="Report Number"
                value={reportNumber}
                onChange={(e) => setReportNumber(e.target.value)}
              />
              <TextField
                id="report-revision"
                label="Report Revision"
                value={reportRevision}
                onChange={(e) => setReportRevision(e.target.value)}
                placeholder={`Rev00`}
              />
              <TextField
                id="project-number"
                label="Project Number"
                value={projectNumber}
                onChange={(e) => setProjectNumber(e.target.value)}
              />
              <TextField
                id="date-tested"
                label="Date Tested"
                type="date"
                value={dateTested}
                onChange={(e) => setDateTested(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                id="testers"
                label="Testers"
                value={testers}
                onChange={(e) => setTesters(e.target.value)}
                placeholder="F.Surname, F.Surname"
                sx={{ m: 1, width: "52ch" }}
              />
              <TextField
                id="fault-scenario"
                label="Fault Scenario"
                value={faultScenario}
                placeholder="33 kV bus earth fault"
                onChange={(e) => setFaultScenario(e.target.value)}
              />

              <FormControl sx={{ m: 1, width: "25ch" }}>
                <InputLabel id="remote-injection-label">
                  Remote Injection Method
                </InputLabel>
                <Select
                  labelId="remote-injection-label"
                  id="remote-injection"
                  value={remoteInjectionMethod}
                  label="Remote Injection Method"
                  onChange={(e) =>
                    setRemoteInjectionMethod(e.target.value as string)
                  }
                >
                  {remoteInjectionOptions.map((opt) => (
                    <MenuItem key={opt} value={opt}>
                      {opt}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                id="distance-of-rods"
                label="Distance of Rods (m)"
                value={distanceOfRods}
                onChange={(e) => setDistanceOfRods(e.target.value)}
                type="number"
              />
              <FormControl sx={{ m: 1, width: "25ch" }}>
                <InputLabel id="direction-rods-label">
                  Direction of Rods
                </InputLabel>
                <Select
                  labelId="direction-rods-label"
                  id="direction-rods"
                  value={directionOfRods}
                  label="Direction of Rods"
                  onChange={(e) => setDirectionOfRods(e.target.value as string)}
                >
                  {directions.map((dir) => (
                    <MenuItem key={dir} value={dir}>
                      {dir}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl sx={{ m: 1, width: "25ch" }}>
                <InputLabel id="direction-traverse-label">
                  Direction of Traverse
                </InputLabel>
                <Select
                  labelId="direction-traverse-label"
                  id="direction-traverse"
                  value={directionOfTraverse}
                  label="Direction of Traverse"
                  onChange={(e) =>
                    setDirectionOfTraverse(e.target.value as string)
                  }
                >
                  {directions.map((dir) => (
                    <MenuItem key={dir} value={dir}>
                      {dir}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                id="top-soil-res"
                label="Topsoil Resistivity (Ω-m)"
                value={topSoilRes === false ? "" : topSoilRes}
                onChange={handleTopSoilResChange}
                type="number"
              />
            </Box>

            {/* Soil Table */}
            <FormLabel style={{ marginTop: "12px" }}>Soil Table</FormLabel>
            <TableContainer
              component={Paper}
              sx={{ m: 1, maxWidth: 700, marginInline: "auto" }}
            >
              <Table size="small" aria-label="soil-table">
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <strong>Layer</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Resistivity (Ω-m)</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Thickness (m)</strong>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {soilLayers.map((layer, index) => (
                    <TableRow key={index}>
                      {/* Label layers as p1, p2, p3 based on index */}
                      <TableCell>p{index + 1}</TableCell>

                      <TableCell>
                        <TextField
                          value={layer.resistivity}
                          onChange={(e) =>
                            handleSoilTableChange(
                              index,
                              "resistivity",
                              e.target.value,
                            )
                          }
                          type="number"
                          size="small"
                        />
                      </TableCell>

                      <TableCell>
                        <TextField
                          // Display ∞ symbol when it's the last row and empty
                          value={
                            index === soilLayers.length - 1 &&
                            layer.thickness === ""
                              ? "∞"
                              : layer.thickness
                          }
                          onChange={(e) =>
                            handleSoilTableChange(
                              index,
                              "thickness",
                              e.target.value,
                            )
                          }
                          type={
                            index === soilLayers.length - 1 ? "text" : "number"
                          }
                          size="small"
                          disabled={index === soilLayers.length - 1}
                          sx={{
                            "& .MuiInputBase-input.Mui-disabled": {
                              WebkitTextFillColor: "rgba(0, 0, 0, 0.87)", // Keeps symbol dark
                              fontWeight: "bold",
                            },
                          }}
                        />
                      </TableCell>

                      <TableCell align="center">
                        <IconButton
                          onClick={() => removeLayer(index)}
                          color="error"
                          size="small"
                          disabled={soilLayers.length <= 1} // Prevent removing the only remaining layer
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {/* Add Layer Button Section */}
              <Box sx={{ p: 1, display: "flex", justifyContent: "center" }}>
                <button
                  className="electronet_btn"
                  style={{
                    // fontSize: "20px",
                    // padding: "12px 30px",
                    backgroundColor: transferLoad ? "#ccc" : "",
                    color: transferLoad ? "#666" : "",
                    cursor: transferLoad ? "not-allowed" : "pointer",
                  }}
                  onClick={addLayer}
                  disabled={transferLoad}
                >
                  <AddIcon fontSize="small" />
                  {" Add Layer"}
                </button>
              </Box>
            </TableContainer>

            {/* Fault Table */}
            <FormLabel style={{ marginTop: "12px" }}>Fault Table</FormLabel>
            <TableContainer
              component={Paper}
              sx={{ m: 1, maxWidth: 1200, marginInline: "auto" }}
            >
              <Table size="small" aria-label="fault-table">
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <strong>Fault</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Fault Locations</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Prospective Fault Current (A)</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Earth Return Current (A)</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Fault Duration Primary Protection (s)</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Fault Duration Secondary Protection (s)</strong>
                    </TableCell>
                    <TableCell align="center">
                      <strong>Actions</strong>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {faultTable.map((row, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <TextField
                          value={row.fault}
                          onChange={(e) =>
                            handleFaultTableChange(idx, "fault", e.target.value)
                          }
                          size="small"
                          sx={{ width: 70 }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          value={row.locations}
                          onChange={(e) =>
                            handleFaultTableChange(
                              idx,
                              "locations",
                              e.target.value,
                            )
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          value={row.pfc}
                          onChange={(e) =>
                            handleFaultTableChange(idx, "pfc", e.target.value)
                          }
                          type="number"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          value={row.erc}
                          onChange={(e) =>
                            handleFaultTableChange(idx, "erc", e.target.value)
                          }
                          type="number"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          value={row.tprim}
                          onChange={(e) =>
                            handleFaultTableChange(idx, "tprim", e.target.value)
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          value={row.tsec}
                          onChange={(e) =>
                            handleFaultTableChange(idx, "tsec", e.target.value)
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          onClick={() => removeFaultRow(idx)}
                          color="error"
                          disabled={faultTable.length <= 1}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Box sx={{ p: 1, display: "flex", justifyContent: "center" }}>
                <button
                  className="electronet_btn"
                  style={{
                    backgroundColor: transferLoad ? "#ccc" : "",
                    color: transferLoad ? "#666" : "",
                    cursor: transferLoad ? "not-allowed" : "pointer",
                  }}
                  onClick={addFaultRow}
                  disabled={transferLoad}
                >
                  <AddIcon fontSize="small" />
                  {" Add Fault Scenario"}
                </button>
              </Box>
            </TableContainer>

            {/* Conductor Sizing Section */}
            <FormLabel
              style={{ marginTop: "12px", width: "100%", textAlign: "center" }}
            >
              Conductor Sizing
            </FormLabel>
            <Box
              component="div"
              sx={{ "& .MuiTextField-root": { m: 1, width: "25ch" } }}
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "center",
              }}
            >
              <TextField
                id="conductor-fault-duration"
                label="Fault Duration (s)"
                value={conductorFaultDuration}
                onChange={(e) => setConductorFaultDuration(e.target.value)}
                type="number"
              />
              <TextField
                id="conductor-fault-current"
                label="Fault Current (A)"
                value={conductorFaultCurrent}
                onChange={(e) => setConductorFaultCurrent(e.target.value)}
                type="number"
              />
              <TextField
                id="conductor-primary-size"
                label="Primary Size (mm²)"
                value={conductorPrimarySize}
                onChange={(e) => setConductorPrimarySize(e.target.value)}
                type="number"
              />
              <TextField
                id="conductor-buried-size"
                label="Buried Size (mm²)"
                value={conductorBuriedSize}
                onChange={(e) => setConductorBuriedSize(e.target.value)}
                type="number"
              />
            </Box>

            {/* Submit Button */}
            <div
              style={{
                marginTop: "12px",
                display: "flex",
                justifyContent: "center",
                paddingBottom: "24px",
              }}
            >
              <button
                className="electronet_btn"
                style={{
                  fontSize: "20px",
                  padding: "12px 30px",
                  backgroundColor: transferLoad ? "#ccc" : "",
                  color: transferLoad ? "#666" : "",
                  cursor: transferLoad ? "not-allowed" : "pointer",
                }}
                onClick={handleSubmitProcessing}
                disabled={transferLoad}
              >
                Submit for Processing
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default AdminProcessing;
