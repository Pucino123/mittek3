import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Price IDs for each tier
const PRICE_IDS: Record<string, string> = {
  basic: "price_1SnaktFGReA91a36bgrnCm3K",
  plus: "price_1Snal6FGReA91a36Aa1pYpBZ",
  pro: "price_1SnalFFGReA91a36Cx0v5cHW",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[MANAGE-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      logStep("No authorization header");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData.user) {
      logStep("Authentication failed", { error: userError?.message });
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }
    
    const user = userData.user;
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const { action, subscription_id, new_plan_tier } = await req.json();
    
    logStep("Request received", { action, subscription_id, new_plan_tier });

    // Get user's subscription from DB (include both active and trialing)
    const { data: subData, error: subError } = await supabaseClient
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .in("status", ["active", "trialing"])
      .order("created_at", { ascending: false })
      .maybeSingle();

    if (subError) {
      logStep("Error fetching subscription", subError);
      throw new Error("Could not fetch subscription");
    }

    // Get Stripe customer ID
    let customerId: string | null = subData?.stripe_customer_id || null;
    
    if (!customerId && user.email) {
      const customers = await stripe.customers.list({ email: user.email, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
      }
    }

    logStep("Customer found", { customerId, hasActiveSubscription: !!subData });

    switch (action) {
      case "change_plan": {
        if (!subData?.stripe_subscription_id) {
          // User has a subscription but it's not linked to Stripe (e.g., manually granted)
          return new Response(JSON.stringify({ 
            success: false,
            error: "not_stripe_linked",
            message: "Dit abonnement er ikke forbundet til Stripe. Kontakt support for at ændre din pakke."
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }

        const newPriceId = PRICE_IDS[new_plan_tier];
        if (!newPriceId) {
          return new Response(JSON.stringify({ 
            success: false,
            error: "invalid_plan",
            message: `Ugyldig pakke: ${new_plan_tier}`
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }

        // Retrieve current subscription to get the item ID
        const currentSub = await stripe.subscriptions.retrieve(subData.stripe_subscription_id);
        const currentItemId = currentSub.items.data[0]?.id;

        if (!currentItemId) {
          return new Response(JSON.stringify({ 
            success: false,
            error: "no_subscription_item",
            message: "Kunne ikke finde abonnementsdetaljer. Kontakt support."
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }

        // Update the subscription with the new price
        const updatedSub = await stripe.subscriptions.update(subData.stripe_subscription_id, {
          items: [
            {
              id: currentItemId,
              price: newPriceId,
            },
          ],
          proration_behavior: "always_invoice",
        });

        logStep("Subscription updated", { 
          subscriptionId: updatedSub.id, 
          newPlanTier: new_plan_tier 
        });

        // Safely handle current_period_end which might be undefined or null
        const periodEnd = updatedSub.current_period_end 
          ? new Date(updatedSub.current_period_end * 1000).toISOString()
          : null;

        return new Response(JSON.stringify({ 
          success: true, 
          message: "Plan changed successfully",
          subscription: {
            id: updatedSub.id,
            status: updatedSub.status,
            current_period_end: periodEnd,
          }
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      case "cancel_subscription": {
        if (!subData?.stripe_subscription_id) {
          return new Response(JSON.stringify({ 
            success: false,
            error: "not_stripe_linked",
            message: "Dit abonnement er ikke forbundet til Stripe. Kontakt support for at opsige."
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }

        // Cancel at period end (don't immediately revoke access)
        const cancelledSub = await stripe.subscriptions.update(subData.stripe_subscription_id, {
          cancel_at_period_end: true,
        });

        logStep("Subscription cancelled", { 
          subscriptionId: cancelledSub.id,
          cancelAt: cancelledSub.cancel_at 
        });

        return new Response(JSON.stringify({ 
          success: true, 
          message: "Subscription will be cancelled at period end",
          cancel_at: cancelledSub.cancel_at 
            ? new Date(cancelledSub.cancel_at * 1000).toISOString() 
            : new Date(cancelledSub.current_period_end * 1000).toISOString()
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      case "reactivate_subscription": {
        if (!subData?.stripe_subscription_id) {
          return new Response(JSON.stringify({ 
            success: false,
            error: "not_stripe_linked",
            message: "Dit abonnement er ikke forbundet til Stripe. Kontakt support."
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }

        // Remove the cancel_at_period_end flag
        const reactivatedSub = await stripe.subscriptions.update(subData.stripe_subscription_id, {
          cancel_at_period_end: false,
        });

        logStep("Subscription reactivated", { subscriptionId: reactivatedSub.id });

        return new Response(JSON.stringify({ 
          success: true, 
          message: "Subscription reactivated" 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      case "get_invoices": {
        if (!customerId) {
          return new Response(JSON.stringify({ invoices: [] }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }

        const invoices = await stripe.invoices.list({
          customer: customerId,
          limit: 12,
        });

        const formattedInvoices = invoices.data.map((invoice: Stripe.Invoice) => ({
          id: invoice.id,
          date: new Date(invoice.created * 1000).toISOString(),
          amount: invoice.amount_paid,
          currency: invoice.currency,
          status: invoice.status,
          pdf_url: invoice.invoice_pdf,
          hosted_invoice_url: invoice.hosted_invoice_url,
        }));

        logStep("Invoices fetched", { count: formattedInvoices.length });

        return new Response(JSON.stringify({ invoices: formattedInvoices }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      case "get_payment_method": {
        if (!customerId) {
          return new Response(JSON.stringify({ payment_method: null }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }

        const customer = await stripe.customers.retrieve(customerId);
        
        if (customer.deleted) {
          return new Response(JSON.stringify({ payment_method: null }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }

        // Try multiple sources for payment method
        let paymentMethodId: string | null = null;
        
        // 1. Check customer's default payment method
        const customerDefault = (customer as Stripe.Customer).invoice_settings?.default_payment_method;
        if (customerDefault) {
          paymentMethodId = typeof customerDefault === 'string' ? customerDefault : customerDefault.id;
        }
        
        // 2. If not found, check the subscription's default payment method
        if (!paymentMethodId && subData?.stripe_subscription_id) {
          try {
            const subscription = await stripe.subscriptions.retrieve(subData.stripe_subscription_id);
            const subDefault = subscription.default_payment_method;
            if (subDefault) {
              paymentMethodId = typeof subDefault === 'string' ? subDefault : subDefault.id;
            }
          } catch (err) {
            logStep("Could not retrieve subscription for payment method", err);
          }
        }
        
        // 3. If still not found, list customer's payment methods
        if (!paymentMethodId) {
          const paymentMethods = await stripe.paymentMethods.list({
            customer: customerId,
            type: 'card',
            limit: 1,
          });
          if (paymentMethods.data.length > 0) {
            paymentMethodId = paymentMethods.data[0].id;
          }
        }

        if (!paymentMethodId) {
          logStep("No payment method found", { customerId });
          return new Response(JSON.stringify({ payment_method: null }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }

        const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

        logStep("Payment method fetched", { 
          brand: paymentMethod.card?.brand, 
          last4: paymentMethod.card?.last4 
        });

        return new Response(JSON.stringify({ 
          payment_method: {
            brand: paymentMethod.card?.brand,
            last4: paymentMethod.card?.last4,
            exp_month: paymentMethod.card?.exp_month,
            exp_year: paymentMethod.card?.exp_year,
          }
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
