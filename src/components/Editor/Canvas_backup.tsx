import React, { useRef, useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import TextBox from './TextBox';
import { TextBoxType } from '@/types/editor';
import { Save } from 'lucide-react';




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
}

interface Page {
  name: string;
  baseImage: string | null;
  backgroundImage: string | null;
  foregroundImage: string | null;
}



// export type CanvasHandle = {
//   saveCanvas: () => void;
//   getCanvasElement: () => HTMLDivElement | null;
// };

export type CanvasHandle = {
  saveCanvas: (opts: {
    pageName: string;
    baseImage: string | null;
    backgroundImage: string | null;
    foregroundImage: string | null;
  }) => void;
  getCanvasElement: () => HTMLDivElement | null;
};




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
}, ref) => {

// const Canvas: React.FC<CanvasProps> = ({
//   selectedElement, 
//   selectedImage, 
//   onSaveCanvas, 
//   setSelectedElement,
//   initialTextBoxes = [],
//   onTextBoxesChange,
//   backgroundImage: propBackgroundImage,
//   baseImage: propBaseImage,
//   foregroundImage: propForegroundImage,
//   selectedTextBox: propSelectedTextBox,
//   setSelectedTextBox,
// }) => {
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


  const images = [
    { id: 'background', src: propBackgroundImage, z: 0 },
    { id: 'base', src: propBaseImage, z: 1 },
    { id: 'foreground', src: propForegroundImage, z: 2 },
  ].filter(img => img.src);

  const [imageStates, setImageStates] = useState<Record<string, any>>({});



  useEffect(() => {
    images.forEach(({ id, src }) => {
      if (imageStates[id]) return;
  
      const img = new Image();
      img.src = src;
  
      img.onload = () => {
        const naturalWidth = img.naturalWidth;
        const naturalHeight = img.naturalHeight;
  
        setImageStates(prev => ({
          ...prev,
          [id]: {
            x: 0,
            y: 0,
            width: naturalWidth,
            height: naturalHeight,
            dragging: false,
            resizing: false,
            offsetX: 0,
            offsetY: 0,
          }
        }));
      };
    });
  }, [images.map(img => img.id + img.src).join(',')]);

  // useEffect(() => {
  //   setImageStates(prev => {
  //     const updated = { ...prev };
  //     images.forEach(({ id }) => {
  //       if (!(id in updated)) {
  //         updated[id] = {
  //           x: 0,
  //           y: 0,
  //           // width: img.width,
  //           // height: img.height ,
  //           dragging: false,
  //           resizing: false,
  //           offsetX: 0,
  //           offsetY: 0,
  //         };
  //       }
  //     });
  //     return updated;
  //   });
  // }, [images.map(img => img.id + img.src).join(',')]);

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

        // const x = (e.clientX - canvasRect.left) / zoom;
        // const y = (e.clientY - canvasRect.top) / zoom;


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
          isBold: false,
          isItalic: false,
          isUnderlined: false,
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

  // const updateTextBox = (updatedTextBox: TextBoxType) => {
  //   const updated = textBoxes.map(box => box.id === updatedTextBox.id ? updatedTextBox : box);
  //   setTextBoxes(updated);
  //   onTextBoxesChange?.(updated);
  //   setSelectedTextBox?.(updatedTextBox);
  // };

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
  

  // const updateTextBox = (updatedTextBox: TextBoxType) => {
  //   const originalCanvas = { width: 1754, height: 1240 };
  
  //   const maxWidth = originalCanvas.width - updatedTextBox.x;
  //   const maxHeight = originalCanvas.height - updatedTextBox.y;
  
  //   const clampedWidth = Math.max(20, Math.min(updatedTextBox.width, maxWidth));
  //   const clampedHeight = Math.max(20, Math.min(updatedTextBox.height, maxHeight));
  
  //   const clampedTextBox: TextBoxType = {
  //     ...updatedTextBox,
  //     width: clampedWidth,
  //     height: clampedHeight,
  //   };
  
  //   const updated = textBoxes.map(box =>
  //     box.id === clampedTextBox.id ? clampedTextBox : box
  //   );
  
  //   setTextBoxes(updated);
  //   onTextBoxesChange?.(updated);
  //   setSelectedTextBox?.(clampedTextBox);
  // };
  
  

  const deleteSelectedTextBox = () => {
    if (selectedTextBoxId) {
      const updated = textBoxes.filter(box => box.id !== selectedTextBoxId);
      setTextBoxes(updated);
      onTextBoxesChange?.(updated);
      setSelectedTextBoxId(null);
      setSelectedTextBox?.(null);
    }
  };

  

  // useEffect(() => {
  //   const handleKeyDown = (e: KeyboardEvent) => {
  //     if ((e.key === 'Delete' || e.key === 'Backspace') && selectedTextBoxId && !document.activeElement?.matches('textarea, input')) {
  //       deleteSelectedTextBox();
  //     } else if ((e.ctrlKey || e.metaKey) && e.key === 's') {
  //       e.preventDefault();
  //       saveCanvas();
  //     }
  //   };
  //   window.addEventListener('keydown', handleKeyDown);
  //   return () => window.removeEventListener('keydown', handleKeyDown);
  // }, [selectedTextBoxId, textBoxes]);

  // const [pages, setPages] = useState<Page[]>(...);
  
  const [pages, setPages] = useState<Page[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);





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
  
        // ✅ This assumes you're inside the same component where pages/currentPageIndex are defined
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
  
  

  


    const imageRef = useRef<HTMLImageElement>(null);


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
        if (!url) return;
    
        const key = type.toLowerCase();
        const imgElement = refMap[key];
    
        if (imgElement && imageStates[key]) {
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
      getCanvasElement: () => canvasRef.current,
    }));
    

    // const saveCanvas = () => {
    
    // const saveCanvas = ({
    //   pageName ,
    //   baseImage,
    //   backgroundImage,
    //   foregroundImage,
    // }: {
    //   pageName: string;
    //   baseImage: string | null;
    //   backgroundImage: string | null;
    //   foregroundImage: string | null;
    // }) => {
    // console.log("🟢 saveCanvas called");
  
    //   const canvasRect = canvasRef.current?.getBoundingClientRect();
    //   if (!canvasRect) {
    //     console.warn("⚠️ canvasRef is not ready");
    //     return;
    //   }
    
    //   const layers = [
    //     { type: "Background", url: propBackgroundImage },
    //     { type: "Base", url: propBaseImage },
    //     { type: "Foreground", url: propForegroundImage },
    //   ];
    
    //   layers.forEach(({ type, url }) => {
    //     if (!url) return;
    
    //     const key = type.toLowerCase(); // 'background', 'base', 'foreground'
    
    //     // const refMatch =
    //     //   (type === "Base" && imageRef.current) ||
    //     //   (type === "Background" && imageRef.current) ||
    //     //   (type === "Foreground" && imageRef.current);

    //     const refMap = {
    //       base: baseImageRef.current,
    //       background: backgroundImageRef.current,
    //       foreground: foregroundImageRef.current,
    //     };
        
    //     const imgElement = refMap[key];
        
    //     // if (imgElement && imageStates[key]) {
    //     //   const rect = imgElement.getBoundingClientRect();
        
    
    //     // if (refMatch && imageStates[key]) {
    //     if (imgElement && imageStates[key]) {
    //       // const rect = imageRef.current!.getBoundingClientRect();
    //       const rect = imgElement.getBoundingClientRect();
    //       const x = rect.left - canvasRect.left;
    //       const y = rect.top - canvasRect.top;
    //       const width = rect.width;
    //       const height = rect.height;
        
    //       const page = pageName;
    
    //       fetch(url)
    //         .then((res) => res.blob())
    //         .then((blob) => {
    //           const file = new File([blob], `${page}_${type}.png`, { type: blob.type });
    //           const formData = new FormData();
    //           formData.append("file", file);
    //           formData.append("x", x.toString());
    //           formData.append("y", y.toString());
    //           formData.append("width", width.toString());
    //           formData.append("height", height.toString());
    //           formData.append("page", page);
    //           formData.append("type", type);

    //           console.log("🧾 FormData payload:");
    //             for (const [key, value] of formData.entries()) {
    //               console.log(`${key}:`, value);
    //             }
    
    //           console.log(`📤 Sending ${type} to backend`, { x, y, width, height, page, type });
    
    //           return fetch("http://localhost:7000/save-image-metadata", {
    //             method: "POST",
    //             body: formData,
    //           });
    //         })
    //         .then((res) => res.json())
    //         .then((data) => {
    //           console.log(`✅ ${type} sent successfully:`, data);
    //         })
    //         .catch((err) => {
    //           console.error(`❌ Error sending ${type}:`, err);
    //         });
    //     } else {
    //       console.warn(`⚠️ Skipped ${type}: ref or imageStates[${key}] not ready`);
    //     }
    //   });
    
    //   // Save whole canvas snapshot
    //   if (canvasRef.current && onSaveCanvas) {
    //     import("html2canvas").then(({ default: html2canvas }) => {
    //       html2canvas(canvasRef.current!).then((canvas) => {
    //         const dataUrl = canvas.toDataURL("image/png");
    //         onSaveCanvas(dataUrl, propBaseImage || propBackgroundImage || propForegroundImage!);
    //       });
    //     });
    //   }
    // };
    

    // const saveCanvas = () => {
    //   console.log("🟢 saveCanvas called");
    
    //   if (!propBaseImage && !propBackgroundImage && !propForegroundImage) {
    //     console.warn("⚠️ No image provided to save.");
    //     return;
    //   }
    
    //   const canvasRect = canvasRef.current?.getBoundingClientRect();
    //   if (!canvasRect) {
    //     console.warn("⚠️ canvasRef is not ready");
    //     return;
    //   }
    
    //   const imageUrl = propBaseImage || propBackgroundImage || propForegroundImage!;
    //   const type = propBaseImage
    //     ? "Base"
    //     : propBackgroundImage
    //     ? "Background"
    //     : "Foreground";
    
    //   const key = type.toLowerCase(); // 'base', 'background', or 'foreground'
    
    //   if (imageRef.current && imageStates[key]) {
    //     const rect = imageRef.current.getBoundingClientRect();
    //     const x = rect.left - canvasRect.left;
    //     const y = rect.top - canvasRect.top;
    //     const width = rect.width;
    //     const height = rect.height;
    
    //     const page = "Page1"; // TODO: make dynamic if needed
    
    //     console.log("📤 Preparing image + metadata:", { x, y, width, height, imageUrl, page, type });
    
    //     // 🔄 Convert blob URL to File and send with metadata
    //     fetch(imageUrl)
    //       .then(res => res.blob())
    //       .then(blob => {
    //         const file = new File([blob], `${page}_${type}.png`, { type: blob.type });
    //         const formData = new FormData();
    //         formData.append("file", file);
    //         formData.append("x", x.toString());
    //         formData.append("y", y.toString());
    //         formData.append("width", width.toString());
    //         formData.append("height", height.toString());
    //         formData.append("page", page);
    //         formData.append("type", type);
    
    //         return fetch("http://localhost:7000/save-image-metadata", {
    //           method: "POST",
    //           body: formData,
    //         });
    //       })
    //       .then(res => res.json())
    //       .then(data => {
    //         console.log("✅ Metadata + image sent to backend:", data);
    //       })
    //       .catch(err => {
    //         console.error("❌ Error sending image + metadata:", err);
    //       });
    //   } else {
    //     console.warn(`⚠️ imageRef or imageStates["${key}"] not ready.`);
    //   }
    
    //   if (canvasRef.current && onSaveCanvas) {
    //     import("html2canvas").then(({ default: html2canvas }) => {
    //       html2canvas(canvasRef.current!).then((canvas) => {
    //         const dataUrl = canvas.toDataURL("image/png");
    //         onSaveCanvas(dataUrl, imageUrl);
    //       });
    //     });
    //   }
    // };
    


    // const saveCanvas = () => {
    //   console.log("🟢 saveCanvas called");
    //   if (!propBaseImage && !propBackgroundImage && !propForegroundImage) {
    //     console.warn("⚠️ No image provided to save.");
    //   return;
    //   }
    
    //   const canvasRect = canvasRef.current?.getBoundingClientRect();
    //   if (!canvasRect) {
    //     console.warn("⚠️ canvasRef is not ready");
    //     return;
    //   }

 
    //   if (imageRef.current && imageStates['base'] && canvasRect) {
    //     const rect = imageRef.current.getBoundingClientRect();
    //     const x = rect.left - canvasRect.left;
    //     const y = rect.top - canvasRect.top;
    //     const width = rect.width;
    //     const height = rect.height;
    
    //     // Determine image type and URL
    //     const imageUrl = propBaseImage || propBackgroundImage || propForegroundImage!;
    //     const type = propBaseImage
    //       ? "Base"
    //       : propBackgroundImage
    //       ? "Background"
    //       : "Foreground";
    
    //     // Optional: dynamically determine page name (e.g., "Page1")
    //     const page = "Page1";

    //     const payload = { x, y, width, height, imageUrl, page, type };
    //     console.log("📤 Sending payload to backend:", payload);
    
    //     fetch("http://localhost:7000/save-image-metadata", {
    //       method: "POST",
    //       headers: { "Content-Type": "application/json" },
    //       body: JSON.stringify({ x, y, width, height, imageUrl, page, type }),
    //     })
    //       .then((res) => res.json())
    //       .then((data) => {
    //         console.log("✅ Metadata sent to backend:", data);
    //       })
    //       .catch((err) => {
    //         console.error("❌ Error sending metadata:", err);
    //       });
    //   }
    
    //   if (canvasRef.current && onSaveCanvas) {
    //     import("html2canvas").then(({ default: html2canvas }) => {
    //       html2canvas(canvasRef.current!).then((canvas) => {
    //         const dataUrl = canvas.toDataURL("image/png");
    //         console.log("📸 Canvas captured as dataURL");
    //         onSaveCanvas(
    //           dataUrl,
    //           propBaseImage || propBackgroundImage || propForegroundImage!,
    //         );
    //       });
    //     });
    //   }
    // };
    
    // useImperativeHandle(ref, () => ({
    //   saveCanvas,
    //   getCanvasElement: () => canvasRef.current,
    // }));
    
  




  // const saveCanvas = () => {
  //   if (!propBaseImage && !propBackgroundImage && !propForegroundImage) return;
  
  //   if (imageRef.current && imageStates['base']) {
  //     const rect = imageRef.current.getBoundingClientRect();
  //     const canvasRect = canvasRef.current?.getBoundingClientRect();
  //     const x = rect.left - (canvasRect?.left || 0);
  //     const y = rect.top - (canvasRect?.top || 0);
  //     const width = rect.width;
  //     const height = rect.height;
  
  //     fetch('http://localhost:7000/save-image-metadata', {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({ x, y, width, height }),
  //     });
  //   }
  
  //   if (canvasRef.current && onSaveCanvas) {
  //     import('html2canvas').then(({ default: html2canvas }) => {
  //       html2canvas(canvasRef.current!).then(canvas => {
  //         const dataUrl = canvas.toDataURL('image/png');
  //         onSaveCanvas(dataUrl, propBaseImage || propBackgroundImage || propForegroundImage!);
  //       });
  //     });
  //   }
  // };

  // useImperativeHandle(ref, () => ({
  //   saveCanvas,
  //   getCanvasElement: () => canvasRef.current,
  // }));
  


 

  


  const startDragImage = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    const state = imageStates[id];
    setImageStates(prev => ({
      ...prev,
      [id]: { ...state, dragging: true, offsetX: e.clientX - state.x, offsetY: e.clientY - state.y },
    }));
  };

  const startResizeImage = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const state = imageStates[id];
    setImageStates(prev => ({
      ...prev,
      [id]: { ...state, resizing: true, offsetX: e.clientX, offsetY: e.clientY },
    }));
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setImageStates(prev => {
        const updated = { ...prev };
        for (const id in prev) {
          const state = prev[id];
          if (state.dragging) {
            updated[id] = {
              ...state,
              x: e.clientX - state.offsetX,
              y: e.clientY - state.offsetY,
            };
          }
          if (state.resizing) {
            updated[id] = {
              ...state,
              width: Math.max(100, state.width + (e.clientX - state.offsetX)),
              height: Math.max(100, state.height + (e.clientY - state.offsetY)),
              offsetX: e.clientX,
              offsetY: e.clientY,
            };
          }
        }
        return updated;
      });
    };

    const handleMouseUp = () => {
      setImageStates(prev => {
        const updated = { ...prev };
        for (const id in updated) {
          updated[id].dragging = false;
          updated[id].resizing = false;
        }
        return updated;
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 2));
  // const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.5));
  const handleZoomIn = () => setZoom(0.75);     // Scale down (fit better)
  const handleZoomOut = () => setZoom(1);      // Original size

  const baseImageRef = useRef<HTMLImageElement>(null);
  const backgroundImageRef = useRef<HTMLImageElement>(null);
  const foregroundImageRef = useRef<HTMLImageElement>(null);



  // const imageRef = useRef<HTMLImageElement>(null);

  // useEffect(() => {
  //   if (imageRef.current && imageStates['base']) {
  //     const rect = imageRef.current.getBoundingClientRect();
  //     const canvasRect = canvasRef.current?.getBoundingClientRect();
  //     const x = rect.left - (canvasRect?.left || 0);
  //     const y = rect.top - (canvasRect?.top || 0);
  //     const width = rect.width;
  //     const height = rect.height;

  //     fetch('http://localhost:7000/save-image-metadata', {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({ x, y, width, height }),
  //     });
  //   }
  // }, [imageStates]);



  return (
    <div className="relative w-full h-full ">
     <div className="absolute top-2 right-2 z-50 flex gap-2">
      <button onClick={handleZoomIn} className="p-2 bg-white shadow border rounded">-</button>
      <button onClick={handleZoomOut} className="p-2 bg-white shadow border rounded">+</button>
    </div>

      <div 
        ref={canvasRef}
        className={cn(

          'w-full h-full shadow-sm overflow-hidden relative', 
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
        }}
      >



        {/* {images.map(({ id, src, z }) => (
          <div
            key={id}
            onMouseDown={(e) => startDragImage(id, e)}
            style={{
              position: 'absolute',
              zIndex: z,
              left: imageStates[id]?.x,
              top: imageStates[id]?.y,
              width: imageStates[id]?.width,
              height: imageStates[id]?.height,
              cursor: 'move',
            }}
          >
            <img
              src={src!}
              alt={id}
              className="w-full h-full object-contain"
              draggable={false}
            />
            <div
              className="absolute bottom-0 right-0 w-4 h-4 bg-blue-500 rounded-sm cursor-nwse-resize z-50"
              onMouseDown={(e) => startResizeImage(id, e)}
            />
          </div>
        ))} */}

        {images.map(({ id, src, z }) => (
          <div
            key={id}
            onMouseDown={(e) => startDragImage(id, e)}
            style={{
              position: 'absolute',
              zIndex: z,
              left: imageStates[id]?.x,
              top: imageStates[id]?.y,
              width: imageStates[id]?.width,
              height: imageStates[id]?.height,
              cursor: 'move',
            }}
          >
            {/* <img
              // ref={id === 'base' ? imageRef : undefined} // ✅ Only assign to base image
              ref={id === (propBaseImage ? "base" : propBackgroundImage ? "background" : "foreground") ? imageRef : undefined}
              src={src!}
              alt={id}
              className="w-full h-full object-contain"
              draggable={false}
            /> */}


              <img
              ref={id === "base" ? baseImageRef : id === "background" ? backgroundImageRef : foregroundImageRef}
              src={src!}
              alt={id}
              className="w-full h-full object-contain border-2"
              draggable={false}
              />

            <div
              className="absolute bottom-0 right-0 w-4 h-4 bg-blue-500 rounded-sm cursor-nwse-resize z-50"
              onMouseDown={(e) => startResizeImage(id, e)}
            />
          </div>



        ))}



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
              backgroundColor: textBox.backgroundColor || 'transparent', // ✅ Apply background color
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

                // style={{
                //   backgroundColor: 'white',
                //   transform: `scale(${zoom})`,
                //   transformOrigin: 'top left',
                //   width: 1754,
                //   height: 1240,
                // }}
              />
            )}
          </div>
        ))}






        {/* {textBoxes.map((textBox) => (
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
                  left: -2,
                  top: -2,
                  width: textBox.width + 4,
                  height: textBox.height + 4,
                }}
              />
            )}
          </div>
        ))} */}
      </div>

    </div>
  );
});

export default Canvas;
