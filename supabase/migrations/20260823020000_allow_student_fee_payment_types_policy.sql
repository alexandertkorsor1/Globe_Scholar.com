-- Ensure student-submitted payment confirmations can cover all student fee types.
-- Receipts still only appear after Finance approves the financial record.

ALTER TABLE public.financial_records
DROP CONSTRAINT IF EXISTS financial_records_record_type_check;

ALTER TABLE public.financial_records
DROP CONSTRAINT IF EXISTS financial_records_type_check;

ALTER TABLE public.financial_records
ADD CONSTRAINT financial_records_type_check
CHECK (
  record_type IN (
    'registration_fee',
    'tuition_fee',
    'admission_fee',
    'scholarship_disbursement',
    'refund',
    'operational_spend'
  )
);

DROP POLICY IF EXISTS "students_submit_own_registration_fee" ON public.financial_records;

DROP POLICY IF EXISTS "students_submit_own_student_payment" ON public.financial_records;

CREATE POLICY "students_submit_own_student_payment"
ON public.financial_records
FOR INSERT
TO authenticated
WITH CHECK (
  student_id = auth.uid()
  AND record_type IN ('registration_fee', 'tuition_fee', 'admission_fee')
  AND status = 'pending'
  AND EXISTS (
    SELECT 1
    FROM public.applications application
    WHERE application.id = financial_records.application_id
      AND application.student_id = auth.uid()
      AND application.application_number = financial_records.application_number
  )
);
