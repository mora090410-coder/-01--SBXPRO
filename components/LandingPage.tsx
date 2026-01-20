import React from 'react';

interface LandingPageProps {
  onCreate: () => void;
  onLogin: () => void;
  onJoin: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onCreate, onLogin, onJoin }) => {
  return (
    <div className="min-h-screen w-full bg-[#060607] text-white font-sans selection:bg-[#FFC72C]/30 flex flex-col overflow-x-hidden">
      {/* Background - Exact match from reference */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute -top-40 left-1/2 h-[520px] w-[720px] -translate-x-1/2 rounded-full bg-[#8F1D2C]/25 blur-[120px]" />
        <div className="absolute -bottom-48 left-1/3 h-[560px] w-[760px] -translate-x-1/2 rounded-full bg-[#FFC72C]/14 blur-[140px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.08),transparent_55%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(6,6,7,0.3),rgba(6,6,7,1))]" />
        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.12) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
      </div>

      {/* Nav */}
      <header className="relative z-50 w-full max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#9D2235] to-[#7f1d2b] flex items-center justify-center shadow-lg shadow-[#9D2235]/20 border border-white/5 ring-1 ring-white/10">
            <span className="text-[10px] font-bold text-white tracking-tighter">SBX</span>
          </div>
          <span className="text-lg font-bold tracking-tight text-white">SBX<span className="text-[#FFC72C]">PRO</span></span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onLogin}
            className="rounded-full px-4 py-2 text-sm text-white/80 ring-1 ring-white/10 hover:bg-white/5 hover:text-white transition-all"
          >
            Log In
          </button>
          <button
            onClick={onCreate}
            className="hidden md:block rounded-full bg-[#FFC72C] px-4 py-2 text-sm font-semibold text-black hover:brightness-95 transition-all"
          >
            Create League
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-24 pt-12 md:pt-20">
        <div className="grid gap-12 md:grid-cols-2 md:items-center">

          {/* Hero Content */}
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-xs text-white/70 ring-1 ring-white/10 backdrop-blur-sm mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-[#FFC72C]" />
              <span className="uppercase tracking-widest font-bold text-[10px]">Professional Edition</span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight leading-[0.95] text-white">
              The Super Bowl <br />
              <span className="bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
                Squares Revolution.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/70">
              Intelligent software for professional game boards. <br className="hidden md:block" />
              <span className="text-white">Real-time NFL data.</span> Built for Commissioners. Loved by Players.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                onClick={onCreate}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#8F1D2C] px-8 py-4 text-sm font-semibold text-white shadow-[0_0_0_1px_rgba(255,255,255,0.08)] hover:brightness-110 hover:shadow-lg hover:shadow-[#8F1D2C]/20 transition-all active:scale-95"
              >
                Create Your League
                <span className="text-white/80">→</span>
              </button>

              <div className="flex items-center gap-3">
                <button
                  onClick={onJoin}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white/5 px-6 py-4 text-sm font-semibold text-white ring-1 ring-white/10 hover:bg-white/10 transition-all active:scale-95"
                >
                  Join League
                </button>
                <div className="h-4 w-px bg-white/10 hidden sm:block"></div>
                <button
                  onClick={onLogin}
                  className="hidden sm:inline-flex text-sm text-white/60 hover:text-white transition-colors"
                >
                  Manager Login
                </button>
              </div>
            </div>

            <div className="mt-8 flex items-center gap-4 text-xs text-white/55">
              <div className="inline-flex items-center gap-2">
                <span className="h-5 w-5 rounded-full bg-white/10 ring-1 ring-white/10 flex items-center justify-center">
                  <svg className="w-3 h-3 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </span>
                Automated Scoring
              </div>
              <div className="h-3 w-px bg-white/10" />
              <div className="inline-flex items-center gap-2">
                <span className="h-5 w-5 rounded-full bg-white/10 ring-1 ring-white/10 flex items-center justify-center">
                  <svg className="w-3 h-3 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </span>
                Live Mobile Hub
              </div>
            </div>
          </div>

          {/* Hero Mock Visual - Abstract Board Representation */}
          <div className="relative mt-8 md:mt-0 animate-in fade-in slide-in-from-right-8 duration-1000 delay-200">
            <div className="rounded-3xl bg-white/5 p-4 ring-1 ring-white/10 backdrop-blur-md shadow-2xl shadow-black/50">
              {/* Fake Live Header */}
              <div className="flex items-center justify-between rounded-2xl bg-black/40 px-4 py-3 ring-1 ring-white/10 mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#8F1D2C] to-[#5a121c] ring-1 ring-white/10 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-white">SB</span>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">Super Bowl LIX</div>
                    <div className="text-xs text-white/55">Feb 9, 2025 • Live</div>
                  </div>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-2 py-1 text-[10px] text-white/70 ring-1 ring-white/10">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E] animate-pulse" />
                  Live Updates
                </div>
              </div>

              {/* Grid Simulation */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className={`aspect-square rounded-lg ring-1 ring-white/10 ${i === 5 || i === 9 ? 'bg-[#FFC72C]/20 ring-[#FFC72C]/40' : 'bg-white/5'} flex items-center justify-center`}>
                    {i === 5 && <span className="text-[10px] font-bold text-[#FFC72C]">WIN</span>}
                  </div>
                ))}
              </div>

              {/* Stat Row */}
              <div className="rounded-2xl bg-gradient-to-r from-[#8F1D2C]/20 via-white/5 to-[#FFC72C]/10 p-4 ring-1 ring-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-white">Smart Payouts</div>
                    <div className="mt-1 text-[11px] text-white/60">
                      Q1, Half, Q3, Final & Reverse
                    </div>
                  </div>
                  <div className="h-6 w-6 rounded-full bg-[#FFC72C] flex items-center justify-center text-[10px] font-bold text-black shadow-lg shadow-[#FFC72C]/20">
                    $
                  </div>
                </div>
              </div>
            </div>
            {/* Glow behind */}
            <div className="pointer-events-none absolute -inset-10 -z-10 rounded-[50px] bg-gradient-to-tr from-[#8F1D2C]/20 to-[#FFC72C]/20 blur-3xl opacity-50" />
          </div>
        </div>

        {/* Feature Grid - Styled like "How it works" */}
        <section className="mt-24">
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                title: "AI Game Logic",
                desc: "Automated scoring and live win probability based on real-time NFL play-by-play data.",
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                )
              },
              {
                title: "Live Mobile Hub",
                desc: "Dynamic scoreboards and 'What If' scenarios that update instantly on any connected device.",
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                )
              },
              {
                title: "Commissioner Command",
                desc: "Effortless setup, custom branding, and automated payout tracking structure.",
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                )
              }
            ].map((f, i) => (
              <div
                key={i}
                className="rounded-3xl bg-white/5 p-8 ring-1 ring-white/10 backdrop-blur transition-all duration-300 hover:bg-white/[0.08]"
              >
                <div className="w-10 h-10 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center mb-5 text-white shadow-sm">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {f.icon}
                  </svg>
                </div>
                <div className="text-lg font-semibold text-white tracking-tight">{f.title}</div>
                <div className="mt-3 text-sm leading-relaxed text-white/70 font-medium">{f.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Testimonial */}
        <section className="mt-24 border-t border-white/10 pt-16 text-center">
          <blockquote className="text-2xl md:text-3xl font-medium text-white/90 tracking-tight max-w-3xl mx-auto leading-relaxed">
            "SBXPRO turned my squares pool into a professional-grade experience. It’s a game-changer."
          </blockquote>
          <cite className="inline-block mt-8 rounded-full bg-white/5 px-4 py-2 text-xs font-bold text-[#FFC72C] uppercase tracking-widest not-italic ring-1 ring-white/10">
            John D. • Commissioner
          </cite>
        </section>

        {/* Footer */}
        <footer className="mt-24 border-t border-white/10 pt-8 text-xs text-white/55">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white tracking-tight">SBXPRO</span>
              <span>© {new Date().getFullYear()}</span>
            </div>
            <div className="flex gap-6">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Support</a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default LandingPage;