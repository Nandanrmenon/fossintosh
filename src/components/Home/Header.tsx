import React from "react";

interface HeaderProps {
  title?: string;
}

export const Header: React.FC<HeaderProps> = ({ title = "App" }) => {
  return (
    <header className="bg-white text-black shadow-sm sticky top-0 z-50 dark:bg-zinc-900 dark:text-white">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <h1 className="text-2xl font-medium">{title}</h1>
      </div>
    </header>
  );
};

export default Header;
