import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

// =====================================================
// GET CURRENT USER
// =====================================================

const getCurrentUser = () => {
  const possibleKeys = [
    "user",
    "currentUser",
    "learnova_user",
    "authUser",
    "loggedInUser",
    "userData",
  ];

  for (const key of possibleKeys) {
    try {
      const value = localStorage.getItem(key);

      if (!value) {
        continue;
      }

      const parsed = JSON.parse(value);

      if (
        parsed &&
        typeof parsed === "object"
      ) {
        return parsed;
      }
    } catch {
      // Ignore invalid JSON
    }
  }

  return null;
};


// =====================================================
// GET CURRENT USER ID
// =====================================================

const getUserIdentifier = () => {
  const user = getCurrentUser();

  if (!user) {
    return null;
  }

  const identifier =
    user._id ||
    user.id ||
    user.userId ||
    user.email;

  if (!identifier) {
    return null;
  }

  return String(identifier);
};


// =====================================================
// GET USER-SPECIFIC SUBJECT KEY
// =====================================================

const getSubjectStorageKey = () => {
  const userId = getUserIdentifier();

  if (!userId) {
    return null;
  }

  return `learnova_subjects_${userId}`;
};


// =====================================================
// LOAD CURRENT USER SUBJECTS
// =====================================================

const getCurrentSubjects = () => {
  try {
    const storageKey = getSubjectStorageKey();

    // No logged-in user
    if (!storageKey) {
      return [];
    }

    const saved = localStorage.getItem(storageKey);

    if (!saved) {
      return [];
    }

    const parsed = JSON.parse(saved);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((item) => {
        if (
          item &&
          typeof item === "object"
        ) {
          return {
            id: item.id,
            name: String(
              item.name ||
              item.subject ||
              item.title ||
              ""
            ).trim(),
          };
        }

        return {
          id: String(item),
          name: String(item || "").trim(),
        };
      })
      .filter((item) => item.name);

  } catch (error) {
    console.error(
      "Error loading current user subjects:",
      error
    );

    return [];
  }
};


// =====================================================
// NORMALIZE SUBJECT
// =====================================================

const normalizeSubject = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();


// =====================================================
// SUBJECT ALIASES
// =====================================================

const SUBJECT_ALIASES = {
  python: ["python"],

  "artificial intelligence": [
    "artificial intelligence",
    "aiml",
    "ai",
  ],

  dbms: ["dbms"],

  "data structures": [
    "data structures",
    "data structure",
    "dsa",
  ],

  "software project management": [
    "software project management",
    "spm",
  ],

  "operating system": [
    "operating system",
    "operating systems",
    "os",
  ],
};


// =====================================================
// MATCH SUBJECT WITH TASK
// =====================================================

const subjectMatchesTask = (
  subjectName,
  taskSubject
) => {
  const subjectKey =
    normalizeSubject(subjectName);

  const taskKey =
    normalizeSubject(taskSubject);

  if (!subjectKey || !taskKey) {
    return false;
  }

  const aliases =
    SUBJECT_ALIASES[subjectKey];

  if (aliases) {
    return aliases.includes(taskKey);
  }

  return subjectKey === taskKey;
};


// =====================================================
// SUBJECT PROGRESS COMPONENT
// =====================================================

