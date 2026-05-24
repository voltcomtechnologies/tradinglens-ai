"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CreditCard,
  Shield,
  Zap,
  Brain,
  Check,
  ArrowRight,
  Loader2,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Receipt,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  useSubscriptionPlans,
  useUserSubscription,
  useCreateSubscription,
  useCancelSubscription,
  useInitiatePayment,
} from "@/lib/hooks/use-settings";

const planIcons: Record<string, typeof Zap> = {
  Basic: Zap,
  Pro: Brain,
  Elite: Shield,
};

const planColors: Record<string, { color: string; bg: string }> = {
  Basic: { color: "text-blue-400", bg: "bg-blue-500/10" },
  Pro: { color: "text-primary", bg: "bg-primary/10" },
  Elite: { color: "text-amber-400", bg: "bg-amber-500/10" },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    ACTIVE: { label: "Active", className: "bg-emerald-500/10 text-emerald-400" },
    TRIAL: { label: "Trial", className: "bg-blue-500/10 text-blue-400" },
    CANCELLED: { label: "Cancelled", className: "bg-amber-500/10 text-amber-400" },
    EXPIRED: { label: "Expired", className: "bg-red-500/10 text-red-400" },
    PENDING: { label: "Pending", className: "bg-muted text-muted-foreground" },
  };
  const c = config[status] || config.PENDING;
  return <Badge variant="secondary" className={c.className}>{c.label}</Badge>;
}

