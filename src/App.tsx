import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import type { App } from "./types/app.types";
import "./App.css";

interface DownloadState {
  [appId: string]: {
    isDownloading: boolean;
    isInstalling: boolean;
    progress: number;
    installProgress: number;
    status: string;
    installStatus: string;
    error?: string;
    filePath?: string;
    isDownloaded: boolean;
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
            ...(prev[data.app_id] || {}),
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
            ...(prev[data.app_id] || {}),
            isDownloading: false,
            progress: data.success ? 100 : 0,
            status: data.success
              ? `Downloaded to Downloads/${data.app_id}.dmg`
              : "Download failed",
            error: data.error,
            filePath: data.file_path,
            isDownloaded: data.success,
          },
        }));
      });

      // Listen to install progress events
      await listen("install_progress", (event) => {
        const data = event.payload as {
          app_id: string;
          progress: number;
          status: string;
        };

        setDownloadStates((prev) => ({
          ...prev,
          [data.app_id]: {
            ...(prev[data.app_id] || {}),
            isInstalling: true,
            installProgress: data.progress,
            installStatus: data.status,
          },
        }));
      });

      // Listen to install completion events
      await listen("install_complete", (event) => {
        const data = event.payload as {
          app_id: string;
          success: boolean;
          error?: string;
        };

        setDownloadStates((prev) => ({
          ...prev,
          [data.app_id]: {
            ...(prev[data.app_id] || {}),
            isInstalling: false,
            installProgress: data.success ? 100 : 0,
            installStatus: data.success
              ? "Installation complete!"
              : "Installation failed",
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
          ...(prev[appId] || {}),
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
          ...(prev[appId] || {}),
          isDownloading: false,
          progress: 0,
          status: "Download failed",
          error: errorMsg,
        },
      }));
    }
  };

  const handleCancelDownload = async (appId: string) => {
    try {
      await invoke<string>("cancel_download", { appId });
    } catch (error) {
      console.error("Failed to cancel download:", error);
    }
  };

  const handleInstall = async (appId: string, filePath: string) => {
    try {
      console.log(`Installing app: ${appId} from path: ${filePath}`);
      setDownloadStates((prev) => ({
        ...prev,
        [appId]: {
          ...(prev[appId] || {}),
          isInstalling: true,
          installProgress: 0,
          installStatus: "Starting installation...",
          error: undefined,
        },
      }));

      const result = await invoke<string>("install_app", {
        appId,
        filePath,
      });
      console.log("Install result:", result);
    } catch (error) {
      console.error("Installation failed:", error);
      const errorMsg =
        error instanceof Error ? error.message : "Unknown error occurred";
      setDownloadStates((prev) => ({
        ...prev,
        [appId]: {
          ...(prev[appId] || {}),
          isInstalling: false,
          installProgress: 0,
          installStatus: "Installation failed",
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
            const state = downloadStates[app.id] || {
              isDownloading: false,
              isInstalling: false,
              progress: 0,
              installProgress: 0,
              status: "",
              installStatus: "",
              isDownloaded: false,
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

                  {/* Download Progress Section */}
                  {state.isDownloading && (
                    <div className="download-progress">
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: `${state.progress}%` }}
                        ></div>
                      </div>
                      <p className="progress-text">{state.status}</p>
                    </div>
                  )}

                  {/* Install Progress Section */}
                  {state.isInstalling && (
                    <div className="install-progress">
                      <div className="progress-bar">
                        <div
                          className="progress-fill install-fill"
                          style={{ width: `${state.installProgress}%` }}
                        ></div>
                      </div>
                      <p className="progress-text">{state.installStatus}</p>
                    </div>
                  )}

                  {/* Error Message */}
                  {state.error && (
                    <div className="download-error">
                      <span className="error-icon">⚠️</span>
                      <p>{state.error}</p>
                    </div>
                  )}

                  {/* Success Message */}
                  {!state.isDownloading &&
                    !state.error &&
                    state.progress === 100 &&
                    !state.isInstalling && (
                      <div className="download-success">
                        <span className="success-icon">✓</span>
                        <p>{state.status}</p>
                      </div>
                    )}

                  {/* Install Success Message */}
                  {!state.isInstalling &&
                    state.installProgress === 100 &&
                    !state.error && (
                      <div className="install-success">
                        <span className="success-icon">✓</span>
                        <p>{state.installStatus}</p>
                      </div>
                    )}

                  {/* Action Buttons */}
                  <div className="button-group">
                    {state.isDownloading ? (
                      <>
                        <button className="btn-download" disabled>
                          {`Downloading... ${Math.round(state.progress)}%`}
                        </button>
                        <button
                          className="btn-cancel"
                          onClick={() => handleCancelDownload(app.id)}
                        >
                          Cancel
                        </button>
                      </>
                    ) : state.isDownloaded && !state.isInstalling ? (
                      <>
                        <button
                          className="btn-install"
                          onClick={() =>
                            handleInstall(
                              app.id,
                              state.filePath || `~/Downloads/${app.id}.dmg`,
                            )
                          }
                        >
                          Install
                        </button>
                        <button
                          className="btn-redownload"
                          onClick={() =>
                            handleDownload(app.id, app.downloadUrl)
                          }
                        >
                          Re-download
                        </button>
                      </>
                    ) : (
                      <button
                        className="btn-download"
                        onClick={() => handleDownload(app.id, app.downloadUrl)}
                        disabled={state.isInstalling}
                      >
                        {state.isInstalling ? "Installing..." : "Download"}
                      </button>
                    )}
                  </div>
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
