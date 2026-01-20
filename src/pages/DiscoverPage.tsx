import { useEffect, useState } from "react";
import { App } from "../types/app.types";
import { CuratedSection } from "../types/curated.types";
import { DownloadState } from "../types/download.types";
import { AppCard } from "../components/AppCard/AppCard";

interface DiscoverPageProps {
  apps: App[];
  downloadStates: DownloadState;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onDownload: (appId: string, downloadUrl: string) => void;
  onCancelDownload: (appId: string) => void;
  onInstall: (appId: string, filePath: string) => void;
  onCardClick: (app: App) => void;
}

export function DiscoverPage({
  apps,
  downloadStates,
  searchTerm,
  onSearchChange,
  onDownload,
  onCancelDownload,
  onInstall,
  onCardClick,
}: DiscoverPageProps) {
  const [curatedSections, setCuratedSections] = useState<CuratedSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    fetchCuratedSections();
  }, []);

  const fetchCuratedSections = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        "https://raw.githubusercontent.com/Nandanrmenon/fossintosh-repo/main/curated.json",
      );
      if (!response.ok) throw new Error("Failed to fetch curated sections");

      const data = await response.json();
      console.log("Fetched curated data:", data);

      // Fetch full app data for each app ID in sections
      const sectionsWithApps = await Promise.all(
        (data.sections || []).map(async (section: any) => {
          console.log(
            `Processing section: ${section.title}, appIds:`,
            section.appIds,
          );
          const appsData = await Promise.all(
            (section.appIds || []).map(async (appId: string) => {
              try {
                const url = `https://raw.githubusercontent.com/Nandanrmenon/fossintosh-repo/main/apps/${appId}.json`;
                console.log(`Fetching app from: ${url}`);
                const appResponse = await fetch(url);
                if (!appResponse.ok) {
                  console.error(
                    `Failed to fetch ${appId}: ${appResponse.status}`,
                  );
                  return null;
                }
                const appData = await appResponse.json();
                console.log(`Loaded app ${appId}:`, appData);
                return appData;
              } catch (err) {
                console.error(`Failed to load app ${appId}:`, err);
                return null;
              }
            }),
          );

          const filteredApps = appsData.filter((app) => app !== null);
          console.log(
            `Section ${section.title} has ${filteredApps.length} apps`,
          );

          return {
            id: section.id,
            title: section.title,
            apps: filteredApps,
          };
        }),
      );

      console.log("Final sections with apps:", sectionsWithApps);
      setCuratedSections(sectionsWithApps);
      setError("");
    } catch (err) {
      console.error("Failed to load curated sections:", err);
      setError(
        "Failed to load curated sections. Please create curated.json in fossintosh-repo.",
      );
      setCuratedSections([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter apps by search term
  const filteredApps = searchTerm.trim()
    ? apps.filter(
        (app) =>
          app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.description.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : null;

  if (error) {
    return <div className="text-red-600 dark:text-red-400">{error}</div>;
  }

  // Show search results if searching
  if (filteredApps) {
    return (
      <>
        <div className="mb-4 flex flex-col gap-3 md:hidden">
          <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Search Results
          </label>
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
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search apps"
              className="w-full rounded-xl border border-zinc-200 bg-white px-10 py-2 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-900"
            />
          </div>
        </div>

        {filteredApps.length === 0 ? (
          <div className="no-apps">No apps match your search</div>
        ) : (
          <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
            {filteredApps.map((app) => {
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
                <AppCard
                  key={app.id}
                  app={app}
                  downloadState={state}
                  onDownload={onDownload}
                  onCancelDownload={onCancelDownload}
                  onInstall={onInstall}
                  onClick={() => onCardClick(app)}
                />
              );
            })}
          </div>
        )}
      </>
    );
  }

  // Show curated sections
  if (loading) {
    return (
      <div className="text-center text-zinc-500">
        Loading curated sections...
      </div>
    );
  }

  if (curatedSections.length === 0) {
    return (
      <div className="text-center text-zinc-500">
        <p>No curated sections available</p>
        <p className="text-xs mt-2">Check browser console for details</p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 md:hidden">
        <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Search
        </label>
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
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search all apps"
            className="w-full rounded-xl border border-zinc-200 bg-white px-10 py-2 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-900"
          />
        </div>
      </div>

      <div className="space-y-12 pb-8">
        {curatedSections.map((section) => (
          <div key={section.id}>
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-black dark:text-white mb-2">
                {section.title}
              </h2>
            </div>
            {section.apps.length === 0 ? (
              <div className="text-zinc-500 text-sm">
                <p>No apps in this section ({section.id})</p>
                <p className="text-xs mt-1">
                  Check browser console for fetch errors
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {section.apps.map((app) => {
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
                    <AppCard
                      key={app.id}
                      app={app}
                      downloadState={state}
                      onDownload={onDownload}
                      onCancelDownload={onCancelDownload}
                      onInstall={onInstall}
                      onClick={() => onCardClick(app)}
                    />
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
