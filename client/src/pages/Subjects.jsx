import { useEffect, useMemo, useState } from "react";
import {
  FiBookOpen,
  FiPlus,
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiX,
  FiCheck,
  FiExternalLink,
} from "react-icons/fi";

import { getTasks } from "../services/taskService";

// =====================================================
// LEARNOVA AI - SUBJECTS
// USER-SPECIFIC SUBJECT STORAGE
// =====================================================

// IMPORTANT:
// Subjects ko ab ek common key:
// "learnova_subjects"
// par save nahi kiya jayega.
//
// Har user ki alag key hogi:
//
// learnova_subjects_<USER_ID>
//
// Example:
//
// learnova_subjects_12345
// learnova_subjects_67890
//
// Isse ek user ka subject dusre user ko nahi dikhega.
// =====================================================


// =====================================================
// DEFAULT SUBJECTS
// =====================================================
//
// IMPORTANT:
// Inhe automatic subjects ki tarah load nahi kar rahe.
// New user ke paas initially empty subjects honge.
//
// User khud "Add Subject" se subject create karega.
// =====================================================

const COLORS = [
  "#635bff",
  "#0ea5e9",
  "#10b981",
  "#f59e0b",
  "#ec4899",
  "#8b5cf6",
];

// =====================================================
// AI RESOURCE CONFIG
// =====================================================

const AI_API_URL = "http://localhost:5000";

const getResourceStorageKey = (userId) =>
  userId
    ? `learnova_resources_${userId}`
    : null;

const loadUserResources = (userId) => {
  try {
    const key = getResourceStorageKey(userId);

    if (!key) return [];

    const saved = localStorage.getItem(key);

    if (!saved) return [];

    const parsed = JSON.parse(saved);

    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("User resources loading error:", error);
    return [];
  }
};

const saveUserResources = (userId, resources) => {
  try {
    const key = getResourceStorageKey(userId);

    if (!key) return;

    localStorage.setItem(key, JSON.stringify(resources));

    window.dispatchEvent(
      new Event("learnova:resources-updated")
    );
  } catch (error) {
    console.error("User resources save error:", error);
  }
};



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
// NORMALIZE SUBJECT
// =====================================================

const normalizeSubject = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();


// =====================================================
// SUBJECT MATCHING
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
// GET CURRENT USER
// =====================================================
//
// Different projects me user alag localStorage key
// me store ho sakta hai.
//
// Isliye hum common keys check kar rahe hain.
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
      const value =
        localStorage.getItem(key);

      if (!value) {
        continue;
      }

      const parsed =
        JSON.parse(value);

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
// GET USER IDENTIFIER
// =====================================================
//
// Priority:
//
// 1. _id
// 2. id
// 3. userId
// 4. email
//
// Email ko fallback identifier ke roop me use kiya
// ja raha hai.
// =====================================================

