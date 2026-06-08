"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Adresse email ou mot de passe incorrect");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch {
      setError("Une erreur technique est survenue. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setEmail("admin@gmail.com");
    setPassword("admin123");
    setError("");
  };
  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row overflow-hidden relative bg-[#F8FAFC] font-sans">
      
      {/* LEFT SIDE: Visual Showcase (Hidden on Mobile) */}
      <div className="hidden md:flex md:w-1/2 relative overflow-hidden flex-col justify-between p-12 lg:p-20">
        
        {/* Background Image with soft contrast */}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-10000 scale-105 ease-out"
          style={{ 
            backgroundImage: "url('https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&q=80&w=1920')" 
          }}
        />
        
        {/* Subtle, dark overlay for better text contrast */}
        <div className="absolute inset-0 bg-slate-900/70" />
        
        {/* Brand / Logo (Glass effect) */}
        <div className="relative z-10 flex items-center gap-3 self-start">
          <div className="w-12 h-12 rounded-2xl bg-fleet-blue text-white flex items-center justify-center shadow-lg shadow-fleet-blue/20">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            Truck<span className="text-fleet-blue-light">Manager</span>
          </span>
        </div>

        {/* Hero Middle Description */}
        <div className="relative z-10 max-w-xl my-auto pt-20">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-fleet-blue/20 border border-fleet-blue-light/30 text-fleet-blue-light text-xs font-bold uppercase tracking-wider mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-fleet-blue-light" />
            Portail Entreprise v2.0
          </div>
          <h1 className="text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight">
            La performance au cœur de votre <span className="text-fleet-blue-light">logistique</span>.
          </h1>
          <p className="text-slate-300 mt-4 text-base lg:text-lg leading-relaxed font-medium">
            Optimisez vos trajets, contrôlez vos consommations de carburant, suivez l'état technique de vos camions et gérez vos ventes en temps réel.
          </p>

          {/* Mini Features List */}
          <div className="grid grid-cols-2 gap-4 mt-8">
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-sm">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Flotte Active</p>
                <p className="text-sm font-extrabold text-white">5 Camions Suivis</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-sm">
              <div className="w-9 h-9 rounded-xl bg-fleet-blue/20 flex items-center justify-center text-fleet-blue-light">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Rentabilité</p>
                <p className="text-sm font-extrabold text-white">Rapports & Ventes</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 flex items-center justify-between text-xs text-slate-400 font-medium">
          <p>© 2026 TruckManager Inc. Tous droits réservés.</p>
          <div className="flex gap-4">
            <span className="hover:text-slate-600 transition-colors cursor-pointer">Conditions</span>
            <span className="hover:text-slate-600 transition-colors cursor-pointer">Confidentialité</span>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: connection form (White Dominant) */}
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12 lg:p-16 relative bg-white border-l border-slate-100">
        
        {/* Soft elegant glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-64 h-64 bg-fleet-blue/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-64 h-64 bg-indigo-50/30 rounded-full blur-[120px] pointer-events-none" />

        {/* Mobile Header Branding (Visible only on mobile) */}
        <div className="flex md:hidden items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl bg-fleet-blue flex items-center justify-center text-white shadow-lg shadow-fleet-blue/25">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
            </svg>
          </div>
          <span className="text-xl font-bold text-slate-800 tracking-tight">TruckManager</span>
        </div>

        <div className="w-full max-w-sm relative z-10 animate-fade-in-up">
          
          {/* Header titles */}
          <div className="mb-8 text-center md:text-left">
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">Se connecter</h2>
            <p className="text-slate-400 text-sm mt-2 font-medium">
              Saisissez vos paramètres de connexion pour accéder au tableau de bord.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Email Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Adresse email
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-fleet-blue transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.206" />
                  </svg>
                </div>
                <input
                  type="email"
                  placeholder="nom@entreprise.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-[#F8FAFC] border border-slate-200 text-slate-800 placeholder:text-slate-400 pl-11 pr-4 py-3 rounded-2xl text-sm transition-all duration-300 focus:outline-none focus:border-fleet-blue focus:ring-4 focus:ring-fleet-blue/10 hover:border-slate-300"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Mot de passe
                </label>
                <span className="text-xs text-fleet-blue hover:text-fleet-blue-dark font-bold hover:underline cursor-pointer transition-colors">
                  Mot de passe oublié ?
                </span>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-fleet-blue transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-[#F8FAFC] border border-slate-200 text-slate-800 placeholder:text-slate-400 pl-11 pr-10 py-3 rounded-2xl text-sm transition-all duration-300 focus:outline-none focus:border-fleet-blue focus:ring-4 focus:ring-fleet-blue/10 hover:border-slate-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="flex items-start gap-2.5 px-4 py-3 rounded-2xl bg-rose-50 border border-rose-100 text-rose-800 text-xs font-semibold animate-fade-in">
                <svg className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full relative py-3.5 px-4 bg-fleet-blue hover:bg-fleet-blue-dark disabled:bg-fleet-blue/50 text-white rounded-2xl text-sm font-bold tracking-wide shadow-lg shadow-fleet-blue/15 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-fleet-blue/20 active:scale-[0.98] disabled:cursor-not-allowed flex items-center justify-center overflow-hidden group btn-premium cursor-pointer"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>Connexion en cours...</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span>Se connecter</span>
                  <svg className="w-4.5 h-4.5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </div>
              )}
            </button>
          </form>

          {/* Elegant Demo Mode Assistant */}
          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400 mb-3 font-semibold uppercase tracking-wider">
              Besoin de tester rapidement l'application ?
            </p>
            <button
              type="button"
              onClick={handleFillDemo}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-fleet-blue hover:text-fleet-blue-dark border border-slate-100 hover:border-slate-200 rounded-2xl text-xs font-bold tracking-wide transition-all duration-200 active:scale-95 cursor-pointer shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Remplir la démo (Admin)
            </button>
          </div>

        </div>

        {/* Small copyright at bottom for mobile */}
        <p className="text-center text-[10px] text-slate-400 mt-12 md:hidden font-medium">
          © 2026 TruckManager · Tous droits réservés.
        </p>

      </div>
    </div>
  );
}
