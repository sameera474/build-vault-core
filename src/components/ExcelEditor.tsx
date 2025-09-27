import React, { useState, useEffect, useCallback } from 'react';
import { Save, Download, Upload, Calculator, BarChart3, PieChart as PieChartIcon, LineChart as LineChartIcon, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, LineChart as RechartsLineChart, Line } from 'recharts';

interface Cell {
  value: string;
  formula?: string;
  type?: 'text' | 'number' | 'formula' | 'date';
  style?: {
    backgroundColor?: string;
    color?: string;
    fontWeight?: string;
  };
}

interface ExcelEditorProps {
  reportId?: string;
  templateId?: string;
  onSave?: (data: any) => void;
}

const CHART_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1'];

export const ExcelEditor: React.FC<ExcelEditorProps> = ({ reportId, templateId, onSave }) => {
  const [cells, setCells] = useState<{ [key: string]: Cell }>({});
  const [selectedCell, setSelectedCell] = useState<string>('A1');
  const [formula, setFormula] = useState<string>('');
  const [charts, setCharts] = useState<any[]>([]);
  const [isChartDialogOpen, setIsChartDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { profile } = useAuth();
  const { toast } = useToast();

  // Initialize empty spreadsheet
  useEffect(() => {
    loadSpreadsheetData();
  }, [reportId, templateId]);

  const loadSpreadsheetData = async () => {
    if (!reportId && !templateId) {
      // Initialize with default data
      initializeDefaultData();
      return;
    }

    try {
      if (reportId) {
        const { data, error } = await supabase
          .from('spreadsheet_data')
          .select('*')
          .eq('report_id', reportId)
          .single();

        if (error && error.code !== 'PGRST116') throw error;
        
        if (data) {
          setCells((data.cell_data as unknown as { [key: string]: Cell }) || {});
          setCharts((data.charts as any[]) || []);
        } else {
          initializeDefaultData();
        }
      }
    } catch (error) {
      console.error('Error loading spreadsheet:', error);
      initializeDefaultData();
    }
  };

  const initializeDefaultData = () => {
    const initialCells: { [key: string]: Cell } = {
      'A1': { value: 'Test Item', type: 'text', style: { fontWeight: 'bold' } },
      'B1': { value: 'Value', type: 'text', style: { fontWeight: 'bold' } },
      'C1': { value: 'Specification', type: 'text', style: { fontWeight: 'bold' } },
      'D1': { value: 'Status', type: 'text', style: { fontWeight: 'bold' } },
      'A2': { value: 'Compression Strength', type: 'text' },
      'B2': { value: '25.5', type: 'number' },
      'C2': { value: '20', type: 'number' },
      'D2': { value: 'PASS', type: 'text', style: { color: '#22c55e' } },
      'A3': { value: 'Slump Test', type: 'text' },
      'B3': { value: '75', type: 'number' },
      'C3': { value: '50-100', type: 'text' },
      'D3': { value: 'PASS', type: 'text', style: { color: '#22c55e' } },
    };
    setCells(initialCells);
  };

  const getCellRef = (row: number, col: number): string => {
    return `${String.fromCharCode(65 + col)}${row}`;
  };

  const parseCell = (cellRef: string): { row: number; col: number } => {
    const col = cellRef.charCodeAt(0) - 65;
    const row = parseInt(cellRef.slice(1));
    return { row, col };
  };

  const updateCell = (cellRef: string, value: string, isFormula: boolean = false) => {
    const newCells = { ...cells };
    
    if (isFormula && value.startsWith('=')) {
      // Handle formula
      const calculatedValue = calculateFormula(value, newCells);
      newCells[cellRef] = {
        value: calculatedValue.toString(),
        formula: value,
        type: 'formula'
      };
    } else {
      // Determine type
      const type = isNaN(Number(value)) ? 'text' : 'number';
      newCells[cellRef] = {
        value,
        type,
        style: cells[cellRef]?.style
      };
    }
    
    setCells(newCells);
    recalculateFormulas(newCells);
  };

  const calculateFormula = (formula: string, cellData: { [key: string]: Cell }): number => {
    try {
      // Simple formula parser - supports SUM, AVERAGE, basic math
      let expression = formula.slice(1); // Remove =
      
      // Handle SUM function
      if (expression.includes('SUM(')) {
        const match = expression.match(/SUM\(([A-Z]\d+):([A-Z]\d+)\)/);
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
        const match = expression.match(/AVERAGE\(([A-Z]\d+):([A-Z]\d+)\)/);
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
      expression = expression.replace(/[A-Z]\d+/g, (match) => {
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

  const saveSpreadsheet = async () => {
    if (!reportId || !profile?.company_id) {
      toast({
        title: "Error",
        description: "Unable to save - missing report or profile information",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('spreadsheet_data')
        .upsert({
          report_id: reportId,
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
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
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
    setIsChartDialogOpen(false);
  };

  const exportToCSV = () => {
    const rows: string[][] = [];
    const maxRow = Math.max(...Object.keys(cells).map(ref => parseCell(ref).row));
    const maxCol = Math.max(...Object.keys(cells).map(ref => parseCell(ref).col));

    for (let row = 1; row <= maxRow; row++) {
      const csvRow: string[] = [];
      for (let col = 0; col <= maxCol; col++) {
        const cellRef = getCellRef(row, col);
        csvRow.push(cells[cellRef]?.value || '');
      }
      rows.push(csvRow);
    }

    const csvContent = rows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', 'spreadsheet.csv');
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const renderGrid = () => {
    const rows = [];
    const maxRow = Math.max(10, Math.max(...Object.keys(cells).map(ref => parseCell(ref).row)));
    const maxCol = Math.max(5, Math.max(...Object.keys(cells).map(ref => parseCell(ref).col)));

    for (let row = 1; row <= maxRow; row++) {
      const cols = [];
      for (let col = 0; col <= maxCol; col++) {
        const cellRef = getCellRef(row, col);
        const cell = cells[cellRef];
        
        cols.push(
          <td key={cellRef} className="border border-gray-300 min-w-[100px]">
            <Input
              value={cell?.value || ''}
              onChange={(e) => updateCell(cellRef, e.target.value)}
              onFocus={() => {
                setSelectedCell(cellRef);
                setFormula(cell?.formula || cell?.value || '');
              }}
              className={`border-none h-8 text-sm ${
                selectedCell === cellRef ? 'bg-blue-100' : ''
              }`}
              style={cell?.style}
            />
          </td>
        );
      }
      rows.push(<tr key={row}>{cols}</tr>);
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
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg">
        <Button onClick={saveSpreadsheet} disabled={loading} size="sm">
          <Save className="h-4 w-4 mr-2" />
          Save
        </Button>
        <Button onClick={exportToCSV} variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
        
        <div className="flex items-center gap-2 ml-4">
          <Label htmlFor="formula" className="text-sm">Formula:</Label>
          <Input
            id="formula"
            value={formula}
            onChange={(e) => setFormula(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                updateCell(selectedCell, formula, formula.startsWith('='));
              }
            }}
            placeholder="Enter value or formula (=SUM(A1:A3))"
            className="w-64"
          />
          <Button
            onClick={() => updateCell(selectedCell, formula, formula.startsWith('='))}
            size="sm"
          >
            <Calculator className="h-4 w-4" />
          </Button>
        </div>

        <Dialog open={isChartDialogOpen} onOpenChange={setIsChartDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <BarChart3 className="h-4 w-4 mr-2" />
              Add Chart
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
      </div>

      {/* Spreadsheet */}
      <div className="overflow-auto border rounded-lg">
        <table className="min-w-full">
          <thead>
            <tr>
              {Array.from({ length: 6 }, (_, i) => (
                <th key={i} className="border border-gray-300 bg-gray-100 p-2 text-sm font-semibold">
                  {String.fromCharCode(65 + i)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {renderGrid()}
          </tbody>
        </table>
      </div>

      {/* Charts */}
      {charts.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Charts</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {charts.map((chart) => (
              <div key={chart.id} className="border rounded-lg p-4">
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
  const [dataRange, setDataRange] = useState('A2:B4');
  const [title, setTitle] = useState('Test Results Chart');

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="chartType">Chart Type</Label>
        <Select value={chartType} onValueChange={(value: any) => setChartType(value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
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
          placeholder="A2:B4"
        />
      </div>
      
      <div>
        <Label htmlFor="title">Chart Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Chart Title"
        />
      </div>
      
      <Button onClick={() => onCreateChart(chartType, dataRange, title)} className="w-full">
        Create Chart
      </Button>
    </div>
  );
};