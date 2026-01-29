
-- Add clinical data columns to patients table

alter table public.patients
add column main_complaint text,
add column current_illness_history text,
add column personal_history text,
add column family_history text,
add column allergies text,
add column medications text;
