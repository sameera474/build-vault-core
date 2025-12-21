-- Update allocate_report_number function to generate new format
-- Format: [DOC_CODE] [PROJECT_PREFIX][SEQUENCE] e.g., "FD PU20001"
CREATE OR REPLACE FUNCTION public.allocate_report_number(
  _company uuid, 
  _project uuid, 
  _doc_code text, 
  _date date
)
RETURNS TABLE(report_number text, yymmdd text, seq integer, project_prefix text, road_code text)
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
  -- Fetch project info
  SELECT p.project_prefix, p.region_code, p.company_id
    INTO v_pref, v_road, v_company
  FROM public.projects p
  WHERE p.id = _project;

  IF v_pref IS NULL THEN 
    RAISE EXCEPTION 'Project not found or missing prefix'; 
  END IF;

  -- Get next sequence number for this project + doc_code combination
  -- (Sequence is project-specific and doc_code-specific)
  SELECT COALESCE(MAX(tr.seq), 0) + 1 INTO v_seq
  FROM public.test_reports tr
  WHERE tr.company_id = v_company 
    AND tr.project_id = _project 
    AND tr.doc_code = _doc_code;

  -- Return report number in new format: DOC_CODE + space + PROJECT_PREFIX + 4-digit sequence
  -- Example: "FD PU20001"
  RETURN QUERY SELECT 
    format('%s %s%s', _doc_code, v_pref, LPAD(v_seq::text, 4, '0')),
    v_d, 
    v_seq,
    v_pref,
    v_road;
END;
$function$;