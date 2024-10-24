"use client";
import { useState, useEffect } from 'react';
import styles from "../components/Infobar.module.css";
import Image from "next/image";
import clockicon from "../images/clockicon.png";
import levelicon from "../images/level.png";
import streakicon from "../images/streak.png";
import StarIcon from '@mui/icons-material/Star';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';

export default function Infobar() {
  const [userStats, setUserStats] = useState({
    hoursofselfimprovement: 0,
    monthlylevel: 0,
    streak: 0,
    taskssetthismonth: 0,
    taskscompletedthismonth: 0
  });

  const [profilePic, setProfilePic] = useState(null); // State for profile picture

  useEffect(() => {
    const fetchUserStats = async () => {
      const userId = localStorage.getItem('userid');
      if (userId) {
        try {
          const link = "http://localhost:5000/stats/" + userId;
          const response = await fetch(link);
          const stats = await response.json();
          if (stats.length > 0) {
            const stat = stats[0];
            setUserStats({
              hoursofselfimprovement: stat.hoursofselfimprovement || 0,
              monthlylevel: stat.monthlylevel || 0,
              streak: stat.streak || 0,
              taskssetthismonth: stat.taskssetthismonth || 0,
              taskscompletedthismonth: stat.taskscompletedthismonth || 0
            });
          }
        } catch (error) {
          console.error("Failed to fetch user stats:", error);
        }
      }
    };

    const fetchProfilePicture = async () => {
      const userId = localStorage.getItem('userid');
      if (userId) {
        try {
          const response = await fetch(`http://localhost:5000/getProfilePic/${userId}`);
          if (response.ok) {
            // Assuming the image is returned directly, create a URL for the image
            const imageUrl = URL.createObjectURL(await response.blob());
            setProfilePic(imageUrl);
          } else {
            console.error("Failed to fetch profile picture:", response.statusText);
          }
        } catch (error) {
          console.error("Error fetching profile picture:", error);
        }
      }
    };

    fetchUserStats();
    fetchProfilePicture(); // Fetch profile picture
  }, []);

  return (
    <div className={styles.Infobar}>
      <div className={styles.Infobar_left}>
        <div className={styles.OneInfo}>
          <Image src={clockicon} alt="Clock" height={30} width={30} />
          <div className={styles.OneInfotext}>
            <span className={styles.OneInfotextBold}>{userStats.hoursofselfimprovement}</span>
            <span className={styles.OneInfotextNormal}>Hours of self improvement work</span>
          </div>
        </div>
        {/* second info */}
        <div className={styles.OneInfo}>
          <Image src={levelicon} alt="Level" height={30} width={30} />
          <div className={styles.OneInfotext}>
            <span className={styles.OneInfotextNormal}> Monthly Level</span>
            <span className={styles.OneInfotextBold2}>{userStats.monthlylevel}/12</span>
          </div>
        </div>
        {/* third info */}
        <div className={styles.OneInfo}>
          <Image src={streakicon} alt="Streak" height={30} width={30} />
          <div className={styles.OneInfotext}>
            <span className={styles.OneInfotextBold}>{userStats.streak}</span>
            <span className={styles.OneInfotextNormal}>days of consistent work</span>
          </div>
        </div>
      </div>
      <div className={styles.Infobar_right}>
        <StarIcon style={{ fontSize: "30px", color: "#2A9D8F", marginRight: 10 }} />
        <CalendarMonthIcon style={{ fontSize: "30px", color: "#2A9D8F", marginRight: 10 }} />
        <NotificationsActiveIcon style={{ fontSize: "30px", color: "#2A9D8F", marginRight: 10 }} />
        <div className={styles.ProfilePicContainer}>
          {profilePic ? (
            <Image
              src={profilePic}
              alt="Profile pic"
              width={30}
              height={30}
              className={styles.profilePic}
            />
          ) : (
            <Image
              src="/path/to/default/profile_pic.jpg" // Fallback image
              alt="Default Profile pic"
              width={30}
              height={30}
              className={styles.profilePic}
            />
          )}
        </div>
      </div>
    </div>
  );
}

