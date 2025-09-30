import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { report_id } = await req.json();
    
    if (!report_id) {
      throw new Error('Report ID is required');
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch the complete report with all related data
    const { data: report, error: reportError } = await supabase
      .from('test_reports')
      .select(`
        *,
        project:projects(*),
        template:test_report_templates(*)
      `)
      .eq('id', report_id)
      .single();

    if (reportError || !report) {
      throw new Error('Report not found');
    }

    // Generate HTML content for the PDF
    const htmlContent = generateReportHTML(report);
    
    // For now, we'll create a simple HTML file and upload it
    // In production, you would use a PDF generation library like Puppeteer
    const fileName = `${report.report_number || report_id}.html`;
    
    // Upload to storage bucket
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(`reports/${fileName}`, new Blob([htmlContent], { type: 'text/html' }), {
        upsert: true
      });

    if (uploadError) {
      throw uploadError;
    }

    // Create a signed URL for download
    const { data: signed } = await supabase.storage
      .from('documents')
      .createSignedUrl(`reports/${fileName}`, 60 * 5); // 5 minutes

    console.log('PDF export generated successfully for report:', report_id);

    return new Response(
      JSON.stringify({ 
        url: signed?.signedUrl,
        message: 'PDF export generated successfully' 
      }), 
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error generating PDF export:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }), 
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

function generateReportHTML(report: any): string {
  const compaction = report.summary_json?.kpis?.degree_compaction;
  const complianceStatus = report.compliance_status || 'pending';
  
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Test Report - ${report.report_number}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
        .logo-section { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .company-info { text-align: right; }
        .report-title { text-align: center; font-size: 24px; font-weight: bold; margin: 20px 0; }
        .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
        .detail-section { border: 1px solid #ddd; padding: 15px; }
        .detail-label { font-weight: bold; color: #666; margin-bottom: 5px; }
        .detail-value { margin-bottom: 10px; }
        .status-badge { padding: 5px 10px; border-radius: 4px; font-weight: bold; }
        .status-pass { background-color: #d4edda; color: #155724; }
        .status-fail { background-color: #f8d7da; color: #721c24; }
        .status-pending { background-color: #f0f0f0; color: #6c757d; }
        .data-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .data-table th, .data-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .data-table th { background-color: #f8f9fa; }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo-section">
            <div>
                ${report.project?.client_logo ? `<img src="${report.project.client_logo}" alt="Client Logo" style="max-height: 60px;">` : '<div style="width: 100px; height: 60px; border: 1px solid #ddd; display: flex; align-items: center; justify-content: center;">CLIENT LOGO</div>'}
            </div>
            <div class="company-info">
                <h2>${report.project?.client_name || 'Client Name'}</h2>
                <p>Project: ${report.project?.name || 'N/A'}</p>
                <p>Contract: ${report.project?.contract_number || 'N/A'}</p>
            </div>
            <div>
                ${report.project?.contractor_logo ? `<img src="${report.project.contractor_logo}" alt="Contractor Logo" style="max-height: 60px;">` : '<div style="width: 100px; height: 60px; border: 1px solid #ddd; display: flex; align-items: center; justify-content: center;">CONTRACTOR LOGO</div>'}
            </div>
        </div>
    </div>

    <div class="report-title">
        TEST REPORT
        <br>
        <span style="font-size: 18px;">${report.report_number}</span>
    </div>

    <div class="details-grid">
        <div class="detail-section">
            <div class="detail-label">Test Information</div>
            <div class="detail-value"><strong>Test Type:</strong> ${report.test_type || 'N/A'}</div>
            <div class="detail-value"><strong>Material:</strong> ${report.material || report.custom_material || 'N/A'}</div>
            <div class="detail-value"><strong>Standard:</strong> ${report.standard || 'N/A'}</div>
            <div class="detail-value"><strong>Test Date:</strong> ${new Date(report.test_date).toLocaleDateString()}</div>
        </div>

        <div class="detail-section">
            <div class="detail-label">Location Information</div>
            <div class="detail-value"><strong>Road Name:</strong> ${report.road_name || 'N/A'}</div>
            <div class="detail-value"><strong>Chainage:</strong> ${report.chainage_from || 'N/A'} - ${report.chainage_to || 'N/A'}</div>
            <div class="detail-value"><strong>Side:</strong> ${report.side || 'N/A'}</div>
            <div class="detail-value"><strong>Road Offset:</strong> ${report.road_offset || 'N/A'}</div>
        </div>

        <div class="detail-section">
            <div class="detail-label">Test Results</div>
            <div class="detail-value">
                <strong>Compliance Status:</strong> 
                <span class="status-badge ${complianceStatus === 'pass' ? 'status-pass' : complianceStatus === 'fail' ? 'status-fail' : 'status-pending'}">
                    ${complianceStatus.toUpperCase()}
                </span>
            </div>
            ${typeof compaction === 'number' ? `<div class="detail-value"><strong>Compaction:</strong> ${compaction.toFixed(1)}%</div>` : ''}
            <div class="detail-value"><strong>Laboratory Test No:</strong> ${report.laboratory_test_no || 'N/A'}</div>
        </div>

        <div class="detail-section">
            <div class="detail-label">Personnel & Conditions</div>
            <div class="detail-value"><strong>Technician:</strong> ${report.technician_name || 'N/A'}</div>
            <div class="detail-value"><strong>Weather:</strong> ${report.weather_conditions || 'N/A'}</div>
            <div class="detail-value"><strong>Site Conditions:</strong> ${report.site_conditions || 'N/A'}</div>
            <div class="detail-value"><strong>Time of Test:</strong> ${report.time_of_test || 'N/A'}</div>
        </div>
    </div>

    ${report.data_json && Array.isArray(report.data_json) && report.data_json.length > 0 ? `
    <div style="margin: 30px 0;">
        <h3>Test Data</h3>
        <table class="data-table">
            <thead>
                <tr>
                    ${Object.keys(report.data_json[0]).map(key => `<th>${key.replace(/_/g, ' ').toUpperCase()}</th>`).join('')}
                </tr>
            </thead>
            <tbody>
                ${report.data_json.map((row: any) => `
                    <tr>
                        ${Object.values(row).map(value => `<td>${typeof value === 'number' ? (value as number).toFixed(3) : String(value || 'N/A')}</td>`).join('')}
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
    ` : ''}

    ${report.summary_json?.kpis ? `
    <div style="margin: 30px 0;">
        <h3>Key Performance Indicators</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
            ${Object.entries(report.summary_json.kpis).map(([key, value]) => `
                <div style="border: 1px solid #ddd; padding: 15px; text-align: center;">
                    <div style="font-weight: bold; margin-bottom: 5px;">${key.replace(/_/g, ' ').toUpperCase()}</div>
                    <div style="font-size: 18px; color: #333;">${typeof value === 'number' ? (value as number).toFixed(3) : String(value)}</div>
                </div>
            `).join('')}
        </div>
    </div>
    ` : ''}

    ${report.notes ? `
    <div style="margin: 30px 0;">
        <h3>Notes & Observations</h3>
        <div style="border: 1px solid #ddd; padding: 15px; background-color: #f8f9fa;">
            <p style="white-space: pre-wrap; margin: 0;">${report.notes}</p>
        </div>
    </div>
    ` : ''}

    <div style="margin-top: 50px; text-align: center; font-size: 12px; color: #666;">
        Generated on ${new Date().toLocaleString()}
    </div>
</body>
</html>`;
}