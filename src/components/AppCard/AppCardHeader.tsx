import { App } from "../../types/app.types";

interface AppHeaderProps {
  app: App;
}

export function AppHeader({ app }: AppHeaderProps) {
  return (
    <div className="mb-4 flex gap-4 items-center">
      <img
        src={app.icon}
        alt={app.name}
        className="w-16 h-16 object-contain"
        draggable={false}
        onError={(e) => {
          e.currentTarget.src =
            "https://via.placeholder.com/64?text=" + app.name.substring(0, 2);
        }}
      />
      <div>
        <p className="text-2xl font-semibold">{app.name}</p>
        <p className="text-sm">{app.author}</p>
      </div>
    </div>
  );
}
