// =====================================================
// LEARNOVA AI
// MAIN APPLICATION
// =====================================================
//
// Global features:
// 1. React Router navigation
// 2. Protected routes
// 3. Global Navbar + Sidebar
// 4. Global Dark Mode
// 5. Dark Mode persistence after refresh
// 6. Theme synchronization with Settings.jsx
// 7. Dashboard task management
// 8. Study statistics
// 9. Study streak
//
// =====================================================

import {
  useEffect,
  useState,
} from "react";

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import "./App.css";


// =====================================================
// SERVICES
// =====================================================

import {
  getTasks,
  createTask,
  updateTaskAPI,
  deleteTaskAPI,
} from "./services/taskService";


// =====================================================
// COMMON COMPONENTS
// =====================================================

import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";

import StatCard from "./components/StatCard";
import StudyPlan from "./components/StudyPlan";
import AIAssistant from "./components/AIAssistant";
import SubjectProgress from "./components/SubjectProgress";
import CreatePlanModal from "./components/CreatePlanModal";


// =====================================================
// PAGES
// =====================================================

import Login from "./pages/Login";
import Register from "./pages/Register";

import Analytics from "./pages/Analytics";
import StudyPlanPage from "./pages/StudyPlanPage";
import TasksPage from "./pages/TasksPage";
import SubjectsPage from "./pages/Subjects";
import Quizzes from "./pages/Quizzes";
import Notes from "./pages/Notes";
import Resources from "./pages/Resources";
import Settings from "./pages/Settings";


// =====================================================
// GLOBAL THEME INITIALIZER
// =====================================================
//
// This component is responsible for:
// - Reading dark mode from localStorage
// - Applying dark mode globally
// - Restoring dark mode after page refresh
// - Listening to Settings.jsx theme changes
//
// =====================================================

function ThemeInitializer() {

  useEffect(() => {

    // -------------------------------------------------
    // Apply theme to entire application
    // -------------------------------------------------

    const applyGlobalTheme = (darkMode) => {

      const html =
        document.documentElement;

      const body =
        document.body;


      if (darkMode === true) {

        // ---------------------------------------------
        // DARK MODE
        // ---------------------------------------------

        html.classList.add(
          "learnova-dark"
        );

        html.setAttribute(
          "data-theme",
          "dark"
        );


        body.classList.add(
          "learnova-dark-body"
        );

        body.setAttribute(
          "data-theme",
          "dark"
        );

      } else {

        // ---------------------------------------------
        // LIGHT MODE
        // ---------------------------------------------

        html.classList.remove(
          "learnova-dark"
        );

        html.setAttribute(
          "data-theme",
          "light"
        );


        body.classList.remove(
          "learnova-dark-body"
        );

        body.setAttribute(
          "data-theme",
          "light"
        );

      }

    };


    // -------------------------------------------------
    // READ SAVED THEME
    // -------------------------------------------------

    const savedTheme =
      localStorage.getItem(
        "learnovaDarkMode"
      );


    const savedDarkMode =
      savedTheme === "true";


    // -------------------------------------------------
    // APPLY SAVED THEME IMMEDIATELY
    // -------------------------------------------------

    applyGlobalTheme(
      savedDarkMode
    );


    // -------------------------------------------------
    // LISTEN FOR SETTINGS CHANGES
    // -------------------------------------------------

    const handleThemeChange =
      (event) => {

        const darkMode =
          event?.detail?.darkMode === true;


        // Save again for safety
        localStorage.setItem(
          "learnovaDarkMode",
          String(darkMode)
        );


        // Apply globally
        applyGlobalTheme(
          darkMode
        );

      };


    window.addEventListener(
      "learnovaThemeChanged",
      handleThemeChange
    );


    // -------------------------------------------------
    // LISTEN FOR STORAGE CHANGES
    // -------------------------------------------------
    //
    // Useful if another part of the application
    // changes the theme.
    //
    // -------------------------------------------------

    const handleStorageChange =
      (event) => {

        if (
          event.key !==
          "learnovaDarkMode"
        ) {
          return;
        }


        const darkMode =
          event.newValue === "true";


        applyGlobalTheme(
          darkMode
        );

      };


    window.addEventListener(
      "storage",
      handleStorageChange
    );


    // -------------------------------------------------
    // CLEANUP
    // -------------------------------------------------

    return () => {

      window.removeEventListener(
        "learnovaThemeChanged",
        handleThemeChange
      );


      window.removeEventListener(
        "storage",
        handleStorageChange
      );

    };

  }, []);


  // This component does not render anything.
  return null;
}


