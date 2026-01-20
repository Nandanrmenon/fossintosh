import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { App } from "./types/app.types";
import "./App.css";

function App() {
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    loadApps();
  }, []);

  const loadApps = async () => {
    try {
      setLoading(true);
      const fetchedApps = await invoke<App[]>("fetch_apps");
      setApps(fetchedApps);
      setError("");
    } catch (error) {
      console.error("Failed to fetch apps:", error);
      setError(error instanceof Error ? error.message : "Failed to load apps");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (appId: string, downloadUrl: string) => {
    try {
      const result = await invoke<string>("download_app", {
        appId,
        downloadUrl,
      });
      console.log(result);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  if (loading)
    return (
      <div className="app">
        <div className="loading">Loading apps...</div>
      </div>
    );

  return (
    <div className="app">
      <header className="app-header">
        <h1>FOSS App Store</h1>
        <p className="subtitle">Free and Open Source Software for macOS</p>
      </header>

      {error && <div className="error-message">{error}</div>}

      {apps.length === 0 ? (
        <div className="no-apps">No apps found</div>
      ) : (
        <div className="app-grid">
          {apps.map((app) => (
            <div key={app.id} className="app-card">
              <div className="app-icon">
                <img
                  src={app.icon}
                  alt={app.name}
                  onError={(e) => {
                    e.currentTarget.src =
                      "https://via.placeholder.com/64?text=" +
                      app.name.substring(0, 2);
                  }}
                />
              </div>
              <div className="app-content">
                <h3>{app.name}</h3>
                <p className="app-description">{app.description}</p>
                <div className="app-meta">
                  <span className="app-category">{app.category}</span>
                  <span className="app-version">v{app.version}</span>
                </div>
                <p className="app-author">by {app.author}</p>
                <button
                  className="btn-download"
                  onClick={() => handleDownload(app.id, app.downloadUrl)}
                >
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
