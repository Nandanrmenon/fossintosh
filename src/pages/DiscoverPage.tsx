import { useEffect, useState } from "react";
import { App } from "../types/app.types";
import { CuratedSection } from "../types/curated.types";
import { DownloadState } from "../types/download.types";
import { AppCard } from "../components/AppCard/AppCard";

const CURATED_BASE_URL =
  "https://raw.githubusercontent.com/Nandanrmenon/fossintosh-repo/main";
const CURATED_CONFIG_URL = `${CURATED_BASE_URL}/curated.json`;

interface DiscoverPageProps {
  downloadStates: DownloadState;
  onDownload: (appId: string, downloadUrl: string) => void;
  onCancelDownload: (appId: string) => void;
  onInstall: (appId: string, filePath: string) => void;
  onCardClick: (app: App) => void;
}

export function DiscoverPage({
  downloadStates,
  onDownload,
  onCancelDownload,
  onInstall,
  onCardClick,
}: DiscoverPageProps) {
  const [curatedSections, setCuratedSections] = useState<CuratedSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let isMounted = true;

    const fetchCuratedSections = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(CURATED_CONFIG_URL);
        if (!response.ok) {
          throw new Error("Failed to fetch curated sections");
        }

        const payload = (await response.json()) as {
          sections?: Array<{
            id?: string;
            title?: string;
            description?: string;
            apps?: string[];
            appIds?: string[];
          }>;
        };

        const sections = payload.sections ?? [];
        const resolvedSections: CuratedSection[] = [];

        for (const section of sections) {
          const appIds = section.appIds ?? section.apps ?? [];

          const appPromises = appIds.map(async (appId) => {
            try {
              const appResponse = await fetch(
                `${CURATED_BASE_URL}/apps/${appId}.json`,
              );

              if (!appResponse.ok) return null;
              return (await appResponse.json()) as App;
            } catch (err) {
              console.error(`Failed to fetch app ${appId}`);
              console.error(err);
              return null;
            }
          });

          const apps = (await Promise.all(appPromises)).filter(
            (app): app is App => Boolean(app),
          );

          resolvedSections.push({
            id: section.id ?? section.title ?? "untitled-section",
            title: section.title ?? section.id ?? "Untitled",
            description: section.description,
            apps,
          });
        }

        if (!isMounted) return;
        setCuratedSections(resolvedSections);
      } catch (err) {
        if (!isMounted) return;
        const message =
          err instanceof Error
            ? err.message
            : "Failed to load curated sections";
        setError(message);
      } finally {
        if (!isMounted) return;
        setLoading(false);
      }
    };

    fetchCuratedSections();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="text-center text-zinc-500">
        Loading curated sections...
      </div>
    );
  }

  if (error) {
    return <div className="text-red-600 dark:text-red-400">{error}</div>;
  }

  if (curatedSections.length === 0) {
    return (
      <div className="text-center text-zinc-500">
        <p>No curated sections available</p>
        <p className="mt-2 text-xs">Check browser console for details</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-8">
      {curatedSections.map((section) => (
        <div key={section.id}>
          <div className="mb-4">
            <h2 className="mb-2 text-2xl font-bold text-black dark:text-white">
              {section.title}
            </h2>
            {section.description ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {section.description}
              </p>
            ) : null}
          </div>
          {section.apps.length === 0 ? (
            <div className="text-sm text-zinc-500">
              <p>No apps in this section ({section.id})</p>
              <p className="mt-1 text-xs">
                Check browser console for fetch errors
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
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
  );
}
