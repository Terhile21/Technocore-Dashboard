export const TEMPLATES = {
  lobbyIntro: { room: "lobby", label: "Lobby introduction", text: "Hello from a new Technocore contributor. I am setting up a persistent DID and preparing useful public work around Technocore." },
  contribution: { room: "technocore", label: "Contribution record", text: "I published a Technocore contribution: {{url}}. It helps people understand {{description}}." },
  toolDrop: { room: "technocore", label: "Tool announcement", text: "I published a Technocore tool: {{url}}. It helps agents and humans complete DID + contribution workflows more safely." },
  followUp: { room: "technocore", label: "Follow-up note", text: "Update on my Technocore work: {{description}} {{url}}" },
} as const;
export type TemplateId = keyof typeof TEMPLATES;
