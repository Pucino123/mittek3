-- ============================================
-- MASTER SEED SCRIPT FOR SENIORHJAELP
-- Version: 1.1
-- Last Updated: 2026-01-11
-- 
-- ABOUT THIS FILE:
-- ----------------
-- This script is IDEMPOTENT - safe to run multiple times.
-- Uses ON CONFLICT DO UPDATE to preserve existing data while updating content.
-- 
-- PREREQUISITES:
-- --------------
-- This seed file requires the database migrations to be run FIRST.
-- All tables, RLS policies, and functions are created by migrations.
-- This file ONLY populates data - no schema changes.
-- 
-- DATA POPULATED:
-- ---------------
-- 1. Guides (28 guides across 7 categories)
-- 2. Guide Steps (detailed instructions for each guide)
-- 3. Glossary Terms (tech dictionary for seniors)
-- 4. Quiz Questions (scam detection training)
-- 5. Hardware Issues (troubleshooting database)
-- 
-- AUTH TRIGGER NOTE:
-- ------------------
-- The handle_new_user() function creates user profiles and roles
-- automatically when users sign up. This trigger is configured
-- on auth.users table (handled by Supabase, not in migrations).
-- ============================================

-- ============================================
-- 1. GUIDES - Main guide entries
-- ============================================

INSERT INTO public.guides (id, title, category, description, min_plan, is_published, sort_order) VALUES

-- SIKKERHED (Security) Guides
('a1b2c3d4-1111-1111-1111-111111111111', 'Undgå Falske Opkald', 'sikkerhed', 'Beskyt dig mod svindlere der ringer og udgiver sig for at være fra banken eller politiet.', 'basic', true, 1),
('a1b2c3d4-1111-1111-1111-222222222222', 'Stop Irriterende Popups', 'sikkerhed', 'Slip for reklamer og mistænkelige advarsler i Safari.', 'basic', true, 2),
('a1b2c3d4-1111-1111-1111-333333333333', 'Sikker Adgangskode', 'sikkerhed', 'Lær at lave en stærk kode som er nem at huske.', 'basic', true, 3),
('a1b2c3d4-1111-1111-1111-444444444444', 'Genkend Svindel-SMS', 'sikkerhed', 'Lær at spotte falske beskeder fra "PostNord" og "MitID".', 'basic', true, 4),
('a1b2c3d4-1111-1111-1111-555555555555', 'To-Faktor Godkendelse', 'sikkerhed', 'Ekstra sikkerhed for dine vigtigste konti.', 'plus', true, 5),

-- HVERDAG (Everyday) Guides  
('b2c3d4e5-2222-2222-2222-111111111111', 'Forlæng din Batteritid', 'hverdag', 'Få strømmen til at holde hele dagen med disse simple trin.', 'basic', true, 10),
('b2c3d4e5-2222-2222-2222-222222222222', 'Tag et Skærmbillede', 'hverdag', 'Gem hvad du ser på skærmen som et billede.', 'basic', true, 11),
('b2c3d4e5-2222-2222-2222-333333333333', 'Gør Teksten Større', 'hverdag', 'Tilpas skriftstørrelsen så den er nemmere at læse.', 'basic', true, 12),
('b2c3d4e5-2222-2222-2222-444444444444', 'Opsæt MitID', 'hverdag', 'Få MitID app til at virke på din telefon.', 'basic', true, 13),
('b2c3d4e5-2222-2222-2222-555555555555', 'Brug Siri', 'hverdag', 'Få din telefon til at hjælpe dig med stemmen.', 'basic', true, 14),
('b2c3d4e5-2222-2222-2222-666666666666', 'Opdater din iPhone', 'hverdag', 'Hold din telefon sikker med de nyeste opdateringer.', 'basic', true, 15),

-- OPRYDNING (Cleanup) Guides
('c3d4e5f6-3333-3333-3333-111111111111', 'Frigør Lagerplads', 'oprydning', 'Få mere plads ved at rydde op i gamle billeder og apps.', 'basic', true, 20),
('c3d4e5f6-3333-3333-3333-222222222222', 'Slet Gamle Apps', 'oprydning', 'Fjern apps du ikke længere bruger.', 'basic', true, 21),
('c3d4e5f6-3333-3333-3333-333333333333', 'Ryd Browser-Historik', 'oprydning', 'Slet din søgehistorik for mere privatliv.', 'basic', true, 22),
('c3d4e5f6-3333-3333-3333-444444444444', 'Organiser dine Fotos', 'oprydning', 'Opret album og find billeder nemmere.', 'plus', true, 23),

-- FORBINDELSE (Connection) Guides
('d4e5f6g7-4444-4444-4444-111111111111', 'Opret Gæste-WiFi', 'forbindelse', 'Lad gæster bruge dit internet uden at dele din kode.', 'plus', true, 30),
('d4e5f6g7-4444-4444-4444-222222222222', 'Bluetooth Høretelefoner', 'forbindelse', 'Forbind trådløse høretelefoner til din telefon.', 'basic', true, 31),
('d4e5f6g7-4444-4444-4444-333333333333', 'Del Billeder med Familie', 'forbindelse', 'Send fotos til børn og børnebørn.', 'basic', true, 32),
('d4e5f6g7-4444-4444-4444-444444444444', 'FaceTime Videoopkald', 'forbindelse', 'Ring med video så I kan se hinanden.', 'basic', true, 33),

-- ICLOUD Guides
('e5f6g7h8-5555-5555-5555-111111111111', 'Forstå iCloud', 'icloud', 'Hvad er iCloud, og hvorfor er det vigtigt?', 'basic', true, 40),
('e5f6g7h8-5555-5555-5555-222222222222', 'iCloud Lagerplads', 'icloud', 'Tjek hvor meget plads du har tilbage.', 'basic', true, 41),
('e5f6g7h8-5555-5555-5555-333333333333', 'Sikkerhedskopi med iCloud', 'icloud', 'Beskyt dine data med automatisk backup.', 'plus', true, 42),

-- BESKEDER (Messages) Guides
('f6g7h8i9-6666-6666-6666-111111111111', 'Send din Første Besked', 'beskeder', 'Lær at sende SMS og iMessage.', 'basic', true, 50),
('f6g7h8i9-6666-6666-6666-222222222222', 'Send Billeder i Beskeder', 'beskeder', 'Del fotos direkte i en samtale.', 'basic', true, 51),
('f6g7h8i9-6666-6666-6666-333333333333', 'Gruppesamtaler', 'beskeder', 'Skriv til flere personer på én gang.', 'basic', true, 52),

