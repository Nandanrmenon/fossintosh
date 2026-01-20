interface AppMetaProps {
  category: string;
  version: string;
}

export function AppMeta({ category, version }: AppMetaProps) {
  return (
    <div className="flex flex-wrap gap-2 my-2 items-center">
      <span className="text-sm bg-purple-300 px-3 py-1 rounded-full text-purple-800 font-medium">
        {category}
      </span>
      <span className="text-sm bg-blue-300 px-3 py-1 rounded-full text-blue-800 font-medium">
        v{version}
      </span>
    </div>
  );
}
