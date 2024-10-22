"use client";
import styles from "../../app/page.module.css";
import Navbar from "../../components/Navbar";
import Infobar from "../../components/Infobar";
import { useState, useEffect } from "react";
import MonitorFriends from "@/components/MonitorFriends";
import Challenges from "@/components/Challenges";

export default function Friends() {
  const [userid, setUserid] = useState("");
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [sortBy, setSortBy] = useState("hoursofselfimprovement"); // Default sort option
  const [modalOpen, setModalOpen] = useState(false); // State to manage modal visibility
  const [friendId, setFriendId] = useState(""); // State to manage input for friend ID

  useEffect(() => {
    // Retrieve user ID from local storage
    const storedUserid = localStorage.getItem("userid");
    if (storedUserid) {
      setUserid(storedUserid);
    }
  }, []);

  useEffect(() => {
    if (userid) {
      fetchLeaderboardData();
    }
  }, [userid, sortBy]);

  // Merge two sorted arrays
  const merge = (left, right, sortBy) => {
    let sortedArray = [];

    while (left.length && right.length) {
      if (left[0][sortBy] >= right[0][sortBy]) {
        sortedArray.push(left.shift());
      } else {
        sortedArray.push(right.shift());
      }
    }

    // If there are remaining elements in left or right, add them
    return sortedArray.concat(left.slice()).concat(right.slice());
  };

  // Merge sort function
  const mergeSort = (array, sortBy) => {
    if (array.length <= 1) {
      return array;
    }

    const middleIndex = Math.floor(array.length / 2);
    const left = mergeSort(array.slice(0, middleIndex), sortBy);
    const right = mergeSort(array.slice(middleIndex), sortBy);

    return merge(left, right, sortBy);
  };

  const fetchLeaderboardData = async () => {
    try {
      // Fetch the graph data
      const graphRes = await fetch("http://localhost:5000/graph");
      const graphData = await graphRes.json();

      // Find the user and their friends
      const userGraph = graphData.find(
        (entry) => entry.userid === parseInt(userid)
      );
      if (!userGraph) return;

      const userIdsToFetch = [userid, ...userGraph.friends];

      // Fetch stats for each user and their friends
      const statsPromises = userIdsToFetch.map((id) =>
        fetch(`http://localhost:5000/stats/${id}`).then((res) => res.json())
      );

      const allStats = await Promise.all(statsPromises);

      // Flatten and filter any empty responses
      const allStatsData = allStats.flat().filter((stat) => stat);

      // Calculate percentage of completed tasks for each user
      allStatsData.forEach((stat) => {
        if (stat.taskssetthismonth && stat.taskscompletedthismonth) {
          stat.percentageofcompletedtasks =
            (stat.taskssetthismonth / stat.taskscompletedthismonth) * 100;
        } else {
          stat.percentageofcompletedtasks = 0;
        }
      });

      // Sort the stats using merge sort based on the selected category in descending order
      const sortedStats = mergeSort(allStatsData, sortBy);

      setLeaderboardData(sortedStats);
    } catch (error) {
      console.error("Failed to fetch leaderboard data:", error);
    }
  };



  return (
    <div className={styles.container}>
      <Navbar />
      <div className={styles.main}>
        <Infobar />
        <div className={styles.friendsBlock1}>
          <div className={styles.friendsBlock1left}>
            <MonitorFriends leaderboardData={leaderboardData}/>
          </div>
          <div className={styles.friendsBlock1Right}>
            <div className={styles.firstline}>
              <div className={styles.heading}>
                Overall Leaderboards this month
              </div>
            </div>

            <div className={styles.sortby}>
              <div
                className={`${styles.sortbyoption} ${
                  sortBy === "hoursofselfimprovement" ? styles.activeSort : ""
                }`}
                onClick={() => setSortBy("hoursofselfimprovement")}
              >
                Hours of self improvement
              </div>
              <div
                className={`${styles.sortbyoption} ${
                  sortBy === "percentageofcompletedtasks"
                    ? styles.activeSort
                    : ""
                }`}
                onClick={() => setSortBy("percentageofcompletedtasks")}
              >
                Percentage task completed
              </div>
              <div
                className={`${styles.sortbyoption} ${
                  sortBy === "streak" ? styles.activeSort : ""
                }`}
                onClick={() => setSortBy("streak")}
              >
                Streak
              </div>
            </div>
            <div className={styles.leaderboard}>
              {leaderboardData.map((user, index) => (
                <div key={index} className={styles.leaderboardItem}>
                  <div className= {styles.itemleft}>
                  <span>{index + 1}.</span> {/* Ranking number */}
                  <img src={`http://localhost:5000/getProfilePic/${user.userid}`} alt={`${user.username}'s profile`} className={styles.profilePic}/>
                  <span className= {styles.friendUsername}>{user.username}</span>{" "}
                  {/* Assuming you have username */}

                  </div>
                  <div className= {styles.itemright}>

                  <span className= {styles.statNum}>{user[sortBy]}</span>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
        <div>
          <Challenges/>
        </div>
      </div>
    </div>
  );
}