// =====================================================
// PROTECTED ROUTE
// =====================================================

function ProtectedRoute({
  children,
}) {

  const token =
    localStorage.getItem(
      "learnova_token"
    );


  if (!token) {

    return (
      <Navigate
        to="/login"
        replace
      />
    );

  }


  return children;
}


// =====================================================
// COMMON PROTECTED LAYOUT
// =====================================================
//
// Navbar + Sidebar are rendered only once here.
//
// Every protected page automatically receives:
// - Navbar
// - Sidebar
// - Global theme
//
// =====================================================

function ProtectedLayout({
  children,
}) {

  return (

    <div className="app-shell">

      {/* =================================================
          NAVBAR
          ================================================= */}

      <Navbar />


      {/* =================================================
          MAIN APPLICATION LAYOUT
          ================================================= */}

      <div className="app-layout">

        {/* =================================================
            SIDEBAR
            ================================================= */}

        <Sidebar />


        {/* =================================================
            PAGE CONTENT
            ================================================= */}

        <main className="page-content">

          {children}

        </main>

      </div>

    </div>

  );
}


// =====================================================
// DATE HELPERS
// =====================================================

function getTaskActivityDate(
  task
) {

  if (!task) {
    return null;
  }


  const dateValue =
    task.completed
      ? task.updatedAt ||
        task.createdAt
      : task.createdAt;


  if (!dateValue) {
    return null;
  }


  const date =
    new Date(dateValue);


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return null;

  }


  return date;
}


// =====================================================
// DATE KEY
// =====================================================

function getDateKey(
  date
) {

  if (!date) {
    return "";
  }


  return [

    date.getFullYear(),

    String(
      date.getMonth() + 1
    ).padStart(
      2,
      "0"
    ),

    String(
      date.getDate()
    ).padStart(
      2,
      "0"
    ),

  ].join("-");

}


// =====================================================
// PREVIOUS DATE KEY
// =====================================================

function getPreviousDateKey(
  date
) {

  const previous =
    new Date(date);


  previous.setDate(
    previous.getDate() - 1
  );


  return getDateKey(
    previous
  );

}


// =====================================================
// STUDY STREAK
// =====================================================

function calculateStudyStreak(
  studyTasks = []
) {

  const completedDates =
    new Set();


  studyTasks.forEach(
    (task) => {

      if (
        task?.completed !== true
      ) {

        return;

      }


      const date =
        getTaskActivityDate(
          task
        );


      if (!date) {

        return;

      }


      completedDates.add(
        getDateKey(
          date
        )
      );

    }
  );


  if (
    completedDates.size === 0
  ) {

    return 0;

  }


  const today =
    new Date();


  const todayKey =
    getDateKey(
      today
    );


  const yesterdayKey =
    getPreviousDateKey(
      today
    );


  let currentKey;


  if (
    completedDates.has(
      todayKey
    )
  ) {

    currentKey =
      todayKey;

  } else if (
    completedDates.has(
      yesterdayKey
    )
  ) {

    currentKey =
      yesterdayKey;

  } else {

    return 0;

  }


  let streak = 0;


  while (
    completedDates.has(
      currentKey
    )
  ) {

    streak += 1;


    const currentDate =
      new Date(
        `${currentKey}T00:00:00`
      );


    currentDate.setDate(
      currentDate.getDate() - 1
    );


    currentKey =
      getDateKey(
        currentDate
      );

  }


  return streak;
}


// =====================================================
// SUBJECT COUNT
// =====================================================

function getSubjectCount(
  studyTasks = []
) {

  const subjects =
    new Set();


  studyTasks.forEach(
    (task) => {

      const subject =
        task?.subject
          ?.trim()
          ?.toLowerCase();


      if (subject) {

        subjects.add(
          subject
        );

      }

    }
  );


  return subjects.size;
}