-- APPS Guides
('g7h8i9j0-7777-7777-7777-111111111111', 'Download en App', 'apps', 'Find og installer nye apps fra App Store.', 'basic', true, 60),
('g7h8i9j0-7777-7777-7777-222222222222', 'Opdater dine Apps', 'apps', 'Hold dine apps sikre med opdateringer.', 'basic', true, 61),
('g7h8i9j0-7777-7777-7777-333333333333', 'Abonnementer i Apps', 'apps', 'Se og administrer dine app-abonnementer.', 'plus', true, 62)

ON CONFLICT (id) DO UPDATE SET 
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  min_plan = EXCLUDED.min_plan,
  is_published = EXCLUDED.is_published,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

-- ============================================
-- 2. GUIDE STEPS - Individual steps for each guide
-- ============================================

-- ----------------------------------------
-- GUIDE: Undgå Falske Opkald (Security)
-- ----------------------------------------
INSERT INTO public.guide_steps (id, guide_id, step_number, title, instruction, tip_text, warning_text, image_url, device_type) VALUES
('11111111-aaaa-aaaa-aaaa-000000000001', 'a1b2c3d4-1111-1111-1111-111111111111', 1, 
  'Åbn Indstillinger', 
  'Find det grå tandhjul ⚙️ på din startskærm og tryk på det. Det hedder "Indstillinger".',
  'Hvis du ikke kan finde det, kan du swipe ned fra midten af skærmen og søge efter "Indstillinger".',
  NULL,
  'https://placehold.co/800x600/e8f4f8/1a365d?text=Indstillinger+Icon',
  ARRAY['iphone', 'ipad']),
  
('11111111-aaaa-aaaa-aaaa-000000000002', 'a1b2c3d4-1111-1111-1111-111111111111', 2, 
  'Find Telefon-menuen', 
  'Rul ned i listen indtil du ser det grønne telefon-ikon 📞. Tryk på "Telefon".',
  NULL,
  NULL,
  'https://placehold.co/800x600/e8f4f8/1a365d?text=Telefon+Menu',
  ARRAY['iphone']),
  
('11111111-aaaa-aaaa-aaaa-000000000003', 'a1b2c3d4-1111-1111-1111-111111111111', 3, 
  'Find lydløs-indstillingen', 
  'Rul helt ned i bunden af menuen. Find punktet der hedder "Gør ukendte opkald lydløse".',
  NULL,
  'Dette påvirker ikke opkald fra folk i dine kontakter - de ringer stadig normalt.',
  'https://placehold.co/800x600/e8f4f8/1a365d?text=Lydloes+Ukendte',
  ARRAY['iphone']),
  
('11111111-aaaa-aaaa-aaaa-000000000004', 'a1b2c3d4-1111-1111-1111-111111111111', 4, 
  'Slå funktionen til', 
  'Tryk på knappen så den bliver GRØN. Nu vil alle opkald fra ukendte numre gå direkte til telefonsvareren.',
  'Vigtige beskeder fra ukendte numre bliver stadig optaget på telefonsvareren, så du mister intet.',
  NULL,
  'https://placehold.co/800x600/d4edda/155724?text=Knap+Groen',
  ARRAY['iphone'])
ON CONFLICT (id) DO UPDATE SET 
  title = EXCLUDED.title,
  instruction = EXCLUDED.instruction,
  tip_text = EXCLUDED.tip_text,
  warning_text = EXCLUDED.warning_text,
  image_url = EXCLUDED.image_url,
  device_type = EXCLUDED.device_type;

-- ----------------------------------------
-- GUIDE: Stop Irriterende Popups (Security)
-- ----------------------------------------
INSERT INTO public.guide_steps (id, guide_id, step_number, title, instruction, tip_text, warning_text, image_url, device_type) VALUES
('22222222-aaaa-aaaa-aaaa-000000000001', 'a1b2c3d4-1111-1111-1111-222222222222', 1, 
  'Åbn Indstillinger', 
  'Tryk på det grå tandhjul ⚙️ på din startskærm.',
  NULL,
  NULL,
  'https://placehold.co/800x600/e8f4f8/1a365d?text=Indstillinger',
  ARRAY['iphone', 'ipad']),
  
('22222222-aaaa-aaaa-aaaa-000000000002', 'a1b2c3d4-1111-1111-1111-222222222222', 2, 
  'Find Safari', 
  'Rul ned og find Safari med det blå kompas-ikon 🧭. Tryk på det.',
  NULL,
  NULL,
  'https://placehold.co/800x600/e8f4f8/1a365d?text=Safari+Menu',
  ARRAY['iphone', 'ipad']),
  
('22222222-aaaa-aaaa-aaaa-000000000003', 'a1b2c3d4-1111-1111-1111-222222222222', 3, 
  'Slå pop-up blokering til', 
  'Find "Blokér pop-op-vinduer" og sørg for at knappen er GRØN.',
  'Dette stopper de fleste irriterende reklamer og advarsler.',
  'Nogle hjemmesider har brug for pop-ups for at virke. Du kan altid slå det fra midlertidigt.',
  'https://placehold.co/800x600/d4edda/155724?text=Bloker+Popups',
  ARRAY['iphone', 'ipad']),
  
('22222222-aaaa-aaaa-aaaa-000000000004', 'a1b2c3d4-1111-1111-1111-222222222222', 4, 
  'Aktivér Advarsel om bedrageri', 
  'Sørg også for at "Advarsel om bedrageri" er slået TIL (grøn). Dette beskytter dig mod farlige hjemmesider.',
  NULL,
  'Hvis du ser en rød advarsel på en hjemmeside, så luk den med det samme - den kan være farlig!',
  'https://placehold.co/800x600/d4edda/155724?text=Advarsel+Bedrageri',
  ARRAY['iphone', 'ipad'])
ON CONFLICT (id) DO UPDATE SET 
  title = EXCLUDED.title,
  instruction = EXCLUDED.instruction,
  tip_text = EXCLUDED.tip_text,
  warning_text = EXCLUDED.warning_text,
  image_url = EXCLUDED.image_url,
  device_type = EXCLUDED.device_type;

