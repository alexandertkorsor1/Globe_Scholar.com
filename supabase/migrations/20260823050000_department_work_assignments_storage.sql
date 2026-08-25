-- Add policy to allow authenticated users to view work assignment attachments.
-- These attachments are stored under: [department]/[user_id]/work-assignments/[assignment_id]/[file_name]

DROP POLICY IF EXISTS department_work_assignments_storage_select ON storage.objects;

CREATE POLICY department_work_assignments_storage_select
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'department-reports'
  AND (storage.foldername(name))[3] = 'work-assignments'
);
