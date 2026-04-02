import { Environment } from "@/lib/fr-config-types";
import { cn } from "@/lib/utils";

const colorMap = {
  blue: "bg-blue-100 text-blue-800 border-blue-300",
  green: "bg-green-100 text-green-800 border-green-300",
  yellow: "bg-yellow-100 text-yellow-800 border-yellow-300",
  red: "bg-red-100 text-red-800 border-red-300",
};

export function EnvironmentBadge({ env }: { env: Environment }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        colorMap[env.color]
      )}
    >
      {env.label}
    </span>
  );
}
