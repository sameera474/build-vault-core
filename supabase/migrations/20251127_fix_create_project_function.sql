-- Drop the old function
DROP FUNCTION IF EXISTS public.create_new_project;

-- Create corrected function to create a new project
-- FIXED: Uses correct profiles table structure with tenant_role
CREATE OR REPLACE FUNCTION public.create_new_project(
    p_name text,
    p_contract_number text,
    p_contractor_name text,
    p_client_name text,
    p_consultant_name text,
    p_project_prefix text,
    p_region_code text,
    p_lab_code text
)
RETURNS public.projects
AS $$
DECLARE
    user_company_id uuid;
    current_user_id uuid := auth.uid();
    new_project public.projects;
BEGIN
    -- Step 1: Verify the user has a company associated with them
    SELECT company_id INTO user_company_id
    FROM public.profiles
    WHERE user_id = current_user_id;

    -- If no company ID is found, the user is not properly configured
    IF user_company_id IS NULL THEN
        RAISE EXCEPTION 'User must be associated with a company to create a project.';
    END IF;

    -- Step 2: Insert the new project with the user's company ID
    INSERT INTO public.projects(
        company_id,
        created_by,
        name,
        contract_number,
        contractor_name,
        client_name,
        consultant_name,
        project_prefix,
        region_code,
        lab_code,
        status
    )
    VALUES (
        user_company_id,
        current_user_id,
        p_name,
        p_contract_number,
        p_contractor_name,
        p_client_name,
        p_consultant_name,
        p_project_prefix,
        p_region_code,
        p_lab_code,
        'active'
    )
    RETURNING * INTO new_project;

    RETURN new_project;
END;
$$
LANGUAGE plpgsql
SECURITY DEFINER;

COMMENT ON FUNCTION public.create_new_project IS 'Creates a new project for the authenticated user. Fixed to work with new profiles table structure.';
