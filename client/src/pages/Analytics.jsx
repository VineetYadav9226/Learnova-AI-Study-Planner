// =====================================================
// LEARNOVA AI - ANALYTICS PAGE
// =====================================================

import "./analytics.css";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { getTasks } from "../services/taskService";


// =====================================================
// CURRENT USER + USER-SPECIFIC SUBJECTS
// =====================================================
//
// IMPORTANT:
// Every user has a separate subject list:
//
// learnova_subjects_<USER_ID>
//
// Analytics must NEVER read a global subject list.
// =====================================================

const getCurrentUser = () => {
  const possibleKeys = [
    "user",
    "currentUser",
    "learnova_user",
    "learnovaUser",
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
      // Ignore invalid localStorage data.
    }
  }

  return null;
};


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

  return identifier
    ? String(identifier)
    : null;
};


const getSubjectStorageKey = () => {
  const userId =
    getUserIdentifier();

  if (!userId) {
    return null;
  }

  return `learnova_subjects_${userId}`;
};


const normalizeSubject = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();


const getCurrentSubjects = () => {
  try {
    const storageKey =
      getSubjectStorageKey();

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

    const names = parsed
      .map((item) =>
        String(
          item?.name || ""
        ).trim()
      )
      .filter(Boolean);

    return names.filter(
      (name, index, array) =>
        index ===
        array.findIndex(
          (item) =>
            normalizeSubject(item) ===
            normalizeSubject(name)
        )
    );
  } catch (error) {
    console.error(
      "Analytics subjects loading error:",
      error
    );

    return [];
  }
};


// =====================================================
// SUBJECT MATCHING
// =====================================================
//
// Handles common names such as:
// Artificial Intelligence <-> AI
// Data Structures <-> DSA
// Operating System <-> OS
// Software Project Management <-> SPM
//
// This is only for matching saved task/quiz records.
// The UI still displays the CURRENT subject name.
// =====================================================

const SUBJECT_ALIASES = {
  "artificial intelligence": [
    "artificial intelligence",
    "ai",
  ],
  ai: [
    "artificial intelligence",
    "ai",
  ],

  "data structures": [
    "data structures",
    "data structure",
    "dsa",
  ],
  dsa: [
    "data structures",
    "data structure",
    "dsa",
  ],

  "operating system": [
    "operating system",
    "operating systems",
    "os",
  ],
  os: [
    "operating system",
    "operating systems",
    "os",
  ],

  "software project management": [
    "software project management",
    "spm",
  ],
  spm: [
    "software project management",
    "spm",
  ],

  dbms: ["dbms"],
  python: ["python"],
};

const isValidQuizResult = (result) => {
  const score = Number(result?.score);
  const total = Number(
    result?.totalQuestions ??
    result?.total ??
    0
  );

  if (!Number.isFinite(score) ||
      !Number.isFinite(total) ||
      total < 1 ||
      score < 0 ||
      score > total) {
    return false;
  }

  return true;
};


const subjectMatches = (
  recordSubject,
  currentSubjects
) => {
  const recordKey =
    normalizeSubject(recordSubject);

  if (
    !recordKey ||
    !Array.isArray(currentSubjects)
  ) {
    return false;
  }

  return currentSubjects.some(
    (currentSubject) => {
      const currentKey =
        normalizeSubject(currentSubject);

      if (!currentKey) {
        return false;
      }

      const aliases =
        SUBJECT_ALIASES[currentKey];

      if (aliases) {
        return aliases.includes(recordKey);
      }

      return currentKey === recordKey;
    }
  );
};


// =====================================================
// FETCH TASKS
// =====================================================

const fetchAnalyticsTasks = async () => {
  try {
    const result = await getTasks();

    if (!result?.success) {
      return {
        success: false,
        tasks: [],
        message:
          result?.message ||
          "Unable to load analytics.",
      };
    }

    const tasks =
      Array.isArray(result.tasks)
        ? result.tasks
        : Array.isArray(result.data)
          ? result.data
          : [];

    return {
      success: true,
      tasks,
      message: "",
    };
  } catch (error) {
    console.error(
      "Analytics task loading error:",
      error
    );

    return {
      success: false,
      tasks: [],
      message:
        "Unable to load analytics.",
    };
  }
};


// =====================================================
// FETCH QUIZ RESULTS
// =====================================================

const fetchQuizResults = async () => {
  try {
    const token =
      localStorage.getItem(
        "learnova_token"
      ) ||
      localStorage.getItem("token");

    const headers = {
      "Content-Type":
        "application/json",
    };

    if (token) {
      headers.Authorization =
        `Bearer ${token}`;
    }

    const response = await fetch(
      "http://localhost:5000/api/quiz-results",
      {
        method: "GET",
        headers,
      }
    );

    const data =
      await response.json();

    return {
      success: response.ok,
      results: Array.isArray(
        data?.results
      )
        ? data.results
        : [],
      message:
        data?.message || "",
    };
  } catch (error) {
    console.error(
      "Quiz analytics loading error:",
      error
    );

    return {
      success: false,
      results: [],
      message:
        "Unable to load quiz analytics.",
    };
  }
};


// =====================================================
// AI RECOMMENDATION
// =====================================================
//
// IMPORTANT:
// This function does NOT call React setState.
// It only returns data.
// That prevents the React setState-in-effect warning.
// =====================================================

