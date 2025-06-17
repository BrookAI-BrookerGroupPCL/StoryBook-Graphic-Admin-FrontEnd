import { useParams } from "react-router-dom";

const StoryPage = () => {
  const { story_name } = useParams();

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Story Page</h1>
      <p>Currently viewing: <strong>{story_name}</strong></p>
    </div>
  );
};

export default StoryPage;