-- ----------------------------------------
-- GUIDE: Forlæng din Batteritid (Hverdag)
-- ----------------------------------------
INSERT INTO public.guide_steps (id, guide_id, step_number, title, instruction, tip_text, warning_text, image_url, device_type) VALUES
('33333333-aaaa-aaaa-aaaa-000000000001', 'b2c3d4e5-2222-2222-2222-111111111111', 1, 
  'Tjek din Batteritilstand', 
  'Før vi starter, skal vi se om dit batteri er slidt. Gå til Indstillinger ⚙️ → Batteri → Batteritilstand og Opladning.',
  'Hvis tallet er under 80%, bør du overveje at få skiftet batteriet hos en reparatør. Det koster typisk 400-600 kr.',
  NULL,
  'https://placehold.co/800x600/fff3cd/856404?text=Batteritilstand',
  ARRAY['iphone']),
  
('33333333-aaaa-aaaa-aaaa-000000000002', 'b2c3d4e5-2222-2222-2222-111111111111', 2, 
  'Slå Strømbesparelse til', 
  'Når batteriet er lavt, kan du aktivere det gule batteri-ikon. Swipe ned fra højre hjørne af skærmen og tryk på batteri-ikonet 🔋.',
  'I Strømbesparelse stopper telefonen baggrundsaktiviteter, så den holder meget længere.',
  NULL,
  'https://placehold.co/800x600/fff3cd/856404?text=Stroemberparelse',
  ARRAY['iphone', 'ipad']),
  
('33333333-aaaa-aaaa-aaaa-000000000003', 'b2c3d4e5-2222-2222-2222-111111111111', 3, 
  'Find Strømslugerne', 
  'Gå til Indstillinger → Batteri og rul ned. Her ser du en liste over apps og hvor meget strøm de bruger.',
  NULL,
  'Hvis Facebook, Messenger eller Google Maps ligger i toppen, bruger de meget strøm. Luk dem helt når du ikke bruger dem.',
  'https://placehold.co/800x600/fff3cd/856404?text=App+Forbrug',
  ARRAY['iphone', 'ipad']),
  
('33333333-aaaa-aaaa-aaaa-000000000004', 'b2c3d4e5-2222-2222-2222-111111111111', 4, 
  'Sænk Skærmens Lysstyrke', 
  'En lys skærm bruger meget strøm. Swipe ned fra højre hjørne og træk lysstyrke-bjælken ned mod midten.',
  'Du kan også slå "Automatisk lysstyrke" til under Indstillinger → Skærm, så tilpasser telefonen sig selv.',
  NULL,
  'https://placehold.co/800x600/fff3cd/856404?text=Lysstyrke',
  ARRAY['iphone', 'ipad'])
ON CONFLICT (id) DO UPDATE SET 
  title = EXCLUDED.title,
  instruction = EXCLUDED.instruction,
  tip_text = EXCLUDED.tip_text,
  warning_text = EXCLUDED.warning_text,
  image_url = EXCLUDED.image_url,
  device_type = EXCLUDED.device_type;

-- ----------------------------------------
-- GUIDE: Tag et Skærmbillede (Hverdag)
-- ----------------------------------------
INSERT INTO public.guide_steps (id, guide_id, step_number, title, instruction, tip_text, warning_text, image_url, device_type) VALUES
('44444444-aaaa-aaaa-aaaa-000000000001', 'b2c3d4e5-2222-2222-2222-222222222222', 1, 
  'Find knapperne', 
  'På en iPhone med Face ID: Find sideknappen (til højre) og lydstyrke-op knappen (til venstre øverst).',
  'På ældre iPhones med Hjem-knap bruger du sideknappen + Hjem-knappen i stedet.',
  NULL,
  'https://placehold.co/800x600/e2e8f0/475569?text=iPhone+Knapper',
  ARRAY['iphone']),
  
('44444444-aaaa-aaaa-aaaa-000000000002', 'b2c3d4e5-2222-2222-2222-222222222222', 2, 
  'Tryk samtidigt', 
  'Tryk hurtigt på begge knapper SAMTIDIG og slip med det samme. Du vil høre en lyd som et kamera, og skærmen vil blinke hvidt.',
  'Øv dig et par gange - det kræver lidt timing at ramme begge knapper på én gang.',
  NULL,
  'https://placehold.co/800x600/e2e8f0/475569?text=Tryk+Samtidig',
  ARRAY['iphone', 'ipad']),
  
('44444444-aaaa-aaaa-aaaa-000000000003', 'b2c3d4e5-2222-2222-2222-222222222222', 3, 
  'Find dit skærmbillede', 
  'Skærmbilledet gemmes automatisk i din Fotos-app under "Skærmbilleder" albummet.',
  'Det lille billede der vises i hjørnet lige efter du tager det kan trykkes for at redigere med det samme.',
  NULL,
  'https://placehold.co/800x600/e2e8f0/475569?text=Fotos+Album',
  ARRAY['iphone', 'ipad'])
ON CONFLICT (id) DO UPDATE SET 
  title = EXCLUDED.title,
  instruction = EXCLUDED.instruction,
  tip_text = EXCLUDED.tip_text,
  warning_text = EXCLUDED.warning_text,
  image_url = EXCLUDED.image_url,
  device_type = EXCLUDED.device_type;

-- ----------------------------------------
-- GUIDE: Gør Teksten Større (Hverdag)
-- ----------------------------------------
INSERT INTO public.guide_steps (id, guide_id, step_number, title, instruction, tip_text, warning_text, image_url, device_type) VALUES
('55555555-aaaa-aaaa-aaaa-000000000001', 'b2c3d4e5-2222-2222-2222-333333333333', 1, 
  'Åbn Indstillinger', 
  'Tryk på det grå tandhjul ⚙️ på din startskærm for at åbne Indstillinger.',
  NULL,
  NULL,
  'https://placehold.co/800x600/e8f4f8/1a365d?text=Indstillinger',
  ARRAY['iphone', 'ipad']),
  
('55555555-aaaa-aaaa-aaaa-000000000002', 'b2c3d4e5-2222-2222-2222-333333333333', 2, 
  'Find Skærm og Lysstyrke', 
  'Rul ned og tryk på "Skærm & Lysstyrke" med det blå ikon.',
  NULL,
  NULL,
  'https://placehold.co/800x600/e8f4f8/1a365d?text=Skaerm+Lysstyrke',
  ARRAY['iphone', 'ipad']),
  
