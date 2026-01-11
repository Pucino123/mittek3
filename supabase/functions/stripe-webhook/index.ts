import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2025-08-27.basil",
});

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  { auth: { persistSession: false } }
);

// Product ID to plan tier mapping
const PRODUCT_TIER_MAP: Record<string, string> = {
  "prod_Tl6ynRCM8KbUL6": "basic",
  "prod_Tl6zZq8UNBdnPN": "plus",
  "prod_Tl6zLUM9nEq1TX": "pro",
};

const PLAN_LABELS: Record<string, string> = {
  basic: "Basis",
  plus: "Plus",
  pro: "Pro",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

async function sendUpgradeEmail(email: string, planTier: string) {
  const planLabel = PLAN_LABELS[planTier] || planTier;
  
  try {
    const { error } = await resend.emails.send({
      from: "MitTek <noreply@mittek.dk>",
      to: [email],
      subject: "Tak for din opgradering – Nu er du bedre beskyttet",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #1a365d; margin-bottom: 24px;">Velkommen til ${planLabel}! 🎉</h1>
          
          <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">
            Tak fordi du har opgraderet din konto. Du har nu adgang til disse ekstra funktioner:
          </p>
          
          <ul style="color: #4a5568; font-size: 16px; line-height: 1.8; padding-left: 20px;">
            <li><strong>Krypteret Kode-mappe</strong> – Gem dine adgangskoder sikkert</li>
            <li><strong>Svindel-tjek</strong> – Lad os tjekke mistænkelige beskeder for dig</li>
            <li><strong>Screenshot hjælp</strong> – Tag et billede, og få vejledning med det samme</li>
          </ul>
          
          <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin-top: 24px;">
            Har du spørgsmål? Du kan altid skrive til os, så hjælper vi dig.
          </p>
          
          <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin-top: 32px;">
            Venlig hilsen,<br>
            <strong>Holdet bag MitTek</strong>
          </p>
        </div>
      `,
    });

    if (error) {
      logStep("ERROR sending upgrade email", error);
    } else {
      logStep("Upgrade email sent", { email, planTier });
    }
  } catch (err) {
    logStep("ERROR sending upgrade email", { message: err instanceof Error ? err.message : String(err) });
  }
}

async function sendCancellationEmail(email: string) {
  try {
    const { error } = await resend.emails.send({
      from: "MitTek <noreply@mittek.dk>",
      to: [email],
      subject: "Bekræftelse på opsigelse",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #1a365d; margin-bottom: 24px;">Din opsigelse er bekræftet</h1>
          
          <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">
            Vi har modtaget din opsigelse. Du har stadig adgang til alle funktioner indtil din nuværende periode udløber.
          </p>
          
          <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin-top: 16px;">
            Vi er kede af at se dig gå. Hvis du ombestemmer dig, er du altid velkommen tilbage.
          </p>
          
          <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin-top: 32px;">
            Venlig hilsen,<br>
            <strong>Holdet bag MitTek</strong>
          </p>
        </div>
      `,
    });

    if (error) {
      logStep("ERROR sending cancellation email", error);
    } else {
      logStep("Cancellation email sent", { email });
    }
  } catch (err) {
    logStep("ERROR sending cancellation email", { message: err instanceof Error ? err.message : String(err) });
  }
}

async function getUserEmailFromSubscription(stripeSubscriptionId: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .select("profiles!inner(email)")
    .eq("stripe_subscription_id", stripeSubscriptionId)
    .single();

  if (error || !data) {
    logStep("Could not find user email for subscription", { stripeSubscriptionId, error });
    return null;
  }

  return (data as any).profiles?.email || null;
}

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    logStep("ERROR: No stripe-signature header");
    return new Response(JSON.stringify({ error: "No signature" }), { status: 400 });
  }

  try {
    const body = await req.text();
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    let event: Stripe.Event;
    
    if (webhookSecret) {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } else {
      // For testing without webhook secret
      event = JSON.parse(body);
    }

    logStep("Event received", { type: event.type, id: event.id });

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        logStep("Checkout completed", { 
          sessionId: session.id, 
          email: session.customer_email,
          customerId: session.customer 
        });

        // Get the subscription to find the plan tier
        const subscriptionId = session.subscription as string;
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const productId = subscription.items.data[0]?.price?.product as string;
        const planTier = PRODUCT_TIER_MAP[productId] || "basic";

        logStep("Subscription details", { subscriptionId, productId, planTier });

        // Insert into pending_subscriptions
        const { error: insertError } = await supabaseAdmin
          .from("pending_subscriptions")
          .insert({
            checkout_session_id: session.id,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: subscriptionId,
            purchaser_email: session.customer_email || session.customer_details?.email || "",
            plan_tier: planTier,
            claimed: false,
          });

        if (insertError) {
          logStep("ERROR: Failed to insert pending subscription", insertError);
          throw insertError;
        }

        logStep("Pending subscription created");
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const previousAttributes = (event.data as any).previous_attributes;
        
        logStep("Subscription updated", { 
          subscriptionId: subscription.id,
          status: subscription.status,
          previousAttributes
        });

        // Get new plan tier
        const productId = subscription.items.data[0]?.price?.product as string;
        const newPlanTier = PRODUCT_TIER_MAP[productId] || "basic";

        // Map subscription status including trialing
        const mapStatus = (stripeStatus: string) => {
          switch (stripeStatus) {
            case "active": return "active";
            case "trialing": return "trialing";
            case "canceled": return "canceled";
            case "past_due": return "past_due";
            default: return "incomplete";
          }
        };

        // Update existing subscription in subscriptions table
        const { error: updateError } = await supabaseAdmin
          .from("subscriptions")
          .update({
            status: mapStatus(subscription.status),
            plan_tier: newPlanTier,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
            trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
            trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
          })
          .eq("stripe_subscription_id", subscription.id);

        if (updateError) {
          logStep("ERROR updating subscription", updateError);
        } else {
          logStep("Subscription updated in DB");
        }

        // Send upgrade email if plan changed to plus or pro
        if (previousAttributes?.items && (newPlanTier === "plus" || newPlanTier === "pro")) {
          const userEmail = await getUserEmailFromSubscription(subscription.id);
          if (userEmail) {
            await sendUpgradeEmail(userEmail, newPlanTier);
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Subscription deleted", { 
          subscriptionId: subscription.id,
          status: subscription.status 
        });

        // Update existing subscription in subscriptions table
        const { error: updateError } = await supabaseAdmin
          .from("subscriptions")
          .update({
            status: "canceled",
            cancel_at_period_end: true,
          })
          .eq("stripe_subscription_id", subscription.id);

        if (updateError) {
          logStep("ERROR updating subscription", updateError);
        } else {
          logStep("Subscription marked as canceled in DB");
        }

        // Send cancellation email
        const userEmail = await getUserEmailFromSubscription(subscription.id);
        if (userEmail) {
          await sendCancellationEmail(userEmail);
        }
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (error) {
    logStep("ERROR", { message: error instanceof Error ? error.message : String(error) });
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 400,
    });
  }
});
