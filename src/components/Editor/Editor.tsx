
import React, { useState, useEffect , useRef, forwardRef} from 'react';
import { toast } from 'sonner';
import Canvas from './Canvas';
import Sidebar from './Sidebar';
import Toolbar from './Toolbar';
import PropertiesPanel from './PropertiesPanel';
import { TextBoxType } from '@/types/editor';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Save, Eye, Lock, Unlock, Home, Check } from 'lucide-react';
import PageTabBar from './SortablePageTab';

import { useLocation } from "react-router-dom";

import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import SortablePageTab from './SortablePageTab'; 
import { useNavigate } from "react-router-dom";







interface EditorProps {
  selectedStory: string;
  initialPages: Page[];
  initialTextData: any;
  selectedGender: string;
}


export interface Page {
  id: string;
  name: string;
  baseImage: string | null;
  backgroundImage: string | null;
  foregroundImage: string | null;
  textBoxes: TextBoxType[];
}


interface ImageState {
  x: number;
  y: number;
  width: number;
  height: number;
  dragging: boolean;
  resizing: boolean;
  offsetX: number;
  offsetY: number;
  locked: boolean;
}



const Editor: React.FC<EditorProps> = ({ selectedStory, initialPages, initialTextData, selectedGender }) => {
  const [pages, setPages] = useState<Page[]>(() =>
    initialPages && initialPages.length > 0
      ? initialPages
      : [
          {
            id: `page-${Date.now()}`,
            name: "Page 0",
            baseImage: null,
            backgroundImage: null,
            foregroundImage: null,
            textBoxes: [],
          },
        ]
  );

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const gender = queryParams.get("gender") || "male";


  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [selectedTextBox, setSelectedTextBox] = useState<TextBoxType | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const [imageStates, setImageStates] = useState<Record<string, Record<string, ImageState>>>({});

  // const isNewStory = queryParams.get("isNewStory") === "true";
  // const isNewStory = query.get("isNew") === "true";
  const isNewStory = queryParams.get("isNew") === "true";




  const [width, setWidth] = useState(1754);
  const [height, setHeight] = useState(1240);

  // const canvasRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<any>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 1754, height: 1240 });

  const [awsFonts, setAwsFonts] = useState<{ name: string; fontFamily: string; url: string }[]>([]);

  const sensors = useSensors(useSensor(PointerSensor));
  
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
  

  


  useEffect(() => {
    if (!selectedStory) return;
  
    const fetchImagesAndBuildPages = async () => {
      try {
        // Fetch background
        const bgRes = await fetch("http://localhost:7000/get_image_data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            storyName: selectedStory,
            imageType: "background",
          }),
        });
        const bgData = await bgRes.json();
  
        if (!bgData.pages || bgData.pages.length === 0) {
          toast.error("No background pages returned from backend.");
          return;
        }
  
        // Fetch foreground
        const fgRes = await fetch("http://localhost:7000/get_image_data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            storyName: selectedStory,
            imageType: "foreground",
          }),
        });
        const fgData = await fgRes.json();


        // ✅ Fetch base base
        const baseRes = await fetch("http://localhost:7000/get_image_data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            storyName: selectedStory,
            imageType: "base", 
            gender: selectedGender, 
          }),
        });
        const baseData = await baseRes.json();
        console.log("🧱 Base image data:", baseData);


        const textRes = await fetch("http://localhost:7000/get_text_boxes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            storyName: selectedStory,
            gender: gender,
            lang: "en"
          }),
        });
        const textData = await textRes.json();
        console.log("📄 textData response:", textData);
      

        // ✅ Flatten and filter pages
        const rawTextItems: any[] = Object.entries(textData?.json || {})
          .flatMap(([key, value]) => {
            const match = key.match(/Page (\d+)/);
            if (!match) return [];

            const page = parseInt(match[1], 10);
            if (!Number.isInteger(page)) return [];

            return (value as any[]).map(entry => ({
              ...entry,
              page
            }));
          });

        

        const mergedPages: Page[] = bgData.pages.map((bgPage: any, i: number) => {
          const fgPage = fgData.pages?.[i] || {};
          // const basePage = baseData.pages?.[i] || {}; 
          const matchingText = rawTextItems.find((item: any) => item.page === i);

          const textConfig = matchingText?.text_config;
          const enConfig = textConfig?.en || textConfig;  

          const x_y = enConfig?.x_y;
          const storyText = enConfig?.story_text;

          console.log(`🔍 Page ${i} enConfig:`, enConfig);
          console.log(`📍 x_y for page ${i}:`, x_y);

          const textBoxes: TextBoxType[] = [];

          ["en", "th"].forEach((lang) => {
            const cfg = textConfig?.[lang];
            if (cfg?.story_text && cfg?.x_y) {
              textBoxes.push({
                id: `text-${i}-${lang}`,
                x: cfg.x_y[0],
                y: cfg.x_y[1],
                width: cfg.textbox_width ?? 600,
                height: cfg.textbox_height ?? 250,
                content: cfg.story_text,
                fontSize: cfg.font_size ?? 40,
                // fontFamily: cfg.font?.[lang] ?? "Arial",
                fontFamily: (cfg.font?.[lang] ?? "Arial").replace(/\.ttf$/i, '').replace(/\s+/g, '-'),
                color: cfg.font_color ?? "#000000",
                isBold: false,
                isItalic: false,
                isUnderlined: false,
                textAlign: cfg.text_align ?? "left",
                backgroundColor: "transparent",
                borderColor: "#cccccc",
                borderWidth: 0,
                font: cfg.font ?? undefined,
                
              });
            }
          });

       

          return {
            id: `page-${i}`,
            name: `Page ${i}`,
            // baseImage: null,
            baseImage: baseData.pages?.[i]?.baseImage || null,
            backgroundImage: bgPage.backgroundImage || null,
            foregroundImage: fgPage.foregroundImage || null,
            textBoxes,
          };
        });

        
        console.log("✅ Final mergedPages with textBoxes:", mergedPages);
        setPages(mergedPages);
        



        setCurrentPageIndex(0);
        toast.success("✅ All assets loaded: background, foreground, and text");
      } catch (err) {
        console.error("❌ Failed to load editor assets:", err);
        toast.error("❌ Failed to load background/foreground/text");
      }
    };
  
    fetchImagesAndBuildPages();
  }, [selectedStory]);
  
  

  

  useEffect(() => {
    if (pages.length === 0) return;
    console.log("✅ Current background image:", pages[currentPageIndex]?.backgroundImage);
  }, [pages, currentPageIndex]);
  


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
  
  // const [baseImages, setBaseImages] = useState<string[]>([
  //   "https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=150&h=100&fit=crop",
  //   "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=150&h=100&fit=crop",
  //   "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=150&h=100&fit=crop",
  //   "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=150&h=100&fit=crop",
  //   "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=150&h=100&fit=crop",
  // ]);
  // const [backgroundImages, setBackgroundImages] = useState<string[]>([]);
  // const [foregroundImages, setForegroundImages] = useState<string[]>([]);

  const [baseImages, setBaseImages] = useState<string[]>([]);
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
      }, 100); 
    } else {
      console.error("❌ canvasRef.current.saveCanvas is undefined");
    }
  };


  const handleExportTextJson = async () => {
    try {
      const exportData = pages.map((page, index) => ({
        // page: index + 1,
        page: index,
        backgroundImage: page.backgroundImage || null,
        foregroundImage: page.foregroundImage || null,
        textBoxes: page.textBoxes.map(tb => ({
          x: tb.x,
          y: tb.y,
          width: tb.width,
          height: tb.height,
          fontFamily: `${tb.fontFamily}.ttf`,
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
        body: JSON.stringify({ pages: exportData , story_name: selectedStory,gender: selectedGender,})
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


  const toggleLock = (pageName: string, type: 'base' | 'background' | 'foreground') => {
    setImageStates(prev => {
      const current = prev[pageName]?.[type];
      if (!current) {
        console.warn("⚠️ No image state to toggle lock for", pageName, type);
        return prev;
      }
  
      console.log(" Updating lock state:", pageName, type, "from", current.locked, "to", !current.locked);
  
      return {
        ...prev,
        [pageName]: {
          ...prev[pageName],
          [type]: {
            ...current,
            locked: !current.locked,
          },
        },
      };
    });
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


  const handleGeneratePDF = () => {
    const query = new URLSearchParams({
      story: selectedStory,
      gender: selectedGender,
    }).toString();
  
    window.open(`/generatepdf?${query}`, "_blank");
  };


  const handleApproveAPI = async () => {
    try {
      const exportData = pages.map((page, index) => ({
        page: page.name,
        // baseImage: page.baseImage,
        backgroundImage: page.backgroundImage,
        foregroundImage: page.foregroundImage,
        textBoxes: page.textBoxes.map(tb => ({
          x: tb.x,
          y: tb.y,
          width: tb.width,
          height: tb.height,
          fontFamily: `${tb.fontFamily}.ttf`,
          fontSize: tb.fontSize,
          color: tb.color,
          backgroundColor: tb.backgroundColor,
          isBold: tb.isBold || false,
          isItalic: tb.isItalic || false,
          isUnderlined: tb.isUnderlined || false,
          textAlign: tb.textAlign || "left",
          content: tb.content,
        }))
      }));
  
      const response = await fetch("http://localhost:7000/approve-api-prod", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          story_name: selectedStory.replace(/^dev-/, "prod-"),
          gender: selectedGender,
          pages: exportData,
        }),
      });
  
      const result = await response.json();
      if (result.success) {
        toast("✅ Approved and saved JSON to prod!");
      } else {
        toast.error(`❌ Approve failed: ${result.error}`);
      }
    } catch (err) {
      console.error("❌ Approve API error:", err);
      toast.error("❌ Approve API failed.");
    }
  };

  // const handleUpdatePage = () => {
  //   const updatedPages = pages.map((page, index) => ({
  //     ...page,
  //     name: `Page ${index}`
  //   }));
  //   setPages(updatedPages);
  //   toast(" Page names updated!");
  // };

  const handleUpdatePage = () => {
  const oldPages = [...pages]; // Keep a copy to track original page names

  // Rename pages to sequential Page 0, Page 1, ...
  const updatedPages = pages.map((page, index) => ({
    ...page,
    name: `Page ${index}`,
  }));
  setPages(updatedPages);

  // ✅ Remap imageStates to match new page names
  const updatedImageStates: typeof imageStates = {};
  updatedPages.forEach((page, index) => {
    const oldKey = oldPages[index]?.name;
    const newKey = page.name;
    if (imageStates[oldKey]) {
      updatedImageStates[newKey] = imageStates[oldKey];
    }
  });
  setImageStates(updatedImageStates);

  toast("✅ Page names and image states updated!");
};


  const navigate = useNavigate();

  const [showNewStoryForm, setShowNewStoryForm] = useState(false);
  const [newStoryName, setNewStoryName] = useState("");
  const [newStoryGender, setNewStoryGender] = useState("male");

 

  

  const handleGo = async () => {
    if (!newStoryName.trim()) {
      alert("Please enter a story name.");
      return;
    }
  
    const storyName = `dev-${newStoryName.trim().toLowerCase().replace(/\s+/g, "-")}`;
    const gender = newStoryGender;
  
    try {
      const res = await fetch(`http://localhost:7000/${storyName}?gender=${gender}`, {
        method: "POST",
      });
  
      if (!res.ok) {
        const text = await res.text();
        alert(`❌ Server returned ${res.status}: ${text}`);
        return;
      }
  
      const result = await res.json();
      if (!result.success) {
        alert("❌ Failed to create story: " + result.error);
        return;
      }
  
      // alert(" Story created!");
      toast.success("✅ Story created!");

  
      //  Open the new story in a new tab (same base path, just new story name)
      // const newUrl = `${window.location.origin}/${storyName}?gender=${gender}`;
      const newUrl = `${window.location.origin}/${storyName}?gender=${gender}&isNew=true`;

      window.open(newUrl, "_blank");
  
      // Optional cleanup
      setShowNewStoryForm(false);
      setNewStoryName("");
      setNewStoryGender("male");
  
    } catch (err: any) {
      alert("❌ Error: " + err.message);
    }
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
                {/* <div className="text-sm font-semibold mb-2">Page {index}</div> */}
                <div className="text-sm font-semibold mb-2">{page.name}</div>


                {/* Upload / Show / Delete controls */}
                {(['base', 'background', 'foreground'] as const).map(type => {
               
                  const key = `${page.id}-${type}`;
                  const isLocked = imageStates[page.name]?.[type]?.locked ?? true;
                  // const isBaseUploadDisabled = type === 'base' && !isNewStory;

                  // const isBase = type === "base";
                  const isBaseDisabled = type === 'base' && !isNewStory;

                  return (


                    <div key={type} className="mb-2">
                      <div className="flex flex-row gap-1 items-center">


                        {/* <button
                          className="flex-1 bg-red-400 text-white p-2 rounded-md text-sm hover:bg-red-500"
                          onClick={() => triggerFileInput(type)}
                        >
                          Upload {type}
                        </button> */}

                        {/* <button
                          className={`flex-1 p-2 rounded-md text-sm ${
                            isBaseUploadDisabled
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-red-400 text-white hover:bg-red-500'
                          }`}
                          onClick={() => {
                            if (!isBaseUploadDisabled) triggerFileInput(type);
                          }}
                          disabled={isBaseUploadDisabled}
                        >
                          Upload {type}
                        </button> */}

                        <button
                          className={`flex-1 ${isBaseDisabled ? 'bg-gray-300 cursor-not-allowed' : 'bg-red-400 hover:bg-red-500'} text-white p-2 rounded-md text-sm`}
                          onClick={() => !isBaseDisabled && triggerFileInput(type)}
                          disabled={isBaseDisabled}
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


                        <button
                          className="bg-gray-200 p-1 rounded hover:bg-gray-300"
                          onClick={() => {
                            console.log("🔁 Toggling lock for:", page.name, type);
                            toggleLock(page.name, type);
                          }}
                          title={isLocked ? "Lock" : "Unlock"} 
                        >
                          {isLocked ? (
                            <Lock className="w-4 h-4" />
                          ) : (
                            <Unlock className="w-4 h-4" />
                          )}
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

                {/*  Text Box list */}


                {index === currentPageIndex && page.textBoxes.map((textBox) => (
                  <div key={textBox.id} className="flex gap-1 mt-2 items-center">
                    <button
                      className={`flex-1 text-white p-2 rounded-md text-sm transition-colors ${
                        selectedTextBox?.id === textBox.id
                          ? 'bg-blue-600'            //  Blue if selected
                          : 'bg-gray-300 text-black hover:bg-gray-400' //  Gray if not selected
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
            {/* <div className="flex-1 flex overflow-x-auto space-x-2 py-1"> */}
            <div className="flex flex-wrap gap-2">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={({ active, over }) => {
                  if (!over || active.id === over.id) return;
                  const oldIndex = pages.findIndex(p => p.id === active.id);
                  const newIndex = pages.findIndex(p => p.id === over.id);
                  const newPages = arrayMove(pages, oldIndex, newIndex);
                  setPages(newPages);

                  if (currentPageIndex === oldIndex) {
                    setCurrentPageIndex(newIndex);
                  } else if (currentPageIndex > oldIndex && currentPageIndex <= newIndex) {
                    setCurrentPageIndex(currentPageIndex - 1);
                  } else if (currentPageIndex < oldIndex && currentPageIndex >= newIndex) {
                    setCurrentPageIndex(currentPageIndex + 1);
                  }
                }}
              >
                <SortableContext items={pages.map(p => p.id)} strategy={horizontalListSortingStrategy}>
                  {pages.map((page, index) => (
                    <SortablePageTab
                      key={page.id}
                      page={page}
                      index={index}
                      currentPageIndex={currentPageIndex}
                      setCurrentPageIndex={setCurrentPageIndex}
                    />

                    
                  ))}
                </SortableContext>
              </DndContext>
           
            </div>
            
            <div className="flex space-x-2">
              <Button onClick={addPage} size="sm" className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4" />
                <span>Add Page</span>
              </Button>

              <Button className="bg-yellow-600 text-white hover:bg-yellow-700" onClick={handleUpdatePage}>
              Update Page
              </Button>



              <Button onClick={deletePage} variant="destructive" size="sm" className="flex items-center gap-1">
                <Trash2 className="h-4 w-4" />
                <span>Delete Page</span>
              </Button>
              <Button onClick={savePage} variant="outline" size="sm" className="flex items-center gap-1 bg-yellow-500">
                <Save className="h-4 w-4" />
                <span>Save Image</span>
              </Button>

              <Button onClick={handleExportTextJson} className="bg-green-500 text-white">
              Export JSON File
            </Button>

            <Button
             onClick={handleGeneratePDF}
             className = "bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
              Generate PDF
            </Button>

            <Button onClick={handleApproveAPI} className="bg-purple-600 text-white flex items-center gap-1">
              <Check className="h-4 w-4" />
              <span>Approve API</span>
            </Button>


            <Button
              onClick={() => window.location.href = '/'}
              className="flex items-center gap-1 bg-gray-500 hover:bg-gray-600 text-white"
              size="sm"
            >
              <Home className="h-4 w-4" />
              <span>Main Page</span>
            </Button>


          {showNewStoryForm ? (
            <div className="flex gap-2 items-center bg-white p-2 rounded border">
              <input
                type="text"
                placeholder="Story name"
                className="px-2 py-1 border rounded text-sm"
                value={newStoryName}
                onChange={(e) => setNewStoryName(e.target.value)}
              />
              <select
                className="px-2 py-1 border rounded text-sm"
                value={newStoryGender}
                onChange={(e) => setNewStoryGender(e.target.value)}
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
              <Button
                className="bg-blue-600 text-white hover:bg-blue-700"
                onClick={handleGo}
              >
                Go
              </Button>
              <Button
                className="bg-gray-300 hover:bg-gray-400"
                onClick={() => setShowNewStoryForm(false)}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => setShowNewStoryForm(true)}
              className="bg-black text-white hover:bg-gray-800"
            >
              + New Story
            </Button>
          )}


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
                // initialTextBoxes={pages[currentPageIndex].textBoxes}
                initialTextBoxes={pages[currentPageIndex]?.textBoxes || []}
                onTextBoxesChange={(updatedTextBoxes) => {
                  const updatedPages = [...pages];
                  updatedPages[currentPageIndex].textBoxes = updatedTextBoxes;
                  setPages(updatedPages);
                }}
                baseImage={pages[currentPageIndex].baseImage}
                backgroundImage={pages[currentPageIndex].backgroundImage}
                foregroundImage={pages[currentPageIndex].foregroundImage}
                onSaveCanvas={handleSaveCanvas}
                currentPageIndex={currentPageIndex}   
                pages={pages}
                imageStates={imageStates}
                setImageStates={setImageStates}
                onToggleLock={toggleLock}

                
              />
            </div>
          </div>
          
         
        </div>
        
        {/* Right properties panel */}
        <div className="w-[220px] bg-white border-l border-gray-200">

          <PropertiesPanel selectedTextBox={selectedTextBox} updateTextBox={updateTextBox} canvasSize={canvasSize} awsFonts={awsFonts} />

        </div>
      </div>
    </div>
  );
};

export default Editor;
