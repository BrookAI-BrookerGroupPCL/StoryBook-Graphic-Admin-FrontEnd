import { useParams, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import Editor from "@/components/Editor/Editor";

const Service = () => {
  const { selected_story_name, gender: pathGender } = useParams();
  const location = useLocation();
  const queryGender = new URLSearchParams(location.search).get("gender");

  const story = selected_story_name || "";
  const gender = pathGender || queryGender || "male"; 

  const [pagesData, setPagesData] = useState(null);
  const [textData, setTextData] = useState(null);

  useEffect(() => {
    console.log("🔍 Story:", story);
    console.log("🔍 Gender:", gender);
  
    const fetchImageMetadata = async () => {
      try {
        const res = await fetch("http://localhost:7000/get_image_data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ storyName: story, imageType: "background" }),
        });
  
        const result = await res.json();
        console.log("📦 Image metadata:", result);
        if (result.success && result.pages) {
          setPagesData(result.pages);
        } else {
          console.error("❌ Image error:", result.error);
        }
      } catch (err) {
        console.error("❌ Failed to fetch image metadata:", err);
      }
    };
  
    const fetchTextBoxes = async () => {
      try {
        const res = await fetch("http://localhost:7000/get_text_boxes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ storyName: story, gender, lang: "en" }),
        });
  
        const result = await res.json();
        console.log("📝 Text box data:", result);
        if (result.success) {
          setTextData(result.json);
        } else {
          console.error("❌ Text error:", result.error);
        }
      } catch (err) {
        console.error("❌ Text fetch error:", err);
      }
    };
  
    if (story) {
      fetchImageMetadata();
      fetchTextBoxes();
    }
  }, [story, gender]);
  


return  (
      <Editor
        selectedStory={story}
        initialPages={pagesData}
        initialTextData={textData}
        selectedGender={gender}
      />
    )
  }

export default Service;



// import { useParams, useLocation} from "react-router-dom";
// import { useEffect, useState } from "react";
// import Editor from "@/components/Editor/Editor";

// const Service = () => {
//   // const { selected_story_name } = useParams();
//   // const story = selected_story_name || "";

//   const [pagesData, setPagesData] = useState(null);

//   const { selected_story_name, gender: pathGender } = useParams();
//   const location = useLocation();
//   const queryGender = new URLSearchParams(location.search).get("gender");

//   const story = selected_story_name || "";
//   const gender = pathGender || queryGender || "male"; // fallback to "male"

//   // const [pagesData, setPagesData] = useState(null);
//   const [textData, setTextData] = useState(null);

//   useEffect(() => {
//     const fetchImageMetadata = async () => {
//       try {
//         const res = await fetch("http://localhost:7000/get_image_data", {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ storyName: story, imageType: "background" }),
//         });

//         const result = await res.json();
//         if (result.success && result.pages) {
//           setPagesData(result.pages);
//         } else {
//           console.error("❌ Backend returned error:", result.error);
//         }
//       } catch (err) {
//         console.error("❌ Failed to fetch image metadata:", err);
//       }
//     };

//     if (story) {
//       fetchImageMetadata();
//     }
//   }, [story]);

//   return pagesData ? (
//     <Editor selectedStory={story} initialPages={pagesData} initialTextData={textData} selectedGender={gender} />
//   ) : (
//     <div className="p-6 text-center">📦 Loading background images for <b>{story}</b>...</div>
//   );
// };

// export default Service;




// import { useParams } from "react-router-dom";
// import { useEffect } from "react";
// import Editor from "@/components/Editor/Editor"; // Adjust path if needed

// const Service = () => {
//     // const { selected_story_name, selected_art_style, selected_gender } = useParams();
//     const { selected_story_name} = useParams();

//   const story = selected_story_name || "";
// //   const style = selected_art_style || "";
// //   const gender = selected_gender || "";
//   useEffect(() => {
//     console.log("Selected Story:", story);
//     // console.log("Art Style:", style);
//     // console.log("Gender:", gender);
//   }, [story]);
// // }, [story, style, gender]);

//   return (
//     <Editor
//       selectedStory={story}
//     //   selectedArtStyle={style}
//     //   selectedGender={gender}
//     />
//   );
// };

// export default Service;