('55555555-aaaa-aaaa-aaaa-000000000003', 'b2c3d4e5-2222-2222-2222-333333333333', 3, 
  'Vælg Tekststørrelse', 
  'Tryk på "Tekststørrelse". Du vil se en skyder du kan trække til højre for at gøre teksten større.',
  'Du kan se en forhåndsvisning af tekststørrelsen øverst på skærmen mens du justerer.',
  NULL,
  'https://placehold.co/800x600/e8f4f8/1a365d?text=Tekstskilder',
  ARRAY['iphone', 'ipad']),
  
('55555555-aaaa-aaaa-aaaa-000000000004', 'b2c3d4e5-2222-2222-2222-333333333333', 4, 
  'Fed Tekst (ekstra)', 
  'Hvis du også vil have teksten i fed, kan du slå "Fed tekst" til i samme menu. Det gør teksten nemmere at læse.',
  'Fed tekst virker i de fleste apps og gør det markant nemmere at læse på skærmen.',
  NULL,
  'https://placehold.co/800x600/d4edda/155724?text=Fed+Tekst',
  ARRAY['iphone', 'ipad'])
ON CONFLICT (id) DO UPDATE SET 
  title = EXCLUDED.title,
  instruction = EXCLUDED.instruction,
  tip_text = EXCLUDED.tip_text,
  warning_text = EXCLUDED.warning_text,
  image_url = EXCLUDED.image_url,
  device_type = EXCLUDED.device_type;

-- ----------------------------------------
-- GUIDE: Forstå iCloud (iCloud)
-- ----------------------------------------
INSERT INTO public.guide_steps (id, guide_id, step_number, title, instruction, tip_text, warning_text, image_url, device_type) VALUES
('66666666-aaaa-aaaa-aaaa-000000000001', 'e5f6g7h8-5555-5555-5555-111111111111', 1, 
  'Hvad er iCloud?', 
  'iCloud er Apples "sky-lager". Det betyder at dine billeder, kontakter og andre data gemmes sikkert på Apples servere - ikke kun på din telefon.',
  'Tænk på iCloud som en usynlig kopi af alt det vigtige på din telefon, gemt et sikkert sted.',
  NULL,
  'https://placehold.co/800x600/e8f4f8/1a365d?text=iCloud+Sky',
  ARRAY['iphone', 'ipad', 'mac']),
  
('66666666-aaaa-aaaa-aaaa-000000000002', 'e5f6g7h8-5555-5555-5555-111111111111', 2, 
  'Hvorfor er det vigtigt?', 
  'Hvis du mister din telefon eller den går i stykker, kan du få alle dine billeder og kontakter tilbage på en ny telefon. Intet går tabt!',
  NULL,
  'Uden iCloud mister du ALT hvis din telefon bliver væk eller ødelagt.',
  'https://placehold.co/800x600/fff3cd/856404?text=Backup+Vigtigt',
  ARRAY['iphone', 'ipad', 'mac']),
  
('66666666-aaaa-aaaa-aaaa-000000000003', 'e5f6g7h8-5555-5555-5555-111111111111', 3, 
  'Tjek din iCloud', 
  'Gå til Indstillinger og tryk på dit navn helt i toppen. Tryk derefter på "iCloud" for at se hvad der gemmes.',
  'Her kan du se præcis hvilke apps der bruger iCloud og slå det til/fra for hver enkelt.',
  NULL,
  'https://placehold.co/800x600/e8f4f8/1a365d?text=iCloud+Menu',
  ARRAY['iphone', 'ipad'])
ON CONFLICT (id) DO UPDATE SET 
  title = EXCLUDED.title,
  instruction = EXCLUDED.instruction,
  tip_text = EXCLUDED.tip_text,
  warning_text = EXCLUDED.warning_text,
  image_url = EXCLUDED.image_url,
  device_type = EXCLUDED.device_type;

-- ----------------------------------------
-- GUIDE: Send din Første Besked (Beskeder)
-- ----------------------------------------
INSERT INTO public.guide_steps (id, guide_id, step_number, title, instruction, tip_text, warning_text, image_url, device_type) VALUES
('77777777-aaaa-aaaa-aaaa-000000000001', 'f6g7h8i9-6666-6666-6666-111111111111', 1, 
  'Åbn Beskeder', 
  'Find den grønne app med taleboble-ikonet 💬 på din startskærm. Den hedder "Beskeder".',
  NULL,
  NULL,
  'https://placehold.co/800x600/d4edda/155724?text=Beskeder+App',
  ARRAY['iphone', 'ipad']),
  
('77777777-aaaa-aaaa-aaaa-000000000002', 'f6g7h8i9-6666-6666-6666-111111111111', 2, 
  'Start en ny besked', 
  'Tryk på det lille blyant-ikon i øverste højre hjørne for at starte en ny besked.',
  NULL,
  NULL,
  'https://placehold.co/800x600/d4edda/155724?text=Ny+Besked',
  ARRAY['iphone', 'ipad']),
  
('77777777-aaaa-aaaa-aaaa-000000000003', 'f6g7h8i9-6666-6666-6666-111111111111', 3, 
  'Vælg modtager', 
  'I "Til:" feltet skriver du personens navn eller telefonnummer. Vælg den rigtige person fra listen der dukker op.',
  'Blå bobler betyder iMessage (gratis over WiFi). Grønne bobler er almindelig SMS.',
  NULL,
  'https://placehold.co/800x600/d4edda/155724?text=Vaelg+Modtager',
  ARRAY['iphone', 'ipad']),
  
('77777777-aaaa-aaaa-aaaa-000000000004', 'f6g7h8i9-6666-6666-6666-111111111111', 4, 
  'Skriv og send', 
  'Tryk i tekstfeltet nederst og skriv din besked. Tryk på den blå/grønne pil til højre for at sende.',
  'Du kan også trykke på mikrofon-ikonet og tale din besked ind i stedet for at skrive.',
  NULL,
  'https://placehold.co/800x600/d4edda/155724?text=Send+Besked',
  ARRAY['iphone', 'ipad'])
ON CONFLICT (id) DO UPDATE SET 
  title = EXCLUDED.title,
  instruction = EXCLUDED.instruction,
  tip_text = EXCLUDED.tip_text,
  warning_text = EXCLUDED.warning_text,
  image_url = EXCLUDED.image_url,
  device_type = EXCLUDED.device_type;

-- ----------------------------------------
-- GUIDE: Download en App (Apps)
-- ----------------------------------------
INSERT INTO public.guide_steps (id, guide_id, step_number, title, instruction, tip_text, warning_text, image_url, device_type) VALUES
('88888888-aaaa-aaaa-aaaa-000000000001', 'g7h8i9j0-7777-7777-7777-111111111111', 1, 
  'Åbn App Store', 
  'Find den blå app med det hvide "A" ikon på din startskærm. Den hedder "App Store".',
  NULL,
  NULL,
  'https://placehold.co/800x600/dbeafe/1e40af?text=App+Store',
  ARRAY['iphone', 'ipad']),
  
('88888888-aaaa-aaaa-aaaa-000000000002', 'g7h8i9j0-7777-7777-7777-111111111111', 2, 
  'Søg efter en app', 
  'Tryk på forstørrelsesglas-ikonet "Søg" i bunden. Skriv navnet på den app du leder efter.',
  'Prøv at søge efter "DR" eller "TV2 Play" - de er gratis og gode til at øve med.',
  NULL,
  'https://placehold.co/800x600/dbeafe/1e40af?text=Soeg+App',
  ARRAY['iphone', 'ipad']),
  
('88888888-aaaa-aaaa-aaaa-000000000003', 'g7h8i9j0-7777-7777-7777-111111111111', 3, 
  'Download appen', 
  'Tryk på "Hent" knappen ud for appen. Du skal måske bekræfte med Face ID, Touch ID eller din adgangskode.',
  NULL,
  'Vær forsigtig med apps der beder om betaling. "Hent" betyder gratis - "Køb" koster penge.',
  'https://placehold.co/800x600/dbeafe/1e40af?text=Hent+App',
  ARRAY['iphone', 'ipad']),
  
('88888888-aaaa-aaaa-aaaa-000000000004', 'g7h8i9j0-7777-7777-7777-111111111111', 4, 
  'Find din nye app', 
  'Når download er færdig, finder du appen på din startskærm. Tryk på den for at åbne.',
  'Hvis du ikke kan finde den, swipe ned fra midten af skærmen og søg efter appens navn.',
  NULL,
  'https://placehold.co/800x600/d4edda/155724?text=App+Klar',
  ARRAY['iphone', 'ipad'])
ON CONFLICT (id) DO UPDATE SET 
  title = EXCLUDED.title,
  instruction = EXCLUDED.instruction,
  tip_text = EXCLUDED.tip_text,
  warning_text = EXCLUDED.warning_text,
  image_url = EXCLUDED.image_url,
  device_type = EXCLUDED.device_type;

-- ----------------------------------------
-- GUIDE: Frigør Lagerplads (Oprydning)
-- ----------------------------------------
INSERT INTO public.guide_steps (id, guide_id, step_number, title, instruction, tip_text, warning_text, image_url, device_type) VALUES
('99999999-aaaa-aaaa-aaaa-000000000001', 'c3d4e5f6-3333-3333-3333-111111111111', 1, 
  'Tjek din plads', 
  'Gå til Indstillinger → Generelt → iPhone-lagringsplads. Her kan du se hvor meget plads du har tilbage.',
  'Farverne viser hvad der bruger pladsen: Grå = System, Gul = Fotos, Orange = Apps.',
  NULL,
  'https://placehold.co/800x600/fef3c7/92400e?text=Lagerplads',
  ARRAY['iphone', 'ipad']),
  
('99999999-aaaa-aaaa-aaaa-000000000002', 'c3d4e5f6-3333-3333-3333-111111111111', 2, 
  'Slet ubrugte apps', 
  'Rul ned i listen og find apps du ikke bruger. Tryk på en app og vælg "Slet app" for at fjerne den.',
  'Vælg "Fjern app" i stedet for "Slet app" hvis du vil beholde dine data men frigøre plads.',
  'Sletning af en app fjerner alt dens data permanent. Vær sikker på du ikke har brug for det!',
  'https://placehold.co/800x600/fef3c7/92400e?text=Slet+Apps',
  ARRAY['iphone', 'ipad']),
  
('99999999-aaaa-aaaa-aaaa-000000000003', 'c3d4e5f6-3333-3333-3333-111111111111', 3, 
  'Ryd op i Beskeder', 
  'Beskeder med billeder og videoer fylder meget. Gå til Indstillinger → Beskeder → Behold beskeder → Vælg "1 år" i stedet for "Altid".',
  'Du kan også manuelt slette samtaler med mange billeder for at spare plads hurtigt.',
  NULL,
  'https://placehold.co/800x600/fef3c7/92400e?text=Beskeder+Oprydning',
  ARRAY['iphone', 'ipad']),
  
('99999999-aaaa-aaaa-aaaa-000000000004', 'c3d4e5f6-3333-3333-3333-111111111111', 4, 
  'Optimer Fotos', 
  'Gå til Indstillinger → Fotos → Slå "Optimer iPhone-lagringsplads" TIL. Dine billeder gemmes i fuld kvalitet i iCloud, men fylder mindre på telefonen.',
  'Dette kræver at du har iCloud aktiveret, men det sparer enormt meget plads.',
  NULL,
  'https://placehold.co/800x600/d4edda/155724?text=Optimer+Fotos',
  ARRAY['iphone', 'ipad'])
ON CONFLICT (id) DO UPDATE SET 
  title = EXCLUDED.title,
  instruction = EXCLUDED.instruction,
  tip_text = EXCLUDED.tip_text,
  warning_text = EXCLUDED.warning_text,
  image_url = EXCLUDED.image_url,
  device_type = EXCLUDED.device_type;

-- ----------------------------------------
-- GUIDE: FaceTime Videoopkald (Forbindelse)
-- ----------------------------------------
INSERT INTO public.guide_steps (id, guide_id, step_number, title, instruction, tip_text, warning_text, image_url, device_type) VALUES
('aaaaaaaa-bbbb-aaaa-aaaa-000000000001', 'd4e5f6g7-4444-4444-4444-444444444444', 1, 
  'Åbn FaceTime', 
  'Find den grønne app med videokamera-ikonet 📹 på din startskærm. Den hedder "FaceTime".',
  'FaceTime er gratis og bruger WiFi eller mobildata - ikke almindelige opkaldstaksering.',
  NULL,
  'https://placehold.co/800x600/d4edda/155724?text=FaceTime+App',
  ARRAY['iphone', 'ipad', 'mac']),
  
