import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import type { App } from "./types/app.types";
import "./App.css";
import { AppGrid } from "./components/AppGrid";

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
        <h1 className="text-xl font-bold">Fossintosh</h1>
      </header>

      {error && <div className="error-message">{error}</div>}

      {apps.length === 0 ? (
        <div className="no-apps">No apps found</div>
      ) : (
        <AppGrid
          apps={apps}
          downloadStates={downloadStates}
          onDownload={handleDownload}
          onCancelDownload={handleCancelDownload}
          onInstall={handleInstall}
        />
      )}
    </div>
  );
}

export default App;
