"use client";
import styles from "../../app/page.module.css";
import Navbar from "../../components/Navbar";
import Infobar from "../../components/Infobar";
import ActivitiesSummary from "../../components/ActivitesSummary";
import TodoList from "../../components/TodoList";
import { useState, useEffect } from "react";

export default function Home() {
  const [userid, setUserid] = useState("");

  useEffect(() => {
    // Retrieve user ID from local storage
    const storedUserid = localStorage.getItem("userid"); // Use consistent key name
    if (storedUserid) {
      setUserid(storedUserid);
    }
  }, []);

  console.log("The user id is " + userid);

  return (
      <div className={styles.container}>
        <Navbar />
        <div className={styles.main}>
          <Infobar />
          <div className="welcome">Welcome {userid}</div>
          <ActivitiesSummary />
          <TodoList />
          {/* Badges */}
        </div>
      </div>
  );
}