-- Drop and recreate allocate_report_number function with new format
-- Format: Project-Road-DocCode-YYMMDD-Sequence
DROP FUNCTION IF EXISTS public.allocate_report_number(uuid, uuid, text, date);

CREATE FUNCTION public.allocate_report_number(
  _company uuid,
  _project uuid,
  _doc_code text,
  _date date
)
RETURNS TABLE(
  report_number text,
  yymmdd text,
  seq integer,
  project_prefix text,
  road_code text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE 
  v_d text := to_char(_date, 'YYMMDD');
  v_seq int;
  v_pref text; 
  v_road text;
  v_company uuid;
BEGIN
  -- Fetch project info (using region_code as road_code)
  SELECT p.project_prefix, p.region_code, p.company_id
    INTO v_pref, v_road, v_company
  FROM public.projects p
  WHERE p.id = _project;

  IF v_pref IS NULL THEN 
    RAISE EXCEPTION 'Project not found or missing prefix'; 
  END IF;

  -- Get next sequence number
  SELECT COALESCE(MAX(tr.seq), 0) + 1 INTO v_seq
  FROM public.test_reports tr
  WHERE tr.company_id = v_company 
    AND tr.project_id = _project 
    AND tr.doc_code = _doc_code 
    AND tr.yymmdd = v_d;

  -- Return report number in format: Project-Road-DocCode-YYMMDD-Sequence
  RETURN QUERY SELECT 
    format('%s-%s-%s-%s-%s', v_pref, v_road, _doc_code, v_d, LPAD(v_seq::text, 2, '0')), 
    v_d, 
    v_seq,
    v_pref,
    v_road;
END;
$function$;