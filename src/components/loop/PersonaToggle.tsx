import type { PersonaId } from "@/lib/loop/personas";

const PERSONAS: { id: PersonaId; label: string; sub: string }[] = [
  { id: "csm", label: "CSM", sub: "Your book" },
  { id: "manager", label: "Manager", sub: "Your team" },
  { id: "leader", label: "Leader", sub: "The number" },
];

export function PersonaToggle({
  value,
  onChange,
}: {
  value: PersonaId;
  onChange: (id: PersonaId) => void;
}) {
  return (
    <div className="inline-flex items-center rounded-lg border border-border bg-surface p-1 gap-1">
      {PERSONAS.map((p) => {
        const active = p.id === value;
        return (
          <button
            key={p.id}
            onClick={() => onChange(p.id)}
            className={`flex flex-col items-start px-3 py-1.5 rounded-md transition-colors ${
              active
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className="text-[11px] font-mono uppercase tracking-[0.14em] font-semibold leading-none">
              {p.label}
            </span>
            <span
              className={`text-[10px] mt-0.5 leading-none ${
                active ? "opacity-70" : "opacity-60"
              }`}
            >
              {p.sub}
            </span>
          </button>
        );
      })}
    </div>
  );
}
