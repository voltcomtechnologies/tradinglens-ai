"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Settings,
  User,
  Bell,
  Shield,
  CreditCard,
  Palette,
  Globe,
  ChevronRight,
  Save,
  Loader2,
  Check,
  Eye,
  EyeOff,
} from "lucide-react";
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
  { id: "profile", label: "Profile", icon: User, color: "text-blue-400", bg: "bg-blue-500/10" },
  { id: "notifications", label: "Notifications", icon: Bell, color: "text-amber-400", bg: "bg-amber-500/10" },
  { id: "security", label: "Security", icon: Shield, color: "text-emerald-400", bg: "bg-emerald-500/10" },
  { id: "appearance", label: "Appearance", icon: Palette, color: "text-violet-400", bg: "bg-violet-500/10" },
  { id: "trading", label: "Trading Prefs", icon: CreditCard, color: "text-rose-400", bg: "bg-rose-500/10" },
  { id: "regional", label: "Regional", icon: Globe, color: "text-cyan-400", bg: "bg-cyan-500/10" },
];

function ProfileForm() {
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const [saved, setSaved] = useState(false);

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [llmProvider, setLlmProvider] = useState<LLMProvider>("auto");

  // Initialize form fields when profile data loads
  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setBio(profile.profile?.bio || "");
      setPhone(profile.profile?.phone || "");
      setLlmProvider((profile.profile?.llmProvider as LLMProvider) || "auto");
    }
  }, [profile]);

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync({ name, bio, phone, llmProvider });
      setSaved(true);
      toast.success("Profile saved successfully");
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save profile";
      toast.error(message);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground text-sm">Loading profile...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="settings-name">Full Name</Label>
          <Input
            id="settings-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="settings-email">Email</Label>
          <Input
            id="settings-email"
            value={profile?.email || ""}
            disabled
            className="opacity-60"
          />
          <p className="text-xs text-muted-foreground">Email cannot be changed</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="settings-bio">Bio</Label>
          <Textarea
            id="settings-bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell other traders about yourself"
            rows={3}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="settings-phone">Phone</Label>
          <Input
            id="settings-phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 (555) 000-0000"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="settings-llm">AI Provider</Label>
          <select
            id="settings-llm"
            value={llmProvider}
            onChange={(e) => setLlmProvider(e.target.value as LLMProvider)}
            className="w-full bg-muted text-sm rounded-lg px-3 py-2 border border-border outline-none"
          >
            <option value="auto">Auto (recommended)</option>
            <option value="groq">Groq — Free tier, no credit card required</option>
            <option value="openrouter">OpenRouter — Requires credits</option>
          </select>
          <p className="text-xs text-muted-foreground">
            Choose which AI provider powers your Trading Lens analysis. Auto picks the best available provider.
          </p>
        </div>
      </div>
      <Button onClick={handleSave} disabled={updateProfile.isPending} className="gap-2">
        {updateProfile.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : saved ? (
          <Check className="h-4 w-4" />
        ) : (
          <Save className="h-4 w-4" />
        )}
        {saved ? "Saved!" : "Save Changes"}
      </Button>
    </div>
  );
}

