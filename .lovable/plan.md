
## Hvad loggen fortæller (hvorfor den “hænger”)
Du har nu en vigtig ledetråd i loggen:

- Admin finder **user_peer_id** via realtime/polling: `9f0eb978-...`
- Booking-status i DB “hopper” mellem `in_progress` og `waiting_for_technician`
- UI bliver ved med **Status: Connecting...**

Jeg har tjekket koden, og der er især to konkrete fejlmønstre, som passer præcist på det du ser:

### A) `isConnecting` bliver aldrig sat tilbage til `false` efter PeerJS init
I `usePeerConnection.initializePeer()` sættes `isConnecting=true` når PeerJS initialiseres, men når `peer.on('open')` sker (og admin_peer_id bliver gemt korrekt), bliver `isConnecting` ikke nulstillet igen.

Konsekvens:
- UI viser “Connecting…” konstant
- Auto-call effekten kræver `!state.isConnecting`, så admin **kommer aldrig til at ringe op** selvom `remotePeerId` findes.

### B) Timeout-logikken kan fejle pga. forkert betingelse (`call.open`)
Hvis et kald faktisk bliver startet, bruger timeout’en dette check:
`callRef.current === call && !callRef.current?.open`

Men `open` kan blive `true` før `stream` eventet kommer (eller hvis `stream` aldrig kommer), hvilket kan betyde at timeout aldrig “slår igennem”, og admin kan hænge i connecting uden fejlbesked.

### C) Booking-status bliver overskrevet af user-flow
`useRemoteSupportSession.joinSession()` skriver altid `status='waiting_for_technician'`.
Hvis admin allerede har sat `in_progress`, kan brugerens “join” (eller reload) overskrive den tilbage, så DB-status bliver forvirrende og kan trigge forkert UI/tilstand.

---

## Mål
1) Admin skal **altid** enten:
- modtage stream (success), eller
- få en tydelig fejl/timeout (fail) – aldrig hænge uendeligt.

2) Tab/Vindue/Skærm skal være “Alt OK”, men vi skal:
- detektere typen (browser/window/monitor)
- vise det i debug/UI
- give klar besked hvis stream er tom/stoppet

---

## Ændringer vi implementerer

### 1) Fix `isConnecting` state-maskinen (kritisk)
**Fil:** `src/hooks/usePeerConnection.ts`

- Efter `peer.on('open')` og efter vi har sat `peerId`/subscribet:
  - sæt `isConnecting: false`
  - sæt en mere korrekt “klar men ikke i call” status (fx `connectionStatus: 'idle'` eller en ny status hvis vi vælger det)

Så auto-call effekten kan trigge, og UI stopper med at vise “Connecting…” når PeerJS bare er klar.

### 2) Gør timeout robust (uafhængig af `call.open`)
**Fil:** `src/hooks/usePeerConnection.ts`

- Indfør en ref fx `hasReceivedRemoteStreamRef`
  - `false` når call starter
  - `true` når `call.on('stream')` fires
- Timeout betingelse bliver:
  - “hvis vi stadig er i samme call og endnu ikke har modtaget stream”  
  i stedet for at kigge på `call.open`.

Resultat: hvis stream aldrig kommer (uanset ICE/call open), får admin en timeout + “Prøv igen”.

### 3) Vis korrekt fase: calling vs ICE vs waiting_for_stream
**Fil:** `src/hooks/usePeerConnection.ts` + (små) `src/pages/RemoteSupport.tsx`

- Når admin starter call: `connectionStatus='calling'`
- Når ICE state går til `checking`: sæt `connectionStatus='ice_checking'`
- Hvis ICE bliver `connected` men vi stadig mangler stream: sæt `connectionStatus='waiting_for_stream'` (valgfrit, men giver bedre UI)

Resultat: UI-teksten (“Ringer… / Forhandler netværk… / Venter på skærmdeling…”) bliver reelt meningsfuld.

### 4) Gør getDisplayMedia “Alt OK” og mere stabilt
**Fil:** `src/hooks/usePeerConnection.ts`

I dag står der en kommentar om at vi “ikke begrænser displaySurface”, men koden sender stadig `displaySurface: 'monitor'`.

Vi ændrer til mere neutral og stabil tilgang:
- `getDisplayMedia({ video: true, audio: true })` (evt. med frameRate “nice-to-have”)
- Efter capture:
  - valider at der findes video track og at den er `readyState='live'`
  - log + gem `displaySurface` (browser/window/monitor/unknown)

Resultat: Tab- eller vinduesdeling skal fungere lige så godt som skærm, og vi undgår unødvendige hints der kan give mærkelige chooser-resultater.

### 5) Ryd op hvis brugeren stopper deling (undgå “stale” peer id)
**Fil:** `src/hooks/usePeerConnection.ts`

Når brugeren stopper skærmdeling (`track.onended`):
- vi sætter allerede `screenShareReady=false` lokalt
- vi tilføjer også: nulstil `user_peer_id` i DB (og evt. status tilbage til “waiting”-agtig)  
  så admin ikke står og forsøger at ringe til en peer der ikke kan svare med stream.

Resultat: færre “ghost connects” og tydeligere state.

### 6) Stop status-flip i booking (forvirrer debugging og flow)
**Fil:** `src/hooks/useRemoteSupportSession.ts`

Opdater `joinSession()` så den **ikke** overskriver adminens `in_progress`.
Eksempel-tilgang:
- kun sæt `waiting_for_technician` hvis status er `pending/confirmed`
- hvis den allerede er `in_progress`, lad DB-status være i fred (men UI kan stadig vise “del din skærm”)

Resultat: DB-status bliver stabil, og admin-side kan stole mere på den.

---

## Testplan (det du kan gøre bagefter)
1) Åbn booking som bruger (ikke admin):
   - klik “Del skærm”
   - vælg “vindue” eller “fane”
   - i debug skal du se: `Type: Vindue` eller `Type: Fane` og “Screen Share: Active”

2) Åbn samme booking som admin:
   - du skal nu se:
     - kort: “Bruger klar – forbindelse oprettes automatisk”
     - derefter: “Ringer til bruger…”
     - derefter enten video, eller en tydelig timeout efter 15 sek.

3) Hvis det fejler:
   - debug-panelet skal vise ICE state + connectionStatus, så vi kan se om det er “ICE failed” vs “stream aldrig kom”.

---

## Leverance (hvilke filer vi ændrer)
- `src/hooks/usePeerConnection.ts` (hovedfix: state-machine, timeout, getDisplayMedia, onended cleanup, bedre status)
- `src/hooks/useRemoteSupportSession.ts` (joinSession status-guard)
- (evt. små justeringer) `src/pages/RemoteSupport.tsx` hvis vi vil mappe flere status-tekster eller håndtere “peer init vs call” skarpere

---

## Hvorfor dette også adresserer Tab vs Vindue spørgsmålet
Tab/vindue/skærm er normalt ikke årsagen til at PeerJS ikke leverer `stream`-eventet. Det er mere et “connection lifecycle”-problem.  
Når ovenstående fixes er på plads:
- hvis tab/vindue-streamen er valid, vil den blive sendt og modtaget
- hvis streamen er tom/stoppet/ikke live, får du en tydelig fejl/timeout i stedet for “evig connecting”.
