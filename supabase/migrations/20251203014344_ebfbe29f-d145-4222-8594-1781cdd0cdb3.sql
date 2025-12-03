-- Add new columns to purchases table for enhanced tracking
ALTER TABLE public.purchases 
ADD COLUMN IF NOT EXISTS harvest_quantity numeric,
ADD COLUMN IF NOT EXISTS purchase_quantity numeric,
ADD COLUMN IF NOT EXISTS num_crates numeric,
ADD COLUMN IF NOT EXISTS remaining_quantity numeric;

-- Update existing records to use the current quantity as purchase_quantity
UPDATE public.purchases 
SET 
  harvest_quantity = quantity,
  purchase_quantity = quantity,
  remaining_quantity = quantity
WHERE harvest_quantity IS NULL;

-- Add new columns to grading table for enhanced tracking
ALTER TABLE public.grading
ADD COLUMN IF NOT EXISTS num_crates numeric,
ADD COLUMN IF NOT EXISTS weight_per_crate numeric,
ADD COLUMN IF NOT EXISTS total_weight numeric,
ADD COLUMN IF NOT EXISTS percentage_of_purchase numeric,
ADD COLUMN IF NOT EXISTS shrinkage_weight numeric,
ADD COLUMN IF NOT EXISTS shrinkage_percentage numeric,
ADD COLUMN IF NOT EXISTS purchased_on date;

-- Create a grades table for grade management
CREATE TABLE IF NOT EXISTS public.grades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on grades table
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;

-- Create policy for grades table
CREATE POLICY "Allow all operations on grades" ON public.grades FOR ALL USING (true) WITH CHECK (true);

-- Insert default lobster grades
INSERT INTO public.grades (name, code, description, sort_order) VALUES
  ('Culls', 'culls', 'Missing claws or damaged', 1),
  ('Selects', 'selects', 'Premium quality', 2),
  ('Chicks', 'chicks', '1-1.25 lbs', 3),
  ('Quarters', 'quarters', '1.25-1.5 lbs', 4),
  ('Halves', 'halves', '1.5-2 lbs', 5),
  ('Jumbo', 'jumbo', '2+ lbs', 6),
  ('Soft Shell', 'soft_shell', 'Recently molted', 7),
  ('Hard Shell', 'hard_shell', 'Full shell', 8)
ON CONFLICT (code) DO NOTHING;

-- Create trigger for updated_at on grades
CREATE TRIGGER update_grades_updated_at
BEFORE UPDATE ON public.grades
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();