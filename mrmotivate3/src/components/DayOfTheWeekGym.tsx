import styles from "../components/DayOfTheWeekGym.module.css";
import ActivityBox from "./ActivityBox";

const getThisWeekDate = () => {
    // Get today's date
    const today = new Date();

    // Calculate the start of the week (assuming Monday is the start of the week)
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1)); // Adjust for Sunday

    // Calculate the end of the week (assuming Sunday is the end of the week)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    // Format dates as YYYY-MM-DD strings
    const startDateStr = startOfWeek.toISOString().slice(0, 10);
    const endDateStr = endOfWeek.toISOString().slice(0, 10);

    return { start_date: startDateStr, end_date: endDateStr };
}

const getFormattedDate = (offset) => {
    const { start_date } = getThisWeekDate();
    const startDate = new Date(start_date);
    const formattedDate = new Date(startDate.setDate(startDate.getDate() + offset));
    return formattedDate.toISOString().slice(0, 10);
};

const activities = [
    { day: 'Monday', activity: 'Cardio', color: '#FFCCCC', date: getFormattedDate(1) },
    { day: 'Tuesday', activity: 'Back', color: '#FFE6CC', date: getFormattedDate(2) },
    { day: 'Wednesday', activity: 'Rest', color: '#FFFFCC', date: getFormattedDate(3) },
    { day: 'Thursday', activity: 'Chest', color: '#CCFFCC', date: getFormattedDate(4) },
    { day: 'Friday', activity: 'Legs', color: 'orange', date: getFormattedDate(5) },
    { day: 'Saturday', activity: 'Rest', color: '#FFFFCC', date: getFormattedDate(6) },
    { day: 'Sunday', activity: 'Rest', color: '#FFFFCC', date: getFormattedDate(7) },
];

export default function DayOfTheWeekGym() {
    const currentDate = getFormattedDate(0); // Get the current date

    return (
        <div className={styles.DayOfTheWeekGym}>
            <div className={styles.WeeklyActivityLine}>Weekly Activity</div>
            <div style={{ display: "flex",justifyContent: "space-around", flexWrap: "wrap" }}>
                {activities.map((act, index) => (
                    <ActivityBox
                        key={index}
                        day={act.day}
                        activity={act.activity}
                        color={act.color}
                        date={act.date}
                    />
                ))}
            </div>
        </div>
    );
}