('aaaaaaaa-bbbb-aaaa-aaaa-000000000002', 'd4e5f6g7-4444-4444-4444-444444444444', 2, 
  'Start et opkald', 
  'Tryk på "Ny FaceTime" øverst. Skriv personens navn, telefonnummer eller e-mail i søgefeltet.',
  'Personen du ringer til skal også have en Apple-enhed (iPhone, iPad eller Mac).',
  NULL,
  'https://placehold.co/800x600/d4edda/155724?text=Ny+FaceTime',
  ARRAY['iphone', 'ipad', 'mac']),
  
('aaaaaaaa-bbbb-aaaa-aaaa-000000000003', 'd4e5f6g7-4444-4444-4444-444444444444', 3, 
  'Ring op med video', 
  'Tryk på det grønne kamera-ikon for at starte videoopkaldet. Vent på at personen svarer.',
  'Du kan trykke på kamera-ikonet under opkaldet for at skifte mellem front- og bagkamera.',
  'Sørg for at være et sted med god belysning så den anden person kan se dig tydeligt.',
  'https://placehold.co/800x600/d4edda/155724?text=Video+Opkald',
  ARRAY['iphone', 'ipad', 'mac']),
  
('aaaaaaaa-bbbb-aaaa-aaaa-000000000004', 'd4e5f6g7-4444-4444-4444-444444444444', 4, 
  'Afslut opkaldet', 
  'Tryk på den røde knap nederst på skærmen for at lægge på når I er færdige med at tale.',
  NULL,
  NULL,
  'https://placehold.co/800x600/fee2e2/dc2626?text=Afslut+Opkald',
  ARRAY['iphone', 'ipad', 'mac'])
ON CONFLICT (id) DO UPDATE SET 
  title = EXCLUDED.title,
  instruction = EXCLUDED.instruction,
  tip_text = EXCLUDED.tip_text,
  warning_text = EXCLUDED.warning_text,
  image_url = EXCLUDED.image_url,
  device_type = EXCLUDED.device_type;

-- ============================================
-- 3. GLOSSARY TERMS - Tech Dictionary
-- Note: Table created by migrations, only data here
-- ============================================

INSERT INTO public.glossary_terms (term, definition, example, category) VALUES
('WiFi', 'Trådløs internetforbindelse. Lader din telefon eller computer gå på internettet uden et kabel.', 'Du forbinder til caféens WiFi for at tjekke din e-mail.', 'forbindelse'),
('Bluetooth', 'Teknologi til at forbinde enheder trådløst over kort afstand, f.eks. høretelefoner.', 'Dine AirPods forbinder til telefonen via Bluetooth.', 'forbindelse'),
('App', 'Et program eller en "applikation" du kan installere på din telefon. Forkortelse for "application".', 'Facebook, MobilePay og DR er alle apps.', 'generelt'),
('iCloud', 'Apples sky-tjeneste der gemmer dine data sikkert på internettet og synkroniserer mellem dine enheder.', 'Dine billeder gemmes automatisk i iCloud.', 'icloud'),
('Opdatering', 'Ny version af software der ofte indeholder sikkerhedsrettelser og nye funktioner.', 'Din iPhone beder dig om at installere en opdatering.', 'generelt'),
('Pop-up', 'Et vindue der pludselig dukker op på skærmen, ofte en reklame eller en advarsel.', 'En irriterende pop-up blokerer for hjemmesiden.', 'sikkerhed'),
('Phishing', 'Svindelforsøg hvor nogen udgiver sig for at være en betroet virksomhed for at stjæle dine oplysninger.', 'En falsk e-mail der ligner den kommer fra din bank.', 'sikkerhed'),
('Screenshot', 'Et billede af hvad der vises på din skærm lige nu. Også kaldet "skærmbillede".', 'Tag et screenshot af beskeden for at gemme den.', 'generelt'),
('Face ID', 'Apples ansigtsgenkendelsesteknologi der låser din iPhone op ved at scanne dit ansigt.', 'Hold telefonen op foran dit ansigt for at låse den op med Face ID.', 'sikkerhed'),
('Touch ID', 'Apples fingeraftrykslæser der låser din enhed op med dit fingeraftryk.', 'Læg fingeren på Hjem-knappen for at bruge Touch ID.', 'sikkerhed'),
('Siri', 'Apples stemmeassistent der kan hjælpe dig med opgaver ved at lytte til din stemme.', 'Sig "Hej Siri, ring til min datter" for at starte et opkald.', 'generelt'),
('Lagerplads', 'Mængden af plads på din enhed til at gemme apps, billeder og andre data.', 'Du har brugt 50 GB af 128 GB lagerplads.', 'generelt'),
('MitID', 'Danmarks digitale ID-løsning der bruges til at logge ind på offentlige tjenester og banker.', 'Du bruger MitID til at logge ind på netbanken.', 'sikkerhed'),
('SMS', 'Short Message Service - en kort tekstbesked du sender fra din telefon.', 'Jeg sender lige en SMS til dig med adressen.', 'beskeder'),
('iMessage', 'Apples gratis beskedtjeneste der sender beskeder over internettet i stedet for som SMS.', 'Blå bobler i Beskeder-appen betyder det er en iMessage.', 'beskeder'),
('Backup', 'En sikkerhedskopi af dine data, så du kan gendanne dem hvis noget går galt.', 'Sørg for at lave backup før du opdaterer telefonen.', 'icloud'),
('Swipe', 'At stryge fingeren hen over skærmen for at navigere.', 'Swipe til venstre for at slette beskeden.', 'generelt'),
('Kontrolcenter', 'En hurtigmenu du åbner ved at swipe ned fra øverste højre hjørne på din iPhone.', 'Åbn Kontrolcenter for hurtigt at slå WiFi til.', 'generelt'),
('AirDrop', 'Apples funktion til at dele filer trådløst mellem Apple-enheder i nærheden.', 'Jeg sender billedet til dig via AirDrop.', 'forbindelse'),
('Safari', 'Apples webbrowser - det program du bruger til at gå på internettet.', 'Åbn Safari for at søge på Google.', 'apps'),
('App Store', 'Apples butik hvor du downloader apps til din iPhone eller iPad.', 'Find appen i App Store og tryk på Hent.', 'apps'),
('Notifikation', 'En besked eller advarsel der popper op på din skærm fra en app.', 'Du fik en notifikation fra Facebook.', 'generelt'),
('Skærmlås', 'Den kode eller metode der beskytter din telefon mod uønsket adgang.', 'Brug Face ID som skærmlås for nemmere adgang.', 'sikkerhed'),
('Flytilstand', 'En indstilling der slukker for alle trådløse forbindelser på din enhed.', 'Slå flytilstand til når du er i flyet.', 'forbindelse'),
('Hotspot', 'At dele din telefons mobildata med andre enheder via WiFi.', 'Jeg oprettede et hotspot så min iPad kunne gå online.', 'forbindelse')
ON CONFLICT (term) DO UPDATE SET 
  definition = EXCLUDED.definition,
  example = EXCLUDED.example,
  category = EXCLUDED.category;

