import styles from "../page.module.css"
import Navbar from "../../components/Navbar"
import Infobar from "@/components/Infobar";
import DayOfTheWeekGym from "@/components/DayOfTheWeekGym";
import TodaysWorkout from "@/components/TodaysWorkout";
export default function mygym() {
  return (
    <div className={styles.container}>
      <Navbar />
      <div className={styles.main}>
        <Infobar />
        <DayOfTheWeekGym/>
        <TodaysWorkout/>
      </div>
    </div>
  );
  }