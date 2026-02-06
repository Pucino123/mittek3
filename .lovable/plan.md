

# Plan: Håndter SCA/3D Secure "authentication_required" fejl

## Problem
Stripe returnerer `authentication_required` decline code, når banken kræver ekstra autentificering (3D Secure / SCA). Dette sker typisk:
- Ved abonnementsfornyelse efter 14-dages prøveperiode
- Ved europæiske kort (PSD2-krav)
- Når banken kræver verificering

## Årsag
Din nuværende webhook (`stripe-webhook`) håndterer kun:
- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`

Men den **mangler** håndtering af:
- `invoice.payment_action_required` – når 3D Secure er påkrævet
- `invoice.payment_failed` – når betaling fejler

## Løsning

### 1. Udvid stripe-webhook til at håndtere payment-events
**Fil:** `supabase/functions/stripe-webhook/index.ts`

Tilføj håndtering af disse events:

```text
case "invoice.payment_action_required":
  // Kunden skal gennemføre 3D Secure
  // Send email med link til Stripe Hosted Invoice page
  
case "invoice.payment_failed":
  // Betaling fejlede
  // Marker subscription som "past_due"
  // Send email til kunden med payment link
```

### 2. Send email med betalingslink når SCA kræves
Når `invoice.payment_action_required` modtages:
- Hent `invoice.hosted_invoice_url` fra Stripe
- Send email til kunden via Resend med link
- Kunden klikker på linket og gennemfører 3D Secure i Stripe's UI

### 3. Registrer webhooks i Stripe Dashboard
Du skal tilføje disse events til din webhook i Stripe:
- `invoice.payment_action_required`
- `invoice.payment_failed`
- `invoice.paid` (bekræft succesfuld betaling)

### 4. Marker abonnement som "past_due" ved fejl
Når betaling fejler, opdater `subscriptions` tabellen:
```sql
status = 'past_due'
```
Dette giver dig mulighed for at vise en besked i UI til brugeren.

## Tekniske ændringer

### stripe-webhook/index.ts
```text
Tilføj nye cases:

case "invoice.payment_action_required": {
  const invoice = event.data.object as Stripe.Invoice;
  // Hent kundens email
  // Send email med invoice.hosted_invoice_url
}

case "invoice.payment_failed": {
  const invoice = event.data.object as Stripe.Invoice;
  // Opdater subscription status til "past_due"
  // Send email om fejlet betaling
}

case "invoice.paid": {
  const invoice = event.data.object as Stripe.Invoice;
  // Hvis status var "past_due", sæt tilbage til "active"
}
```

### Ny email-funktion
```text
async function sendPaymentRequiredEmail(email: string, hostedInvoiceUrl: string) {
  // Send email med:
  // - Besked om at betaling kræver godkendelse
  // - Direkte link til Stripe's betalingsside
}
```

## Handlinger i Stripe Dashboard
Efter kodeændringerne skal du:

1. Gå til Stripe Dashboard → Developers → Webhooks
2. Vælg din webhook endpoint
3. Tilføj disse events:
   - `invoice.payment_action_required`
   - `invoice.payment_failed`
   - `invoice.paid`

## Forventet resultat
1. Når prøveperiode udløber og betaling kræver SCA:
   - Kunden modtager email med betalingslink
   - Kunden klikker og gennemfører 3D Secure
   - Stripe sender `invoice.paid` webhook
   - Abonnement forbliver aktivt

2. Hvis betaling fejler:
   - Kunden modtager email med forklaring
   - Abonnement markeres som `past_due`
   - UI kan vise besked om at opdatere betalingsmetode

## Test
Efter implementation:
1. Brug Stripe test-kort der kræver 3D Secure: `4000002500003155`
2. Verificer at email sendes med betalingslink
3. Gennemfør betaling og bekræft at abonnement forbliver aktivt

