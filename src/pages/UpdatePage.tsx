import { App } from "../types/app.types";
import { DownloadState } from "../types/download.types";
import { AppGrid } from "../components/AppGrid";

interface UpdatePageProps {
  apps: App[];
  downloadStates: DownloadState;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onDownload: (appId: string, downloadUrl: string) => void;
  onCancelDownload: (appId: string) => void;
  onInstall: (appId: string, filePath: string) => void;
  onCardClick: (app: App) => void;
}

export function UpdatePage({
  apps,
  downloadStates,
  searchTerm,
  onSearchChange,
  onDownload,
  onCancelDownload,
  onInstall,
  onCardClick,
}: UpdatePageProps) {
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
            placeholder="Search updates"
            className="w-full rounded-xl border border-zinc-200 bg-white px-10 py-2 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-900"
          />
        </div>
      </div>

      {apps.length === 0 ? (
        <div className="no-apps">
          {searchTerm ? "No updates match your search" : "No updates available"}
        </div>
      ) : (
        <AppGrid
          apps={apps}
          downloadStates={downloadStates}
          onDownload={onDownload}
          onCancelDownload={onCancelDownload}
          onInstall={onInstall}
          onCardClick={onCardClick}
        />
      )}
    </>
  );
}
