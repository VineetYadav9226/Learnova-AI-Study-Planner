import { useEffect, useState } from "react";

// =====================================================
// STORAGE KEY
// =====================================================

const SUBJECTS_STORAGE_KEY = "learnova_subjects";

// =====================================================
// GET CURRENT SUBJECTS
// =====================================================

function getCurrentSubjects() {
  try {
    const saved = localStorage.getItem(
      SUBJECTS_STORAGE_KEY
    );

    if (!saved) {
      return [];
    }

    const parsed = JSON.parse(saved);

    if (!Array.isArray(parsed)) {
      return [];
    }

    const names = parsed
      .map((item) =>
        String(item?.name || "").trim()
      )
      .filter(Boolean);

    // Remove duplicate subjects
    return names.filter(
      (name, index, array) =>
        index ===
        array.findIndex(
          (item) =>
            item.toLowerCase() ===
            name.toLowerCase()
        )
    );
  } catch (error) {
    console.error(
      "Unable to load subjects:",
      error
    );

    return [];
  }
}

// =====================================================
// CREATE PLAN MODAL
// =====================================================

function CreatePlanModal({
  onClose,
  onAddTask,
  editingTask = null,
  onUpdateTask,
}) {
  // ===================================================
  // CURRENT SUBJECTS
  // ===================================================

  const [subjects, setSubjects] = useState(
    () => getCurrentSubjects()
  );

  // ===================================================
  // FORM STATES
  // ===================================================

  const [title, setTitle] = useState(
    editingTask?.title ?? ""
  );

  const [subject, setSubject] = useState(
    editingTask?.subject ?? ""
  );

  const [time, setTime] = useState(
    editingTask?.time ?? ""
  );

  // ===================================================
  // LISTEN FOR SUBJECT UPDATES
  // ===================================================

  useEffect(() => {
    const refreshSubjects = () => {
      setSubjects(getCurrentSubjects());
    };

    window.addEventListener(
      "learnova:subjects-updated",
      refreshSubjects
    );

    window.addEventListener(
      "storage",
      refreshSubjects
    );

    window.addEventListener(
      "focus",
      refreshSubjects
    );

    return () => {
      window.removeEventListener(
        "learnova:subjects-updated",
        refreshSubjects
      );

      window.removeEventListener(
        "storage",
        refreshSubjects
      );

      window.removeEventListener(
        "focus",
        refreshSubjects
      );
    };
  }, []);

  // ===================================================
  // FORM SUBMIT
  // ===================================================

  const handleSubmit = (e) => {
    e.preventDefault();

    // -------------------------------------------------
    // TITLE VALIDATION
    // -------------------------------------------------

    if (!title.trim()) {
      alert("Please enter task title.");
      return;
    }

    // -------------------------------------------------
    // SUBJECT VALIDATION
    // -------------------------------------------------

    if (!subject.trim()) {
      alert("Please select a subject.");
      return;
    }

    // -------------------------------------------------
    // MAKE SURE SUBJECT IS CURRENT
    // -------------------------------------------------

    const currentSubject = subjects.find(
      (item) =>
        item.toLowerCase() ===
        subject.trim().toLowerCase()
    );

    if (!currentSubject) {
      alert(
        "Please select a subject from the current subject list."
      );
      return;
    }

    // -------------------------------------------------
    // TIME VALIDATION
    // -------------------------------------------------

    if (!time.trim()) {
      alert("Please enter study time.");
      return;
    }

    // =================================================
    // EDIT EXISTING TASK
    // =================================================

    if (editingTask) {
      const updatedTask = {
        ...editingTask,

        title: title.trim(),

        subject: currentSubject,

        time: time.trim(),
      };

      onUpdateTask(updatedTask);

      return;
    }

    // =================================================
    // CREATE NEW TASK
    // =================================================

    const newTask = {
      title: title.trim(),

      subject: currentSubject,

      time: time.trim(),

      completed: false,
    };

    onAddTask(newTask);
  };

  // ===================================================
  // CLOSE MODAL
  // ===================================================

  const handleClose = () => {
    onClose();
  };

  // ===================================================
  // MODAL UI
  // ===================================================

  return (
    <div
      className="modal-overlay"
      onClick={handleClose}
    >
      {/* =================================================
          MODAL BOX
         ================================================= */}

      <div
        className="create-plan-modal"
        onClick={(e) =>
          e.stopPropagation()
        }
      >
        {/* =================================================
            HEADER
           ================================================= */}

        <div className="modal-header">
          <div>
            <h2>
              {editingTask
                ? "Edit Study Task"
                : "Create New Study Task"}
            </h2>

            <p>
              {editingTask
                ? "Update your study task details."
                : "Add a new task to your study plan."}
            </p>
          </div>

          <button
            type="button"
            className="modal-close"
            onClick={handleClose}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        {/* =================================================
            FORM
           ================================================= */}

        <form onSubmit={handleSubmit}>
          {/* =================================================
              TASK TITLE
             ================================================= */}

          <div className="form-group">
            <label htmlFor="task-title">
              Task Title
            </label>

            <input
              id="task-title"
              type="text"
              placeholder="e.g. Python – Loops"
              value={title}
              onChange={(e) =>
                setTitle(e.target.value)
              }
              autoFocus
            />
          </div>

          {/* =================================================
              SUBJECT
             ================================================= */}

          <div className="form-group">
            <label htmlFor="task-subject">
              Subject
            </label>

            <select
              id="task-subject"
              value={subject}
              onChange={(e) =>
                setSubject(e.target.value)
              }
              disabled={
                subjects.length === 0
              }
              required
            >
              <option value="">
                Select Subject
              </option>

              {subjects.map((item) => (
                <option
                  key={item}
                  value={item}
                >
                  {item}
                </option>
              ))}
            </select>

            {/* ------------------------------------------------
                EMPTY SUBJECT MESSAGE
               ------------------------------------------------ */}

            {subjects.length === 0 && (
              <small
                style={{
                  display: "block",
                  marginTop: "8px",
                  color: "#ef4444",
                }}
              >
                No subjects found. Please
                create a subject first.
              </small>
            )}
          </div>

          {/* =================================================
              STUDY TIME
             ================================================= */}

          <div className="form-group">
            <label htmlFor="study-time">
              Study Time
            </label>

            <input
              id="study-time"
              type="text"
              placeholder="e.g. 7:00 PM – 8:00 PM"
              value={time}
              onChange={(e) =>
                setTime(e.target.value)
              }
            />
          </div>

          {/* =================================================
              ACTIONS
             ================================================= */}

          <div className="modal-actions">
            {/* CANCEL */}

            <button
              type="button"
              className="cancel-btn"
              onClick={handleClose}
            >
              Cancel
            </button>

            {/* ADD / UPDATE */}

            <button
              type="submit"
              className="add-task-btn"
              disabled={
                subjects.length === 0
              }
            >
              {editingTask
                ? "✓ Update Task"
                : "+ Add Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreatePlanModal;