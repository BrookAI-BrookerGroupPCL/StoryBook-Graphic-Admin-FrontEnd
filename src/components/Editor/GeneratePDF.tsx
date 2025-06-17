// // import React from "react";

// // const GeneratePDF = () => {
// //   console.log("✅ Loaded GeneratePDF");

// //   return (
// //     <div className="flex items-center justify-center h-screen">
// //       <h1 className="text-4xl font-bold">Welcome</h1>
// //     </div>
// //   );
// // };

// // export default GeneratePDF;

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "react-router-dom";
import type { Page } from "@/types/editor";

const GeneratePDF = () => {
  const [kidName, setKidName] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const useQueryParams = () => {
    const location = useLocation();
    return new URLSearchParams(location.search);
  };

  const query = useQueryParams();
  const selectedStory = query.get("story");
  const selectedGender = query.get("gender");

  const [pages, setPages] = useState<Page[]>([]);
  // const totalPages = parseInt(query.get("total_pages") || "0", 10);


  const handleGeneratePDF = async () => {
    if (!kidName.trim()) {
      toast.error("Please enter the kid's name.");
      return;
    }
  
    setIsGenerating(true);
    setError(null);
    setPdfUrl(null); // clear old PDF if any
  
    try {
      const response = await fetch("http://localhost:7000/generate_pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          story_name: selectedStory,
          kid_name: kidName.trim(),
          gender: selectedGender,
          total_pages: 13,
          // total_pages: totalPages,

        }),
      });
  
      // ⚠️ Only call .json() once
      const result = await response.json();
      console.log("📦 Server response:", result);
  
      if (response.ok && result.success && typeof result.pages === "string" && result.pages.startsWith("http")) {
        setPdfUrl(result.pages); // ✅ Presigned PDF URL
        toast.success("✅ PDF successfully generated!");
      } else {
        console.error("❌ PDF generation failed:", result.error);
        setError("Failed to generate PDF.");
        toast.error(result.error || "❌ PDF generation failed.");
      }
    } catch (err: any) {
      console.error("❌ PDF generation error:", err);
      setError("Unexpected error.");
      toast.error("❌ Unexpected error while generating PDF.");
    } finally {
      setIsGenerating(false);
    }
  };
  


  const handleOpenPDF = () => {
    if (pdfUrl) {
      window.open(pdfUrl, "_blank");
    }
  };

  return (
    <div className="p-10 space-y-6 font-bubble border-t border-blue-600">
      {/* Kid Name + Button */}
      <div className="w-full md:w-1/2 flex flex-col gap-4 bg-gray-900 p-6 rounded-xl shadow-lg border border-gray-700">
        <h2 className="text-white text-lg">🧒 Enter Kid's Name</h2>
        <div className="flex gap-4 items-center">
          <input
            type="text"
            value={kidName}
            onChange={(e) => setKidName(e.target.value)}
            placeholder="e.g. Emily"
            className="border border-cyan-500 rounded-lg px-4 py-2 w-64 bg-gray-800 text-white"
          />
          <Button
            onClick={handleGeneratePDF}
            disabled={isGenerating}
            className="bg-blue-900 text-white px-6 py-2 rounded-lg hover:scale-105 transition-all duration-300"
          >
            {isGenerating ? "Generating..." : "Generate PDF"}
          </Button>
        </div>
      </div>

      {/* PDF Action */}
      {pdfUrl && (
        <div className="flex items-center justify-between text-gray-300">
          <h3 className="text-m text-left">🎉 Your story is ready!</h3>
          {/* <div className="flex gap-4">
            <Button onClick={handleOpenPDF} className="gap-2" aria-label="Full Screen">
              <ExternalLink className="h-4 w-4" />
              Open PDF
            </Button>
          </div> */}
        </div>
      )}

      {/* PDF Viewer or Error */}
      {isGenerating ? (
        <div className="text-center text-lg text-gray-400 h-64 flex items-center justify-center">
          ⏳ Generating your story...
        </div>
      ) : error ? (
        <div className="text-center text-lg text-red-500 h-64 flex items-center justify-center bg-muted/30 border rounded">
          {error}
        </div>
      ) : pdfUrl ? (
        <div className="hidden sm:block w-full h-[80vh] overflow-hidden rounded-lg bg-muted/30 p-0">
          <iframe
            src={pdfUrl}
            title="PDF Viewer"
            className="w-full h-full border-0"
            style={{ display: "block", width: "100%", height: "100%" }}
          />
        </div>
      ) : (
        <div className="text-center text-lg text-orange-400 h-64 flex items-center justify-center bg-muted/30 border rounded">
          No PDF yet. Please enter a name and generate one.
        </div>
      )}
    </div>
  );
};

