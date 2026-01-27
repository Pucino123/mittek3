
# Plan: Robust Remote Support Connection

## Problem
Admin-siden hænger på "Opretter forbindelse..." selv når begge peer-IDs er tilgængelige i databasen. PeerJS-kaldet starter, men `call.on('stream')` eventet fyrer aldrig.

## Hovedårsager
1. **Ingen timeout**: Når WebRTC-handshake fejler, sidder admin fast uden feedback
2. **Ingen stream-validering**: Brugerens stream kan være tom/stoppet før admin kalder
3. **Hårkodet `displaySurface: 'monitor'`**: Dette er kun et hint - brugeren kan vælge tab/vindue, og vi validerer ikke resultatet
4. **Manglende ICE-candidate logging**: Svært at debugge om det er netværk eller stream-problem

## Løsning

### Del 1: Tilføj Connection Timeout (usePeerConnection.ts)
- Tilføj 15-sekunders timeout på `call.on('stream')`
- Hvis timeout: sæt `isConnecting = false`, vis fejlbesked, tillad retry
- Admin får klar besked: "Forbindelse timeout - brugerens skærm modtages ikke"

### Del 2: Valider Stream før PeerJS initialiseres (usePeerConnection.ts)
- Efter `getDisplayMedia()`: tjek at stream har aktive video-tracks
- Log `MediaStreamTrack.getSettings().displaySurface` for at se hvad brugeren valgte
- Hvis ingen video: vis fejl med tydeligt "Prøv igen" knap

### Del 3: Detect og log stream-typen (usePeerConnection.ts)
- Brug `track.getSettings().displaySurface` til at identificere tab vs. window vs. screen
- Log typen i konsol og optionelt i UI (debug panel)
- Da "Alt er OK", viser vi blot hvad der blev valgt - ingen blokering

### Del 4: Forbedret Admin UI feedback (RemoteSupport.tsx)
- Vis specifik status under "Opretter forbindelse...":
  - "Venter på brugerens stream..."
  - "ICE negotiation..."
  - "Timeout - ingen video modtaget"
- Tilføj "Genopret forbindelse" knap som altid er synlig under connecting-state

### Del 5: ICE Candidate debugging (usePeerConnection.ts)
- Tilføj `call.peerConnection.oniceconnectionstatechange` event listener
- Log ICE-state ændringer: `checking` -> `connected` / `failed`
- Hvis ICE state bliver `failed` eller `disconnected`: trigger retry-logik

## Tekniske ændringer

### usePeerConnection.ts
```text
- Linje 229-234: Opdater getDisplayMedia constraints (fjern hardcoded displaySurface)
- Linje 236-244: Tilføj track.getSettings() logging for type-detektion
- Linje 462-527: Tilføj timeout-wrapper omkring call.on('stream')
- Ny hjælpefunktion: setupIceConnectionMonitoring()
```

### RemoteSupport.tsx
```text
- Linje 640-655: Udvid connecting-state UI med specifik status
- Linje 767-774: Tilføj "Afbryd forsøg" knap under connecting
```

### DebugInfo.tsx
```text
- Tilføj visning af stream-type (tab/window/screen) hvis tilgængelig
- Tilføj ICE connection state
```

## Forventet resultat
- Admin får timeout-besked efter 15 sekunder hvis stream ikke modtages
- Logning af præcis hvad brugeren deler (fane/vindue/skærm)
- "Genopret forbindelse" fungerer selv under connecting-state
- Bedre diagnostik i debug-panelet

## Risici og mitigering
- **Timeout for kort**: 15 sek. bør være nok for de fleste netværk - kan justeres
- **Browser-kompatibilitet**: `getSettings().displaySurface` er ikke 100% supported i alle browsere - graceful fallback til "Ukendt type"
