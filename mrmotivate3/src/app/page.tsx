"use client";
import { useState } from "react";
import styles from "../app/page.module.css";
import PersonIcon from "@mui/icons-material/Person";
import LockIcon from "@mui/icons-material/Lock";
import EmailIcon from "@mui/icons-material/Email";

export default function Auth() {
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const toggleLoginForm = () => {
    setShowLoginForm(!showLoginForm);
    setErrorMessage(""); // Clear error message when toggling
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage(""); // Clear previous errors
  
    try {
      const response = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });
  
      const data = await response.json();
      console.log("Login Response:", data); // Log the response data
  
      if (response.ok) {
        // Store user ID in local storage
        localStorage.setItem("userid", data.user.userid); // Use consistent key name
        console.log(data.user.userid)
  
        // Ensure the localStorage is set before navigation
        setTimeout(() => {
          window.location.href = "/home";
        }, 10000); // Small delay to ensure localStorage is set
      } else {
        setErrorMessage(data.error || "Login failed. Please try again.");
      }
    } catch (error) {
      setErrorMessage("An unexpected error occurred. Please try again.");
      console.error("Error:", error);
    }
  };

  const handleRegistration = async (e) => {
    e.preventDefault();
    setErrorMessage(""); // Clear previous errors

    try {
      const response = await fetch("http://localhost:5000/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();
      console.log("Registration Response:", data);

      if (response.ok) {
        window.location.href = "/home";
      } else {
        setErrorMessage(data.error || "Registration failed. Please try again.");
      }
    } catch (error) {
      setErrorMessage("An unexpected error occurred. Please try again.");
      console.error("Error:", error);
    }
  };

  return (
    <div className={styles.AuthMain}>
      <div className={styles.FormBoxContainer}>
        {showLoginForm ? (
          <div className={styles.FormBoxLogin}>
            <form onSubmit={handleLogin}>
              <h1 className={styles.LoginWord}>Login</h1>
              {errorMessage && <p className={styles.ErrorMessage}>{errorMessage}</p>}
              <div className={styles.AuthinputBox}>
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
                <PersonIcon className={styles.AuthIcons} />
              </div>
              <div className={styles.AuthinputBox}>
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <LockIcon className={styles.AuthIcons} />
              </div>
              <div className={styles.AuthRememberForget}>
                <label>
                  <input type="checkbox" />
                  Remember me
                </label>
                <a href="#" onClick={toggleLoginForm}>
                  Forget Password
                </a>
              </div>
              <button type="submit" className={styles.AuthLogin}>
                Login
              </button>
              <div className={styles.AuthRegisterLink}>
                <p>
                  Don't have an account{" "}
                  <a href="#" onClick={toggleLoginForm}>
                    Register
                  </a>
                </p>
              </div>
            </form>
          </div>
        ) : (
          <div className={styles.FormBoxRegister}>
            <form onSubmit={handleRegistration}>
              <h1 className={styles.LoginWord}>Registration</h1>
              {errorMessage && <p className={styles.ErrorMessage}>{errorMessage}</p>}
              <div className={styles.AuthinputBox}>
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
                <PersonIcon className={styles.AuthIcons} />
              </div>
              <div className={styles.AuthinputBox}>
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <EmailIcon className={styles.AuthIcons} />
              </div>
              <div className={styles.AuthinputBox}>
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <LockIcon className={styles.AuthIcons} />
              </div>
              <div className={styles.AuthRememberForget}>
                <label>
                  <input type="checkbox" />I agree to terms and conditions
                </label>
              </div>
              <button type="submit" className={styles.AuthLogin}>
                Register
              </button>
              <div className={styles.AuthRegisterLink}>
                <p>
                  Already have an account?{" "}
                  <a href="#" onClick={toggleLoginForm}>
                    Login
                  </a>
                </p>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