export default GeneratePDF;




// import React, { useState } from "react";
// import { Button } from "@/components/ui/button";
// import { ExternalLink } from "lucide-react";
// import { toast } from "sonner";
// import { useLocation } from "react-router-dom";
// import type { Page } from "@/types/editor"; 



// const GeneratePDF = () => {
//     const [kidName, setKidName] = useState("");
//     const [isGenerating, setIsGenerating] = useState(false);
//     const [pdfUrl, setPdfUrl] = useState<string | null>(null);

//     const [pages, setPages] = useState<Page[]>([]);
  
//     const useQueryParams = () => {
//       const location = useLocation();
//       return new URLSearchParams(location.search);
//     };
  
//     const query = useQueryParams();
//     const selectedStory = query.get("story");
//     const selectedGender = query.get("gender");

  
//     const handleGeneratePDF = async () => {
//       if (!kidName.trim()) {
//         toast.error("Please enter the kid's name.");
//         return;
//       }
  
 
  
//       setIsGenerating(true);
//       toast("⏳ Fetching background images...");

//       console.log("selectedStory:", selectedStory);
  
//       try {
//         const response = await fetch("http://localhost:7000/generate_pdf", {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({
//             story_name: selectedStory,
//             // total_pages: pages.length
//             kid_name: kidName,
//             gender: selectedGender,
//             total_pages: 13,
            
//           }),
//         });
  
//         const result = await response.json();
  
//         if (response.ok && result.success) {
//           console.log("✅ Background image list:", result.images);
//           toast.success(`✅ Fetched ${result.images.length} background images!`);
//         } else {
//           toast.error(result.error || "Failed to fetch background images.");
//         }
//       } catch (error) {
//         toast.error("❌ Unexpected error while fetching backgrounds.");
//         console.error(error);
//       } finally {
//         setIsGenerating(false);
//       }
//     };
    

//   const handleOpenPDF = () => {
//     if (pdfUrl) {
//       window.open(pdfUrl, "_blank");
//     }
//   };

//   return (
//     <div className="p-10 space-y-6 font-bubble border-t border-blue-600">
//       {/* Kid Name + Button */}
//       <div className="w-full md:w-1/2 flex flex-col gap-4 bg-gray-900 p-6 rounded-xl shadow-lg border border-gray-700">
//         <h2 className="text-white text-lg">🧒 Enter Kid's Name</h2>
//         <div className="flex gap-4 items-center">
//           <input
//             type="text"
//             value={kidName}
//             onChange={(e) => setKidName(e.target.value)}
//             placeholder="e.g. Emily"
//             className="border border-cyan-500 rounded-lg px-4 py-2 w-64 bg-gray-800 text-white"
//           />
//           <Button
//             onClick={handleGeneratePDF}
//             disabled={isGenerating}
//             className="bg-blue-900 text-white px-6 py-2 rounded-lg hover:scale-105 transition-all duration-300"
//           >
//             {isGenerating ? "Generating..." : "Generate PDF"}
//           </Button>
//         </div>
//       </div>

//       {/* PDF Actions */}
//       {pdfUrl && (
//         <div className="flex items-center justify-between text-gray-300">
//           <h3 className="text-m text-left">🎉 Your story is ready!</h3>
//           <div className="flex gap-4">
//             <Button
//               onClick={handleOpenPDF}
//               className="gap-2"
//               aria-label="Full Screen"
//             >
//               <ExternalLink className="h-4 w-4" />
//               Open PDF
//             </Button>
//           </div>
//         </div>
//       )}

//       {/* Story Viewer or Placeholder */}
//       {pdfUrl ? (
//         <div className="hidden sm:block w-full h-[80vh] overflow-hidden rounded-lg bg-muted/30 p-0">
//           <iframe
//             src={pdfUrl}
//             title="PDF Viewer"
//             className="w-full h-full border-0"
//           />
//         </div>
//       ) : (
//         <div className="text-center text-lg text-orange-400 h-64 flex items-center justify-center bg-muted/30 border rounded">
//           No PDF yet. Please enter a name and generate one.
//         </div>
//       )}
//     </div>
//   );
// };

// export default GeneratePDF;



