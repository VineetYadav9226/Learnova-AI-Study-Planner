// =====================================================
// LEARNOVA AI
// TASKS PAGE
// =====================================================
//
// IMPORTANT:
// Navbar + Sidebar yahan render NAHI honge.
//
// Global ProtectedLayout already provides:
// Navbar + Sidebar + page-content.
//
// Features:
// - Load tasks from MongoDB
// - Create task
// - Edit task
// - Delete task
// - Complete / incomplete
// - Search
// - Status filter
// - Subject filter
// - Progress statistics
// - Dashboard synchronization
//
// =====================================================

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FiBookOpen,
  FiCheck,
  FiClock,
  FiEdit2,
  FiList,
  FiPlus,
  FiSearch,
  FiTarget,
  FiTrash2,
  FiX,
} from "react-icons/fi";

import {
  getTasks,
  createTask,
  updateTaskAPI,
  deleteTaskAPI,
} from "../services/taskService";


// =====================================================
// DEFAULT SUBJECTS
// =====================================================

const DEFAULT_SUBJECTS = [
  "Python",
  "AIML",
  "AI",
  "CN",
  "Data Structure",
  "Software Project Management",
  "Cloud Computing",
  "SPM",
  "DBMS",
  "DSA",
  "OS",
];


// =====================================================
// EMPTY FORM
// =====================================================

const EMPTY_FORM = {
  title: "",
  subject: "Python",
  time: "",
};


// =====================================================
// TASKS PAGE
// =====================================================

