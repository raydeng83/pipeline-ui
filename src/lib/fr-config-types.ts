export type FrCommand = "fr-config-pull" | "fr-config-push";

/** Exact subcommand names accepted by fr-config-pull and fr-config-push */
export type ConfigScope =
  | "access-config"
  | "audit"
  | "authentication"
  | "authz-policies"
  | "connector-definitions"
  | "connector-mappings"
  | "cookie-domains"
  | "cors"
  | "csp"
  | "custom-nodes"
  | "email-provider"
  | "email-templates"
  | "endpoints"
  | "idm-authentication"
  | "iga-workflows"
  | "internal-roles"
  | "journeys"
  | "kba"
  | "locales"
  | "managed-objects"
  | "oauth2-agents"
  | "org-privileges"
  | "password-policy"
  | "raw"
  | "remote-servers"
  | "saml"
  | "schedules"
  | "scripts"
  | "secret-mappings"
  | "secrets"
  | "service-objects"
  | "services"
  | "telemetry"
  | "terms-and-conditions"
  | "themes"
  | "ui-config"
  | "variables";

export interface Environment {
  name: string;
  label: string;
  color: "blue" | "yellow" | "red" | "green";
  envFile: string;
}

export interface RunOptions {
  command: FrCommand;
  environment: string;
  /** Empty/omitted = run `all` subcommand. Multiple = run sequentially. */
  scopes?: ConfigScope[];
}

export type PromoteSubcommand =
  | "check-locked-status"
  | "lock-tenants"
  | "run-dryrun-promotion"
  | "run-promotion"
  | "check-promotion-status"
  | "check-promotion-reports"
  | "unlock-tenants"
  | "rollback";

export const PROMOTE_SUBCOMMANDS: {
  value: PromoteSubcommand;
  label: string;
  description: string;
  variant: "default" | "warning" | "danger" | "info";
}[] = [
  {
    value: "check-locked-status",
    label: "Check Locked Status",
    description: "Check whether the tenant is currently locked.",
    variant: "info",
  },
  {
    value: "lock-tenants",
    label: "Lock Tenants",
    description: "Lock the tenant before running a promotion.",
    variant: "warning",
  },
  {
    value: "run-dryrun-promotion",
    label: "Run Dry-Run Promotion",
    description: "Simulate a promotion without applying changes.",
    variant: "default",
  },
  {
    value: "check-promotion-reports",
    label: "Check Promotion Reports",
    description: "View the latest promotion report.",
    variant: "info",
  },
  {
    value: "run-promotion",
    label: "Run Promotion",
    description: "Apply the promotion — this modifies the target tenant.",
    variant: "danger",
  },
  {
    value: "check-promotion-status",
    label: "Check Promotion Status",
    description: "Poll the current promotion operation status.",
    variant: "info",
  },
  {
    value: "unlock-tenants",
    label: "Unlock Tenants",
    description: "Unlock the tenant after a promotion completes.",
    variant: "warning",
  },
  {
    value: "rollback",
    label: "Rollback",
    description: "Roll back the last promotion.",
    variant: "danger",
  },
];

export const CONFIG_SCOPES: { value: ConfigScope; label: string; group: string }[] = [
  // Journeys & Auth
  { value: "journeys", label: "Journeys", group: "Journeys & Auth" },
  { value: "scripts", label: "Scripts", group: "Journeys & Auth" },
  { value: "authentication", label: "Authentication", group: "Journeys & Auth" },
  { value: "custom-nodes", label: "Custom Nodes", group: "Journeys & Auth" },
  { value: "services", label: "Services", group: "Journeys & Auth" },
  { value: "kba", label: "KBA", group: "Journeys & Auth" },
  { value: "password-policy", label: "Password Policy", group: "Journeys & Auth" },
  // Identity & Access
  { value: "managed-objects", label: "Managed Objects", group: "Identity & Access" },
  { value: "authz-policies", label: "Authorization Policies", group: "Identity & Access" },
  { value: "access-config", label: "Access Config", group: "Identity & Access" },
  { value: "internal-roles", label: "Internal Roles", group: "Identity & Access" },
  { value: "org-privileges", label: "Org Privileges", group: "Identity & Access" },
  { value: "terms-and-conditions", label: "Terms & Conditions", group: "Identity & Access" },
  // Connectors & IDM
  { value: "connector-definitions", label: "Connector Definitions", group: "Connectors & IDM" },
  { value: "connector-mappings", label: "Connector Mappings", group: "Connectors & IDM" },
  { value: "remote-servers", label: "Remote Servers", group: "Connectors & IDM" },
  { value: "idm-authentication", label: "IDM Authentication", group: "Connectors & IDM" },
  { value: "service-objects", label: "Service Objects", group: "Connectors & IDM" },
  // Federation
  { value: "oauth2-agents", label: "OAuth2 Agents", group: "Federation" },
  { value: "saml", label: "SAML Entities", group: "Federation" },
  // Secrets & Variables
  { value: "secrets", label: "Secrets", group: "Secrets & Variables" },
  { value: "secret-mappings", label: "Secret Mappings", group: "Secrets & Variables" },
  { value: "variables", label: "Variables (ESVs)", group: "Secrets & Variables" },
  // UI & Comms
  { value: "themes", label: "Themes", group: "UI & Comms" },
  { value: "ui-config", label: "UI Config", group: "UI & Comms" },
  { value: "email-templates", label: "Email Templates", group: "UI & Comms" },
  { value: "email-provider", label: "Email Provider", group: "UI & Comms" },
  { value: "locales", label: "Locales", group: "UI & Comms" },
  // Infrastructure
  { value: "endpoints", label: "Custom Endpoints", group: "Infrastructure" },
  { value: "schedules", label: "Schedules", group: "Infrastructure" },
  { value: "cors", label: "CORS", group: "Infrastructure" },
  { value: "csp", label: "CSP", group: "Infrastructure" },
  { value: "cookie-domains", label: "Cookie Domains", group: "Infrastructure" },
  { value: "audit", label: "Audit", group: "Infrastructure" },
  { value: "telemetry", label: "Telemetry", group: "Infrastructure" },
  { value: "iga-workflows", label: "IGA Workflows", group: "Infrastructure" },
  { value: "raw", label: "Raw Config", group: "Infrastructure" },
];
