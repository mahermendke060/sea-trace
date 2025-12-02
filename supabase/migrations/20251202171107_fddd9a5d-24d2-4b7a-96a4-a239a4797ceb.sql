-- Create grades enum for lobster industry standards
CREATE TYPE public.lobster_grade AS ENUM (
  'culls',
  'selects', 
  'chicks',
  'quarters',
  'halves',
  'jumbo',
  'soft_shell',
  'hard_shell'
);

-- Create grading table to track product grading from purchases
CREATE TABLE public.grading (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_id UUID NOT NULL REFERENCES public.purchases(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  grade lobster_grade NOT NULL,
  quantity NUMERIC NOT NULL,
  available_quantity NUMERIC NOT NULL,
  graded_by TEXT,
  graded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add index for efficient lookups
CREATE INDEX idx_grading_purchase_id ON public.grading(purchase_id);
CREATE INDEX idx_grading_product_id ON public.grading(product_id);

-- Enable RLS
ALTER TABLE public.grading ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on grading" 
ON public.grading 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Add trigger for updated_at
CREATE TRIGGER update_grading_updated_at
BEFORE UPDATE ON public.grading
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add grade_id column to sale_items to link sales to specific grades
ALTER TABLE public.sale_items ADD COLUMN grade_id UUID REFERENCES public.grading(id);

-- Add is_downstream_purchase flag to purchases to identify synced purchases
ALTER TABLE public.purchases ADD COLUMN is_downstream_purchase BOOLEAN DEFAULT false;
ALTER TABLE public.purchases ADD COLUMN source_sale_id UUID REFERENCES public.sales(id);
ALTER TABLE public.purchases ADD COLUMN downstream_customer_id UUID REFERENCES public.customers(id);

-- Create function to sync sales to downstream purchases
CREATE OR REPLACE FUNCTION public.sync_sale_to_downstream_purchase()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sale_record RECORD;
  item_record RECORD;
  source_purchase RECORD;
BEGIN
  -- Get the sale details
  SELECT * INTO sale_record FROM sales WHERE id = NEW.sale_id;
  
  -- Get the source purchase details
  SELECT * INTO source_purchase FROM purchases WHERE id = NEW.purchase_id;
  
  -- Create a downstream purchase for the customer
  INSERT INTO purchases (
    supplier_id,
    vessel_id,
    product_id,
    fishing_zone_id,
    quantity,
    landing_date,
    trip_start_date,
    trip_end_date,
    gear_type,
    notes,
    is_downstream_purchase,
    source_sale_id,
    downstream_customer_id
  ) VALUES (
    sale_record.seller_id,
    source_purchase.vessel_id,
    NEW.product_id,
    source_purchase.fishing_zone_id,
    NEW.quantity,
    sale_record.sale_date,
    source_purchase.trip_start_date,
    source_purchase.trip_end_date,
    source_purchase.gear_type,
    'Auto-synced from sale on ' || sale_record.sale_date,
    true,
    NEW.sale_id,
    sale_record.customer_id
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger on sale_items
CREATE TRIGGER sync_sale_items_to_downstream
AFTER INSERT ON public.sale_items
FOR EACH ROW
EXECUTE FUNCTION public.sync_sale_to_downstream_purchase();