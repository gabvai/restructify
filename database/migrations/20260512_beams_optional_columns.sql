-- Make beam listing fields optional so minimal creates succeed (matches relaxed API/form).
ALTER TABLE public.beams ALTER COLUMN profile_name DROP NOT NULL;
ALTER TABLE public.beams ALTER COLUMN length_mm DROP NOT NULL;

ALTER TABLE public.beams DROP CONSTRAINT IF EXISTS beams_length_mm_check;
ALTER TABLE public.beams
  ADD CONSTRAINT beams_length_mm_check CHECK (length_mm IS NULL OR length_mm > (0)::numeric);