function NotificationsForm() {
  const [prefs, setPrefs] = useState({
    tradeAlerts: true,
    weeklyDigest: true,
    courseUpdates: false,
    marketing: false,
    emailNotifications: true,
    pushNotifications: true,
  });

  return (
    <div className="space-y-5">
      {[
        { key: "tradeAlerts", label: "Trade Alerts", desc: "Get notified when trading signals are available" },
        { key: "weeklyDigest", label: "Weekly Digest", desc: "Receive a weekly summary of your trading activity" },
        { key: "courseUpdates", label: "Course Updates", desc: "Notifications about new courses and materials" },
        { key: "marketing", label: "Marketing", desc: "Tips, promotions, and product updates" },
      ].map((item) => (
        <div key={item.key} className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">{item.label}</p>
            <p className="text-xs text-muted-foreground">{item.desc}</p>
          </div>
          <Switch
            checked={prefs[item.key as keyof typeof prefs]}
            onCheckedChange={(checked) => setPrefs((p) => ({ ...p, [item.key]: checked }))}
          />
        </div>
      ))}
      <div className="border-t border-border pt-5 space-y-4">
        <h4 className="text-sm font-semibold">Channels</h4>
        {[
          { key: "emailNotifications", label: "Email Notifications" },
          { key: "pushNotifications", label: "Push Notifications" },
        ].map((item) => (
          <div key={item.key} className="flex items-center justify-between">
            <p className="text-sm">{item.label}</p>
            <Switch
              checked={prefs[item.key as keyof typeof prefs]}
              onCheckedChange={(checked) => setPrefs((p) => ({ ...p, [item.key]: checked }))}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function SecurityForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPws, setShowPws] = useState(false);
  const updateProfile = useUpdateProfile();

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    try {
      await updateProfile.mutateAsync({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password updated successfully");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update password. Check your current password.";
      toast.error(message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-sm font-semibold">Change Password</h3>
        <div className="space-y-2">
          <Label>Current Password</Label>
          <div className="relative">
            <Input
              type={showPws ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              className="pr-10"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>New Password</Label>
          <Input
            type={showPws ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter new password"
          />
        </div>
        <div className="space-y-2">
          <Label>Confirm New Password</Label>
          <div className="relative">
            <Input
              type={showPws ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="pr-10"
            />
            <button
              onClick={() => setShowPws(!showPws)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              {showPws ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <Button
          onClick={handleChangePassword}
          disabled={!currentPassword || !newPassword || updateProfile.isPending}
          size="sm"
        >
          {updateProfile.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Update Password
        </Button>
      </div>
      <div className="border-t border-border pt-6 space-y-4">
        <h3 className="text-sm font-semibold">Two-Factor Authentication</h3>
        <p className="text-xs text-muted-foreground">Enable 2FA for enhanced account security.</p>
        <Button variant="outline" size="sm" disabled>Coming Soon</Button>
      </div>
    </div>
  );
}

function AppearanceForm() {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label>Theme</Label>
        <div className="grid grid-cols-2 gap-3">
          {["Dark", "Light", "System"].map((theme) => (
            <button
              key={theme}
              className={cn(
                "p-4 rounded-xl border text-left transition-all",
                theme === "Dark"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/30"
              )}
            >
              <div className={cn(
                "w-full h-8 rounded-lg mb-2",
                theme === "Dark" ? "bg-[#0a0e17]" : "bg-white border"
              )} />
              <p className="text-sm font-medium">{theme}</p>
              <p className="text-xs text-muted-foreground">Default</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function TradingPrefsForm() {
  const [style, setStyle] = useState("day_trader");
  const [experience, setExperience] = useState("intermediate");
  const [selectedPairs, setSelectedPairs] = useState<string[]>(["EURUSD", "GBPUSD", "USDJPY"]);

  const togglePair = (pair: string) => {
    setSelectedPairs((prev) =>
      prev.includes(pair) ? prev.filter((p) => p !== pair) : [...prev, pair]
    );
  };

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label>Trading Style</Label>
        <select
          value={style}
          onChange={(e) => setStyle(e.target.value)}
          className="w-full bg-muted text-sm rounded-lg px-3 py-2 border border-border outline-none"
        >
          <option value="scalper">Scalper</option>
          <option value="day_trader">Day Trader</option>
          <option value="swing_trader">Swing Trader</option>
          <option value="position">Position Trader</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label>Experience Level</Label>
        <select
          value={experience}
          onChange={(e) => setExperience(e.target.value)}
          className="w-full bg-muted text-sm rounded-lg px-3 py-2 border border-border outline-none"
        >
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
          <option value="expert">Expert</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label>Preferred Pairs</Label>
        <div className="flex flex-wrap gap-2">
          {MAJOR_PAIRS.slice(0, 12).map((pair) => (
            <button
              key={pair.symbol}
              onClick={() => togglePair(pair.symbol)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                selectedPairs.includes(pair.symbol)
                  ? "bg-primary/10 border-primary text-primary"
                  : "bg-muted/30 border-border text-muted-foreground hover:border-primary/30"
              )}
            >
              {pair.symbol}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function RegionalForm() {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label>Timezone</Label>
        <select className="w-full bg-muted text-sm rounded-lg px-3 py-2 border border-border outline-none" defaultValue="UTC">
          <option value="UTC">UTC (Coordinated Universal Time)</option>
          <option value="America/New_York">Eastern (UTC-5)</option>
          <option value="Europe/London">London (UTC+0)</option>
          <option value="Europe/Paris">Central European (UTC+1)</option>
          <option value="Asia/Tokyo">Tokyo (UTC+9)</option>
          <option value="Asia/Singapore">Singapore (UTC+8)</option>
          <option value="Australia/Sydney">Sydney (UTC+11)</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label>Currency Display</Label>
        <select className="w-full bg-muted text-sm rounded-lg px-3 py-2 border border-border outline-none" defaultValue="USD">
          <option value="USD">USD ($)</option>
          <option value="EUR">EUR (€)</option>
          <option value="GBP">GBP (£)</option>
          <option value="NGN">NGN (₦)</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label>Country</Label>
        <select className="w-full bg-muted text-sm rounded-lg px-3 py-2 border border-border outline-none" defaultValue="">
          <option value="">Select country...</option>
          <option value="US">United States</option>
          <option value="UK">United Kingdom</option>
          <option value="NG">Nigeria</option>
          <option value="SG">Singapore</option>
          <option value="AU">Australia</option>
          <option value="CA">Canada</option>
        </select>
      </div>
    </div>
  );
}

const tabForms: Record<SettingsTab, React.ReactNode> = {
  profile: <ProfileForm />,
  notifications: <NotificationsForm />,
  security: <SecurityForm />,
  appearance: <AppearanceForm />,
  trading: <TradingPrefsForm />,
  regional: <RegionalForm />,
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-muted">
            <Settings className="h-5 w-5 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>
        <p className="text-muted-foreground">Customize your TradingLens experience.</p>
      </motion.div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Tabs */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:w-56 shrink-0"
        >
          <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0">
            {tabConfig.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all whitespace-nowrap",
                  activeTab === tab.id
                    ? "bg-muted font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <div className={cn("p-1.5 rounded-lg", tab.bg)}>
                  <tab.icon className={cn("h-4 w-4", tab.color)} />
                </div>
                <span className="hidden lg:inline">{tab.label}</span>
                {activeTab === tab.id && (
                  <ChevronRight className="h-3.5 w-3.5 ml-auto hidden lg:block text-muted-foreground" />
                )}
              </button>
            ))}
          </nav>
        </motion.div>

        {/* Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 rounded-xl border border-border bg-card p-6"
        >
          <h2 className="text-lg font-bold mb-6 capitalize">
            {tabConfig.find((t) => t.id === activeTab)?.label}
          </h2>
          {tabForms[activeTab]}
        </motion.div>
      </div>
    </div>
  );
}