export default function SubscriptionPage() {
  const { data: plans, isLoading: plansLoading } = useSubscriptionPlans();
  const { data: subscription, isLoading: subLoading } = useUserSubscription();
  const createSubscription = useCreateSubscription();
  const cancelSubscription = useCancelSubscription();
  const initiatePayment = useInitiatePayment();
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const isActive = subscription?.status === "ACTIVE" || subscription?.status === "TRIAL";
  const isLoading = plansLoading || subLoading;

  const handleUpgrade = async (planId: string) => {
    setSelectedPlanId(planId);
    try {
      const sub = await createSubscription.mutateAsync(planId);
      // Initiate payment
      await initiatePayment.mutateAsync({
        subscriptionId: sub.id,
        provider: "paystack",
      });
    } finally {
      setSelectedPlanId(null);
    }
  };

  const handleCancel = async () => {
    await cancelSubscription.mutateAsync();
    setShowCancelConfirm(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-emerald-500/10">
            <CreditCard className="h-5 w-5 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold">Subscription</h1>
        </div>
        <p className="text-muted-foreground">
          Choose the plan that fits your trading journey. Upgrade or cancel anytime.
        </p>
      </motion.div>

      {/* Current Subscription */}
      {subscription && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-border bg-card overflow-hidden"
        >
          <div className="p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "p-3 rounded-xl",
                  planColors[subscription.plan.name]?.bg || "bg-primary/10"
                )}>
                  {subscription.plan.name === "Basic" ? (
                    <Zap className={cn("h-6 w-6", planColors[subscription.plan.name]?.color || "text-primary")} />
                  ) : subscription.plan.name === "Pro" ? (
                    <Brain className={cn("h-6 w-6", planColors[subscription.plan.name]?.color || "text-primary")} />
                  ) : (
                    <Shield className={cn("h-6 w-6", planColors[subscription.plan.name]?.color || "text-primary")} />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold">{subscription.plan.name} Plan</h3>
                    <StatusBadge status={subscription.status} />
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {isActive ? (
                      <>Renews on {formatDate(subscription.endDate)}</>
                    ) : subscription.status === "CANCELLED" ? (
                      <>Access until {formatDate(subscription.endDate)}</>
                    ) : (
                      <>Started on {formatDate(subscription.startDate)}</>
                    )}
                  </p>
                </div>
              </div>
              {isActive && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCancelConfirm(true)}
                  className="text-red-400 hover:text-red-300 border-red-500/20 hover:border-red-500/40 shrink-0"
                >
                  Cancel Plan
                </Button>
              )}
            </div>

            {/* Plan features */}
            <div className="mt-4 pt-4 border-t border-border">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {subscription.plan.features.slice(0, 6).map((f) => (
                  <div key={f} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Check className="h-3 w-3 text-emerald-400 shrink-0" />
                    {f}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Payment history */}
          {subscription.payments.length > 0 && (
            <div className="border-t border-border bg-muted/20 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Receipt className="h-4 w-4 text-muted-foreground" />
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Payment History</h4>
              </div>
              <div className="space-y-2">
                {subscription.payments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{formatDate(payment.createdAt)}</span>
                      <span className="font-medium">
                        {payment.currency === "NGN" ? "₦" : "$"}{(payment.amount / 100).toLocaleString()}
                      </span>
                    </div>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-[10px] px-1.5 py-0",
                        payment.status === "SUCCESS"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : payment.status === "FAILED"
                            ? "bg-red-500/10 text-red-400"
                            : "bg-amber-500/10 text-amber-400"
                      )}
                    >
                      {payment.status === "SUCCESS" ? "Paid" : payment.status === "FAILED" ? "Failed" : "Pending"}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Cancel Confirm Dialog */}
      <AnimatePresence>
        {showCancelConfirm && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="rounded-xl border border-border bg-card p-6"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <AlertTriangle className="h-5 w-5 text-amber-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Cancel Subscription?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Your {subscription?.plan.name} plan will remain active until {subscription?.endDate ? formatDate(subscription.endDate) : "the end of the billing period"}. After that, you&apos;ll lose access to premium features.
                </p>
                <div className="flex items-center gap-3">
                  <Button size="sm" variant="outline" onClick={() => setShowCancelConfirm(false)}>
                    Keep Plan
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={cancelSubscription.isPending}
                    className="text-red-400 border-red-500/20 hover:border-red-500/40"
                  >
                    {cancelSubscription.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    ) : null}
                    Confirm Cancellation
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Plans Grid */}
      {plans && plans.length > 0 && (
        <div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="text-lg font-semibold mb-4"
          >
            Available Plans
          </motion.h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {plans.map((plan, i) => {
              const Icon = planIcons[plan.name] || Zap;
              const colors = planColors[plan.name] || { color: "text-primary", bg: "bg-primary/10" };
              const isCurrentPlan =
                subscription?.plan.id === plan.id && isActive;
              const isUpgrading = selectedPlanId === plan.id;

              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.05 }}
                  className={cn(
                    "relative rounded-xl border bg-card p-6 transition-all duration-300 flex flex-col",
                    plan.isPopular && !isCurrentPlan
                      ? "border-primary shadow-lg shadow-primary/5 scale-105"
                      : isCurrentPlan
                        ? "border-emerald-500/30"
                        : "border-border hover:border-primary/30"
                  )}
                >
                  {plan.isPopular && !isCurrentPlan && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
                    </div>
                  )}

                  <div className={cn("p-3 rounded-xl w-fit mb-4", colors.bg)}>
                    <Icon className={cn("h-6 w-6", colors.color)} />
                  </div>

                  <h3 className="text-lg font-bold">{plan.name}</h3>
                  <div className="mt-2 mb-1">
                    <span className="text-3xl font-bold">
                      {plan.priceUSD > 0 ? `$${plan.priceUSD / 100}` : "Free"}
                    </span>
                    {plan.priceUSD > 0 && (
                      <span className="text-sm text-muted-foreground ml-1">
                        /{plan.interval.toLowerCase()}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-6">
                    {plan.description || `${plan.name} plan features`}
                  </p>

                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {isCurrentPlan ? (
                    <Button className="w-full" variant="outline" disabled>
                      <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-400" />
                      Current Plan
                    </Button>
                  ) : plan.priceUSD === 0 ? (
                    <Button className="w-full" variant="outline" disabled>
                      Free Plan
                    </Button>
                  ) : (
                    <Button
                      className="w-full gap-2"
                      variant={plan.isPopular ? "default" : "outline"}
                      onClick={() => handleUpgrade(plan.id)}
                      disabled={isUpgrading}
                    >
                      {isUpgrading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          Upgrade
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Payment Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-xl border border-border bg-card p-5"
      >
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm mb-1">Secure Payments</h3>
            <p className="text-xs text-muted-foreground">
              All payments are processed securely through Paystack or Flutterwave. We never store your card details. 
              You can cancel your subscription at any time. Questions? Contact our support team.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
