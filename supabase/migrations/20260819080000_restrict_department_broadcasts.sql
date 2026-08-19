-- Only administrators may broadcast a communication to every department.
-- Department staff can continue to send messages to any individual team.

DROP POLICY IF EXISTS "department_communications_create_scoped"
ON public.department_communications;

CREATE POLICY "department_communications_create_scoped"
ON public.department_communications
FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND sender_department = public.current_report_department()
  AND (
    recipient_department <> 'all'
    OR public.is_report_admin()
  )
  AND EXISTS (
    SELECT 1
    FROM public.profiles profile
    WHERE profile.id = auth.uid()
      AND (
        profile.is_admin = TRUE
        OR profile.account_type = 'staff'
        OR (
          profile.account_type = 'student'
          AND recipient_department IN ('admissions', 'finance')
          AND type = 'notification'
        )
      )
  )
);
