import { useState } from "react";


// =====================================================
// CREATE PLAN MODAL
// =====================================================
// Ye component 2 kaam karta hai:
//
// 1. New Study Task create karna
// 2. Existing Study Task edit karna
//
// editingTask = null
//       ↓
// Create mode
//
// editingTask = task
//       ↓
// Edit mode
// =====================================================

function CreatePlanModal({
  onClose,
  onAddTask,
  editingTask = null,
  onUpdateTask,
}) {


  // =====================================================
  // FORM INITIAL VALUES
  // =====================================================
  // Agar edit mode hai to existing task ki values
  // form me directly load hongi.
  //
  // Agar new task hai to fields empty rahengi.
  // =====================================================

  const [title, setTitle] = useState(
    editingTask?.title ?? ""
  );

  const [subject, setSubject] = useState(
    editingTask?.subject ?? ""
  );

  const [time, setTime] = useState(
    editingTask?.time ?? ""
  );


  // =====================================================
  // FORM SUBMIT
  // =====================================================

  const handleSubmit = (e) => {

    e.preventDefault();


    // ===================================================
    // VALIDATION
    // ===================================================

    if (!title.trim()) {
      alert("Please enter task title.");
      return;
    }

    if (!subject) {
      alert("Please select a subject.");
      return;
    }

    if (!time.trim()) {
      alert("Please enter study time.");
      return;
    }


    // ===================================================
    // EDIT EXISTING TASK
    // ===================================================

    if (editingTask) {

      const updatedTask = {
        ...editingTask,

        title: title.trim(),

        subject: subject,

        time: time.trim(),
      };


      // App.jsx ke updateTask function ko call
      onUpdateTask(updatedTask);

      return;
    }


    // ===================================================
    // CREATE NEW TASK
    // ===================================================

    const newTask = {

      title: title.trim(),

      subject: subject,

      time: time.trim(),

      completed: false,
    };


    // App.jsx ke addTask function ko call
    onAddTask(newTask);

  };


  // =====================================================
  // CLOSE MODAL
  // =====================================================

  const handleClose = () => {

    onClose();

  };


  // =====================================================
  // MODAL UI
  // =====================================================

  return (

    <div
      className="modal-overlay"
      onClick={handleClose}
    >


      {/* =================================================
         MODAL BOX

         Modal ke andar click karne par modal close nahi hoga.
         ================================================= */}

      <div
        className="create-plan-modal"
        onClick={(e) => e.stopPropagation()}
      >


        {/* =================================================
           MODAL HEADER
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


          {/* =================================================
             CLOSE BUTTON
             ================================================= */}

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
            >

              <option value="">
                Select Subject
              </option>

              <option value="Python">
                Python
              </option>

              <option value="AI">
                AI
              </option>

              <option value="SPM">
                SPM
              </option>

              <option value="DBMS">
                DBMS
              </option>

              <option value="DSA">
                DSA
              </option>

              <option value="OS">
                OS
              </option>

              <option value="Revision">
                Revision
              </option>

            </select>

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
             MODAL ACTIONS
             ================================================= */}

          <div className="modal-actions">


            {/* CANCEL BUTTON */}

            <button
              type="button"
              className="cancel-btn"
              onClick={handleClose}
            >
              Cancel
            </button>


            {/* ADD / UPDATE BUTTON */}

            <button
              type="submit"
              className="add-task-btn"
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