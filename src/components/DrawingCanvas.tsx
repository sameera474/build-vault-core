import { useEffect, useRef, useState } from "react";
import { Canvas as FabricCanvas, Circle, Rect, FabricText, PencilBrush } from "fabric";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Pencil, 
  Square, 
  Circle as CircleIcon, 
  Type, 
  Eraser, 
  Download, 
  Upload, 
  Trash2,
  MousePointer,
  Save
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DrawingCanvasProps {
  reportId?: string;
  onSave?: (imageData: string) => void;
  width?: number;
  height?: number;
}

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ 
  reportId, 
  onSave, 
  width = 800, 
  height = 600 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [activeColor, setActiveColor] = useState("#000000");
  const [activeTool, setActiveTool] = useState<"select" | "draw" | "rectangle" | "circle" | "text" | "eraser">("select");
  const [brushWidth, setBrushWidth] = useState(2);
  const [textInput, setTextInput] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width,
      height,
      backgroundColor: "#ffffff",
    });

    // Initialize the freeDrawingBrush for Fabric.js v6
    const brush = new PencilBrush(canvas);
    brush.color = activeColor;
    brush.width = brushWidth;
    canvas.freeDrawingBrush = brush;

    setFabricCanvas(canvas);
    toast({
      title: "Canvas ready!",
      description: "Start drawing on your test report",
    });

    return () => {
      canvas.dispose();
    };
  }, [width, height]); // Remove activeColor and brushWidth from dependencies

  useEffect(() => {
    if (!fabricCanvas) return;

    fabricCanvas.isDrawingMode = activeTool === "draw" || activeTool === "eraser";
    
    if (fabricCanvas.freeDrawingBrush) {
      if (activeTool === "eraser") {
        fabricCanvas.freeDrawingBrush.color = "#ffffff";
        fabricCanvas.freeDrawingBrush.width = brushWidth * 2;
      } else if (activeTool === "draw") {
        fabricCanvas.freeDrawingBrush.color = activeColor;
        fabricCanvas.freeDrawingBrush.width = brushWidth;
      }
    }
  }, [activeTool, activeColor, brushWidth, fabricCanvas]);

  const handleToolClick = (tool: typeof activeTool) => {
    setActiveTool(tool);

    if (!fabricCanvas) return;

    if (tool === "rectangle") {
      const rect = new Rect({
        left: 100,
        top: 100,
        fill: activeColor,
        width: 100,
        height: 60,
        stroke: activeColor,
        strokeWidth: 2,
      });
      fabricCanvas.add(rect);
      fabricCanvas.setActiveObject(rect);
    } else if (tool === "circle") {
      const circle = new Circle({
        left: 100,
        top: 100,
        fill: "transparent",
        radius: 50,
        stroke: activeColor,
        strokeWidth: 2,
      });
      fabricCanvas.add(circle);
      fabricCanvas.setActiveObject(circle);
    } else if (tool === "text" && textInput.trim()) {
      const text = new FabricText(textInput, {
        left: 100,
        top: 100,
        fontFamily: 'Arial',
        fontSize: 20,
        fill: activeColor,
      });
      fabricCanvas.add(text);
      fabricCanvas.setActiveObject(text);
      setTextInput("");
    }
  };

  const handleClear = () => {
    if (!fabricCanvas) return;
    fabricCanvas.clear();
    fabricCanvas.backgroundColor = "#ffffff";
    fabricCanvas.renderAll();
    toast({
      title: "Canvas cleared!",
      description: "All drawings have been removed",
    });
  };

  const handleSave = () => {
    if (!fabricCanvas) return;
    
    const imageData = fabricCanvas.toDataURL({
      format: 'png',
      quality: 1.0,
      multiplier: 1,
    });
    
    onSave?.(imageData);
    toast({
      title: "Drawing saved!",
      description: "Your drawing has been saved to the test report",
    });
  };

  const handleDownload = () => {
    if (!fabricCanvas) return;
    
    const link = document.createElement('a');
    link.download = `test-report-drawing-${reportId || Date.now()}.png`;
    link.href = fabricCanvas.toDataURL();
    link.click();
    
    toast({
      title: "Download started!",
      description: "Your drawing is being downloaded",
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !fabricCanvas) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const imgElement = new Image();
      imgElement.onload = () => {
        // Set background color to the image URL for now - Fabric v6 handles this differently
        fabricCanvas.backgroundColor = `url(${imgElement.src})`;
        fabricCanvas.renderAll();
      };
      imgElement.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const deleteSelected = () => {
    if (!fabricCanvas) return;
    
    const activeObjects = fabricCanvas.getActiveObjects();
    if (activeObjects.length) {
      activeObjects.forEach(obj => fabricCanvas.remove(obj));
      fabricCanvas.discardActiveObject();
      fabricCanvas.renderAll();
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 p-4 bg-gray-50 rounded-lg">
        <div className="flex gap-1">
          <Button
            variant={activeTool === "select" ? "default" : "outline"}
            size="sm"
            onClick={() => handleToolClick("select")}
            title="Select Tool"
          >
            <MousePointer className="h-4 w-4" />
          </Button>
          <Button
            variant={activeTool === "draw" ? "default" : "outline"}
            size="sm"
            onClick={() => handleToolClick("draw")}
            title="Draw"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant={activeTool === "rectangle" ? "default" : "outline"}
            size="sm"
            onClick={() => handleToolClick("rectangle")}
            title="Rectangle"
          >
            <Square className="h-4 w-4" />
          </Button>
          <Button
            variant={activeTool === "circle" ? "default" : "outline"}
            size="sm"
            onClick={() => handleToolClick("circle")}
            title="Circle"
          >
            <CircleIcon className="h-4 w-4" />
          </Button>
          <Button
            variant={activeTool === "text" ? "default" : "outline"}
            size="sm"
            onClick={() => handleToolClick("text")}
            title="Text"
          >
            <Type className="h-4 w-4" />
          </Button>
          <Button
            variant={activeTool === "eraser" ? "default" : "outline"}
            size="sm"
            onClick={() => handleToolClick("eraser")}
            title="Eraser"
          >
            <Eraser className="h-4 w-4" />
          </Button>
        </div>

        <div className="h-6 w-px bg-gray-300" />

        {/* Color Picker */}
        <div className="flex items-center gap-2">
          <Label htmlFor="color-picker" className="text-sm">Color:</Label>
          <input
            id="color-picker"
            type="color"
            value={activeColor}
            onChange={(e) => setActiveColor(e.target.value)}
            className="h-8 w-16 border border-gray-300 rounded cursor-pointer"
          />
        </div>

        {/* Brush Width */}
        <div className="flex items-center gap-2">
          <Label htmlFor="brush-width" className="text-sm">Width:</Label>
          <Select value={brushWidth.toString()} onValueChange={(value) => setBrushWidth(Number(value))}>
            <SelectTrigger className="w-16">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1px</SelectItem>
              <SelectItem value="2">2px</SelectItem>
              <SelectItem value="5">5px</SelectItem>
              <SelectItem value="10">10px</SelectItem>
              <SelectItem value="20">20px</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Text Input */}
        {activeTool === "text" && (
          <div className="flex items-center gap-2">
            <Label htmlFor="text-input" className="text-sm">Text:</Label>
            <Input
              id="text-input"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Enter text"
              className="w-32"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleToolClick("text");
                }
              }}
            />
          </div>
        )}

        <div className="h-6 w-px bg-gray-300" />

        {/* Action Buttons */}
        <div className="flex gap-1">
          <Button onClick={deleteSelected} variant="outline" size="sm" title="Delete Selected">
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button onClick={handleClear} variant="outline" size="sm" title="Clear All">
            Clear
          </Button>
          <Button onClick={handleSave} variant="outline" size="sm" title="Save Drawing">
            <Save className="h-4 w-4" />
          </Button>
          <Button onClick={handleDownload} variant="outline" size="sm" title="Download">
            <Download className="h-4 w-4" />
          </Button>
          <div className="relative">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="absolute inset-0 opacity-0 cursor-pointer"
              title="Upload Background Image"
            />
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="border border-gray-200 rounded-lg shadow-lg overflow-hidden bg-white">
        <canvas ref={canvasRef} className="max-w-full" />
      </div>
    </div>
  );
};