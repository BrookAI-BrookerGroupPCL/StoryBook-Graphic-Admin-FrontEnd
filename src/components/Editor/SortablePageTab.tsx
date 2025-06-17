// // components/SortablePageTab.tsx
// import { useSortable } from "@dnd-kit/sortable";
// import { CSS } from "@dnd-kit/utilities";
// import { Page } from './Editor'; // adjust path if needed


// interface SortablePageTabProps {
//   page: Page;
//   index: number;
//   currentPageIndex: number;
//   setCurrentPageIndex: (index: number) => void;
// }

// const SortablePageTab: React.FC<SortablePageTabProps> = ({
//   page,
//   index,
//   currentPageIndex,
//   setCurrentPageIndex,
// }) => {
//   const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: page.id });

//   const style = {
//     transform: CSS.Transform.toString(transform),
//     transition,
//   };

//   return (
//     <button
//       ref={setNodeRef}
//       style={style}
//       {...attributes}
//       {...listeners}
//       className={`px-4 py-2 rounded-md text-sm whitespace-nowrap ${
//         index === currentPageIndex ? "bg-blue-500 text-white" : "bg-gray-100 hover:bg-gray-200"
//       }`}
//       onClick={() => setCurrentPageIndex(index)}
//     >
//       {page.name}
//     </button>
//   );
// };

// export default SortablePageTab;



// components/SortablePageTab.tsx
import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Page } from "./Editor"; // Adjust import path if needed

interface SortablePageTabProps {
  page: Page;
  index: number;
  currentPageIndex: number;
  setCurrentPageIndex: (index: number) => void;
}

const SortablePageTab: React.FC<SortablePageTabProps> = ({
  page,
  index,
  currentPageIndex,
  setCurrentPageIndex,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: page.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <button
      ref={setNodeRef}
      {...attributes}
      //  DON'T spread listeners here — it blocks clicks
      onClick={() => setCurrentPageIndex(index)}
      style={style}
      className={`px-4 py-2 rounded-md text-sm whitespace-nowrap ${
        index === currentPageIndex
          ? "bg-blue-500 text-white"
          : "bg-gray-100 hover:bg-gray-200"
      }`}
    >
      {/*  make inner span the drag handle */}
      <span {...listeners} className="cursor-grab active:cursor-grabbing">
        {page.name}
      </span>
    </button>
  );
};

export default SortablePageTab;

