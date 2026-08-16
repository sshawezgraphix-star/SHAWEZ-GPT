import React, { useState } from "react";
import {
  Check,
  KeyRound,
  Lock,
  LogOut,
  Mail,
  ShieldCheck,
  Sparkles,
  User,
  X,
} from "lucide-react";
import { UserProfile } from "../types";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onUpdateUser: (user: UserProfile) => void;
}

const AVATAR_PRESETS = [
  "ShawezPro",
  "CyberPilot",
  "AuraNova",
  "CodeMaster",
  "Zenith",
  "Quantum",
];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  user,
  onUpdateUser,
}) => {
  const [mode, setMode] = useState<"profile" | "login" | "register">(
    user.isGuest ? "login" : "profile"
  );
  const [name, setName] = useState(user.name || "");
  const [email, setEmail] = useState(user.email || "");
  const [password, setPassword] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState(user.avatarUrl);
  const [successNotice, setSuccessNotice] = useState("");

  if (!isOpen) return null;

  const handleQuickDemoLogin = () => {
    const demoUser: UserProfile = {
      id: "usr_shawez_" + Math.random().toString(36).substring(2, 7),
      name: "Shawez Explorer",
      email: "explorer@shawezgpt.ai",
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=ShawezPro`,
      plan: "ShawezGPT Pro",
      createdAt: new Date().toISOString(),
      isGuest: false,
    };
    onUpdateUser(demoUser);
    setSuccessNotice("Signed in as Shawez Explorer (Pro)");
    setTimeout(() => {
      setSuccessNotice("");
      onClose();
    }, 1200);
  };

  const handleCustomLoginOrRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    const updatedUser: UserProfile = {
      id: "usr_" + Math.random().toString(36).substring(2, 9),
      name: name.trim(),
      email: email.trim(),
      avatarUrl:
        selectedAvatar ||
        `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`,
      plan: "ShawezGPT Pro",
      createdAt: new Date().toISOString(),
      isGuest: false,
    };

    onUpdateUser(updatedUser);
    setSuccessNotice(`Welcome, ${name.trim()}!`);
    setTimeout(() => {
      setSuccessNotice("");
      onClose();
    }, 1200);
  };

  const handleLogout = () => {
    const guestUser: UserProfile = {
      id: "usr_guest",
      name: "Guest Explorer",
      email: "guest@shawezgpt.ai",
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=Guest${Date.now()}`,
      plan: "Free Tier",
      createdAt: new Date().toISOString(),
      isGuest: true,
    };
    onUpdateUser(guestUser);
    setMode("login");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in select-none"
      onClick={onClose}
      id="auth-modal-backdrop"
    >
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            <h2 className="font-bold text-base text-slate-900 dark:text-white">
              {mode === "profile"
                ? "Your ShawezGPT Profile"
                : mode === "login"
                ? "Sign in to ShawezGPT"
                : "Create ShawezGPT Account"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {successNotice ? (
            <div className="py-8 text-center space-y-3 animate-in zoom-in-95">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-500 mx-auto flex items-center justify-center">
                <Check className="w-6 h-6" />
              </div>
              <p className="font-bold text-slate-900 dark:text-white text-base">{successNotice}</p>
            </div>
          ) : mode === "profile" ? (
            /* PROFILE VIEW */
            <div className="space-y-5">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-14 h-14 rounded-2xl object-cover bg-emerald-500/20 shadow-sm"
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 dark:text-white truncate">
                      {user.name}
                    </h3>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                      {user.plan}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {user.email}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Member since {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Avatar Switcher */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 block">
                  Select Bot Avatar
                </label>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {AVATAR_PRESETS.map((seed) => {
                    const url = `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}`;
                    return (
                      <button
                        key={seed}
                        onClick={() => {
                          setSelectedAvatar(url);
                          onUpdateUser({ ...user, avatarUrl: url });
                        }}
                        className={`w-10 h-10 rounded-xl p-1 border transition-all ${
                          user.avatarUrl === url
                            ? "border-emerald-500 bg-emerald-500/20 ring-2 ring-emerald-500/30"
                            : "border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                        }`}
                      >
                        <img src={url} alt={seed} className="w-full h-full" />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Switch to Guest</span>
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-sm"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* LOGIN / REGISTER VIEW */
            <div className="space-y-4">
              {/* Quick 1-Click Demo Login */}
              <button
                type="button"
                onClick={handleQuickDemoLogin}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 hover:opacity-95 transition-opacity"
              >
                <Sparkles className="w-4 h-4" />
                <span>1-Click Instant Demo Login (Pro Access)</span>
              </button>

              <div className="relative flex items-center justify-center my-4">
                <hr className="w-full border-slate-200 dark:border-slate-800" />
                <span className="absolute bg-white dark:bg-slate-900 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  or custom account
                </span>
              </div>

              <form onSubmit={handleCustomLoginOrRegister} className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Display Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your Name (e.g. Shawez Developer)"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@domain.com"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs hover:opacity-90 transition-opacity mt-2"
                >
                  {mode === "login" ? "Sign In & Continue" : "Create Account"}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