// =====================================================
// DASHBOARD
// =====================================================

function Dashboard() {

  const [
    showCreatePlan,
    setShowCreatePlan,
  ] = useState(false);


  const [
    editingTask,
    setEditingTask,
  ] = useState(null);


  const [
    studyTasks,
    setStudyTasks,
  ] = useState([]);


  const [
    tasksLoading,
    setTasksLoading,
  ] = useState(true);


  const [
    taskError,
    setTaskError,
  ] = useState("");


  // ===================================================
  // LOAD TASKS
  // ===================================================

  useEffect(() => {

    let active = true;


    const loadTasks =
      async () => {

        if (active) {

          setTasksLoading(
            true
          );

          setTaskError("");

        }


        try {

          const result =
            await getTasks();


          if (!active) {
            return;
          }


          if (
            result.success
          ) {

            setStudyTasks(
              Array.isArray(
                result.tasks
              )
                ? result.tasks
                : []
            );

          } else {

            setTaskError(
              result.message ||
              "Unable to load tasks."
            );

          }

        } catch (error) {

          console.error(
            "Load tasks error:",
            error
          );


          if (active) {

            setTaskError(
              "Unable to connect to task server."
            );

          }

        } finally {

          if (active) {

            setTasksLoading(
              false
            );

          }

        }

      };


    loadTasks();


    const handleTasksUpdated =
      () => {

        loadTasks();

      };


    window.addEventListener(
      "learnova:tasks-updated",
      handleTasksUpdated
    );


    return () => {

      active = false;


      window.removeEventListener(
        "learnova:tasks-updated",
        handleTasksUpdated
      );

    };

  }, []);


  // ===================================================
  // TOGGLE TASK
  // ===================================================

  const toggleTask =
    async (id) => {

      const task =
        studyTasks.find(
          (item) =>
            item._id === id ||
            item.id === id
        );


      if (!task) {
        return;
      }


      const completed =
        !task.completed;


      // Optimistic UI
      setStudyTasks(
        (tasks) =>

          tasks.map(
            (item) =>

              item._id === id ||
              item.id === id

                ? {
                    ...item,
                    completed,
                  }

                : item
          )
      );


      try {

        const result =
          await updateTaskAPI(
            id,
            {
              completed,
            }
          );


        if (!result.success) {

          throw new Error(
            result.message ||
            "Update failed"
          );

        }


        window.dispatchEvent(
          new Event(
            "learnova:tasks-updated"
          )
        );

      } catch (error) {

        console.error(
          "Toggle task error:",
          error
        );


        // Rollback
        setStudyTasks(
          (tasks) =>

            tasks.map(
              (item) =>

                item._id === id ||
                item.id === id

                  ? {
                      ...item,
                      completed:
                        !completed,
                    }

                  : item
            )
        );


        setTaskError(
          error.message ||
          "Unable to update task."
        );

      }

    };


  // ===================================================
  // CREATE TASK
  // ===================================================

  const addTask =
    async (newTask) => {

      setTaskError("");


      try {

        const result =
          await createTask({

            title:
              newTask.title,

            subject:
              newTask.subject,

            time:
              newTask.time,

          });


        if (!result.success) {

          setTaskError(
            result.message ||
            "Unable to create task."
          );

          return;

        }


        setStudyTasks(
          (tasks) => [
            ...tasks,
            result.task,
          ]
        );


        setShowCreatePlan(
          false
        );


        window.dispatchEvent(
          new Event(
            "learnova:tasks-updated"
          )
        );

      } catch (error) {

        console.error(
          "Create task error:",
          error
        );


        setTaskError(
          "Unable to create task."
        );

      }

    };


  // ===================================================
  // DELETE TASK
  // ===================================================

  const deleteTask =
    async (id) => {

      setTaskError("");


      try {

        const result =
          await deleteTaskAPI(
            id
          );


        if (!result.success) {

          setTaskError(
            result.message ||
            "Unable to delete task."
          );

          return;

        }


        setStudyTasks(
          (tasks) =>

            tasks.filter(
              (task) =>
                task._id !== id &&
                task.id !== id
            )
        );


        if (
          editingTask &&
          (
            editingTask._id === id ||
            editingTask.id === id
          )
        ) {

          setEditingTask(
            null
          );

        }


        window.dispatchEvent(
          new Event(
            "learnova:tasks-updated"
          )
        );

      } catch (error) {

        console.error(
          "Delete task error:",
          error
        );


        setTaskError(
          "Unable to delete task."
        );

      }

    };


  // ===================================================
  // EDIT TASK
  // ===================================================

  const startEditingTask =
    (task) => {

      if (!task) {
        return;
      }


      const id =
        task._id ||
        task.id;


      if (!id) {

        setTaskError(
          "This task does not have a valid ID."
        );

        return;

      }


      setEditingTask(
        task
      );


      setShowCreatePlan(
        false
      );

    };


  // ===================================================
  // UPDATE TASK
  // ===================================================

  const updateTask =
    async (updatedTask) => {

      setTaskError("");


      const id =
        updatedTask?._id ||
        updatedTask?.id;


      if (!id) {

        setTaskError(
          "Task ID is missing."
        );

        return;

      }


      try {

        const result =
          await updateTaskAPI(
            id,
            {

              title:
                updatedTask.title,

              subject:
                updatedTask.subject,

              time:
                updatedTask.time,

              completed:
                updatedTask.completed,

            }
          );


        if (!result.success) {

          setTaskError(
            result.message ||
            "Unable to update task."
          );

          return;

        }


        setStudyTasks(
          (tasks) =>

            tasks.map(
              (task) =>

                task._id === id ||
                task.id === id

                  ? result.task

                  : task
            )
        );


        setEditingTask(
          null
        );


        window.dispatchEvent(
          new Event(
            "learnova:tasks-updated"
          )
        );

      } catch (error) {

        console.error(
          "Update task error:",
          error
        );


        setTaskError(
          error.message ||
          "Unable to update task."
        );

      }

    };


  // ===================================================
  // CLOSE MODAL
  // ===================================================

  const closeModal =
    () => {

      setShowCreatePlan(
        false
      );

      setEditingTask(
        null
      );

    };


  // ===================================================
  // STATISTICS
  // ===================================================

  const totalTasks =
    studyTasks.length;


  const completedTasks =
    studyTasks.filter(
      (task) =>
        task.completed === true
    ).length;


  const pendingTasks =
    totalTasks -
    completedTasks;


  const progress =
    totalTasks === 0
      ? 0
      : Math.round(
          (
            completedTasks /
            totalTasks
          ) * 100
        );


  const subjectCount =
    getSubjectCount(
      studyTasks
    );


  const studyStreak =
    calculateStudyStreak(
      studyTasks
    );


  // ===================================================
  // USER NAME
  // ===================================================

  const savedUser =
    localStorage.getItem(
      "learnova_user"
    );


  let userName =
    "Vineet";


  if (savedUser) {

    try {

      const user =
        JSON.parse(
          savedUser
        );


      if (user?.name) {

        userName =
          user.name;

      }

    } catch (error) {

      console.error(
        "User read error:",
        error
      );

    }

  }


  // ===================================================
  // TIME-BASED GREETING
  // ===================================================
  //
  // 05:00 - 11:59  -> Good Morning
  // 12:00 - 16:59  -> Good Afternoon
  // 17:00 - 20:59  -> Good Evening
  // 21:00 - 04:59  -> Good Night
  //
  // The component re-checks the time every minute so the
  // greeting changes automatically without a refresh.
  // ===================================================

  const getGreeting = () => {

    const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) {
      return "Good Morning";
    }

    if (hour >= 12 && hour < 17) {
      return "Good Afternoon";
    }

    if (hour >= 17 && hour < 21) {
      return "Good Evening";
    }

    return "Good Night";

  };


  const [
    greeting,
    setGreeting,
  ] = useState(
    getGreeting()
  );


  useEffect(() => {

    const updateGreeting = () => {

      setGreeting(
        getGreeting()
      );

    };


    updateGreeting();


    // Check once every minute so the greeting
    // updates automatically while the dashboard
    // remains open.

    const greetingTimer =
      window.setInterval(
        updateGreeting,
        60 * 1000
      );


    return () => {

      window.clearInterval(
        greetingTimer
      );

    };

  }, []);


  // ===================================================
  // DASHBOARD UI
  // ===================================================

  return (

    <>

      <div className="dashboard">

        {/* =================================================
            DASHBOARD HEADER
            ================================================= */}

        <div className="dashboard-header">

          <div>

            <h1>
              {greeting}, {userName}! 👋
            </h1>

            <p>
              Let's make today a productive
              study day.
            </p>

          </div>


          <button
            type="button"
            className="create-plan-btn"
            onClick={() => {

              setEditingTask(
                null
              );

              setShowCreatePlan(
                true
              );

            }}
          >
            + Create New Plan
          </button>

        </div>


        {/* =================================================
            ERROR
            ================================================= */}

        {taskError && (

          <div
            className="auth-error"
            style={{
              marginBottom:
                "20px",
            }}
          >
            {taskError}
          </div>

        )}


        {/* =================================================
            STATISTICS
            ================================================= */}

        <div className="stats-grid">

          <StatCard
            icon="📚"
            title="Subjects"
            value={subjectCount}
            subtitle={
              subjectCount === 1
                ? "Active Subject"
                : "Active Subjects"
            }
          />


          <StatCard
            icon="✓"
            title="Tasks"
            value={`${completedTasks} / ${totalTasks}`}
            subtitle={
              pendingTasks === 0
                ? "All tasks completed"
                : `${pendingTasks} tasks remaining`
            }
          />


          <StatCard
            icon="📊"
            title="Progress"
            value={`${progress}%`}
            subtitle="Overall Progress"
          />


          <StatCard
            icon="🔥"
            title="Streak"
            value={studyStreak}
            subtitle={
              studyStreak === 1
                ? "Day in a row"
                : "Days in a row"
            }
          />

        </div>


        {/* =================================================
            STUDY PLAN + AI ASSISTANT
            ================================================= */}

        <div className="dashboard-content">

          {tasksLoading ? (

            <section className="study-plan">

              <div className="section-header">

                <div>

                  <h2>
                    📅 Today's Study Plan
                  </h2>

                  <p>
                    Loading your study plan...
                  </p>

                </div>

              </div>

            </section>

          ) : (

            <StudyPlan
              studyTasks={
                studyTasks
              }
              toggleTask={
                toggleTask
              }
              deleteTask={
                deleteTask
              }
              onEditTask={
                startEditingTask
              }
            />

          )}


          <AIAssistant
            studyTasks={
              studyTasks
            }
          />

        </div>


        {/* =================================================
            SUBJECT PROGRESS
            ================================================= */}

        <SubjectProgress
          studyTasks={
            studyTasks
          }
        />

      </div>


      {/* =================================================
          CREATE / EDIT PLAN MODAL
          ================================================= */}

      {(showCreatePlan ||
        editingTask) && (

        <CreatePlanModal

          key={
            editingTask?._id ||
            editingTask?.id ||
            "new-task"
          }

          onClose={
            closeModal
          }

          onAddTask={
            addTask
          }

          editingTask={
            editingTask
          }

          onUpdateTask={
            updateTask
          }

        />

      )}

    </>

  );

}


