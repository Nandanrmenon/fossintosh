import React from "react";
import { Button } from "../components/Buttons";

export const ButtonDemo: React.FC = () => {
  const [isLoading, setIsLoading] = React.useState(false);

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Button Components
        </h1>
        <p className="text-gray-600 mb-8">Built with Tailwind CSS</p>

        {/* Variants */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Variants
          </h2>
          <div className="flex flex-wrap gap-4">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="danger">Danger</Button>
            <Button variant="success">Success</Button>
            <Button variant="ghost">Ghost</Button>
          </div>
        </section>

        {/* Sizes */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Sizes</h2>
          <div className="flex flex-wrap gap-4 items-center">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
          </div>
        </section>

        {/* Loading State */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Loading State
          </h2>
          <div className="flex flex-wrap gap-4">
            <Button
              isLoading={isLoading}
              onClick={() => {
                setIsLoading(true);
                setTimeout(() => setIsLoading(false), 2000);
              }}
            >
              {isLoading ? "Processing..." : "Click to Load"}
            </Button>
          </div>
        </section>

        {/* Disabled State */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Disabled State
          </h2>
          <div className="flex flex-wrap gap-4">
            <Button disabled>Disabled Primary</Button>
            <Button variant="secondary" disabled>
              Disabled Secondary
            </Button>
            <Button variant="danger" disabled>
              Disabled Danger
            </Button>
          </div>
        </section>

        {/* With Icons */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            With Icons
          </h2>
          <div className="flex flex-wrap gap-4">
            <Button variant="primary" icon="📥">
              Download
            </Button>
            <Button variant="success" icon="✓">
              Confirm
            </Button>
            <Button variant="danger" icon="✕">
              Cancel
            </Button>
            <Button variant="ghost" icon="⚙️">
              Settings
            </Button>
          </div>
        </section>

        {/* Full Width */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Full Width
          </h2>
          <div className="space-y-3">
            <Button className="w-full">Full Width Primary</Button>
            <Button variant="secondary" className="w-full">
              Full Width Secondary
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
};