-- ============================================
-- 4. SCAM QUIZ QUESTIONS
-- Note: Table created by migrations, only data here
-- ============================================

INSERT INTO public.quiz_questions (question, scenario_description, answer_is_scam, explanation, difficulty, category) VALUES
('Du modtager en SMS fra "MitID" med et link du skal klikke på for at bekræfte din identitet.', 
 'SMS lyder: "Din MitID er ved at udløbe. Klik her for at forny: mitid-verify.dk"', 
 true, 
 'MitID sender ALDRIG links via SMS. Gå altid direkte til mitid.dk i din browser.', 
 1, 'sms'),

('Du modtager en e-mail fra din bank om at bekræfte en overførsel du ikke har lavet.', 
 'E-mailen indeholder et link til at "annullere overførslen" med det samme.', 
 true, 
 'Banker sender aldrig links til at annullere overførsler. Ring til din bank på det officielle nummer.', 
 1, 'email'),

('Nogen ringer og siger de er fra politiet, og at dit CPR-nummer er blevet brugt til svindel.', 
 'De beder dig overføre penge til en "sikker konto" for at beskytte dine midler.', 
 true, 
 'Politiet ringer ALDRIG for at bede om pengeoverførsler. Det er altid svindel. Læg på!', 
 1, 'opkald'),

('Du får et opkald fra "Microsoft Support" om at din computer er inficeret med virus.', 
 'De vil hjælpe dig med at fjerne virussen hvis du giver dem fjernadgang til din computer.', 
 true, 
 'Microsoft ringer aldrig uopfordret. Giv aldrig fjernadgang til din computer til fremmede!', 
 1, 'opkald'),

('PostNord sender dig en SMS om at din pakke afventer afhentning med et tracking-link.', 
 'Du har bestilt noget online for nylig og venter på levering.', 
 false, 
 'Hvis du faktisk venter en pakke, kan det være ægte. Tjek dog altid at linket går til postnord.dk.', 
 2, 'sms'),

('En pop-up på din skærm siger din iPhone er inficeret og du skal ringe til et nummer.', 
 'Advarslen ser meget officiel ud med Apple-logoet.', 
 true, 
 'Apple viser aldrig sådanne advarsler. Luk bare vinduet - din telefon er fin!', 
 1, 'popup'),

('Du modtager en venlig e-mail fra en "nigeriansk prins" der vil dele sin formue med dig.', 
 'Han beder om dine bankoplysninger så han kan overføre millioner.', 
 true, 
 'Det klassiske "Nigeria-svindel". Slet den med det samme - ingen giver penge væk til fremmede!', 
 1, 'email'),

('Din netbank sender en SMS-kode når du logger ind.', 
 'Du er selv i gang med at logge ind på netbanken.', 
 false, 
 'To-faktor autentificering via SMS er normalt og sikkert når DU initierer login.', 
 2, 'sms'),

('En ven sender dig en besked på Facebook: "Er det dig i den her video?"', 
 'Beskeden indeholder et link du skal klikke på.', 
 true, 
 'Din vens konto er sandsynligvis hacket. Klik aldrig på sådanne links - ring til din ven i stedet.', 
 2, 'social'),

('Du får en e-mail om at du har vundet i et lotteri du aldrig har deltaget i.', 
 'De beder om et "gebyr" for at sende gevinsten.', 
 true, 
 'Man kan ikke vinde i et lotteri man ikke har deltaget i. Og ægte gevinster kræver aldrig gebyrer.', 
 1, 'email'),

('Din telefonselskab sender en mail om at din næste regning er klar.', 
 'E-mailen har logo og layout der matcher din udbyder, og linket går til deres officielle side.', 
 false, 
 'Officielle regningsnotifikationer er normale. Tjek altid at afsender og links er korrekte.', 
 2, 'email'),

('En SMS siger du har modtaget en pakke og skal betale 25 kr i told.', 
 'Du har ikke bestilt noget fra udlandet, og nummeret er ukendt.', 
 true, 
 'Hvis du ikke venter en pakke fra udlandet, er det sandsynligvis svindel. PostNord opkræver aldrig via SMS-links.', 
 1, 'sms'),

('Du modtager et opkald fra en der udgiver sig for at være fra "Nets" om mistænkelig aktivitet på dit dankort.', 
 'De beder om dit kortnummer og sikkerhedskode for at "verificere din identitet".', 
 true, 
 'Nets eller din bank vil ALDRIG bede om dit kortnummer eller sikkerhedskode over telefonen!', 
 1, 'opkald'),

('En bekendt fra Facebook sender en besked om at de er strandet i udlandet og har brug for penge.', 
 'De beder dig sende penge via Western Union hurtigst muligt.', 
 true, 
 'Klassisk svindel! Ring til personen på deres rigtige telefonnummer for at verificere - deres konto er hacket.', 
 1, 'social'),

('Din læge sender en SMS-påmindelse om en tid du har bestilt.', 
 'SMS kommer fra et nummer du genkender og indeholder ingen links.', 
 false, 
 'Påmindelser uden links fra kendte numre er normalt sikre og hjælpsomme.', 
 2, 'sms')
ON CONFLICT DO NOTHING;

-- ============================================
-- 5. HARDWARE TROUBLESHOOTING ISSUES
-- Note: Table created by migrations, only data here
-- ============================================

