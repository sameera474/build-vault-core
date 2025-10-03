import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import jsPDF from "https://esm.sh/jspdf@2.5.1";

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
    const { project_id, year, month } = await req.json();
    
    if (!project_id || !year || !month) {
      throw new Error('Project ID, year, and month are required');
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch project details
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', project_id)
      .single();

    if (projectError || !project) {
      throw new Error('Project not found');
    }

    // Calculate date range
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0);

    // Fetch all reports for the month
    const { data: reports, error: reportsError } = await supabase
      .from('test_reports')
      .select('id, status, test_type, test_date, report_number, compliance_status, technician_name')
      .eq('project_id', project_id)
      .gte('test_date', startDate.toISOString().split('T')[0])
      .lte('test_date', endDate.toISOString().split('T')[0])
      .order('test_date', { ascending: true });

    if (reportsError) {
      throw reportsError;
    }

    // Calculate statistics
    const totalReports = reports?.length || 0;
    const approvedReports = reports?.filter(r => r.status === 'approved').length || 0;
    const pendingReports = reports?.filter(r => r.status === 'draft' || r.status === 'submitted').length || 0;
    const rejectedReports = reports?.filter(r => r.status === 'rejected').length || 0;
    
    const testTypeCounts: { [key: string]: number } = {};
    reports?.forEach(report => {
      if (report.test_type) {
        testTypeCounts[report.test_type] = (testTypeCounts[report.test_type] || 0) + 1;
      }
    });

    const complianceCounts = {
      pass: reports?.filter(r => r.compliance_status === 'pass').length || 0,
      fail: reports?.filter(r => r.compliance_status === 'fail').length || 0,
      pending: reports?.filter(r => r.compliance_status === 'pending').length || 0,
    };

    // Generate PDF
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text('MONTHLY SUMMARY REPORT', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
    doc.text(`${monthNames[parseInt(month) - 1]} ${year}`, 105, 30, { align: 'center' });
    
    // Project Information
    let yPos = 50;
    doc.setFontSize(14);
    doc.text('Project Information', 20, yPos);
    yPos += 10;
    doc.setFontSize(11);
    doc.text(`Project Name: ${project.name}`, 20, yPos);
    yPos += 7;
    doc.text(`Contract Number: ${project.contract_number || 'N/A'}`, 20, yPos);
    yPos += 7;
    doc.text(`Location: ${project.location || 'N/A'}`, 20, yPos);
    yPos += 7;
    doc.text(`Client: ${project.client_name || 'N/A'}`, 20, yPos);
    yPos += 15;
    
    // Summary Statistics
    doc.setFontSize(14);
    doc.text('Summary Statistics', 20, yPos);
    yPos += 10;
    doc.setFontSize(11);
    doc.text(`Total Reports: ${totalReports}`, 20, yPos);
    yPos += 7;
    doc.text(`Approved: ${approvedReports} (${totalReports > 0 ? Math.round((approvedReports / totalReports) * 100) : 0}%)`, 30, yPos);
    yPos += 7;
    doc.text(`Pending: ${pendingReports} (${totalReports > 0 ? Math.round((pendingReports / totalReports) * 100) : 0}%)`, 30, yPos);
    yPos += 7;
    doc.text(`Rejected: ${rejectedReports} (${totalReports > 0 ? Math.round((rejectedReports / totalReports) * 100) : 0}%)`, 30, yPos);
    yPos += 15;
    
    // Compliance Status
    doc.setFontSize(14);
    doc.text('Compliance Status', 20, yPos);
    yPos += 10;
    doc.setFontSize(11);
    doc.text(`Pass: ${complianceCounts.pass}`, 20, yPos);
    yPos += 7;
    doc.text(`Fail: ${complianceCounts.fail}`, 20, yPos);
    yPos += 7;
    doc.text(`Pending: ${complianceCounts.pending}`, 20, yPos);
    yPos += 15;
    
    // Test Types Breakdown
    if (Object.keys(testTypeCounts).length > 0) {
      doc.setFontSize(14);
      doc.text('Test Types Breakdown', 20, yPos);
      yPos += 10;
      doc.setFontSize(11);
      
      const sortedTestTypes = Object.entries(testTypeCounts).sort(([, a], [, b]) => b - a);
      sortedTestTypes.forEach(([testType, count]) => {
        const percentage = totalReports > 0 ? Math.round((count / totalReports) * 100) : 0;
        doc.text(`${testType}: ${count} (${percentage}%)`, 20, yPos);
        yPos += 7;
        
        // Add new page if needed
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
      });
    }
    
    // Add new page for detailed report list if there are reports
    if (reports && reports.length > 0) {
      doc.addPage();
      yPos = 20;
      
      doc.setFontSize(14);
      doc.text('Detailed Report List', 20, yPos);
      yPos += 10;
      doc.setFontSize(9);
      
      // Table headers
      doc.text('Date', 20, yPos);
      doc.text('Report Number', 50, yPos);
      doc.text('Test Type', 110, yPos);
      doc.text('Status', 160, yPos);
      yPos += 5;
      
      // Draw line under headers
      doc.line(20, yPos, 190, yPos);
      yPos += 5;
      
      // Report rows
      reports.slice(0, 40).forEach((report) => {
        doc.text(new Date(report.test_date).toLocaleDateString(), 20, yPos);
        doc.text(report.report_number || 'N/A', 50, yPos);
        doc.text((report.test_type || 'N/A').substring(0, 30), 110, yPos);
        doc.text(report.status || 'N/A', 160, yPos);
        yPos += 6;
        
        // Add new page if needed
        if (yPos > 280) {
          doc.addPage();
          yPos = 20;
          // Repeat headers
          doc.setFontSize(9);
          doc.text('Date', 20, yPos);
          doc.text('Report Number', 50, yPos);
          doc.text('Test Type', 110, yPos);
          doc.text('Status', 160, yPos);
          yPos += 5;
          doc.line(20, yPos, 190, yPos);
          yPos += 5;
        }
      });
      
      if (reports.length > 40) {
        yPos += 5;
        doc.text(`... and ${reports.length - 40} more reports`, 20, yPos);
      }
    }
    
    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(
        `Generated on ${new Date().toLocaleString()} - Page ${i} of ${pageCount}`,
        105,
        290,
        { align: 'center' }
      );
    }
    
    // Generate PDF buffer
    const pdfBuffer = doc.output('arraybuffer');
    
    // Upload PDF to storage bucket
    const fileName = `monthly-summary-${project.name.replace(/[^a-z0-9]/gi, '_')}-${year}-${month}.pdf`;
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(`summaries/${fileName}`, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (uploadError) {
      throw uploadError;
    }

    // Create a signed URL for download
    const { data: signed } = await supabase.storage
      .from('documents')
      .createSignedUrl(`summaries/${fileName}`, 60 * 5); // 5 minutes

    console.log('Monthly summary PDF generated successfully:', fileName);

    return new Response(
      JSON.stringify({ 
        url: signed?.signedUrl,
        fileName: fileName,
        message: 'Monthly summary PDF generated successfully' 
      }), 
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error generating monthly summary PDF:', error);
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
