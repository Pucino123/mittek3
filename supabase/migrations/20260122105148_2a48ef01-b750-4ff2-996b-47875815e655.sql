-- Add waiting_for_technician status to support_bookings
ALTER TABLE public.support_bookings
DROP CONSTRAINT IF EXISTS support_bookings_status_check;

ALTER TABLE public.support_bookings
ADD CONSTRAINT support_bookings_status_check 
CHECK (status IN ('pending', 'confirmed', 'waiting_for_technician', 'in_progress', 'completed', 'cancelled'));

-- Add iPad and Mac steps to "Genstart en frosset enhed" guide
INSERT INTO public.guide_steps (guide_id, step_number, title, instruction, device_type, image_url)
VALUES 
  -- iPad steps
  ('6f0290ff-20de-45df-a007-72762071709e', 1, 'Find knapperne på din iPad', 
   'Nyere iPads (uden Hjem-knap): Find **Top-knappen** og en af **Lydstyrke-knapperne**.
Ældre iPads (med Hjem-knap): Find **Top-knappen** og **Hjem-knappen** i bunden.', 
   ARRAY['ipad'], NULL),
  
  ('6f0290ff-20de-45df-a007-72762071709e', 2, 'Tryk på den rigtige tastekombination', 
   'Nyere iPads: Tryk kortvarigt på **Lydstyrke op**, slip. Tryk kortvarigt på **Lydstyrke ned**, slip. Hold derefter **Top-knappen** inde i 10-15 sekunder.
Ældre iPads: Hold **Top-knappen** og **Hjem-knappen** inde samtidig i ca. 10 sekunder.', 
   ARRAY['ipad'], NULL),
  
  ('6f0290ff-20de-45df-a007-72762071709e', 3, 'Vent på Apple-logoet', 
   'Bliv ved med at holde knapperne inde, indtil skærmen bliver sort og Apple-logoet vises. Slip derefter alle knapper og vent på at din iPad starter op igen.', 
   ARRAY['ipad'], NULL),
  
  -- Mac steps  
  ('6f0290ff-20de-45df-a007-72762071709e', 1, 'Find tænd/sluk-knappen', 
   'På MacBooks sidder tænd/sluk-knappen øverst til højre på tastaturet (Touch ID-knappen).
På iMac og Mac mini finder du den bag på enheden.
På Mac Studio sidder den foran til højre.', 
   ARRAY['mac'], NULL),
  
  ('6f0290ff-20de-45df-a007-72762071709e', 2, 'Tving genstart', 
   'Hold **tænd/sluk-knappen** inde i mindst 10 sekunder, indtil skærmen bliver helt sort. Vent derefter 2-3 sekunder, og tryk på tænd/sluk-knappen igen for at starte din Mac.', 
   ARRAY['mac'], NULL),
  
  ('6f0290ff-20de-45df-a007-72762071709e', 3, 'Vent på opstart', 
   'Din Mac vil nu genstarte. Du vil se Apple-logoet og en fremgangslinje. Dette kan tage 1-3 minutter afhængigt af din Mac-model.', 
   ARRAY['mac'], NULL)

ON CONFLICT (id) DO NOTHING;