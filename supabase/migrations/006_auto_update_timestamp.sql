
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  new.updated_at = now();
  RETURN new;
END;
$$;

-- Apply to profiles
DROP TRIGGER IF EXISTS on_profiles_updated ON public.profiles;
CREATE TRIGGER on_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Apply to clients
DROP TRIGGER IF EXISTS on_clients_updated ON public.clients;
CREATE TRIGGER on_clients_updated
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Apply to patients
DROP TRIGGER IF EXISTS on_patients_updated ON public.patients;
CREATE TRIGGER on_patients_updated
  BEFORE UPDATE ON public.patients
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Apply to appointments
DROP TRIGGER IF EXISTS on_appointments_updated ON public.appointments;
CREATE TRIGGER on_appointments_updated
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Apply to medical_records
DROP TRIGGER IF EXISTS on_medical_records_updated ON public.medical_records;
CREATE TRIGGER on_medical_records_updated
  BEFORE UPDATE ON public.medical_records
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Apply to exams
DROP TRIGGER IF EXISTS on_exams_updated ON public.exams;
CREATE TRIGGER on_exams_updated
  BEFORE UPDATE ON public.exams
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
