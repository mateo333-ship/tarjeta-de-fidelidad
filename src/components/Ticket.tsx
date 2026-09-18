type TicketProps = {
  name: string;
  stamps: number;
  stampsRequired: number;
  reward: string;
  code: string;
  businessName?: string;
  qr?: React.ReactNode;
};

export default function Ticket({
  name,
  stamps,
  stampsRequired,
  reward,
  code,
  businessName = "Tu Negocio",
  qr,
}: TicketProps) {
  const current = Math.min(Math.max(stamps, 0), stampsRequired);
  const complete = current >= stampsRequired;
  const pct = stampsRequired > 0 ? (current / stampsRequired) * 100 : 0;

  return (
    <div
      className={`relative w-full max-w-[340px] rounded-[22px] p-5 pb-[18px] text-card-fg shadow-[0_1px_2px_rgba(32,36,29,.06),0_10px_24px_-12px_rgba(32,36,29,.28)] ${complete ? "ticket-complete" : ""}`}
      style={{
        background: "linear-gradient(165deg, var(--card-bg), var(--card-bg-2))",
      }}
    >
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="grid h-[38px] w-[38px] flex-none place-items-center rounded-[10px] border border-card-fg/20 bg-card-fg/10 font-display text-sm font-bold">
            {businessName.slice(0, 2).toUpperCase()}
          </span>
          <div className="flex min-w-0 flex-col gap-0.5">
            <strong className="truncate text-[16px] font-semibold">{name}</strong>
            <span className="text-[11.5px] text-card-muted">Tarjeta de fidelización</span>
          </div>
        </div>
        <span className="whitespace-nowrap pt-1 font-data text-[11px] text-card-muted">
          N.º {code}
        </span>
      </div>

      <div className="mt-[18px] grid grid-cols-5 gap-[9px]">
        {Array.from({ length: stampsRequired }).map((_, i) => {
          const filled = i < current;
          return (
            <div
              key={i}
              className={`stamp-cell aspect-square rounded-full border-[1.5px] border-dashed border-card-fg/25 flex items-center justify-center ${filled ? "is-filled border-solid border-stamp/55" : ""}`}
              style={
                filled
                  ? {
                      background:
                        "radial-gradient(circle at 34% 30%, rgba(179,68,51,.16), transparent 60%)",
                    }
                  : undefined
              }
            >
              {filled && (
                <span
                  className="h-[66%] w-[66%] rounded-full border-[3px] border-stamp shadow-[0_0_0_1px_rgba(179,68,51,.25)_inset]"
                  style={{
                    background:
                      "radial-gradient(circle at 38% 32%, rgba(255,255,255,.1), transparent 55%)",
                    transform: `rotate(${((i * 37) % 20) - 10}deg)`,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="ticket-notch left" aria-hidden />
      <div className="ticket-notch right" aria-hidden />
      <div className="ticket-perf" aria-hidden />

      <div className="mt-[22px] flex flex-col gap-2.5">
        <div className="flex flex-col gap-1.5">
          <span className="font-data text-[12px] tabular-nums text-card-muted">
            {current} de {stampsRequired} sellos
          </span>
          <div className="h-1.5 overflow-hidden rounded-full bg-card-fg/15">
            <div
              className="h-full rounded-full transition-[width] duration-300"
              style={{
                width: `${pct}%`,
                background: "linear-gradient(90deg, var(--stamp), var(--gold))",
              }}
            />
          </div>
        </div>
        <p className="text-[13.5px] text-card-muted">
          Al completarla: <strong className="font-semibold text-card-fg">{reward}</strong>
        </p>

        {qr && (
          <div className="mt-1 flex justify-center rounded-[14px] bg-card-fg p-3">
            {qr}
          </div>
        )}
      </div>
    </div>
  );
}
