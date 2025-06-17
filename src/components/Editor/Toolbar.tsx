import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { TextBoxType } from '@/types/editor';
import { Bold, Italic, Underline } from 'lucide-react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';

interface ToolbarProps {
  selectedTextBox: TextBoxType | null;
  updateTextBox: (textBox: TextBoxType) => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ selectedTextBox, updateTextBox }) => {
  const [fontSizeInput, setFontSizeInput] = useState('');
  const [borderWidthInput, setBorderWidthInput] = useState('');

  useEffect(() => {
    if (selectedTextBox) {
      setFontSizeInput(selectedTextBox.fontSize.toString());
      setBorderWidthInput(selectedTextBox.borderWidth.toString());
    }
  }, [selectedTextBox]);

  const handleFontSizeChange = (value: number) => {
    if (selectedTextBox) {
      updateTextBox({ ...selectedTextBox, fontSize: value });
    }
  };

  const handleSliderChange = (val: number[]) => {
    const value = val[0];
    setFontSizeInput(value.toString());
    handleFontSizeChange(value);
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (selectedTextBox) {
      updateTextBox({ ...selectedTextBox, color: e.target.value });
    }
  };

  const handleBorderWidthChange = (val: number[]) => {
    const value = val[0];
    setBorderWidthInput(value.toString());
    if (selectedTextBox) {
      updateTextBox({ ...selectedTextBox, borderWidth: value });
    }
  };

  const handleBorderColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (selectedTextBox) {
      updateTextBox({ ...selectedTextBox, borderColor: e.target.value });
    }
  };

  const toggleBold = () => {
    if (selectedTextBox) {
      updateTextBox({ ...selectedTextBox, isBold: !selectedTextBox.isBold });
    }
  };

  const toggleItalic = () => {
    if (selectedTextBox) {
      updateTextBox({ ...selectedTextBox, isItalic: !selectedTextBox.isItalic });
    }
  };

  const toggleUnderline = () => {
    if (selectedTextBox) {
      updateTextBox({ ...selectedTextBox, isUnderlined: !selectedTextBox.isUnderlined });
    }
  };

  return (
    <div className="bg-white border-b border-editor-border p-3 flex flex-col">
      <div className="flex items-center gap-4">
        {selectedTextBox && (
          <>
            {/* Formatting Buttons */}
            <div className="flex items-center gap-1">
              <Button variant={selectedTextBox.isBold ? 'default' : 'ghost'} size="icon" className={`h-8 w-8 rounded ${selectedTextBox.isBold ? 'bg-blue-500 text-white' : 'text-gray-700'}`} onClick={toggleBold}>
                <Bold className="h-4 w-4" />
              </Button>
              <Button variant={selectedTextBox.isItalic ? 'default' : 'ghost'} size="icon" className={`h-8 w-8 rounded ${selectedTextBox.isItalic ? 'bg-blue-500 text-white' : 'text-gray-700'}`} onClick={toggleItalic}>
                <Italic className="h-4 w-4" />
              </Button>
              <Button variant={selectedTextBox.isUnderlined ? 'default' : 'ghost'} size="icon" className={`h-8 w-8 rounded ${selectedTextBox.isUnderlined ? 'bg-blue-500 text-white' : 'text-gray-700'}`} onClick={toggleUnderline}>
                <Underline className="h-4 w-4" />
              </Button>
            </div>

            {/* Font Size */}
            <div className="flex items-center gap-2">
              <Label htmlFor="font-size" className="text-xs text-gray-700">Font Size</Label>
              <Slider id="font-size" value={[selectedTextBox.fontSize]} min={1} max={200} step={1} className="w-24" onValueChange={handleSliderChange} />
              <Input
                type="number"
                inputMode="numeric"
                id="font-size"
                value={fontSizeInput}
                onChange={(e) => {
                  const val = e.target.value;
                  setFontSizeInput(val);
                  const parsed = parseInt(val, 10);
                  if (!isNaN(parsed) && parsed > 0) {
                    handleFontSizeChange(parsed);
                  }
                }}
                className="w-16 h-8 px-2 text-sm"
              />
            </div>

            {/* Text Color */}
            <div className="flex items-center gap-2">
              <Label htmlFor="text-color" className="text-xs text-gray-700">Color:</Label>
              <Input type="color" value={selectedTextBox.color} onChange={handleColorChange} className="w-8 h-8 p-0 border-none" />
            </div>

            {/* Border Width */}
            <div className="flex items-center gap-2">
              <Label htmlFor="border-width" className="text-xs text-gray-700">Border:</Label>
              <Slider id="border-width" value={[selectedTextBox.borderWidth]} min={0} max={10} step={1} className="w-24" onValueChange={handleBorderWidthChange} />
              <Input
                type="number"
                inputMode="numeric"
                id="border-width"
                value={borderWidthInput}
                onChange={(e) => {
                  const val = e.target.value;
                  setBorderWidthInput(val);
                  const parsed = parseInt(val, 10);
                  if (!isNaN(parsed)) {
                    updateTextBox({ ...selectedTextBox, borderWidth: parsed });
                  }
                }}
                className="w-16 h-8 px-2 text-sm"
              />
            </div>

            {/* Border Color */}
            <div className="flex items-center gap-2">
              <Label htmlFor="border-color" className="text-xs text-gray-700">Border color:</Label>
              <Input type="color" value={selectedTextBox.borderColor} onChange={handleBorderColorChange} className="w-8 h-8 p-0 border-none" />
            </div>
          </>
        )}
      </div>

      {/* Properties Table */}
      {selectedTextBox && (
        <div className="mt-2 w-full overflow-auto">
          <Table className="border border-gray-200 rounded-md">
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">Widths</TableHead>
                <TableHead className="w-1/3">Text Content</TableHead>
                <TableHead className="w-24">Position (X,Y)</TableHead>
                <TableHead className="w-24">Format</TableHead>
                <TableHead className="w-24">Font Size</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-mono text-sm">{Math.round(selectedTextBox.width)}px</TableCell>
                <TableCell className="truncate max-w-40">{selectedTextBox.content}</TableCell>
                <TableCell className="font-mono text-sm">({Math.round(selectedTextBox.x)}, {Math.round(selectedTextBox.y)})</TableCell>
                <TableCell>
                  <div className="flex space-x-1">
                    <span className={selectedTextBox.isBold ? "font-bold" : "opacity-30"}>B</span>
                    <span className={selectedTextBox.isItalic ? "italic" : "opacity-30"}>I</span>
                    <span className={selectedTextBox.isUnderlined ? "underline" : "opacity-30"}>U</span>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-sm">{selectedTextBox.fontSize}px</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default Toolbar;
