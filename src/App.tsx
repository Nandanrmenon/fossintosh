import { JSX, useEffect, useMemo, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import type { App } from "./types/app.types";
import { DownloadState } from "./types/download.types";
import "./App.css";
import { AppDetail } from "./pages/AppDetail";
import { CategoriesPage } from "./pages/CategoriesPage";
import { DiscoverPage } from "./pages/DiscoverPage";
import { SearchResultsPage } from "./pages/SearchResultsPage";
import { UpdatePage } from "./pages/UpdatePage";
import { Download, Library, Telescope } from "lucide-react";

type MenuKey = "discover" | "categories" | "update";

function App() {
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [downloadStates, setDownloadStates] = useState<DownloadState>({});
  const [selectedApp, setSelectedApp] = useState<App | null>(null);
  const [activeMenu, setActiveMenu] = useState<MenuKey>("discover");
  const [searchTerm, setSearchTerm] = useState("");
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    loadApps();
    setupEventListeners();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "f") {
        event.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "r") {
        event.preventDefault();
        window.location.reload();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleCardClick = (app: App) => {
    setSelectedApp(app);
  };

  const handleBack = () => {
    setSelectedApp(null);
  };

  const handleMenuSelect = (menu: MenuKey) => {
    setActiveMenu(menu);
    setSelectedApp(null);
  };

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

      // Show feedback toast and reset download state
      setDownloadStates((prev) => ({
        ...prev,
        [appId]: {
          ...(prev[appId] || {}),
          isDownloading: false,
          progress: 0,
          status: "Download canceled",
          error: "Download canceled",
        },
      }));
    } catch (error) {
      console.error("Failed to cancel download:", error);
      const errorMsg = error instanceof Error ? error.message : "Cancel failed";
      setDownloadStates((prev) => ({
        ...prev,
        [appId]: {
          ...(prev[appId] || {}),
          isDownloading: false,
          status: errorMsg,
          error: errorMsg,
        },
      }));
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

  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [] as App[];
    const query = searchTerm.toLowerCase();
    return apps.filter(
      (app) =>
        app.name.toLowerCase().includes(query) ||
        app.description.toLowerCase().includes(query) ||
        app.category.toLowerCase().includes(query),
    );
  }, [apps, searchTerm]);

  const updateApps = useMemo(() => {
    const updatesOnly = apps.filter((app) => Boolean(app.hasUpdate));

    if (!searchTerm.trim()) return updatesOnly;

    const query = searchTerm.toLowerCase();
    return updatesOnly.filter(
      (app) =>
        app.name.toLowerCase().includes(query) ||
        app.description.toLowerCase().includes(query) ||
        app.category.toLowerCase().includes(query),
    );
  }, [apps, searchTerm]);

  const categories = useMemo(() => {
    const counts: Record<string, number> = {};

    apps.forEach((app) => {
      counts[app.category] = (counts[app.category] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [apps]);

  const updateCount = useMemo(
    () => apps.filter((app) => Boolean(app.hasUpdate)).length,
    [apps],
  );

  const handleCategorySelect = (category: string) => {
    setSearchTerm(category);
    setActiveMenu("discover");
    setSelectedApp(null);
  };

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-50 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
        <div className="loading">Loading apps...</div>
      </div>
    );

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50 text-black dark:bg-zinc-900 dark:text-white">
      <aside className="hidden w-72 flex-col bg-white dark:bg-zinc-950/20 md:flex">
        <div className=" px-6 py-5 dark:border-zinc-700">
          <p className="text-lg font-semibold uppercase tracking-[0.12em] text-zinc-100">
            Fossintosh
          </p>
          <p className="text-sm text-zinc-500">Find and manage apps</p>
        </div>

        <div className="px-4 py-4">
          <div className="relative">
            <svg
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z"
              />
            </svg>
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search apps"
              className="w-full rounded-full border border-zinc-200 bg-white px-10 py-2 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-900"
            />
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-2 py-2">
          {(
            [
              { key: "discover", label: "Discover", icon: <Telescope /> },
              { key: "categories", label: "Categories", icon: <Library /> },
              { key: "update", label: "Update", icon: <Download /> },
            ] as Array<{ key: MenuKey; label: string; icon: JSX.Element }>
          ).map((item) => {
            const isActive = activeMenu === item.key;

            return (
              <button
                key={item.key}
                onClick={() => handleMenuSelect(item.key)}
                className={`flex w-full items-center gap-2 rounded-xl px-1.5 py-1.5 text-sm font-semibold transition-all ${
                  isActive
                    ? "bg-blue-900 text-white shadow-blue-100 "
                    : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                }`}
              >
                <span
                  aria-hidden
                  className={`flex h-10 w-10 items-center justify-center rounded-lg text-base ${
                    isActive
                      ? " text-white"
                      : "bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300"
                  }`}
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
                {item.key === "update" && (
                  <span
                    className={`ml-auto rounded-full px-2 py-0.5 text-xs font-semibold ${
                      updateCount > 0
                        ? isActive
                          ? "bg-white/20 text-white"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-100"
                        : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-300"
                    }`}
                  >
                    {updateCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="relative flex-1 overflow-hidden">
        <div className="flex h-full flex-col">
          <div className="relative flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto">
              <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
                {error && <div className="error-message">{error}</div>}

                {searchTerm.trim() ? (
                  <SearchResultsPage
                    apps={searchResults}
                    downloadStates={downloadStates}
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    onDownload={handleDownload}
                    onCancelDownload={handleCancelDownload}
                    onInstall={handleInstall}
                    onCardClick={handleCardClick}
                  />
                ) : activeMenu === "categories" ? (
                  <CategoriesPage
                    categories={categories}
                    onSelect={handleCategorySelect}
                  />
                ) : activeMenu === "update" ? (
                  <UpdatePage
                    apps={updateApps}
                    downloadStates={downloadStates}
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    onDownload={handleDownload}
                    onCancelDownload={handleCancelDownload}
                    onInstall={handleInstall}
                    onCardClick={handleCardClick}
                  />
                ) : (
                  <DiscoverPage
                    downloadStates={downloadStates}
                    onDownload={handleDownload}
                    onCancelDownload={handleCancelDownload}
                    onInstall={handleInstall}
                    onCardClick={handleCardClick}
                  />
                )}
              </div>
            </div>

            {selectedApp && (
              <div className="fixed inset-0 bottom-0 z-20 flex flex-col max-h-[90vh] rounded-t-3xl bg-white shadow-2xl ring-1 ring-zinc-200 transition duration-300 ease-out dark:bg-zinc-900 dark:ring-zinc-800 md:absolute md:max-h-none md:rounded-none">
                {(() => {
                  const state = downloadStates[selectedApp.id] || {
                    isDownloading: false,
                    isInstalling: false,
                    progress: 0,
                    installProgress: 0,
                    status: "",
                    installStatus: "",
                    isDownloaded: false,
                  };

                  return (
                    <AppDetail
                      app={selectedApp}
                      downloadState={state}
                      onDownload={handleDownload}
                      onCancelDownload={handleCancelDownload}
                      onInstall={handleInstall}
                      onBack={handleBack}
                    />
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
