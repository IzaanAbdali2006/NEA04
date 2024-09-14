import { useState, useEffect } from "react";
import styles from "../components/Challenges.module.css";
import ChallengeModal from "./ChallengeModal"; // Import the modal component

export default function Challenges() {
    const [userid, setUserid] = useState("");
    const [option, setOption] = useState("My Challenges");
    const [challenges, setChallenges] = useState([]);
    const [filteredChallenges, setFilteredChallenges] = useState([]);
    const [isModalOpen, setModalOpen] = useState(false); // State to manage modal visibility
    const [users, setUsers] = useState({}); // Store users with userid as key and username as value

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await fetch('http://localhost:5000/users');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            const userMapping = {};
            data.forEach(user => {
                userMapping[user.userid] = user.username;
            });
            setUsers(userMapping); // Store user mapping in state
        } catch (error) {
            console.error('Failed to fetch users:', error);
        }
    };

    useEffect(() => {
        const storedUserid = localStorage.getItem("userid");
        if (storedUserid) {
            setUserid(storedUserid);
            fetchChallenges();
        }
    }, []);

    const fetchChallenges = async () => {
        try {
            const response = await fetch('http://localhost:5000/challenges');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setChallenges(data.challenges);
            filterChallenges(data.challenges, option);
        } catch (error) {
            console.error('Failed to fetch challenges:', error);
        }
    };

    const filterChallenges = (challenges, option) => {
        let filtered = [];

        if (option === "My Challenges") {
            filtered = challenges.filter(challenge =>
                challenge.participants.includes(parseInt(userid))
            );
        } else if (option === "Invited Challenges") {
            filtered = challenges.filter(challenge =>
                challenge.invitedparticipants.includes(parseInt(userid))
            );
        } else if (option === "Public Challenges") {
            filtered = challenges.filter(challenge =>
                (challenge.publicity === 'public' || challenge.publicity === 'invite only') &&
                !challenge.participants.includes(parseInt(userid))
            );
        }

        setFilteredChallenges(filtered);
    };

    useEffect(() => {
        filterChallenges(challenges, option);
    }, [option, challenges]);

    const handleCreateChallenge = async (newChallenge) => {
        try {
            const response = await fetch('http://localhost:5000/create-challenge', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newChallenge),
            });

            if (!response.ok) {
                throw new Error('Failed to create challenge');
            }

            fetchChallenges(); // Refresh challenges after creating a new one
        } catch (error) {
            console.error('Error creating challenge:', error);
        }
    };

    const acceptChallenge = async (teamid) => {
        try {
            const response = await fetch('http://localhost:5000/accept-challenge-invite', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    teamid,
                    userId: parseInt(userid)
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to accept challenge invite');
            }

            fetchChallenges();
        } catch (error) {
            console.error('Error accepting challenge:', error);
        }
    };

    const rejectChallenge = async (teamid) => {
        try {
            const response = await fetch('http://localhost:5000/reject-challenge-invite', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    teamid,
                    userId: parseInt(userid)
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to reject challenge invite');
            }

            fetchChallenges();
        } catch (error) {
            console.error('Error rejecting challenge:', error);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toISOString().split('T')[0];
    };

    const calculatePercentage = (successes, fails) => {
        const total = successes + fails;
        return total === 0 ? 0 : Math.round((successes / total) * 100);
    };

    const calculatePercentageCompleted = (startDate, endDate) => {
        const now = new Date();
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        if (now <= start) return 0; // Challenge hasn't started yet
        if (now >= end) return 100; // Challenge is completed

        const totalDuration = end - start;
        const elapsedDuration = now - start;
        return Math.min((elapsedDuration / totalDuration) * 100, 100); // Ensure percentage is between 0 and 100
    };
    const mergeSort = (array, key) => {
        if (array.length <= 1) return array;
    
        const middle = Math.floor(array.length / 2);
        const left = array.slice(0, middle);
        const right = array.slice(middle);
    
        return merge(mergeSort(left, key), mergeSort(right, key), key);
    };
    
    const merge = (left, right, key) => {
        let result = [];
        let leftIndex = 0;
        let rightIndex = 0;
    
        while (leftIndex < left.length && rightIndex < right.length) {
            if (left[leftIndex][key] > right[rightIndex][key]) {
                result.push(left[leftIndex]);
                leftIndex++;
            } else {
                result.push(right[rightIndex]);
                rightIndex++;
            }
        }
    
        return result.concat(left.slice(leftIndex)).concat(right.slice(rightIndex));
    };
    return (
        <div className={styles.Challenges}>
            <div className={styles.Heading}>Challenges</div>
            <div className={styles.options}>
                <div
                    className={`${styles.option} ${option === "My Challenges" ? styles.activeOption : ""}`}
                    onClick={() => setOption("My Challenges")}
                >
                    My Challenges
                </div>
                <div
                    className={`${styles.option} ${option === "Invited Challenges" ? styles.activeOption : ""}`}
                    onClick={() => setOption("Invited Challenges")}
                >
                    Invited Challenges
                </div>
                <div
                    className={`${styles.option} ${option === "Public Challenges" ? styles.activeOption : ""}`}
                    onClick={() => setOption("Public Challenges")}
                >
                    Public Challenges
                </div>
                <div
                    className={styles.CreateChallengeButton}
                    onClick={() => setModalOpen(true)} // Open the modal
                >
                    Create a challenge
                </div>
            </div>

            <ChallengeModal
                isOpen={isModalOpen}
                onClose={() => setModalOpen(false)}
                onSubmit={handleCreateChallenge}
            />

            <div className={styles.ChallengeList}>
                {filteredChallenges.map((challenge, index) => {
                    const participantsWithScores = challenge.participants.map((p, idx) => ({
                        id: p,
                        score: calculatePercentage(challenge.success[idx], challenge.fail[idx])
                    }));

                    // Sort participants using merge sort
                    const sortedParticipants = mergeSort(participantsWithScores, 'score');

                    return (
                        <div key={index} className={styles.challengeItem}>
                            <h3>{challenge.challengename}</h3>
                            <p>{challenge.challengedesc}</p>
                            <div className={styles.timelineWrapper}>
                                <div
                                    className={styles.timeline}
                                    style={{ width: `${calculatePercentageCompleted(challenge.startdate, challenge.enddate)}%` }}
                                />
                            </div>
                            <div className={styles.dates}>
                                <div className={styles.startdate}>{formatDate(challenge.startdate)}</div>
                                <div className={styles.enddate}>{formatDate(challenge.enddate)}</div>
                            </div>

                            {/* Leaderboard */}
                            <div className={styles.leaderboard}>
                                <h4>Leaderboard:</h4>
                                <ul>
                                    {sortedParticipants.slice(0, 3).map((participant, i) => {
                                        const username = users[participant.id]; // Fetch username using the userid

                                        // Determine the emoji based on the position
                                        let emoji = '';
                                        if (i === 0) {
                                            emoji = '🥇'; // 1st place
                                        } else if (i === 1) {
                                            emoji = '🥈'; // 2nd place
                                        } else if (i === 2) {
                                            emoji = '🥉'; // 3rd place
                                        }

                                        return (
                                            <li key={participant.id} className={styles.list}>
                                                {emoji} {username}: {participant.score}%
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>

                            {option === "Invited Challenges" && (
                                <div className={styles.inviteActions}>
                                    <button
                                        className={styles.acceptButton}
                                        onClick={() => acceptChallenge(challenge.teamid)}
                                    >
                                        Accept
                                    </button>
                                    <button
                                        className={styles.rejectButton}
                                        onClick={() => rejectChallenge(challenge.teamid)}
                                    >
                                        Reject
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}