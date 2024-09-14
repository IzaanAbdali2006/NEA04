"use client";
import React, { useState, useEffect } from "react";
import styles from "../components/ActivitiesSummary.module.css";
import { Doughnut } from "react-chartjs-2";
import { Chart, ArcElement } from "chart.js";
Chart.register(ArcElement);

const ActivitiesSummary = () => {
  const [userStats, setUserStats] = useState({
    hoursofselfimprovement: 0,
    monthlylevel: 0,
    streak: 0,
    taskssetthismonth: 0,
    taskscompletedthismonth: 0
  });

  const [categories, setCategories] = useState([]);
  const [userId, setUserId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  useEffect(() => {
    const fetchUserStats = async () => {
      const userId = localStorage.getItem('userid');
      setUserId(userId);
      if (userId) {
        try {
          const link = `http://localhost:5000/stats/${userId}`;
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
        try {
          const categoriesLink = `http://localhost:5000/categories/${userId}`;
          const categoriesResponse = await fetch(categoriesLink);
          const categoriesData = await categoriesResponse.json();
          setCategories(categoriesData);
        } catch (error) {
          console.error("Failed to fetch categories:", error);
        }
      }
    };

    fetchUserStats();
  }, []);

  const handleAddCategory = async () => {
    if (newCategoryName.trim() === "" || !userId) {
      return;
    }
    try {
      const response = await fetch("http://localhost:5000/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ userid: userId, categoryname: newCategoryName })
      });
      const newCategory = await response.json();
      setCategories([...categories, newCategory]);
      setNewCategoryName("");
      setModalOpen(false);
    } catch (error) {
      console.error("Failed to add category:", error);
    }
  };

  const tasksCompletionPercentage = userStats.taskssetthismonth 
    ? Math.round((userStats.taskscompletedthismonth / userStats.taskssetthismonth) * 100) 
    : 0;

  const chartData = {
    labels: ["Completed Tasks", "Remaining Tasks"],
    datasets: [
      {
        label: "Tasks Completion",
        data: [
          userStats.taskscompletedthismonth,
          userStats.taskssetthismonth - userStats.taskscompletedthismonth,
        ],
        backgroundColor: ["#2A9D8F", "#E76F51"],
        borderWidth: 10,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
  };

  return (
    <div className={styles.ActivitiesSummary}>
      <div className={styles.ActivitiesSummaryLeft}>
        <div className={styles.MainLine}>My Activities summary</div>
        <div className={styles.ChartContainer} style={{ width: "300px", height: "300px" }}>
          <Doughnut data={chartData} options={chartOptions} />
          <div className={styles.text}>
            <div className={styles.text1}>{tasksCompletionPercentage}%</div>
            <div className={styles.text2}>of tasks</div>
            <div className={styles.text2}>completed</div>
            <div className={styles.text2}>Well done!</div>
          </div>
        </div>
      </div>
      <div className={styles.ActivitiesSummaryRight}>
        <button className={styles.openModalBtn} onClick={() => setModalOpen(true)}>Add Category</button>

        {/* Modal Structure */}
        {modalOpen && (
          <div className={styles.modal}>
            <div className={styles.modalContent}>
              <span className={styles.closeBtn} onClick={() => setModalOpen(false)}>&times;</span>
              <h2>Add New Category</h2>
              <form className={styles.modalForm} onSubmit={(e) => { e.preventDefault(); handleAddCategory(); }}>
                <label className={styles.modalFormLabel} htmlFor="categoryName">Category Name</label>
                <input
                  className={styles.modalFormInput}
                  type="text"
                  id="categoryName"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  required
                />
                <button className={styles.modalFormButton} type="submit">Add Category</button>
              </form>
            </div>
          </div>
        )}

        <table className={styles.Table}>
          <thead>
            <tr>
              <th>Habits</th>
              <th>Progress</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.categoryid}>
                <td>{category.categoryname}</td>
                <td>
                  <div className={styles.ProgressBar}>
                    <div
                      className={`${styles.ProgressBarInner} ${category.categorytaskcompleted === 0 ? styles.ProgressBarZero : ''}`}
                      style={{ width: `${Math.round((category.categorytaskcompleted / category.categorytaskset) * 100)}%` }}
                    ></div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ActivitiesSummary;