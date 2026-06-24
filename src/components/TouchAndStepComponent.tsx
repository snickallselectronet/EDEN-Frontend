import TSSectionComponent from "./TSSectionComponent";

interface Props {
  rawData: any;
  faultDuration: any;
  soilRes: any;
  photoKey: any;
  isMapCapturing: any;
  setMapCapturing: any;
}

function TouchAndStepContent({
  rawData,
  faultDuration,
  soilRes,
  photoKey,
  isMapCapturing,
  setMapCapturing,
}: Props) {
  const tableStyles = {
    table: { width: "100%" } as React.CSSProperties,
    th: { border: "1px solid gray", textAlign: "center" as const },
    td: { border: "1px solid gray", textAlign: "center" as const },
    tdLeft: { border: "1px solid gray", paddingLeft: "1em" } as React.CSSProperties,
  };

  // Reformatting limitStandard in rawData to be in appropriate format
  const standardValue = Array.isArray(rawData["limitStandard"]) 
    ? rawData["limitStandard"][0]  // Take the first element if it's an array
    : rawData["limitStandard"];    // Use as is if it's not an array
  rawData.limitStandard = standardValue;

  // Reformatting limits in rawData to be in appropriate format
  let transformedLimits: Record<string, any> = {};

  // Handle the case where limits is an object with a '0' key containing a JSON string
  if (rawData.limits && typeof rawData.limits === 'object' && rawData.limits['0'] && typeof rawData.limits['0'] === 'string') {
    try {
      // Parse the inner JSON string
      const parsedLimits = JSON.parse(rawData.limits['0']);
      
      // Process the parsed limits
      Object.keys(parsedLimits).forEach(key => {
        // Remove 'IEC' prefix if it exists
        if (key.startsWith('IEC')) {
          const newKey = key.substring(3); // Remove 'IEC' prefix
          transformedLimits[newKey] = parsedLimits[key];
        } 
        // Remove 'IEEE80' prefix if it exists
        else if (key.startsWith('IEEE80')) {
          const newKey = key.substring(6); // Remove 'IEEE80' prefix
          transformedLimits[newKey] = parsedLimits[key];
        } 
        // Keep the key as is if no prefix
        else {
          transformedLimits[key] = parsedLimits[key];
        }
        
        // Also keep the original key
        transformedLimits[key] = parsedLimits[key];
      });
    } catch (e) {
      console.error("Error parsing limits JSON string:", e);
    }
  } else {
    // Handle the case where limits is already an object or a string
    const limits = typeof rawData.limits === 'string' 
      ? JSON.parse(rawData.limits) 
      : rawData.limits;

    // Map both IEC and IEEE80 keys to expected keys
    if (limits && typeof limits === 'object') {
      Object.keys(limits).forEach(key => {
        // Remove 'IEC' prefix if it exists
        if (key.startsWith('IEC')) {
          const newKey = key.substring(3); // Remove 'IEC' prefix
          transformedLimits[newKey] = limits[key];
        } 
        // Remove 'IEEE80' prefix if it exists
        else if (key.startsWith('IEEE80')) {
          const newKey = key.substring(6); // Remove 'IEEE80' prefix
          transformedLimits[newKey] = limits[key];
        } 
        // Keep the key as is if no prefix
        else {
          transformedLimits[key] = limits[key];
        }
      });
    }
  }

  function capValues(data: Record<string, number>): Record<string, number> {
    return Object.fromEntries(
      Object.entries(data).map(([key, value]) => {
        const isStep = key.includes("Step");
        return [
          key,
          isStep ? Math.min(value, 8000) : Math.min(value, 4000)
        ];
      })
    );
  }
  

  // Replace the limits in rawData
  rawData.limits = capValues(transformedLimits);

  const siteType = rawData.iec_site_class;

  const headerData = [
    {
      width: "60%",
      text: "Tolerable Limits",
      align: "left" as const,
      paddingLeft: "1em",
    },
    {
      width: "20%",
      text: `Touch Voltage (V) <br /> ${faultDuration.toFixed(2)} s`,
      align: "center" as const,
    },
    {
      width: "20%",
      text: `Step Voltage (V) <br /> ${faultDuration.toFixed(2)} s`,
      align: "center" as const,
    },
  ];

  const normalRowData = [
    {
      text: "Loaded tolerable limit (any surface or between two conductors)",
      touchKey: "ReachNormalMetal",
      stepKey: "StepSpecialMetal",
    },
    {
      text: `${soilRes} Ω-m surface (natural ground typical)`,
      touchKey: "TouchNormalNG",
      stepKey: "StepNormalNG",
    },
    {
      text: "50 Ω-m surface (300 mm wet concrete)",
      touchKey: "TouchNormalConc",
      stepKey: "StepNormalConc",
    },
    {
      text: "5,000 Ω-m surface (100 mm crushed rock layer over natural)",
      touchKey: "TouchNormalCR",
      stepKey: "StepNormalCR",
    },
    {
      text: "15,000 Ω-m surface (50 mm asphalt layer over natural)",
      touchKey: "TouchNormalAsph",
      stepKey: "StepNormalAsph",
    },
  ];

  const specialRowData = [
    {
      text: "Loaded tolerable limit (any surface or between two conductors)",
      touchKey: "ReachSpecialMetal",
      stepKey: "StepSpecialMetal",
    },
    {
      text: `${soilRes} Ω-m surface (natural ground typical)`,
      touchKey: "TouchSpecialNG",
      stepKey: "StepSpecialNG",
    },
    {
      text: "50 Ω-m surface (300 mm wet concrete)",
      touchKey: "TouchSpecialConc",
      stepKey: "StepSpecialConc",
    },
    {
      text: "5,000 Ω-m surface (100 mm crushed rock layer over natural)",
      touchKey: "TouchSpecialCR",
      stepKey: "StepSpecialCR",
    },
    {
      text: "15,000 Ω-m surface (50 mm asphalt layer over natural)",
      touchKey: "TouchSpecialAsph",
      stepKey: "StepSpecialAsph",
    },
  ];

  const publicRowData = [
    {
      text: "Loaded tolerable limit (any surface or between two conductors)",
      touchKey: "ReachSpecialMetal",
      stepKey: "StepSpecialMetal",
    },
    {
      text: `${soilRes} Ω-m surface (natural ground typical)`,
      touchKey: "TouchPANG",
      stepKey: "StepPANG",
    },
    {
      text: "50 Ω-m surface (300 mm wet concrete)",
      touchKey: "TouchPAConc",
      stepKey: "StepPAConc",
    },
    {
      text: "3,000 Ω-m surface (100 mm crushed rock layer over natural)",
      touchKey: "TouchPACR",
      stepKey: "StepPACR",
    },
    {
      text: "15,000 Ω-m surface (50 mm asphalt layer over natural)",
      touchKey: "TouchPAAsph",
      stepKey: "StepPAAsph",
    },
  ];

  const restrictedRowData = [
    {
      text: "Loaded tolerable limit (any surface or between two conductors)",
      touchKey: "ReachSpecialMetal",
      stepKey: "StepSpecialMetal",
    },
    {
      text: `${soilRes} Ω-m surface (natural ground typical)`,
      touchKey: "TouchRANG",
      stepKey: "StepRANG",
    },
    {
      text: "50 Ω-m surface (300 mm wet concrete)",
      touchKey: "TouchRAConc",
      stepKey: "StepRAConc",
    },
    {
      text: "3,000 Ω-m surface (100 mm crushed rock layer over natural)",
      touchKey: "TouchRACR",
      stepKey: "StepRACR",
    },
    {
      text: "15,000 Ω-m surface (50 mm asphalt layer over natural)",
      touchKey: "TouchRAAsph",
      stepKey: "StepRAAsph",
    },
  ];

  // Format number with commas for 4+ digit numbers and 0 decimal places
  const formatNumber = (value: any): string => {
    if (value === undefined || value === null) return '';
    
    // Parse the value to ensure it's a number
    const num = parseFloat(value);
    if (isNaN(num)) return String(value);
    
    // Round to 0 decimal places
    const rounded = Math.round(num);
    
    // Only add commas for numbers with 4 or more digits
    if (Math.abs(rounded) >= 1000) {
      return rounded.toLocaleString();
    }
    // For numbers less than 1000, return as integer
    return rounded.toString();
  };

  return (
    <div id="touch-and-step-contents" className="content-section-container">
      <h2 className="section-title">Touch and Step Voltage Measurements</h2>
      <div className="t-and-s-content">
        <div className="ts-section">
          <h3 className="section-subtitle">{rawData["limitStandard"]} Touch and Step Voltage Limits</h3>
          {rawData["limitStandard"] === "IEEE80" ? (
            <>
              <h3 className="section-subtitle2">Tolerable Limits for Public Access:</h3>
              <table style={tableStyles.table}>
                <thead className="t-head-shaded">
                  <tr>
                    {headerData.map(
                      ({ width, text, align, paddingLeft }, index) => (
                        <th
                          key={index}
                          style={{
                            ...tableStyles.th,
                            width,
                            textAlign: align,
                            paddingLeft,
                          }}
                        >
                          <span dangerouslySetInnerHTML={{ __html: text }} />
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {publicRowData.map(({ text, touchKey, stepKey }, index) => (
                    <tr key={index}>
                      <td style={tableStyles.tdLeft}>{text}</td>
                      <td style={tableStyles.td}>
                        {formatNumber(rawData["limits"][touchKey])}
                      </td>
                      <td style={tableStyles.td}>
                        {formatNumber(rawData["limits"][stepKey])}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <h3 className="section-subtitle">Tolerable Limits for Restricted Access:</h3>
              <table style={tableStyles.table}>
                <thead className="t-head-shaded">
                  <tr>
                    {headerData.map(
                      ({ width, text, align, paddingLeft }, index) => (
                        <th
                          key={index}
                          style={{
                            ...tableStyles.th,
                            width,
                            textAlign: align,
                            paddingLeft,
                          }}
                        >
                          <span dangerouslySetInnerHTML={{ __html: text }} />
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {restrictedRowData.map(
                    ({ text, touchKey, stepKey }, index) => (
                      <tr key={index}>
                        <td style={tableStyles.tdLeft}>{text}</td>
                        <td style={tableStyles.td}>
                          {formatNumber(rawData["limits"][touchKey])}
                        </td>
                        <td style={tableStyles.td}>
                          {formatNumber(rawData["limits"][stepKey])}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </>
          ) : rawData["limitStandard"] === "IEC" ? (
            <>
              {siteType === "Special" && (
                <>
                  <span>
                    <b>Tolerable Limits (Bare Feet):</b>
                  </span>
                  <table style={tableStyles.table}>
                    <thead className="t-head-shaded">
                      <tr>
                        {headerData.map(
                          ({ width, text, align, paddingLeft }, index) => (
                            <th
                              key={index}
                              style={{
                                ...tableStyles.th,
                                width,
                                textAlign: align,
                                paddingLeft,
                              }}
                            >
                              <span
                                dangerouslySetInnerHTML={{ __html: text }}
                              />
                            </th>
                          )
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {specialRowData.map(
                        ({ text, touchKey, stepKey }, index) => (
                          <tr key={index}>
                            <td style={tableStyles.tdLeft}>{text}</td>
                            <td style={tableStyles.td}>
                              {formatNumber(rawData["limits"][touchKey])}
                            </td>
                            <td style={tableStyles.td}>
                              {formatNumber(rawData["limits"][stepKey])}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </>
              )}
              <p style={{ paddingTop: "1em", marginBottom: "0" }}>
                <b>Tolerable Limits (With Shoes):</b>
              </p>
              <table style={tableStyles.table}>
                <thead className="t-head-shaded">
                  <tr>
                    {headerData.map(
                      ({ width, text, align, paddingLeft }, index) => (
                        <th
                          key={index}
                          style={{
                            ...tableStyles.th,
                            width,
                            textAlign: align,
                            paddingLeft,
                          }}
                        >
                          <span dangerouslySetInnerHTML={{ __html: text }} />
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {normalRowData.map(({ text, touchKey, stepKey }, index) => (
                    <tr key={index}>
                      <td style={tableStyles.tdLeft}>{text}</td>
                      <td style={tableStyles.td}>
                        {formatNumber(rawData["limits"][touchKey])}
                      </td>
                      <td style={tableStyles.td}>
                        {formatNumber(rawData["limits"][stepKey])}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : (
            <p>No table available for this standard.</p>
          )}
        </div>
        <div className="ts-section">
          <h3 className="section-subtitle">Public Access Touch Voltages</h3>
          <TSSectionComponent
            rawData={rawData["PA"]}
            photoKey={photoKey}
            isMapCapturing={isMapCapturing}
            setMapCapturing={setMapCapturing}
          />
        </div>
        <div className="ts-section">
          <h3 className="section-subtitle">Restricted Access Touch Voltages</h3>
          <TSSectionComponent
            rawData={rawData["RA"]}
            photoKey={photoKey}
            isMapCapturing={isMapCapturing}
            setMapCapturing={setMapCapturing}
          />
        </div>
        <div className="ts-section">
          <h3 className="section-subtitle">Step Voltages</h3>
          <TSSectionComponent
            rawData={rawData["Step"]}
            photoKey={photoKey}
            isMapCapturing={isMapCapturing}
            setMapCapturing={setMapCapturing}
          />
        </div>
      </div>
    </div>
  );
}
export default TouchAndStepContent;