"use client"
import React, { useState, useEffect } from 'react';
import styles from "../components/TodoList.module.css";

export default function TodoList() {
  const [todos, setTodos] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [todoName, setTodoName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [priority, setPriority] = useState("");
  const [estimatedTime, setEstimatedTime] = useState("");
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchTodos = async () => {
      const userId = localStorage.getItem('userid');
      if (userId) {
        try {
          const link = `http://localhost:5000/todos/` + userId;
          const response = await fetch(link);
          const todosData = await response.json();
          setTodos(todosData);
        } catch (error) {
          console.error("Failed to fetch todos:", error);
        }
      }
    };

    fetchTodos();
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      const userId = localStorage.getItem('userid');
      if (userId) {
        try {
          const link = `http://localhost:5000/categories/${userId}`;
          const response = await fetch(link);
          const categoriesData = await response.json();
          // Filter out categories ending with "(TEAM CHALLENGE)"
          const filteredCategories = categoriesData.filter(category => 
            !category.categoryname.endsWith("(TEAM CHALLENGE)")
          );
          setCategories(filteredCategories);
        } catch (error) {
          console.error("Failed to fetch categories:", error);
        }
      }
    };

    fetchCategories();
  }, []);

  const handleAddTodoClick = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleAddTodoSubmit = async () => {
    const userId = localStorage.getItem('userid');
    try {
      const response = await fetch('http://localhost:5000/todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userid: userId,
          todoname: todoName,
          categoryid: categoryId,
          priority,
          estimatedtime: estimatedTime,
        }),
      });
      if (response.ok) {
        const newTodo = await response.json();
        setTodos([...todos, newTodo]);
        setShowModal(false);
      } else {
        console.error("Failed to add todo");
      }
    } catch (error) {
      console.error('Failed to add todo:', error);
    }
  };

  const handleCompleteTodo = async (todoId) => {
    try {
      const response = await fetch(`http://localhost:5000/todos/${todoId}/complete`, {
        method: 'PATCH',
      });
      if (response.ok) {
        setTodos(todos.map(todo =>
          todo.todoid === todoId ? { ...todo, completed: true } : todo
        ));
      } else {
        console.error("Failed to complete todo");
      }
    } catch (error) {
      console.error('Failed to complete todo:', error);
    }
  };

  const completedCount = todos.filter(todo => todo.completed).length;
  const remainingCount = todos.length - completedCount;

  return (
    <div className={styles.TodoList}>
      <div className={styles.LetsGetGoing}>
        Let's Get Going - {completedCount} completed, {remainingCount} remaining
      </div>
      <div className={styles.AddTodoLine} onClick={handleAddTodoClick}>
        Add todo
      </div>
      <ul className={styles.TodoItems}>
        {todos.map(todo => (
          <li key={todo.todoid} className={todo.completed ? styles.completed : ''}>
            {todo.todoname}
            {!todo.completed && (
              <span className={styles.Icon} onClick={() => handleCompleteTodo(todo.todoid)}>
                &#10003;
              </span>
            )}
          </li>
        ))}
      </ul>
      {showModal && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalForm}>
            <h2>Add New Todo</h2>
            <label className={styles.modalFormLabel}>Todo Name</label>
            <input
              className={styles.modalFormInput}
              type="text"
              value={todoName}
              onChange={(e) => setTodoName(e.target.value)}
            />
            <label className={styles.modalFormLabel}>Category</label>
            <select
              className={styles.modalFormSelect}
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">Select a category</option>
              {categories.map(category => (
                <option key={category.categoryid} value={category.categoryid}>
                  {category.categoryname}
                </option>
              ))}
            </select>
            <label className={styles.modalFormLabel}>Priority</label>
            <input
              className={styles.modalFormInput}
              type="text"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            />
            <label className={styles.modalFormLabel}>Estimated Time</label>
            <input
              className={styles.modalFormInput}
              type="text"
              value={estimatedTime}
              onChange={(e) => setEstimatedTime(e.target.value)}
            />
            <button className={styles.modalFormButton} onClick={handleAddTodoSubmit}>
              Add Todo
            </button>
            <button className={styles.modalFormButton} onClick={handleCloseModal}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}