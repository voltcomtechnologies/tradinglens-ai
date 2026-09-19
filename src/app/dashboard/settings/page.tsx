"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Settings, User, Bell, Shield, CreditCard, Palette, Globe, ChevronRight, Save, Loader2, Check, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useProfile, useUpdateProfile } from "@/lib/hooks/use-settings";
import { MAJOR_PAIRS } from "@/types";
import { toast } from "sonner";
import type { LLMProvider } from "@/lib/llm/types";

type SettingsTab = "profile" | "notifications" | "security" | "appearance" | "trading" | "regional";
const tabConfig: { id: SettingsTab; label: string; icon: typeof User; color: string; bg: string }[] = [
  { id: "profile", label: "Profile", icon: User, color: "text-accent", bg: "bg-accent/10 border-accent/15" },
  { id: "notifications", label: "Notifications", icon: Bell, color: "text-amber-300", bg: "bg-amber-400/10 border-amber-400/15" },
  { id: "security", label: "Security", icon: Shield, color: "text-emerald-300", bg: "bg-emerald-400/10 border-emerald-400/15" },
  { id: "appearance", label: "Appearance", icon: Palette, color: "text-violet-300", bg: "bg-violet-400/10 border-violet-400/15" },
  { id: "trading", label: "Trading Prefs", icon: CreditCard, color: "text-primary", bg: "bg-primary/10 border-primary/15" },
  { id: "regional", label: "Regional", icon: Globe, color: "text-accent", bg: "bg-accent/10 border-accent/15" },
];

function inputCls(error?: boolean) {
  return cn(
    "bg-white/[0.04] border-white/10 text-white placeholder:text-white/25 focus:border-primary/30 focus:bg-white/[0.06]",
    error && "border-red-400/40 focus:border-red-400/40"
  );
}

