const express = require("express");
const app = express();
const cors = require("cors");
const pool = require("./db");

// Middleware
app.use(cors());
app.use(express.json());


// functions
const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};



// Routes

// Login route
app.post("/login", async (req, res) => {
  try {
    // Destructure username and password from the request body
    const { username, password } = req.body;

    // Check if any required field is missing
    if (!username || !password) {
      return res
        .status(400)
        .json({ error: "Please provide username and password" });
    }

    // Query the database for the user with the provided username
    const userQuery = await pool.query(
      "SELECT * FROM users WHERE username = $1",
      [username]
    );

    // Check if a user with the provided username exists
    if (userQuery.rows.length === 0) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const user = userQuery.rows[0];

    // Check if the provided password matches the stored password
    if (user.password !== password) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    // If username and password match, return the user details
    res.json({ message: "Login successful", user });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});
// Create a new user
app.post("/users", async (req, res) => {
  try {
    // Destructure email, username, and password from the request body
    const { email, username, password } = req.body;

    // Check if any required field is missing
    if (!email || !username || !password) {
      return res
        .status(400)
        .json({ error: "Please provide email, username, and password" });
    }

    // Insert the new user into the database
    const newUser = await pool.query(
      "INSERT INTO users (email, username, password) VALUES ($1, $2, $3) RETURNING *",
      [email, username, password]
    );

    const userId = newUser.rows[0].userid;

    // Insert initial row into the friends table for the new user
    const insertFriendsQuery = `
      INSERT INTO friends (userid, friendrequestsentto, friendrequestreceived, friends)
      VALUES ($1, ARRAY[]::integer[], ARRAY[]::integer[], ARRAY[]::integer[])
    `;
    await pool.query(insertFriendsQuery, [userId]);

    // Get the current date and set it to the first day of the current month
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

    // Insert initial stats for the first day of the current month
    const statsQuery = `
      INSERT INTO Stats (userid, month, hoursofselfimprovement, monthlylevel, streak, taskssetthismonth, taskscompletedthismonth)
      VALUES ($1, $2, 0, 0, 0, 0, 0)
    `;

    await pool.query(statsQuery, [userId, firstDayOfMonth]);

    // Respond with the newly created user
    res.json(newUser.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// Get all users
app.get("/users", async (req, res) => {
  try {
    const allUsers = await pool.query("SELECT * FROM users");
    res.json(allUsers.rows);
  } catch (err) {
    console.error(err.message);
    console.log("well done");
  }
});

// Get a user
app.get("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const users = await pool.query("SELECT * FROM users WHERE userid = $1", [
      id,
    ]);
    res.json(users.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// Get user stats
app.get("/stats/:id", async (req, res) => {
  try {
    const currentMonth = new Date().toISOString().split("T")[0].substring(0, 7);
    const userId = req.params.id;
    const query = `
      SELECT u.username, s.*
      FROM Stats s
      JOIN Users u ON s.userid = u.userid
      WHERE s.userid = $1
        AND EXTRACT(YEAR FROM TO_DATE("month", 'YYYY-MM')::timestamp) = EXTRACT(YEAR FROM TO_DATE($2, 'YYYY-MM')::timestamp)
        AND EXTRACT(MONTH FROM TO_DATE("month", 'YYYY-MM')::timestamp) = EXTRACT(MONTH FROM TO_DATE($2, 'YYYY-MM')::timestamp);
    `;
    const { rows } = await pool.query(query, [userId, currentMonth]);
    res.json(rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// Update user stats
app.put("/stats/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    const {
      month,
      hoursofselfimprovement,
      monthlylevel,
      streak,
      taskssetthismonth,
      taskscompletedthismonth,
    } = req.body;

    // Check if the stats for the given userId and month exist
    const checkQuery = `
      SELECT * FROM Stats WHERE userid = $1 AND month = $2
    `;
    const checkResult = await pool.query(checkQuery, [userId, month]);

    if (checkResult.rowCount > 0) {
      // If stats exist, update the record
      const updateQuery = `
        UPDATE Stats
        SET 
          hoursofselfimprovement = $3,
          monthlylevel = $4,
          streak = $5,
          taskssetthismonth = $6,
          taskscompletedthismonth = $7
        WHERE 
          userid = $1 AND 
          month = $2
      `;
      await pool.query(updateQuery, [
        userId,
        month,
        hoursofselfimprovement,
        monthlylevel,
        streak,
        taskssetthismonth,
        taskscompletedthismonth,
      ]);

      return res.json({ message: "Stats updated successfully" });
    } else {
      // If stats for the month do not exist, insert a new record
      const insertQuery = `
        INSERT INTO Stats (userid, month, hoursofselfimprovement, monthlylevel, streak, taskssetthismonth, taskscompletedthismonth)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `;
      await pool.query(insertQuery, [
        userId,
        month,
        hoursofselfimprovement,
        monthlylevel,
        streak,
        taskssetthismonth,
        taskscompletedthismonth,
      ]);

      return res.json({ message: "Stats created successfully" });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server has started on port ${PORT}`);
});

// Categories
// Create a new category
app.post("/categories", async (req, res) => {
  try {
    const { userid, categoryname,} =
      req.body;

    // Insert the new category into the database
    const newCategory = await pool.query(
      "INSERT INTO categories (userid, categoryname, categorytaskcompleted, categorytaskset,teamid) VALUES ($1, $2, 0, 0,-1) RETURNING *",
      [userid, categoryname]
    );

    // Respond with the newly created category
    res.json(newCategory.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// Get all categories for a user
app.get("/categories/:userid", async (req, res) => {
  try {
    const { userid } = req.params;
    const categories = await pool.query(
      "SELECT * FROM categories WHERE userid = $1",
      [userid]
    );
    res.json(categories.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// Update a category
app.put("/categories/:id", async (req, res) => {
  try {
    const categoryId = req.params.id;
    const { categoryname, categorytaskcompleted, categorytaskset } = req.body;

    const query = `
            UPDATE categories
            SET 
                categoryname = $1,
                categorytaskcompleted = $2,
                categorytaskset = $3
            WHERE 
                categoryid = $4
            RETURNING *;
        `;

    const updatedCategory = await pool.query(query, [
      categoryname,
      categorytaskcompleted,
      categorytaskset,
      categoryId,
    ]);

    if (updatedCategory.rowCount === 0) {
      return res
        .status(404)
        .json({ error: "Category not found or no update performed" });
    }

    res.json(updatedCategory.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// Delete a category
app.delete("/categories/:id", async (req, res) => {
  try {
    const categoryId = req.params.id;

    const deleteCategory = await pool.query(
      "DELETE FROM categories WHERE categoryid = $1 RETURNING *",
      [categoryId]
    );

    if (deleteCategory.rowCount === 0) {
      return res.status(404).json({ error: "Category not found" });
    }

    res.json({
      message: "Category deleted successfully",
      category: deleteCategory.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// Todos

// Get all todos from a user
app.get("/todos/:userid", async (req, res) => {
  try {
    const { userid } = req.params;
    const todosQuery = `
      SELECT * 
      FROM todos 
      WHERE userid = $1 
        AND CURRENT_DATE < deadlinedate
        OR CURRENT_DATE > date
    `;
    const todos = await pool.query(todosQuery, [userid]);
    res.json(todos.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});
// Create a new todo
app.post("/todos", async (req, res) => {
  const { userid, todoname, categoryid, priority, estimatedtime, deadlinedate } = req.body;

  try {
    // Start a transaction
    await pool.query('BEGIN');

    // Validate that the deadline date is not before the current date
    const currentDate = new Date().toISOString().split('T')[0]; // Get current date in YYYY-MM-DD format
    if (deadlinedate < currentDate) {
      return res.status(400).json({ error: "Deadline date cannot be before the current date" });
    }

    // Insert the new todo
    const insertTodoQuery = `
      INSERT INTO todos (userid, todoname, categoryid, priority, estimatedtime, completed, date, deadlinedate)
      VALUES ($1, $2, $3, $4, $5, false, CURRENT_DATE, $6)
      RETURNING *;
    `;
    const newTodoResult = await pool.query(insertTodoQuery, [userid, todoname, categoryid, priority, estimatedtime, deadlinedate]);
    
    // Increment the categorytaskset
    const updateCategoryQuery = `
      UPDATE categories
      SET categorytaskset = categorytaskset + 1
      WHERE categoryid = $1;
    `;
    await pool.query(updateCategoryQuery, [categoryid]);

    // Get the first day of the current month (in YYYY-MM-DD format)
    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

    // Check if a stats record for the current month exists
    const checkStatsQuery = `
      SELECT * FROM stats WHERE userid = $1 AND month = $2;
    `;
    const checkStatsResult = await pool.query(checkStatsQuery, [userid, firstDayOfMonth]);

    if (checkStatsResult.rowCount > 0) {
      // If a record exists, update the taskssetthismonth field
      const updateStatsQuery = `
        UPDATE stats
        SET taskssetthismonth = taskssetthismonth + 1
        WHERE userid = $1 AND month = $2;
      `;
      await pool.query(updateStatsQuery, [userid, firstDayOfMonth]);
    } else {
      // If no record exists, insert a new record for the current month
      const insertStatsQuery = `
        INSERT INTO stats (userid, month, hoursofselfimprovement, monthlylevel, streak, taskssetthismonth, taskscompletedthismonth)
        VALUES ($1, $2, 0, 0, 0, 1, 0);
      `;
      await pool.query(insertStatsQuery, [userid, firstDayOfMonth]);
    }

    // Commit the transaction
    await pool.query('COMMIT');

    // Return the newly created todo
    res.status(201).json(newTodoResult.rows[0]);
  } catch (err) {
    // Rollback in case of error
    await pool.query('ROLLBACK');
    console.error('Error inserting todo:', err.message);
    res.status(500).json({ error: "Server error" });
  }
});
// Update a todo
app.put("/todos/:id", async (req, res) => {
  try {
    const todoId = req.params.id;
    const { userid, todoname, categoryid, priority, estimatedtime, completed } =
      req.body;

    const query = `
            UPDATE todos
            SET 
                userid = $1,
                todoname = $2,
                categoryid = $3,
                priority = $4,
                estimatedtime = $5,
                completed = $6
            WHERE 
                todoid = $7
            RETURNING *;
        `;

    const updatedTodo = await pool.query(query, [
     userid,
      todoname,
      categoryid,
      priority,
      estimatedtime,
      completed,
      todoId,
    ]);

    if (updatedTodo.rowCount === 0) {
      return res
        .status(404)
        .json({ error: "Todo not found or no update performed" });
    }

    res.json(updatedTodo.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});
app.patch('/todos/:id/complete', async (req, res) => {
  const todoId = parseInt(req.params.id);
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Update the task to completed
    await client.query(
      'UPDATE todos SET completed = true WHERE todoid = $1',
      [todoId]
    );

    // Get the relevant task details, including the category ID, user ID, and estimated time
    const { rows: [task] } = await client.query(
      `SELECT categoryid, userid, estimatedtime, todoname 
       FROM todos 
       WHERE todoid = $1`,
      [todoId]
    );

    // Check if task exists and if todoname is defined
    if (!task || !task.todoname) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Task not found or todoname is undefined' });
    }

    const categoryId = task.categoryid;
    const userId = task.userid;
    const estimatedTime = task.estimatedtime;
    const todoName = task.todoname;

    // Regular updates
    await client.query(
      'UPDATE categories SET categorytaskcompleted = categorytaskcompleted + 1 WHERE categoryid = $1',
      [categoryId]
    );

    // Get the current month in YYYY-MM format
    const currentMonth = new Date().toISOString().slice(0, 7);

    // Check if stats for the current month exist
    const { rowCount: statsExist } = await client.query(
      'SELECT 1 FROM stats WHERE userid = $1 AND TO_CHAR(month, \'YYYY-MM\') = $2',
      [userId, currentMonth]
    );

    if (statsExist) {
      // If stats for the current month exist, update them
      await client.query(
        'UPDATE stats SET taskscompletedthismonth = taskscompletedthismonth + 1 WHERE userid = $1 AND TO_CHAR(month, \'YYYY-MM\') = $2',
        [userId, currentMonth]
      );
      await client.query(
        'UPDATE stats SET hoursofselfimprovement = hoursofselfimprovement + $1 WHERE userid = $2 AND TO_CHAR(month, \'YYYY-MM\') = $3',
        [estimatedTime, userId, currentMonth]
      );
    } else {
      // If no stats for the current month exist, insert a new record
      await client.query(
        `INSERT INTO stats (userid, month, hoursofselfimprovement, monthlylevel, streak, taskssetthismonth, taskscompletedthismonth)
         VALUES ($1, $2, $3, 0, 0, 1, 1)`,  // taskssetthismonth and taskscompletedthismonth are set to 1
        [userId, currentMonth, estimatedTime]
      );
    }

    // Additional logic for TEAM CHALLENGE
    if (todoName.endsWith('(TEAM CHALLENGE)')) {
      // Get the challenge details
      const { rows: [challenge] } = await client.query(
        `SELECT challengename, participants, success, fail, startdate 
         FROM challenges 
         WHERE challengename LIKE $1`,
        [`%${todoName.split(' (TEAM CHALLENGE)')[0]}%`]
      );

      if (challenge) {
        const participants = challenge.participants;
        const startDate = new Date(challenge.startdate);
        const success = challenge.success;
        const fail = challenge.fail;

        const userIndex = participants.indexOf(userId);
        if (userIndex !== -1) {
          // Update success for the user
          success[userIndex] += 1;

          // Calculate the number of days since the start of the challenge
          const currentDate = new Date();
          const daysElapsed = Math.floor((currentDate - startDate) / (1000 * 60 * 60 * 24));

          // Update the fail counts for all participants
          for (let i = 0; i < participants.length; i++) {
            fail[i] = Math.max(daysElapsed - success[i], 0);
          }

          // Update the challenge in the database
          await client.query(
            `UPDATE challenges 
             SET success = $1, fail = $2 
             WHERE challengename = $3`,
            [success, fail, challenge.challengename]
          );
        }
      }
    }

    await client.query('COMMIT');
    res.status(200).json({ message: 'Task marked as completed' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});
// Delete a todo
app.delete("/todos/:id", async (req, res) => {
  try {
    const todoId = req.params.id;

    // Execute the DELETE query
    const deleteTodo = await pool.query(
      "DELETE FROM todos WHERE todoid = $1 RETURNING *",
      [todoId]
    );

    // Check if any rows were deleted
    if (deleteTodo.rowCount === 0) {
      return res.status(404).json({ error: "Todo not found" });
    }

    // Send a response indicating successful deletion
    res.json({
      message: "Todo deleted successfully",
      todo: deleteTodo.rows[0],
    });
  } catch (err) {
    // Log the error and send a server error response
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// my gym

// get weekly workout for user
app.get("/weekly_workout/:userid", async (req, res) => {
  try {
    const { userid } = req.params;
    const todos = await pool.query(
      "SELECT * FROM weekly_workout WHERE userid = $1",
      [userid]
    );
    res.json(todos.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});
// update it
// Update a weekly workout
app.put("/weekly_workout/:id", async (req, res) => {
  try {
    const workoutid = req.params.id;
    const { Mon, Tue, Wed, Thur, Fri, Sat, Sun } = req.body;

    const query = `
            UPDATE weekly_workout
            SET 
                Mon = $1,
                Tue = $2,
                Wed = $3,
                Thur = $4,
                Fri = $5,
                Sat = $6,
                Sun = $7
            WHERE 
                workoutid = $8
            RETURNING *;
        `;

    const values = [Mon, Tue, Wed, Thur, Fri, Sat, Sun, workoutid];

    const updatedWorkout = await pool.query(query, values);

    if (updatedWorkout.rowCount === 0) {
      return res
        .status(404)
        .json({ error: "Weekly workout not found or no update performed" });
    }

    res.json(updatedWorkout.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// excericses

// get all  of todays excericses for the user
// Route to get all exercises for a user on today's date
app.get("/excercises/:userid", async (req, res) => {
  try {
    const userId = parseInt(req.params.userid, 10); // Get user ID from URL parameter
    const todayDate = new Date().toISOString().split("T")[0]; // Get today's date in YYYY-MM-DD format

    const query = `
            SELECT * 
            FROM todays_workouts 
            WHERE userid = $1 
              AND Date = $2;
        `;

    const { rows } = await pool.query(query, [userId, todayDate]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "No exercises found for today" });
    }

    res.json(rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});
// Create a new exercise for today
app.post("/excercises", async (req, res) => {
  try {
    const {
      userid,
      muscles,
      reps,
      sets,
      estimatedtime,
      priority,
      exercise_name, // received from the frontend
      calories_burned
    } = req.body;
    if (!userid || !muscles || !reps || !sets || !estimatedtime || !priority || !exercise_name || !calories_burned) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Ensure that fields that should not be null are not null
    if (userid == null || muscles == null || reps == null || sets == null || estimatedtime == null || priority == null || exercise_name == null || calories_burned == null) {
      return res.status(400).json({ error: "Invalid input: none of the fields can be null" });
    }

    // Set completed to false by default
    const completed = false;

    // Rename exercise_name to excercise_name for the database insertion
    const excercise_name = exercise_name;

    // Format today's date as YYYY-MM-DD
    const todayDate = formatDate(new Date());

    // Get the current month in 'YYYY-MM' format
    const currentMonth = new Date().toISOString().slice(0, 7);

    // Start a transaction
    await pool.query('BEGIN');

    // SQL query to insert a new exercise
    const insertExerciseQuery = `
      INSERT INTO todays_workouts (userid, muscles, reps, sets, estimatedtime, priority, completed, date, excercise_name, calories_burned)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *;
    `;

    // Execute the insert query for the exercise
    const { rows: exerciseRows } = await pool.query(insertExerciseQuery, [
      userid,
      muscles,
      reps,
      sets,
      estimatedtime,
      priority,
      completed, // Default to false
      todayDate,
      excercise_name,
      calories_burned
    ]);

    // Check if stats for the current month exist
    const { rowCount: statsExist } = await pool.query(
      'SELECT 1 FROM stats WHERE userid = $1 AND month = $2',
      [userid, currentMonth]
    );

    if (statsExist) {
      // If stats for the current month exist, update taskssetthismonth
      const updateStatsQuery = `
        UPDATE stats
        SET taskssetthismonth = taskssetthismonth + 1
        WHERE userid = $1 AND month = $2;
      `;
      await pool.query(updateStatsQuery, [userid, currentMonth]);
    } else {
      // If no stats for the current month exist, insert a new record
      const insertStatsQuery = `
        INSERT INTO stats (userid, month, hoursofselfimprovement, monthlylevel, streak, taskssetthismonth, taskscompletedthismonth)
        VALUES ($1, $2, 0, 0, 0, 1, 0);
      `;
      await pool.query(insertStatsQuery, [userid, currentMonth]);
    }

    // SQL query to check if the "Excercise" category exists in categories table
    const checkCategoryQuery = `
      SELECT * FROM categories WHERE userid = $1 AND categoryname = 'Excercise';
    `;

    const { rows: categoryRows } = await pool.query(checkCategoryQuery, [userid]);

    if (categoryRows.length > 0) {
      // If category exists, increment categorytaskset by 1
      const updateCategoryQuery = `
        UPDATE categories
        SET categorytaskset = categorytaskset + 1
        WHERE userid = $1 AND categoryname = 'Excercise';
      `;
      await pool.query(updateCategoryQuery, [userid]);
    } else {
      // If category does not exist, create it with categorytaskset set to 1
      const insertCategoryQuery = `
        INSERT INTO categories (userid, categoryname, categorytaskset)
        VALUES ($1, 'Excercise', 1);
      `;
      await pool.query(insertCategoryQuery, [userid]);
    }

    // Commit the transaction
    await pool.query('COMMIT');

    // Return the created exercise
    res.status(201).json(exerciseRows[0]);
  } catch (err) {
    console.error(err.message);

    // Rollback transaction in case of error
    await pool.query('ROLLBACK');

    res.status(500).json({ error: "Server error" });
  }
});
// delete an excericse
// Route to delete an exercise with today's date check
app.delete("/exercises/:id", async (req, res) => {
  try {
    const exerciseId = parseInt(req.params.id, 10); // Get exercise ID from URL parameter

    // Get today's date in YYYY-MM-DD format
    const todayDate = new Date().toISOString().split("T")[0];

    // SQL query to delete the exercise
    const deleteQuery = `
            DELETE FROM todays_workouts
            WHERE exercisid = $1
              AND Date = $2
            RETURNING *;
        `;

    // Execute the query
    const { rows } = await pool.query(deleteQuery, [exerciseId, todayDate]);

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Exercise not found or not set for today" });
    }

    res.json({
      message: "Exercise deleted successfully",
      deletedExercise: rows[0],
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});
// Get all journal pages for a specific user
app.get("/journals/:userid", async (req, res) => {
  try {
    const userId = parseInt(req.params.userid, 10); // Get user ID from URL parameter

    // SQL query to get all journal pages for the user
    const query = `
            SELECT * 
            FROM journals 
            WHERE userid = $1;
        `;

    // Execute the query
    const { rows } = await pool.query(query, [userId]);

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ message: "No journal pages found for this user" });
    }

    res.json(rows); // Return the journal pages
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});
app.put("/complete-exercise", async (req, res) => {
  try {
    const { userid, exercisid } = req.body;

    if (!userid || !exercisid) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    // Start a transaction
    await pool.query('BEGIN');

    // Update the exercise to mark it as completed
    const updateExerciseQuery = `
      UPDATE todays_workouts
      SET completed = TRUE
      WHERE userid = $1 AND exercisid = $2
      RETURNING *;
    `;
    const { rows: exerciseRows } = await pool.query(updateExerciseQuery, [userid, exercisid]);

    if (exerciseRows.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ error: "Exercise not found" });
    }

    const completedExercise = exerciseRows[0];
    const estimatedTimeInHours = completedExercise.estimatedtime / 60;

    // Get the current month in 'YYYY-MM' format
    const currentMonth = new Date().toISOString().slice(0, 7);

    // Check if a stats record for the current month exists
    const { rowCount: statsExist } = await pool.query(
      'SELECT 1 FROM stats WHERE userid = $1 AND TO_CHAR(month, \'YYYY-MM\') = $2',
      [userid, currentMonth]
    );

    if (statsExist) {
      // If stats for the current month exist, update taskscompletedthismonth and hoursofselfimprovement
      const updateStatsQuery = `
        UPDATE stats
        SET 
          taskscompletedthismonth = taskscompletedthismonth + 1,
          hoursofselfimprovement = hoursofselfimprovement + $3
        WHERE userid = $1 AND TO_CHAR(month, 'YYYY-MM') = $2;
      `;
      await pool.query(updateStatsQuery, [userid, currentMonth, estimatedTimeInHours]);
    } else {
      // If no stats for the current month exist, insert a new record
      const insertStatsQuery = `
        INSERT INTO stats (userid, month, hoursofselfimprovement, monthlylevel, streak, taskssetthismonth, taskscompletedthismonth)
        VALUES ($1, $2, $3, 0, 0, 1, 1);
      `;
      await pool.query(insertStatsQuery, [userid, currentMonth, estimatedTimeInHours]);
    }

    // Increment the categorytaskcompleted counter in the categories table
    const updateCategoryQuery = `
      UPDATE categories
      SET categorytaskcompleted = categorytaskcompleted + 1
      WHERE userid = $1 AND categoryname = 'Excercise';
    `;
    const { rowCount: categoryUpdated } = await pool.query(updateCategoryQuery, [userid]);

    if (categoryUpdated === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ error: "Category record not found" });
    }

    // Commit the transaction
    await pool.query('COMMIT');

    // Return the updated exercise data
    res.status(200).json(completedExercise);
  } catch (err) {
    console.error('Error in /complete-exercise endpoint:', err.message);

    // Rollback transaction in case of error
    await pool.query('ROLLBACK');

    res.status(500).json({ error: "Server error" });
  }
});
// Create a new journal entry

app.post('/journals', async (req, res) => {
  try {
    const {
      userid,
      highlights,
      what_im_grateful_for,
      progress_things_ive_learnt,
      date // Ensure date is in YYYY-MM-DD format
    } = req.body;
    if (!userid || !highlights || !what_im_grateful_for || !progress_things_ive_learnt || !date) {
      return res.status(400).json({ error: "All fields must be provided and cannot be null." });
    }
    // Check if the journal entry is fully completed (i.e., no null values)
    const isCompleted = [highlights, what_im_grateful_for, progress_things_ive_learnt].every(val => val !== null);

    // Set the estimated time taken journaling based on completion status
    const estimatedtimetakenjournaling = isCompleted ? 0.25 : 0.16;

    // Get the current month in 'YYYY-MM' format
    const currentMonth = new Date().toISOString().slice(0, 7);

    // Start a transaction
    await pool.query('BEGIN');

    // SQL query to check if a category named "Journaling" exists for the user
    const checkCategoryQuery = `
      SELECT * FROM categories 
      WHERE userid = $1 AND categoryname = 'Journaling';
    `;
    const { rows: categoryRows } = await pool.query(checkCategoryQuery, [userid]);

    // If the "Journaling" category does not exist, create it
    if (categoryRows.length === 0) {
      const createCategoryQuery = `
        INSERT INTO categories (userid, categoryname, categorytaskcompleted, categorytaskset)
        VALUES ($1, 'Journaling', 0, 0)
        RETURNING *;
      `;
      await pool.query(createCategoryQuery, [userid]);
    }

    // SQL query to insert a new journal entry
    const insertJournalQuery = `
      INSERT INTO journals (userid, highlights, what_im_grateful_for, progress_things_ive_learnt, estimatedtimetakenjournaling, date)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const { rows: journalRows } = await pool.query(insertJournalQuery, [
      userid,
      highlights,
      what_im_grateful_for,
      progress_things_ive_learnt,
      estimatedtimetakenjournaling,
      date,
    ]);

    const journalEntry = journalRows[0];

    // Check if a stats record for the current month exists
    const { rowCount: statsExist } = await pool.query(
      'SELECT 1 FROM stats WHERE userid = $1 AND month = $2',
      [userid, currentMonth]
    );

    if (statsExist) {
      // If stats for the current month exist, update taskscompletedthismonth and hoursofselfimprovement
      if (isCompleted) {
        await pool.query(`
          UPDATE stats
          SET 
            taskscompletedthismonth = taskscompletedthismonth + 1,
            taskssetthismonth = taskssetthismonth + 1,
            hoursofselfimprovement = hoursofselfimprovement + 0.25
          WHERE userid = $1 AND  month = $2;
        `, [userid, currentMonth]);
      } else {
        await pool.query(`
          UPDATE stats
          SET 
            taskssetthismonth = taskssetthismonth + 1,
            hoursofselfimprovement = hoursofselfimprovement + 0.16
          WHERE userid = $1 AND month = $2;
        `, [userid, currentMonth]);
      }
    } else {
      // If no stats record for the current month exists, insert a new record
      if (isCompleted) {
        await pool.query(`
          INSERT INTO stats (userid, month, hoursofselfimprovement, monthlylevel, streak, taskssetthismonth, taskscompletedthismonth)
          VALUES ($1, $2, 0.25, 0, 0, 1, 1);
        `, [userid, currentMonth]);
      } else {
        await pool.query(`
          INSERT INTO stats (userid, month, hoursofselfimprovement, monthlylevel, streak, taskssetthismonth)
          VALUES ($1, $2, 0.16, 0, 0, 1);
        `, [userid, currentMonth]);
      }
    }

    // Update category task counters
    const updateCategoryQuery = `
      UPDATE categories
      SET categorytaskset = categorytaskset + 1
      WHERE userid = $1 AND categoryname = 'Journaling';
    `;
    await pool.query(updateCategoryQuery, [userid]);

    if (isCompleted) {
      await pool.query(`
        UPDATE categories
        SET categorytaskcompleted = categorytaskcompleted + 1
        WHERE userid = $1 AND categoryname = 'Journaling';
      `, [userid]);
    }

    // Commit the transaction
    await pool.query('COMMIT');

    // Return the created journal entry
    res.status(201).json(journalEntry);
  } catch (err) {
    console.error(err.message);
    
    // Rollback transaction in case of error
    await pool.query('ROLLBACK');
    
    res.status(500).json({ error: "Server error" });
  }
});

// Update an existing journal entry
app.put("/journals/:pageid", async (req, res) => {
  try {
    const pageId = parseInt(req.params.pageid, 10); // Get journal entry ID from URL parameter
    const {
      userid,
      highlights,
      what_im_grateful_for,
      progress_things_ive_learnt,
      estimatedtimetakenjournaling,
      date,
    } = req.body;

    // SQL query to update the journal entry
    const query = `
            UPDATE journals
            SET 
                userid = $1,
                highlights = $2,
                what_im_grateful_for = $3,
                progress_things_ive_learnt = $4,
                estimatedtimetakenjournaling = $5,
                date = $6
            WHERE 
                pageid = $7
            RETURNING *;
        `;

    // Execute the query
    const { rows } = await pool.query(query, [
      userid,
      highlights,
      what_im_grateful_for,
      progress_things_ive_learnt,
      estimatedtimetakenjournaling,
      date,
      pageId,
    ]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Journal entry not found" });
    }

    res.json(rows[0]); // Return the updated journal entry
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});


// friends
app.patch('/add-friend', async (req, res) => {
  const { userid, potentialfriend } = req.body;

  try {
    // Validate the user ID
    const userCheckQuery = `
        SELECT userid 
        FROM users 
        WHERE userid = $1`;
    const { rows: userCheck } = await pool.query(userCheckQuery, [userid]);

    if (userCheck.length === 0) {
        return res.status(400).json({ error: 'Invalid user ID.' });
    }

    // Look up the user ID for the potential friend
    const potentialFriendQuery = `
        SELECT userid 
        FROM users 
        WHERE username = $1`;
    const { rows: potentialFriendRows } = await pool.query(potentialFriendQuery, [potentialfriend]);

    if (potentialFriendRows.length === 0) {
        return res.status(400).json({ error: 'Potential friend username does not exist.' });
    }

    const potentialFriendId = potentialFriendRows[0].userid;

    // Check if they are already friends
    const checkFriendshipQuery = `
        SELECT 1 
        FROM friends 
        WHERE userid = $1 
          AND $2 = ANY(friends)`;
    const { rowCount: isAlreadyFriends } = await pool.query(checkFriendshipQuery, [userid, potentialFriendId]);

    if (isAlreadyFriends > 0) {
        // Clean up friendrequestsentto and friendrequestreceived if they are already friends
        await pool.query(`
            UPDATE friends
            SET friendrequestsentto = (
                SELECT ARRAY(
                    SELECT unnest(friendrequestsentto) 
                    EXCEPT 
                    SELECT unnest(friends)
                )
            ), friendrequestreceived = (
                SELECT ARRAY(
                    SELECT unnest(friendrequestreceived) 
                    EXCEPT 
                    SELECT unnest(friends)
                )
            )
            WHERE userid = $1;
        `, [userid]);

        await pool.query(`
            UPDATE friends
            SET friendrequestsentto = (
                SELECT ARRAY(
                    SELECT unnest(friendrequestsentto) 
                    EXCEPT 
                    SELECT unnest(friends)
                )
            ), friendrequestreceived = (
                SELECT ARRAY(
                    SELECT unnest(friendrequestreceived) 
                    EXCEPT 
                    SELECT unnest(friends)
                )
            )
            WHERE userid = $1;
        `, [potentialFriendId]);

        return res.status(200).json({ message: 'Friend request accepted. You are now friends!' });
    }

    // Check if a friend request has already been sent by the userid
    const checkSentRequestQuery = `
        SELECT 1 
        FROM friends 
        WHERE userid = $1 
          AND $2 = ANY(friendrequestsentto)`;
    const { rowCount: hasAlreadySentRequest } = await pool.query(checkSentRequestQuery, [userid, potentialFriendId]);

    if (hasAlreadySentRequest > 0) {
        return res.status(400).json({ error: 'Friend request has already been sent to this user.' });
    }

    // Check if a friend request was already received from the potential friend
    const checkMutualRequestQuery = `
        SELECT 1 
        FROM friends 
        WHERE userid = $1 
          AND $2 = ANY(friendrequestreceived)`;
    const { rowCount: hasMutualRequest } = await pool.query(checkMutualRequestQuery, [userid, potentialFriendId]);

    if (hasMutualRequest > 0) {
        // Mutual friend request found, so they should become friends
        const makeFriendsQuery1 = `
            UPDATE friends 
            SET 
                friends = array_append(friends, $1),
                friendrequestreceived = array_remove(friendrequestreceived, $1)
            WHERE userid = $2;`;
        await pool.query(makeFriendsQuery1, [userid, potentialFriendId]);

        const makeFriendsQuery2 = `
            UPDATE friends 
            SET 
                friends = array_append(friends, $2),
                friendrequestsentto = array_remove(friendrequestsentto, $2)
            WHERE userid = $1;`;
        await pool.query(makeFriendsQuery2, [userid, potentialFriendId]);

        // Clean up friendrequestsentto and friendrequestreceived
        await pool.query(`
            UPDATE friends
            SET friendrequestsentto = (
                SELECT ARRAY(
                    SELECT unnest(friendrequestsentto) 
                    EXCEPT 
                    SELECT unnest(friends)
                )
            ), friendrequestreceived = (
                SELECT ARRAY(
                    SELECT unnest(friendrequestreceived) 
                    EXCEPT 
                    SELECT unnest(friends)
                )
            )
            WHERE userid = $1;
        `, [userid]);

        await pool.query(`
            UPDATE friends
            SET friendrequestsentto = (
                SELECT ARRAY(
                    SELECT unnest(friendrequestsentto) 
                    EXCEPT 
                    SELECT unnest(friends)
                )
            ), friendrequestreceived = (
                SELECT ARRAY(
                    SELECT unnest(friendrequestreceived) 
                    EXCEPT 
                    SELECT unnest(friends)
                )
            )
            WHERE userid = $1;
        `, [potentialFriendId]);

        return res.status(200).json({ message: 'Friend request accepted. You are now friends!' });
    }

    // No mutual friend request, so just send a friend request
    const updateFriendRequestSentQuery = `
        UPDATE friends 
        SET friendrequestsentto = 
            CASE 
                WHEN NOT $1 = ANY(friendrequestsentto) 
                THEN array_append(friendrequestsentto, $1) 
                ELSE friendrequestsentto 
            END
        WHERE userid = $2`;
    await pool.query(updateFriendRequestSentQuery, [potentialFriendId, userid]);

    const updateFriendRequestReceivedQuery = `
        UPDATE friends 
        SET friendrequestreceived = 
            CASE 
                WHEN NOT $1 = ANY(friendrequestreceived) 
                THEN array_append(friendrequestreceived, $1) 
                ELSE friendrequestreceived 
            END
        WHERE userid = $2`;
    await pool.query(updateFriendRequestReceivedQuery, [userid, potentialFriendId]);

    return res.status(200).json({ message: 'Friend request sent successfully.' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while processing your request.' });
  }
});
app.patch('/reject-friend-request', async (req, res) => {
  const { userid, potentialfriend } = req.body;

  try {
      // Look up the user ID for the potential friend
      const potentialFriendQuery = `
          SELECT userid 
          FROM users 
          WHERE username = $1`;
      const { rows: potentialFriendRows } = await pool.query(potentialFriendQuery, [potentialfriend]);

      if (potentialFriendRows.length === 0) {
          return res.status(400).json({ error: 'Potential friend username does not exist.' });
      }

      const potentialFriendId = potentialFriendRows[0].userid;

      // Check if the friend request exists
      const checkRequestQuery = `
          SELECT 1 
          FROM friends 
          WHERE userid = $1 
            AND $2 = ANY(friendrequestreceived)`;
      const { rowCount: hasReceivedRequest } = await pool.query(checkRequestQuery, [userid, potentialFriendId]);

      if (hasReceivedRequest === 0) {
          return res.status(400).json({ error: 'No friend request received from this user.' });
      }

      // Remove the friend request
      const removeReceivedRequestQuery = `
          UPDATE friends 
          SET friendrequestreceived = array_remove(friendrequestreceived, $1)
          WHERE userid = $2`;
      await pool.query(removeReceivedRequestQuery, [potentialFriendId, userid]);

      const removeSentRequestQuery = `
          UPDATE friends 
          SET friendrequestsentto = array_remove(friendrequestsentto, $1)
          WHERE userid = $2`;
      await pool.query(removeSentRequestQuery, [userid, potentialFriendId]);

      return res.status(200).json({ message: 'Friend request rejected successfully.' });

  } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'An error occurred while processing your request.' });
  }
})
app.patch('/unfriend', async (req, res) => {
  const { userid, friendToRemove } = req.body;

  try {
      // Look up the user ID for the friend to remove
      const friendToRemoveQuery = `
          SELECT userid 
          FROM users 
          WHERE username = $1`;
      const { rows: friendToRemoveRows } = await pool.query(friendToRemoveQuery, [friendToRemove]);

      if (friendToRemoveRows.length === 0) {
          return res.status(400).json({ error: 'Friend username does not exist.' });
      }

      const friendToRemoveId = friendToRemoveRows[0].userid;

      // Check if they are actually friends
      const checkFriendshipQuery = `
          SELECT 1 
          FROM friends 
          WHERE userid = $1 
            AND $2 = ANY(friends)`;
      const { rowCount: isFriends } = await pool.query(checkFriendshipQuery, [userid, friendToRemoveId]);

      if (isFriends === 0) {
          return res.status(400).json({ error: 'You are not friends with this user.' });
      }

      // Remove each other from the friends array
      const removeFriendshipQuery1 = `
          UPDATE friends 
          SET friends = array_remove(friends, $1)
          WHERE userid = $2`;
      await pool.query(removeFriendshipQuery1, [friendToRemoveId, userid]);

      const removeFriendshipQuery2 = `
          UPDATE friends 
          SET friends = array_remove(friends, $1)
          WHERE userid = $2`;
      await pool.query(removeFriendshipQuery2, [userid, friendToRemoveId]);

      return res.status(200).json({ message: 'You have unfriended this user successfully.' });

  } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'An error occurred while processing your request.' });
  }
});
app.get('/get-friend-requests/:userid', async (req, res) => {
  const userid = parseInt(req.params.userid, 10); // Ensure userid is an integer

  if (isNaN(userid)) {
    return res.status(400).json({ error: 'Invalid user ID format.' });
  }

  try {
    // Validate the user ID
    const userCheckQuery = `
        SELECT userid 
        FROM users 
        WHERE userid = $1`;
    const { rows: userCheck } = await pool.query(userCheckQuery, [userid]);

    if (userCheck.length === 0) {
        return res.status(400).json({ error: 'Invalid user ID.' });
    }

    // Fetch friend requests received by the user
    const friendRequestsQuery = `
        SELECT u.username 
        FROM friends f
        JOIN users u ON u.userid = ANY(f.friendrequestreceived)
        WHERE f.userid = $1`;
    const { rows: friendRequests } = await pool.query(friendRequestsQuery, [userid]);

    // Return the friend requests
    return res.status(200).json({ friendRequests });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while retrieving friend requests.' });
  }
});

app.get("/stats-including-friends/:id", async (req, res) => {
  try {
    const currentMonth = new Date().toISOString().split("T")[0].substring(0, 7);
    const userId = req.params.id;

    // Get list of friends
    const friendsQuery = `
      SELECT unnest(friends) AS friend_id
      FROM friends
      WHERE userid = $1
    `;
    const { rows: friendsRows } = await pool.query(friendsQuery, [userId]);
    const friendsList = friendsRows.map(row => row.friend_id);

    // Include the user in the list
    friendsList.push(userId);

    // Fetch stats for the user and friends
    const statsQuery = `
      SELECT *
      FROM Stats
      WHERE userid = ANY($1)
      AND EXTRACT(YEAR FROM TO_DATE("month", 'YYYY-MM')::timestamp) = EXTRACT(YEAR FROM TO_DATE($2, 'YYYY-MM')::timestamp)
      AND EXTRACT(MONTH FROM TO_DATE("month", 'YYYY-MM')::timestamp) = EXTRACT(MONTH FROM TO_DATE($2, 'YYYY-MM')::timestamp)
    `;
    const { rows } = await pool.query(statsQuery, [friendsList, currentMonth]);

    res.json(rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});
app.get('/getfriends/:userid', async (req, res) => {
  const { userid } = req.params;

  try {
    // SQL query to get all journal entries for the user
    const getFriendsQuery = `
      SELECT * FROM friends
      WHERE userid = $1

    `;

    const { rows: friends } = await pool.query(getFriendsQuery, [userid]);

    res.status(200).json(friends); // Return all journal entries
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});


app.post('/challenges', async (req, res) => {
  const {
    leaduserid, // Correct field name
    challengename,
    challengedesc,
    invitedparticipants,
    startdate,
    enddate,
    freq,
    estimatedtime,
    publicity
  } = req.body;

  try {
    // Start a transaction
    await pool.query('BEGIN');

    // Get the current month in 'YYYY-MM' format
    const currentMonth = new Date().toISOString().slice(0, 7);

    // Check if a stats record for the current month exists for the lead user
    const { rowCount: statsExist } = await pool.query(
      'SELECT 1 FROM stats WHERE userid = $1 AND month = $2',
      [leaduserid, currentMonth] // Use leaduserid here
    );

    if (!statsExist) {
      // If no stats record exists, create a new record
      await pool.query(`
        INSERT INTO stats (userid, month, taskssetthismonth, taskscompletedthismonth)
        VALUES ($1, $2, 1, 0);
      `, [leaduserid, currentMonth]); // Use leaduserid here
    } else {
      // If a stats record exists, increment taskssetthismonth
      await pool.query(`
        UPDATE stats
        SET taskssetthismonth = taskssetthismonth + 1
        WHERE userid = $1 AND month = $2;
      `, [leaduserid, currentMonth]); // Use leaduserid here
    }

    // Insert the new challenge
    const insertChallengeQuery = `
      INSERT INTO challenges (challengename, challengedesc, invitedparticipants, startdate, enddate, freq, estimatedtime, leaduserid, publicity)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *;
    `;
    const { rows: challengeRows } = await pool.query(insertChallengeQuery, [
      challengename,
      challengedesc,
      invitedparticipants,
      startdate,
      enddate,
      freq,
      estimatedtime,
      leaduserid, // Correct field name
      publicity
    ]);

    // Commit the transaction
    await pool.query('COMMIT');

    // Return the created challenge
    res.status(201).json(challengeRows[0]);
  } catch (err) {
    console.error('Error creating challenge:', err.message);

    // Rollback transaction in case of error
    await pool.query('ROLLBACK');

    res.status(500).json({ error: "Server error" });
  }
});

app.patch('/accept-challenge-invite', async (req, res) => {
  const client = await pool.connect();
  try {
    const { teamid, userId } = req.body;

    // Validate required fields
    if (!teamid || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Fetch challenge details including startdate, freq, leaduserid, and estimatedtime
    const challengeResult = await client.query(
      'SELECT challengename, participants, invitedparticipants, success, fail, startdate, freq, leaduserid, estimatedtime FROM challenges WHERE teamid = $1',
      [teamid]
    );
    const challenge = challengeResult.rows[0];

    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    const { challengename, participants, invitedparticipants, success, fail, startdate, freq, leaduserid, estimatedtime } = challenge;

    // Check if user is already a participant
    if (participants.includes(userId)) {
      return res.status(400).json({ error: 'User is already a participant' });
    }

    // Check if user was invited
    if (!invitedparticipants.includes(userId)) {
      return res.status(400).json({ error: 'User was not invited' });
    }

    // Update participants, success, and fail arrays
    const updatedParticipants = [...participants, userId];
    const updatedSuccess = [...success, 0];
    const updatedFail = [...fail, 0];

    // Remove user from invited participants
    const updatedInvitedParticipants = invitedparticipants.filter(id => id !== userId);

    // Update the challenge
    await client.query(
      `UPDATE challenges 
       SET participants = $1, invitedparticipants = $2, success = $3, fail = $4 
       WHERE teamid = $5`,
      [
        updatedParticipants,
        updatedInvitedParticipants,
        updatedSuccess,
        updatedFail,
        teamid
      ]
    );

    // Insert into categories table
    const categoryname = `${challengename} (TEAM CHALLENGE)`;
    const categoryResult = await client.query(
      `INSERT INTO categories (userid, categoryname, categorytaskcompleted, categorytaskset, teamid) 
       VALUES ($1, $2, $3, $4, $5) RETURNING categoryid`,
      [
        userId,
        categoryname,
        0,  // categorytaskcompleted
        0,  // categorytaskset
        teamid
      ]
    );
    const categoryid = categoryResult.rows[0].categoryid;

    // Check if the start date is today
    const today = new Date();
    const challengeStartDate = new Date(startdate);
    if (challengeStartDate.toDateString() === today.toDateString()) {
      try {
        const todoName = `${challengename} (TEAM CHALLENGE)`;
        const deadlineDate = new Date(startdate);
        deadlineDate.setDate(deadlineDate.getDate() + freq);

        await client.query(
          `INSERT INTO todos (userid, todoname, categoryid, priority, estimatedtime, completed, date, deadlinedate)
           VALUES ($1, $2, $3, $4, $5, false, CURRENT_DATE, $6)`,
          [userId, todoName, categoryid, 1, estimatedtime, deadlineDate]
        );
      } catch (err) {
        console.error('Failed to insert initial to-do for new participant:', err);
        return res.status(500).json({ error: 'Failed to insert initial to-do for new participant' });
      }
    }

    res.status(200).json({
      teamid,
      participants: updatedParticipants,
      invitedparticipants: updatedInvitedParticipants,
      success: updatedSuccess,
      fail: updatedFail
    });
  } catch (err) {
    console.error('Failed to update challenge or insert category:', err);
    res.status(500).json({ error: 'Failed to update challenge or insert category' });
  } finally {
    client.release();
  }
});
app.patch('/reject-challenge-invite', async (req, res) => {
  const client = await pool.connect();
  try {
    const { teamid, userId } = req.body;

    // Validate required fields
    if (!teamid || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Fetch challenge details including participants, invitedparticipants
    const challengeResult = await client.query(
      'SELECT participants, invitedparticipants FROM challenges WHERE teamid = $1',
      [teamid]
    );
    const challenge = challengeResult.rows[0];

    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    const { participants, invitedparticipants } = challenge;

    // Check if user is already a participant
    if (participants.includes(userId)) {
      return res.status(400).json({ error: 'User is already a participant' });
    }

    // Check if user was invited
    if (!invitedparticipants.includes(userId)) {
      return res.status(400).json({ error: 'User was not invited' });
    }

    // Remove user from invited participants
    const updatedInvitedParticipants = invitedparticipants.filter(id => id !== userId);

    // Update the challenge
    await client.query(
      `UPDATE challenges 
       SET invitedparticipants = $1 
       WHERE teamid = $2`,
      [
        updatedInvitedParticipants,
        teamid
      ]
    );

    res.status(200).json({
      teamid,
      invitedparticipants: updatedInvitedParticipants
    });
  } catch (err) {
    console.error('Failed to reject challenge invite:', err);
    res.status(500).json({ error: 'Failed to reject challenge invite' });
  } finally {
    client.release();
  }
});
app.post('/generate-todos', async (req, res) => {
  const client = await pool.connect();
  try {
    // Fetch all challenges
    const challengesResult = await client.query('SELECT * FROM challenges');
    const challenges = challengesResult.rows;

    // Get the current date and current month
    const currentDate = new Date();
    const currentMonth = currentDate.toISOString().slice(0, 7); // YYYY-MM

    // Track if any todos were generated
    let todosGenerated = false;

    for (const challenge of challenges) {
      const { teamid, challengename, participants, lasttodonotif, freq, estimatedtime, startdate, success, fail } = challenge;

      // Calculate the next notification date
      const nextNotifDate = new Date(lasttodonotif);
      nextNotifDate.setDate(nextNotifDate.getDate() + freq);

      // Check if we need to generate a new to-do
      if (currentDate >= nextNotifDate) {
        // Fetch categoryid based on teamid and userid
        for (const userId of participants) {
          const categoryResult = await client.query(
            `SELECT categoryid FROM categories WHERE teamid = $1 AND userid = $2`,
            [teamid, userId]
          );

          const category = categoryResult.rows[0];

          // Ensure categoryid is not null
          if (!category || !category.categoryid) {
            console.error(`Error: Missing categoryid for teamid: ${teamid} and userid: ${userId}`);
            continue; // Skip this iteration if categoryid is missing
          }

          const categoryid = category.categoryid;

          const todoName = `${challengename} (TEAM CHALLENGE)`;
          const deadlineDate = new Date(currentDate);
          deadlineDate.setDate(currentDate.getDate() + freq);

          // Insert the new to-do
          await client.query(
            `INSERT INTO todos (userid, todoname, categoryid, priority, estimatedtime, completed, date, deadlinedate)
             VALUES ($1, $2, $3, $4, $5, false, CURRENT_DATE, $6)`,
            [userId, todoName, categoryid, 1, estimatedtime, deadlineDate]
          );

          // Mark that at least one todo was generated
          todosGenerated = true;

          // Check if a stats record exists for the user for the current month
          const { rowCount: statsExist } = await client.query(
            'SELECT 1 FROM stats WHERE userid = $1 AND month = $2',
            [userId, currentMonth]
          );

          if (!statsExist) {
            // If no stats record exists, create a new record
            await client.query(`
              INSERT INTO stats (userid, month, taskssetthismonth, taskscompletedthismonth)
              VALUES ($1, $2, 1, 0);
            `, [userId, currentMonth]);
          } else {
            // If a stats record exists, increment taskssetthismonth
            await client.query(`
              UPDATE stats
              SET taskssetthismonth = taskssetthismonth + 1
              WHERE userid = $1 AND month = $2;
            `, [userId, currentMonth]);
          }
        }

        // Update the lasttodonotif to the current date
        await client.query(
          `UPDATE challenges SET lasttodonotif = CURRENT_DATE WHERE teamid = $1`,
          [teamid]
        );

        // Calculate the number of days since the start of the challenge
        const startDate = new Date(startdate);
        const daysElapsed = Math.floor((currentDate - startDate) / (1000 * 60 * 60 * 24));

        // Update the fail counts for all participants
        for (let i = 0; i < participants.length; i++) {
          fail[i] = Math.max(daysElapsed - success[i], 0);
        }

        // Update the challenge with the new fail counts
        await client.query(
          `UPDATE challenges 
           SET fail = $1 
           WHERE teamid = $2`,
          [fail, teamid]
        );
      }
    }

    // Return appropriate message based on whether todos were generated
    if (todosGenerated) {
      res.status(200).json({ message: 'Todos generated successfully' });
    } else {
      res.status(200).json({ message: 'No todos were added' });
    }
  } catch (err) {
    console.error('Error generating todos:', err.message);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

app.get('/server-date', (req, res) => {
  const currentDate = new Date();
  res.json({ currentDate });
});

app.get("/graph", async (req, res) => {
  try {
    const graph = await pool.query("SELECT USERID, FRIENDS FROM FRIENDS;")
    res.json(graph.rows);
  } catch (err) {
    console.error(err.message);
    console.log("well done");
  }
});
app.get('/challenges', async (req, res) => {
  const client = await pool.connect();

  try {
    // Fetch all challenges
    const result = await client.query('SELECT * FROM challenges');
    const challenges = result.rows;

    res.status(200).json({ challenges });
  } catch (err) {
    console.error('Error fetching challenges:', err.message);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});