function TasksPage() {

  // ===================================================
  // TASK STATE
  // ===================================================

  const [tasks, setTasks] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");


  // ===================================================
  // SEARCH / FILTER STATE
  // ===================================================

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("all");

  const [subjectFilter, setSubjectFilter] =
    useState("all");


  // ===================================================
  // MODAL STATE
  // ===================================================

  const [showModal, setShowModal] =
    useState(false);

  const [editingTask, setEditingTask] =
    useState(null);

  const [form, setForm] =
    useState({
      ...EMPTY_FORM,
    });


  // ===================================================
  // LOAD TASKS
  // ===================================================

  useEffect(() => {

    let active = true;

    let timerId = null;


    const loadTasks = async () => {

      try {

        setLoading(true);

        setError("");


        const result =
          await getTasks();


        if (!active) {
          return;
        }


        if (result?.success) {

          const loadedTasks =
            Array.isArray(result.tasks)
              ? result.tasks
              : Array.isArray(result.data)
                ? result.data
                : [];


          setTasks(
            loadedTasks
          );

        } else {

          setTasks([]);

          setError(
            result?.message ||
            "Unable to load your tasks."
          );

        }

      } catch (err) {

        console.error(
          "Tasks page loading error:",
          err
        );


        if (active) {

          setTasks([]);

          setError(
            err?.message ||
            "Unable to connect to the task server."
          );

        }

      } finally {

        if (active) {

          setLoading(false);

        }

      }

    };


    // Small delay keeps initial rendering clean
    timerId =
      window.setTimeout(
        loadTasks,
        0
      );


    // =================================================
    // GLOBAL TASK UPDATE EVENT
    // =================================================

    const handleTasksUpdated = () => {

      loadTasks();

    };


    window.addEventListener(
      "learnova:tasks-updated",
      handleTasksUpdated
    );


    // =================================================
    // CLEANUP
    // =================================================

    return () => {

      active = false;

      if (timerId) {

        window.clearTimeout(
          timerId
        );

      }

      window.removeEventListener(
        "learnova:tasks-updated",
        handleTasksUpdated
      );

    };

  }, []);


  // ===================================================
  // SUBJECT LIST
  // ===================================================

  const subjects = useMemo(() => {

    const taskSubjects =
      tasks
        .map(
          (task) =>
            task?.subject
        )
        .filter(Boolean);


    return [
      ...new Set([
        ...DEFAULT_SUBJECTS,
        ...taskSubjects,
      ]),
    ];

  }, [tasks]);


  // ===================================================
  // FILTER TASKS
  // ===================================================

  const filteredTasks =
    useMemo(() => {

      const searchText =
        search
          .trim()
          .toLowerCase();


      return tasks.filter(
        (task) => {

          const title =
            String(
              task?.title || ""
            ).toLowerCase();


          const subject =
            String(
              task?.subject || ""
            ).toLowerCase();


          // -------------------------------------------
          // SEARCH
          // -------------------------------------------

          const matchesSearch =
            !searchText ||
            title.includes(
              searchText
            ) ||
            subject.includes(
              searchText
            );


          // -------------------------------------------
          // STATUS
          // -------------------------------------------

          let matchesStatus =
            true;


          if (
            statusFilter ===
            "pending"
          ) {

            matchesStatus =
              !task?.completed;

          }


          if (
            statusFilter ===
            "completed"
          ) {

            matchesStatus =
              Boolean(
                task?.completed
              );

          }


          // -------------------------------------------
          // SUBJECT
          // -------------------------------------------

          const matchesSubject =
            subjectFilter ===
              "all" ||
            task?.subject ===
              subjectFilter;


          return (
            matchesSearch &&
            matchesStatus &&
            matchesSubject
          );

        }
      );

    }, [
      tasks,
      search,
      statusFilter,
      subjectFilter,
    ]);


  // ===================================================
  // STATISTICS
  // ===================================================

  const totalTasks =
    tasks.length;


  const completedTasks =
    tasks.filter(
      (task) =>
        Boolean(
          task?.completed
        )
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


  // ===================================================
  // FORM INPUT
  // ===================================================

  const handleInput = (
    event
  ) => {

    const {
      name,
      value,
    } = event.target;


    setForm(
      (current) => ({
        ...current,
        [name]: value,
      })
    );

  };


  // ===================================================
  // OPEN CREATE MODAL
  // ===================================================

  const openCreateModal = () => {

    setEditingTask(null);

    setForm({
      ...EMPTY_FORM,
    });

    setError("");

    setShowModal(true);

  };


  // ===================================================
  // OPEN EDIT MODAL
  // ===================================================

  const openEditModal = (
    task
  ) => {

    setEditingTask(
      task
    );


    setForm({

      title:
        task?.title ||
        "",

      subject:
        task?.subject ||
        "Python",

      time:
        task?.time ||
        "",

    });


    setError("");

    setShowModal(true);

  };


  // ===================================================
  // CLOSE MODAL
  // ===================================================

  const closeModal = () => {

    if (saving) {
      return;
    }


    setShowModal(false);

    setEditingTask(null);

    setForm({
      ...EMPTY_FORM,
    });

    setError("");

  };


  // ===================================================
  // CREATE / UPDATE TASK
  // ===================================================

  const handleSubmit = async (
    event
  ) => {

    event.preventDefault();


    const title =
      form.title.trim();

    const subject =
      form.subject.trim();

    const time =
      form.time.trim();


    // -----------------------------------------------
    // VALIDATION
    // -----------------------------------------------

    if (
      !title ||
      !subject ||
      !time
    ) {

      setError(
        "Please fill all task fields."
      );

      return;

    }


    setSaving(true);

    setError("");


    // =================================================
    // UPDATE EXISTING TASK
    // =================================================

    if (editingTask) {

      const taskId =
        editingTask._id ||
        editingTask.id;


      if (!taskId) {

        setError(
          "Task ID is missing."
        );

        setSaving(false);

        return;

      }


      try {

        const result =
          await updateTaskAPI(
            taskId,
            {
              title,
              subject,
              time,
              completed:
                Boolean(
                  editingTask.completed
                ),
            }
          );


        if (!result?.success) {

          throw new Error(
            result?.message ||
            "Unable to update task."
          );

        }


        setTasks(
          (currentTasks) =>
            currentTasks.map(
              (task) => {

                const currentId =
                  task._id ||
                  task.id;


                if (
                  currentId !==
                  taskId
                ) {

                  return task;

                }


                return (
                  result.task || {
                    ...task,
                    title,
                    subject,
                    time,
                  }
                );

              }
            )
        );


        closeModal();


        // Notify Dashboard
        window.dispatchEvent(
          new Event(
            "learnova:tasks-updated"
          )
        );

      } catch (err) {

        console.error(
          "Update task error:",
          err
        );


        setError(
          err?.message ||
          "Unable to update task."
        );

      } finally {

        setSaving(false);

      }


      return;

    }


    // =================================================
    // CREATE NEW TASK
    // =================================================

    try {

      const result =
        await createTask({

          title,

          subject,

          time,

        });


      if (!result?.success) {

        throw new Error(
          result?.message ||
          "Unable to create task."
        );

      }


      if (result.task) {

        setTasks(
          (currentTasks) => [
            ...currentTasks,
            result.task,
          ]
        );

      }


      closeModal();


      // Notify Dashboard
      window.dispatchEvent(
        new Event(
          "learnova:tasks-updated"
        )
      );

    } catch (err) {

      console.error(
        "Create task error:",
        err
      );


      setError(
        err?.message ||
        "Unable to create task."
      );

    } finally {

      setSaving(false);

    }

  };


  // ===================================================
  // TOGGLE TASK
  // ===================================================

  const toggleTask = async (
    task
  ) => {

    const taskId =
      task?._id ||
      task?.id;


    if (!taskId) {

      setError(
        "Task ID is missing."
      );

      return;

    }


    const oldCompleted =
      Boolean(
        task.completed
      );


    const newCompleted =
      !oldCompleted;


    // -----------------------------------------------
    // OPTIMISTIC UPDATE
    // -----------------------------------------------

    setTasks(
      (currentTasks) =>
        currentTasks.map(
          (item) => {

            const currentId =
              item._id ||
              item.id;


            if (
              currentId !==
              taskId
            ) {

              return item;

            }


            return {
              ...item,
              completed:
                newCompleted,
            };

          }
        )
    );


    try {

      const result =
        await updateTaskAPI(
          taskId,
          {
            completed:
              newCompleted,
          }
        );


      if (!result?.success) {

        throw new Error(
          result?.message ||
          "Unable to update task."
        );

      }


      if (result.task) {

        setTasks(
          (currentTasks) =>
            currentTasks.map(
              (item) => {

                const currentId =
                  item._id ||
                  item.id;


                if (
                  currentId !==
                  taskId
                ) {

                  return item;

                }


                return result.task;

              }
            )
        );

      }


      window.dispatchEvent(
        new Event(
          "learnova:tasks-updated"
        )
      );

    } catch (err) {

      console.error(
        "Toggle task error:",
        err
      );


      // ---------------------------------------------
      // ROLLBACK
      // ---------------------------------------------

      setTasks(
        (currentTasks) =>
          currentTasks.map(
            (item) => {

              const currentId =
                item._id ||
                item.id;


              if (
                currentId !==
                taskId
              ) {

                return item;

              }


              return {
                ...item,
                completed:
                  oldCompleted,
              };

            }
          )
      );


      setError(
        err?.message ||
        "Unable to update task."
      );

    }

  };


  // ===================================================
  // DELETE TASK
  // ===================================================

  const handleDeleteTask = async (
    task
  ) => {

    const taskId =
      task?._id ||
      task?.id;


    if (!taskId) {

      setError(
        "Task ID is missing."
      );

      return;

    }


    const confirmed =
      window.confirm(
        `Delete "${task.title}"?`
      );


    if (!confirmed) {
      return;
    }


    try {

      setError("");


      const result =
        await deleteTaskAPI(
          taskId
        );


      if (!result?.success) {

        throw new Error(
          result?.message ||
          "Unable to delete task."
        );

      }


      setTasks(
        (currentTasks) =>
          currentTasks.filter(
            (item) => {

              const currentId =
                item._id ||
                item.id;


              return (
                currentId !==
                taskId
              );

            }
          )
      );


      if (
        editingTask &&
        (
          editingTask._id ===
            taskId ||
          editingTask.id ===
            taskId
        )
      ) {

        closeModal();

      }


      window.dispatchEvent(
        new Event(
          "learnova:tasks-updated"
        )
      );

    } catch (err) {

      console.error(
        "Delete task error:",
        err
      );


      setError(
        err?.message ||
        "Unable to delete task."
      );

    }

  };


  // ===================================================
  // LOADING SCREEN
  // ===================================================

  if (loading) {

    return (

      <main className="tasks-page">

        <div className="tasks-loading">

          <div className="tasks-loading-icon">
            <FiTarget />
          </div>

          <h2>
            Loading Tasks...
          </h2>

          <p>
            Fetching your study tasks.
          </p>

        </div>

      </main>

    );

  }


  // ===================================================
  // MAIN PAGE
  // ===================================================

  return (

    <main className="tasks-page">


      {/* =================================================
         HEADER
         ================================================= */}

      <div className="tasks-header">

        <div>

          <div className="tasks-eyebrow">
            ✓ LEARNOVA TASK MANAGEMENT
          </div>

          <h1>
            My Tasks
          </h1>

          <p>
            Manage your study tasks and
            track your daily progress.
          </p>

        </div>


        <button
          type="button"
          className="tasks-create-btn"
          onClick={
            openCreateModal
          }
        >

          <FiPlus />

          New Task

        </button>

      </div>


      {/* =================================================
         ERROR
         ================================================= */}

      {error && (

        <div className="tasks-error">

          <span>
            {error}
          </span>

          <button
            type="button"
            onClick={() =>
              setError("")
            }
            aria-label="Close error"
          >
            <FiX />
          </button>

        </div>

      )}


      {/* =================================================
         STATISTICS
         ================================================= */}

      <div className="tasks-stats">


        {/* TOTAL */}

        <div className="tasks-stat">

          <div className="tasks-stat-icon">
            <FiList />
          </div>

          <div className="tasks-stat-content">

            <span>
              Total Tasks
            </span>

            <strong>
              {totalTasks}
            </strong>

            <small>
              Study tasks
            </small>

          </div>

        </div>


        {/* COMPLETED */}

        <div className="tasks-stat">

          <div className="tasks-stat-icon completed">
            <FiCheck />
          </div>

          <div className="tasks-stat-content">

            <span>
              Completed
            </span>

            <strong>
              {completedTasks}
            </strong>

            <small>
              Tasks completed
            </small>

          </div>

        </div>


        {/* PENDING */}

        <div className="tasks-stat">

          <div className="tasks-stat-icon pending">
            <FiClock />
          </div>

          <div className="tasks-stat-content">

            <span>
              Pending
            </span>

            <strong>
              {pendingTasks}
            </strong>

            <small>
              Tasks remaining
            </small>

          </div>

        </div>


        {/* PROGRESS */}

        <div className="tasks-stat">

          <div className="tasks-stat-icon progress">
            %
          </div>

          <div className="tasks-stat-content">

            <span>
              Progress
            </span>

            <strong>
              {progress}%
            </strong>

            <small>
              Completion rate
            </small>

          </div>

        </div>

      </div>


      {/* =================================================
         SEARCH + FILTERS
         ================================================= */}

      <div className="tasks-filter-card">


        {/* SEARCH */}

        <div className="tasks-search">

          <FiSearch />

          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
          />

        </div>


        {/* STATUS */}

        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(
              event.target.value
            )
          }
        >

          <option value="all">
            All Status
          </option>

          <option value="pending">
            Pending
          </option>

          <option value="completed">
            Completed
          </option>

        </select>


        {/* SUBJECT */}

        <select
          value={subjectFilter}
          onChange={(event) =>
            setSubjectFilter(
              event.target.value
            )
          }
        >

          <option value="all">
            All Subjects
          </option>

          {subjects.map(
            (subject) => (

              <option
                value={subject}
                key={subject}
              >
                {subject}
              </option>

            )
          )}

        </select>

      </div>


      {/* =================================================
         LIST HEADER
         ================================================= */}

      <div className="tasks-list-header">

        <div>

          <h2>
            Study Tasks
          </h2>

          <p>
            {filteredTasks.length}{" "}
            {filteredTasks.length === 1
              ? "task"
              : "tasks"}{" "}
            found
          </p>

        </div>

      </div>


      {/* =================================================
         EMPTY STATE
         ================================================= */}

      {filteredTasks.length === 0 ? (

        <div className="tasks-empty">

          <div className="tasks-empty-icon">
            📚
          </div>

          <h2>
            No tasks found
          </h2>

          <p>

            {tasks.length === 0
              ? "Create your first study task to get started."
              : "Try changing your search or filters."
            }

          </p>


          {tasks.length === 0 && (

            <button
              type="button"
              className="tasks-create-btn"
              onClick={
                openCreateModal
              }
            >

              <FiPlus />

              Create First Task

            </button>

          )}

        </div>

      ) : (


        /* =================================================
           TASK LIST
           ================================================= */

        <section className="tasks-list">

          {filteredTasks.map(
            (task) => {

              const taskId =
                task._id ||
                task.id;


              return (

                <article
                  key={taskId}
                  className={
                    task.completed
                      ? "task-item completed"
                      : "task-item"
                  }
                >


                  {/* CHECKBOX */}

                  <button
                    type="button"
                    className={
                      task.completed
                        ? "task-checkbox completed"
                        : "task-checkbox"
                    }
                    onClick={() =>
                      toggleTask(task)
                    }
                    title={
                      task.completed
                        ? "Mark as pending"
                        : "Mark as completed"
                    }
                  >

                    {task.completed && (
                      <FiCheck />
                    )}

                  </button>


                  {/* TASK INFORMATION */}

                  <div className="task-info">

                    <h3
                      className={
                        task.completed
                          ? "task-completed"
                          : ""
                      }
                    >
                      {task.title}
                    </h3>

                    <div className="task-time">

                      <FiClock />

                      <span>
                        {task.time ||
                          "No time set"}
                      </span>

                    </div>

                  </div>


                  {/* SUBJECT */}

                  <span className="subject-tag">

                    <FiBookOpen />

                    {task.subject ||
                      "General"}

                  </span>


                  {/* EDIT */}

                  <button
                    type="button"
                    className="edit-task-btn"
                    onClick={() =>
                      openEditModal(
                        task
                      )
                    }
                    title="Edit task"
                  >

                    <FiEdit2 />

                  </button>


                  {/* DELETE */}

                  <button
                    type="button"
                    className="delete-task-btn"
                    onClick={() =>
                      handleDeleteTask(
                        task
                      )
                    }
                    title="Delete task"
                  >

                    <FiTrash2 />

                  </button>

                </article>

              );

            }
          )}

        </section>

      )}


      {/* =================================================
         CREATE / EDIT MODAL
         ================================================= */}

      {showModal && (

        <div
          className="task-modal-overlay"
          onMouseDown={(event) => {

            if (
              event.target ===
              event.currentTarget
            ) {

              closeModal();

            }

          }}
        >

          <div className="task-modal">


            {/* MODAL HEADER */}

            <div className="task-modal-header">

              <div>

                <h2>
                  {editingTask
                    ? "Edit Task"
                    : "Create New Task"}
                </h2>

                <p>
                  {editingTask
                    ? "Update your study task."
                    : "Add a new task to your study plan."}
                </p>

              </div>


              <button
                type="button"
                className="task-modal-close"
                onClick={
                  closeModal
                }
                disabled={saving}
                aria-label="Close"
              >

                <FiX />

              </button>

            </div>


            {/* MODAL FORM */}

            <form
              onSubmit={
                handleSubmit
              }
            >


              {/* TITLE */}

              <div className="task-form-group">

                <label htmlFor="task-title">
                  Task Title
                </label>

                <input
                  id="task-title"
                  name="title"
                  type="text"
                  placeholder="e.g. Python Functions Practice"
                  value={
                    form.title
                  }
                  onChange={
                    handleInput
                  }
                  disabled={saving}
                />

              </div>


              {/* SUBJECT */}

              <div className="task-form-group">

                <label htmlFor="task-subject">
                  Subject
                </label>

                <select
                  id="task-subject"
                  name="subject"
                  value={
                    form.subject
                  }
                  onChange={
                    handleInput
                  }
                  disabled={saving}
                >

                  {subjects.map(
                    (subject) => (

                      <option
                        value={subject}
                        key={subject}
                      >
                        {subject}
                      </option>

                    )
                  )}

                </select>

              </div>


              {/* TIME */}

              <div className="task-form-group">

                <label htmlFor="task-time">
                  Study Time
                </label>

                <input
                  id="task-time"
                  name="time"
                  type="text"
                  placeholder="e.g. 7:00 PM - 8:00 PM"
                  value={
                    form.time
                  }
                  onChange={
                    handleInput
                  }
                  disabled={saving}
                />

              </div>


              {/* MODAL ACTIONS */}

              <div className="task-modal-actions">

                <button
                  type="button"
                  className="task-cancel-btn"
                  onClick={
                    closeModal
                  }
                  disabled={saving}
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  className="task-save-btn"
                  disabled={saving}
                >

                  {saving ? (

                    "Saving..."

                  ) : editingTask ? (

                    <>
                      <FiCheck />
                      Save Changes
                    </>

                  ) : (

                    <>
                      <FiPlus />
                      Create Task
                    </>

                  )}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </main>

  );

}


export default TasksPage;