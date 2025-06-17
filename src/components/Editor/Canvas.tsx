import React, { useRef, useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import TextBox from './TextBox';
import { TextBoxType  } from '@/types/editor';
import { Save } from 'lucide-react';
import { ImageState } from '@/types/editor';
import { useLocation } from "react-router-dom";

interface CanvasProps {
  selectedElement: string | null;
  selectedImage?: string | null;
  onSaveCanvas?: (canvasDataUrl: string, originalImageSrc: string, imageType?: 'background' | 'foreground') => void;
  setSelectedElement?: (element: string | null) => void;
  initialTextBoxes?: TextBoxType[];
  onTextBoxesChange?: (textBoxes: TextBoxType[]) => void;
  backgroundImage?: string | null;
  baseImage?: string | null;
  foregroundImage?: string | null;
  selectedTextBox?: TextBoxType | null;
  setSelectedTextBox?: (textBox: TextBoxType | null) => void;
  currentPageIndex: number;
  pages: Page[];
  imageStates: Record<string, Record<string, ImageState>>;
  setImageStates: React.Dispatch<React.SetStateAction<Record<string, Record<string, ImageState>>>>;
  onToggleLock: (pageId: string, type: 'base' | 'background' | 'foreground') => void;
}

interface Page {
  name: string;
  baseImage: string | null;
  backgroundImage: string | null;
  foregroundImage: string | null;
}



export type CanvasHandle = {
  saveCanvas: (opts: {
    pageName: string;
    baseImage: string | null;
    backgroundImage: string | null;
    foregroundImage: string | null;
  }) => void;
  getCanvasElement: () => HTMLDivElement | null;
};

// export interface ImageState {
//   x: number;
//   y: number;
//   width: number;
//   height: number;
//   dragging: boolean;
//   resizing: boolean;
//   offsetX: number;
//   offsetY: number;
//   locked: boolean;
 
// }



const Canvas = forwardRef<CanvasHandle, CanvasProps>(({
  selectedElement,
  selectedImage,
  onSaveCanvas,
  setSelectedElement,
  initialTextBoxes = [],
  onTextBoxesChange,
  backgroundImage: propBackgroundImage,
  baseImage: propBaseImage,
  foregroundImage: propForegroundImage,
  selectedTextBox: propSelectedTextBox,
  setSelectedTextBox,
  pages,
  currentPageIndex,
  imageStates,
  setImageStates,
  onToggleLock,
}, ref) => {

  // console.log("📦 initialTextBoxes in Canvas:", initialTextBoxes);


  const [textBoxes, setTextBoxes] = useState<TextBoxType[]>(initialTextBoxes);
  const [selectedTextBoxId, setSelectedTextBoxId] = useState<string | null>(null);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);


  const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, max));
  const clampPosition = (x: number, y: number, width: number, height: number, canvasWidth: number, canvasHeight: number) => ({
    x: clamp(x, 0, canvasWidth - width),
    y: clamp(y, 0, canvasHeight - height),
  });
  const clampSize = (width: number, height: number, x: number, y: number, canvasWidth: number, canvasHeight: number) => ({
    width: clamp(width, 20, canvasWidth - x),
    height: clamp(height, 20, canvasHeight - y),
  });


