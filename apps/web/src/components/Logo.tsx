export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <a className="logo" href="/" aria-label="HandoffKit home">
      <span className="logo-mark" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
          <path
            d="M4.5 7h8.5M4.5 12h6.5M4.5 17h8.5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M16 9.5 18.5 12 16 14.5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      {!compact && <span>HandoffKit</span>}
    </a>
  );
}
