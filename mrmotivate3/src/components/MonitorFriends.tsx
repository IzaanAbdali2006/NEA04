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
    // Retrieve user ID from local storage and fetch friend requests, friends, and graph data
    const storedUserid = localStorage.getItem("userid");
    if (storedUserid) {
      setUserid(storedUserid);
      fetchFriendRequests(storedUserid);
      fetchGraphData();
    }
  }, []);

  useEffect(() => {
    if (userid) {
      fetchFriendRequests(userid);
      fetchGraphData();
    }
  }, [userid]);

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
      setFriendRequests(data.friendRequests || []);
    } catch (error) {
      console.error("Failed to fetch friend requests:", error);
    }
  };

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
            option === "Friend request received" ? styles.activeOption : ""
          }`}
          onClick={() => setOption("Friend request received")}
        >
          Friend request received
        </div>
      </div>
      <div className={styles.RenderData}>
        {option === "My friends" && (
          <div className={styles.data}>
            {leaderboardData.map(
              (user, index) =>
                user.userid !== userid && ( // Condition to filter out the current user
                  <div key={index} className={styles.leaderboardItem}>
                    <div className={styles.friendusername}>
                      <span>{usernamesMap[user.userid]}</span>
                    </div>
                    <div
                      onClick={() => handleUnfriend(usernamesMap[user.userid])}
                      className={styles.button}
                    >
                      Unfriend
                    </div>
                  </div>
                )
            )}
          </div>
        )}
        {option === "Add friends" && (
          <div className={styles.AddFriends}>
            <div className={styles.Searchbardata}>
              <input
                type="text"
                placeholder="Search for a friend..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchBar}
              />
              <div
                onClick={handleSendFriendRequest}
                className={styles.sendfriendRequestbutton}
              >
                Send Friend Requests
              </div>
            </div>
            <div className={styles.mutuals}>
              {suggestedFriends.length > 0 ? (
                <div className={styles.SugestedFriends}>
                  <h3 className={styles.Heading}>Suggested Friends</h3>
                  <ul>
                    {suggestedFriends.map((suggestion, index) => (
                      <div className={styles.suggestion} key={index}>
                        <div className={styles.list}>
                          <span className={styles.suggestedUsername}>
                            {usernamesMap[suggestion.userid]}{" "}
                          </span>
                          <span className={styles.mutualfriends}>
                            (Mutual Friends: {suggestion.mutualCount})
                          </span>
                        </div>
                        <div className={styles.buttons}>
                          <div
                            className={styles.sendrequestbutton}
                            onClick={() =>
                              handleSendFriendRequestSuggested(
                                usernamesMap[suggestion.userid]
                              )
                            }
                          >
                            Send Request
                          </div>
                        </div>
                      </div>
                    ))}
                  </ul>
                </div>
              ) : (
                <p>No suggested friends found.</p>
              )}
            </div>
          </div>
        )}
        {option === "Friend request received" && (
          <div className={styles.data}>
            {friendRequests.map((request, index) => (
              <div key={index} className={styles.friendRequestItem}>
                <span className={styles.username}>{request.username}</span>
                <div className={styles.buttons}>
                  <div
                    className={styles.button}
                    onClick={() => handleAcceptRequest(request.username)}
                  >
                    Accept
                  </div>
                  <div
                    className={styles.button}
                    onClick={() => handleRejectRequest(request.username)}
                  >
                    Reject
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

