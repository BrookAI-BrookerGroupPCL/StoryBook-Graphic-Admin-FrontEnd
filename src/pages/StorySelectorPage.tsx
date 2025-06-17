import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const StorySelectorPage = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"select" | "create">("select");
  const [story, setStory] = useState("dev-magical-zoo-dream");
  const [gender, setGender] = useState("male");
  const [storyList, setStoryList] = useState<{ name: string; preview_url: string | null }[]>([]);

  const handleGo = async () => {
    if (!story) {
      alert("Please select a story.");
      return;
    }
  
    const storyName = story;
    const storyname_encoded = story;
  
    navigate(`/${storyname_encoded}?gender=${gender}`);
  };
  

  useEffect(() => {
    fetch("http://localhost:7000/list-stories")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStoryList(data.stories);
          if (data.stories.length > 0) {
            setStory(data.stories[0].name); 
          }
        } else {
          console.error("Failed to load stories", data.error);
        }
      })
      .catch((err) => console.error("Fetch error:", err));
  }, []);
  
  

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Select or Create Your Story</h1>
      {mode === "select" ? (
        <>
          <label className="block mb-1">Story:</label>

        <select
          value={story}
          onChange={(e) => setStory(e.target.value)}
          className="mb-4 w-full p-2 border"
        >
          {!storyList.find(s => s.name === story) && (
            <option disabled value="">
              -- Select a Story --
            </option>
          )}
          {storyList.map((story) => (
            <option key={story.name} value={story.name}>
              {story.name.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
            </option>
          ))}
        </select>


        </>
      ) : (
        <>
            <label className="block mb-1">Story:</label>
            <select
              value={story}
              onChange={(e) => setStory(e.target.value)}
              className="mb-4 w-full p-2 border"
            >
              {!storyList.find(s => s.name === story) && (
                <option disabled value="">
                  -- Select a Story --
                </option>
              )}
              {storyList.map((story) => (
                <option key={story.name} value={story.name}>
                  {story.name.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                </option>
              ))}
            </select>
        </>

      )}

      <label className="block mb-1">Gender:</label>
      <select
        value={gender}
        onChange={(e) => setGender(e.target.value)}
        className="mb-4 w-full p-2 border"
      >
        <option value="male">Male</option>
        <option value="female">Female</option>
      </select>

      <button
        onClick={handleGo}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
      >
        Go
      </button>
    </div>
  );
};

export default StorySelectorPage;


// ------------------------ with new story created -----------------------------------

// import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";

// const StorySelectorPage = () => {
//   const navigate = useNavigate();
//   const [mode, setMode] = useState<"select" | "create">("select");
//   const [story, setStory] = useState("dev-magical-zoo-dream");
//   const [customStory, setCustomStory] = useState("");
//   const [gender, setGender] = useState("male");
//   const [storyList, setStoryList] = useState<{ name: string; preview_url: string | null }[]>([]);



//   const handleGo = async () => {

//     const rawName = mode === "select" ? story : customStory.trim().toLowerCase();
//     console.log("🟡 Raw story name:", rawName);
//     const storyName = rawName
//     const storyname_encoded = rawName;
//     console.log("🌐 Encoded story name for URL:", storyname_encoded);

    
//     // const rawName = mode === "select" ? story : customStory.trim();
//     // const storyName = rawName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
//     // const storyname_encoded = encodeURIComponent(storyName);  

  
//     if (!storyName) return alert("Please enter a story name.");
  
//     if (mode === "create") {
//       try {
     
//         const res = await fetch(`http://localhost:7000/${storyName}?gender=${gender}`, {
//           method: "POST",
//         });
      
//         if (!res.ok) {
//           const text = await res.text();
//           alert(`❌ Server returned ${res.status}: ${text}`);
//           return;
//         }
      
//         const result = await res.json();
//         if (!result.success) {
//           alert("❌ Failed to create story: " + result.error);
//           return;
//         }
      
//         alert("✅ Story created!");
//         navigate(`/${storyname_encoded}?gender=${gender}`);


//       } catch (err) {
//         alert("❌ Error: " + err.message);
//       }
      
//     }
  
//     navigate(`/${storyName}?gender=${gender}`);

//   };



//   useEffect(() => {
//     fetch("http://localhost:7000/list-stories")
//       .then((res) => res.json())
//       .then((data) => {
//         if (data.success) {
//           setStoryList(data.stories);
//           if (data.stories.length > 0) {
//             setStory(data.stories[0].name); 
//           }
//         } else {
//           console.error("Failed to load stories", data.error);
//         }
//       })
//       .catch((err) => console.error("Fetch error:", err));
//   }, []);
  
  

//   return (
//     <div className="p-8 max-w-md mx-auto">
//       <h1 className="text-2xl font-bold mb-4">Select or Create Your Story</h1>

//       <div className="mb-4">
//         <label className="mr-4">
//           <input
//             type="radio"
//             value="select"
//             checked={mode === "select"}
//             onChange={() => setMode("select")}
//             className="mr-1"
//           />
//           Select Existing
//         </label>
//         <label>
//           <input
//             type="radio"
//             value="create"
//             checked={mode === "create"}
//             onChange={() => setMode("create")}
//             className="mr-1 ml-4"
//           />
//           Create New
//         </label>
//       </div>

//       {mode === "select" ? (
//         <>
//           <label className="block mb-1">Story:</label>

//         <select
//           value={story}
//           onChange={(e) => setStory(e.target.value)}
//           className="mb-4 w-full p-2 border"
//         >
//           {!storyList.find(s => s.name === story) && (
//             <option disabled value="">
//               -- Select a Story --
//             </option>
//           )}
//           {storyList.map((story) => (
//             <option key={story.name} value={story.name}>
//               {story.name.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
//             </option>
//           ))}
//         </select>


//         </>
//       ) : (
//         <>
//           <label className="block mb-1">New Story Name:</label>
//           <input
//             type="text"
//             value={customStory}
//             onChange={(e) => setCustomStory(e.target.value)}
//             placeholder="Enter your story name"
//             className="mb-4 w-full p-2 border"
//           />
//         </>
//       )}

//       <label className="block mb-1">Gender:</label>
//       <select
//         value={gender}
//         onChange={(e) => setGender(e.target.value)}
//         className="mb-4 w-full p-2 border"
//       >
//         <option value="male">Male</option>
//         <option value="female">Female</option>
//       </select>

//       <button
//         onClick={handleGo}
//         className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
//       >
//         Go
//       </button>
//     </div>
//   );
// };

// export default StorySelectorPage;


