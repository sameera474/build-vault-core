-- Delete the selected demo/test projects
DELETE FROM public.projects WHERE id IN (
  '2f67ad4c-5e28-4195-999b-c5811eff24ed',  -- zxz
  'a204c9ac-7a7b-4f92-b67d-8fef53c26778',  -- Commercial Building Project (company d74b4b82)
  '895bd451-0c7c-4eb9-9e19-26df0058a0cf',  -- Commercial Building Project (company 7d1cfe92)
  '4c30fd8b-a854-4234-9305-891f583a27ae',  -- Highway Bridge Construction (company 24971733)
  '3c2290b2-0c80-4a08-9587-61b9703b8f60',  -- Highway Bridge Construction (company cf8e9777)
  '791079a9-c4f6-4ba9-8a66-33b573402f87'   -- Residential Complex
);