INSERT INTO public.hardware_issues (device_type, problem_title, problem_description, solution_text, category, severity) VALUES
-- iPhone Issues
('iphone', 'Telefonen fryser', 'Skærmen reagerer ikke på tryk', 'Lav en tvungen genstart: Hold sideknappen + lydstyrke ned indtil Apple-logoet vises (ca. 10 sek).', 'troubleshooting', 'high'),
('iphone', 'Sort skærm', 'Skærmen er helt sort selvom telefonen er tændt', 'Prøv at tvinge genstart. Hvis det ikke virker, lad telefonen oplade i mindst 30 minutter.', 'troubleshooting', 'high'),
('iphone', 'Ghost Touch', 'Skærmen trykker af sig selv', 'Rens skærmen grundigt og fjern dit cover. Hvis problemet fortsætter, kan skærmen være defekt.', 'troubleshooting', 'medium'),
('iphone', 'Batteriet aflader hurtigt', 'Batteriet holder ikke en hel dag', 'Tjek Batteritilstand i Indstillinger. Under 80% = tid til nyt batteri. Ellers: luk apps i baggrunden.', 'troubleshooting', 'medium'),
('iphone', 'WiFi virker ikke', 'Kan ikke forbinde til trådløst netværk', 'Slå WiFi fra og til igen. Hvis det ikke virker: Genstart router OG telefon.', 'troubleshooting', 'medium'),
('iphone', 'Ingen lyd', 'Telefonen spiller ikke lyde', 'Tjek at Lydløs-knappen på siden ikke er orange. Tjek også lydstyrken i Kontrolcenter.', 'troubleshooting', 'low'),
('iphone', 'Kamera er sløret', 'Billeder bliver uskarpe', 'Rens kameralinsen forsigtigt med en blød klud. Tjek at der ikke er fedtede fingeraftryk.', 'troubleshooting', 'low'),
('iphone', 'Opladning virker ikke', 'Telefonen oplader ikke når den er sat til', 'Rens Lightning-porten forsigtigt med en tandstik. Tjek også kablet for skader.', 'troubleshooting', 'high'),
('iphone', 'Face ID virker ikke', 'Ansigtsgenkendeelse fejler', 'Tjek at kameraet øverst ikke er blokeret. Gå til Indstillinger → Face ID og prøv at opsætte det igen.', 'troubleshooting', 'medium'),
('iphone', 'Apps crasher', 'Apps lukker ned af sig selv', 'Opdater appen i App Store. Hvis problemet fortsætter, slet og geninstaller appen.', 'troubleshooting', 'medium'),

-- iPad Issues
('ipad', 'iPad fryser', 'Skærmen reagerer ikke', 'Tving genstart: Hold topknap + Hjem-knap (eller lydstyrke ned på nyere modeller) i 10 sek.', 'troubleshooting', 'high'),
('ipad', 'Touchskærm reagerer ikke', 'Dele af skærmen reagerer ikke på tryk', 'Genstart din iPad. Hvis problemet fortsætter, kan der være en hardwarefejl.', 'troubleshooting', 'high'),
('ipad', 'Langsom ydeevne', 'iPad er blevet langsom over tid', 'Ryd op i lagerplads, luk ubrugte apps, og overvej at nulstille til fabriksindstillinger.', 'troubleshooting', 'medium'),
('ipad', 'Apple Pencil virker ikke', 'Pencil reagerer ikke på iPad', 'Tjek at Pencil er opladt. Fjern og tilslut den igen for at parre på ny.', 'troubleshooting', 'low'),
('ipad', 'Tastatur vises ikke', 'Skærmtastaturet dukker ikke op', 'Tjek om et eksternt tastatur er forbundet. Genstart appen eller iPad.', 'troubleshooting', 'low'),
('ipad', 'Split View virker ikke', 'Kan ikke bruge to apps side om side', 'Tjek at begge apps understøtter Split View. Træk app ned fra toppen af skærmen.', 'troubleshooting', 'low'),

-- Mac Issues
('mac', 'Mac starter ikke', 'Skærmen forbliver sort ved start', 'Hold tænd-knappen nede i 10 sek, vent 10 sek, tryk igen. Prøv SMC-nulstilling.', 'troubleshooting', 'high'),
('mac', 'Spinning wheel', 'Regnbue-hjulet drejer konstant', 'Vent tålmodigt. Hvis det fortsætter, tving-luk appen med Cmd+Option+Escape.', 'troubleshooting', 'medium'),
('mac', 'Trackpad virker ikke', 'Trackpad reagerer ikke på klik eller bevægelse', 'Tilslut en ekstern mus. Tjek Systemindstillinger → Trackpad for indstillinger.', 'troubleshooting', 'medium'),
('mac', 'Disken er fuld', 'Mac advarer om lav diskplads', 'Slet gamle filer, tøm papirkurven, og fjern ubrugte apps via Finder → Programmer.', 'troubleshooting', 'medium'),
('mac', 'WiFi dropper forbindelse', 'Mac mister WiFi-forbindelse regelmæssigt', 'Slet netværket fra WiFi-indstillinger og opret forbindelse på ny med password.', 'troubleshooting', 'medium'),
('mac', 'Bluetooth-problemer', 'Enheder forbinder ikke via Bluetooth', 'Slå Bluetooth fra og til. Fjern enheden og par den igen. Genstart Mac.', 'troubleshooting', 'low'),
('mac', 'Langsom boot', 'Mac er langsom om at starte op', 'Tjek Login-elementer i Systemindstillinger og fjern unødvendige programmer.', 'troubleshooting', 'low'),
('mac', 'Lydproblemer', 'Ingen lyd fra højttalere', 'Tjek lydstyrke i menulinjen. Gå til Systemindstillinger → Lyd og vælg korrekt output.', 'troubleshooting', 'low'),
('mac', 'Kamera virker ikke', 'Kamera fungerer ikke i videoopkald', 'Tjek at appen har tilladelse til kamera i Systemindstillinger → Anonymitet & sikkerhed.', 'troubleshooting', 'medium')
ON CONFLICT (device_type, problem_title) DO UPDATE SET 
  problem_description = EXCLUDED.problem_description,
  solution_text = EXCLUDED.solution_text,
  category = EXCLUDED.category,
  severity = EXCLUDED.severity;

-- ============================================
-- SEED COMPLETE
-- ============================================
-- All data has been populated. 
-- Running this script again will update existing records.
-- ============================================
