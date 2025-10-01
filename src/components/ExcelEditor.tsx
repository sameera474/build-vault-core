import React, { useState, useEffect, useCallback } from 'react';
import { Save, Download, Upload, Calculator, BarChart3, PieChart as PieChartIcon, LineChart as LineChartIcon, Plus, X, Copy, Clipboard, Undo, Redo, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, FileText, Type, Palette, MoreVertical, Table as TableIcon, FolderOpen, Import } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, LineChart as RechartsLineChart, Line } from 'recharts';
import * as XLSX from 'xlsx';

interface Cell {
  value: string;
  formula?: string;
  type?: 'text' | 'number' | 'formula' | 'date';
  style?: {
    backgroundColor?: string;
    color?: string;
    fontWeight?: string;
    fontStyle?: string;
    textAlign?: string;
    textDecoration?: string;
    fontSize?: string;
    fontFamily?: string;
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    verticalAlign?: string;
    wrapText?: boolean;
    border?: {
      top?: string;
      right?: string;
      bottom?: string;
      left?: string;
    };
  };
  merged?: string;
}

interface ExcelEditorProps {
  reportId?: string;
  templateId?: string;
  onSave?: (data: any) => void;
  onClose: () => void;
}

interface Template {
  id: string;
  name: string;
  description?: string;
  category?: string;
  fields: any;
  calculations?: any;
  created_at: string;
}

const CHART_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1'];
const ROWS = 50;
const COLS = 26;

