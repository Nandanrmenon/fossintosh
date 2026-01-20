import { App } from "../../types/app.types";

interface AppHeaderProps {
  app: App;
}

export function AppHeader({ app }: AppHeaderProps) {
  return (
    <div className="flex gap-4 items-center justify-center">
      <img
        src={app.icon}
        alt={app.name}
        className="w-12 h-12 object-contain"
        draggable={false}
        onError={(e) => {
          e.currentTarget.src =
            "https://via.placeholder.com/64?text=" + app.name.substring(0, 2);
        }}
      />
      <div>
        <p className="text-lg font-semibold text-ellipsis line-clamp-1">
          {app.name}
        </p>
        <p className="text-sm text-zinc-500 text-ellipsis line-clamp-1">
          {app.author}
        </p>
      </div>
    </div>
  );
}
