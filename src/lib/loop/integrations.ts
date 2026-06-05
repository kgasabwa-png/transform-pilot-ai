// The integration layer. Receipts is only as good as the surfaces it
// reads. We make the connectors a first-class object so the claim
// ("we read every call, Slack, email") is auditable in-product.

export type IntegrationStatus = "connected" | "available" | "coming-soon";
export type IntegrationCategory =
  | "calls"
  | "messaging"
  | "email"
  | "crm"
  | "support"
  | "docs";

export type Integration = {
  id: string;
  name: string;
  category: IntegrationCategory;
  status: IntegrationStatus;
  reads: string; // what the agents pull
  lastSync?: string; // human time string when connected
};

export const INTEGRATIONS: Integration[] = [
  {
    id: "gong",
    name: "Gong",
    category: "calls",
    status: "connected",
    reads: "Call recordings, transcripts, deal-board signals",
    lastSync: "7:41a · 14 new calls",
  },
  {
    id: "chorus",
    name: "Chorus",
    category: "calls",
    status: "available",
    reads: "Call recordings, transcripts, scorecards",
  },
  {
    id: "zoom",
    name: "Zoom",
    category: "calls",
    status: "connected",
    reads: "Recording + transcript fallback when Gong is off",
    lastSync: "7:38a · 6 new recordings",
  },
  {
    id: "slack",
    name: "Slack",
    category: "messaging",
    status: "connected",
    reads: "Shared customer channels + internal #cs-* threads",
    lastSync: "7:42a · 312 new messages",
  },
  {
    id: "gmail",
    name: "Gmail",
    category: "email",
    status: "connected",
    reads: "CSM inbox + shared aliases (read-only)",
    lastSync: "7:39a · 84 new threads",
  },
  {
    id: "outlook",
    name: "Outlook",
    category: "email",
    status: "available",
    reads: "CSM inbox + shared aliases (read-only)",
  },
  {
    id: "salesforce",
    name: "Salesforce",
    category: "crm",
    status: "connected",
    reads: "Accounts, opportunities, contacts, renewal dates",
    lastSync: "7:30a",
  },
  {
    id: "hubspot",
    name: "HubSpot",
    category: "crm",
    status: "available",
    reads: "Companies, deals, contacts, lifecycle stage",
  },
  {
    id: "zendesk",
    name: "Zendesk",
    category: "support",
    status: "connected",
    reads: "Ticket history, sentiment, escalations",
    lastSync: "7:40a · 9 new tickets",
  },
  {
    id: "intercom",
    name: "Intercom",
    category: "support",
    status: "available",
    reads: "Conversations, NPS, fin AI deflections",
  },
  {
    id: "notion",
    name: "Notion",
    category: "docs",
    status: "coming-soon",
    reads: "Shared customer-success playbooks and account plans",
  },
  {
    id: "gdrive",
    name: "Google Drive",
    category: "docs",
    status: "coming-soon",
    reads: "Account plans, QBR decks, mutual action plans",
  },
];

export const CATEGORY_LABEL: Record<IntegrationCategory, string> = {
  calls: "Calls",
  messaging: "Messaging",
  email: "Email",
  crm: "CRM",
  support: "Support",
  docs: "Docs",
};

export const TRUST_POSTURE = [
  {
    title: "Security reviews",
    detail: "Available for design partners before production rollout",
  },
  {
    title: "Tenant separation",
    detail: "Each workspace is isolated; production controls reviewed before launch",
  },
  {
    title: "No shared training",
    detail: "Your conversations never train a model another tenant sees",
  },
  {
    title: "EU residency",
    detail: "Available on request · Frankfurt region",
  },
] as const;
