"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "../components/TodayWorkout.module.css";
import DirectionsRunIcon from "@mui/icons-material/DirectionsRun";
import Select from 'react-select';

export default function TodaysWorkout() {
  const [currentUrl, setCurrentUrl] = useState("");
  const [totalCaloriesBurnt, setTotalCaloriesBurnt] = useState(0);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [muscles, setMuscles] = useState([
    { value: 'deltoids', label: 'Deltoids (shoulders)' },
    { value: 'trapezius', label: 'Trapezius (upper back)' },
    { value: 'pectorals', label: 'Pectorals (chest)' },
    { value: 'biceps', label: 'Biceps (front of arms)' },
    { value: 'triceps', label: 'Triceps (back of arms)' },
    { value: 'latissimus-dorsi', label: 'Latissimus Dorsi (middle back)' },
    { value: 'rhomboids', label: 'Rhomboids (upper back)' },
    { value: 'serratus-anterior', label: 'Serratus Anterior (side of chest)' },
    { value: 'erector-spinae', label: 'Erector Spinae (lower back)' },
    { value: 'rectus-abdominis', label: 'Rectus Abdominis (abs)' },
    { value: 'obliques', label: 'Obliques (sides of abdomen)' },
    { value: 'transverse-abdominis', label: 'Transverse Abdominis (deep core)' },
    { value: 'lower-back-muscles', label: 'Lower Back Muscles (lower back, including the lumbar region)' },
    { value: 'quadriceps', label: 'Quadriceps (front of thighs)' },
    { value: 'hamstrings', label: 'Hamstrings (back of thighs)' },
    { value: 'gluteus-maximus', label: 'Gluteus Maximus (buttocks)' },
    { value: 'gluteus-medius', label: 'Gluteus Medius (side of buttocks)' },
    { value: 'adductors', label: 'Adductors (inner thighs)' },
    { value: 'abductors', label: 'Abductors (outer thighs)' },
    { value: 'gastrocnemius', label: 'Gastrocnemius (calves)' },
    { value: 'soleus', label: 'Soleus (calves)' }
  ]);
  const [selectedMuscles, setSelectedMuscles] = useState([]);
  const [exerciseName, setExerciseName] = useState("");
  const [reps, setReps] = useState("");
  const [sets, setSets] = useState("");
  const [estimatedTime, setEstimatedTime] = useState("");
  const [priority, setPriority] = useState("");
  const [caloriesBurned, setCaloriesBurned] = useState("");

  useEffect(() => {
    setCurrentUrl(window.location.pathname);
    const userId = localStorage.getItem("userid");

    if (userId) {
      fetch(`http://localhost:5000/excercises/${userId}`)
        .then(response => {
          if (!response.ok) {
            throw new Error("Network response was not ok");
          }
          return response.json();
        })
        .then(data => {
          const formattedExercises = data.map(exercise => ({
            id: exercise.exercisid,
            exercise: exercise.exercise_name,
            muscles: exercise.muscles,
            reps: exercise.reps,
            sets: exercise.sets,
            time: exercise.estimatedtime,
            CaloriesBurnt: exercise.calories_burned,
            clicked: exercise.completed
          }));
          setExercises(formattedExercises);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setError("Failed to fetch exercises");
          setLoading(false);
        });
    } else {
      setError("User ID not found in local storage");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const totalCalories = exercises.reduce((total, exercise) => total + (exercise.clicked ? exercise.CaloriesBurnt : 0), 0);
    setTotalCaloriesBurnt(totalCalories);
  }, [exercises]);

  const handleButtonClick = async (id) => {
    console.log("Button clicked for exercise ID:", id); // Debugging log

    const exercise = exercises.find(ex => ex.id === id);
    if (!exercise) {
      console.error("Exercise not found for ID:", id);
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/complete-exercise", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userid: localStorage.getItem("userid"),
          exercisid: id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update exercise");
      }

      setExercises(prevExercises =>
        prevExercises.map(ex =>
          ex.id === id ? { ...ex, clicked: !ex.clicked } : ex
        )
      );
      console.log("Exercise updated successfully");
    } catch (err) {
      console.error("Error updating exercise:", err);
      setError("Failed to mark exercise as completed");
    }
  };

  const handleAddExerciseClick = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleAddExerciseSubmit = async () => {
    const userId = localStorage.getItem("userid");
    
    console.log("Selected Muscles:", selectedMuscles); // Debugging log

    try {
      const response = await fetch('http://localhost:5000/excercises', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userid: userId,
          exercise_name: exerciseName,
          muscles: selectedMuscles.map(muscle => muscle.value), // Ensure this is an array of values
          reps: parseInt(reps),
          sets: parseInt(sets),
          estimatedtime: parseInt(estimatedTime),
          priority: parseInt(priority),
          calories_burned: parseInt(caloriesBurned),
        }),
      });

      if (response.ok) {
        const newExercise = await response.json();
        setExercises([...exercises, newExercise]);
        setShowModal(false);
        console.log("New exercise added:", newExercise); // Debugging log
      } else {
        console.error("Failed to add exercise");
      }
    } catch (error) {
      console.error('Failed to add exercise:', error);
    }
  };

  const editWorkoutUrl = `${currentUrl}/editworkout`;

  return (
    <div className={styles.TodaysWorkout}>
      <div className={styles.MainLine}>Today's Workout</div>
      <div className={styles.Content}>
        <div className={styles.TodaysWorkoutLeft}>
          <div className={styles.Icon}>
            <DirectionsRunIcon style={{ fontSize: "120px", color: "white" }} />
          </div>
          <h2 className={styles.CaloriesNum}>{totalCaloriesBurnt}</h2>
          <h3 className={styles.CaloriesText}>Calories burnt</h3>
          <div className={styles.AddExerciseButton} onClick={handleAddExerciseClick}>
            Add Exercise
          </div>
        </div>
        <div className={styles.TodaysWorkoutRight}>
          {exercises.map((exercise) => (
            <div className={styles.Exercise} key={exercise.id}>
              <div className={styles.ExerciseLeft}>
                <h3 style={{ color: "#2a9d8f" }}>{exercise.exercise}</h3>
                <p>
                  {exercise.muscles.map((muscle, index) => (
                    <span key={index}>
                      {muscle}
                      {index !== exercise.muscles.length - 1 && " "}
                    </span>
                  ))}
                </p>
              </div>
              <div className={styles.ExerciseRight}>
                <div className={styles.Line1}>
                  <p style={{ marginRight: 15 }}>{exercise.reps}</p>
                  <p style={{ color: "#2a9d8f", fontWeight: "bold" }}>X</p>
                  <p style={{ color: "#2a9d8f", fontWeight: "bold" }}>{exercise.sets}</p>
                </div>
                <div className={styles.Line2}>
                  <p>{exercise.time} minutes workout</p>
                </div>
                <div
                  className={exercise.clicked ? styles.ButtonClicked : styles.Button}
                  onClick={() => handleButtonClick(exercise.id)}
                >
                  {exercise.clicked ? "Done" : "Click when done"}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {showModal && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalForm}>
            <h2>Add New Exercise</h2>
            <label className={styles.modalFormLabel}>Exercise Name:</label>
            <input
              type="text"
              value={exerciseName}
              onChange={(e) => setExerciseName(e.target.value)}
              className={styles.modalFormInput}
            />
            <label className={styles.modalFormLabel}>Muscles:</label>
            <Select
              isMulti
              options={muscles}
              value={selectedMuscles}
              onChange={(selected) => {
                console.log("Updated Selected Muscles:", selected); // Debugging log
                setSelectedMuscles(selected);
              }}
              className={styles.modalFormSelect}
            />
            <label className={styles.modalFormLabel}>Reps:</label>
            <input
              type="number"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              className={styles.modalFormInput}
            />
            <label className={styles.modalFormLabel}>Sets:</label>
            <input
              type="number"
              value={sets}
              onChange={(e) => setSets(e.target.value)}
              className={styles.modalFormInput}
            />
            <label className={styles.modalFormLabel}>Estimated Time (minutes):</label>
            <input
              type="number"
              value={estimatedTime}
              onChange={(e) => setEstimatedTime(e.target.value)}
              className={styles.modalFormInput}
            />
            <label className={styles.modalFormLabel}>Priority:</label>
            <input
              type="number"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className={styles.modalFormInput}
            />
            <label className={styles.modalFormLabel}>Calories Burned:</label>
            <input
              type="number"
              value={caloriesBurned}
              onChange={(e) => setCaloriesBurned(e.target.value)}
              className={styles.modalFormInput}
            />
            <button onClick={handleAddExerciseSubmit} className={styles.modalFormSubmit}>
              Add Exercise
            </button>
            <button onClick={handleCloseModal} className={styles.modalFormCancel}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
