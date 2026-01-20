interface CategoryItem {
  name: string;
  count: number;
}

interface CategoriesPageProps {
  categories: CategoryItem[];
  onSelect: (category: string) => void;
}

export function CategoriesPage({ categories, onSelect }: CategoriesPageProps) {
  if (categories.length === 0) {
    return <div className="no-apps">No categories available</div>;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {categories.map((category) => (
        <button
          key={category.name}
          onClick={() => onSelect(category.name)}
          className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-white px-4 py-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.99] dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div>
            <p className="text-lg font-semibold text-zinc-900 dark:text-white">
              {category.name}
            </p>
            <p className="text-sm text-zinc-500">{category.count} apps</p>
          </div>
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300">
            C
          </span>
        </button>
      ))}
    </div>
  );
}
