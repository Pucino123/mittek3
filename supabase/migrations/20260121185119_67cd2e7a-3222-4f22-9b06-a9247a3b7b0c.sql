-- Create table for storing remote support bookings
CREATE TABLE public.support_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  price_dkk INTEGER NOT NULL DEFAULT 199,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  stripe_payment_id TEXT,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.support_bookings ENABLE ROW LEVEL SECURITY;

-- Users can view their own bookings
CREATE POLICY "Users can view their own bookings" 
ON public.support_bookings 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can create their own bookings
CREATE POLICY "Users can create their own bookings" 
ON public.support_bookings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can update their own pending bookings
CREATE POLICY "Users can update their own pending bookings" 
ON public.support_bookings 
FOR UPDATE 
USING (auth.uid() = user_id AND status = 'pending');

-- Admins can view all bookings
CREATE POLICY "Admins can view all bookings"
ON public.support_bookings
FOR SELECT
USING (public.is_admin(auth.uid()));

-- Admins can update all bookings
CREATE POLICY "Admins can update all bookings"
ON public.support_bookings
FOR UPDATE
USING (public.is_admin(auth.uid()));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_support_bookings_updated_at
BEFORE UPDATE ON public.support_bookings
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();