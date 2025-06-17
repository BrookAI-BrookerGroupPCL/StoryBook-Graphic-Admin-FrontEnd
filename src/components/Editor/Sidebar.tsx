// import React, { useState, useRef } from 'react';
// import {
//   DndContext,
//   closestCenter,
//   useSensor,
//   useSensors,
//   PointerSensor,
//   DragEndEvent,
//   DragOverlay,
// } from '@dnd-kit/core';
// import {
//   arrayMove,
//   SortableContext,
//   useSortable,
//   verticalListSortingStrategy,
// } from '@dnd-kit/sortable';
// import { CSS } from '@dnd-kit/utilities';
// import { Palette, Square, TextCursor, GripVertical } from 'lucide-react';
// import { cn } from '@/lib/utils';
// import { Button } from '@/components/ui/button';
// import { TextBoxType } from '@/types/editor';

// interface Page {
//   id: string;
//   name: string;
//   baseImage: string | null;
//   backgroundImage: string | null;
//   foregroundImage: string | null;
//   textBoxes: TextBoxType[];
// }

// interface SidebarProps {
//   pages: Page[];
//   setPages: (pages: Page[]) => void;
//   currentPageIndex: number;
//   setCurrentPageIndex: (index: number) => void;
//   selectedElement: string | null;
//   setSelectedElement: (element: string | null) => void;
//   setSelectedTextBox?: (tb: TextBoxType) => void;
//   updateCurrentPageTextBoxes?: (boxes: TextBoxType[]) => void;
//   onImageSelect: (src: string, type?: 'base' | 'background' | 'foreground') => void;
//   baseImages: string[];
//   backgroundImages?: string[];
//   foregroundImages?: string[];
//   onImageUpload?: (e: React.ChangeEvent<HTMLInputElement>, type: 'base' | 'background' | 'foreground') => void;
//   onDeleteImage?: (src: string, type: 'base' | 'background' | 'foreground') => void;
// }

// const Sidebar: React.FC<SidebarProps> = ({
//   pages,
//   setPages,
//   currentPageIndex,
//   setCurrentPageIndex,
//   selectedElement,
//   setSelectedElement,
//   setSelectedTextBox,
//   updateCurrentPageTextBoxes,
//   onImageSelect,
//   baseImages = [],
//   backgroundImages = [],
//   foregroundImages = [],
//   onImageUpload,
//   onDeleteImage,
// }) => {
//   const sensors = useSensors(useSensor(PointerSensor));
//   const [activeId, setActiveId] = useState<string | null>(null);

//   const handleDragEnd = (event: DragEndEvent) => {
//     const { active, over } = event;
//     setActiveId(null);
//     if (!over) return;
//     if (active.id !== over.id) {
//       const oldIndex = pages.findIndex(p => p.id === active.id);
//       const newIndex = pages.findIndex(p => p.id === over.id);
//       if (oldIndex === -1 || newIndex === -1) return;
//       const newPages = arrayMove(pages, oldIndex, newIndex);
//       setPages(newPages);
//       if (currentPageIndex === oldIndex) {
//         setCurrentPageIndex(newIndex);
//       } else if (currentPageIndex > oldIndex && currentPageIndex <= newIndex) {
//         setCurrentPageIndex(currentPageIndex - 1);
//       } else if (currentPageIndex < oldIndex && currentPageIndex >= newIndex) {
//         setCurrentPageIndex(currentPageIndex + 1);
//       }
//     }
//   };

//   const tools = [
//     { id: 'text', name: 'Text', icon: TextCursor },
//     { id: 'shape', name: 'Shape', icon: Square },
//     { id: 'color', name: 'Color', icon: Palette },
//   ];

//   const SortablePageItem = ({
//     page,
//     index,
//     currentPageIndex,
//     setCurrentPageIndex,
//   }: {
//     page: Page;
//     index: number;
//     currentPageIndex: number;
//     setCurrentPageIndex: (index: number) => void;
//   }) => {
//     const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: page.id });

//     const style = {
//       transform: CSS.Transform.toString(transform),
//       transition,
//       border: currentPageIndex === index ? '2px solid #2563eb' : '1px solid #ccc',
//       borderRadius: '6px',
//       padding: '10px',
//       marginBottom: '10px',
//       backgroundColor: isDragging ? '#f0f0f0' : '#fff',
//       cursor: 'grab',
//       display: 'flex',
//       gap: '10px',
//       alignItems: 'flex-start',
//     };

//     return (
//       <div ref={setNodeRef} style={style}>
//         <div {...attributes} {...listeners} className="flex items-center">
//           <GripVertical className="mr-2 text-gray-400" />
//         </div>
//         <div className="flex-1" onClick={() => setCurrentPageIndex(index)}>
//           <h4 className="text-sm font-bold mb-1">{page.name}</h4>
//           <p className="text-xs">Base: {page.baseImage ? '✓' : '✗'}</p>
//           <p className="text-xs">BG: {page.backgroundImage ? '✓' : '✗'}</p>
//           <p className="text-xs">FG: {page.foregroundImage ? '✓' : '✗'}</p>
//           <p className="text-xs">Text Boxes: {page.textBoxes.length}</p>
//         </div>
//       </div>
//     );
//   };

//   const handleAddTextBox = () => {
//     const currentPage = pages[currentPageIndex];
//     if (!currentPage || !updateCurrentPageTextBoxes) return;

//     const count = currentPage.textBoxes.length + 1;
//     const newTextBox: TextBoxType = {
//       id: `text-${Date.now()}`,
//       x: 100 + 10 * count,
//       y: 100 + 10 * count,
//       width: 200,
//       height: 100,
//       content: 'Text Area',
//       fontSize: 16,
//       color: '#000000',
//       borderWidth: 1,
//       borderColor: '#cccccc',
//       isBold: false,
//       isItalic: false,
//       isUnderlined: false,
//       textAlign: 'left',
//     };

//     const updated = [...currentPage.textBoxes, newTextBox];
//     updateCurrentPageTextBoxes(updated);
//     setSelectedTextBox?.(newTextBox);
//     setSelectedElement(null);
//   };

//   const activePage = pages.find((p) => p.id === activeId);

//   return (
//     <div className="h-full w-[400px] flex flex-col bg-editor-gray border-r border-editor-border">
//       <div className="p-3 border-b border-editor-border">
//         <h2 className="text-sm font-semibold text-editor-darkgray">Tools</h2>
//         <div className="flex flex-wrap gap-2 mt-2">
//           {tools.map((tool) => (
//             <button
//               key={tool.id}
//               className={cn(
//                 'flex flex-col items-center p-2 rounded-md transition-colors',
//                 selectedElement === tool.id
//                   ? 'bg-editor-blue text-white'
//                   : 'bg-white text-editor-darkgray hover:bg-editor-hovergray'
//               )}
//               onClick={() =>
//                 setSelectedElement(selectedElement === tool.id ? null : tool.id)
//               }
//             >
//               <tool.icon className="w-5 h-5" />
//               <span className="text-xs mt-1">{tool.name}</span>
//             </button>
//           ))}
//         </div>
//       </div>

//       <div className="p-3 flex-1 overflow-y-auto">
//         <DndContext
//           sensors={sensors}
//           collisionDetection={closestCenter}
//           onDragEnd={handleDragEnd}
//           onDragStart={(event) => setActiveId(event.active.id.toString())}
//         >
//           <SortableContext items={pages.map((p) => p.id)} strategy={verticalListSortingStrategy}>
//             {pages.map((page, index) => (
//               <SortablePageItem
//                 key={page.id}
//                 page={page}
//                 index={index}
//                 currentPageIndex={currentPageIndex}
//                 setCurrentPageIndex={setCurrentPageIndex}
//               />
//             ))}
//           </SortableContext>

//           <DragOverlay>
//             {activePage ? (
//               <div className="p-2 rounded border bg-white shadow text-sm font-medium">
//                 {activePage.name}
//               </div>
//             ) : null}
//           </DragOverlay>
//         </DndContext>

//         <Button
//           onClick={handleAddTextBox}
//           className="mt-4 w-full bg-gray-200 text-gray-800 hover:bg-gray-300"
//         >
//           Add Text Box
//         </Button>
//       </div>
//     </div>
//   );
// };

// export default Sidebar;




import React, { useState, useRef } from 'react';
import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Palette, Square, TextCursor } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { TextBoxType } from '@/types/editor';

interface Page {
  id: string;
  name: string;
  baseImage: string | null;
  backgroundImage: string | null;
  foregroundImage: string | null;
  textBoxes: TextBoxType[];
}

interface SidebarProps {

  pages: Page[];
  setPages: (pages: Page[]) => void;
  currentPageIndex: number;
  setCurrentPageIndex: (index: number) => void;


  selectedElement: string | null;
  setSelectedElement: (element: string | null) => void;
  setSelectedTextBox?: (tb: TextBoxType) => void;
  updateCurrentPageTextBoxes?: (boxes: TextBoxType[]) => void;
  onImageSelect: (src: string, type?: 'base' | 'background' | 'foreground') => void;
  baseImages: string[];
  backgroundImages?: string[];
  foregroundImages?: string[];
  onImageUpload?: (e: React.ChangeEvent<HTMLInputElement>, type: 'base' | 'background' | 'foreground') => void;
  onDeleteImage?: (src: string, type: 'base' | 'background' | 'foreground') => void;
  currentPage?: Page;
}

