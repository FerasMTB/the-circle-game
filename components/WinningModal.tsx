"use client";

interface WinningModalProps {
  isOpen: boolean;
  prize: string;
  onClose: () => void;
}

export default function WinningModal({ isOpen, prize, onClose }: WinningModalProps) {
  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm transition-opacity duration-500 ${isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
    >
      <div
        className={`relative w-full max-w-md transform overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900 to-black p-1 text-center shadow-2xl ring-1 ring-[#D4AF37] transition-all duration-700 ${isOpen ? "scale-100 translate-y-0" : "scale-95 translate-y-8"
          }`}
      >
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay" />
        <div className="relative rounded-xl bg-black/90 px-6 py-10">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#D4AF37]/20 ring-1 ring-[#D4AF37]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="#D4AF37"
              className="h-10 w-10"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0"
              />
            </svg>
          </div>

          <h2 className="mb-2 text-3xl font-bold text-[#D4AF37]">CONGRATULATIONS!</h2>
          <p className="mb-6 text-slate-300">You&apos;ve drawn a perfect circle and won:</p>

          <div className="mb-8 rounded-lg border border-[#D4AF37]/30 bg-[#D4AF37]/10 py-4">
            <p className="text-2xl font-bold text-white">{prize}</p>
          </div>

          <button
            onClick={onClose}
            className="w-full rounded-full bg-[#D4AF37] px-6 py-3 text-sm font-bold text-black transition hover:bg-[#b5952f] active:scale-95"
          >
            CLAIM PRIZE
          </button>
        </div>
        <div className="pointer-events-none absolute inset-0 rounded-2xl border border-[#D4AF37]/30" />
      </div>
    </div>
  );
}
