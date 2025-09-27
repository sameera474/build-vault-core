import { useState, useEffect, useCallback, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { TemplateSchema, TemplateColumn } from '@/services/templateService';
import { Undo, Redo, Copy, Clipboard, Save } from 'lucide-react';
import { toast } from 'sonner';

interface CellData {
  value: any;
  formula?: string;
  type: 'text' | 'number' | 'select' | 'date';
  error?: string;
  style?: {
    backgroundColor?: string;
    color?: string;
    fontWeight?: string;
  };
}

interface ExcelGridProps {
  schema: TemplateSchema;
  initialData?: { [key: string]: any }[];
  onChange?: (data: { [key: string]: any }[], isDirty: boolean) => void;
  onSave?: () => void;
  readOnly?: boolean;
}

export function ExcelGrid({ schema, initialData = [], onChange, onSave, readOnly = false }: ExcelGridProps) {
  const [data, setData] = useState<CellData[][]>([]);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [formulaBarValue, setFormulaBarValue] = useState('');
  const [history, setHistory] = useState<CellData[][][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [clipboard, setClipboard] = useState<CellData[][] | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  const rows = Math.max(20, initialData.length + 5);
  const cols = schema.columns.length;

  // Initialize grid data
  useEffect(() => {
    const newData: CellData[][] = [];
    
    for (let row = 0; row < rows; row++) {
      const rowData: CellData[] = [];
      for (let col = 0; col < cols; col++) {
        const column = schema.columns[col];
        const initialValue = initialData[row]?.[column.id];
        
        rowData.push({
          value: initialValue ?? '',
          type: column.type,
          style: {}
        });
      }
      newData.push(rowData);
    }
    
    setData(newData);
    setHistory([newData]);
    setHistoryIndex(0);
  }, [schema, initialData, rows, cols]);

  // Save to history
  const saveToHistory = useCallback((newData: CellData[][]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(newData)));
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  // Update cell value
  const updateCell = useCallback((row: number, col: number, value: any, formula?: string) => {
    if (readOnly) return;
    
    const column = schema.columns[col];
    if (schema.locked?.includes(column.id)) {
      toast.error('This cell is locked and cannot be edited');
      return;
    }

    const newData = [...data];
    const oldValue = newData[row][col].value;
    
    // Validate value
    let validatedValue = value;
    let error = '';

    if (column.type === 'number' && value !== '') {
      const numValue = parseFloat(value);
      if (isNaN(numValue)) {
        error = 'Invalid number';
      } else {
        if (column.min !== undefined && numValue < column.min) {
          error = `Value must be >= ${column.min}`;
        }
        if (column.max !== undefined && numValue > column.max) {
          error = `Value must be <= ${column.max}`;
        }
        validatedValue = numValue;
      }
    }

    if (column.required && (value === '' || value == null)) {
      error = 'This field is required';
    }

    newData[row][col] = {
      ...newData[row][col],
      value: validatedValue,
      formula,
      error
    };

    // Recalculate formulas if this cell changed
    if (oldValue !== validatedValue) {
      recalculateFormulas(newData);
    }

    setData(newData);
    setIsDirty(true);
    
    if (oldValue !== validatedValue) {
      saveToHistory(newData);
    }

    // Emit change
    const outputData = convertToOutputFormat(newData);
    onChange?.(outputData, true);
  }, [data, schema, readOnly, onChange]);

  // Calculate formulas
  const calculateFormula = useCallback((formula: string, currentData: CellData[][]) => {
    try {
      // Simple formula parser for SUM, AVG, MIN, MAX
      if (formula.startsWith('=')) {
        const expr = formula.substring(1);
        
        if (expr.startsWith('SUM(') && expr.endsWith(')')) {
          const range = expr.slice(4, -1);
          const values = getRangeValues(range, currentData);
          return values.reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
        }
        
        if (expr.startsWith('AVG(') && expr.endsWith(')')) {
          const range = expr.slice(4, -1);
          const values = getRangeValues(range, currentData);
          const numValues = values.filter(v => !isNaN(parseFloat(v)));
          return numValues.length > 0 ? numValues.reduce((sum, val) => sum + parseFloat(val), 0) / numValues.length : 0;
        }
        
        if (expr.startsWith('MIN(') && expr.endsWith(')')) {
          const range = expr.slice(4, -1);
          const values = getRangeValues(range, currentData);
          const numValues = values.map(v => parseFloat(v)).filter(v => !isNaN(v));
          return numValues.length > 0 ? Math.min(...numValues) : 0;
        }
        
        if (expr.startsWith('MAX(') && expr.endsWith(')')) {
          const range = expr.slice(4, -1);
          const values = getRangeValues(range, currentData);
          const numValues = values.map(v => parseFloat(v)).filter(v => !isNaN(v));
          return numValues.length > 0 ? Math.max(...numValues) : 0;
        }
      }
      
      return formula;
    } catch (error) {
      return '#ERROR';
    }
  }, []);

  // Get range values (simplified)
  const getRangeValues = useCallback((range: string, currentData: CellData[][]) => {
    // For simplicity, assume range is a column name like "dry_density"
    const colIndex = schema.columns.findIndex(col => col.id === range);
    if (colIndex === -1) return [];
    
    return currentData
      .map(row => row[colIndex]?.value)
      .filter(val => val !== '' && val != null);
  }, [schema]);

  // Recalculate all formulas
  const recalculateFormulas = useCallback((currentData: CellData[][]) => {
    currentData.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        if (cell.formula) {
          const result = calculateFormula(cell.formula, currentData);
          cell.value = result;
        }
      });
    });
  }, [calculateFormula]);

  // Convert to output format
  const convertToOutputFormat = useCallback((currentData: CellData[][]) => {
    return currentData
      .filter(row => row.some(cell => cell.value !== '' && cell.value != null))
      .map(row => {
        const obj: { [key: string]: any } = {};
        row.forEach((cell, colIndex) => {
          const column = schema.columns[colIndex];
          if (column && cell.value !== '' && cell.value != null) {
            obj[column.id] = cell.value;
          }
        });
        return obj;
      })
      .filter(obj => Object.keys(obj).length > 0);
  }, [schema]);

  // Handle cell click
  const handleCellClick = (row: number, col: number) => {
    setSelectedCell({ row, col });
    const cell = data[row]?.[col];
    setFormulaBarValue(cell?.formula || cell?.value?.toString() || '');
  };

  // Handle formula bar change
  const handleFormulaBarChange = (value: string) => {
    setFormulaBarValue(value);
    if (selectedCell) {
      const isFormula = value.startsWith('=');
      updateCell(
        selectedCell.row, 
        selectedCell.col, 
        isFormula ? calculateFormula(value, data) : value,
        isFormula ? value : undefined
      );
    }
  };

  // Undo/Redo
  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setData(history[historyIndex - 1]);
      setIsDirty(true);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setData(history[historyIndex + 1]);
      setIsDirty(true);
    }
  };

  // Copy/Paste
  const copySelectedCells = () => {
    if (selectedCell) {
      const copiedData = [[data[selectedCell.row][selectedCell.col]]];
      setClipboard(copiedData);
      toast.success('Cell copied');
    }
  };

  const pasteClipboard = () => {
    if (clipboard && selectedCell) {
      const newData = [...data];
      clipboard.forEach((clipRow, rowOffset) => {
        clipRow.forEach((clipCell, colOffset) => {
          const targetRow = selectedCell.row + rowOffset;
          const targetCol = selectedCell.col + colOffset;
          if (targetRow < rows && targetCol < cols) {
            newData[targetRow][targetCol] = { ...clipCell };
          }
        });
      });
      setData(newData);
      setIsDirty(true);
      saveToHistory(newData);
      toast.success('Cells pasted');
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'z':
            e.preventDefault();
            undo();
            break;
          case 'y':
            e.preventDefault();
            redo();
            break;
          case 'c':
            e.preventDefault();
            copySelectedCells();
            break;
          case 'v':
            e.preventDefault();
            pasteClipboard();
            break;
          case 's':
            e.preventDefault();
            onSave?.();
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedCell, clipboard, historyIndex]);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
        <Button
          variant="ghost"
          size="sm"
          onClick={undo}
          disabled={historyIndex <= 0}
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={redo}
          disabled={historyIndex >= history.length - 1}
        >
          <Redo className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={copySelectedCells}
          disabled={!selectedCell}
        >
          <Copy className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={pasteClipboard}
          disabled={!clipboard || !selectedCell}
        >
          <Clipboard className="h-4 w-4" />
        </Button>
        <div className="ml-auto flex items-center gap-2">
          {isDirty && (
            <Badge variant="secondary" className="text-xs">
              Unsaved changes
            </Badge>
          )}
          <Button
            variant="default"
            size="sm"
            onClick={onSave}
            disabled={!isDirty}
          >
            <Save className="h-4 w-4 mr-1" />
            Save
          </Button>
        </div>
      </div>

      {/* Formula Bar */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium w-16">
          {selectedCell ? `${String.fromCharCode(65 + selectedCell.col)}${selectedCell.row + 1}` : ''}
        </span>
        <Input
          value={formulaBarValue}
          onChange={(e) => setFormulaBarValue(e.target.value)}
          onBlur={() => handleFormulaBarChange(formulaBarValue)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleFormulaBarChange(formulaBarValue);
            }
          }}
          placeholder="Enter value or formula (=SUM(column_name))"
          className="flex-1"
        />
      </div>

      {/* Grid */}
      <Card className="overflow-auto max-h-[600px]">
        <div ref={gridRef} className="min-w-full">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 bg-background z-10">
              <tr>
                <th className="w-12 h-8 border border-border bg-muted text-xs font-medium">#</th>
                {schema.columns.map((column, colIndex) => (
                  <th
                    key={column.id}
                    className="min-w-[120px] h-8 border border-border bg-muted text-xs font-medium p-1"
                  >
                    <div className="flex flex-col items-center">
                      <span className="truncate">{column.label}</span>
                      {schema.locked?.includes(column.id) && (
                        <Badge variant="secondary" className="text-xs mt-1">Locked</Badge>
                      )}
                      {schema.required?.includes(column.id) && (
                        <Badge variant="destructive" className="text-xs mt-1">Required</Badge>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  <td className="w-12 h-8 border border-border bg-muted text-xs text-center font-medium">
                    {rowIndex + 1}
                  </td>
                  {row.map((cell, colIndex) => {
                    const column = schema.columns[colIndex];
                    const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === colIndex;
                    const isLocked = schema.locked?.includes(column.id);
                    
                    return (
                      <td
                        key={`${rowIndex}-${colIndex}`}
                        className={`
                          h-8 border border-border cursor-cell
                          ${isSelected ? 'bg-primary/20 ring-2 ring-primary' : 'hover:bg-muted/50'}
                          ${isLocked ? 'bg-muted/30' : ''}
                          ${cell.error ? 'bg-destructive/10' : ''}
                        `}
                        onClick={() => handleCellClick(rowIndex, colIndex)}
                      >
                        <input
                          type="text"
                          value={cell.value?.toString() || ''}
                          onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
                          className="w-full h-full px-1 bg-transparent text-xs border-none outline-none"
                          disabled={isLocked || readOnly}
                          title={cell.error || undefined}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}