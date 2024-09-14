"use client";
import styles from "../../app/page.module.css";
import Navbar from "../../components/Navbar";
import Infobar from "../../components/Infobar";
import { useState, useEffect } from "react";

export default function MyKnowledge() {
  const [userid, setUserid] = useState("");
  const [videos, setVideos] = useState([]); // State to store the fetched videos

  useEffect(() => {
    // Retrieve user ID from local storage
    const storedUserid = localStorage.getItem("userid");
    if (storedUserid) {
      setUserid(storedUserid);
    }

    const fetchVideos = async () => {
      try {
        const response = await fetch(`/api/youtube-search`); // No query parameter needed
        if (!response.ok) {
          throw new Error('Failed to fetch videos');
        }
        const data = await response.json();
        setVideos(data);
      } catch (error) {
        console.error('Error fetching videos:', error);
      }
    };

    fetchVideos(); // Call the fetch function
  }, []);

  console.log("The user id is " + userid);
  console.log(videos);

  return (
    <div className={styles.container}>
      <Navbar />
      <div className={styles.main}>
        <Infobar />
        {/* Display the fetched videos */}
        <div className={styles.videoContainer}>
          {videos.map((video) => (
            <div key={video.id.videoId} className={styles.videoCard}>
              <iframe
                width="560"
                height="315"
                src={`https://www.youtube.com/embed/${video.id.videoId}`}
                title={video.snippet.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              ></iframe>
              <h3>{video.snippet.title}</h3>
              <p>{video.snippet.channelTitle}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}