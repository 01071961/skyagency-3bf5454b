/**
 * Stripe Connect Onboarding Page
 * 
 * This page allows users to:
 * 1. Create a new connected account
 * 2. Complete the onboarding process
 * 3. View their onboarding status
 * 
 * The onboarding flow:
 * 1. User enters their email and business name
 * 2. We create a connected account via Stripe API
 * 3. User clicks "Start Onboarding" to go to Stripe's hosted onboarding
 * 4. After completing onboarding, they're redirected back here
 */

import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, CheckCircle, AlertCircle, ArrowRight, RefreshCw, Store } from "lucide-react";
import { Link } from "react-router-dom";

interface AccountStatus {
  id: string;
  email: string;
  business_profile: {
    name?: string;
  };
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted: boolean;
  onboarding_status: "not_started" | "in_progress" | "complete" | "restricted";
  requirements: {
    currently_due: string[];
    eventually_due: string[];
    past_due: string[];
    disabled_reason?: string;
  };
}

export default function ConnectOnboarding() {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [accountStatus, setAccountStatus] = useState<AccountStatus | null>(null);

  // Check for URL parameters on mount
  useEffect(() => {
    const accountFromUrl = searchParams.get("account");
    const success = searchParams.get("success");
    const refresh = searchParams.get("refresh");

    if (accountFromUrl) {
      setAccountId(accountFromUrl);
      // Automatically fetch status if we have an account ID
      fetchAccountStatus(accountFromUrl);

      if (success === "true") {
        toast.success("Onboarding completed! Checking your account status...");
      } else if (refresh === "true") {
        toast.info("Please continue your onboarding process.");
      }
    }

    // Also check localStorage for previously created account
    const savedAccountId = localStorage.getItem("stripe_connected_account_id");
    if (savedAccountId && !accountFromUrl) {
      setAccountId(savedAccountId);
      fetchAccountStatus(savedAccountId);
    }
  }, [searchParams]);

  /**
   * Create a new connected account
   */
  const handleCreateAccount = async () => {
    if (!email || !businessName) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke("stripe-connect-account", {
        body: {
          email,
          businessName,
          country: "BR", // Default to Brazil
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      const newAccountId = data.accountId;
      setAccountId(newAccountId);
      
      // Save to localStorage for persistence
      localStorage.setItem("stripe_connected_account_id", newAccountId);
      
      toast.success("Account created successfully!");
      
      // Fetch initial status
      await fetchAccountStatus(newAccountId);
    } catch (error) {
      console.error("Error creating account:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create account");
    } finally {
      setIsCreating(false);
    }
  };

  /**
   * Fetch account status from Stripe API
   * This is called directly from the API, not stored in database
   */
  const fetchAccountStatus = async (id: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("stripe-connect-account-status", {
        body: { accountId: id },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      setAccountStatus(data.account);
    } catch (error) {
      console.error("Error fetching account status:", error);
      toast.error("Failed to fetch account status");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Start or continue the onboarding process
   */
  const handleStartOnboarding = async () => {
    if (!accountId) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("stripe-connect-onboarding", {
        body: { accountId },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      // Redirect to Stripe's hosted onboarding
      window.location.href = data.url;
    } catch (error) {
      console.error("Error starting onboarding:", error);
      toast.error(error instanceof Error ? error.message : "Failed to start onboarding");
      setIsLoading(false);
    }
  };

  /**
   * Get status badge based on onboarding state
   */
  const getStatusBadge = () => {
    if (!accountStatus) return null;

    const statusConfig = {
      not_started: { label: "Not Started", variant: "secondary" as const },
      in_progress: { label: "In Progress", variant: "default" as const },
      complete: { label: "Complete", variant: "default" as const },
      restricted: { label: "Restricted", variant: "destructive" as const },
    };

    const config = statusConfig[accountStatus.onboarding_status];
    return (
      <Badge variant={config.variant} className={accountStatus.onboarding_status === "complete" ? "bg-green-600" : ""}>
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container max-w-2xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Stripe Connect Onboarding
          </h1>
          <p className="text-muted-foreground">
            Create your connected account to start accepting payments
          </p>
        </div>

        {/* Create Account Form */}
        {!accountId && (
          <Card>
            <CardHeader>
              <CardTitle>Create Connected Account</CardTitle>
              <CardDescription>
                Enter your details to create a Stripe connected account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name</Label>
                <Input
                  id="businessName"
                  placeholder="Your Business Name"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                />
              </div>
              <Button
                className="w-full"
                onClick={handleCreateAccount}
                disabled={isCreating}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Account Status */}
        {accountId && (
          <div className="space-y-6">
            {/* Status Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Account Status</CardTitle>
                  {getStatusBadge()}
                </div>
                <CardDescription>
                  Account ID: <code className="text-xs bg-muted px-1 py-0.5 rounded">{accountId}</code>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoading && !accountStatus ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : accountStatus ? (
                  <>
                    {/* Capabilities Status */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        {accountStatus.charges_enabled ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-amber-500" />
                        )}
                        <span>Can Accept Payments</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {accountStatus.payouts_enabled ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-amber-500" />
                        )}
                        <span>Can Receive Payouts</span>
                      </div>
                    </div>

                    {/* Requirements */}
                    {accountStatus.requirements.currently_due.length > 0 && (
                      <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                        <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-2">
                          Required Information
                        </h4>
                        <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
                          {accountStatus.requirements.currently_due.slice(0, 5).map((req) => (
                            <li key={req}>• {req.replace(/_/g, " ")}</li>
                          ))}
                          {accountStatus.requirements.currently_due.length > 5 && (
                            <li>• And {accountStatus.requirements.currently_due.length - 5} more...</li>
                          )}
                        </ul>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => fetchAccountStatus(accountId)}
                        disabled={isLoading}
                      >
                        <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                        Refresh Status
                      </Button>

                      {accountStatus.onboarding_status !== "complete" && (
                        <Button onClick={handleStartOnboarding} disabled={isLoading}>
                          {accountStatus.onboarding_status === "not_started"
                            ? "Start Onboarding"
                            : "Continue Onboarding"}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </>
                ) : null}
              </CardContent>
            </Card>

            {/* Next Steps for Completed Accounts */}
            {accountStatus?.onboarding_status === "complete" && (
              <Card className="border-green-200 dark:border-green-800">
                <CardHeader>
                  <CardTitle className="text-green-700 dark:text-green-300 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Onboarding Complete!
                  </CardTitle>
                  <CardDescription>
                    Your account is ready to accept payments
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    You can now create products and start selling through your storefront.
                  </p>
                  <div className="flex gap-3">
                    <Button asChild>
                      <Link to={`/connect/products?account=${accountId}`}>
                        Manage Products
                      </Link>
                    </Button>
                    <Button variant="outline" asChild>
                      <Link to={`/store/${accountId}`}>
                        <Store className="mr-2 h-4 w-4" />
                        View Storefront
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Reset Option */}
            <div className="text-center">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
                onClick={() => {
                  localStorage.removeItem("stripe_connected_account_id");
                  setAccountId(null);
                  setAccountStatus(null);
                }}
              >
                Create a Different Account
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
