import { useState, useEffect } from "react";
import styles from "./ChallengeModal.module.css";
import PersonIcon from '@mui/icons-material/Person';

interface User {
    userid: number;
    username: string;
}

interface ChallengeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (newChallenge: {
        challengename: string;
        challengedesc: string;
        invitedparticipants: number[];
        startdate: string;
        enddate: string;
        freq: number;
        estimatedtime: number;
        leaduserid: number;
        publicity: string;
        success: [0];
        fail: [0];
    }) => void;
}

export default function ChallengeModal({
    isOpen,
    onClose,
    onSubmit,
}: ChallengeModalProps) {
    const [challengename, setChallengename] = useState("");
    const [challengedesc, setChallengedesc] = useState("");
    const [invitedParticipants, setInvitedParticipants] = useState<User[]>([]);
    const [participantSearch, setParticipantSearch] = useState("");
    const [startdate, setStartdate] = useState("");
    const [enddate, setEnddate] = useState("");
    const [freq, setFreq] = useState(1);
    const [estimatedtime, setEstimatedTime] = useState(1);
    const [publicity, setPublicity] = useState("public");
    const [users, setUsers] = useState<User[]>([]);
    const [page, setPage] = useState(1);
    const [leadUserId, setLeadUserId] = useState<number | null>(null);

    useEffect(() => {
        const storedLeadUserId = localStorage.getItem("userid");
        if (storedLeadUserId) {
            setLeadUserId(Number(storedLeadUserId));
        }
    }, []);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await fetch("http://localhost:5000/users");
                if (!response.ok) {
                    throw new Error("Network response was not ok");
                }
                const data: User[] = await response.json();
                setUsers(data);
            } catch (error) {
                console.error("Error fetching users:", error);
            }
        };

        fetchUsers();
    }, []);

    useEffect(() => {
        console.log("Invited Participants Updated:", invitedParticipants);
    }, [invitedParticipants]);

    const handleInviteChange = () => {
        const usernameInSearchBox = participantSearch.trim().toLowerCase();
        
        const user = users.find(u => u.username.toLowerCase() === usernameInSearchBox);
        if (!user) {
            console.log("No user found for username:", usernameInSearchBox);
            alert("User not found");
            return;
        }

        let isAlreadyInvited = invitedParticipants.some(p => p.username.toLowerCase() === usernameInSearchBox);
        if (isAlreadyInvited) {
            console.log("User already invited:", user);
            alert("User is already invited");
            return;
        }

        setInvitedParticipants((prevParticipants) => [...prevParticipants, user]);
        setParticipantSearch("");
    };

    const removeParticipant = (userId: number) => {
        setInvitedParticipants((prevParticipants) => {
            const updatedParticipants = prevParticipants.filter(p => p.userid !== userId);
            return updatedParticipants;
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const successArray = new Array(invitedParticipants.length).fill(0);
        const failArray = new Array(invitedParticipants.length).fill(0);

        if (leadUserId === null) {
            alert("Lead User ID not found!");
            return;
        }

        const newChallenge = {
            challengename,
            challengedesc,
            invitedparticipants: invitedParticipants.map(p => p.userid),
            startdate,
            enddate,
            freq,
            estimatedtime,
            leaduserid: leadUserId,
            publicity,
            success: [0],
            fail: [0],
        };

        console.log("Challenge data:", JSON.stringify(newChallenge, null, 2));

        onSubmit(newChallenge);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className={styles.modalBackdrop}>
            <div className={styles.modal}>
                {page === 1 ? (
                    <>
                        <h2>Create New Challenge</h2>
                        <form className={styles.modalForm}>
                            <label>Challenge Name:</label>
                            <input
                                type="text"
                                value={challengename}
                                onChange={(e) => setChallengename(e.target.value)}
                                required
                            />

                            <label>Description:</label>
                            <textarea
                                value={challengedesc}
                                onChange={(e) => setChallengedesc(e.target.value)}
                                required
                            />

                            <label>Invite Participants:</label>
                            <input
                                type="text"
                                value={participantSearch}
                                onChange={(e) => setParticipantSearch(e.target.value)}
                                placeholder="Search for a user"
                                list="userSuggestions"
                            />
                            <datalist id="userSuggestions">
                                {users
                                    .filter(user => user.username.toLowerCase().includes(participantSearch.toLowerCase()))
                                    .map(user => (
                                        <option key={user.userid} value={user.username}>
                                            {user.username}
                                        </option>
                                    ))}
                            </datalist>

                            <button
                                type="button"
                                onClick={handleInviteChange}
                                disabled={!participantSearch}
                                className={styles.AddParticipant}
                            >
                                Add Participant
                            </button>

                            <div className={styles.participantTags}>
                                {invitedParticipants.map(participant => (
                                    <div key={participant.userid} className={styles.participantTag}>
                                        <div className={styles.usericon}><PersonIcon/></div>
                                        <span className={styles.participantusername}>{participant.username}</span>
                                        <button
                                            type="button"
                                            onClick={() => removeParticipant(participant.userid)}
                                            className={styles.removeParticipantButton}
                                        >
                                            &times;
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <div className={styles.modalActions}>
                                <button
                                    type="button"
                                    onClick={() => setPage(2)}
                                    className={styles.nextButton}
                                >
                                    Next
                                </button>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className={styles.cancelButton}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </>
                ) : (
                    <>
                        <h2>Additional Details</h2>
                        <form onSubmit={handleSubmit} className={styles.modalForm}>
                            <label>Start Date:</label>
                            <input
                                type="date"
                                value={startdate}
                                onChange={(e) => setStartdate(e.target.value)}
                                required
                            />

                            <label>End Date:</label>
                            <input
                                type="date"
                                value={enddate}
                                onChange={(e) => setEnddate(e.target.value)}
                                required
                            />

                            <label>Frequency (days):</label>
                            <input
                                type="number"
                                value={freq}
                                onChange={(e) => setFreq(Number(e.target.value))}
                                min="1"
                                required
                            />

                            <label>Estimated Time (hours):</label>
                            <input
                                type="number"
                                value={estimatedtime}
                                onChange={(e) => setEstimatedTime(Number(e.target.value))}
                                min="1"
                                required
                            />

                            <label>Publicity:</label>
                            <select
                                value={publicity}
                                onChange={(e) => setPublicity(e.target.value)}
                            >
                                <option value="friends only">Friends Only</option>
                                <option value="public invite only">Public Invite Only</option>
                                <option value="public">Public</option>
                            </select>

                            <div className={styles.modalActions}>
                                <button type="submit" className={styles.createButton}>
                                    Create
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPage(1)}
                                    className={styles.backButton}
                                >
                                    Back
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}