export const ExcelEditor: React.FC<ExcelEditorProps> = ({ reportId, templateId, onSave, onClose }) => {
  const [cells, setCells] = useState<{ [key: string]: Cell }>({});
  const [selectedCell, setSelectedCell] = useState<string>('A1');
  const [selectedCells, setSelectedCells] = useState<string[]>([]);
  const [formulaBarValue, setFormulaBarValue] = useState<string>('');
  const [charts, setCharts] = useState<any[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showSaveTemplateDialog, setShowSaveTemplateDialog] = useState(false);
  const [showChartDialog, setShowChartDialog] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [templateCategory, setTemplateCategory] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [clipboard, setClipboard] = useState<Record<string, Cell>>({});
  const [history, setHistory] = useState<Record<string, Cell>[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [columnWidths, setColumnWidths] = useState<{ [key: string]: number }>({});
  const [rowHeights, setRowHeights] = useState<{ [key: string]: number }>({});
  const [loading, setLoading] = useState(false);
  const { profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadTemplates();
    if (reportId) {
      loadSpreadsheetData();
    } else if (templateId) {
      loadTemplate(templateId);
    } else {
      initializeDefaultData();
    }
  }, [reportId, templateId]);

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('template_type', 'spreadsheet')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const loadSpreadsheetData = async () => {
    if (!reportId) {
      initializeDefaultData();
      return;
    }

    try {
      const { data, error } = await supabase
        .from('spreadsheet_data')
        .select('*')
        .eq('report_id', reportId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading spreadsheet data:', error);
        initializeDefaultData();
        return;
      }

      if (data) {
        setCells((data.cell_data as any) || {});
        setCharts((data.charts as any[]) || []);
        addToHistory((data.cell_data as any) || {});
      } else {
        initializeDefaultData();
      }
    } catch (error) {
      console.error('Error loading spreadsheet data:', error);
      initializeDefaultData();
    }
  };

  const loadTemplate = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      if (data && data.fields) {
        const templateCells = data.fields as any;
        setCells(templateCells);
        addToHistory(templateCells);
      }
    } catch (error) {
      console.error('Error loading template:', error);
      initializeDefaultData();
    }
  };

  const initializeDefaultData = () => {
    const initialCells: { [key: string]: Cell } = {
      'A1': { value: 'Test Report', type: 'text', style: { fontWeight: 'bold', fontSize: '16px' } },
      'A3': { value: 'Test Item', type: 'text', style: { fontWeight: 'bold' } },
      'B3': { value: 'Value', type: 'text', style: { fontWeight: 'bold' } },
      'C3': { value: 'Specification', type: 'text', style: { fontWeight: 'bold' } },
      'D3': { value: 'Status', type: 'text', style: { fontWeight: 'bold' } },
      'A4': { value: 'Compression Strength', type: 'text' },
      'B4': { value: '25.5', type: 'number' },
      'C4': { value: '20', type: 'number' },
      'D4': { value: 'PASS', type: 'text', style: { color: '#22c55e' } },
      'A5': { value: 'Slump Test', type: 'text' },
      'B5': { value: '75', type: 'number' },
      'C5': { value: '50-100', type: 'text' },
      'D5': { value: 'PASS', type: 'text', style: { color: '#22c55e' } },
    };
    setCells(initialCells);
    addToHistory(initialCells);
  };

  const addToHistory = (cellsState: { [key: string]: Cell }) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ ...cellsState });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const previousState = history[historyIndex - 1];
      setCells(previousState);
      setHistoryIndex(historyIndex - 1);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setCells(nextState);
      setHistoryIndex(historyIndex + 1);
    }
  };

  const getCellRef = (row: number, col: number): string => {
    return `${String.fromCharCode(65 + col)}${row + 1}`;
  };

  const parseCell = (cellRef: string): { row: number; col: number } => {
    const col = cellRef.charCodeAt(0) - 65;
    const row = parseInt(cellRef.slice(1)) - 1;
    return { row, col };
  };

  const updateCell = (cellRef: string, value: string, addHistory = true) => {
    const newCells = { ...cells };
    
    if (value === '') {
      delete newCells[cellRef];
    } else {
      const isFormula = value.startsWith('=');
      
      if (isFormula) {
        const calculatedValue = calculateFormula(value, newCells);
        newCells[cellRef] = {
          ...newCells[cellRef],
          value: calculatedValue.toString(),
          formula: value,
          type: 'formula'
        };
      } else {
        const type = isNaN(Number(value)) ? 'text' : 'number';
        newCells[cellRef] = {
          ...newCells[cellRef],
          value,
          type,
          formula: undefined
        };
      }
    }
    
    setCells(newCells);
    recalculateFormulas(newCells);
    
    if (addHistory) {
      addToHistory(newCells);
    }
  };

  const calculateFormula = (formula: string, cellData: { [key: string]: Cell }): number => {
    try {
      let expression = formula.slice(1); // Remove =
      
      // Handle SUM function
      if (expression.includes('SUM(')) {
        const match = expression.match(/SUM\\(([A-Z]\\d+):([A-Z]\\d+)\\)/);
        if (match) {
          const [, start, end] = match;
          const startPos = parseCell(start);
          const endPos = parseCell(end);
          
          let sum = 0;
          for (let row = startPos.row; row <= endPos.row; row++) {
            for (let col = startPos.col; col <= endPos.col; col++) {
              const cellRef = getCellRef(row, col);
              const cellValue = parseFloat(cellData[cellRef]?.value || '0');
              if (!isNaN(cellValue)) sum += cellValue;
            }
          }
          return sum;
        }
      }
      
      // Handle AVERAGE function
      if (expression.includes('AVERAGE(')) {
        const match = expression.match(/AVERAGE\\(([A-Z]\\d+):([A-Z]\\d+)\\)/);
        if (match) {
          const [, start, end] = match;
          const startPos = parseCell(start);
          const endPos = parseCell(end);
          
          let sum = 0;
          let count = 0;
          for (let row = startPos.row; row <= endPos.row; row++) {
            for (let col = startPos.col; col <= endPos.col; col++) {
              const cellRef = getCellRef(row, col);
              const cellValue = parseFloat(cellData[cellRef]?.value || '0');
              if (!isNaN(cellValue)) {
                sum += cellValue;
                count++;
              }
            }
          }
          return count > 0 ? sum / count : 0;
        }
      }
      
      // Handle cell references
      expression = expression.replace(/[A-Z]\\d+/g, (match) => {
        const cellValue = cellData[match]?.value || '0';
        return parseFloat(cellValue).toString() || '0';
      });
      
      // Evaluate simple math expressions
      return eval(expression);
    } catch (error) {
      return 0;
    }
  };

  const recalculateFormulas = (cellData: { [key: string]: Cell }) => {
    const newCells = { ...cellData };
    
    Object.keys(newCells).forEach(cellRef => {
      const cell = newCells[cellRef];
      if (cell.formula) {
        const calculatedValue = calculateFormula(cell.formula, newCells);
        newCells[cellRef] = {
          ...cell,
          value: calculatedValue.toString()
        };
      }
    });
    
    setCells(newCells);
  };

  const applyCellStyle = (style: Partial<Cell['style']>) => {
    if (!selectedCell && selectedCells.length === 0) return;
    
    const cellsToUpdate = selectedCells.length > 0 ? selectedCells : [selectedCell];
    const newCells = { ...cells };
    
    cellsToUpdate.forEach(cellId => {
      if (!newCells[cellId]) {
        newCells[cellId] = { value: '', type: 'text' };
      }
      newCells[cellId].style = {
        ...newCells[cellId].style,
        ...style,
      };
    });
    
    setCells(newCells);
    addToHistory(newCells);
  };

  const copySelectedCells = () => {
    const cellsToCopy: Record<string, Cell> = {};
    const cellsToProcess = selectedCells.length > 0 ? selectedCells : selectedCell ? [selectedCell] : [];
    
    cellsToProcess.forEach(cellId => {
      if (cells[cellId]) {
        cellsToCopy[cellId] = { ...cells[cellId] };
      }
    });
    
    setClipboard(cellsToCopy);
    toast({ title: "Copied", description: `${Object.keys(cellsToCopy).length} cells copied` });
  };

  const pasteClipboard = () => {
    if (!selectedCell || Object.keys(clipboard).length === 0) return;
    
    const newCells = { ...cells };
    const selectedPos = parseCell(selectedCell);
    const clipboardEntries = Object.entries(clipboard);
    
    if (clipboardEntries.length > 0) {
      const firstCellPos = parseCell(clipboardEntries[0][0]);
      
      clipboardEntries.forEach(([cellId, cell]) => {
        const originalPos = parseCell(cellId);
        const offsetRow = originalPos.row - firstCellPos.row;
        const offsetCol = originalPos.col - firstCellPos.col;
        const newCellRef = getCellRef(selectedPos.row + offsetRow, selectedPos.col + offsetCol);
        
        if (selectedPos.row + offsetRow >= 0 && selectedPos.col + offsetCol >= 0 && 
            selectedPos.col + offsetCol < COLS && selectedPos.row + offsetRow < ROWS) {
          newCells[newCellRef] = { ...cell };
        }
      });
    }
    
    setCells(newCells);
    addToHistory(newCells);
    toast({ title: "Pasted", description: "Cells pasted successfully" });
  };

  const saveSpreadsheet = async () => {
    if (!profile?.company_id) {
      toast({
        title: "Error",
        description: "Unable to save - missing profile information",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // First, ensure we have a valid report_id by creating or updating the test report
      let currentReportId = reportId;
      
      if (!currentReportId) {
        // Create a new test report first
        const { data: newReport, error: reportError } = await supabase
          .from('test_reports')
          .insert({
            report_number: `TR-${Date.now()}`,
            test_type: 'Excel Report',
            test_date: new Date().toISOString().split('T')[0],
            company_id: profile.company_id,
            created_by: profile.user_id,
            compliance_status: 'pending'
          })
          .select()
          .single();

        if (reportError) throw reportError;
        currentReportId = newReport.id;
      }

      // Now save the spreadsheet data with the valid report_id
      const { error } = await supabase
        .from('spreadsheet_data')
        .upsert({
          report_id: currentReportId,
          template_id: templateId,
          cell_data: cells as any,
          charts: charts as any
        });

      if (error) throw error;

      toast({
        title: "Saved",
        description: "Spreadsheet data saved successfully",
      });

      onSave?.(cells);
    } catch (error: any) {
      console.error('Error saving spreadsheet:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save spreadsheet",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveAsTemplate = async () => {
    if (!templateName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a template name",
        variant: "destructive",
      });
      return;
    }

    if (!profile?.company_id) {
      toast({
        title: "Error",
        description: "Unable to save template - missing profile information",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('templates')
        .insert({
          name: templateName,
          description: templateDescription,
          template_type: 'spreadsheet',
          fields: cells as any,
          charts: charts as any,
          company_id: profile.company_id,
          created_by: profile.user_id
        });

      if (error) throw error;

      toast({
        title: "Template Saved",
        description: `Template "${templateName}" saved successfully`,
      });

      setShowSaveTemplateDialog(false);
      setTemplateName("");
      setTemplateDescription("");
      loadTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: "Error",
        description: "Failed to save template",
        variant: "destructive",
      });
    }
  };

  const importFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    if (fileExtension === 'csv') {
      importCSV(file);
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      importExcel(file);
    } else {
      toast({
        title: "Error",
        description: "Unsupported file format. Please use CSV or Excel files.",
        variant: "destructive",
      });
    }
  };

  const importCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const rows = text.split('\n').map(row => row.split(','));
      
      const newCells: { [key: string]: Cell } = {};
      rows.forEach((row, rowIndex) => {
        row.forEach((cellValue, colIndex) => {
          if (colIndex < COLS && rowIndex < ROWS) {
            const cellKey = `${String.fromCharCode(65 + colIndex)}${rowIndex + 1}`;
            const cleanValue = cellValue.trim().replace(/^"(.*)"$/, '$1');
            if (cleanValue) {
              newCells[cellKey] = {
                value: cleanValue,
                type: isNaN(Number(cleanValue)) ? 'text' : 'number'
              };
            }
          }
        });
      });

      setCells(prev => ({ ...prev, ...newCells }));
      setShowImportDialog(false);
      toast({
        title: "Success",
        description: "CSV imported successfully",
      });
    };
    reader.readAsText(file);
  };

  const importExcel = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { 
          type: 'array',
          cellStyles: true,
          cellDates: true,
          cellText: false
        });
        
        // Get the first worksheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Get the range of cells
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
        
        const newCells: { [key: string]: Cell } = {};
        const mergedCells: { [key: string]: string } = {};
        
        // Process merged cells if they exist
        if (worksheet['!merges']) {
          worksheet['!merges'].forEach((merge: any) => {
            const startCell = XLSX.utils.encode_cell(merge.s);
            for (let row = merge.s.r; row <= merge.e.r; row++) {
              for (let col = merge.s.c; col <= merge.e.c; col++) {
                const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
                if (cellRef !== startCell) {
                  mergedCells[cellRef] = startCell;
                }
              }
            }
          });
        }
        
        // Process each cell with formatting
        for (let row = range.s.r; row <= range.e.r && row < ROWS; row++) {
          for (let col = range.s.c; col <= range.e.c && col < COLS; col++) {
            const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
            const cellKey = `${String.fromCharCode(65 + col)}${row + 1}`;
            const cell = worksheet[cellRef];
            
            if (cell && cell.v !== undefined) {
              // Extract formatting information
              const style = cell.s || {};
              const font = style.font || {};
              const alignment = style.alignment || {};
              const fill = style.fill || {};
              
              newCells[cellKey] = {
                value: String(cell.w || cell.v || ''), // Use formatted value if available
                type: typeof cell.v === 'number' ? 'number' : 
                      cell.t === 'd' ? 'date' : 
                      cell.f ? 'formula' : 'text',
                formula: cell.f ? `=${cell.f}` : undefined,
                style: {
                  bold: font.bold || false,
                  italic: font.italic || false,
                  underline: font.underline || false,
                  fontSize: font.sz || 11,
                  fontFamily: font.name || 'Arial',
                  color: font.color ? `#${font.color.rgb || '000000'}` : '#000000',
                  backgroundColor: fill.fgColor ? `#${fill.fgColor.rgb || 'FFFFFF'}` : '#FFFFFF',
                  textAlign: alignment.horizontal || 'left',
                  verticalAlign: alignment.vertical || 'middle',
                  wrapText: alignment.wrapText || false,
                  border: style.border ? {
                    top: style.border.top?.style || 'none',
                    right: style.border.right?.style || 'none',
                    bottom: style.border.bottom?.style || 'none',
                    left: style.border.left?.style || 'none'
                  } : undefined
                },
                merged: mergedCells[cellRef] ? mergedCells[cellRef] : undefined
              };
            }
          }
        }
        
        // Update column widths if available
        if (worksheet['!cols']) {
          const newColumnWidths: { [key: string]: number } = {};
          worksheet['!cols'].forEach((col: any, index: number) => {
            if (col.wch && index < COLS) {
              const colLetter = String.fromCharCode(65 + index);
              newColumnWidths[colLetter] = Math.max(col.wch * 8, 100); // Convert to pixels
            }
          });
          setColumnWidths(prev => ({ ...prev, ...newColumnWidths }));
        }
        
        // Update row heights if available
        if (worksheet['!rows']) {
          const newRowHeights: { [key: string]: number } = {};
          worksheet['!rows'].forEach((row: any, index: number) => {
            if (row.hpt && index < ROWS) {
              newRowHeights[index + 1] = Math.max(row.hpt * 1.33, 25); // Convert to pixels
            }
          });
          setRowHeights(prev => ({ ...prev, ...newRowHeights }));
        }
        
        setCells(prev => ({ ...prev, ...newCells }));
        setShowImportDialog(false);
        
        toast({
          title: "Success",
          description: `Excel file imported successfully with formatting preserved. Imported ${Object.keys(newCells).length} cells.`,
        });
      } catch (error) {
        console.error('Error importing Excel file:', error);
        toast({
          title: "Error",
          description: "Failed to import Excel file. Please check the file format.",
          variant: "destructive",
        });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const exportToCSV = () => {
    const maxRow = Math.max(...Object.keys(cells).map(key => parseInt(key.slice(1))), 1);
    const maxCol = Math.max(...Object.keys(cells).map(key => key.charCodeAt(0) - 64), 1);
    
    const csvContent = Array.from({ length: maxRow }, (_, rowIndex) => {
      return Array.from({ length: maxCol }, (_, colIndex) => {
        const cellKey = `${String.fromCharCode(65 + colIndex)}${rowIndex + 1}`;
        const cellValue = cells[cellKey]?.value || '';
        return `"${cellValue.replace(/"/g, '""')}"`;
      }).join(',');
    }).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `test-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const createChart = (type: 'bar' | 'pie' | 'line', dataRange: string, title: string) => {
    const chartData = [];
    const [start, end] = dataRange.split(':');
    const startPos = parseCell(start);
    const endPos = parseCell(end);

    for (let row = startPos.row; row <= endPos.row; row++) {
      const labelCell = getCellRef(row, startPos.col);
      const valueCell = getCellRef(row, startPos.col + 1);
      
      if (cells[labelCell] && cells[valueCell]) {
        chartData.push({
          name: cells[labelCell].value,
          value: parseFloat(cells[valueCell].value) || 0
        });
      }
    }

    const newChart = {
      id: Date.now().toString(),
      type,
      title,
      data: chartData
    };

    setCharts([...charts, newChart]);
    setShowChartDialog(false);
  };


  const renderToolbar = () => (
    <div className="border-b bg-card p-2 space-y-2">
      {/* Main Toolbar */}
      <div className="flex items-center gap-1 flex-wrap">
        <Button size="sm" variant="ghost" onClick={undo} disabled={historyIndex <= 0}>
          <Undo className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="ghost" onClick={redo} disabled={historyIndex >= history.length - 1}>
          <Redo className="h-4 w-4" />
        </Button>
        
        <Separator orientation="vertical" className="h-6 mx-1" />
        
        <Button size="sm" variant="ghost" onClick={copySelectedCells}>
          <Copy className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="ghost" onClick={pasteClipboard}>
          <Clipboard className="h-4 w-4" />
        </Button>
        
        <Separator orientation="vertical" className="h-6 mx-1" />
        
        <Button size="sm" variant="ghost" onClick={() => applyCellStyle({ fontWeight: 'bold' })}>
          <Bold className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="ghost" onClick={() => applyCellStyle({ fontStyle: 'italic' })}>
          <Italic className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="ghost" onClick={() => applyCellStyle({ textDecoration: 'underline' })}>
          <Underline className="h-4 w-4" />
        </Button>
        
        <Separator orientation="vertical" className="h-6 mx-1" />
        
        <Button size="sm" variant="ghost" onClick={() => applyCellStyle({ textAlign: 'left' })}>
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="ghost" onClick={() => applyCellStyle({ textAlign: 'center' })}>
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="ghost" onClick={() => applyCellStyle({ textAlign: 'right' })}>
          <AlignRight className="h-4 w-4" />
        </Button>
        
        <Separator orientation="vertical" className="h-6 mx-1" />
        
        <Select onValueChange={(value) => applyCellStyle({ fontSize: value })}>
          <SelectTrigger className="w-20 h-8">
            <SelectValue placeholder="12" />
          </SelectTrigger>
          <SelectContent className="z-50">
            <SelectItem value="10px">10</SelectItem>
            <SelectItem value="12px">12</SelectItem>
            <SelectItem value="14px">14</SelectItem>
            <SelectItem value="16px">16</SelectItem>
            <SelectItem value="18px">18</SelectItem>
            <SelectItem value="20px">20</SelectItem>
          </SelectContent>
        </Select>
        
        <Separator orientation="vertical" className="h-6 mx-1" />
        
        <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
          <DialogTrigger asChild>
            <Button size="sm" variant="ghost">
              <FolderOpen className="h-4 w-4 mr-1" />
              Templates
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Select Template</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Filter by Category</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent className="z-50">
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="concrete">Concrete Testing</SelectItem>
                    <SelectItem value="soil">Soil Testing</SelectItem>
                    <SelectItem value="steel">Steel Testing</SelectItem>
                    <SelectItem value="asphalt">Asphalt Testing</SelectItem>
                    <SelectItem value="general">General Reports</SelectItem>
                    <SelectItem value="custom">Custom Templates</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                {templates
                  .filter(template => !selectedCategory || selectedCategory === 'all' || template.calculations?.category === selectedCategory)
                  .map((template) => (
                  <div key={template.id} className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                       onClick={() => {
                         loadTemplate(template.id);
                         setShowTemplateDialog(false);
                       }}>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium truncate">{template.name}</h3>
                      <Badge variant="outline" className="text-xs">
                        {template.calculations?.category || 'General'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{template.description}</p>
                    <Badge variant="secondary" className="mt-2">
                      {new Date(template.created_at).toLocaleDateString()}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>
        
        <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
          <DialogTrigger asChild>
            <Button size="sm" variant="ghost">
              <Import className="h-4 w-4 mr-1" />
              Import
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Import Data</DialogTitle>
              <DialogDescription>
                Import data from CSV files or existing test reports
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="fileImport">Import File</Label>
                <Input
                  id="fileImport"
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={importFile}
                  className="cursor-pointer"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Supports CSV and Excel (.xlsx, .xls) files with formatting preservation
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="preserveFormatting" 
                  defaultChecked 
                  className="rounded" 
                />
                <Label htmlFor="preserveFormatting" className="text-sm">
                  Preserve original formatting and layout
                </Label>
              </div>
              
              <div className="bg-blue-50 p-3 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Import Features:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Preserves cell formatting (bold, italic, colors)</li>
                  <li>• Maintains column widths and row heights</li>
                  <li>• Imports formulas and calculations</li>
                  <li>• Handles merged cells</li>
                  <li>• Perfect for test report templates</li>
                </ul>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowImportDialog(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showSaveTemplateDialog} onOpenChange={setShowSaveTemplateDialog}>
          <DialogTrigger asChild>
            <Button size="sm" variant="ghost">
              <Plus className="h-4 w-4 mr-1" />
              Save Template
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Save as Template</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="templateName">Template Name</Label>
                <Input
                  id="templateName"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Enter template name"
                />
              </div>
              <div>
                <Label htmlFor="templateCategory">Category</Label>
                <Select value={templateCategory} onValueChange={setTemplateCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="z-50">
                    <SelectItem value="concrete">Concrete Testing</SelectItem>
                    <SelectItem value="soil">Soil Testing</SelectItem>
                    <SelectItem value="steel">Steel Testing</SelectItem>
                    <SelectItem value="asphalt">Asphalt Testing</SelectItem>
                    <SelectItem value="general">General Reports</SelectItem>
                    <SelectItem value="custom">Custom Templates</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="templateDescription">Description (Optional)</Label>
                <Textarea
                  id="templateDescription"
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  placeholder="Describe this template"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowSaveTemplateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={saveAsTemplate}>
                  Save Template
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        
        <Dialog open={showChartDialog} onOpenChange={setShowChartDialog}>
          <DialogTrigger asChild>
            <Button size="sm" variant="ghost">
              <BarChart3 className="h-4 w-4 mr-1" />
              Chart
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Chart</DialogTitle>
              <DialogDescription>
                Select chart type and data range
              </DialogDescription>
            </DialogHeader>
            <ChartDialog onCreateChart={createChart} />
          </DialogContent>
        </Dialog>
        
        <Separator orientation="vertical" className="h-6 mx-1" />
        
        <Button size="sm" onClick={saveSpreadsheet} disabled={loading}>
          <Save className="h-4 w-4 mr-1" />
          Save
        </Button>
        <Button size="sm" variant="outline" onClick={exportToCSV}>
          <Download className="h-4 w-4 mr-1" />
          Export CSV
        </Button>
        <Button size="sm" variant="outline" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Formula Bar */}
      <div className="flex items-center gap-2">
        <span className="font-mono text-sm font-medium w-16">
          {selectedCell}
        </span>
        <Input
          value={formulaBarValue}
          onChange={(e) => setFormulaBarValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && selectedCell) {
              updateCell(selectedCell, formulaBarValue);
              setFormulaBarValue("");
            }
          }}
          placeholder="Enter value or formula (=A1+B1)"
          className="flex-1"
        />
      </div>
    </div>
  );

  const renderGrid = () => {
    const rows = [];
    
    // Header row with column letters
    const headerRow = (
      <tr key="header">
        <th className="w-12 h-8 bg-gray-100 border border-gray-300 text-center text-xs font-medium"></th>
        {Array.from({ length: COLS }, (_, col) => (
          <th key={`col-${col}`} className="min-w-24 h-8 bg-gray-100 border border-gray-300 text-center text-xs font-medium">
            {String.fromCharCode(65 + col)}
          </th>
        ))}
      </tr>
    );
    rows.push(headerRow);
    
    // Data rows
    for (let row = 0; row < ROWS; row++) {
      const rowCells = [
        <td key={`row-header-${row}`} className="w-12 h-8 bg-gray-100 border border-gray-300 text-center text-xs font-medium">
          {row + 1}
        </td>
      ];
      
      for (let col = 0; col < COLS; col++) {
        const cellId = getCellRef(row, col);
        const cell = cells[cellId];
        const isSelected = selectedCell === cellId || selectedCells.includes(cellId);
        
        rowCells.push(
          <td key={cellId} className="border border-gray-300 p-0 relative">
            <Input
              value={cell?.value || ''}
              onChange={(e) => updateCell(cellId, e.target.value)}
              onFocus={() => {
                setSelectedCell(cellId);
                setFormulaBarValue(cell?.formula || cell?.value || '');
              }}
              className={`border-0 h-8 text-xs rounded-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:z-10 ${
                isSelected ? 'bg-blue-50' : ''
              }`}
              style={{
                fontWeight: cell?.style?.fontWeight,
                fontStyle: cell?.style?.fontStyle,
                textAlign: cell?.style?.textAlign as any,
                backgroundColor: cell?.style?.backgroundColor,
                color: cell?.style?.color,
                textDecoration: cell?.style?.textDecoration,
                fontSize: cell?.style?.fontSize,
                fontFamily: cell?.style?.fontFamily,
              }}
            />
          </td>
        );
      }
      
      rows.push(
        <tr key={`row-${row}`}>
          {rowCells}
        </tr>
      );
    }
    
    return rows;
  };

  const renderChart = (chart: any) => {
    const commonProps = {
      width: 400,
      height: 300,
      data: chart.data
    };

    switch (chart.type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        );
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <Pie
                data={chart.data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                label
              >
                {chart.data.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </RechartsPieChart>
          </ResponsiveContainer>
        );
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <RechartsLineChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#8884d8" />
            </RechartsLineChart>
          </ResponsiveContainer>
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {renderToolbar()}
      
      <div className="flex-1 overflow-auto">
        <table className="table-fixed border-collapse">
          <tbody>
            {renderGrid()}
          </tbody>
        </table>
      </div>

      {/* Charts Section */}
      {charts.length > 0 && (
        <div className="border-t p-4 bg-gray-50">
          <h3 className="text-lg font-semibold mb-4">Charts</h3>
          <div className="grid gap-4 md:grid-cols-2">
          {charts.map((chart) => (
              <div key={chart.id} className="border rounded-lg p-4 bg-card">
                <h4 className="font-medium mb-2">{chart.title}</h4>
                {renderChart(chart)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const ChartDialog: React.FC<{ onCreateChart: (type: any, range: string, title: string) => void }> = ({ onCreateChart }) => {
  const [chartType, setChartType] = useState<'bar' | 'pie' | 'line'>('bar');
  const [dataRange, setDataRange] = useState('A4:B6');
  const [title, setTitle] = useState('Test Results Chart');

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="chartType">Chart Type</Label>
        <Select value={chartType} onValueChange={(value: any) => setChartType(value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="z-50">
            <SelectItem value="bar">Bar Chart</SelectItem>
            <SelectItem value="pie">Pie Chart</SelectItem>
            <SelectItem value="line">Line Chart</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label htmlFor="dataRange">Data Range</Label>
        <Input
          id="dataRange"
          value={dataRange}
          onChange={(e) => setDataRange(e.target.value)}
          placeholder="A1:B5"
        />
      </div>
      
      <div>
        <Label htmlFor="chartTitle">Chart Title</Label>
        <Input
          id="chartTitle"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter chart title"
        />
      </div>
      
      <div className="flex justify-end gap-2">
        <Button onClick={() => onCreateChart(chartType, dataRange, title)}>
          Create Chart
        </Button>
      </div>
    </div>
  );
};