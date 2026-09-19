"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CreditCard, Shield, Zap, Brain, Check, ArrowRight, Loader2, AlertTriangle, CheckCircle2, Receipt, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useSubscriptionPlans, useUserSubscription, useCreateSubscription, useCancelSubscription, useInitiatePayment } from "@/lib/hooks/use-settings";
import { toast } from "sonner";

const planIcons: Record<string, typeof Zap> = { Basic: Zap, Pro: Brain, Elite: Shield };
const planColors: Record<string, { color: string; bg: string }> = {
  Basic: { color: "text-accent", bg: "bg-accent/10 border-accent/15" },
  Pro: { color: "text-primary", bg: "bg-primary/12 border-primary/15" },
  Elite: { color: "text-amber-300", bg: "bg-amber-400/10 border-amber-400/15" },
};
function fmt(d: string) { return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }
function StatusBadge({ status }: { status: string }) {
  const c: Record<string, string> = { ACTIVE: "bg-emerald-400/10 text-emerald-300 border-emerald-400/20", TRIAL: "bg-accent/10 text-accent border-accent/15", CANCELLED: "bg-amber-400/10 text-amber-300 border-amber-400/15", EXPIRED: "bg-red-400/10 text-red-300 border-red-400/15", PENDING: "bg-white/[0.04] text-white/40 border-white/10" };
  const label: Record<string,string> = { ACTIVE:"Active", TRIAL:"Trial", CANCELLED:"Cancelled", EXPIRED:"Expired", PENDING:"Pending" };
  return <span className={cn("rounded-full border px-2.5 py-1 text-xs font-bold", c[status] || c.PENDING)}>{label[status] || status}</span>;
}