const getUserIdentifier = () => {
  const user =
    getCurrentUser();

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
// USER-SPECIFIC STORAGE KEY
// =====================================================

const getSubjectStorageKey = () => {
  const userId =
    getUserIdentifier();

  if (!userId) {
    return null;
  }

  return `learnova_subjects_${userId}`;
};


// =====================================================
// LOAD USER SUBJECTS
// =====================================================

const loadUserSubjects = () => {
  try {
    const storageKey =
      getSubjectStorageKey();

    // Current user nahi mila
    // to empty array return karo.
    if (!storageKey) {
      return [];
    }

    const saved =
      localStorage.getItem(
        storageKey
      );

    if (!saved) {
      return [];
    }

    const parsed =
      JSON.parse(saved);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed;
  } catch (error) {
    console.error(
      "User subjects loading error:",
      error
    );

    return [];
  }
};


// =====================================================
// MAIN COMPONENT
// =====================================================

function Subjects() {

  // ===================================================
  // CURRENT USER KEY
  // ===================================================

  const [userKey, setUserKey] =
    useState(() =>
      getUserIdentifier()
    );


  // ===================================================
  // SUBJECTS
  // ===================================================

  const [subjects, setSubjects] =
    useState(() =>
      loadUserSubjects()
    );


  // ===================================================
  // TASKS
  // ===================================================

  const [tasks, setTasks] =
    useState([]);

  const [tasksLoading, setTasksLoading] =
    useState(true);

  // ===================================================
  // AI RESOURCES
  // ===================================================

  const [resources, setResources] =
    useState(() =>
      loadUserResources(
        getUserIdentifier()
      )
    );

  const [generatingResources, setGeneratingResources] =
    useState(false);

  const [resourceError, setResourceError] =
    useState("");

  // ===================================================
  // SEARCH
  // ===================================================

  const [search, setSearch] =
    useState("");


  // ===================================================
  // MODAL
  // ===================================================

  const [showModal, setShowModal] =
    useState(false);

  const [editingSubject, setEditingSubject] =
    useState(null);


  // ===================================================
  // FORM
  // ===================================================

  const [form, setForm] =
    useState({
      name: "",
      description: "",
      color: COLORS[0],
    });


  // =====================================================
  // CHECK CURRENT USER
  // =====================================================
  //
  // Login/logout ke baad user change ho sakta hai.
  //
  // Isliye storage event aur custom auth events listen
  // kar rahe hain.
  // =====================================================

  useEffect(() => {

    const refreshCurrentUser = () => {

      const newUserKey =
        getUserIdentifier();

      setUserKey(
        newUserKey
      );

      // User change hone par
      // usi user ke subjects load karo.
      setSubjects(
        newUserKey
          ? loadUserSubjects()
          : []
      );

      setResources(
        newUserKey
          ? loadUserResources(newUserKey)
          : []
      );

    };


    window.addEventListener(
      "storage",
      refreshCurrentUser
    );


    window.addEventListener(
      "learnova:user-updated",
      refreshCurrentUser
    );


    window.addEventListener(
      "learnova:auth-changed",
      refreshCurrentUser
    );


    return () => {

      window.removeEventListener(
        "storage",
        refreshCurrentUser
      );

      window.removeEventListener(
        "learnova:user-updated",
        refreshCurrentUser
      );

      window.removeEventListener(
        "learnova:auth-changed",
        refreshCurrentUser
      );

    };

  }, []);


  // =====================================================
  // SAVE SUBJECTS FOR CURRENT USER
  // =====================================================

  useEffect(() => {

    if (!userKey) {
      return;
    }

    try {

      const storageKey =
        `learnova_subjects_${userKey}`;

      localStorage.setItem(
        storageKey,
        JSON.stringify(subjects)
      );

      window.dispatchEvent(
        new Event("learnova:subjects-updated")
      );

    } catch (error) {

      console.error(
        "User subjects save error:",
        error
      );

    }

  }, [
    subjects,
    userKey,
  ]);


  // =====================================================
  // SAVE / REFRESH AI RESOURCES
  // =====================================================

  useEffect(() => {
    if (!userKey) return;

    saveUserResources(userKey, resources);

    const handleResourcesUpdated = () => {
      setResources(loadUserResources(userKey));
    };

    window.addEventListener(
      "learnova:resources-updated",
      handleResourcesUpdated
    );

    return () => {
      window.removeEventListener(
        "learnova:resources-updated",
        handleResourcesUpdated
      );
    };
  }, [resources, userKey]);


  // =====================================================
  // LOAD REAL TASKS
  // =====================================================

  useEffect(() => {

    let active = true;


    const loadTasks = async () => {

      try {

        const result =
          await getTasks();

        if (!active) {
          return;
        }


        const loadedTasks =
          Array.isArray(result)
            ? result
            : Array.isArray(
                result?.tasks
              )
            ? result.tasks
            : Array.isArray(
                result?.data
              )
            ? result.data
            : [];


        setTasks(
          loadedTasks
        );

      } catch (error) {

        console.error(
          "Subjects task loading error:",
          error
        );

        if (active) {
          setTasks([]);
        }

      } finally {

        if (active) {
          setTasksLoading(false);
        }

      }

    };


    loadTasks();


    // ===================================================
    // TASK UPDATE EVENT
    // ===================================================

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


  // =====================================================
  // SUBJECT PROGRESS
  // =====================================================

  const subjectsWithProgress =
    useMemo(() => {

      return subjects.map(
        (subject) => {

          const subjectTasks =
            tasks.filter(
              (task) =>
                subjectMatchesTask(
                  subject.name,
                  task?.subject
                )
            );


          const totalTasks =
            subjectTasks.length;


          const completedTasks =
            subjectTasks.filter(
              (task) =>
                Boolean(
                  task?.completed
                )
            ).length;


          const progress =
            totalTasks === 0
              ? 0
              : Math.round(
                  (completedTasks /
                    totalTasks) *
                    100
                );


          return {
            ...subject,
            progress,
            totalTasks,
            completedTasks,
          };

        }
      );

    }, [
      subjects,
      tasks,
    ]);


  // =====================================================
  // SEARCH
  // =====================================================

  const filteredSubjects =
    useMemo(() => {

      const query =
        search
          .toLowerCase()
          .trim();


      if (!query) {
        return subjectsWithProgress;
      }


      return subjectsWithProgress.filter(
        (subject) =>
          `${subject.name} ${subject.description}`
            .toLowerCase()
            .includes(query)
      );

    }, [
      subjectsWithProgress,
      search,
    ]);


  // =====================================================
  // AVERAGE PROGRESS
  // =====================================================

  const averageProgress =
    subjectsWithProgress.length === 0
      ? 0
      : Math.round(
          subjectsWithProgress.reduce(
            (total, subject) =>
              total +
              Number(
                subject.progress || 0
              ),
            0
          ) /
            subjectsWithProgress.length
        );


  // =====================================================
  // COMPLETED SUBJECTS
  // =====================================================

  const completedSubjects =
    subjectsWithProgress.filter(
      (subject) =>
        Number(
          subject.progress || 0
        ) >= 100
    ).length;


  // =====================================================
  // CREATE MODAL
  // =====================================================

  const openCreateModal = () => {

    setEditingSubject(null);

    setForm({
      name: "",
      description: "",
      color:
        COLORS[
          subjects.length %
            COLORS.length
        ],
    });

    setShowModal(true);

  };


  // =====================================================
  // EDIT MODAL
  // =====================================================

  const openEditModal = (
    subject
  ) => {

    setEditingSubject(
      subject
    );

    setForm({
      name:
        subject.name || "",

      description:
        subject.description || "",

      color:
        subject.color ||
        COLORS[0],
    });

    setShowModal(true);

  };


  // =====================================================
  // CLOSE MODAL
  // =====================================================

  const closeModal = () => {

    setShowModal(false);

    setEditingSubject(null);

    setForm({
      name: "",
      description: "",
      color: COLORS[0],
    });

  };


  // =====================================================
  // FORM CHANGE
  // =====================================================

  const handleChange = (
    event
  ) => {

    const {
      name,
      value,
    } = event.target;


    setForm(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    );

  };


  // =====================================================
  // GENERATE AI RESOURCES USING OLLAMA BACKEND
  // =====================================================

  const generateSubjectResources = async (
    subjectName,
    description
  ) => {
    setGeneratingResources(true);
    setResourceError("");

    try {
      const response = await fetch(
        `${AI_API_URL}/api/ai/resources`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            subject: subjectName,
            description,
            count: 8,
            numberOfResources: 8,
          }),
        }
      );

      let data = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            "AI resource generation failed."
        );
      }

      const receivedResources =
        Array.isArray(data?.resources)
          ? data.resources
          : Array.isArray(data?.data?.resources)
            ? data.data.resources
            : [];

      if (receivedResources.length === 0) {
        throw new Error(
          "Ollama returned no resources."
        );
      }

      const now = Date.now();

      const normalizedResources =
        receivedResources
          .map((item, index) => {
            const title =
              String(
                item?.title ||
                  item?.name ||
                  `${subjectName} Resource ${index + 1}`
              ).trim();

            const resourceDescription =
              String(
                item?.description ||
                  item?.summary ||
                  `Recommended resource for learning ${subjectName}.`
              ).trim();

            let url =
              String(
                item?.url ||
                  item?.link ||
                  ""
              ).trim();

            // If Ollama does not return a direct URL,
            // create a useful search URL instead of showing
            // a broken empty link.
            if (!url) {
              const query =
                item?.searchQuery ||
                title ||
                subjectName;

              url =
                `https://www.google.com/search?q=${encodeURIComponent(
                  query
                )}`;
            }

            return {
              id:
                `${userKey}_${now}_${index}_${Math.random()
                  .toString(36)
                  .slice(2)}`,

              subject: subjectName,

              title,

              description:
                resourceDescription,

              type:
                item?.type ||
                "Website",

              url,

              searchQuery:
                item?.searchQuery ||
                title,

              aiGenerated: true,

              createdAt:
                new Date().toISOString(),
            };
          })
          .filter(
            (item) =>
              item.title &&
              item.url
          );

      if (normalizedResources.length === 0) {
        throw new Error(
          "No valid resources were returned."
        );
      }

      // Remove old resources for the same subject,
      // then save the fresh AI-generated set.
      const subjectKey =
        normalizeSubject(subjectName);

      const otherResources =
        resources.filter(
          (resource) =>
            normalizeSubject(
              resource?.subject
            ) !== subjectKey
        );

      // Add an official Coursera learning option for every subject.
      // This is created locally so it is available even when Ollama
      // returns resources without a course link.
      const courseraResource = {
        id:
          `${userKey}_${now}_coursera_${Math.random()
            .toString(36)
            .slice(2)}`,

        subject: subjectName,

        title:
          `${subjectName} courses on Coursera`,

        description:
          `Explore courses and guided learning programs for ${subjectName} on Coursera.`,

        type:
          "Coursera Course",

        platform:
          "Coursera",

        url:
          `https://www.coursera.org/search?query=${encodeURIComponent(
            subjectName
          )}`,

        searchQuery:
          subjectName,

        aiGenerated: false,

        createdAt:
          new Date().toISOString(),
      };

      const updatedResources = [
        ...normalizedResources,
        courseraResource,
        ...otherResources,
      ];

      setResources(updatedResources);
      saveUserResources(
        userKey,
        updatedResources
      );

      return normalizedResources;
    } catch (error) {
      console.error(
        "Learnova AI resource generation error:",
        error
      );

      const message =
        error?.message ||
        "Could not generate AI resources.";

      setResourceError(message);

      return [];
    } finally {
      setGeneratingResources(false);
    }
  };


  // =====================================================
  // CREATE / UPDATE SUBJECT
  // =====================================================

  const handleSubmit = async (
    event
  ) => {

    event.preventDefault();


    // User missing
    if (!userKey) {

      alert(
        "Please login again before creating a subject."
      );

      return;

    }


    const subjectName =
      form.name.trim();


    if (!subjectName) {

      alert(
        "Please enter a subject name."
      );

      return;

    }


    // ===================================================
    // EDIT
    // ===================================================

    if (editingSubject) {

      setSubjects(
        (previous) =>
          previous.map(
            (subject) =>
              subject.id ===
              editingSubject.id
                ? {
                    ...subject,

                    name:
                      subjectName,

                    description:
                      form.description.trim(),

                    color:
                      form.color,
                  }
                : subject
          )
      );

    }

    // ===================================================
    // CREATE
    // ===================================================

    else {

      const newSubject = {

        id:
          `${userKey}_${Date.now()}`,

        name:
          subjectName,

        description:
          form.description.trim(),

        color:
          form.color,

      };


      setSubjects(
        (previous) => [
          newSubject,
          ...previous,
        ]
      );

      closeModal();

      // Generate resources only for a newly created subject.
      const generated =
        await generateSubjectResources(
          subjectName,
          form.description.trim()
        );

      if (generated.length > 0) {
        alert(
          `✅ ${subjectName} added!\n\n🤖 ${generated.length} AI resources generated.\n🎓 Coursera course search added.`
        );
      } else {
        alert(
          `✅ ${subjectName} added.\n\n🎓 Coursera course search added.\n⚠️ AI resources could not be generated. Make sure the Ollama backend is running.`
        );
      }

      return;
    }


    closeModal();

  };


  // =====================================================
  // DELETE SUBJECT
  // =====================================================

  const deleteSubject = (
    id
  ) => {

    const subject =
      subjects.find(
        (item) =>
          item.id === id
      );


    const confirmed =
      window.confirm(
        `Delete "${
          subject?.name ||
          "this subject"
        }"?`
      );


    if (!confirmed) {
      return;
    }


    // Delete the subject itself.
    setSubjects(
      (previous) =>
        previous.filter(
          (item) =>
            item.id !== id
        )
    );

    // IMPORTANT: remove every AI/Coursera/manual resource
    // belonging to this subject from the same user's resource store.
    const deletedSubjectName =
      String(subject?.name || "").trim();

    if (userKey && deletedSubjectName) {
      const subjectKey = normalizeSubject(
        deletedSubjectName
      );

      const updatedResources = resources.filter(
        (resource) =>
          normalizeSubject(
            resource?.subject
          ) !== subjectKey
      );

      setResources(updatedResources);
      saveUserResources(
        userKey,
        updatedResources
      );

      // Resources page listens to this event and refreshes immediately.
      window.dispatchEvent(
        new Event(
          "learnova:resources-updated"
        )
      );
    }

  };


  // =====================================================
  // PROGRESS LABEL
  // =====================================================

  const getProgressLabel = (
    progress
  ) => {

    if (progress >= 100) {
      return "Completed";
    }

    if (progress >= 80) {
      return "Excellent";
    }

    if (progress >= 60) {
      return "Good";
    }

    if (progress >= 40) {
      return "In Progress";
    }

    return "Needs Focus";

  };


  // =====================================================
  // UI
  // =====================================================

  return (
    <>
      <main className="subjects-page">

        <div className="subjects-container">

          {/* =================================================
             HEADER
             ================================================= */}

          <section className="subjects-header">

            <div>

              <div className="subjects-label">

                <FiBookOpen />

                <span>
                  LEARNOVA SUBJECTS
                </span>

              </div>


              <h1>
                My Subjects
              </h1>


              <p>
                Organize your subjects and track your
                learning progress.
              </p>

            </div>


            <button
              type="button"
              className="add-subject-button"
              onClick={
                openCreateModal
              }
            >

              <FiPlus />

              Add Subject

            </button>

          </section>


          {/* =================================================
             STATS
             ================================================= */}

          <section className="subjects-stats">

            <div className="subject-stat-card">

              <div className="stat-icon purple">
                📚
              </div>

              <div>

                <span>
                  Total Subjects
                </span>

                <strong>
                  {subjects.length}
                </strong>

              </div>

            </div>


            <div className="subject-stat-card">

              <div className="stat-icon blue">
                📊
              </div>

              <div>

                <span>
                  Average Progress
                </span>

                <strong>
                  {
                    tasksLoading
                      ? "..."
                      : `${averageProgress}%`
                  }
                </strong>

              </div>

            </div>


            <div className="subject-stat-card">

              <div className="stat-icon green">
                <FiCheck />
              </div>

              <div>

                <span>
                  Completed
                </span>

                <strong>
                  {
                    tasksLoading
                      ? "..."
                      : completedSubjects
                  }
                </strong>

              </div>

            </div>

          </section>


          {generatingResources && (
            <div className="ai-resource-banner">
              <span className="ai-resource-spinner">
                🤖
              </span>

              <div>
                <strong>
                  Learnova AI is preparing resources...
                </strong>

                <p>
                  Ollama is generating personalized
                  learning resources for your new subject.
                </p>
              </div>
            </div>
          )}

          {resourceError && !generatingResources && (
            <div className="ai-resource-error">
              <strong>
                AI resources could not be generated.
              </strong>

              <span>
                {resourceError}
              </span>
            </div>
          )}


          {/* =================================================
             SEARCH
             ================================================= */}

          <div className="subject-search">

            <FiSearch />

            <input
              type="text"
              placeholder="Search subjects..."
              value={search}
              onChange={
                (event) =>
                  setSearch(
                    event.target.value
                  )
              }
            />

          </div>


          {/* =================================================
             SUBJECT GRID
             ================================================= */}

          <section className="subjects-grid">

            {filteredSubjects.length === 0 ? (

              <div className="subjects-empty">

                <FiBookOpen size={52} />

                <h2>
                  No subjects yet
                </h2>

                <p>
                  Create your first subject to
                  start tracking your learning.
                </p>

                <button
                  type="button"
                  onClick={
                    openCreateModal
                  }
                >

                  <FiPlus />

                  Add Subject

                </button>

              </div>

            ) : (

              filteredSubjects.map(
                (subject) => (

                  <article
                    className="subject-card"
                    key={subject.id}
                  >

                    {/* =========================================
                       CARD HEADER
                       ========================================= */}

                    <div className="subject-card-header">

                      <div
                        className="subject-icon"
                        style={{
                          background:
                            `${subject.color}18`,
                          color:
                            subject.color,
                        }}
                      >
                        <FiBookOpen />
                      </div>


                      <div className="subject-actions">

                        <button
                          type="button"
                          className="edit-subject"
                          onClick={() =>
                            openEditModal(
                              subject
                            )
                          }
                          title="Edit subject"
                        >
                          <FiEdit2 />
                        </button>


                        <button
                          type="button"
                          className="delete-subject"
                          onClick={() =>
                            deleteSubject(
                              subject.id
                            )
                          }
                          title="Delete subject"
                        >
                          <FiTrash2 />
                        </button>

                      </div>

                    </div>


                    {/* =========================================
                       SUBJECT
                       ========================================= */}

                    <h2>
                      {subject.name}
                    </h2>


                    <p className="subject-description">
                      {
                        subject.description ||
                        "No description added."
                      }
                    </p>


                    {/* =========================================
                       AI RESOURCES
                       ========================================= */}

                    {(() => {
                      const subjectResources =
                        resources.filter(
                          (resource) =>
                            normalizeSubject(
                              resource?.subject
                            ) ===
                            normalizeSubject(
                              subject.name
                            )
                        );

                      return (
                        <div className="subject-resources">
                          <div className="resources-heading">
                            <span>
                              🤖 AI Resources
                            </span>

                            <strong>
                              {subjectResources.length}
                            </strong>
                          </div>

                          {subjectResources.length > 0 ? (
                            <div className="resource-list">
                              {subjectResources
                                .slice(0, 3)
                                .map(
                                  (resource) => (
                                    <a
                                      key={resource.id}
                                      href={resource.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="resource-item"
                                    >
                                      <div>
                                        <strong>
                                          {resource.title}
                                        </strong>

                                        <span>
                                          {resource.platform
                                            ? resource.platform
                                            : resource.type ||
                                              "Learning Resource"}
                                        </span>
                                      </div>

                                      <FiExternalLink />
                                    </a>
                                  )
                                )}
                            </div>
                          ) : (
                            <div className="no-resources">
                              {generatingResources
                                ? "Generating resources with Ollama..."
                                : "No AI resources yet."}
                            </div>
                          )}

                          {subjectResources.length > 3 && (
                            <div className="more-resources">
                              +{" "}
                              {subjectResources.length - 3}{" "}
                              more resources
                            </div>
                          )}
                        </div>
                      );
                    })()}


                    {/* =========================================
                       PROGRESS
                       ========================================= */}

                    <div className="progress-header">

                      <span>
                        Progress
                      </span>

                      <strong>
                        {subject.progress}%
                      </strong>

                    </div>


                    <div className="progress-bar">

                      <div
                        className="progress-fill"
                        style={{
                          width:
                            `${subject.progress}%`,
                          background:
                            subject.color,
                        }}
                      />

                    </div>


                    {/* =========================================
                       TASK COUNT
                       ========================================= */}

                    <div className="subject-task-count">

                      {subject.completedTasks}

                      {" "}completed /{" "}

                      {subject.totalTasks}

                      {" "}tasks

                    </div>


                    {/* =========================================
                       FOOTER
                       ========================================= */}

                    <div className="subject-footer">

                      <span
                        style={{
                          color:
                            subject.color,
                        }}
                      >
                        {
                          getProgressLabel(
                            Number(
                              subject.progress ||
                              0
                            )
                          )
                        }
                      </span>


                      <span>

                        {
                          Number(
                            subject.progress ||
                            0
                          ) >= 100
                            ? "Completed"
                            : "Keep learning"
                        }

                      </span>

                    </div>

                  </article>

                )
              )

            )}

          </section>

        </div>

      </main>


      {/* =====================================================
         MODAL
         ===================================================== */}

      {showModal && (

        <div
          className="subject-modal-overlay"
          onClick={
            closeModal
          }
        >

          <div
            className="subject-modal"
            onClick={
              (event) =>
                event.stopPropagation()
            }
          >

            <div className="modal-title">

              <div>

                <h2>

                  {
                    editingSubject
                      ? "Edit Subject"
                      : "Add New Subject"
                  }

                </h2>

                <p>

                  {
                    editingSubject
                      ? "Update your subject information."
                      : "Create a subject for your learning plan."
                  }

                </p>

              </div>


              <button
                type="button"
                className="close-modal"
                onClick={
                  closeModal
                }
              >
                <FiX />
              </button>

            </div>


            {/* =================================================
               FORM
               ================================================= */}

            <form
              onSubmit={
                handleSubmit
              }
            >

              <div className="form-group">

                <label>
                  Subject Name
                </label>

                <input
                  type="text"
                  name="name"
                  value={
                    form.name
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="e.g. Python"
                  required
                />

              </div>


              <div className="form-group">

                <label>
                  Description
                </label>

                <textarea
                  name="description"
                  value={
                    form.description
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Describe what you are learning..."
                  rows={4}
                />

              </div>


              <div className="form-group">

                <label>
                  Subject Color
                </label>


                <div className="color-options">

                  {COLORS.map(
                    (color) => (

                      <button
                        type="button"
                        key={color}
                        className={
                          `color-option ${
                            form.color ===
                            color
                              ? "selected"
                              : ""
                          }`
                        }
                        style={{
                          background:
                            color,
                        }}
                        onClick={() =>
                          setForm(
                            (previous) => ({
                              ...previous,
                              color,
                            })
                          )
                        }
                      >

                        {
                          form.color ===
                          color && (
                            <FiCheck />
                          )
                        }

                      </button>

                    )
                  )}

                </div>

              </div>


              {/* =================================================
                 ACTIONS
                 ================================================= */}

              <div className="modal-buttons">

                <button
                  type="button"
                  className="cancel-button"
                  onClick={
                    closeModal
                  }
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  className="save-subject-button"
                >

                  <FiCheck />

                  {
                    editingSubject
                      ? "Update Subject"
                      : "Create Subject"
                  }

                </button>

              </div>

            </form>

          </div>

        </div>

      )}


      {/* =====================================================
         CSS
         ===================================================== */}

      <style>{`

        .subjects-page {
          width: 100%;
          min-width: 0;
          min-height: calc(100vh - 80px);
          box-sizing: border-box;
          background: #f7f8fc;
          padding: 36px 40px 50px;
          overflow-x: hidden;
        }

        .subjects-container {
          width: 100%;
          max-width: 1240px;
          margin: 0 auto;
        }

        .subjects-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 30px;
          margin-bottom: 28px;
        }

        .subjects-label {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #635bff;
          font-size: 13px;
          font-weight: 800;
          letter-spacing: .8px;
          margin-bottom: 9px;
        }

        .subjects-header h1 {
          margin: 0;
          color: #13213f;
          font-size: 38px;
          line-height: 1.15;
          font-weight: 800;
        }

        .subjects-header p {
          margin: 8px 0 0;
          color: #68738a;
          font-size: 16px;
          line-height: 1.5;
        }

        .add-subject-button {
          flex-shrink: 0;
          border: 0;
          border-radius: 12px;
          padding: 13px 20px;
          background: #635bff;
          color: #fff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 10px 25px rgba(99,91,255,.2);
          transition: .2s ease;
        }

        .add-subject-button:hover {
          transform: translateY(-2px);
        }

        .subjects-stats {
          display: grid;
          grid-template-columns: repeat(3,minmax(0,1fr));
          gap: 20px;
          margin-bottom: 22px;
        }

        .subject-stat-card {
          min-height: 104px;
          box-sizing: border-box;
          background: #fff;
          border: 1px solid #e5e7f0;
          border-radius: 17px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 15px;
          box-shadow: 0 7px 24px rgba(30,40,80,.045);
        }

        .subject-stat-card span {
          display: block;
          color: #718096;
          font-size: 13px;
          margin-bottom: 5px;
        }

        .subject-stat-card strong {
          display: block;
          color: #13213f;
          font-size: 27px;
          line-height: 1.1;
        }

        .stat-icon {
          width: 48px;
          height: 48px;
          flex: 0 0 48px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 21px;
        }

        .stat-icon.purple {
          background: #eeecff;
        }

        .stat-icon.blue {
          background: #e7f5ff;
        }

        .stat-icon.green {
          background: #e9fbf2;
          color: #10b981;
        }

        .subject-search {
          position: relative;
          width: 100%;
          margin-bottom: 24px;
        }

        .subject-search svg {
          position: absolute;
          left: 17px;
          top: 50%;
          transform: translateY(-50%);
          color: #8792a8;
          pointer-events: none;
        }

        .subject-search input {
          width: 100%;
          height: 54px;
          box-sizing: border-box;
          padding: 0 18px 0 47px;
          border: 1px solid #e0e3ed;
          border-radius: 14px;
          background: #fff;
          outline: none;
          font-size: 15px;
          color: #13213f;
        }

        .subject-search input::placeholder {
          color: #94a0b5;
        }

        .subject-search input:focus {
          border-color: #635bff;
          box-shadow: 0 0 0 3px rgba(99,91,255,.1);
        }

        .subjects-grid {
          display: grid;
          grid-template-columns: repeat(3,minmax(0,1fr));
          gap: 20px;
        }

        .subject-card {
          min-width: 0;
          background: #fff;
          border: 1px solid #e5e7f0;
          border-radius: 19px;
          padding: 22px;
          box-sizing: border-box;
          box-shadow: 0 8px 28px rgba(30,40,80,.05);
          transition: transform .2s ease, box-shadow .2s ease;
        }

        .subject-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 14px 35px rgba(30,40,80,.09);
        }

        .subject-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          margin-bottom: 17px;
        }

        .subject-icon {
          width: 47px;
          height: 47px;
          flex: 0 0 47px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
        }

        .subject-actions {
          display: flex;
          align-items: center;
          gap: 7px;
        }

        .subject-actions button {
          width: 34px;
          height: 34px;
          border: 0;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: .2s ease;
        }

        .subject-actions button:hover {
          transform: translateY(-1px);
        }

        .edit-subject {
          background: #f1f0ff;
          color: #635bff;
        }

        .delete-subject {
          background: #fff1f2;
          color: #e11d48;
        }

        .subject-card h2 {
          margin: 0 0 8px;
          color: #13213f;
          font-size: 19px;
          line-height: 1.3;
        }

        .subject-description {
          min-height: 45px;
          margin: 0 0 20px;
          color: #718096;
          font-size: 14px;
          line-height: 1.55;
        }

        .progress-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
          color: #718096;
          font-size: 13px;
        }

        .progress-header strong {
          color: #13213f;
        }

        .progress-bar {
          width: 100%;
          height: 8px;
          border-radius: 10px;
          background: #eceef4;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          border-radius: 10px;
          transition: width .3s ease;
        }

        .subject-task-count {
          margin-top: 9px;
          color: #94a0b5;
          font-size: 12px;
        }

        .subject-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-top: 12px;
          font-size: 12px;
          color: #94a0b5;
        }

        .subject-footer span:first-child {
          font-weight: 700;
        }

        .subjects-empty {
          grid-column: 1 / -1;
          background: #fff;
          border: 1px solid #e5e7f0;
          border-radius: 20px;
          padding: 70px 30px;
          text-align: center;
          color: #635bff;
        }

        .subjects-empty h2 {
          margin: 12px 0 8px;
          color: #13213f;
        }

        .subjects-empty p {
          margin: 0 0 20px;
          color: #718096;
        }

        .subjects-empty button {
          border: 0;
          border-radius: 10px;
          background: #635bff;
          color: #fff;
          padding: 11px 18px;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          font-weight: 700;
          cursor: pointer;
        }

        .subject-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          padding: 20px;
          box-sizing: border-box;
          background: rgba(15,23,42,.5);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .subject-modal {
          width: 100%;
          max-width: 560px;
          max-height: 90vh;
          overflow-y: auto;
          box-sizing: border-box;
          background: #fff;
          border-radius: 22px;
          padding: 30px;
          box-shadow: 0 25px 80px rgba(0,0,0,.2);
        }

        .modal-title {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 22px;
        }

        .modal-title h2 {
          margin: 0;
          color: #13213f;
          font-size: 23px;
        }

        .modal-title p {
          margin: 6px 0 0;
          color: #718096;
          font-size: 13px;
          line-height: 1.4;
        }

        .close-modal {
          width: 36px;
          height: 36px;
          flex-shrink: 0;
          border: 0;
          border-radius: 10px;
          background: #f1f2f6;
          color: #475569;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 19px;
        }

        .form-group {
          margin-bottom: 18px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          color: #263b60;
          font-size: 14px;
          font-weight: 700;
        }

        .form-group input[type="text"],
        .form-group textarea {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid #dfe2ed;
          border-radius: 11px;
          padding: 12px 14px;
          outline: none;
          font-family: inherit;
          font-size: 14px;
          color: #13213f;
          background: #fff;
        }

        .form-group textarea {
          resize: vertical;
          min-height: 100px;
        }

        .form-group input[type="text"]:focus,
        .form-group textarea:focus {
          border-color: #635bff;
          box-shadow: 0 0 0 3px rgba(99,91,255,.1);
        }

        .color-options {
          display: flex;
          align-items: center;
          gap: 11px;
          flex-wrap: wrap;
        }

        .color-option {
          width: 36px;
          height: 36px;
          padding: 0;
          border: 3px solid transparent;
          border-radius: 50%;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .color-option.selected {
          border-color: #13213f;
          box-shadow: 0 0 0 3px #fff;
        }

        .modal-buttons {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 25px;
        }

        .cancel-button,
        .save-subject-button {
          padding: 12px 18px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
        }

        .cancel-button {
          border: 1px solid #dfe2ed;
          background: #fff;
          color: #475569;
        }

        .save-subject-button {
          border: 0;
          background: #635bff;
          color: #fff;
        }

        .ai-resource-banner {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 22px;
          padding: 16px 18px;
          border: 1px solid #ddd9ff;
          border-radius: 15px;
          background: #f7f5ff;
          color: #4038a8;
        }

        .ai-resource-banner p {
          margin: 3px 0 0;
          color: #6f6a9b;
          font-size: 13px;
        }

        .ai-resource-spinner {
          width: 42px;
          height: 42px;
          flex: 0 0 42px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #ebe8ff;
          font-size: 20px;
        }

        .ai-resource-error {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-bottom: 22px;
          padding: 14px 17px;
          border: 1px solid #fecdd3;
          border-radius: 14px;
          background: #fff1f2;
          color: #9f1239;
          font-size: 13px;
        }

        .subject-resources {
          margin: 0 0 20px;
          padding: 13px;
          border-radius: 13px;
          background: #f8f8ff;
          border: 1px solid #ecebfa;
        }

        .resources-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 9px;
          color: #4038a8;
          font-size: 13px;
          font-weight: 800;
        }

        .resources-heading strong {
          min-width: 24px;
          height: 24px;
          padding: 0 6px;
          box-sizing: border-box;
          border-radius: 20px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: #ebe8ff;
          color: #635bff;
          font-size: 11px;
        }

        .resource-list {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .resource-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          min-width: 0;
          padding: 9px 10px;
          border-radius: 9px;
          text-decoration: none;
          background: #fff;
          border: 1px solid #ececf3;
          color: #13213f;
          transition: .2s ease;
        }

        .resource-item:hover {
          transform: translateX(2px);
          border-color: #cfcaff;
          background: #fbfaff;
        }

        .resource-item > div {
          min-width: 0;
        }

        .resource-item strong {
          display: block;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 12px;
          color: #263b60;
        }

        .resource-item span {
          display: block;
          margin-top: 2px;
          color: #8a94a8;
          font-size: 10px;
        }

        .resource-item svg {
          flex: 0 0 auto;
          color: #635bff;
        }

        .no-resources {
          padding: 7px 2px;
          color: #8a94a8;
          font-size: 11px;
        }

        .more-resources {
          margin-top: 8px;
          color: #635bff;
          font-size: 11px;
          font-weight: 700;
        }

        @media (max-width: 1100px) {

          .subjects-page {
            padding: 30px;
          }

          .subjects-grid {
            grid-template-columns:
              repeat(
                2,
                minmax(0,1fr)
              );
          }

        }

        @media (max-width: 800px) {

          .subjects-page {
            padding:
              24px
              18px
              40px;
          }

          .subjects-header {
            flex-direction: column;
            align-items: stretch;
          }

          .add-subject-button {
            width: 100%;
          }

          .subjects-stats {
            grid-template-columns: 1fr;
          }

          .subjects-grid {
            grid-template-columns: 1fr;
          }

        }

        @media (max-width: 520px) {

          .subjects-header h1 {
            font-size: 30px;
          }

          .subject-card {
            padding: 18px;
          }

          .subject-modal {
            padding: 22px;
          }

          .modal-buttons {
            flex-direction: column;
          }

          .cancel-button,
          .save-subject-button {
            width: 100%;
          }

        }

      `}</style>
    </>
  );
}


export default Subjects;