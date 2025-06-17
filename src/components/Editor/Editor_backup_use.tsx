
import React, { useState, useEffect , useRef, forwardRef} from 'react';
import { toast } from 'sonner';
import Canvas from './Canvas';
import Sidebar from './Sidebar';
import Toolbar from './Toolbar';
import PropertiesPanel from './PropertiesPanel';
import { TextBoxType } from '@/types/editor';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Save, Eye } from 'lucide-react';




// Define a Page type to represent each page in the editor
interface Page {
  id: string;
  name: string;
  baseImage: string | null;
  backgroundImage: string | null;
  foregroundImage: string | null;
  textBoxes: TextBoxType[];
}

const Editor: React.FC = () => {
  // Page management
  const [pages, setPages] = useState<Page[]>([
    {
      id: `page-${Date.now()}`,
      // name: 'Page 1',
      name: 'Page 0',
      baseImage: null,
      backgroundImage: null,
      foregroundImage: null,
      textBoxes: [],
    },
  ]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [selectedTextBox, setSelectedTextBox] = useState<TextBoxType | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const [width, setWidth] = useState(1754);
  const [height, setHeight] = useState(1240);

  // const canvasRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<any>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 1754, height: 1240 });

  // const [currentPageIndex, setCurrentPageIndex] = useState(0);

  // const [storyName, setStoryName] = useState("dev-magical-zoo-dream");
  // const [gender, setGender] = useState("male");

  
  // useEffect(() => {
  //   const resizeObserver = new ResizeObserver(() => {
  //     if (canvasRef.current) {
  //       setCanvasSize({
  //         width: canvasRef.current.clientWidth,
  //         height: canvasRef.current.clientHeight,
  //       });
  //     }
  //   });
  
  //   if (canvasRef.current) {
  //     resizeObserver.observe(canvasRef.current);
  //   }
  
  //   return () => resizeObserver.disconnect();
  // }, []);
  

  useEffect(() => {
    const element = canvasRef.current?.getCanvasElement?.();
    if (!element) return;
  
    const resizeObserver = new ResizeObserver(() => {
      setCanvasSize({
        width: element.clientWidth,
        height: element.clientHeight,
      });
    });
  
    resizeObserver.observe(element);
  
    return () => resizeObserver.disconnect();
  }, []);
  

  // const [showPreview, setShowPreview] = useState<{ [key: string]: boolean }>({});
  const [showImagePreview, setShowImagePreview] = useState<{
    [pageId: string]: { base: boolean; background: boolean; foreground: boolean };
  }>({});
  
  const [baseImages, setBaseImages] = useState<string[]>([
    "https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=150&h=100&fit=crop",
    "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=150&h=100&fit=crop",
    "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=150&h=100&fit=crop",
    "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=150&h=100&fit=crop",
    "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=150&h=100&fit=crop",
  ]);
  const [backgroundImages, setBackgroundImages] = useState<string[]>([]);
  const [foregroundImages, setForegroundImages] = useState<string[]>([]);

  // Get current page
  const currentPage = pages[currentPageIndex];

  // Add a new page
  const addPage = () => {
    const newPage: Page = {
      id: `page-${Date.now()}`,
      // name: `Page ${pages.length + 1}`,
      name: `Page ${pages.length}`,
      baseImage: null,
      backgroundImage: null,
      foregroundImage: null,
      textBoxes: [],
    };
    
    setPages([...pages, newPage]);
    // Switch to the new page
    setCurrentPageIndex(pages.length);
    toast.success(`Added ${newPage.name}`);
  };

  // Delete the current page
  const deletePage = () => {
    if (pages.length <= 1) {
      toast.error("Cannot delete the only page");
      return;
    }

    const updatedPages = pages.filter((_, index) => index !== currentPageIndex);
    setPages(updatedPages);
    
    // If we deleted the last page, go to the previous page
    if (currentPageIndex >= updatedPages.length) {
      setCurrentPageIndex(updatedPages.length - 1);
    }
    
    toast.success(`Deleted ${currentPage.name}`);
  };

  // Switch to a different page
  const switchPage = (index: number) => {
    if (index >= 0 && index < pages.length) {
      setCurrentPageIndex(index);
      // Reset selected elements when switching pages
      setSelectedElement(null);
      setSelectedTextBox(null);
      setSelectedImage(null);
    }
  };

  const updateTextBox = (textBox: TextBoxType) => {
    setSelectedTextBox(textBox);
    
    // Also update the textbox in the current page
    const updatedTextBoxes = currentPage.textBoxes.map(tb => 
      tb.id === textBox.id ? textBox : tb
    );
    
    saveCurrentPageTextBoxes(updatedTextBoxes);
  };

  const saveCurrentPageTextBoxes = (textBoxes: TextBoxType[]) => {
    setPages(prevPages => {
      const updatedPages = [...prevPages];
      updatedPages[currentPageIndex] = {
        ...updatedPages[currentPageIndex],
        textBoxes
      };
      return updatedPages;
    });
  };

  const handleImageSelect = (src: string, type: 'base' | 'background' | 'foreground' = 'base') => {
    console.log(`${type} image selected:`, src);

    // ✅ Do NOT set selectedImage, since Canvas.tsx should NOT handle it anymore
   
    setSelectedImage(src);
    
    // Update the current page with the selected image
    if (type === 'base' || type === 'background' || type === 'foreground') {
      setPages(prevPages => {
        const updatedPages = [...prevPages];
        
        // Only update if the current image is different
        if (updatedPages[currentPageIndex][`${type}Image` as keyof Pick<Page, 'baseImage' | 'backgroundImage' | 'foregroundImage'>] !== src) {
          updatedPages[currentPageIndex] = {
            ...updatedPages[currentPageIndex],
            [`${type}Image`]: src
          } as Page;
        }
        
        return updatedPages;
      });
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>, type: 'base' | 'background' | 'foreground') => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check if the file is an image
    if (!file.type.match('image.*')) {
      toast.error('Please select an image file');
      return;
    }

    // Create a URL for the image
    const imageUrl = URL.createObjectURL(file);
    
    // Add the image to the appropriate array
    switch (type) {
      case 'base':
        setBaseImages((prev) => [...prev, imageUrl]);
        handleImageSelect(imageUrl, type);
        break;
      case 'background':
        setBackgroundImages((prev) => [...prev, imageUrl]);
        handleImageSelect(imageUrl, type);
        break;
      case 'foreground':
        setForegroundImages((prev) => [...prev, imageUrl]);
        handleImageSelect(imageUrl, type);
        break;
    }

    toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} image uploaded successfully!`);
    
    // Reset the input value to allow uploading the same file again
    event.target.value = '';
  };

  const handleSaveCanvas = (canvasDataUrl: string, originalImageSrc: string, imageType?: 'background' | 'foreground') => {
    // Handle different image types
    if (imageType) {
      // For background and foreground images
      const imageIndex = imageType === 'background' 
        ? backgroundImages.findIndex(img => img === originalImageSrc)
        : foregroundImages.findIndex(img => img === originalImageSrc);
      
      if (imageIndex !== -1) {
        if (imageType === 'background') {
          const newImages = [...backgroundImages];
          newImages[imageIndex] = canvasDataUrl;
          setBackgroundImages(newImages);
        } else {
          const newImages = [...foregroundImages];
          newImages[imageIndex] = canvasDataUrl;
          setForegroundImages(newImages);
        }
        
        setSelectedImage(null);
        toast.success(`${imageType.charAt(0).toUpperCase() + imageType.slice(1)} image saved successfully!`);
      }
    } else {
      // Find the index of the original image in base images
      const imageIndex = baseImages.findIndex(img => img === originalImageSrc);
      
      if (imageIndex !== -1) {
        // Replace the original image with the new one
        const newImages = [...baseImages];
        newImages[imageIndex] = canvasDataUrl;
        setBaseImages(newImages);
        
        // Clear the selected image to reset the process
        setSelectedImage(null);
        
        // Show a success toast
        toast.success('Base image saved successfully!');
      }
    }
  };

  // // Save the current page
  // const savePage = () => {
  //   toast.success(`Saved ${currentPage.name}`);
  // };

  // const savePage = () => {
  //   if (canvasRef.current?.saveCanvas) {
  //     canvasRef.current.saveCanvas(); // ✅ This calls the backend + exports canvas
  //   } else {
  //     console.error("❌ canvasRef.current.saveCanvas is undefined");
  //   }
  // };

  // const savePage = () => {
  //   if (canvasRef.current?.saveCanvas) {
  //     const pageName = pages[currentPageIndex].name; // e.g., "Page 1"
  //     canvasRef.current.saveCanvas({
  //       pageName,
  //       baseImage: pages[currentPageIndex].baseImage,
  //       backgroundImage: pages[currentPageIndex].backgroundImage,
  //       foregroundImage: pages[currentPageIndex].foregroundImage,
  //     });
  //   } else {
  //     console.error("❌ canvasRef.current.saveCanvas is undefined");
  //   }
  // };


  const savePage = () => {
    if (canvasRef.current?.saveCanvas) {
      const page = pages[currentPageIndex];
      setTimeout(() => {
        canvasRef.current.saveCanvas({
          pageName: page.name,
          baseImage: page.baseImage,
          backgroundImage: page.backgroundImage,
          foregroundImage: page.foregroundImage,
        });
      }, 100); // ⏱ Give image refs and layout time to settle
    } else {
      console.error("❌ canvasRef.current.saveCanvas is undefined");
    }
  };

  // const savePage = () => {
  //   const page = pages[currentPageIndex];
  //   const pageName = page.name;
  
  //   const waitForReady = (retries = 10) => {
  //     const canvas = canvasRef.current;
  //     const bgState = canvas?.getImageState?.(pageName, 'background');
  //     const bgRef = canvas?.getImageRef?.('background');
  
  //     if (bgState && bgRef) {
  //       console.log("✅ Background ready, saving...");
  //       canvas.saveCanvas({
  //         pageName,
  //         baseImage: page.baseImage,
  //         backgroundImage: page.backgroundImage,
  //         foregroundImage: page.foregroundImage,
  //       });
  //     } else if (retries > 0) {
  //       console.log(`⏳ Waiting for background readiness... (${10 - retries + 1})`);
  //       setTimeout(() => waitForReady(retries - 1), 200);
  //     } else {
  //       // console.warn("❌ Background never became ready.");
  //       console.log("🔍 Checking image state and ref...", {
  //         state: canvasRef.current?.getImageState?.(pageName, 'background'),
  //         ref: canvasRef.current?.getImageRef?.('background'),
  //       });
  //     }
  //   };
  
  //   waitForReady();
  // };
  
  
  
  


  // const togglePreview = (type: keyof Page) => {
  //   const key = `${type}-${currentPageIndex}`;
  //   setShowPreview((prev) => ({
  //     ...prev,
  //     [key]: !prev[key],
  //   }));
  // };


  const handleExportTextJson = async () => {
    try {
      const exportData = pages.map((page, index) => ({
        // page: index + 1,
        page: index,
        textBoxes: page.textBoxes.map(tb => ({
          x: tb.x,
          y: tb.y,
          width: tb.width,
          height: tb.height,
          fontFamily: tb.fontFamily,
          fontSize: tb.fontSize,
          color: tb.color,
          backgroundColor: tb.backgroundColor,
          isBold: tb.isBold || false,
          isItalic: tb.isItalic || false,
          isUnderlined: tb.isUnderlined || false,
          textAlign: tb.textAlign || "left",
          content: tb.content
        }))
      }));
  
      const response = await fetch("http://localhost:7000/export-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pages: exportData })
      });
  
      const result = await response.json();
      console.log("✅ Export result:", result);
  
      if (result.success) {
        toast("✅ Text JSON exported successfully!");
      } else {
        toast.error(`❌ Export failed: ${result.error}`);
      }
    } catch (err) {
      console.error("❗ Unexpected export error:", err);
      toast.error(`Unexpected error: ${err.message || err}`);
    }
  };
  


  // const handleExportTextJson = async () => {
  //   try {
  //     const exportData = pages.map((page, index) => ({
  //       page: index + 1,
  //       textBoxes: page.textBoxes.map(tb => ({
  //         x: tb.x,
  //         y: tb.y,
  //         width: tb.width,
  //         height: tb.height,
  //         fontFamily: tb.fontFamily,
  //         fontSize: tb.fontSize,
  //         color: tb.color,
  //         backgroundColor: tb.backgroundColor,
  //         isBold: tb.isBold || false,
  //         isItalic: tb.isItalic || false,
  //         isUnderlined: tb.isUnderlined || false,
  //         textAlign: tb.textAlign || "left",
  //         content: tb.content
  //       }))
  //     }));
  
  //     // // Optionally replace these with state/props if user selects story/gender
  //     // const storyName = "dev-magical-zoo-dream";
  //     // const gender = "male";
  
  //     const response = await fetch(
  //       "http://localhost:7000/export-text",
  //       // `http://localhost:7000/export-text?story_name=${storyName}&gender=${gender}`,
  //       {
  //         method: 'POST',
  //         headers: { 'Content-Type': 'application/json' },
  //         body: JSON.stringify({ pages: exportData }),
  //       }
  //     );
  
  //     const result = await response.json();
  //     if (result.success) {
  //       toast("Text JSON exported successfully!");
  //     } else {
  //       toast(`Error: ${result.error}`);
  //     }
  //   } catch (err) {
  //     toast(`Unexpected error: ${err.message || err}`);
  //   }
  // };
  
  
  

  const handleDeleteImage = (src: string, type: 'base' | 'background' | 'foreground') => {
    switch (type) {
      case 'base':
        setBaseImages(prev => prev.filter(img => img !== src));
        break;
      case 'background':
        setBackgroundImages(prev => prev.filter(img => img !== src));
        break;
      case 'foreground':
        setForegroundImages(prev => prev.filter(img => img !== src));
        break;
    }
    
    // If the deleted image was selected, clear the selection
    if (selectedImage === src) {
      setSelectedImage(null);
    }
    
    // If the deleted image was used in the current page, update the page
    if (currentPage[`${type}Image` as keyof Pick<Page, 'baseImage' | 'backgroundImage' | 'foregroundImage'>] === src) {
      setPages(prevPages => {
        const updatedPages = [...prevPages];
        updatedPages[currentPageIndex] = {
          ...updatedPages[currentPageIndex],
          [`${type}Image`]: null
        } as Page;
        return updatedPages;
      });
    }
    
    toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} image deleted successfully!`);
  };

  // Add text box to the current page
  const addTextBox = () => {
    const count = currentPage.textBoxes.length + 1;
    const newTextBox: TextBoxType = {
      id: `text-${Date.now()}`,
      x: 100 + 10 * count,
      y: 100 + 10 * count,
      // x: 100,
      // y: 100,
      width: 200,
      height: 100,
      content: 'Text Area',
      fontSize: 16,
      color: '#000000',
      borderWidth: 1,
      borderColor: '#cccccc',
      isBold: false,
      isItalic: false,
      isUnderlined: false,
      textAlign: 'left'
    };
    
    // const updatedTextBoxes = [...currentPage.textBoxes, newTextBox];
    // saveCurrentPageTextBoxes(updatedTextBoxes);

 
    saveCurrentPageTextBoxes([...currentPage.textBoxes, newTextBox]);
    setSelectedTextBox(newTextBox);
    setSelectedElement(null);
    // setSelectedElement(null);
    // setSelectedTextBox(newTextBox);
  };

  // File inputs refs for direct upload buttons
  const fileInputRefs = {
    base: React.useRef<HTMLInputElement>(null),
    background: React.useRef<HTMLInputElement>(null),
    foreground: React.useRef<HTMLInputElement>(null),
  };

  const triggerFileInput = (type: 'base' | 'background' | 'foreground') => {
    fileInputRefs[type].current?.click();
  };

  return (
    <div className="flex flex-col h-screen bg-editor-gray">
      {/* Top navbar */}
      <div className="bg-editor-darkblue text-white p-2 flex items-center justify-between">
        <div className="flex space-x-6">
          <span className="font-semibold">Home</span>
          <span>Service</span>
          <span>Company</span>
        </div>
        <div>
          <span>Login / Register</span>
        </div>
      </div>
      
      {/* Main editor area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar - Properties & Pages */}
        <div className="w-[280px] bg-gray-100 border-r border-gray-200 flex flex-col">
          <div className="p-3 border-b border-gray-200">
            <h2 className="text-base font-semibold text-gray-700">Properties</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3">
            {/* Page selection and management */}
            <div className="space-y-4">


            {pages.map((page, index) => (
              <div
                key={page.id}
                className={`p-3 mb-3 rounded border ${
                  currentPageIndex === index ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                }`}
              >
                {/* <div className="text-sm font-semibold mb-2">{page.name}</div> */}
                <div className="text-sm font-semibold mb-2">Page {index}</div>

                {/* Upload / Show / Delete controls */}
                {(['base', 'background', 'foreground'] as const).map(type => {
                  const key = `${page.id}-${type}`;
                  return (
                    <div key={type} className="mb-2">
                      <div className="flex flex-row gap-1 items-center">
                        <button
                          className="flex-1 bg-red-400 text-white p-2 rounded-md text-sm hover:bg-red-500"
                          onClick={() => triggerFileInput(type)}
                        >
                          Upload {type}
                        </button>
                        <input
                          ref={fileInputRefs[type]}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={e => handleImageUpload(e, type)}
                        />
                        <button
                          className="bg-gray-200 p-1 text-xs rounded hover:bg-gray-300"
                          onClick={() => {
                            setShowImagePreview(prev => ({
                              ...prev,
                              [page.id]: {
                                ...prev[page.id],
                                [type]: !prev[page.id]?.[type],
                              },
                            }));
                          }}
                          disabled={!page[`${type}Image`]}
                          title="Show"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          className="bg-gray-200 p-1 text-xs rounded hover:bg-gray-300"
                          onClick={() =>
                            page[`${type}Image`] && handleDeleteImage(page[`${type}Image`]!, type)
                          }
                          disabled={!page[`${type}Image`]}
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>


                    {index === currentPageIndex &&
                      showImagePreview?.[page.id]?.[type] &&
                      page[`${type}Image`] && (
                        <div className="mt-2">
                          <img
                            src={page[`${type}Image`]!}
                            alt={`${type} preview`}
                            
                            className="w-full h-auto cover rounded border-2 border-blue-500"
                          />
                        </div>
                    )}

                    </div>
                  );
                })}

                {/* ➕ Add Text Box Button */}
                <button
                  className="mt-2 w-full bg-red-400 text-white text-sm p-2 rounded-md hover:bg-red-500"
                  onClick={() => {
                    const count = page.textBoxes.length + 1;
                    const newTextBox: TextBoxType = {
                      id: `text-${Date.now()}`,
                      x: 100 + 10 * count,
                      y: 100 + 10 * count,
                      width: 200,
                      height: 100,
                      content: 'Text Area',
                      fontSize: 16,
                      color: '#000000',
                      borderWidth: 1,
                      borderColor: '#cccccc',
                      isBold: false,
                      isItalic: false,
                      isUnderlined: false,
                      textAlign: 'left',
                    };

                    const updatedPages = [...pages];
                    updatedPages[index] = {
                      ...updatedPages[index],
                      textBoxes: [...updatedPages[index].textBoxes, newTextBox],
                    };

                    setPages(updatedPages);
                    setSelectedTextBox(newTextBox);
                    setSelectedElement(null);
                    setCurrentPageIndex(index);
                  }}
                >
                  Add Text Box
                </button>

                {/* 🔤 Text Box list */}


                {index === currentPageIndex && page.textBoxes.map((textBox) => (
                  <div key={textBox.id} className="flex gap-1 mt-2 items-center">
                    <button
                      className={`flex-1 text-white p-2 rounded-md text-sm transition-colors ${
                        selectedTextBox?.id === textBox.id
                          ? 'bg-blue-600'            // ✅ Blue if selected
                          : 'bg-gray-300 text-black hover:bg-gray-400' // ✅ Gray if not selected
                      }`}
                      onClick={() => setSelectedTextBox(textBox)}
                    >
                      Text Box
                    </button>
                    <button
                      className="bg-gray-200 p-2 rounded hover:bg-gray-300"
                      onClick={() => setSelectedTextBox(textBox)}
                      title="Show"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      className="bg-gray-200 p-2 rounded hover:bg-gray-300"
                      onClick={() => {
                        const updatedPages = [...pages];
                        updatedPages[index].textBoxes = updatedPages[index].textBoxes.filter(tb => tb.id !== textBox.id);
                        setPages(updatedPages);
                        if (selectedTextBox?.id === textBox.id) setSelectedTextBox(null);
                      }}
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}


              </div>
            ))}
            </div>
          </div>
        </div>
        
        {/* Center canvas area */}
        <div className="flex-1 flex flex-col">
          {/* Canvas controls and page tabs */}
          <div className="bg-white border-b border-gray-200 p-2 flex items-center justify-between">
            <div className="flex-1 flex overflow-x-auto space-x-2 py-1">
              {pages.map((page, index) => (
                <button
                  key={page.id}
                  className={`px-4 py-2 rounded-md text-sm ${
                    index === currentPageIndex 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                  onClick={() => switchPage(index)}
                >
                  {page.name}
                </button>
              ))}
            </div>
            
            <div className="flex space-x-2">
              <Button onClick={addPage} size="sm" className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4" />
                <span>Add Page</span>
              </Button>
              <Button onClick={deletePage} variant="destructive" size="sm" className="flex items-center gap-1">
                <Trash2 className="h-4 w-4" />
                <span>Delete Page</span>
              </Button>
              <Button onClick={savePage} variant="outline" size="sm" className="flex items-center gap-1">
                <Save className="h-4 w-4" />
                <span>Save Page</span>
              </Button>

              <Button onClick={handleExportTextJson} className="bg-green-500 text-white">
              Export JSON File
            </Button>

            </div>
          </div>
          
          {/* Canvas area */}
          <div className="flex-1 bg-blue-50 p-6 overflow-auto">
            <div className="w-[1754px] h-[1240px] mx-auto shadow-lg">
        
              <Canvas
                ref={canvasRef}
                selectedElement={selectedElement}
                setSelectedElement={setSelectedElement}
                selectedTextBox={selectedTextBox}
                setSelectedTextBox={setSelectedTextBox}
                initialTextBoxes={pages[currentPageIndex].textBoxes}
                onTextBoxesChange={(updatedTextBoxes) => {
                  const updatedPages = [...pages];
                  updatedPages[currentPageIndex].textBoxes = updatedTextBoxes;
                  setPages(updatedPages);
                }}
                baseImage={pages[currentPageIndex].baseImage}
                backgroundImage={pages[currentPageIndex].backgroundImage}
                foregroundImage={pages[currentPageIndex].foregroundImage}
                onSaveCanvas={handleSaveCanvas}
                currentPageIndex={currentPageIndex}   // ✅ add this
                pages={pages}
              />
            </div>
          </div>
          
         
        </div>
        
        {/* Right properties panel */}
        <div className="w-[220px] bg-white border-l border-gray-200">
          <div className="p-3 border-b border-gray-200">
            <h2 className="text-base font-semibold text-gray-700">Text Box Properties</h2>
          </div>
          
          {/* <PropertiesPanel selectedTextBox={selectedTextBox} updateTextBox={updateTextBox} /> */}

          <PropertiesPanel selectedTextBox={selectedTextBox} updateTextBox={updateTextBox} canvasSize={canvasSize} />

        </div>
      </div>
    </div>
  );
};

export default Editor;