function SubjectProgress({
  studyTasks = [],
}) {
  const navigate = useNavigate();

  // ===================================================
  // CURRENT USER
  // ===================================================

  const [userKey, setUserKey] =
    useState(() => getUserIdentifier());


  // ===================================================
  // CURRENT USER SUBJECTS
  // ===================================================

  const [currentSubjects, setCurrentSubjects] =
    useState(() => getCurrentSubjects());


  // ===================================================
  // REFRESH USER + SUBJECTS
  // ===================================================

  useEffect(() => {
    const refreshUserData = () => {
      const newUserKey =
        getUserIdentifier();

      setUserKey(newUserKey);

      // IMPORTANT:
      // New user ke subjects hi load honge.
      if (!newUserKey) {
        setCurrentSubjects([]);
        return;
      }

      setCurrentSubjects(
        getCurrentSubjects()
      );
    };


    // Login / logout
    window.addEventListener(
      "learnova:user-updated",
      refreshUserData
    );

    window.addEventListener(
      "learnova:auth-changed",
      refreshUserData
    );


    // Subjects page se update
    window.addEventListener(
      "learnova:subjects-updated",
      refreshUserData
    );


    // Other tab
    window.addEventListener(
      "storage",
      refreshUserData
    );


    // Browser tab focus
    window.addEventListener(
      "focus",
      refreshUserData
    );


    return () => {
      window.removeEventListener(
        "learnova:user-updated",
        refreshUserData
      );

      window.removeEventListener(
        "learnova:auth-changed",
        refreshUserData
      );

      window.removeEventListener(
        "learnova:subjects-updated",
        refreshUserData
      );

      window.removeEventListener(
        "storage",
        refreshUserData
      );

      window.removeEventListener(
        "focus",
        refreshUserData
      );
    };
  }, []);


  // ===================================================
  // SUBJECT PROGRESS
  // ===================================================

  const subjectProgress = useMemo(() => {
    // IMPORTANT:
    // Agar user login nahi hai,
    // kuch bhi show nahi karna.

    if (!userKey) {
      return [];
    }


    const subjectMap = {};


    // -------------------------------------------------
    // ONLY CURRENT USER SUBJECTS
    // -------------------------------------------------

    currentSubjects.forEach((subject) => {
      const key =
        normalizeSubject(subject.name);

      if (!key) {
        return;
      }

      subjectMap[key] = {
        name: subject.name,
        totalTasks: 0,
        completedTasks: 0,
      };
    });


    // -------------------------------------------------
    // ONLY TASKS MATCHING CURRENT SUBJECTS
    // -------------------------------------------------

    studyTasks.forEach((task) => {
      const taskSubject =
        String(
          task?.subject || ""
        ).trim();

      if (!taskSubject) {
        return;
      }


      // ------------------------------------------------
      // OLD SUBJECT / UNKNOWN SUBJECT
      // ------------------------------------------------

      const matchingSubject =
        currentSubjects.find(
          (subject) =>
            subjectMatchesTask(
              subject.name,
              taskSubject
            )
        );


      // Old user's subject/task:
      // completely ignore it.
      if (!matchingSubject) {
        return;
      }


      const key =
        normalizeSubject(
          matchingSubject.name
        );


      if (!subjectMap[key]) {
        return;
      }


      subjectMap[key].totalTasks += 1;


      if (
        task.completed === true
      ) {
        subjectMap[key].completedTasks += 1;
      }
    });


    // -------------------------------------------------
    // CALCULATE PROGRESS
    // -------------------------------------------------

    return Object.values(subjectMap)
      .map((subject) => {
        const progress =
          subject.totalTasks === 0
            ? 0
            : Math.round(
                (
                  subject.completedTasks /
                  subject.totalTasks
                ) * 100
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

  }, [
    studyTasks,
    currentSubjects,
    userKey,
  ]);


  // ===================================================
  // EMPTY STATE
  // ===================================================

  if (
    !userKey ||
    currentSubjects.length === 0
  ) {
    return (
      <section className="subject-progress">

        <div className="progress-header">

          <div>
            <h2>
              Subject Progress
            </h2>

            <p>
              Based on your completed
              study tasks
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              navigate("/subjects")
            }
          >
            Add Subject →
          </button>

        </div>


        <div
          className="subject-empty"
          style={{
            padding: "45px 30px",
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
            Create a subject to start
            tracking your progress.
          </p>


          <button
            type="button"
            onClick={() =>
              navigate("/subjects")
            }
            style={{
              marginTop: "12px",
              padding: "10px 18px",
              border: "none",
              borderRadius: "10px",
              cursor: "pointer",
              background: "#635bff",
              color: "#fff",
              fontWeight: 700,
            }}
          >
            Create Subject
          </button>

        </div>

      </section>
    );
  }


  // ===================================================
  // MAIN UI
  // ===================================================

  return (
    <section className="subject-progress">

      <div className="progress-header">

        <div>

          <h2>
            Subject Progress
          </h2>

          <p>
            Based on your completed
            study tasks
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


      <div className="subject-grid">

        {subjectProgress.map(
          (subject) => (
            <div
              className="subject-card"
              key={subject.name}
            >

              <div className="subject-info">

                <span>
                  {subject.name}
                </span>

                <strong>
                  {subject.progress}%
                </strong>

              </div>


              <div
                className="progress-bar"
                aria-label={
                  `${subject.name} progress`
                }
              >

                <div
                  className="progress-fill"
                  style={{
                    width:
                      `${subject.progress}%`,
                  }}
                />

              </div>


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