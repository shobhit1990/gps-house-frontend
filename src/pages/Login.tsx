import React, { useState } from "react";
import { useTheme } from "next-themes";
import { useToast } from "@/hooks/use-toast";
import { useDispatch } from "@/store/hooks";
import { useLoginMutation } from "@/store/services/api/auth";
import { setCredentials } from "@/store/slices/authSlice";
import {
  ArrowRight,
  BarChart3,
  Check,
  Clock3,
  Eye,
  EyeOff,
  Gauge,
  LockKeyhole,
  MapPin,
  Navigation,
  Route,
  ShieldCheck,
  User,
  Zap,
  Moon,
  Sun,
} from "lucide-react";

const Login = () => {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [login, { isLoading }] = useLoginMutation();
  const dispatch = useDispatch();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const inputHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const response = await login({
        username: formData.email.trim(),
        password: formData.password,
      }).unwrap();

      dispatch(
        setCredentials({
          token: response.accessToken,
          refreshToken: response.refreshToken,
          user: {
            id: response.id ?? response.userId,
            primaryId: response.id ?? response.userId,
            username: response.username || formData.email.trim(),
            name: response.name,
            role: response.roleName || response.roleCode,
            roleName: response.roleName,
          },
          menus: response.menus ?? [],
        }),
      );
    } catch (error) {
      const apiError = error as {
        data?: { message?: string };
        error?: string;
      };
      toast({
        title: "Login failed",
        description:
          apiError.data?.message || apiError.error || "Please check your credentials and try again.",
        variant: "destructive",
      });
    }
  };

  const handleDemoLogin = () => {
    dispatch(
      setCredentials({
        token: "demo-session-token",
        user: {
          id: "demo-user",
          username: "demo",
          name: "Demo User",
          role: "Administrator",
          roleName: "Administrator",
        },
        menus: [],
      }),
    );
  };

  return (
    <div
      className={`min-h-screen overflow-hidden transition-all duration-500 lg:h-[100svh] lg:min-h-0 ${
        isDark ? "bg-[#03091c] text-white" : "bg-slate-100 text-slate-900"
      }`}
    >
      {/* =========================================================
          BACKGROUND
      ========================================================= */}

      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Purple glow */}
        <div className="absolute -left-32 -top-32 h-[420px] w-[420px] rounded-full bg-violet-600/30 blur-[130px]" />

        {/* Blue glow */}
        <div className="absolute right-[-150px] top-[15%] h-[500px] w-[500px] rounded-full bg-cyan-500/20 blur-[150px]" />

        {/* Bottom glow */}
        <div className="absolute bottom-[-250px] left-[35%] h-[600px] w-[600px] rounded-full bg-blue-700/20 blur-[160px]" />

        {/* Grid */}
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)
            `,
            backgroundSize: "55px 55px",
          }}
        />
      </div>

      <button
        type="button"
        onClick={() => setTheme(isDark ? "light" : "dark")}
        className="fixed right-4 top-2 z-30 flex h-8 items-center gap-0.5 rounded-full border border-slate-200/80 bg-white/80 p-0.5 shadow-sm backdrop-blur-xl transition hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10 lg:right-6"
        aria-label="Toggle theme"
      >
        <span
          className={`flex h-6 w-6 items-center justify-center rounded-full transition ${
            !isDark ? "bg-slate-900 text-white shadow-lg" : "text-slate-400"
          }`}
        >
          <Sun size={14} />
        </span>

        <span
          className={`flex h-6 w-6 items-center justify-center rounded-full transition ${
            isDark ? "bg-violet-600 text-white shadow-[0_0_20px_rgba(139,92,246,0.5)]" : "text-slate-400"
          }`}
        >
          <Moon size={14} />
        </span>
      </button>

      {/* =========================================================
          MAIN CONTAINER
      ========================================================= */}

      <main className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-[1600px] items-center px-5 py-5 lg:h-full lg:min-h-0 lg:px-8">
        <div className="grid w-full grid-cols-1 gap-6 lg:h-full lg:min-h-0 lg:grid-cols-[1.15fr_0.85fr] lg:gap-8 xl:gap-10">
          {/* =====================================================
              LEFT SIDE
          ===================================================== */}

          <section
            className={`relative flex min-h-[620px] flex-col justify-start overflow-hidden rounded-[36px] border p-7 backdrop-blur-sm lg:h-full lg:min-h-0 lg:p-9 ${
              isDark
                ? "border-white/10 bg-white/[0.025]"
                : "border-slate-200 bg-white/80 shadow-[0_18px_40px_rgba(15,23,42,0.05)]"
            }`}
          >
            {/* Decorative circles */}
            <div className="pointer-events-none absolute -right-32 -top-32 h-[400px] w-[400px] rounded-full border border-cyan-400/10" />
            <div className="pointer-events-none absolute -right-20 -top-20 h-[280px] w-[280px] rounded-full border border-blue-400/10" />

            {/* =================================================
                BRAND
            ================================================= */}

            <div className="relative z-20">
              <div className="flex items-center gap-4">
                <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 via-blue-500 to-violet-600 shadow-[0_0_35px_rgba(34,211,238,0.35)]">
                  <MapPin
                    size={27}
                    strokeWidth={2.4}
                    className="text-white"
                  />

                  <div className="absolute inset-0 rounded-2xl bg-white/10" />
                </div>

                <div>
                  <h1 className={`text-3xl font-black tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
                    GPS
                  </h1>

                  <div className={`mt-1 flex items-center gap-2 text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    <span className={isDark ? "text-white" : "text-slate-700"}>Track</span>
                    <span>•</span>
                    <span>Navigate</span>
                    <span>•</span>
                    <span>Stay Connected</span>
                  </div>
                </div>
              </div>
            </div>

            {/* =================================================
                HERO TEXT
            ================================================= */}

            <div className="relative z-20 mt-12 lg:mt-[8vh]">
              <div className="max-w-[650px]">
                <p className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.25em] text-cyan-400">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-400 shadow-[0_0_15px_#22d3ee]" />
                  Live GPS Intelligence
                </p>

                <h2 className="text-4xl font-black leading-[1.05] tracking-tight xl:text-5xl">
                  Smarter Tracking.
                  <br />

                  <span className="bg-gradient-to-r from-violet-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                    Safer Tomorrow.
                  </span>
                </h2>

                <p className={`mt-4 max-w-xl text-base leading-7 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                  Real-time location tracking, route management and
                  complete fleet visibility — all in one powerful
                  platform.
                </p>
              </div>

              {/* =================================================
                  FEATURE CARDS
              ================================================= */}

              <div className="mt-5 grid max-w-3xl grid-cols-2 gap-3 xl:grid-cols-4">
                <Feature
                  icon={<MapPin size={19} />}
                  title="Live"
                  subtitle="Tracking"
                />

                <Feature
                  icon={<Route size={19} />}
                  title="Route"
                  subtitle="Optimization"
                />

                <Feature
                  icon={<ShieldCheck size={19} />}
                  title="Trip"
                  subtitle="Safety"
                />

                <Feature
                  icon={<BarChart3 size={19} />}
                  title="Detailed"
                  subtitle="Reports"
                />
              </div>
            </div>

            {/* =================================================
                MAP VISUAL
            ================================================= */}

            <div className="absolute bottom-0 left-0 right-0 h-[38%] overflow-hidden">
              {/* City background */}
              <div className="absolute inset-0 bg-gradient-to-t from-blue-950/80 via-blue-950/20 to-transparent" />

              {/* Fake map blocks */}
              <div className="absolute inset-x-0 bottom-0 h-[82%] opacity-30">
                <div className="absolute left-[5%] bottom-[12%] h-20 w-32 rounded-lg bg-slate-700/60" />
                <div className="absolute left-[24%] bottom-[25%] h-28 w-24 rounded-lg bg-slate-700/50" />
                <div className="absolute left-[48%] bottom-[5%] h-32 w-44 rounded-lg bg-slate-700/40" />
                <div className="absolute right-[8%] bottom-[22%] h-24 w-36 rounded-lg bg-slate-700/50" />
                <div className="absolute right-[30%] bottom-[40%] h-20 w-28 rounded-lg bg-slate-700/40" />
              </div>

              {/* Roads */}
              <div className="absolute bottom-[10%] left-[-10%] h-3 w-[120%] rotate-[-17deg] rounded-full bg-slate-700/80" />

              <div className="absolute bottom-[30%] left-[-10%] h-2 w-[120%] rotate-[8deg] bg-slate-700/70" />

              <div className="absolute bottom-[35%] left-[30%] h-[250px] w-2 rotate-[25deg] bg-slate-700/70" />

              {/* Neon route */}
              <svg
                className="absolute inset-0 h-full w-full"
                viewBox="0 0 900 430"
                preserveAspectRatio="none"
              >
                <defs>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="7" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>

                  <linearGradient id="routeGradient">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="50%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#22d3ee" />
                  </linearGradient>
                </defs>

                <path
                  d="M40 370 C180 330 180 230 310 270 S440 370 540 250 S700 120 850 170"
                  fill="none"
                  stroke="#0ea5e9"
                  strokeOpacity="0.2"
                  strokeWidth="20"
                  filter="url(#glow)"
                />

                <path
                  d="M40 370 C180 330 180 230 310 270 S440 370 540 250 S700 120 850 170"
                  fill="none"
                  stroke="url(#routeGradient)"
                  strokeWidth="5"
                  strokeLinecap="round"
                  filter="url(#glow)"
                />
              </svg>

              {/* Destination marker */}
              <div className="absolute right-[24%] top-[22%]">
                <div className="relative">
                  <div className="absolute -inset-5 animate-ping rounded-full bg-cyan-400/20" />

                  <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-cyan-300/40 bg-cyan-400/20 shadow-[0_0_40px_rgba(34,211,238,0.5)] backdrop-blur-md">
                    <MapPin
                      size={35}
                      className="fill-cyan-300 text-cyan-300"
                    />
                  </div>
                </div>
              </div>

              {/* Vehicle */}
              <img
                src="/carimage.png"
                alt="Tracked vehicle"
                className="absolute bottom-[16%] left-[43%] h-20 w-40 object-contain drop-shadow-[0_8px_12px_rgba(0,0,0,0.6)]"
              />

              {/* Speed card */}
              {/* <div className="absolute bottom-[26%] left-[7%] w-48 rounded-2xl border border-white/10 bg-[#07142f]/80 p-4 shadow-2xl backdrop-blur-xl">
                <div className="space-y-2 text-xs">
                  <InfoRow
                    icon={<Gauge size={14} />}
                    label="Speed"
                    value="62 km/h"
                  />

                  <InfoRow
                    icon={<MapPin size={14} />}
                    label="Location"
                    value="Delhi, India"
                  />

                  <InfoRow
                    icon={<Clock3 size={14} />}
                    label="Time"
                    value="10:24 AM"
                  />
                </div>
              </div> */}

              {/* Fleet status */}
              <div className="absolute bottom-7 left-8 flex items-center gap-3 rounded-2xl border border-white/10 bg-[#07142f]/80 px-5 py-3 backdrop-blur-xl">
                <div className="h-3 w-3 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_15px_#34d399]" />

                <div>
                  <p className="text-xs font-semibold text-white">
                    Fleet Online
                  </p>
                  <p className="text-[11px] text-slate-400">
                    24 / 24 Vehicles Active
                  </p>
                </div>
              </div>

              {/* Bottom gradient */}
              <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#03091c] to-transparent" />
            </div>
          </section>

          {/* =====================================================
              RIGHT LOGIN PANEL
          ===================================================== */}

          <section className="relative flex items-center justify-center lg:min-h-0">
            {/* Login card */}
            <div className="relative w-full max-w-[550px] pt-10">
              {/* Glow behind card */}
              <div className="absolute -inset-5 rounded-[45px] bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-violet-500/10 blur-2xl" />

              <div className={`relative overflow-hidden rounded-[34px] border p-4 shadow-[0_30px_100px_rgba(0,0,0,0.45)] backdrop-blur-2xl sm:p-5 ${
                isDark
                  ? "border-white/10 bg-[#08142e]/80"
                  : "border-slate-200 bg-white/90 shadow-[0_30px_80px_rgba(15,23,42,0.10)]"
              }`}>
                {/* Top decorative gradient */}
                <div className="absolute left-0 right-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

                {/* Card decorative glow */}
                <div className="absolute -right-24 -top-24 h-56 w-56 rounded-full bg-violet-500/10 blur-3xl" />

                {/* =================================================
                    CARD HEADER
                ================================================= */}

                <div className="relative z-10">
                  <div className={`mb-2 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold ${
                    isDark
                      ? "border-cyan-400/20 bg-cyan-400/10 text-cyan-300"
                      : "border-cyan-200 bg-cyan-50 text-cyan-700"
                  }`}>
                    <Zap size={14} className={isDark ? "fill-cyan-300" : "fill-cyan-600"} />
                    Welcome Back
                  </div>

                  <h2 className={`text-2xl font-bold tracking-tight sm:text-3xl ${isDark ? "text-white" : "text-slate-900"}`}>
                    Login to Your GPS Account
                  </h2>

                  <p className={`mt-1 max-w-md text-sm leading-5 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                    Track your vehicles, manage routes and stay in
                    control — anytime, anywhere.
                  </p>
                </div>

                {/* =================================================
                    FORM
                ================================================= */}

                <form
                  onSubmit={handleLogin}
                  className="relative z-10 mt-3 space-y-2.5"
                >
                  {/* Email */}
                  <div>
                    <label className={`mb-1 block text-xs font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                      Username / Email
                    </label>

                    <div className="group relative">
                      <User
                        size={20}
                        className={`absolute left-5 top-1/2 -translate-y-1/2 transition ${
                          isDark ? "text-slate-500 group-focus-within:text-cyan-400" : "text-slate-400 group-focus-within:text-cyan-500"
                        }`}
                      />

                      <input
                        type="text"
                        name="email"
                        value={formData.email}
                        onChange={inputHandler}
                        placeholder="Enter your username or email"
                        className={`h-11 w-full rounded-2xl border pl-12 pr-12 text-sm outline-none transition placeholder:text-slate-500 ${
                          isDark
                            ? "border-white/10 bg-white/[0.035] text-white hover:border-white/20 focus:border-cyan-400/50 focus:bg-white/[0.055] focus:ring-4 focus:ring-cyan-400/5"
                            : "border-slate-200 bg-slate-50 text-slate-900 hover:border-slate-300 focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                        }`}
                        required
                      />

                      {formData.email && (
                        <div className="absolute right-5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-400">
                          <Check size={14} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className={`mb-1 block text-xs font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                      Password
                    </label>

                    <div className="group relative">
                      <LockKeyhole
                        size={20}
                        className={`absolute left-5 top-1/2 -translate-y-1/2 transition ${
                          isDark ? "text-slate-500 group-focus-within:text-cyan-400" : "text-slate-400 group-focus-within:text-cyan-500"
                        }`}
                      />

                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={inputHandler}
                        placeholder="Enter your password"
                        className={`h-11 w-full rounded-2xl border pl-12 pr-12 text-sm outline-none transition placeholder:text-slate-500 ${
                          isDark
                            ? "border-white/10 bg-white/[0.035] text-white hover:border-white/20 focus:border-cyan-400/50 focus:bg-white/[0.055] focus:ring-4 focus:ring-cyan-400/5"
                            : "border-slate-200 bg-slate-50 text-slate-900 hover:border-slate-300 focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                        }`}
                        required
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword((prev) => !prev)
                        }
                        className={`absolute right-5 top-1/2 -translate-y-1/2 transition ${
                          isDark ? "text-slate-500 hover:text-white" : "text-slate-500 hover:text-slate-700"
                        }`}
                        aria-label={
                          showPassword
                            ? "Hide password"
                            : "Show password"
                        }
                      >
                        {showPassword ? (
                          <EyeOff size={20} />
                        ) : (
                          <Eye size={20} />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Remember / Forgot */}
                  <div className="flex items-center justify-between gap-4">
                    <button
                      type="button"
                      onClick={() =>
                        setRememberMe((prev) => !prev)
                      }
                      className={`flex items-center gap-3 text-sm transition ${
                        isDark ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <span
                        className={`flex h-5 w-5 items-center justify-center rounded-md border transition ${
                          rememberMe
                            ? "border-cyan-400 bg-cyan-400 text-[#041127]"
                            : "border-white/20 bg-white/5"
                        }`}
                      >
                        {rememberMe && <Check size={14} strokeWidth={3} />}
                      </span>

                      Remember me
                    </button>

                    <button
                      type="button"
                      className={`text-sm font-medium transition ${
                        isDark ? "text-cyan-400 hover:text-cyan-300" : "text-cyan-600 hover:text-cyan-500"
                      }`}
                    >
                      Forgot password?
                    </button>
                  </div>

                  {/* Login */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="group relative flex h-11 w-full items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-600 text-base font-bold text-white shadow-[0_15px_40px_rgba(59,130,246,0.25)] transition duration-300 hover:scale-[1.01] hover:shadow-[0_20px_50px_rgba(59,130,246,0.4)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/15 to-white/0 opacity-0 transition group-hover:opacity-100" />

                    <span className="relative">{isLoading ? "Logging in..." : "Login"}</span>

                    <span className="absolute right-3 flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 transition group-hover:translate-x-1">
                      <ArrowRight size={21} />
                    </span>
                  </button>

                  {/* Divider */}
                  <div className="flex items-center gap-4 py-1">
                    <div className="h-px flex-1 bg-white/10" />
                    <span className="text-xs font-medium text-slate-500">
                      OR
                    </span>
                    <div className="h-px flex-1 bg-white/10" />
                  </div>

                  {/* Demo login */}
                  <button
                    type="button"
                    onClick={handleDemoLogin}
                    className={`flex h-11 w-full items-center justify-center gap-3 rounded-2xl border text-sm font-semibold transition ${
                      isDark
                        ? "border-white/10 bg-white/[0.025] text-slate-200 hover:border-white/20 hover:bg-white/[0.06]"
                        : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100"
                    }`}
                  >
                    <Navigation size={17} className="text-cyan-400" />
                    Demo Login
                    <ArrowRight size={17} className="text-slate-500" />
                  </button>
                </form>

                {/* =================================================
                    SECURITY
                ================================================= */}

                <div className="relative z-10 mt-2 flex items-center justify-center gap-3 border-t border-white/5 pt-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-400">
                    <ShieldCheck size={18} />
                  </div>

                  <p className="text-xs text-slate-500">
                    Your location and data are protected with
                    enterprise-grade security.
                  </p>
                </div>

                {/* =================================================
                    BOTTOM DECORATION
                ================================================= */}

                <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-24 overflow-hidden opacity-30">
                  <svg
                    viewBox="0 0 800 100"
                    className="h-full w-full"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M0 90 L70 50 L120 75 L190 20 L260 65 L330 30 L400 70 L470 25 L550 80 L620 40 L700 65 L800 15"
                      fill="none"
                      stroke="#4f46e5"
                      strokeWidth="1"
                    />

                    <path
                      d="M0 100 L80 65 L150 90 L230 40 L300 80 L390 45 L460 85 L540 35 L620 90 L710 50 L800 80"
                      fill="none"
                      stroke="#06b6d4"
                      strokeWidth="1"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

/* ===============================================================
   SMALL COMPONENTS
=============================================================== */

interface FeatureProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}

const Feature = ({ icon, title, subtitle }: FeatureProps) => {
  return (
    <div className="group rounded-2xl border border-white/10 bg-white/[0.035] p-3 backdrop-blur-md transition hover:-translate-y-1 hover:border-cyan-400/20 hover:bg-white/[0.06]">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/30 to-cyan-400/10 text-cyan-300">
          {icon}
        </div>

        <div>
          <p className="text-xs font-semibold text-white">
            {title}
          </p>

          <p className="text-[11px] text-slate-500">
            {subtitle}
          </p>
        </div>
      </div>
    </div>
  );
};

interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

const InfoRow = ({ icon, label, value }: InfoRowProps) => {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-slate-500">
        {icon}
        <span>{label}</span>
      </div>

      <span className="font-medium text-slate-200">
        {value}
      </span>
    </div>
  );
};

export default Login;