const requestAIRecommendation = async (
  results
) => {
  if (
    !Array.isArray(results) ||
    results.length === 0
  ) {
    return {
      recommendation:
        "Complete an AI quiz so Learnova can create a personalized study recommendation.",
      error: "",
    };
  }

  try {
    const totalQuizzes =
      results.length;

    const averageScore =
      Math.round(
        results.reduce(
          (sum, result) =>
            sum +
            Number(
              result?.percentage || 0
            ),
          0
        ) / totalQuizzes
      );

    const subjectMap = {};

    results.forEach((result) => {
      const subject =
        String(
          result?.subject ||
            "General"
        ).trim();

      if (!subjectMap[subject]) {
        subjectMap[subject] = {
          total: 0,
          count: 0,
        };
      }

      subjectMap[subject].total +=
        Number(
          result?.percentage || 0
        );

      subjectMap[subject].count +=
        1;
    });

    const subjectAverages =
      Object.entries(subjectMap)
        .map(
          ([subject, data]) => ({
            subject,
            average:
              Math.round(
                data.total /
                  data.count
              ),
          })
        )
        .sort(
          (a, b) =>
            a.average - b.average
        );

    const weakest =
      subjectAverages[0] || {
        subject: "General",
        average: 0,
      };

    const response = await fetch(
      "http://localhost:5000/api/ai/recommendation",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          averageScore,
          weakSubject:
            weakest.subject,
          weakSubjectScore:
            weakest.average,
          totalQuizzes,
          recentResults:
            results.slice(0, 5),
        }),
      }
    );

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data?.message ||
          "Unable to generate AI recommendation."
      );
    }

    if (
      !data?.recommendation ||
      typeof data.recommendation !==
        "string"
    ) {
      throw new Error(
        "AI returned an empty recommendation."
      );
    }

    return {
      recommendation:
        data.recommendation.trim(),
      error: "",
    };
  } catch (error) {
    console.error(
      "AI recommendation error:",
      error
    );

    return {
      recommendation: "",
      error:
        error?.message ||
        "AI recommendation unavailable.",
    };
  }
};


// =====================================================
// DATE HELPERS
// =====================================================

