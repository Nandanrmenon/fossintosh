import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import type { App } from "./types/app.types";
import "./App.css";
import { Button } from "./components/Buttons";

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
        <h1 className="text-xl font-bold">FOSSintosh</h1>
      </header>

      {error && <div className="error-message">{error}</div>}

      {apps.length === 0 ? (
        <div className="no-apps">No apps found</div>
      ) : (
        <div className="grid grid-flow-col grid-rows-2 gap-4 p-6">
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
              <div
                key={app.id}
                className="p-8 border border-zinc-200 rounded-lg inset-shadow-sm bg-white "
              >
                <div className="mb-4 flex gap-4 items-center">
                  <img
                    src={app.icon}
                    alt={app.name}
                    className="w-16 h-16 object-contain"
                    draggable={false}
                    onError={(e) => {
                      e.currentTarget.src =
                        "https://via.placeholder.com/64?text=" +
                        app.name.substring(0, 2);
                    }}
                  />
                  <div>
                    <p className="text-2xl font-semibold">{app.name}</p>
                    <p className="text-sm">{app.author}</p>
                  </div>
                </div>
                <div className="app-content">
                  <p className="text-md text-zinc-500">{app.description}</p>
                  <div className="flex flex-wrap gap-2 my-2 items-center">
                    <span className="text-sm bg-purple-300 px-3 py-1 rounded-full text-purple-800 font-medium">
                      {app.category}
                    </span>
                    <span className="text-sm bg-blue-300 px-3 py-1 rounded-full text-blue-800 font-medium">
                      v{app.version}
                    </span>
                  </div>

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
                  <div className="gap-2 mt-4 flex flex-wrap">
                    {state.isDownloading ? (
                      <div className="flex gap-2 w-full">
                        <Button
                          variant="secondary"
                          className="w-full"
                          onClick={() =>
                            handleInstall(
                              app.id,
                              state.filePath || `~/Downloads/${app.id}.dmg`,
                            )
                          }
                          disabled
                        >
                          {`Downloading... ${Math.round(state.progress)}%`}
                        </Button>
                        <Button
                          variant="danger"
                          className="w-full"
                          onClick={() => handleCancelDownload(app.id)}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : state.isDownloaded && !state.isInstalling ? (
                      <div className="flex gap-2 w-full">
                        <Button
                          variant="success"
                          onClick={() =>
                            handleInstall(
                              app.id,
                              state.filePath || `~/Downloads/${app.id}.dmg`,
                            )
                          }
                          disabled={state.isInstalling}
                        >
                          Install
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() =>
                            handleDownload(app.id, app.downloadUrl)
                          }
                          disabled={state.isInstalling}
                        >
                          Re-download
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="primary"
                        className="w-full"
                        onClick={() => handleDownload(app.id, app.downloadUrl)}
                        disabled={state.isInstalling}
                      >
                        {state.isInstalling ? "Installing..." : "Download"}
                      </Button>
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
