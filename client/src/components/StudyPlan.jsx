// =====================================================
// LEARNOVA AI
// STUDY PLAN COMPONENT
// =====================================================
//
// Dashboard par today's study tasks display karta hai.
//
// Features:
// 1. MongoDB tasks display
// 2. Complete / incomplete task
// 3. Edit task
// 4. Delete task
// 5. Empty state
// 6. MongoDB _id support
//
// IMPORTANT:
// MongoDB task ka ID normally "_id" hota hai.
// Isliye hum "_id || id" use kar rahe hain.
//
// =====================================================


function StudyPlan({
  studyTasks = [],
  toggleTask,
  deleteTask,
  onEditTask,
}) {


  // ===================================================
  // EMPTY STATE
  // ===================================================

  if (studyTasks.length === 0) {

    return (

      <section className="study-plan">


        {/* =============================================
           HEADER
           ============================================= */}

        <div className="section-header">

          <div>

            <h2>
              📅 Today's Study Plan
            </h2>

            <p>
              {new Date().toLocaleDateString(
                "en-IN",
                {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                }
              )}
            </p>

          </div>

        </div>


        {/* =============================================
           EMPTY MESSAGE
           ============================================= */}

        <div className="empty-study-plan">

          <div className="empty-icon">
            📚
          </div>

          <h3>
            No study tasks yet
          </h3>

          <p>
            Create a new study task to get started.
          </p>

        </div>


        {/* =============================================
           FULL PLAN BUTTON
           ============================================= */}

        <button
          type="button"
          className="view-plan-btn"
          onClick={() => {
            window.location.href =
              "/study-plan";
          }}
        >
          View Full Plan →
        </button>

      </section>

    );

  }


  // ===================================================
  // MAIN STUDY PLAN
  // ===================================================

  return (

    <section className="study-plan">


      {/* =================================================
         HEADER
         ================================================= */}

      <div className="section-header">

        <div>

          <h2>
            📅 Today's Study Plan
          </h2>

          <p>
            {new Date().toLocaleDateString(
              "en-IN",
              {
                day: "numeric",
                month: "long",
                year: "numeric",
              }
            )}
          </p>

        </div>

      </div>


      {/* =================================================
         TASK LIST
         ================================================= */}

      <div className="study-tasks">

        {studyTasks.map((task) => {


          // =================================================
          // IMPORTANT:
          // MongoDB uses "_id"
          // Fallback "id" is kept for frontend-created data.
          // =================================================

          const taskId =
            task._id ||
            task.id;


          return (

            <div
              className={
                task.completed
                  ? "study-task completed"
                  : "study-task"
              }
              key={taskId}
            >


              {/* =========================================
                 CHECKBOX
                 ========================================= */}

              <button
                type="button"
                className={
                  task.completed
                    ? "task-checkbox completed"
                    : "task-checkbox"
                }

                onClick={() => {

                  // ---------------------------------------
                  // IMPORTANT FIX
                  // _id is used for MongoDB tasks.
                  // ---------------------------------------

                  if (!taskId) {

                    console.error(
                      "Task ID missing:",
                      task
                    );

                    return;

                  }


                  toggleTask(taskId);

                }}

                aria-label={
                  task.completed
                    ? `Mark ${task.title} as incomplete`
                    : `Mark ${task.title} as complete`
                }

                title={
                  task.completed
                    ? "Mark as incomplete"
                    : "Mark as complete"
                }
              >

                {task.completed && "✓"}

              </button>


              {/* =========================================
                 TASK INFORMATION
                 ========================================= */}

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

                <span>
                  {task.time ||
                    "Time not specified"}
                </span>

              </div>


              {/* =========================================
                 SUBJECT
                 ========================================= */}

              <span className="subject-tag">

                {task.subject ||
                  "General"}

              </span>


              {/* =========================================
                 EDIT BUTTON
                 ========================================= */}

              <button
                type="button"
                className="edit-task-btn"

                onClick={() => {

                  if (onEditTask) {

                    onEditTask(task);

                  }

                }}

                aria-label={
                  `Edit ${task.title}`
                }

                title="Edit task"
              >
                ✏️
              </button>


              {/* =========================================
                 DELETE BUTTON
                 ========================================= */}

              <button
                type="button"
                className="delete-task-btn"

                onClick={() => {

                  // ---------------------------------------
                  // Confirmation
                  // ---------------------------------------

                  const confirmDelete =
                    window.confirm(
                      `Delete "${task.title}"?`
                    );


                  if (!confirmDelete) {
                    return;
                  }


                  // ---------------------------------------
                  // IMPORTANT:
                  // MongoDB _id is passed.
                  // ---------------------------------------

                  if (!taskId) {

                    console.error(
                      "Task ID missing:",
                      task
                    );

                    return;

                  }


                  deleteTask(taskId);

                }}

                aria-label={
                  `Delete ${task.title}`
                }

                title="Delete task"
              >
                🗑️
              </button>

            </div>

          );

        })}

      </div>


      {/* =================================================
         VIEW FULL PLAN
         ================================================= */}

      <button
        type="button"
        className="view-plan-btn"

        onClick={() => {

          window.location.href =
            "/study-plan";

        }}
      >
        View Full Plan →
      </button>

    </section>

  );

}


// =====================================================
// EXPORT
// =====================================================

export default StudyPlan;