const getTaskDate = (task) => {
  const value =
    task?.date ||
    task?.dueDate ||
    task?.createdAt ||
    task?.created_at;

  if (!value) {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(
    date.getTime()
  )
    ? null
    : date;
};

const getLastSevenDays = () => {
  const days = [];
  const today = new Date();

  for (let i = 6; i >= 0; i -= 1) {
    const date = new Date(today);

    date.setHours(0, 0, 0, 0);
    date.setDate(
      today.getDate() - i
    );

    days.push(date);
  }

  return days;
};

const formatDay = (date) =>
  date.toLocaleDateString(
    "en-US",
    {
      weekday: "short",
    }
  );


// =====================================================
// ANALYTICS COMPONENT
// =====================================================

function Analytics() {
  // ===================================================
  // TASKS
  // ===================================================

  const [tasks, setTasks] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  // ===================================================
  // CURRENT SUBJECTS
  // ===================================================

  const [
    currentSubjects,
    setCurrentSubjects,
  ] = useState(() =>
    getCurrentSubjects()
  );


  // ===================================================
  // QUIZZES
  // ===================================================

  const [
    quizResults,
    setQuizResults,
  ] = useState([]);

  const [
    quizLoading,
    setQuizLoading,
  ] = useState(true);

  const [
    quizError,
    setQuizError,
  ] = useState("");


  // ===================================================
  // AI STATE
  // ===================================================

  const [
    aiRecommendation,
    setAiRecommendation,
  ] = useState("");

  const [
    aiRecommendationLoading,
    setAiRecommendationLoading,
  ] = useState(false);

  const [
    aiRecommendationError,
    setAiRecommendationError,
  ] = useState("");


  // ===================================================
  // SYNC SUBJECTS
  // ===================================================
  //
  // Subjects page must dispatch:
  // window.dispatchEvent(
  //   new Event("learnova:subjects-updated")
  // )
  //
  // Storage event handles another browser tab.
  // Focus handles returning to Analytics.
  // ===================================================

  useEffect(() => {
    const syncSubjects = () => {
      const nextSubjects =
        getCurrentSubjects();

      setCurrentSubjects(
        nextSubjects
      );
    };

    window.addEventListener(
      "learnova:subjects-updated",
      syncSubjects
    );

    window.addEventListener(
      "storage",
      syncSubjects
    );

    window.addEventListener(
      "focus",
      syncSubjects
    );

    window.addEventListener(
      "learnova:user-updated",
      syncSubjects
    );

    window.addEventListener(
      "learnova:auth-changed",
      syncSubjects
    );

    return () => {
      window.removeEventListener(
        "learnova:subjects-updated",
        syncSubjects
      );

      window.removeEventListener(
        "storage",
        syncSubjects
      );

      window.removeEventListener(
        "focus",
        syncSubjects
      );

      window.removeEventListener(
        "learnova:user-updated",
        syncSubjects
      );

      window.removeEventListener(
        "learnova:auth-changed",
        syncSubjects
      );
    };
  }, []);


  // ===================================================
  // LOAD TASKS + QUIZZES
  // ===================================================

  useEffect(() => {
    let active = true;

    const loadAnalytics =
      async () => {
        const [
          taskResult,
          quizResult,
        ] = await Promise.all([
          fetchAnalyticsTasks(),
          fetchQuizResults(),
        ]);

        if (!active) {
          return;
        }

        if (taskResult.success) {
          setTasks(
            taskResult.tasks
          );
          setError("");
        } else {
          setTasks([]);
          setError(
            taskResult.message
          );
        }

        if (quizResult.success) {
          setQuizResults(
            quizResult.results
          );
          setQuizError("");
        } else {
          setQuizResults([]);
          setQuizError(
            quizResult.message
          );
        }

        setLoading(false);
        setQuizLoading(false);
      };

    const timer =
      window.setTimeout(
        loadAnalytics,
        0
      );

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, []);


  // ===================================================
  // LIVE QUIZ RESULT SYNC
  // ===================================================
  //
  // Quizzes.jsx dispatches:
  // "learnova:quiz-results-updated"
  //
  // So Analytics immediately fetches the newly saved
  // MongoDB result without requiring a full page reload.
  // ===================================================

  useEffect(() => {
    let active = true;

    const refreshQuizResults = async () => {
      const result =
        await fetchQuizResults();

      if (!active) {
        return;
      }

      if (result.success) {
        setQuizResults(
          result.results
        );
        setQuizError("");
      } else {
        setQuizResults([]);
        setQuizError(
          result.message
        );
      }

      setQuizLoading(false);
    };


    window.addEventListener(
      "learnova:quiz-results-updated",
      refreshQuizResults
    );

    window.addEventListener(
      "focus",
      refreshQuizResults
    );


    return () => {
      active = false;

      window.removeEventListener(
        "learnova:quiz-results-updated",
        refreshQuizResults
      );

      window.removeEventListener(
        "focus",
        refreshQuizResults
      );
    };
  }, []);


  // ===================================================
  // CURRENT DATA ONLY
  // ===================================================
  //
  // Old records can remain in MongoDB.
  // They are deliberately ignored if their subject is
  // not present in the CURRENT Subjects page list.
  // ===================================================

  const activeTasks = useMemo(() => {
    if (!Array.isArray(tasks)) {
      return [];
    }

    return tasks.filter((task) =>
      subjectMatches(
        task?.subject,
        currentSubjects
      )
    );
  }, [
    tasks,
    currentSubjects,
  ]);

  const activeQuizResults =
    useMemo(() => {
      if (
        !Array.isArray(
          quizResults
        )
      ) {
        return [];
      }

      return quizResults.filter(
        (result) =>
          isValidQuizResult(result) &&
          subjectMatches(
            result?.subject,
            currentSubjects
          )
      );
    }, [
      quizResults,
      currentSubjects,
    ]);


  // ===================================================
  // AI RECOMMENDATION
  // ===================================================
  //
  // setState is intentionally executed asynchronously
  // after the effect has scheduled its work.
  // This avoids the React setState-in-effect warning.
  // ===================================================

  useEffect(() => {
    if (quizLoading) {
      return undefined;
    }

    let active = true;

    const timer =
      window.setTimeout(
        async () => {
          if (!active) {
            return;
          }

          setAiRecommendationLoading(
            true
          );

          setAiRecommendationError(
            ""
          );

          const result =
            await requestAIRecommendation(
              activeQuizResults
            );

          if (!active) {
            return;
          }

          setAiRecommendation(
            result.recommendation
          );

          setAiRecommendationError(
            result.error
          );

          setAiRecommendationLoading(
            false
          );
        },
        0
      );

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [
    activeQuizResults,
    quizLoading,
  ]);


  // ===================================================
  // MAIN ANALYTICS
  // ===================================================

  const analytics = useMemo(() => {
    const totalTasks =
      activeTasks.length;

    const completedTasks =
      activeTasks.filter(
        (task) =>
          task?.completed === true
      ).length;

    const pendingTasks =
      totalTasks -
      completedTasks;

    const progress =
      totalTasks === 0
        ? 0
        : Math.round(
            (completedTasks /
              totalTasks) *
              100
          );


    // -------------------------------------------------
    // SUBJECT PROGRESS
    // -------------------------------------------------

    const subjectProgress =
      currentSubjects.map(
        (subjectName) => {
          const subjectTasks =
            activeTasks.filter(
              (task) =>
                subjectMatches(
                  task?.subject,
                  [subjectName]
                )
            );

          const total =
            subjectTasks.length;

          const completed =
            subjectTasks.filter(
              (task) =>
                task?.completed === true
            ).length;

          const pending =
            total - completed;

          const percentage =
            total === 0
              ? 0
              : Math.round(
                  (completed /
                    total) *
                    100
                );

          return {
            name: subjectName,
            total,
            completed,
            pending,
            percentage,
          };
        }
      );


    const subjectsWithTasks =
      subjectProgress.filter(
        (subject) =>
          subject.total > 0
      );

    const bestSubject =
      subjectsWithTasks.length > 0
        ? [...subjectsWithTasks].sort(
            (a, b) =>
              b.percentage -
              a.percentage
          )[0]
        : null;


    // -------------------------------------------------
    // WEEKLY ACTIVITY
    // -------------------------------------------------

    const lastSevenDays =
      getLastSevenDays();

    const weeklyActivity =
      lastSevenDays.map(
        (date) => {
          const dayTasks =
            activeTasks.filter(
              (task) => {
                const taskDate =
                  getTaskDate(task);

                if (!taskDate) {
                  return false;
                }

                return (
                  taskDate.getFullYear() ===
                    date.getFullYear() &&
                  taskDate.getMonth() ===
                    date.getMonth() &&
                  taskDate.getDate() ===
                    date.getDate()
                );
              }
            );

          const completed =
            dayTasks.filter(
              (task) =>
                task?.completed ===
                true
            ).length;

          return {
            day: formatDay(date),
            date,
            total:
              dayTasks.length,
            completed,
            pending:
              dayTasks.length -
              completed,
          };
        }
      );

    const weeklyTasks =
      weeklyActivity.reduce(
        (sum, day) =>
          sum + day.total,
        0
      );

    const weeklyCompleted =
      weeklyActivity.reduce(
        (sum, day) =>
          sum + day.completed,
        0
      );

    const weeklyProgress =
      weeklyTasks === 0
        ? 0
        : Math.round(
            (weeklyCompleted /
              weeklyTasks) *
              100
          );


    // -------------------------------------------------
    // CONSISTENCY
    // -------------------------------------------------

    const activeStudyDays =
      weeklyActivity.filter(
        (day) =>
          day.total > 0 ||
          day.completed > 0
      ).length;

    const completedStudyDays =
      weeklyActivity.filter(
        (day) =>
          day.completed > 0
      ).length;

    const consistencyScore =
      Math.round(
        (activeStudyDays / 7) *
          100
      );

    const consistencyLevel =
      activeStudyDays >= 6
        ? "Excellent"
        : activeStudyDays >= 4
          ? "Good"
          : activeStudyDays >= 2
            ? "Building"
            : "Needs a Routine";

    const consistencyMessage =
      activeStudyDays >= 6
        ? "Excellent consistency. Keep your daily study rhythm going."
        : activeStudyDays >= 4
          ? "Good consistency. A few more active study days can make your routine stronger."
          : activeStudyDays >= 2
            ? "Your study routine is building. Try to study on a few more days each week."
            : "Start with a simple daily routine and complete at least one small study task each day.";


    // -------------------------------------------------
    // QUIZ ANALYTICS
    // -------------------------------------------------

    const totalQuizzes =
      activeQuizResults.length;

    const totalQuizQuestions =
      activeQuizResults.reduce(
        (sum, result) =>
          sum +
          Number(
            result?.totalQuestions ||
              0
          ),
        0
      );

    const totalQuizCorrect =
      activeQuizResults.reduce(
        (sum, result) =>
          sum +
          Number(
            result?.score || 0
          ),
        0
      );

    const averageQuizScore =
      totalQuizzes === 0
        ? 0
        : Math.round(
            activeQuizResults.reduce(
              (sum, result) =>
                sum +
                Number(
                  result?.percentage ||
                    0
                ),
              0
            ) / totalQuizzes
          );

    const bestQuizScore =
      totalQuizzes === 0
        ? 0
        : Math.max(
            ...activeQuizResults.map(
              (result) =>
                Number(
                  result?.percentage ||
                    0
                )
            )
          );


    // -------------------------------------------------
    // QUIZ SUBJECT PERFORMANCE
    // -------------------------------------------------

    const quizSubjectMap = {};

    activeQuizResults.forEach(
      (result) => {
        const subject =
          String(
            result?.subject ||
              "General"
          ).trim();

        if (
          !quizSubjectMap[subject]
        ) {
          quizSubjectMap[subject] = {
            quizzes: 0,
            totalPercentage: 0,
          };
        }

        quizSubjectMap[
          subject
        ].quizzes += 1;

        quizSubjectMap[
          subject
        ].totalPercentage +=
          Number(
            result?.percentage ||
              0
          );
      }
    );

    const quizSubjectPerformance =
      Object.entries(
        quizSubjectMap
      ).map(
        ([name, data]) => ({
          name,
          quizzes:
            data.quizzes,
          percentage:
            Math.round(
              data.totalPercentage /
                data.quizzes
            ),
        })
      );


    // -------------------------------------------------
    // RECENT QUIZZES
    // -------------------------------------------------

    const recentQuizResults =
      [...activeQuizResults]
        .sort(
          (a, b) =>
            new Date(
              b?.createdAt || 0
            ) -
            new Date(
              a?.createdAt || 0
            )
        )
        .slice(0, 5);


    // -------------------------------------------------
    // QUIZ TREND
    // -------------------------------------------------

    const quizTrendResults =
      [...activeQuizResults]
        .sort(
          (a, b) =>
            new Date(
              a?.createdAt || 0
            ) -
            new Date(
              b?.createdAt || 0
            )
        )
        .slice(-10);

    const quizProgressTrend =
      quizTrendResults.map(
        (result, index) => ({
          id:
            result?._id ||
            `${result?.subject || "quiz"}-${index}`,
          label:
            `Quiz ${index + 1}`,
          topic:
            result?.topic ||
            "General",
          subject:
            result?.subject ||
            "General",
          score:
            Number(
              result?.percentage || 0
            ),
          date:
            result?.createdAt
              ? new Date(
                  result.createdAt
                ).toLocaleDateString()
              : "",
        })
      );


    // -------------------------------------------------
    // PERFORMANCE DIRECTION
    // -------------------------------------------------

    const firstQuizScore =
      quizProgressTrend.length > 0
        ? quizProgressTrend[0].score
        : 0;

    const latestQuizScore =
      quizProgressTrend.length > 0
        ? quizProgressTrend[
            quizProgressTrend.length - 1
          ].score
        : 0;

    const scoreChange =
      quizProgressTrend.length > 1
        ? latestQuizScore -
          firstQuizScore
        : 0;

    const performanceDirection =
      quizProgressTrend.length < 2
        ? "Not enough data"
        : scoreChange >= 10
          ? "Improving"
          : scoreChange <= -10
            ? "Declining"
            : "Stable";

    const performanceDirectionIcon =
      performanceDirection ===
      "Improving"
        ? "📈"
        : performanceDirection ===
            "Declining"
          ? "📉"
          : performanceDirection ===
              "Stable"
            ? "➡️"
            : "📊";

    const performanceDirectionMessage =
      performanceDirection ===
      "Improving"
        ? `Your latest quiz score improved by ${scoreChange} percentage points compared with your first quiz. Keep using the same study approach and continue practicing.`
        : performanceDirection ===
            "Declining"
          ? `Your latest quiz score dropped by ${Math.abs(scoreChange)} percentage points compared with your first quiz. Review the latest quiz topics before attempting another quiz.`
          : performanceDirection ===
              "Stable"
            ? `Your quiz performance is relatively stable, with a ${Math.abs(scoreChange)} percentage-point change between your first and latest quiz. Keep practicing to create a stronger upward trend.`
            : "Complete at least two quizzes so Learnova can detect your performance direction.";


    // -------------------------------------------------
    // WEAKEST SUBJECT
    // -------------------------------------------------

    const sortedQuizSubjects =
      [...quizSubjectPerformance].sort(
        (a, b) =>
          a.percentage -
          b.percentage
      );

    const weakSubject =
      sortedQuizSubjects.length > 0
        ? sortedQuizSubjects[0]
        : null;

    const weakSubjectLevel =
      !weakSubject
        ? "No data"
        : weakSubject.percentage <
            50
          ? "Needs Attention"
          : weakSubject.percentage <
              70
            ? "Improving"
            : "Good";

    const weakSubjectMessage =
      !weakSubject
        ? "Complete an AI quiz to identify the subject that needs the most attention."
        : weakSubject.percentage <
            50
          ? `${weakSubject.name} is currently your weakest quiz subject. Focus on this subject and practice more questions.`
          : `${weakSubject.name} is performing well. Keep practicing to maintain your score.`;

    const defaultAIRecommendation =
      !weakSubject
        ? "Complete your first quiz so Learnova can personalize your study recommendation."
        : performanceDirection ===
            "Declining"
          ? `Prioritize ${weakSubject.name}. Review the latest quiz mistakes, revise the related concepts, and take another short quiz after practice.`
          : performanceDirection ===
              "Improving"
            ? `Continue focusing on ${weakSubject.name}. Review recent mistakes and keep practicing to maintain the upward trend.`
            : `Focus on ${weakSubject.name}. Identify repeated mistakes and practice targeted questions to improve your next score.`;


    // -------------------------------------------------
    // SMART ACTIONS
    // -------------------------------------------------

    const smartStudyActions =
      !weakSubject
        ? [
            {
              icon: "📝",
              title:
                "Take your first quiz",
              text:
                "Complete a quiz so Learnova can identify your strongest and weakest areas.",
            },
            {
              icon: "📚",
              title:
                "Build your baseline",
              text:
                "Use the first result as a starting point for personalized recommendations.",
            },
            {
              icon: "📈",
              title:
                "Track your progress",
              text:
                "Complete another quiz later so Learnova can detect your performance trend.",
            },
          ]
        : performanceDirection ===
            "Declining"
          ? [
              {
                icon: "🔎",
                title:
                  "Review your latest mistakes",
                text: `Start with the questions you missed in your latest ${weakSubject.name} quiz.`,
              },
              {
                icon: "📚",
                title:
                  `Revise ${weakSubject.name}`,
                text:
                  "Revisit the concepts connected to those mistakes before taking another quiz.",
              },
              {
                icon: "🎯",
                title:
                  "Practice before retaking",
                text:
                  "Solve targeted questions first, then retake a short quiz to check improvement.",
              },
            ]
          : [
              {
                icon: "🎯",
                title:
                  `Target ${weakSubject.name}`,
                text:
                  "Focus on the concepts where you lose marks instead of repeating everything.",
              },
              {
                icon: "🧠",
                title:
                  "Practice weak concepts",
                text:
                  "Use focused questions to turn repeated mistakes into stronger understanding.",
              },
              {
                icon: "📊",
                title:
                  "Check the next result",
                text:
                  "Take another quiz and compare the score with your current performance.",
              },
            ];


    const completionRatio =
      totalTasks === 0
        ? "0 / 0"
        : `${completedTasks} / ${totalTasks}`;

    return {
      totalTasks,
      completedTasks,
      pendingTasks,
      progress,
      completionRatio,
      subjectProgress,
      bestSubject,
      weeklyActivity,
      weeklyTasks,
      weeklyCompleted,
      weeklyProgress,
      activeStudyDays,
      completedStudyDays,
      consistencyScore,
      consistencyLevel,
      consistencyMessage,
      totalQuizzes,
      totalQuizQuestions,
      totalQuizCorrect,
      averageQuizScore,
      bestQuizScore,
      quizSubjectPerformance,
      recentQuizResults,
      quizProgressTrend,
      firstQuizScore,
      latestQuizScore,
      scoreChange,
      performanceDirection,
      performanceDirectionIcon,
      performanceDirectionMessage,
      weakSubject,
      weakSubjectLevel,
      weakSubjectMessage,
      aiRecommendation:
        defaultAIRecommendation,
      smartStudyActions,
    };
  }, [
    activeTasks,
    activeQuizResults,
    currentSubjects,
  ]);


  // ===================================================
  // REFRESH
  // ===================================================

  const handleRefresh = async () => {
    setLoading(true);
    setQuizLoading(true);
    setError("");
    setQuizError("");

    const [
      taskResult,
      quizResult,
    ] = await Promise.all([
      fetchAnalyticsTasks(),
      fetchQuizResults(),
    ]);

    if (taskResult.success) {
      setTasks(
        taskResult.tasks
      );
      setError("");
    } else {
      setTasks([]);
      setError(
        taskResult.message
      );
    }

    if (quizResult.success) {
      setQuizResults(
        quizResult.results
      );
      setQuizError("");
    } else {
      setQuizResults([]);
      setQuizError(
        quizResult.message
      );
    }

    setLoading(false);
    setQuizLoading(false);
  };


  // ===================================================
  // LOADING
  // ===================================================

  if (loading) {
    return (
      <main className="analytics-page">
        <div className="analytics-loading">
          <div className="analytics-spinner">
            ⏳
          </div>

          <h2>
            Loading Analytics...
          </h2>

          <p>
            Calculating your study progress.
          </p>
        </div>
      </main>
    );
  }


  // ===================================================
  // MAIN UI
  // ===================================================

  return (
    <main className="analytics-page">

      {/* HEADER */}

      <div className="analytics-header">
        <div>
          <span className="analytics-label">
            📊 LEARNOVA ANALYTICS
          </span>

          <h1>
            Your Study Analytics
          </h1>

          <p>
            Track your learning progress,
            completed tasks and subject
            performance.
          </p>
        </div>

        <button
          type="button"
          className="analytics-refresh-btn"
          onClick={handleRefresh}
        >
          🔄 Refresh
        </button>
      </div>


      {/* ERROR */}

      {error && (
        <div className="analytics-error">
          <span>
            ⚠️ {error}
          </span>

          <button
            type="button"
            onClick={handleRefresh}
          >
            Try Again
          </button>
        </div>
      )}


      {/* OVERVIEW */}

      <section className="analytics-overview">
        <div className="analytics-card">
          <div className="analytics-card-icon">
            📚
          </div>

          <div>
            <span>Total Tasks</span>
            <strong>
              {analytics.totalTasks}
            </strong>
            <small>
              Study tasks
            </small>
          </div>
        </div>

        <div className="analytics-card">
          <div className="analytics-card-icon">
            ✅
          </div>

          <div>
            <span>Completed</span>
            <strong>
              {analytics.completedTasks}
            </strong>
            <small>
              Tasks completed
            </small>
          </div>
        </div>

        <div className="analytics-card">
          <div className="analytics-card-icon">
            ⏳
          </div>

          <div>
            <span>Pending</span>
            <strong>
              {analytics.pendingTasks}
            </strong>
            <small>
              Tasks remaining
            </small>
          </div>
        </div>

        <div className="analytics-card">
          <div className="analytics-card-icon">
            📈
          </div>

          <div>
            <span>
              Overall Progress
            </span>
            <strong>
              {analytics.progress}%
            </strong>
            <small>
              Completion rate
            </small>
          </div>
        </div>
      </section>


      {/* OVERALL PROGRESS */}

      <section className="analytics-panel">
        <div className="analytics-panel-header">
          <div>
            <h2>
              Overall Study Progress
            </h2>

            <p>
              Based on your completed study
              tasks.
            </p>
          </div>

          <strong>
            {analytics.progress}%
          </strong>
        </div>

        <div className="analytics-progress-bar">
          <div
            className="analytics-progress-fill"
            style={{
              width:
                `${analytics.progress}%`,
            }}
          />
        </div>

        <div className="analytics-progress-footer">
          <span>
            {analytics.completedTasks}
            {" "}completed
          </span>

          <span>
            {analytics.pendingTasks}
            {" "}pending
          </span>

          <span>
            {analytics.completionRatio}
          </span>
        </div>
      </section>


      {/* WEEKLY ACTIVITY */}

      <section className="analytics-panel">
        <div className="analytics-panel-header">
          <div>
            <h2>
              📅 Weekly Study Activity
            </h2>

            <p>
              Your task activity during the
              last 7 days.
            </p>
          </div>

          <strong>
            {analytics.weeklyProgress}%
          </strong>
        </div>

        <div className="analytics-mini-grid">
          <div className="analytics-mini-card">
            <small>
              Weekly Tasks
            </small>
            <h3>
              {analytics.weeklyTasks}
            </h3>
          </div>

          <div className="analytics-mini-card">
            <small>
              Completed
            </small>
            <h3>
              {analytics.weeklyCompleted}
            </h3>
          </div>

          <div className="analytics-mini-card">
            <small>
              Weekly Progress
            </small>
            <h3>
              {analytics.weeklyProgress}%
            </h3>
          </div>
        </div>

        <div className="analytics-bar-chart">
          {analytics.weeklyActivity.map(
            (day) => {
              const maxTasks =
                Math.max(
                  ...analytics.weeklyActivity.map(
                    (item) =>
                      item.total
                  ),
                  1
                );

              const height =
                day.total === 0
                  ? 8
                  : Math.max(
                      20,
                      (day.total /
                        maxTasks) *
                        170
                    );

              return (
                <div
                  key={
                    day.date.toISOString()
                  }
                  className="analytics-bar-column"
                >
                  <span className="analytics-bar-value">
                    {day.total}
                  </span>

                  <div
                    className={`analytics-bar ${
                      day.completed > 0
                        ? "analytics-bar-completed"
                        : ""
                    }`}
                    title={`${day.total} task(s), ${day.completed} completed`}
                    style={{
                      height:
                        `${height}px`,
                    }}
                  />

                  <span className="analytics-bar-day">
                    {day.day}
                  </span>
                </div>
              );
            }
          )}
        </div>
      </section>


      {/* CONSISTENCY */}

      <section className="analytics-panel">
        <div className="analytics-panel-header">
          <div>
            <h2>
              🔥 Study Consistency
            </h2>

            <p>
              Your study routine across the
              last 7 days.
            </p>
          </div>

          <strong>
            {analytics.consistencyLevel}
          </strong>
        </div>

        <div className="analytics-three-grid">
          <div className="analytics-mini-card">
            <small>
              Consistency Score
            </small>

            <h3>
              {analytics.consistencyScore}%
            </h3>
          </div>

          <div className="analytics-mini-card">
            <small>
              Active Study Days
            </small>

            <h3>
              {analytics.activeStudyDays}
              {" / 7"}
            </h3>
          </div>

          <div className="analytics-mini-card">
            <small>
              Completed Days
            </small>

            <h3>
              {analytics.completedStudyDays}
              {" / 7"}
            </h3>
          </div>
        </div>

        <div className="analytics-message-box">
          <strong>
            {analytics.consistencyLevel}
          </strong>

          <p>
            {analytics.consistencyMessage}
          </p>
        </div>
      </section>


      {/* SUBJECT PERFORMANCE */}

      <section className="analytics-panel">
        <div className="analytics-panel-header">
          <div>
            <h2>
              📚 Subject Performance
            </h2>

            <p>
              Your progress across your
              current subjects.
            </p>
          </div>
        </div>

        {analytics.subjectProgress.length ===
        0 ? (
          <div className="analytics-empty-box">
            <strong>
              No current subjects.
            </strong>

            <p>
              Add a subject from the Subjects
              page to see its progress here.
            </p>
          </div>
        ) : (
          <div className="analytics-subject-list">
            {analytics.subjectProgress.map(
              (subject) => (
                <div
                  className="analytics-subject"
                  key={subject.name}
                >
                  <div className="analytics-subject-top">
                    <div>
                      <strong>
                        {subject.name}
                      </strong>

                      <span>
                        {subject.completed}
                        {" completed / "}
                        {subject.total}
                        {" tasks"}
                      </span>
                    </div>

                    <strong>
                      {subject.percentage}%
                    </strong>
                  </div>

                  <div className="analytics-subject-bar">
                    <div
                      className="analytics-subject-fill"
                      style={{
                        width:
                          `${subject.percentage}%`,
                      }}
                    />
                  </div>

                  <small>
                    {subject.pending === 0
                      ? subject.total === 0
                        ? "📌 No tasks yet"
                        : "🎉 All tasks completed"
                      : `${subject.pending} pending task${
                          subject.pending > 1
                            ? "s"
                            : ""
                        }`}
                  </small>
                </div>
              )
            )}
          </div>
        )}
      </section>


      {/* QUIZ PERFORMANCE */}

      <section className="analytics-panel">
        <div className="analytics-panel-header">
          <div>
            <h2>
              🧠 Quiz Performance
            </h2>

            <p>
              Quiz results for your current
              subjects.
            </p>
          </div>

          {analytics.totalQuizzes > 0 && (
            <strong>
              {analytics.averageQuizScore}%
              {" "}avg.
            </strong>
          )}
        </div>

        {quizError && (
          <div className="analytics-error">
            <span>
              ⚠️ {quizError}
            </span>

            <button
              type="button"
              onClick={handleRefresh}
            >
              Try Again
            </button>
          </div>
        )}

        {quizLoading ? (
          <p className="analytics-muted-text">
            Loading quiz performance...
          </p>
        ) : analytics.totalQuizzes ===
          0 ? (
          <div className="analytics-empty-box">
            <strong>
              No quiz results for current
              subjects.
            </strong>

            <p>
              Complete a quiz using one of your
              current subjects to see performance.
            </p>
          </div>
        ) : (
          <>
            <div className="analytics-three-grid">
              <div className="analytics-mini-card">
                <small>
                  Total Quizzes
                </small>

                <h3>
                  {analytics.totalQuizzes}
                </h3>
              </div>

              <div className="analytics-mini-card">
                <small>
                  Average Score
                </small>

                <h3>
                  {analytics.averageQuizScore}%
                </h3>
              </div>

              <div className="analytics-mini-card">
                <small>
                  Best Score
                </small>

                <h3>
                  {analytics.bestQuizScore}%
                </h3>
              </div>
            </div>

            <h3 className="analytics-sub-heading">
              Subject-wise Quiz Performance
            </h3>

            <div className="analytics-subject-list">
              {analytics.quizSubjectPerformance.map(
                (subject) => (
                  <div
                    className="analytics-subject"
                    key={subject.name}
                  >
                    <div className="analytics-subject-top">
                      <div>
                        <strong>
                          {subject.name}
                        </strong>

                        <span>
                          {subject.quizzes}
                          {" "}
                          quiz
                          {subject.quizzes >
                          1
                            ? "zes"
                            : ""}
                        </span>
                      </div>

                      <strong>
                        {subject.percentage}%
                      </strong>
                    </div>

                    <div className="analytics-subject-bar">
                      <div
                        className="analytics-subject-fill"
                        style={{
                          width:
                            `${subject.percentage}%`,
                        }}
                      />
                    </div>
                  </div>
                )
              )}
            </div>

            <h3 className="analytics-sub-heading">
              Recent Quiz Results
            </h3>

            <div className="analytics-recent-list">
              {analytics.recentQuizResults.map(
                (result, index) => (
                  <div
                    key={
                      result?._id ||
                      `${result?.subject}-${result?.createdAt}-${index}`
                    }
                    className="analytics-result-card"
                  >
                    <div>
                      <strong>
                        {result?.topic ||
                          "General"}
                      </strong>

                      <div className="analytics-result-meta">
                        {result?.subject ||
                          "General"}
                        {" • "}
                        {result?.score || 0}
                        {" / "}
                        {
                          result?.totalQuestions ||
                          0
                        }
                      </div>
                    </div>

                    <strong>
                      {Number(
                        result?.percentage ||
                          0
                      )}%
                    </strong>
                  </div>
                )
              )}
            </div>
          </>
        )}
      </section>


      {/* QUIZ TREND */}

      <section className="analytics-panel">
        <div className="analytics-panel-header">
          <div>
            <h2>
              📈 Quiz Progress Trend
            </h2>

            <p>
              See how your current-subject quiz
              performance changes over time.
            </p>
          </div>

          {analytics.quizProgressTrend.length >
            0 && (
            <strong>
              Latest:{" "}
              {
                analytics.quizProgressTrend[
                  analytics.quizProgressTrend.length -
                    1
                ].score
              }%
            </strong>
          )}
        </div>

        {analytics.quizProgressTrend.length ===
        0 ? (
          <div className="analytics-empty-box">
            <strong>
              No quiz trend data yet.
            </strong>

            <p>
              Complete quizzes for your current
              subjects to build the trend.
            </p>
          </div>
        ) : (
          <>
            <div className="analytics-trend-scroll">
              <div className="analytics-trend-inner">
                <div className="analytics-trend-chart">
                  {analytics.quizProgressTrend.map(
                    (quiz) => (
                      <div
                        key={quiz.id}
                        className="analytics-trend-column"
                        title={`${quiz.topic} — ${quiz.score}%`}
                      >
                        <strong>
                          {quiz.score}%
                        </strong>

                        <div
                          className="analytics-trend-bar"
                          style={{
                            height:
                              `${Math.max(
                                quiz.score,
                                4
                              )}%`,
                          }}
                        />

                        <span>
                          {quiz.label}
                        </span>
                      </div>
                    )
                  )}
                </div>

                <div className="analytics-trend-scale">
                  <span>0%</span>

                  <span>
                    Performance score
                  </span>

                  <span>100%</span>
                </div>
              </div>
            </div>

            <div className="analytics-two-grid">
              <div className="analytics-mini-card">
                <small>
                  First Quiz
                </small>

                <h3>
                  {analytics.firstQuizScore}%
                </h3>
              </div>

              <div className="analytics-mini-card">
                <small>
                  Latest Quiz
                </small>

                <h3>
                  {analytics.latestQuizScore}%
                </h3>
              </div>
            </div>
          </>
        )}
      </section>


      {/* PERFORMANCE DIRECTION */}

      <section className="analytics-panel">
        <div className="analytics-panel-header">
          <div>
            <h2>
              {analytics.performanceDirectionIcon}
              {" "}
              Performance Direction
            </h2>

            <p>
              Learnova compares your first and
              latest current-subject quiz.
            </p>
          </div>

          <strong>
            {analytics.performanceDirection}
          </strong>
        </div>

        <div className="analytics-three-grid">
          <div className="analytics-mini-card">
            <small>
              First Quiz
            </small>

            <h3>
              {analytics.firstQuizScore}%
            </h3>
          </div>

          <div className="analytics-mini-card">
            <small>
              Latest Quiz
            </small>

            <h3>
              {analytics.latestQuizScore}%
            </h3>
          </div>

          <div className="analytics-mini-card">
            <small>
              Score Change
            </small>

            <h3>
              {analytics.scoreChange > 0
                ? "+"
                : ""}
              {analytics.scoreChange}%
            </h3>
          </div>
        </div>

        <div
          className={`analytics-direction-box ${
            analytics.performanceDirection ===
            "Improving"
              ? "analytics-direction-good"
              : analytics.performanceDirection ===
                  "Declining"
                ? "analytics-direction-warning"
                : ""
          }`}
        >
          <strong>
            {
              analytics.performanceDirectionIcon
            }
            {" "}
            {
              analytics.performanceDirection
            }
          </strong>

          <p>
            {
              analytics.performanceDirectionMessage
            }
          </p>
        </div>
      </section>


      {/* INTELLIGENT INSIGHT */}

      <section className="analytics-panel">
        <div className="analytics-panel-header">
          <div>
            <h2>
              🧠 Intelligent Study Insight
            </h2>

            <p>
              Learnova identifies where you
              should focus next.
            </p>
          </div>

          {analytics.weakSubject && (
            <strong>
              {analytics.weakSubjectLevel}
            </strong>
          )}
        </div>

        <div className="analytics-insight-grid">

          <div className="analytics-insight-card analytics-weak-card">
            <span>
              {analytics.weakSubjectLevel ===
              "Needs Attention"
                ? "⚠️ Needs Attention"
                : analytics.weakSubjectLevel ===
                    "Improving"
                  ? "📈 Improving"
                  : "✅ Good"}
            </span>

            <h3>
              {analytics.weakSubject
                ? analytics.weakSubject.name
                : "No quiz data yet"}
            </h3>

            <small>
              {analytics.weakSubject
                ? `${analytics.weakSubject.percentage}% average across ${analytics.weakSubject.quizzes} quiz${
                    analytics.weakSubject.quizzes >
                    1
                      ? "zes"
                      : ""
                  }`
                : "Complete a quiz for a current subject to detect your weakest area."}
            </small>

            <p>
              {
                analytics.weakSubjectMessage
              }
            </p>
          </div>


          <div className="analytics-insight-card analytics-ai-card">
            <span>
              🤖 Learnova Recommendation
            </span>

            <h3>
              {analytics.weakSubject
                ? `Focus on ${analytics.weakSubject.name}`
                : "Build your learning profile"}
            </h3>

            {aiRecommendationLoading ? (
              <p>
                🤖 Learnova is analyzing your
                current-subject quiz performance...
              </p>
            ) : aiRecommendation ? (
              <p>
                {aiRecommendation}
              </p>
            ) : (
              <p>
                {analytics.aiRecommendation}
              </p>
            )}

            {aiRecommendationError && (
              <small className="analytics-ai-error">
                ⚠️{" "}
                {aiRecommendationError}
              </small>
            )}
          </div>

        </div>
      </section>


      {/* SMART ACTIONS */}

      <section className="analytics-panel">
        <div className="analytics-panel-header">
          <div>
            <h2>
              🎯 Smart Next Study Actions
            </h2>

            <p>
              Learnova turns your performance
              into clear next steps.
            </p>
          </div>

          <strong>
            {analytics.performanceDirection}
          </strong>
        </div>

        <div className="analytics-actions-grid">
          {analytics.smartStudyActions.map(
            (action, index) => (
              <div
                key={`${action.title}-${index}`}
                className="analytics-action-card"
              >
                <div className="analytics-action-icon">
                  {action.icon}
                </div>

                <h3>
                  {action.title}
                </h3>

                <p>
                  {action.text}
                </p>
              </div>
            )
          )}
        </div>
      </section>


      {/* STUDY SUMMARY */}

      <section className="analytics-summary">
        <div className="analytics-summary-icon">
          🤖
        </div>

        <div>
          <h2>
            Learnova Study Summary
          </h2>

          {analytics.totalQuizzes > 0 &&
          analytics.weakSubject ? (
            <p>
              🧠 Your quiz average is{" "}
              <strong>
                {analytics.averageQuizScore}%
              </strong>
              {" "}and{" "}
              <strong>
                {analytics.weakSubject.name}
              </strong>
              {" "}is currently the subject
              needing the most attention at{" "}
              <strong>
                {
                  analytics.weakSubject
                    .percentage
                }%
              </strong>
              .{" "}
              {aiRecommendation
                ? "Use the AI recommendation above for your next study session."
                : "Use the recommendation above for your next study session."}
            </p>
          ) : analytics.totalTasks ===
            0 ? (
            <p>
              You haven't created any study
              tasks yet. Create your first task
              to start tracking your learning
              progress.
            </p>
          ) : analytics.progress ===
            100 ? (
            <p>
              🎉 Excellent work! You have
              completed all your current study
              tasks.
            </p>
          ) : analytics.progress >= 75 ? (
            <p>
              🔥 Great progress! You're more
              than halfway through your current
              study plan. Keep going!
            </p>
          ) : analytics.progress >= 40 ? (
            <p>
              💪 You're making good progress.
              Focus on your remaining tasks and
              keep your study consistency.
            </p>
          ) : (
            <p>
              🚀 Your journey has started.
              Complete your pending tasks one by
              one and build your study momentum.
            </p>
          )}
        </div>
      </section>

    </main>
  );
}

export default Analytics;