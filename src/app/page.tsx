import Link from "next/link";
import { getEnvironments } from "@/lib/fr-config";
import { EnvironmentBadge } from "@/components/EnvironmentBadge";

export default function DashboardPage() {
  const environments = getEnvironments();

  const actions = [
    {
      href: "/pull",
      title: "Pull Config",
      description: "Export configuration from a tenant to local repository.",
      color: "blue",
    },
    {
      href: "/push",
      title: "Push Config",
      description: "Deploy local configuration to a tenant environment.",
      color: "green",
    },
    {
      href: "/promote",
      title: "Promote Config",
      description: "Migrate configuration from one tenant to another.",
      color: "purple",
    },
    {
      href: "/environments",
      title: "Manage Environments",
      description: "Add, edit, or remove tenant environment configurations.",
      color: "slate",
    },
  ];

  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 border-blue-200 hover:border-blue-400",
    green: "bg-green-50 border-green-200 hover:border-green-400",
    purple: "bg-purple-50 border-purple-200 hover:border-purple-400",
    slate: "bg-slate-50 border-slate-200 hover:border-slate-400",
  };

  const titleColorMap: Record<string, string> = {
    blue: "text-blue-800",
    green: "text-green-800",
    purple: "text-purple-800",
    slate: "text-slate-800",
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">
          Manage your Ping Advanced Identity Cloud configuration pipeline.
        </p>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">
          Environments
        </h2>
        {environments.length === 0 ? (
          <p className="text-sm text-slate-400">
            No environments configured.{" "}
            <Link href="/environments" className="text-sky-600 hover:underline">
              Add one
            </Link>
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {environments.map((env) => (
              <EnvironmentBadge key={env.name} env={env} />
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">
          Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {actions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={`block p-5 rounded-lg border-2 transition-colors ${colorMap[action.color]}`}
            >
              <h3 className={`font-semibold text-sm ${titleColorMap[action.color]}`}>
                {action.title}
              </h3>
              <p className="text-xs text-slate-500 mt-1">{action.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
