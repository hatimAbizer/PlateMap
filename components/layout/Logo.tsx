export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <LogoMark />
      <div className="flex flex-col leading-none">
        <span className="font-display text-[15px] font-semibold tracking-tight text-text">
          PlateMap
        </span>
        <span className="text-[9px] uppercase tracking-[0.22em] text-muted mt-0.5">
          Bengaluru
        </span>
      </div>
    </div>
  );
}

export function LogoMark({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="11" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="12" cy="8.5" r="1.6" fill="#795548" />
      <circle cx="8.5" cy="14" r="1.6" fill="#388E3C" />
      <circle cx="15.5" cy="14" r="1.6" fill="#7B1FA2" />
      <path
        d="M4 12 H20"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="0.6"
      />
    </svg>
  );
}