const Sidebar: React.FC<SidebarProps> = ({
  selectedElement,
  setSelectedElement,
  setSelectedTextBox,
  updateCurrentPageTextBoxes,
  onImageSelect,
  baseImages = [],
  backgroundImages = [],
  foregroundImages = [],
  onImageUpload,
  onDeleteImage,
  currentPage,
}) => {
  const [showImagePreview, setShowImagePreview] = useState({
    base: false,
    background: false,
    foreground: false,
  });

  const tools = [
    { id: 'text', name: 'Text', icon: TextCursor },
    { id: 'shape', name: 'Shape', icon: Square },
    { id: 'color', name: 'Color', icon: Palette },
  ];

  const fileInputRefs = {
    base: useRef<HTMLInputElement>(null),
    background: useRef<HTMLInputElement>(null),
    foreground: useRef<HTMLInputElement>(null),
  };

  const triggerFileInput = (type: 'base' | 'background' | 'foreground') => {
    fileInputRefs[type].current?.click();
  };

  const handleShowToggle = (type: 'base' | 'background' | 'foreground') => {
    setShowImagePreview(prev => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  const renderImageSection = (
    label: string,
    type: 'base' | 'background' | 'foreground',
    images: string[]
  ) => (
    <div className="mb-4">
      <div className="flex gap-2 items-center">
        <input
          ref={fileInputRefs[type]}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onImageUpload?.(e, type)}
        />
        <Button
          onClick={() => triggerFileInput(type)}
          variant="destructive"
          size="sm"
          className="h-8 px-3"
        >
          Upload {label.toLowerCase()}
        </Button>
        <Button
          onClick={() => handleShowToggle(type)}
          disabled={images.length === 0}
          variant="outline"
          size="sm"
          className="h-8 px-3"
        >
          Show
        </Button>
        <Button
          onClick={() => {
            const imageToDelete = currentPage?.[`${type}Image`];
            if (imageToDelete) {
              onDeleteImage?.(imageToDelete, type);
            }
          }}
          disabled={!currentPage?.[`${type}Image`]}
          variant="ghost"
          size="sm"
          className="h-8 px-3"
        >
          Delete
        </Button>
      </div>

     

      {showImagePreview[type] && images.length > 0 && (
        <div className="rounded border bg-white p-1 mt-2">
          <img
            src={images[0]}
            alt={`${type} preview`}
            className="w-full object-contain rounded"
          />
        </div>
      )}
    </div>
  );

  const handleAddTextBox = () => {
    if (!currentPage || !updateCurrentPageTextBoxes) return;

    const count = currentPage.textBoxes.length + 1;
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

    const updated = [...currentPage.textBoxes, newTextBox];
    updateCurrentPageTextBoxes(updated);
    setSelectedTextBox?.(newTextBox);
    setSelectedElement(null);
  };

  return (
    <div className="h-full w-[400px] flex flex-col bg-editor-gray border-r border-editor-border">
      <div className="p-3 border-b border-editor-border">
        <h2 className="text-sm font-semibold text-editor-darkgray">Tools</h2>
        <div className="flex flex-wrap gap-2 mt-2">
          {tools.map((tool) => (
            <button
              key={tool.id}
              className={cn(
                'flex flex-col items-center p-2 rounded-md transition-colors',
                selectedElement === tool.id
                  ? 'bg-editor-blue text-white'
                  : 'bg-white text-editor-darkgray hover:bg-editor-hovergray'
              )}
              onClick={() =>
                setSelectedElement(selectedElement === tool.id ? null : tool.id)
              }
            >
              <tool.icon className="w-5 h-5" />
              <span className="text-xs mt-1">{tool.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="p-3 flex-1 overflow-y-auto">
        {currentPage && (
          <div className="mb-4 p-3 bg-white rounded-md shadow-sm">
            <h2 className="text-sm font-semibold text-editor-darkgray mb-2">
              {currentPage.name}
            </h2>
            <div className="space-y-1 text-xs">
              <p>Base: {currentPage.baseImage ? '✓' : '✗'}</p>
              <p>Background: {currentPage.backgroundImage ? '✓' : '✗'}</p>
              <p>Foreground: {currentPage.foregroundImage ? '✓' : '✗'}</p>
              <p>Text boxes: {currentPage.textBoxes.length}</p>
            </div>
          </div>
        )}

        {renderImageSection('Base', 'base', baseImages)}
        {renderImageSection('Background', 'background', backgroundImages)}
        {renderImageSection('Foreground', 'foreground', foregroundImages)}

        <Button
          onClick={handleAddTextBox}
          className="mt-4 w-full bg-gray-200 text-gray-800 hover:bg-gray-300"
        >
          Add Text Box
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;
