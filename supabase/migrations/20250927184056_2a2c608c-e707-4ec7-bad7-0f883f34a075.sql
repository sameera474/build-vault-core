-- Fix the allocate_report_number function search path
CREATE OR REPLACE FUNCTION public.allocate_report_number(
  _company uuid, 
  _project uuid, 
  _doc_code text, 
  _date date
) 
RETURNS TABLE(report_number text, yymmdd text, seq int, project_prefix text, region_code text, lab_code text)
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE 
  v_d text := to_char(_date, 'YYMMDD');
  v_seq int;
  v_pref text; 
  v_reg text; 
  v_lab text;
BEGIN
  -- Get project prefix and codes
  SELECT p.project_prefix, p.region_code, p.lab_code
    INTO v_pref, v_reg, v_lab
  FROM public.projects p 
  WHERE p.id = _project AND p.company_id = _company;

  IF v_pref IS NULL THEN 
    RAISE EXCEPTION 'Project not found or missing prefix'; 
  END IF;

  -- Get next sequence number
  SELECT COALESCE(MAX(tr.seq), 0) + 1 INTO v_seq
  FROM public.test_reports tr
  WHERE tr.company_id = _company 
    AND tr.project_id = _project 
    AND tr.doc_code = _doc_code 
    AND tr.yymmdd = v_d;

  -- Return complete report number and components
  RETURN QUERY SELECT 
    format('%s-%s-%s-%s-%s-%s', v_pref, v_reg, v_lab, _doc_code, v_d, LPAD(v_seq::text, 2, '0')), 
    v_d, 
    v_seq,
    v_pref,
    v_reg,
    v_lab;
END $$;