export default function SubscriptionPage() {
  const { data: plans, isLoading: plansLoading } = useSubscriptionPlans();
  const { data: subscription, isLoading: subLoading } = useUserSubscription();
  const createSubscription = useCreateSubscription();
  const cancelSubscription = useCancelSubscription();
  const initiatePayment = useInitiatePayment();
  const [sel, setSel] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const active = subscription?.status === "ACTIVE" || subscription?.status === "TRIAL";
  const loading = plansLoading || subLoading;

  const handleUpgrade = async (planId: string) => {
    setSel(planId);
    try {
      const sub = await createSubscription.mutateAsync(planId);
      await initiatePayment.mutateAsync({ subscriptionId: sub.id, provider: "paystack" });
      toast.success("Payment initiated");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Payment failed"); } finally { setSel(null); }
  };
  const handleCancel = async () => {
    try { await cancelSubscription.mutateAsync(); setConfirm(false); toast.success("Subscription cancelled"); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Cancel failed"); }
  };

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/10 px-3 py-1 text-[11px] font-bold tracking-[0.14em] text-emerald-300"><CreditCard className="h-3.5 w-3.5" /> SUBSCRIPTION</div>
        <h1 className="mt-3 font-display text-2xl sm:text-3xl font-bold tracking-tight text-white">Plans & Billing</h1>
        <p className="mt-1.5 text-sm text-white/45">Choose your edge. Upgrade or cancel anytime — no questions asked.</p>
      </motion.div>

      {subscription && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }} className="overflow-hidden rounded-[20px] border border-white/10 bg-[#0b1428]/60 backdrop-blur">
          <div className="p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className={cn("flex h-12 w-12 items-center justify-center rounded-2xl border", planColors[subscription.plan.name]?.bg || "bg-primary/10 border-primary/15", planColors[subscription.plan.name]?.color || "text-primary")}>
                {subscription.plan.name === "Basic" ? <Zap className="h-6 w-6" /> : subscription.plan.name === "Pro" ? <Brain className="h-6 w-6" /> : <Shield className="h-6 w-6" />}
              </span>
              <div>
                <div className="flex items-center gap-2 flex-wrap"><h3 className="font-display text-lg font-bold text-white">{subscription.plan.name} Plan</h3><StatusBadge status={subscription.status} /></div>
                <p className="text-sm text-white/40 mt-1">{active ? <>Renews on {fmt(subscription.endDate)}</> : subscription.status === "CANCELLED" ? <>Access until {fmt(subscription.endDate)}</> : <>Started {fmt(subscription.startDate)}</>}</p>
              </div>
            </div>
            {active && <Button variant="outline" size="sm" onClick={() => setConfirm(true)} className="rounded-full border-red-400/20 bg-red-400/10 text-red-300 hover:bg-red-400/15 hover:text-red-200">Cancel Plan</Button>}
          </div>
          <div className="border-t border-white/10 px-5 sm:px-6 py-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
            {subscription.plan.features.slice(0, 6).map((f) => <span key={f} className="flex items-center gap-1.5 text-xs text-white/50"><Check className="h-3 w-3 text-emerald-300 shrink-0" />{f}</span>)}
          </div>
          {subscription.payments.length > 0 && (
            <div className="border-t border-white/10 bg-white/[0.02] px-5 sm:px-6 py-4">
              <div className="flex items-center gap-2 mb-3 text-xs font-bold tracking-[0.12em] text-white/30"><Receipt className="h-4 w-4" /> PAYMENT HISTORY</div>
              <div className="space-y-2">
                {subscription.payments.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between text-xs"><span className="text-white/40">{fmt(p.createdAt)} • <span className="font-bold text-white">{p.currency === "NGN" ? "₦" : "$"}{(p.amount / 100).toLocaleString()}</span></span><span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-bold", p.status==="SUCCESS"?"bg-emerald-400/10 text-emerald-300 border-emerald-400/15": p.status==="FAILED"?"bg-red-400/10 text-red-300 border-red-400/15":"bg-amber-400/10 text-amber-300 border-amber-400/15")}>{p.status==="SUCCESS"?"Paid":p.status==="FAILED"?"Failed":"Pending"}</span></div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      <AnimatePresence>
        {confirm && (
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }} className="rounded-[20px] border border-amber-400/20 bg-amber-400/5 p-6 flex gap-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/15 border border-amber-400/20 text-amber-300 shrink-0"><AlertTriangle className="h-5 w-5" /></span>
            <div className="flex-1">
              <h3 className="font-display font-semibold text-white">Cancel {subscription?.plan.name}?</h3>
              <p className="mt-1 text-sm leading-6 text-white/50">Access remains until {subscription?.endDate ? fmt(subscription.endDate) : "period end"}. You’ll lose premium features after that.</p>
              <div className="mt-4 flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setConfirm(false)} className="rounded-full border-white/10 bg-white/[0.04] text-white">Keep Plan</Button>
                <Button size="sm" variant="outline" onClick={handleCancel} disabled={cancelSubscription.isPending} className="rounded-full border-red-400/20 bg-red-400/10 text-red-300">
                  {cancelSubscription.isPending && <Loader2 className="mr-1 h-4 w-4 animate-spin" />} Confirm Cancellation
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {plans && plans.length > 0 && (
        <div>
          <h2 className="font-display text-lg font-semibold text-white mb-4">Available Plans</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {plans.map((plan: any, i: number) => {
              const Icon = planIcons[plan.name] || Zap;
              const cols = planColors[plan.name] || { color:"text-primary", bg:"bg-primary/10 border-primary/15" };
              const current = subscription?.plan.id === plan.id && active;
              const upgrading = sel === plan.id;
              return (
                <motion.div key={plan.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 + i*0.05 }}
                  className={cn("relative flex flex-col rounded-[20px] border p-6 backdrop-blur", plan.isPopular && !current ? "border-primary/30 bg-primary/[0.06] shadow-[0_16px_40px_rgba(242,193,78,0.12)] lg:scale-[1.02]" : current ? "border-emerald-400/20 bg-emerald-400/[0.04]" : "border-white/10 bg-[#0b1428]/60 hover:border-white/15")}>
                  {plan.isPopular && !current && <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-bold text-primary-foreground shadow">Most Popular</div>}
                  <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl border", cols.bg, cols.color)}><Icon className="h-5 w-5" /></span>
                  <h3 className="mt-4 font-display text-lg font-bold text-white">{plan.name}</h3>
                  <div className="mt-2"><span className="font-display text-3xl font-bold text-white">{plan.priceUSD>0?`$${plan.priceUSD/100}`:"Free"}</span>{plan.priceUSD>0 && <span className="text-sm text-white/30 ml-1">/{plan.interval.toLowerCase()}</span>}</div>
                  <p className="mt-2 text-sm text-white/40">{plan.description || `${plan.name} plan`}</p>
                  <ul className="mt-6 space-y-2.5 flex-1">
                    {plan.features.map((f: string) => <li key={f} className="flex gap-2 text-sm text-white/60"><Check className="mt-0.5 h-4 w-4 text-emerald-300 shrink-0" />{f}</li>)}
                  </ul>
                  {current ? <Button disabled className="mt-6 w-full rounded-full bg-white/10 text-white/60 gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-300" />Current Plan</Button>
                  : plan.priceUSD===0 ? <Button disabled variant="outline" className="mt-6 w-full rounded-full border-white/10 bg-white/[0.04] text-white/40">Free Plan</Button>
                  : <Button onClick={()=>handleUpgrade(plan.id)} disabled={!!upgrading} variant={plan.isPopular?"default":"outline"} className={cn("mt-6 w-full rounded-full gap-2", plan.isPopular?"bg-primary text-primary-foreground":"border-white/10 bg-white/[0.04] text-white hover:bg-white hover:text-[#050a18]")}>{upgrading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Upgrade <ArrowRight className="h-4 w-4" /></>}</Button>}
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }} className="rounded-[20px] border border-white/10 bg-[#0b1428]/40 backdrop-blur p-5 flex gap-4">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/15 text-primary shrink-0"><Shield className="h-5 w-5" /></span>
        <div><h3 className="text-sm font-bold text-white">Secure Payments</h3><p className="mt-1 text-xs leading-5 text-white/40">Paystack • Flutterwave • Never store card details • Cancel anytime • Support is 24/7</p></div>
      </motion.div>
    </div>
  );
}
