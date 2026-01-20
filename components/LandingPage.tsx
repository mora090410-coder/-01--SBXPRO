import React from 'react';

interface LandingPageProps {
  onCreate: () => void;
  onLogin: () => void;
  onJoin: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onCreate, onLogin, onJoin }) => {
  return (
    <div className="min-h-screen w-full bg-[#060607] text-white font-sans selection:bg-[#FFC72C]/30 flex flex-col overflow-x-hidden">

      {/* Background Ambience - Simplified & Subtle */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-1/4 w-[600px] h-[600px] bg-[#9D2235]/10 rounded-full blur-[120px] mix-blend-screen" />
        <div className="absolute bottom-[-10%] right-1/4 w-[500px] h-[500px] bg-[#FFC72C]/5 rounded-full blur-[100px] mix-blend-screen" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#060607]/80 to-[#060607]" />
      </div>

      {/* Navbar */}
      <nav className="relative z-50 w-full max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#9D2235] to-[#7f1d2b] flex items-center justify-center shadow-lg shadow-[#9D2235]/20 border border-white/5">
            <span className="text-[10px] font-bold text-white tracking-tighter">SBX</span>
          </div>
          <span className="text-lg font-bold tracking-tight text-white">SBX<span className="text-[#FFC72C]">PRO</span></span>
        </div>

        <button
          onClick={onLogin}
          className="text-xs font-semibold text-gray-400 hover:text-white transition-colors"
        >
          Log In
        </button>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center pt-12 pb-24 text-center px-6">
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm shadow-sm mb-4">
            <span className="flex h-1.5 w-1.5 rounded-full bg-[#FFC72C]"></span>
            <span className="text-[10px] uppercase tracking-widest font-bold text-gray-300">Professional Edition</span>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[0.95] text-white drop-shadow-sm">
            The Super Bowl <br /> Squares Revolution.
          </h1>

          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto font-medium leading-relaxed">
            Intelligent software for professional game boards. <br className="hidden md:block" />
            <span className="text-white">Real-time NFL data.</span> Built for Commissioners. Loved by Players.
          </p>

          <div className="flex flex-col items-center gap-5 pt-4">
            <button
              onClick={onCreate}
              className="group relative px-8 py-4 bg-white text-black hover:bg-gray-100 rounded-full transition-all duration-300 transform active:scale-[0.98] shadow-xl hover:shadow-2xl hover:shadow-white/10"
            >
              <div className="flex items-center gap-3 font-bold text-sm md:text-base tracking-wide uppercase">
                <span>Create Your League</span>
                <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </div>
            </button>

            <div className="flex flex-col md:flex-row items-center gap-6 text-sm">
              <button
                onClick={onJoin}
                className="text-gray-500 hover:text-white transition-colors font-medium flex items-center gap-2 group"
              >
                <span>Have a code?</span>
                <span className="text-[#FFC72C] group-hover:underline decoration-[#FFC72C]/40 underline-offset-4">Join League</span>
              </button>

              <span className="hidden md:block text-gray-700">•</span>

              <button
                onClick={onLogin}
                className="text-gray-500 hover:text-white transition-colors font-medium flex items-center gap-2 group"
              >
                <span>Commissioner?</span>
                <span className="text-white group-hover:underline decoration-white/30 underline-offset-4">Manager Login</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Feature Grid - Minimalist Cards */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-24 border-t border-white/5">
        <div className="grid md:grid-cols-3 gap-6">
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
            <div key={i} className="group p-8 rounded-3xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] hover:border-white/10 transition-all duration-500">
              <div className="w-10 h-10 rounded-2xl bg-[#060607] border border-white/10 flex items-center justify-center mb-6 text-white group-hover:scale-110 transition-transform duration-500 shadow-lg">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {f.icon}
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white mb-3 tracking-tight">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed font-medium group-hover:text-gray-400 transition-colors">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonial */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 pb-24 text-center">
        <div className="relative p-10 md:p-14">
          {/* Subtle quote decoration */}
          <div className="absolute top-0 left-0 text-white/5 font-serif text-[120px] leading-none -translate-x-4 -translate-y-8 select-none">“</div>

          <blockquote className="relative text-2xl md:text-3xl font-medium text-white/90 leading-relaxed tracking-tight">
            SbxPro turned my squares pool into a professional-grade experience. It’s a game-changer.
          </blockquote>
          <cite className="block mt-8 text-xs font-bold text-[#FFC72C] uppercase tracking-widest not-italic">
            John D. • Commissioner
          </cite>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-12 bg-[#060607]">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col items-center md:items-start gap-1">
            <span className="text-sm font-bold text-white tracking-tight">SBXPRO</span>
            <span className="text-[10px] text-gray-600">© {new Date().getFullYear()} All Rights Reserved.</span>
          </div>

          <div className="flex items-center gap-8 text-[11px] font-bold text-gray-500 uppercase tracking-widest">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;