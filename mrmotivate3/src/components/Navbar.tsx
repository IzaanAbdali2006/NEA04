// Sidebar.js
"use client"; // Ensure this component is treated as a Client Component
import Image from "next/image";
import styles from "../components/Navbar.module.css";
import HomeIcon from "@mui/icons-material/Home";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import BookIcon from "@mui/icons-material/Book";
import YouTubeIcon from "@mui/icons-material/YouTube";
import ExitToAppIcon from "@mui/icons-material/ExitToApp"; // Import logout icon
import GroupsIcon from '@mui/icons-material/Groups';
import logo from "../images/logo.png";

export default function Navbar() {
  const id = 123;
  const homeUrl = `${id}`;

  const handleLogout = () => {
    localStorage.clear(); // Clear all data from local storage
    window.location.href = 'http://localhost:3000/'; // Redirect to home page
  };

  return (
    <div>
      <div className={styles.sidebar}>
        <div className={styles.sidebar_list}>
          <div className={styles.OneNavComp}>
            <Image
              src={logo}
              alt="Description of image"
              width={100}
              height={100}
            />
          </div>
          <div className={styles.OneNavComp}>
            <HomeIcon style={{ fontSize: "30px", color: "#2A9D8F" }} />
            <a
              href={`/home`}
              style={{
                textDecoration: "none",
                color: "black",
                fontSize: "16px",
              }}
            >
              Home
            </a>
          </div>
          <div className={styles.OneNavComp}>
            <FitnessCenterIcon
              style={{ fontSize: "30px", color: "#2A9D8F" }}
            />
            <a
              href={`/mygym`}
              style={{
                textDecoration: "none",
                color: "black",
                fontSize: "16px",
              }}
            >
              My Gym
            </a>
          </div>
          <div className={styles.OneNavComp}>
            <BookIcon style={{ fontSize: "30px", color: "#2A9D8F" }} />
            <a
              href={`/myjournal`}
              style={{
                textDecoration: "none",
                color: "black",
                fontSize: "16px",
              }}
            >
              My Journal
            </a>
          </div>
          <div className={styles.OneNavComp}>
            <YouTubeIcon style={{ fontSize: "30px", color: "#2A9D8F" }} />
            <a
              href={`/myknowledge`}
              style={{
                textDecoration: "none",
                color: "black",
                fontSize: "16px",
              }}
            >
              My Knowledge
            </a>
          </div>
          <div className={styles.OneNavComp}>
            <GroupsIcon style={{ fontSize: "30px", color: "#2A9D8F" }} />
            <a
              href={`/myknowledge`}
              style={{
                textDecoration: "none",
                color: "black",
                fontSize: "16px",
              }}
            >
              My friends
            </a>
          </div>
          <div className={styles.OneNavComp}>
            <ExitToAppIcon style={{ fontSize: "30px", color: "#2A9D8F" }} />
            <button
              onClick={handleLogout}
              style={{
                textDecoration: "none",
                color: "black",
                fontSize: "16px",
                background: "none",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

