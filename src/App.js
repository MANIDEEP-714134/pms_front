import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import "./App.css"; // import our CSS file

function App() {
  const [deviceId, setDeviceId] = useState("vishnu");
  const [liveData, setLiveData] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);

  // ===== Load cached history on startup =====
  useEffect(() => {
    const cached = localStorage.getItem("historyData");
    if (cached) {
      try {
        setHistoryData(JSON.parse(cached));
      } catch (e) {
        console.error("Invalid cache format");
      }
    }
  }, []);

  // ===== Save history to localStorage =====
  const saveHistory = (data) => {
    localStorage.setItem("historyData", JSON.stringify(data));
  };

  // ===== Fetch live data every 5s =====
  const fetchLiveData = useCallback(async () => {
    if (!deviceId) return;
    try {
      const res = await axios.get(
        `https://www.gfiotsolutions.com/api/data/${deviceId}`
      );

      if (res.data && res.data.status === "ok") {
        const newReading = {
          ...res.data.data,
          timestamp: { _seconds: Math.floor(Date.now() / 1000) }
        };

        // Update live data
        setLiveData(res.data);
        setLastUpdated(new Date());

        // Update history with new point
        setHistoryData((prev) => {
          const updated = [...prev, newReading];

          // keep only last 2 days
          const cutoff = Math.floor(Date.now() / 1000) - 2 * 24 * 60 * 60;
          const filtered = updated.filter(
            (item) => item.timestamp._seconds >= cutoff
          );

          saveHistory(filtered); // save to localStorage
          return filtered;
        });
      }
    } catch (err) {
      console.error("Error fetching live data", err);
    }
  }, [deviceId]);

  // ===== Effect for live data polling =====
  useEffect(() => {
    fetchLiveData(); // initial fetch
    const interval = setInterval(fetchLiveData, 5000);
    return () => clearInterval(interval);
  }, [fetchLiveData]);

  return (
    <div className="app-container">
      <h1 className="dashboard-title">Pond Monitoring System</h1>

      {/* Device Selector */}
      <div className="device-selector">
        <input
          value={deviceId}
          onChange={(e) => setDeviceId(e.target.value)}
          placeholder="Enter Device ID"
          className="device-input"
        />
      </div>

      {/* Logo below the input */}
      <div className="device-selector">
        <div className="logo-container">
          <img src={require("./logo.png")} alt="Company Logo" className="logo" />
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid-container">
        {/* Live Data Card */}
        <div className="card">
          <h2 className="card-title">Live Data</h2>
          {liveData && liveData.status === "ok" ? (
            <>
              <p className="live-value">
                <strong>Current Reading:</strong> {liveData.data.line1} A
              </p>
              <p className="live-value">
                <strong>Aerators Working:</strong>{" "}
                {Math.round(liveData.data.line1 / 3.15)}
              </p>
              {lastUpdated && (
                <p className="timestamp">
                  <em>Last updated: {lastUpdated.toLocaleString()}</em>
                </p>
              )}
            </>
          ) : (
            <p className="no-data">No live data available</p>
          )}
        </div>

        {/* History Chart Card */}
        <div className="card">
          <h2 className="card-title">History (Last 2 Days)</h2>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="timestamp._seconds"
                  tickFormatter={(sec) =>
                    new Date(sec * 1000).toLocaleTimeString()
                  }
                />
                <YAxis />
                <Tooltip
                  labelFormatter={(sec) =>
                    new Date(sec * 1000).toLocaleString()
                  }
                />
                <Legend />
                <Line type="monotone" dataKey="line1" stroke="#007bff" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
