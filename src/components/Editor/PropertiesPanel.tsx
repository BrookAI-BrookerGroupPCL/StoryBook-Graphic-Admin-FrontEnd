import React, {useEffect, useState, useRef} from 'react';
import { toast } from 'sonner';
import { TextBoxType } from '@/types/editor';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';


interface PropertiesPanelProps {
  selectedTextBox: TextBoxType | null;
  updateTextBox: (textBox: TextBoxType) => void;
  canvasSize: { width: number; height: number };
  awsFonts: { name: string; fontFamily: string; url: string }[];
}

const detectLang = (text: string): 'en' | 'th' => /[\u0E00-\u0E7F]/.test(text) ? 'th' : 'en';

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ selectedTextBox, updateTextBox, canvasSize }) => {
  if (!selectedTextBox) {
    return (
      <div className="p-3 text-sm text-gray-500">
        Select a text box to edit its properties
      </div>
    );
  }

  const handleFontSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      updateTextBox({
        ...selectedTextBox,
        fontSize: value,
      });
    }
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateTextBox({
      ...selectedTextBox,
      color: e.target.value,
    });
  };

  const handleBackgroundColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHex = e.target.value;
    const r = parseInt(newHex.slice(1, 3), 16);
    const g = parseInt(newHex.slice(3, 5), 16);
    const b = parseInt(newHex.slice(5, 7), 16);
    const existing = selectedTextBox.backgroundColor || 'rgba(0,0,0,1)';
    const alpha = parseFloat(existing.split(',')[3]) || 1;
  
    updateTextBox({
      ...selectedTextBox,
      backgroundColor: `rgba(${r}, ${g}, ${b}, ${alpha})`,
    });
  };
  


  const handleAlphaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const alpha = parseInt(e.target.value);
    const existing = selectedTextBox.backgroundColor || 'rgba(0,0,0,1)';
    const rgba = existing.match(/rgba\((\d+), (\d+), (\d+), ([\d.]+)\)/);
    if (rgba) {
      const [_, r, g, b] = rgba;
      updateTextBox({
        ...selectedTextBox,
        backgroundColor: `rgba(${r}, ${g}, ${b}, ${alpha / 100})`,
      });
    }
  };
  

  const toggleBold = () => {
    updateTextBox({
      ...selectedTextBox,
      isBold: !selectedTextBox.isBold,
    });
  };

  const toggleItalic = () => {
    updateTextBox({
      ...selectedTextBox,
      isItalic: !selectedTextBox.isItalic,
    });
  };

  const toggleUnderline = () => {
    updateTextBox({
      ...selectedTextBox,
      isUnderlined: !selectedTextBox.isUnderlined,
    });
  };

  const handleAlignmentChange = (alignment: 'left' | 'center' | 'right') => {
    updateTextBox({
      ...selectedTextBox,
      textAlign: alignment,
    });
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateTextBox({
      ...selectedTextBox,
      content: e.target.value,
    });
  };


  const [awsFonts, setAwsFonts] = useState<{ name: string; fontFamily: string; url: string }[]>([]);

  useEffect(() => {
    fetch('http://localhost:7000/fonts')
      .then((res) => {
        console.log("Raw response:", res); 
        return res.json();                
      })
      .then((fonts) => {
        console.log("Parsed fonts:", fonts); 
  
        setAwsFonts(fonts);
  
        fonts.forEach((font: any) => {
          const fontFace = new FontFace(font.fontFamily, `url(${font.url})`);
        
          fontFace.load().then((loaded) => {
            document.fonts.add(loaded);
            console.log(`Loaded font: ${font.fontFamily}`);
          });
        });
      })
      .catch((err) => {
        console.error("Failed to load AWS fonts:", err);
      });
  }, []);



  const handleUploadFont = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.name.match(/\.(ttf|woff2?|otf)$/)) {
      toast.error("Please upload a valid font file (.ttf, .woff, .woff2, .otf)");
      return;
    }
  
    const ext = file.name.split('.').pop(); // ttf, woff, etc.
    const fontName = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
    const fontFamily = fontName.replace(/\s+/g, '-'); // Sanitize for CSS
  
    const formData = new FormData();
    formData.append("file", file);
    formData.append("fontFamily", fontFamily);
  
    try {
      const res = await fetch("http://localhost:7000/upload-font", {
        method: "POST",
        body: formData,
      });
  
      console.log("Upload response status:", res.status);
  
      let data: any = {};
      try {
        data = await res.json();
      } catch (jsonErr) {
        // Allow success if font uploaded but backend response is not JSON
        console.warn("⚠️ Server returned invalid JSON, assuming success if font is uploaded.");
      }
  
      if (!res.ok) {
        throw new Error(data?.error || "Upload failed with unknown error");
      }
  
      const fontUrl = data.fontUrl || `https://your-s3-bucket-url/fonts/${file.name}`; // fallback if no fontUrl returned
  
      const fontFace = new FontFace(fontFamily, `url(${fontUrl})`);
      // await fontFace.load();
      // document.fonts.add(fontFace);

      // fontFace.load().then(() => {
      //   document.fonts.add(fontFace);
      //   // console.log(`✅ Font "${fontFamily}" added.`);
      // }).catch(err => {
      //   console.error(`❌ Failed to load font "${fontFamily}":`, err);
      // });

      fontFace.load().then((loadedFont) => {
        document.fonts.add(loadedFont);
        console.log("✅ Loaded font:", loadedFont.family);
      });
      
      

      
  
      setAwsFonts(prev => [
        ...prev,
        { name: fontName, fontFamily, url: fontUrl }
      ]);
  
      toast.success(`✅ Font "${fontName}" uploaded and available!`);
    } catch (err) {
      console.error("❌ Font upload failed:", err);
      if (err instanceof TypeError && err.message.includes("fetch")) {
        toast.error("Upload failed: Network error – is the backend server running?");
      } else {
        toast.error("Upload failed: " + (err as Error).message);
      }
    }
  
    e.target.value = ''; // Reset input
  };
  


  // Extract hex and alpha from rgba string
  const rgbaMatch = selectedTextBox.backgroundColor?.match(/rgba\((\d+), (\d+), (\d+), ([\d.]+)\)/);
  const r = rgbaMatch ? parseInt(rgbaMatch[1]) : 0;
  const g = rgbaMatch ? parseInt(rgbaMatch[2]) : 0;
  const b = rgbaMatch ? parseInt(rgbaMatch[3]) : 0;
  const a = rgbaMatch ? parseFloat(rgbaMatch[4]) : 1;

  const colorHex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  const alpha = Math.round(a * 100);
  const uploadFontRef = useRef<HTMLInputElement>(null);


  const lang = detectLang(selectedTextBox.content);
  const fontFromJson = selectedTextBox.font?.[lang]?.replace(".ttf", "");
  const fontValue = fontFromJson || selectedTextBox.fontFamily || "Itim-Regular";




  return (
    <div className="p-3 space-y-4">
      <h3 className="font-medium text-base">Text Box Properties</h3>

      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span>X: {Math.round(selectedTextBox.x)}</span>
          <span>Y: {Math.round(selectedTextBox.y)}</span>
        </div>

        <div className="flex justify-between text-sm">
          <span>Width:  {Math.round(selectedTextBox.width)}</span>
          <span>Height: {Math.round(selectedTextBox.height)}</span>
        </div>

        <div>
          <Label htmlFor="font-size" className="text-sm">Font Size</Label>
          <Input
            id="font-size"
            type="number"
            value={selectedTextBox.fontSize}
            onChange={handleFontSizeChange}
            className="h-9 mt-1"
            min={8}
            max={72}
          />
        </div>




        <div className="mt-2">
          <Label htmlFor="font-aws" className="text-sm">Font Style (Online)</Label>
          <select
            id="font-aws"
            // value={selectedTextBox.fontFamily || "Itim-Regular"}
            value={fontValue}
            // onChange={(e) => updateTextBox({ ...selectedTextBox, fontFamily: e.target.value })}
            onChange={(e) => {
              const newFont = e.target.value;
              console.log("🎯 Setting fontFamily to:", newFont);

              updateTextBox({
                ...selectedTextBox,
                fontFamily: newFont,
                font: {
                  ...(selectedTextBox.font || {}),
                  [lang]: `${newFont}.ttf`
                }
              });
            }}

            className="w-full h-9 mt-1 border rounded px-2 text-sm"
          >
            {awsFonts.map((font) => (
              <option
                key={font.fontFamily}
                value={font.fontFamily}
                style={{ fontFamily: font.fontFamily }}
              >
                {font.name}
              </option>
            ))}
          </select>
        </div>


        <div className="mt-1">
          <input
            type="file"
            accept=".ttf"
            ref={uploadFontRef}
            style={{ display: 'none' }}
            onChange={handleUploadFont}
          />
          <Button
            className="w-full mt-2 bg-gray-400 hover:bg-gray-500 text-white text-sm"
            onClick={() => uploadFontRef.current?.click()}
          >
            Upload Font (TTF)
          </Button>
        </div>


        <div>
          <Label htmlFor="font-color" className="text-sm">Font Color</Label>
          <div className="flex items-center mt-1">
            <Input
              id="font-color"
              type="color"
              value={selectedTextBox.color}
              onChange={handleColorChange}
              className="w-full h-9 p-1"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="bg-color" className="text-sm">Background Color</Label>
          <div className="flex items-center mt-1">
            <Input
              id="bg-color"
              type="color"
              value={colorHex}
              onChange={handleBackgroundColorChange}
              className="w-full h-9 p-1"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="bg-alpha" className="text-sm">Transparency</Label>
          <Input
            id="bg-alpha"
            type="range"
            min={0}
            max={100}
            value={alpha}
            onChange={handleAlphaChange}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm">Text Formatting</Label>
          <div className="flex items-center justify-between">
            {/* <div className="flex space-x-1"> */}


              {/* <Button
                variant="outline"
                size="sm"
                className={`w-8 h-8 p-0 ${selectedTextBox.isBold ? 'bg-editor-blue text-white' : ''}`}
                onClick={toggleBold}
              >
                B
              </Button> */}
              {/* <Button
                variant="outline"
                size="sm"
                className={`w-8 h-8 p-0 ${selectedTextBox.isItalic ? 'bg-editor-blue text-white' : ''}`}
                onClick={toggleItalic}
              >
                I
              </Button> */}
              {/* <Button
                variant="outline"
                size="sm"
                className={`w-8 h-8 p-0 ${selectedTextBox.isUnderlined ? 'bg-editor-blue text-white' : ''}`}
                onClick={toggleUnderline}
              >
                U
              </Button> */}

              
            {/* </div> */}

            <div className="flex space-x-1">
              <Button
                variant="outline"
                size="sm"
                className={`w-8 h-8 p-0 ${selectedTextBox.textAlign === 'left' ? 'bg-editor-blue text-white' : ''}`}
                onClick={() => handleAlignmentChange('left')}
              >
                <AlignLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className={`w-8 h-8 p-0 ${selectedTextBox.textAlign === 'center' ? 'bg-editor-blue text-white' : ''}`}
                onClick={() => handleAlignmentChange('center')}
              >
                <AlignCenter className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className={`w-8 h-8 p-0 ${selectedTextBox.textAlign === 'right' ? 'bg-editor-blue text-white' : ''}`}
                onClick={() => handleAlignmentChange('right')}
              >
                <AlignRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <Label htmlFor="text-content" className="text-sm">Text Content:</Label>
          <Textarea
            id="text-content"
            value={selectedTextBox.content}
            onChange={handleContentChange}
            className="min-h-[100px] mt-1 text-sm"
          />
        </div>

      </div>
    </div>
  );
};

export default PropertiesPanel;
