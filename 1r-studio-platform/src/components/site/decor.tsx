/** Soft brand-toned decorative backgrounds — no stock photography, tied to the navy/cream identity. */

export function HeroBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -top-32 -end-32 h-[28rem] w-[28rem] rounded-full bg-accent-300/25 blur-3xl" />
      <div className="absolute top-1/3 -start-40 h-[24rem] w-[24rem] rounded-full bg-navy-300/20 blur-3xl" />
      <svg className="absolute inset-0 h-full w-full opacity-[0.06]" xmlns="http://www.w3.org/2000/svg">
        <pattern id="grain" width="22" height="22" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.4" fill="currentColor" className="text-navy-900" />
        </pattern>
        <rect width="100%" height="100%" fill="url(#grain)" />
      </svg>
    </div>
  );
}

/** Line-art "hands cradling" motif, evoking the studio's own icon — original artwork, not traced. */
export function HandsMotif({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 100" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path
        d="M10 30c8-14 24-18 30-4 6-14 22-10 30 4M10 30c-4 20 8 34 30 40 22-6 34-20 30-40"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M52 52c2 6 6 6 8 0M60 52c2 6 6 6 8 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function CameraGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="14" width="40" height="28" rx="4" stroke="currentColor" strokeWidth="2" />
      <path d="M16 14l3-6h10l3 6" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="24" cy="28" r="9" stroke="currentColor" strokeWidth="2" />
      <circle cx="24" cy="28" r="3.5" fill="currentColor" />
      <circle cx="37" cy="20" r="1.6" fill="currentColor" />
    </svg>
  );
}
