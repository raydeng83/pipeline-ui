import { loadSettings, resolveTargetDir, targetHasGit } from "@/lib/git-settings";
import { SettingsForm } from "./SettingsForm";

export default function SettingsPage() {
  const settings = loadSettings();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 mt-1">
          Configure the git repository used to version environment configs.
        </p>
      </div>
      <SettingsForm
        initialSettings={settings}
        targetDirAbsolute={resolveTargetDir(settings)}
        initialHasGit={targetHasGit(settings)}
      />
    </div>
  );
}
