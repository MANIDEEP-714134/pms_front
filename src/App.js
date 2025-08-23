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
import "./App.css";

function App() {
  const [deviceId, setDeviceId] = useState("vishnu");
  const [liveData, setLiveData] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);

  // ===== Fetch history directly from backend =====
  const fetchHistoryData = useCallback(async () => {
    if (!deviceId) return;

    try {
      const res = await axios.get(
        `https://www.gfiotsolutions.com/api/history/${deviceId}`
      );

      if (res.data?.status === "ok" && res.data.data?.length) {
        setHistoryData(res.data.data);
      } else {
        setHistoryData([]);
      }
    } catch (err) {
      console.error("Error fetching history data", err);
    }
  }, [deviceId]);

  // ===== Fetch live data =====
  const fetchLiveData = useCallback(async () => {
    if (!deviceId) return;
    try {
      const res = await axios.get(
        `https://www.gfiotsolutions.com/api/data/${deviceId}`
      );

      if (res.data && res.data.status === "ok") {
        setLiveData(res.data);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error("Error fetching live data", err);
    }
  }, [deviceId]);

  // ===== Load history once on device change =====
  // ===== Load + Poll history =====
useEffect(() => {
  fetchHistoryData(); // initial load
  const interval = setInterval(fetchHistoryData, 60000); // every 60 sec
  return () => clearInterval(interval);
}, [fetchHistoryData]);


  // ===== Poll live data every 5s =====
  useEffect(() => {
    fetchLiveData(); // initial
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

      {/* Logo */}
      <div className="device-selector">
        <div className="logo-container">
          <img src={require("./logo.png")} alt="Company Logo" className="logo" />
        </div>
      </div>

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
                {Math.round(liveData.data.line1 / 2.75)}
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

        {/* History Chart */}
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
                <Line
                  type="monotone"
                  dataKey="line1"
                  stroke="#007bff"
                  name="Current (A)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
