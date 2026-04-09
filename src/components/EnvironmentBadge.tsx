import { Environment } from "@/lib/fr-config-types";
import { cn } from "@/lib/utils";

const colorMap: Record<NonNullable<Environment["color"]>, string> = {
  blue:   "bg-blue-100 text-blue-800 border-blue-300",
  green:  "bg-green-100 text-green-800 border-green-300",
  yellow: "bg-yellow-100 text-yellow-800 border-yellow-300",
  red:    "bg-red-100 text-red-800 border-red-300",
  purple: "bg-purple-100 text-purple-800 border-purple-300",
  orange: "bg-orange-100 text-orange-800 border-orange-300",
  teal:   "bg-teal-100 text-teal-800 border-teal-300",
  pink:   "bg-pink-100 text-pink-800 border-pink-300",
  indigo: "bg-indigo-100 text-indigo-800 border-indigo-300",
  gray:   "bg-gray-100 text-gray-800 border-gray-300",
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
