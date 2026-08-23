// =====================================================
// LEARNOVA AI
// SUBJECT PROGRESS COMPONENT
// =====================================================

import { useNavigate } from "react-router-dom";

function SubjectProgress({ studyTasks = [] }) {
  const navigate = useNavigate();

  // ===================================================
  // GET UNIQUE SUBJECTS FROM ACTUAL TASKS
  // ===================================================

  const subjectMap = {};

  studyTasks.forEach((task) => {
    const subject =
      task.subject?.trim();

    if (!subject) {
      return;
    }

    const key =
      subject.toLowerCase();

    if (!subjectMap[key]) {
      subjectMap[key] = {
        name: subject,
        totalTasks: 0,
        completedTasks: 0,
      };
    }

    subjectMap[key].totalTasks += 1;

    if (task.completed) {
      subjectMap[key].completedTasks += 1;
    }
  });

  // ===================================================
  // CALCULATE PROGRESS
  // ===================================================

  const subjectProgress =
    Object.values(subjectMap)
      .map((subject) => {
        const progress =
          subject.totalTasks === 0
            ? 0
            : Math.round(
                (subject.completedTasks /
                  subject.totalTasks) *
                  100
              );

        return {
          ...subject,
          progress,
        };
      })
      .sort(
        (a, b) =>
          b.progress - a.progress
      );

  // ===================================================
  // EMPTY STATE
  // ===================================================

  if (subjectProgress.length === 0) {
    return (
      <section className="subject-progress">

        <div className="progress-header">
          <div>
            <h2>
              Subject Progress
            </h2>

            <p>
              Your subject-wise learning progress
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              navigate("/subjects")
            }
          >
            View All →
          </button>
        </div>

        <div
          className="subject-empty"
          style={{
            padding: "30px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: "42px",
              marginBottom: "10px",
            }}
          >
            📚
          </div>

          <h3>
            No subjects yet
          </h3>

          <p>
            Create your first study task
            to start tracking subject progress.
          </p>

          <button
            type="button"
            onClick={() =>
              navigate("/tasks")
            }
            style={{
              marginTop: "12px",
              padding:
                "10px 18px",
              border: "none",
              borderRadius: "10px",
              cursor: "pointer",
            }}
          >
            Create Task
          </button>
        </div>

      </section>
    );
  }

  // ===================================================
  // UI
  // ===================================================

  return (
    <section className="subject-progress">

      {/* HEADER */}

      <div className="progress-header">

        <div>

          <h2>
            Subject Progress
          </h2>

          <p>
            Based on your completed study tasks
          </p>

        </div>

        <button
          type="button"
          onClick={() =>
            navigate("/subjects")
          }
        >
          View All →
        </button>

      </div>


      {/* SUBJECT GRID */}

      <div className="subject-grid">

        {subjectProgress.map(
          (subject) => (
            <div
              className="subject-card"
              key={subject.name}
            >

              {/* SUBJECT INFO */}

              <div className="subject-info">

                <span>
                  {subject.name}
                </span>

                <strong>
                  {subject.progress}%
                </strong>

              </div>


              {/* PROGRESS BAR */}

              <div
                className="progress-bar"
                aria-label={`${subject.name} progress`}
              >

                <div
                  className="progress-fill"
                  style={{
                    width:
                      `${subject.progress}%`,
                  }}
                />

              </div>


              {/* TASK COUNT */}

              <small>
                {subject.completedTasks}
                {" "}
                completed /
                {" "}
                {subject.totalTasks}
                {" "}
                tasks
              </small>

            </div>
          )
        )}

      </div>

    </section>
  );
}

export default SubjectProgress;