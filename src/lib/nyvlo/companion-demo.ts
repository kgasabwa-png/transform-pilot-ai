import type { CompanionMeeting } from "./companion.types";

export function seedMeetings(): CompanionMeeting[] {
  return [
    {
      id: "demo-acme-renewal",
      account: "Acme Health",
      title: "Q3 Renewal Review",
      ended: "Ended 11:42 AM",
      status: "ready",
      urgency: "high",
      urgencyLabel: "Renewal",
      attendees: [
        { i: "MR", n: "Maria Reyes", r: "VP Operations" },
        { i: "AK", n: "Ari Kim", r: "CS Lead" },
        { i: "YO", n: "You", r: "Account owner" },
      ],
      accountMeta: [
        { label: "Plan", value: "Pro · 40 seats" },
        { label: "Renewal", value: "Aug 15" },
        { label: "Health", value: "At risk" },
      ],
      summary:
        "Maria wants a clearer rollout plan before renewing. The main risk is the delayed analytics launch, but Acme is open to expanding if the team sees a concrete enablement path this week.",
      actions: [
        {
          id: "demo-acme-email",
          meetingId: "demo-acme-renewal",
          type: "email",
          status: "suggested",
          to: "maria@acme.health",
          subject: "Rollout plan and analytics timeline",
          subLine: "Customer follow-up · ready to cosign",
          body: "Hi Maria,\n\nThanks for the direct feedback today. I will send over the rollout plan with analytics milestones, training dates, and the owner for each step so your team can review it before the renewal checkpoint.\n\nI will also include the two enablement options we discussed so you can decide which path fits the operations team best.\n\nBest,\nAlex",
          evidence: [
            {
              speaker: "Maria Reyes",
              time: "11:18",
              quote:
                "If you can send the rollout plan this week, I can take it to the renewal committee.",
            },
          ],
          toneVariants: {
            warm: "Hi Maria,\n\nThanks for the direct feedback today. I will send over the rollout plan with analytics milestones, training dates, and the owner for each step so your team can review it before the renewal checkpoint.\n\nI will also include the two enablement options we discussed so you can decide which path fits the operations team best.\n\nBest,\nAlex",
            concise:
              "Hi Maria,\n\nI will send the rollout plan this week with analytics milestones, training dates, owners, and the two enablement options we discussed.\n\nBest,\nAlex",
            formal:
              "Hi Maria,\n\nThank you for the discussion today. I will share the rollout plan this week, including analytics milestones, training dates, owners, and the enablement options for your operations team.\n\nBest,\nAlex",
          },
          steps: [
            { who: "You", text: "Send rollout plan before Friday" },
            { who: "Maria", text: "Review with renewal committee" },
          ],
          warnings: ["Confirm the analytics milestone dates before sending."],
        },
        {
          id: "demo-acme-reminder",
          meetingId: "demo-acme-renewal",
          type: "reminder",
          status: "suggested",
          subLine: "Friday · 9:00 AM",
          body: "Follow up with Maria if the renewal rollout plan has not been acknowledged.",
          evidence: [
            {
              speaker: "Maria Reyes",
              time: "11:22",
              quote: "I need it before Friday morning if we are going to keep this on track.",
            },
          ],
          steps: [],
          warnings: [],
        },
        {
          id: "demo-acme-note",
          meetingId: "demo-acme-renewal",
          type: "crm_note",
          status: "suggested",
          subLine: "Copy-ready · paste into CRM",
          body: "Acme renewal risk centers on analytics delay and enablement clarity. Maria will take the rollout plan to the renewal committee if received this week. Expansion is possible if operations sees a concrete path.",
          evidence: [
            {
              speaker: "Maria Reyes",
              time: "11:27",
              quote: "Expansion is still on the table, but the team needs a concrete path.",
            },
          ],
          steps: [],
          warnings: [],
        },
      ],
    },
    {
      id: "demo-northwind-onboarding",
      account: "Northwind Labs",
      title: "Onboarding checkpoint",
      ended: "Ended 9:16 AM",
      status: "ready",
      urgency: "normal",
      urgencyLabel: "",
      attendees: [
        { i: "DL", n: "Devon Lee", r: "Implementation lead" },
        { i: "YO", n: "You", r: "CSM" },
      ],
      accountMeta: [
        { label: "Stage", value: "Implementation" },
        { label: "Go-live", value: "Jul 8" },
      ],
      summary:
        "Northwind is on track for go-live, but Devon needs the admin checklist and a shorter training deck before inviting the broader team.",
      actions: [
        {
          id: "demo-northwind-email",
          meetingId: "demo-northwind-onboarding",
          type: "email",
          status: "suggested",
          to: "devon@northwindlabs.com",
          subject: "Admin checklist and training deck",
          subLine: "Customer follow-up · ready to cosign",
          body: "Hi Devon,\n\nI will send the admin checklist and a shorter training deck today so you can review both before inviting the broader team.\n\nI will keep the training deck focused on setup, permissions, and the first-week operating rhythm.\n\nBest,\nAlex",
          evidence: [
            {
              speaker: "Devon Lee",
              time: "09:08",
              quote: "Can you send the admin checklist and a shorter training deck today?",
            },
          ],
          toneVariants: null,
          steps: [{ who: "You", text: "Send admin checklist and shorter training deck" }],
          warnings: [],
        },
      ],
    },
  ];
}
