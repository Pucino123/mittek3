

# Plan: Aktiver automatisk off-session 3D Secure ved trial-tilmelding

## Baggrund
Stripe understøtter "off-session" betalinger, hvor 3D Secure kun kræves ved første tilmelding. Når kunden har godkendt betalingsmetoden under checkout, kan Stripe trække fremtidige betalinger automatisk – uden ny autentificering.

## Hvad der skal ændres

### Fil: `supabase/functions/create-checkout/index.ts`

Tilføj disse parametre til `sessionParams`:

```typescript
payment_method_options: {
  card: {
    request_three_d_secure: 'any',
  },
},
```

Denne indstilling sikrer at 3D Secure altid køres ved checkout, hvilket giver Stripe den nødvendige tilladelse til at trække fremtidige betalinger uden ny autentificering.

### Fuldt opdateret sessionParams objekt

```typescript
const sessionParams: Stripe.Checkout.SessionCreateParams = {
  customer: customerId,
  customer_email: customerId ? undefined : sanitizedEmail,
  locale: "da",
  line_items: [
    {
      price: priceId,
      quantity: 1,
    },
  ],
  mode: "subscription",
  payment_method_collection: "always",
  payment_method_options: {
    card: {
      request_three_d_secure: 'any',  // Kræv 3DS ved checkout
    },
  },
  subscription_data: {
    trial_period_days: 14,
  },
  success_url: `${origin}/finish-signup?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${origin}/pricing`,
  allow_promotion_codes: true,
  tax_id_collection: { enabled: true },
  custom_text: {
    submit: {
      message: "Alle priser er inkl. 25% dansk moms. Du modtager en kvittering på email efter køb.",
    },
  },
  metadata: {
    plan_tier: sanitizedPlanTier,
  },
};
```

## Teknisk forklaring

- **`request_three_d_secure: 'any'`** – Stripe vil altid køre 3D Secure under checkout (også ved trial), selvom der ikke trækkes penge endnu
- Dette giver Stripe et "mandate" (en godkendelse) til at trække fremtidige betalinger off-session
- Når trial udløber, kan Stripe derefter trække pengene automatisk – uden at kunden skal gøre noget

## Vigtig bemærkning

Selvom dette reducerer antallet af afviste betalinger markant, er der stadig edge cases hvor banken kan kræve ny autentificering:
- Hvis kundens kort udløber og de tilføjer et nyt
- Hvis banken har særlige sikkerhedsregler
- Hvis kunden ændrer betalingsmetode

Derfor er det stadig en god idé at beholde den planlagte `invoice.payment_action_required` webhook-håndtering som fallback.

## Resultat efter implementation

1. Kunde tilmelder sig trial og gennemfører 3D Secure ved checkout
2. 14 dage senere trækker Stripe automatisk første betaling – uden ny 3D Secure
3. Efterfølgende månedlige betalinger kører også automatisk

