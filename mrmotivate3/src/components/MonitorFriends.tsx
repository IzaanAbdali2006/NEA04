import styles from "../components/MonitorFriends.module.css";
import { useState, useEffect } from "react";

export default function MonitorFriends({ leaderboardData }) {
  const [userid, setUserid] = useState("");
  const [option, setOption] = useState("My friends"); // default option
  const [friendsData, setFriendsData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [friendRequests, setFriendRequests] = useState([]);
  const [suggestedFriends, setSuggestedFriends] = useState([]);
  const [graphData, setGraphData] = useState([]);
  const [usernamesMap, setUsernamesMap] = useState({}); // Mapping user IDs to usernames

  useEffect(() => {
    // Retrieve user ID from local storage and fetch friend requests and graph data
    const storedUserid = localStorage.getItem("userid");
    if (storedUserid) {
      setUserid(storedUserid);
      fetchFriendRequests(storedUserid);
      fetchGraphData();
    }
  }, []);

  useEffect(() => {
    // Fetch friends data whenever userid changes
    if (userid) {
      fetchFriends(userid); // Ensure userid is passed here
      fetchFriendRequests(userid);
      fetchGraphData();
    }
  }, [userid]);

  const fetchFriends = async (userId) => {
    try {
      const response = await fetch(`http://localhost:5000/fetchFriendsProfilePictures/${userId}`, {
        method: "GET",
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
      setFriendsData(data.friends || []);
    } catch (error) {
      console.error("Failed to fetch friends:", error);
    }
  };

  const fetchFriendRequests = async (userId) => {
    try {
      const response = await fetch(
        `http://localhost:5000/get-friend-requests/${userId}`,
        { method: "GET" }
      );
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
      
      // Log the raw response data
      console.log("Raw data received:", data);
  
      setFriendRequests(data.friendRequests || []); // Update state
  
      // Log the friendRequests after state update (in useEffect)
    } catch (error) {
      console.error("Failed to fetch friend requests:", error);
    }
  };
  
  // UseEffect to observe the change in friendRequests
  useEffect(() => {
    console.log("Updated friendRequests state:", friendRequests);
  }, [friendRequests]);

  const fetchGraphData = async () => {
    try {
      const response = await fetch("http://localhost:5000/graph", {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setGraphData(data);
      computeFriends(data);
      fetchUsernames(data);
    } catch (error) {
      console.error("Failed to fetch graph data:", error);
    }
  };

  const fetchUsernames = async (graph) => {
    try {
      const userIds = graph.flatMap((entry) => [
        entry.userid,
        ...entry.friends,
      ]);
      const uniqueUserIds = [...new Set(userIds)];

      const usernamesPromises = uniqueUserIds.map((id) =>
        fetch(`http://localhost:5000/users/${id}`).then((res) => res.json())
      );

      const usernamesData = await Promise.all(usernamesPromises);
      const usernamesMap = usernamesData.reduce((acc, user) => {
        acc[user.userid] = user.username;
        return acc;
      }, {});

      setUsernamesMap(usernamesMap);
    } catch (error) {
      console.error("Failed to fetch usernames:", error);
    }
  };

  const computeFriends = (graph) => {
    const userGraph = graph.find((entry) => entry.userid === parseInt(userid));
    if (!userGraph) return;

    const friends = new Set(userGraph.friends);

    const potentialFriends = {};
    for (const { userid: graphUserId, friends: friendList } of graph) {
      if (friends.has(graphUserId)) {
        for (const friend of friendList) {
          if (
            friend !== graphUserId &&
            !friends.has(friend) &&
            friend !== parseInt(userid) // Exclude current user
          ) {
            if (!potentialFriends[friend]) {
              potentialFriends[friend] = { userid: friend, mutualCount: 0 };
            }
            potentialFriends[friend].mutualCount++;
          }
        }
      }
    }

    const suggestedFriendsArray = Object.values(potentialFriends);
    const sortedSuggestedFriends = mergeSort(suggestedFriendsArray);

    setSuggestedFriends(sortedSuggestedFriends);
  };

  const mergeSort = (array) => {
    if (array.length <= 1) return array;

    const middle = Math.floor(array.length / 2);
    const left = mergeSort(array.slice(0, middle));
    const right = mergeSort(array.slice(middle));

    return merge(left, right);
  };

  const merge = (left, right) => {
    let sortedArray = [];

    while (left.length && right.length) {
      if (left[0].mutualCount > right[0].mutualCount) {
        sortedArray.push(left.shift());
      } else {
        sortedArray.push(right.shift());
      }
    }

    return [...sortedArray, ...left, ...right];
  };

  const handleSendFriendRequest = async () => {
    if (!searchTerm) return;

    try {
      await fetch("http://localhost:5000/add-friend", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userid, potentialfriend: searchTerm }),
      });
      alert("Friend request sent!");
      console.log("button pressed");
    } catch (error) {
      console.error("Failed to send friend request:", error);
    }
  };

  const handleSendFriendRequestSuggested = async (friendUsername) => {
    try {
      await fetch("http://localhost:5000/add-friend", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userid, potentialfriend: friendUsername }),
      });
      alert("Friend request sent!");
      console.log("Friend request sent to:", friendUsername);

      // Remove friend from suggested friends after sending the request
      setSuggestedFriends((prevSuggestedFriends) =>
        prevSuggestedFriends.filter(
          (friend) => usernamesMap[friend.userid] !== friendUsername
        )
      );
    } catch (error) {
      console.error("Failed to send friend request:", error);
    }
  };

  const handleAcceptRequest = async (friendUsername) => {
    try {
      await fetch("http://localhost:5000/add-friend", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userid, potentialfriend: friendUsername }),
      });
      alert("Friend request accepted!");
      fetchFriendRequests(userid); // Refresh friend requests list
    } catch (error) {
      console.error("Failed to accept friend request:", error);
    }
  };

  const handleRejectRequest = async (friendUsername) => {
    try {
      await fetch("http://localhost:5000/reject-friend-request", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userid, potentialfriend: friendUsername }),
      });
      alert("Friend request rejected!");
      fetchFriendRequests(userid); // Refresh friend requests list
    } catch (error) {
      console.error("Failed to reject friend request:", error);
    }
  };

  const handleUnfriend = async (friendUsername) => {
    try {
      await fetch("http://localhost:5000/unfriend", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userid, friendToRemove: friendUsername }),
      });
      alert("Friend removed successfully!");
    } catch (error) {
      console.error("Failed to unfriend:", error);
    }
  };
  console.log(friendRequests)
  return (
    <div className={styles.MonitorFriends}>
      <div className={styles.Heading}>Monitor Friends</div>
      <div className={styles.options}>
        <div
          className={`${styles.option} ${
            option === "My friends" ? styles.activeOption : ""
          }`}
          onClick={() => setOption("My friends")}
        >
          My friends
        </div>
        <div
          className={`${styles.option} ${
            option === "Add friends" ? styles.activeOption : ""
          }`}
          onClick={() => setOption("Add friends")}
        >
          Add friends
        </div>
        <div
          className={`${styles.option} ${
            option === "Friend requests" ? styles.activeOption : ""
          }`}
          onClick={() => setOption("Friend requests")}
        >
          Friend requests
        </div>
      </div>

      {option === "Add friends" && (
        <div className={styles.addFriend}>
          <div className= {styles.searchFriend}>
          <input
            type="text"
            placeholder="Search for friends"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className= {styles.sendrequestbutton} onClick={handleSendFriendRequest}>Send Friend Request</button>

          </div>
          {suggestedFriends.length > 0 && (
            <div className={styles.leaderboardData}>
              <div className={styles.suggestionsHeading}>Suggested Friends</div>
              {suggestedFriends.map((friend) => (
                <div key={friend.userid} className={styles.leaderboardItem}>
                  <div className= {styles.friendInfo}>
                  <img src={`http://localhost:5000/getProfilePic/${friend.userid}`} alt={`${friend.username}'s profile`} className={styles.profilePic} />
                  <span className= {styles.friendUsername}>                  {usernamesMap[friend.userid]} ({friend.mutualCount} mutual
                    friends)</span>
                  </div>
                  <button
                    onClick={() =>
                      handleSendFriendRequestSuggested(
                        usernamesMap[friend.userid]
                      )
                    }
                    className= {styles.sendrequestbutton}
                  >
                    Add Friend
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

{option === "Friend requests" && (
  <div className={styles.friendRequests}>
    {friendRequests.length === 0 ? (
      <div>No pending requests</div>
    ) : (
      friendRequests.map((request) => (
        <div key={request.userid} className={styles.leaderboardItem}>
          {/* Render the username instead of the entire object */}
          <div className= {styles.friendInfo}>
          <img src={`http://localhost:5000/getProfilePic/${request.userid}`} alt={`${request.username}'s profile`} className={styles.profilePic} />
          <span className= {styles.friendUsername}>{request.username}</span>
          </div>
          <div className= {styles.sendrequestbutton} onClick={() => handleAcceptRequest(request.username)}>
            Accept
          </div>
          <div  className= {styles.sendrequestbutton} onClick={() => handleRejectRequest(request.username)}>
            Reject
          </div>
        </div>
      ))
    )}
  </div>
)}

{option === "My friends" && (
  <div className={styles.myFriends}>
    {friendsData.length === 0 ? (
      <div>No friends added yet</div>
    ) : (
      friendsData.map((friend) => (
        <div key={friend.userid} className={styles.leaderboardItem}>
          <div className= {styles.friendInfo}>
          <img src={`http://localhost:5000/getProfilePic/${friend.userid}`} alt={`${friend.username}'s profile`} className={styles.profilePic} />
          <span className= {styles.friendUsername}>{friend.username}</span>
          </div>
          <button className={styles.sendrequestbutton} onClick={() => handleUnfriend(friend.username)}>Unfriend</button>
        </div>
      ))
    )}
  </div>
)}
    </div>
  );
}
