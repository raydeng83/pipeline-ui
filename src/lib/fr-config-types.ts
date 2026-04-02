export type FrCommand = "fr-config-pull" | "fr-config-push" | "fr-config-promote";

export type ConfigScope =
  | "journeys"
  | "scripts"
  | "connectors"
  | "connector-mappings"
  | "managed-objects"
  | "policies"
  | "oauth2-agents"
  | "saml"
  | "email-templates"
  | "secrets"
  | "variables"
  | "password-policies"
  | "custom-nodes"
  | "themes"
  | "services"
  | "terms-and-conditions";

export interface Environment {
  name: string;
  label: string;
  color: "blue" | "yellow" | "red" | "green";
  envFile: string;
}

export interface RunOptions {
  command: FrCommand;
  environment: string;
  scopes?: ConfigScope[];
  targetEnvironment?: string;
}

export const CONFIG_SCOPES: { value: ConfigScope; label: string }[] = [
  { value: "journeys", label: "Journeys" },
  { value: "scripts", label: "Scripts" },
  { value: "connectors", label: "Connectors" },
  { value: "connector-mappings", label: "Connector Mappings" },
  { value: "managed-objects", label: "Managed Objects" },
  { value: "policies", label: "Policies" },
  { value: "oauth2-agents", label: "OAuth2 Agents" },
  { value: "saml", label: "SAML" },
  { value: "email-templates", label: "Email Templates" },
  { value: "secrets", label: "Secrets" },
  { value: "variables", label: "Variables (ESVs)" },
  { value: "password-policies", label: "Password Policies" },
  { value: "custom-nodes", label: "Custom Nodes" },
  { value: "themes", label: "Themes" },
  { value: "services", label: "Services" },
  { value: "terms-and-conditions", label: "Terms & Conditions" },
];