// const [imageStates, setImageStates] = useState<Record<string, Record<string, ImageState>>>({});

  const imageRef = useRef<HTMLImageElement>(null);

  const location = useLocation();
  const query = new URLSearchParams(location.search);

  // const selectedStory = query.get("story");
  const selectedStory = location.pathname.split("/")[1];
  const selectedGender = query.get("gender");


 


  const page = pages[currentPageIndex];
  const pageKey = page?.name;
  
  const images = page
    ? [
        { id: 'base', src: page.baseImage, z: 1 },
        { id: 'background', src: page.backgroundImage, z: 0 },
        { id: 'foreground', src: page.foregroundImage, z: 2 },
      ].filter(img => img.src)
    : [];




    useEffect(() => {
      const pageKey = pages[currentPageIndex]?.name;
      if (!pageKey) return;
    
      for (const { id, src } of images) {
        if (!src) continue;
      
        const alreadySet = imageStates[pageKey]?.[id];
        if (alreadySet) continue;

        // const alreadySet = imageStates[pageKey]?.[id];
        // if (alreadySet && alreadySet.locked !== undefined) continue;

      
        const img = new Image();
      
        // ✅ Define handlers BEFORE setting src
        img.onload = () => {
          console.log('✅ Loaded into imageStates:', pageKey, id, img.naturalWidth, img.naturalHeight);
          setImageStates(prev => ({
            ...prev,
            [pageKey]: {
              ...(prev[pageKey] || {}),
              [id]: {
                x: 0,
                y: 0,
                width: img.naturalWidth,
                height: img.naturalHeight,
                dragging: false,
                resizing: false,
                offsetX: 0,
                offsetY: 0,
                locked: true,
              },
            },
          }));
        };
      
        img.onerror = () => {
          console.error('❌ Failed to preload image:', id, src);
        };
      
        img.src = src;
        console.log("🧪 Preloading image", id, src, pageKey);
      }
      
    // }, [pages, currentPageIndex, images]);
    }, [pages, currentPageIndex]);
    

  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 1754, height: 1240 });

  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      if (canvasRef.current) {
        setCanvasSize({
          width: canvasRef.current.clientWidth,
          height: canvasRef.current.clientHeight,
        });
      }
    });

    if (canvasRef.current) {
      resizeObserver.observe(canvasRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    setTextBoxes(initialTextBoxes);
  }, [initialTextBoxes]);

  useEffect(() => {
    if (propSelectedTextBox) {
      setSelectedTextBoxId(propSelectedTextBox.id);
    } else {
      setSelectedTextBoxId(null);
    }
  }, [propSelectedTextBox]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (selectedElement === 'text' && propBaseImage) {
      const canvasRect = canvasRef.current?.getBoundingClientRect();
      if (canvasRect) {
        const x = e.clientX - canvasRect.left;
        const y = e.clientY - canvasRect.top;

   


        const newTextBox: TextBoxType = {
          id: `text-${Date.now()}`,
          x,
          y,
          width: 200,
          height: 100,
          content: 'Text Area',
          fontSize: 16,
          color: '#000000',
          borderWidth: 1,
          borderColor: '#007bff',
          textAlign: 'left',
          // isBold: false,
          // isItalic: false,
          // isUnderlined: false,
          backgroundColor: 'rgba(0,0,0,0)',
        };

        const updated = [...textBoxes, newTextBox];
        setTextBoxes(updated);
        onTextBoxesChange?.(updated);
        setSelectedTextBoxId(newTextBox.id);
        setSelectedTextBox?.(newTextBox);
        setSelectedElement?.(null);
      }
    } else {
      setSelectedTextBoxId(null);
      setSelectedImageId(null);
      setSelectedTextBox?.(null);
    }
  };

 

  const originalCanvas = { width: 1754, height: 1240 };

  const updateTextBox = (updatedTextBox: TextBoxType) => {
    const { x, y } = clampPosition(
      updatedTextBox.x,
      updatedTextBox.y,
      updatedTextBox.width,
      updatedTextBox.height,
      originalCanvas.width,
      originalCanvas.height
    );
  
    const { width, height } = clampSize(
      updatedTextBox.width,
      updatedTextBox.height,
      x,
      y,
      originalCanvas.width,
      originalCanvas.height
    );
  
    const clampedTextBox = {
      ...updatedTextBox,
      x,
      y,
      width,
      height,
    };
  
    const updated = textBoxes.map(box =>
      box.id === clampedTextBox.id ? clampedTextBox : box
    );
  
    setTextBoxes(updated);
    onTextBoxesChange?.(updated);
    setSelectedTextBox?.(clampedTextBox);
  };
  


  
  

  const deleteSelectedTextBox = () => {
    if (selectedTextBoxId) {
      const updated = textBoxes.filter(box => box.id !== selectedTextBoxId);
      setTextBoxes(updated);
      onTextBoxesChange?.(updated);
      setSelectedTextBoxId(null);
      setSelectedTextBox?.(null);
    }
  };

  

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === 'Delete' || e.key === 'Backspace') &&
        selectedTextBoxId &&
        !document.activeElement?.matches('textarea, input')
      ) {
        deleteSelectedTextBox();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
  
     
        const currentPage = pages[currentPageIndex];
        if (!currentPage) return;
  
        saveCanvas({
          pageName: currentPage.name,
          baseImage: currentPage.baseImage,
          backgroundImage: currentPage.backgroundImage,
          foregroundImage: currentPage.foregroundImage,
        });
      }
    };
  
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTextBoxId, textBoxes, pages, currentPageIndex]);

  // const [selectedImageType, setSelectedImageType] = useState<"base" | "background" | "foreground">("background");


  // useEffect(() => {
  //   const handleKeyDown = (e: KeyboardEvent) => {
  //     const currentPage = pages[currentPageIndex];
  //     if (!currentPage) return;
  
  //     // Delete text box
  //     if (
  //       (e.key === 'Delete' || e.key === 'Backspace') &&
  //       selectedTextBoxId &&
  //       !document.activeElement?.matches('textarea, input')
  //     ) {
  //       deleteSelectedTextBox();
  //     }
  
  //     // Save with Ctrl/Cmd + S
  //     else if ((e.ctrlKey || e.metaKey) && e.key === 's') {
  //       e.preventDefault();
  //       saveCanvas({
  //         pageName: currentPage.name,
  //         baseImage: currentPage.baseImage,
  //         backgroundImage: currentPage.backgroundImage,
  //         foregroundImage: currentPage.foregroundImage,
  //       });
  //     }
  
  //     // Shift background right with Ctrl + Left Arrow

  //     else if (e.ctrlKey && e.key === 'ArrowRight') {
  //       e.preventDefault();
  //       const type = selectedImageType; // could be 'base', 'background', 'foreground'
      
  //       setImageStates(prev => {
  //         const pageState = prev[currentPage.name];
  //         if (!pageState?.[type]) return prev;
      
  //         return {
  //           ...prev,
  //           [currentPage.name]: {
  //             ...pageState,
  //             [type]: {
  //               ...pageState[type],
  //               x: (pageState[type].x || 0) + 10,
  //             },
  //           },
  //         };
  //       });
  //     }
  //   };
  
  //   window.addEventListener('keydown', handleKeyDown);
  //   return () => window.removeEventListener('keydown', handleKeyDown);
  // }, [selectedTextBoxId, textBoxes, pages, currentPageIndex]);
  



  // const saveCanvas = ({
  //   pageName,
  //   baseImage,
  //   backgroundImage,
  //   foregroundImage,
  // }: {
  //   pageName: string;
  //   baseImage: string | null;
  //   backgroundImage: string | null;
  //   foregroundImage: string | null;
  // }) => {
  //   console.log("🟢 saveCanvas called");
  
  //   const canvasRect = canvasRef.current?.getBoundingClientRect();
  //   if (!canvasRect) {
  //     console.warn("⚠️ canvasRef is not ready");
  //     return;
  //   }
  
  //   const layers = [
  //     { type: "Background", url: backgroundImage },
  //     { type: "Base", url: baseImage },
  //     { type: "Foreground", url: foregroundImage },
  //   ];
  
  //   const refMap = {
  //     base: baseImageRef.current,
  //     background: backgroundImageRef.current,
  //     foreground: foregroundImageRef.current,
  //   };

  //   // const refMap = {
  //   //   base: imageStates[pageName]?.base?.ref?.current,
  //   //   background: imageStates[pageName]?.background?.ref?.current,
  //   //   foreground: imageStates[pageName]?.foreground?.ref?.current,
  //   // };
    
  
  //   layers.forEach(({ type, url }) => {
  //     const key = type.toLowerCase();
  //     const imgElement = refMap[key];
  //     const pageImageStates = imageStates[pageName];
  
  //     if (!url) {
  //       console.log(`ℹ️ Skipping ${type}: no image URL`);
  //       return;
  //     }
  //     if (!imgElement) {
  //       console.warn(`⚠️ Skipping ${type}: image ref not found for key '${key}'`);
  //       return;
  //     }
  //     if (!pageImageStates?.[key]) {
  //       console.warn(`⚠️ Skipping ${type}: imageStates missing for '${pageName}' → '${key}'`);
  //       return;
  //     }
  
  //     const rect = imgElement.getBoundingClientRect();
  //     const x = rect.left - canvasRect.left;
  //     const y = rect.top - canvasRect.top;
  //     const width = rect.width;
  //     const height = rect.height;
  
  //     const payload = {
  //       image_url: url,
  //       x,
  //       y,
  //       width,
  //       height,
  //       page: pageName,
  //       type,
  //       story_name: selectedStory || "",
  //       gender: selectedGender || "",
  //     };
  
  //     console.log(`📤 Sending ${type} metadata to backend`, payload);
  
  //     fetch("http://localhost:7000/save-image-from-url", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify(payload),
  //     })
  //       .then(async (res) => {
  //         const data = await res.json();
  //         if (!res.ok) {
  //           console.error(`❌ Server responded with error ${res.status}:`, data);
  //         } else {
  //           console.log(`✅ ${type} metadata saved successfully:`, data);
  //         }
  //       })
  //       .catch((err) => {
  //         console.error(`❌ Network error sending ${type}:`, err);
  //       });
  //   });
  
  //   if (canvasRef.current && onSaveCanvas) {
  //     import("html2canvas").then(({ default: html2canvas }) => {
  //       html2canvas(canvasRef.current!).then((canvas) => {
  //         const dataUrl = canvas.toDataURL("image/png");
  //         onSaveCanvas(
  //           dataUrl,
  //           baseImage || backgroundImage || foregroundImage!
  //         );
  //       });
  //     });
  //   }
  // };
  
  // useImperativeHandle(ref, () => ({
  //   saveCanvas,
  //   getCanvasElement: () => canvasRef.current,
  // }));
  
  
  
 

    const saveCanvas = ({
      pageName,
      baseImage,
      backgroundImage,
      foregroundImage,
    }: {
      pageName: string;
      baseImage: string | null;
      backgroundImage: string | null;
      foregroundImage: string | null;
    }) => {
      console.log("📄 baseImage URL:", baseImage);
      console.log("🟢 saveCanvas called");
    
      const canvasRect = canvasRef.current?.getBoundingClientRect();
      if (!canvasRect) {
        console.warn("⚠️ canvasRef is not ready");
        return;
      }
    
      const layers = [
        { type: "Background", url: backgroundImage },
        { type: "Base", url: baseImage },
        { type: "Foreground", url: foregroundImage },
      ];
    
      const refMap = {
        base: baseImageRef.current,
        background: backgroundImageRef.current,
        foreground: foregroundImageRef.current,
      };
    
      layers.forEach(({ type, url }) => {
        // if (!url) return;
    
        const key = type.toLowerCase();
        const imgElement = refMap[key];
        const pageImageStates = imageStates[pageName];


        if (!url) {
          console.log(`ℹ️ Skipping ${type}: no image URL`);
          return;
        }
        if (!imgElement) {
          console.warn(`⚠️ Skipping ${type}: image ref not found for key '${key}'`);
          return;
        }
        if (!pageImageStates?.[key]) {
          console.warn(`⚠️ Skipping ${type}: imageStates missing for '${pageName}' → '${key}'`);
          return;
        }
    
        // if (imgElement && imageStates[key]) {
        if (imgElement && pageImageStates?.[key]) {
          const rect = imgElement.getBoundingClientRect();
          const x = rect.left - canvasRect.left;
          const y = rect.top - canvasRect.top;
          const width = rect.width;
          const height = rect.height;
    
          const page = pageName;
    
          fetch(url)
            .then((res) => res.blob())
            .then((blob) => {
              const file = new File([blob], `${page}_${type}.png`, {
                type: blob.type,
              });

          
              const formData = new FormData();
              formData.append("file", file);
              formData.append("x", x.toString());
              formData.append("y", y.toString());
              formData.append("width", width.toString());
              formData.append("height", height.toString());
              formData.append("page", page);
              formData.append("type", type);
              // formData.append("story_name", "dev-magical-zoo-dream");
              formData.append("story_name", selectedStory || "");
              formData.append("gender", selectedGender || "");

    
              console.log("🧾 FormData payload:", formData);
              for (const [key, value] of formData.entries()) {
                console.log(`${key}:`, value);
              }
    
              console.log(`📤 Sending ${type} to backend`, {
                x,
                y,
                width,
                height,
                page,
                type,
              });
    
              return fetch("http://localhost:7000/save-image-metadata", {
                method: "POST",
                body: formData,
              });
            })
            .then(async (res) => {
              const data = await res.json();
              if (!res.ok) {
                console.error(`❌ Server responded with error ${res.status}:`, data);
              } else {
                console.log(`✅ ${type} sent successfully:`, data);
              }
            })
            .catch((err) => {
              console.error(`❌ Network error sending ${type}:`, err);
            });
        } else {
          console.warn(`⚠️ Skipped ${type}: ref or imageStates[${key}] not ready`);
        }
      });
    
      // Save whole canvas snapshot
      if (canvasRef.current && onSaveCanvas) {
        import("html2canvas").then(({ default: html2canvas }) => {
          html2canvas(canvasRef.current!).then((canvas) => {
            const dataUrl = canvas.toDataURL("image/png");
            onSaveCanvas(
              dataUrl,
              baseImage || backgroundImage || foregroundImage!
            );
          });
        });
      }
    };
    
    

    useImperativeHandle(ref, () => ({
      saveCanvas,
      // approveCanvasToProd, 
      getCanvasElement: () => canvasRef.current,
    }));
    
    



  

  const startDragImage = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    const pageKey = pages[currentPageIndex]?.name;
  
    setImageStates(prev => {
      const state = prev[pageKey]?.[id];
      if (!state || !pageKey || state.locked) return prev;
  
      return {
        ...prev,
        [pageKey]: {
          ...prev[pageKey],
          [id]: {
            ...state,
            dragging: true,
            offsetX: e.clientX - state.x,
            offsetY: e.clientY - state.y,
          },
        },
      };
    });
  };
  
  const startResizeImage = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const pageKey = pages[currentPageIndex]?.name;
  
    setImageStates(prev => {
      const state = prev[pageKey]?.[id];
      if (!state || !pageKey || state.locked) return prev;
  
      return {
        ...prev,
        [pageKey]: {
          ...prev[pageKey],
          [id]: {
            ...state,
            resizing: true,
            offsetX: e.clientX,
            offsetY: e.clientY,
          },
        },
      };
    });
  };
  

  

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setImageStates(prev => {
        const pageKey = pages[currentPageIndex]?.name;
        if (!pageKey) return prev;
  
        const pageState = { ...(prev[pageKey] || {}) };
  
        for (const id in pageState) {
          const state = pageState[id];
          // if (!state) continue;
          if (state.dragging) {
            pageState[id] = {
              ...state,
              x: e.clientX - state.offsetX,
              y: e.clientY - state.offsetY,
            };
          } else if (state.resizing) {
            pageState[id] = {
              ...state,
              width: Math.max(100, state.width + (e.clientX - state.offsetX)),
              height: Math.max(100, state.height + (e.clientY - state.offsetY)),
              offsetX: e.clientX,
              offsetY: e.clientY,
            };
          }
        }
  
        return {
          ...prev,
          [pageKey]: pageState,
        };
      });
    };
  
    const handleMouseUp = () => {
      setImageStates(prev => {
        const pageKey = pages[currentPageIndex]?.name;
        if (!pageKey) return prev;
  
        const pageState = { ...(prev[pageKey] || {}) };
        for (const id in pageState) {
          pageState[id] = {
            ...pageState[id],
            dragging: false,
            resizing: false,
          };
        }
  
        return {
          ...prev,
          [pageKey]: pageState,
        };
      });
    };
  
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [currentPageIndex, pages]);
  


  const handleZoomIn = () => setZoom(0.75);     // Scale down (fit better)
  const handleZoomOut = () => setZoom(1);      // Original size

  const baseImageRef = useRef<HTMLImageElement>(null);
  const backgroundImageRef = useRef<HTMLImageElement>(null);
  const foregroundImageRef = useRef<HTMLImageElement>(null);




  return (
    <div className="relative w-full h-full ">
     <div className="absolute top-2 right-2 z-50 flex gap-2">
      <button onClick={handleZoomIn} className="p-2 bg-white shadow border rounded">-</button>
      <button onClick={handleZoomOut} className="p-2 bg-white shadow border rounded">+</button>
    </div>

      <div 
        ref={canvasRef}
        className={cn(

          // 'w-full h-full shadow-sm overflow-hidden relative', 
          'w-full h-full shadow-sm overflow-hidden relative z-0',
          selectedElement === 'text' ? 'cursor-text' : 'cursor-default'
        )}
        onClick={handleCanvasClick}
        // style={{ backgroundColor: 'white' }}
        style={{
          backgroundColor: 'white',
          transform: `scale(${zoom})`,
          transformOrigin: 'center',
          width: `${originalCanvas.width}px`,
          height: `${originalCanvas.height}px`,
          pointerEvents: 'auto',
        }}
      >


        {images.map(({ id, src, z }) => {
          const pageKey = pages[currentPageIndex]?.name;
          const state = imageStates[pageKey]?.[id];

          if (!state) return null;

          const isLocked = state.locked;

          return (
            <div
              key={id}
              onMouseDown={(e) => startDragImage(id, e)}
              style={{
                pointerEvents: 'auto',
                position: 'absolute',
                zIndex: z,
                left: state.x,
                top: state.y,
                width: state.width,
                height: state.height,
                cursor: isLocked ? 'not-allowed' : 'move',
              }}
            >
              <img
                ref={
                  id === 'base'
                    ? baseImageRef
                    : id === 'background'
                    ? backgroundImageRef
                    : foregroundImageRef
                }
                src={src}
                alt={id}
                // className={`w-full h-full object-contain border-2 ${
                //   isLocked ? 'opacity-50 blur-sm cursor-not-allowed' : ''
                // }`}
                className={`w-full h-full object-contain border-2 ${
                  isLocked ? 'opacity-50  cursor-not-allowed' : ''
                }`}
                draggable={false}
              />

              {/* 👇 Conditionally render resize handle only if not locked */}
              {!isLocked && (
                <div
                  className="absolute bottom-0 right-0 w-4 h-4 bg-blue-500 rounded-sm cursor-nwse-resize z-50"
                  onMouseDown={(e) => startResizeImage(id, e)}
                />
              )}
            </div>
          );
        })}




        {textBoxes.map((textBox) => (
          <div 
            key={textBox.id}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedTextBoxId(textBox.id);
              setSelectedImageId(null);
              setSelectedTextBox?.(textBox);
            }}
            className={cn(
              'absolute',
              selectedTextBoxId === textBox.id ? 'z-50' : 'z-40'
            )}
            style={{
              left: textBox.x,
              top: textBox.y,
              backgroundColor: textBox.backgroundColor || 'transparent', 
            }}
          >
            <TextBox 
              textBox={textBox} 
              updateTextBox={updateTextBox} 
              isSelected={selectedTextBoxId === textBox.id}
              onDelete={deleteSelectedTextBox}
            />
            {selectedTextBoxId === textBox.id && (
              <div 
                className="absolute border-2 border-blue-500 pointer-events-none" 
                style={{
                  backgroundColor: 'white',
                 
                }}

              />
            )}
          </div>
        ))}

      </div>

    </div>
  );
});

export default Canvas;