// =====================================================
// AI ASSISTANT PAGE
// =====================================================

function AIAssistantPage() {

  const [
    studyTasks,
    setStudyTasks,
  ] = useState([]);


  useEffect(() => {

    let active = true;


    getTasks()
      .then(
        (result) => {

          if (!active) {
            return;
          }


          if (
            result?.success
          ) {

            setStudyTasks(
              Array.isArray(
                result.tasks
              )
                ? result.tasks
                : []
            );

          }

        }
      )
      .catch(
        (error) => {

          console.error(
            "AI task load error:",
            error
          );

        }
      );


    return () => {

      active = false;

    };

  }, []);


  return (

    <main className="ai-page">

      <div className="page-heading">

        <h1>
          🤖 Learnova AI Assistant
        </h1>

        <p>
          Your personal AI study assistant for
          learning, revision, quizzes and progress.
        </p>

      </div>


      <AIAssistant
        studyTasks={
          studyTasks
        }
      />

    </main>

  );

}


// =====================================================
// MAIN APP
// =====================================================

function App() {

  return (

    <BrowserRouter>

      {/* =================================================
          GLOBAL DARK MODE INITIALIZER
          =================================================
          
          IMPORTANT:
          This must be inside BrowserRouter but outside
          Routes so it runs for the complete application.
          
          ================================================= */}

      <ThemeInitializer />


      {/* =================================================
          APPLICATION ROUTES
          ================================================= */}

      <Routes>


        {/* =================================================
            PUBLIC ROUTES
            ================================================= */}

        <Route
          path="/login"
          element={
            <Login />
          }
        />


        <Route
          path="/register"
          element={
            <Register />
          }
        />


        {/* =================================================
            DASHBOARD
            ================================================= */}

        <Route
          path="/dashboard"
          element={

            <ProtectedRoute>

              <ProtectedLayout>

                <Dashboard />

              </ProtectedLayout>

            </ProtectedRoute>

          }
        />


        {/* =================================================
            STUDY PLAN
            ================================================= */}

        <Route
          path="/study-plan"
          element={

            <ProtectedRoute>

              <ProtectedLayout>

                <StudyPlanPage />

              </ProtectedLayout>

            </ProtectedRoute>

          }
        />


        {/* =================================================
            TASKS
            ================================================= */}

        <Route
          path="/tasks"
          element={

            <ProtectedRoute>

              <ProtectedLayout>

                <TasksPage />

              </ProtectedLayout>

            </ProtectedRoute>

          }
        />


        {/* =================================================
            SUBJECTS
            ================================================= */}

        <Route
          path="/subjects"
          element={

            <ProtectedRoute>

              <ProtectedLayout>

                <SubjectsPage />

              </ProtectedLayout>

            </ProtectedRoute>

          }
        />


        {/* =================================================
            AI ASSISTANT
            ================================================= */}

        <Route
          path="/ai-assistant"
          element={

            <ProtectedRoute>

              <ProtectedLayout>

                <AIAssistantPage />

              </ProtectedLayout>

            </ProtectedRoute>

          }
        />


        {/* =================================================
            QUIZZES
            ================================================= */}

        <Route
          path="/quizzes"
          element={

            <ProtectedRoute>

              <ProtectedLayout>

                <Quizzes />

              </ProtectedLayout>

            </ProtectedRoute>

          }
        />


        {/* =================================================
            ANALYTICS
            ================================================= */}

        <Route
          path="/analytics"
          element={

            <ProtectedRoute>

              <ProtectedLayout>

                <Analytics />

              </ProtectedLayout>

            </ProtectedRoute>

          }
        />


        {/* =================================================
            NOTES
            ================================================= */}

        <Route
          path="/notes"
          element={

            <ProtectedRoute>

              <ProtectedLayout>

                <Notes />

              </ProtectedLayout>

            </ProtectedRoute>

          }
        />


        {/* =================================================
            RESOURCES
            ================================================= */}

        <Route
          path="/resources"
          element={

            <ProtectedRoute>

              <ProtectedLayout>

                <Resources />

              </ProtectedLayout>

            </ProtectedRoute>

          }
        />


        {/* =================================================
            SETTINGS
            ================================================= */}

        <Route
          path="/settings"
          element={

            <ProtectedRoute>

              <ProtectedLayout>

                <Settings />

              </ProtectedLayout>

            </ProtectedRoute>

          }
        />


        {/* =================================================
            DEFAULT ROUTE
            ================================================= */}

        <Route
          path="/"
          element={

            <Navigate
              to="/dashboard"
              replace
            />

          }
        />


        {/* =================================================
            UNKNOWN ROUTE
            ================================================= */}

        <Route
          path="*"
          element={

            <Navigate
              to="/dashboard"
              replace
            />

          }
        />

      </Routes>

    </BrowserRouter>

  );

}


// =====================================================
// EXPORT
// =====================================================

export default App;