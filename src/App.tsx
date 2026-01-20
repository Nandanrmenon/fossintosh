import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import type { App } from "./types/app.types";
import "./App.css";

interface DownloadState {
  [appId: string]: {
    isDownloading: boolean;
    progress: number;
    status: string;
    error?: string;
  };
}

function App() {
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [downloadStates, setDownloadStates] = useState<DownloadState>({});

  useEffect(() => {
    loadApps();
    setupEventListeners();
  }, []);

  const setupEventListeners = async () => {
    try {
      // Listen to download progress events
      await listen("download_progress", (event) => {
        const data = event.payload as {
          app_id: string;
          progress: number;
          downloaded: number;
          total: number;
          status: string;
        };

        setDownloadStates((prev) => ({
          ...prev,
          [data.app_id]: {
            isDownloading: true,
            progress: data.progress,
            status: data.status,
          },
        }));
      });

      // Listen to download completion events
      await listen("download_complete", (event) => {
        const data = event.payload as {
          app_id: string;
          file_path: string;
          success: boolean;
          error?: string;
        };

        setDownloadStates((prev) => ({
          ...prev,
          [data.app_id]: {
            isDownloading: false,
            progress: data.success ? 100 : 0,
            status: data.success
              ? `Downloaded to Downloads/${data.app_id}.dmg`
              : "Download failed",
            error: data.error,
          },
        }));
      });
    } catch (err) {
      console.error("Failed to setup event listeners:", err);
    }
  };

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
      setDownloadStates((prev) => ({
        ...prev,
        [appId]: {
          isDownloading: true,
          progress: 0,
          status: "Initializing...",
        },
      }));

      await invoke<string>("download_app", {
        appId,
        downloadUrl,
      });
    } catch (error) {
      console.error("Download failed:", error);
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      setDownloadStates((prev) => ({
        ...prev,
        [appId]: {
          isDownloading: false,
          progress: 0,
          status: "Download failed",
          error: errorMsg,
        },
      }));
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
          {apps.map((app) => {
            const downloadState = downloadStates[app.id] || {
              isDownloading: false,
              progress: 0,
              status: "",
            };

            return (
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

                  {downloadState.isDownloading && (
                    <div className="download-progress">
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: `${downloadState.progress}%` }}
                        ></div>
                      </div>
                      <p className="progress-text">{downloadState.status}</p>
                    </div>
                  )}

                  {downloadState.error && (
                    <div className="download-error">
                      <span className="error-icon">⚠️</span>
                      <p>{downloadState.error}</p>
                    </div>
                  )}

                  {!downloadState.isDownloading &&
                    !downloadState.error &&
                    downloadState.progress === 100 && (
                      <div className="download-success">
                        <span className="success-icon">✓</span>
                        <p>{downloadState.status}</p>
                      </div>
                    )}

                  <button
                    className="btn-download"
                    onClick={() => handleDownload(app.id, app.downloadUrl)}
                    disabled={downloadState.isDownloading}
                  >
                    {downloadState.isDownloading
                      ? `Downloading... ${Math.round(downloadState.progress)}%`
                      : downloadState.progress === 100
                        ? "Downloaded"
                        : "Download"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default App;
