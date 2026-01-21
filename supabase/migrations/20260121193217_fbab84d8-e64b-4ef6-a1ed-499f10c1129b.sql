-- Add cancellation fields to support_bookings table
ALTER TABLE public.support_bookings
ADD COLUMN IF NOT EXISTS cancellation_message TEXT,
ADD COLUMN IF NOT EXISTS cancelled_by TEXT CHECK (cancelled_by IN ('admin', 'user'));

-- Add comment for documentation
COMMENT ON COLUMN public.support_bookings.cancellation_message IS 'Reason provided when booking is cancelled';
COMMENT ON COLUMN public.support_bookings.cancelled_by IS 'Who cancelled the booking: admin or user';