function ProfileForm() {
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const [saved, setSaved] = useState(false);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [llmProvider, setLlmProvider] = useState<LLMProvider>("auto");
  useEffect(() => {
    if (profile) { setName(profile.name || ""); setBio(profile.profile?.bio || ""); setPhone(profile.profile?.phone || ""); setLlmProvider((profile.profile?.llmProvider as LLMProvider) || "auto"); }
  }, [profile]);
  const handleSave = async () => {
    try { await updateProfile.mutateAsync({ name, bio, phone, llmProvider }); setSaved(true); toast.success("Profile saved"); setTimeout(() => setSaved(false), 2000); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Save failed"); }
  };
  if (isLoading) return <div className="py-10 text-center text-sm text-white/30">Loading profile…</div>;
  return (
    <div className="space-y-5">
      <div className="space-y-4">
        <div className="space-y-2"><Label className="text-white/70">Full Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className={inputCls()} /></div>
        <div className="space-y-2"><Label className="text-white/70">Email</Label><Input value={profile?.email || ""} disabled className="opacity-60 bg-white/[0.02] border-white/10 text-white/40" /><p className="text-xs text-white/30">Email cannot be changed</p></div>
        <div className="space-y-2"><Label className="text-white/70">Bio</Label><Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell other traders about yourself" rows={3} className={inputCls()} /></div>
        <div className="space-y-2"><Label className="text-white/70">Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" className={inputCls()} /></div>
        <div className="space-y-2">
          <Label className="text-white/70">AI Provider</Label>
          <select value={llmProvider} onChange={(e) => setLlmProvider(e.target.value as LLMProvider)} className="w-full rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white outline-none focus:border-primary/30">
            <option value="auto" className="bg-[#0b1428]">Auto (recommended)</option>
            <option value="groq" className="bg-[#0b1428]">Groq — Free tier</option>
            <option value="openrouter" className="bg-[#0b1428]">OpenRouter — Requires credits</option>
          </select>
          <p className="text-xs text-white/30">Auto picks the best available provider.</p>
        </div>
      </div>
      <Button onClick={handleSave} disabled={updateProfile.isPending} className="rounded-full bg-primary text-primary-foreground hover:bg-white hover:text-[#050a18] gap-2">
        {updateProfile.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}{saved ? "Saved!" : "Save Changes"}
      </Button>
    </div>
  );
}
function NotificationsForm() {
  const [prefs, setPrefs] = useState({ tradeAlerts: true, weeklyDigest: true, courseUpdates: false, marketing: false, emailNotifications: true, pushNotifications: true });
  return (
    <div className="space-y-5">
      {[
        { key: "tradeAlerts", label: "Trade Alerts", desc: "Signals & entry zones" },
        { key: "weeklyDigest", label: "Weekly Digest", desc: "Weekly trading summary" },
        { key: "courseUpdates", label: "Course Updates", desc: "New courses & materials" },
        { key: "marketing", label: "Marketing", desc: "Tips & product updates" },
      ].map((item) => (
        <div key={item.key} className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
          <div><p className="text-sm font-medium text-white">{item.label}</p><p className="text-xs text-white/35">{item.desc}</p></div>
          <Switch checked={prefs[item.key as keyof typeof prefs]} onCheckedChange={(c) => setPrefs((p) => ({ ...p, [item.key]: c }))} />
        </div>
      ))}
      <div className="border-t border-white/10 pt-5 space-y-3">
        <h4 className="text-sm font-semibold text-white">Channels</h4>
        {[{ key: "emailNotifications", label: "Email" }, { key: "pushNotifications", label: "Push" }].map((item) => (
          <div key={item.key} className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
            <p className="text-sm text-white">{item.label}</p><Switch checked={prefs[item.key as keyof typeof prefs]} onCheckedChange={(c) => setPrefs((p) => ({ ...p, [item.key]: c }))} />
          </div>
        ))}
      </div>
    </div>
  );
}
function SecurityForm() {
  const [cur, setCur] = useState(""); const [nw, setNw] = useState(""); const [conf, setConf] = useState(""); const [show, setShow] = useState(false);
  const upd = useUpdateProfile();
  const handle = async () => {
    if (nw !== conf) return toast.error("Passwords do not match");
    if (nw.length < 8) return toast.error("Min 8 characters");
    try { await upd.mutateAsync({ currentPassword: cur, newPassword: nw }); setCur(""); setNw(""); setConf(""); toast.success("Password updated"); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Check current password"); }
  };
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-sm font-bold tracking-wide text-white">Change Password</h3>
        <div className="space-y-2"><Label className="text-white/70">Current Password</Label><Input type={show ? "text" : "password"} value={cur} onChange={(e) => setCur(e.target.value)} placeholder="••••••••" className={inputCls()} /></div>
        <div className="space-y-2"><Label className="text-white/70">New Password</Label><Input type={show ? "text" : "password"} value={nw} onChange={(e) => setNw(e.target.value)} placeholder="••••••••" className={inputCls()} /></div>
        <div className="space-y-2"><Label className="text-white/70">Confirm New Password</Label><div className="relative"><Input type={show ? "text" : "password"} value={conf} onChange={(e) => setConf(e.target.value)} placeholder="••••••••" className={cn(inputCls(), "pr-10")} /><button onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30">{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></div>
        <Button onClick={handle} disabled={!cur || !nw || upd.isPending} size="sm" className="rounded-full bg-primary text-primary-foreground">{upd.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Update Password</Button>
      </div>
      <div className="border-t border-white/10 pt-6"><h3 className="text-sm font-bold text-white">Two-Factor Authentication</h3><p className="mt-1 text-xs text-white/35">Enhanced account security.</p><Button variant="outline" size="sm" disabled className="mt-3 rounded-full border-white/10 bg-white/[0.04] text-white/40">Coming Soon</Button></div>
    </div>
  );
}
function AppearanceForm() {
  return (
    <div className="space-y-4">
      <Label className="text-white/70">Theme</Label>
      <div className="grid grid-cols-3 gap-3">
        {["Dark", "Light", "System"].map((t) => (
          <button key={t} className={cn("rounded-2xl border p-4 text-left transition-all", t==="Dark" ? "border-primary bg-primary/10" : "border-white/10 bg-white/[0.03] hover:border-white/15")}>
            <div className={cn("h-10 rounded-xl mb-3", t==="Dark" ? "bg-[#050a18] border border-white/10" : "bg-white border border-black/10")} />
            <p className="text-sm font-semibold text-white">{t}</p><p className="text-xs text-white/30">Active</p>
          </button>
        ))}
      </div>
    </div>
  );
}
function TradingPrefsForm() {
  const [style, setStyle] = useState("day_trader"); const [exp, setExp] = useState("intermediate"); const [pairs, setPairs] = useState<string[]>(["EURUSD","GBPUSD","USDJPY"]);
  const toggle = (p: string) => setPairs((x) => x.includes(p) ? x.filter((q) => q!==p) : [...x,p]);
  const selCls = "w-full rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white outline-none focus:border-primary/30";
  return (
    <div className="space-y-4">
      <div className="space-y-2"><Label className="text-white/70">Trading Style</Label><select value={style} onChange={(e)=>setStyle(e.target.value)} className={selCls}><option className="bg-[#0b1428]" value="scalper">Scalper</option><option className="bg-[#0b1428]" value="day_trader">Day Trader</option><option className="bg-[#0b1428]" value="swing_trader">Swing Trader</option><option className="bg-[#0b1428]" value="position">Position</option></select></div>
      <div className="space-y-2"><Label className="text-white/70">Experience</Label><select value={exp} onChange={(e)=>setExp(e.target.value)} className={selCls}><option className="bg-[#0b1428]" value="beginner">Beginner</option><option className="bg-[#0b1428]" value="intermediate">Intermediate</option><option className="bg-[#0b1428]" value="advanced">Advanced</option><option className="bg-[#0b1428]" value="expert">Expert</option></select></div>
      <div className="space-y-2"><Label className="text-white/70">Preferred Pairs</Label><div className="flex flex-wrap gap-2">{MAJOR_PAIRS.slice(0,12).map((pair) => <button key={pair.symbol} onClick={()=>toggle(pair.symbol)} className={cn("rounded-full border px-3 py-1.5 text-xs font-bold transition-colors", pairs.includes(pair.symbol)?"bg-primary border-primary text-primary-foreground":"bg-white/[0.04] border-white/10 text-white/50 hover:border-white/15 hover:text-white")}>{pair.symbol}</button>)}</div></div>
    </div>
  );
}
function RegionalForm() {
  const selCls = "w-full rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white outline-none focus:border-primary/30";
  return (
    <div className="space-y-4">
      <div className="space-y-2"><Label className="text-white/70">Timezone</Label><select className={selCls} defaultValue="UTC"><option className="bg-[#0b1428]" value="UTC">UTC</option><option className="bg-[#0b1428]" value="America/New_York">Eastern (UTC-5)</option><option className="bg-[#0b1428]" value="Europe/London">London (UTC+0)</option><option className="bg-[#0b1428]" value="Asia/Tokyo">Tokyo (UTC+9)</option></select></div>
      <div className="space-y-2"><Label className="text-white/70">Currency Display</Label><select className={selCls} defaultValue="USD"><option className="bg-[#0b1428]" value="USD">USD ($)</option><option className="bg-[#0b1428]" value="EUR">EUR (€)</option><option className="bg-[#0b1428]" value="NGN">NGN (₦)</option></select></div>
      <div className="space-y-2"><Label className="text-white/70">Country</Label><select className={selCls} defaultValue=""><option className="bg-[#0b1428]" value="">Select country…</option><option className="bg-[#0b1428]" value="NG">Nigeria</option><option className="bg-[#0b1428]" value="US">United States</option><option className="bg-[#0b1428]" value="UK">United Kingdom</option></select></div>
    </div>
  );
}
const tabForms: Record<SettingsTab, React.ReactNode> = { profile:<ProfileForm/>, notifications:<NotificationsForm/>, security:<SecurityForm/>, appearance:<AppearanceForm/>, trading:<TradingPrefsForm/>, regional:<RegionalForm/> };

export default function SettingsPage() {
  const [tab, setTab] = useState<SettingsTab>("profile");
  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}>
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-bold tracking-[0.14em] text-white/50"><Settings className="h-3.5 w-3.5" /> SETTINGS</div>
        <h1 className="mt-3 font-display text-2xl sm:text-3xl font-bold tracking-tight text-white">Settings</h1>
        <p className="mt-1 text-sm text-white/40">Customize your TradingLens cockpit.</p>
      </motion.div>
      <div className="flex flex-col lg:flex-row gap-6">
        <motion.div initial={{ opacity:0, x:-12 }} animate={{ opacity:1, x:0 }} className="lg:w-56 shrink-0">
          <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
            {tabConfig.map((t) => (
              <button key={t.id} onClick={()=>setTab(t.id)} className={cn("flex items-center gap-2.5 rounded-full px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors", tab===t.id ? "bg-primary text-primary-foreground shadow" : "text-white/40 hover:text-white hover:bg-white/[0.06]")}>
                <span className={cn("flex h-7 w-7 items-center justify-center rounded-full border", tab===t.id ? "bg-white/15 border-white/20" : t.bg)}><t.icon className={cn("h-3.5 w-3.5", tab===t.id ? "text-primary-foreground" : t.color)} /></span>
                <span className="hidden lg:inline">{t.label}</span>{tab===t.id && <ChevronRight className="ml-auto hidden lg:block h-3.5 w-3.5 opacity-60" />}
              </button>
            ))}
          </nav>
        </motion.div>
        <motion.div key={tab} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} className="flex-1 rounded-[20px] border border-white/10 bg-[#0b1428]/60 backdrop-blur p-6">
          <h2 className="font-display text-lg font-bold text-white capitalize">{tabConfig.find((x)=>x.id===tab)?.label}</h2>
          <div className="mt-6">{tabForms[tab]}</div>
        </motion.div>
      </div>
    </div>
  );
}
