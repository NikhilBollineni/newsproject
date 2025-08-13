import { useState } from "react";
import Header from "@/components/layout/header";
import NewsFeed from "@/components/news/news-feed";

export default function Bookmarks() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Bookmarked Articles"
        subtitle="Your saved articles and important news"
        onSearch={setSearchQuery}
      />
      
      <div className="flex-1 p-6 overflow-y-auto">
        <NewsFeed searchQuery={searchQuery} showBookmarked={true} />
      </div>
    </div>
  );
}
