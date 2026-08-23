// =====================================================
// LEARNOVA AI
// ADVANCED ANALYTICS PAGE
// =====================================================
import "./analytics.css";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { getTasks } from "../services/taskService";

// =====================================================
// AVAILABLE SUBJECTS
// =====================================================

const SUBJECTS = [
  "Python",
  "AI",
  "SPM",
  "DBMS",
  "DSA",
  "OS",
];

// =====================================================
// FETCH TASKS
// =====================================================

const fetchAnalyticsTasks = async () => {
  try {
    const result = await getTasks();

    if (!result.success) {
      return {
        success: false,
        tasks: [],
        message:
          result.message ||
          "Unable to load analytics.",
      };
    }

    const tasks = Array.isArray(result.tasks)
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
      "Analytics loading error:",
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
// GET TASK DATE
// =====================================================

const getTaskDate = (task) => {
  const possibleDate =
    task.date ||
    task.dueDate ||
    task.createdAt ||
    task.created_at;

  if (!possibleDate) {
    return null;
  }

  const date = new Date(possibleDate);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
};

// =====================================================
// GET LAST 7 DAYS
// =====================================================

const getLastSevenDays = () => {
  const days = [];
  const today = new Date();

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);

    date.setHours(0, 0, 0, 0);
    date.setDate(today.getDate() - i);

    days.push(date);
  }

  return days;
};

// =====================================================
// FORMAT DAY
// =====================================================

const formatDay = (date) => {
  return date.toLocaleDateString(
    "en-US",
    {
      weekday: "short",
    }
  );
};

// =====================================================
// FETCH QUIZ RESULTS
// =====================================================

const fetchQuizResults = async () => {
  try {
    const token =
      localStorage.getItem("learnova_token") ||
      localStorage.getItem("token");

    const headers = {
      "Content-Type": "application/json",
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

    const data = await response.json();

    return {
      success: response.ok,
      results: Array.isArray(data.results)
        ? data.results
        : [],
      message:
        data.message || "",
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
// ANALYTICS
// =====================================================

function Analytics() {
  // ===================================================
  // TASK STATE
  // ===================================================

  const [tasks, setTasks] = useState([]);

  // ===================================================
  // QUIZ STATE
  // ===================================================

  const [quizResults, setQuizResults] =
    useState([]);

  const [quizLoading, setQuizLoading] =
    useState(true);

  const [quizError, setQuizError] =
    useState("");

  // ===================================================
  // AI RECOMMENDATION STATE
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
  // LOADING
  // ===================================================

  const [loading, setLoading] =
    useState(true);

  // ===================================================
  // ERROR
  // ===================================================

  const [error, setError] =
    useState("");

  // ===================================================
  // AI RECOMMENDATION
  // ===================================================

  const generateAIRecommendation =
    useCallback(
      async (results) => {
        if (
          !Array.isArray(results) ||
          results.length === 0
        ) {
          setAiRecommendation(
            "Complete an AI quiz so Learnova can create a personalized study recommendation."
          );

          setAiRecommendationError("");

          return;
        }

        try {
          setAiRecommendationLoading(true);
          setAiRecommendationError("");

          const totalQuizzes =
            results.length;

          const averageScore =
            Math.round(
              results.reduce(
                (sum, result) =>
                  sum +
                  Number(
                    result.percentage || 0
                  ),
                0
              ) / totalQuizzes
            );

          const subjectMap = {};

          results.forEach((result) => {
            const subject =
              result.subject ||
              "General";

            if (!subjectMap[subject]) {
              subjectMap[subject] = {
                total: 0,
                count: 0,
              };
            }

            subjectMap[subject].total +=
              Number(
                result.percentage || 0
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
                  a.average -
                  b.average
              );

          const weakest =
            subjectAverages[0] || {
              subject: "General",
              average: 0,
            };

          const response =
            await fetch(
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
              data.message ||
                "Unable to generate AI recommendation."
            );
          }

          if (
            !data.recommendation ||
            typeof data.recommendation !==
              "string"
          ) {
            throw new Error(
              "AI returned an empty recommendation."
            );
          }

          setAiRecommendation(
            data.recommendation.trim()
          );
        } catch (error) {
          console.error(
            "AI recommendation error:",
            error
          );

          setAiRecommendationError(
            error.message ||
              "AI recommendation unavailable."
          );
        } finally {
          setAiRecommendationLoading(
            false
          );
        }
      },
      []
    );

  // ===================================================
  // LOAD ANALYTICS
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

        if (!taskResult.success) {
          setError(
            taskResult.message
          );
        } else {
          setTasks(
            taskResult.tasks
          );
          setError("");
        }

        if (!quizResult.success) {
          setQuizError(
            quizResult.message
          );
        } else {
          setQuizResults(
            quizResult.results
          );

          setQuizError("");

          generateAIRecommendation(
            quizResult.results
          );
        }

        setLoading(false);
        setQuizLoading(false);
      };

    loadAnalytics();

    return () => {
      active = false;
    };
  }, [
    generateAIRecommendation,
  ]);

  // ===================================================
  // CALCULATE ANALYTICS
  // ===================================================

  const analytics = useMemo(() => {
    const totalTasks =
      tasks.length;

    const completedTasks =
      tasks.filter(
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
            (completedTasks /
              totalTasks) *
              100
          );

    // -----------------------------------------------
    // SUBJECT PROGRESS
    // -----------------------------------------------

    const subjectProgress =
      SUBJECTS.map(
        (subjectName) => {
          const subjectTasks =
            tasks.filter(
              (task) =>
                task.subject
                  ?.toLowerCase() ===
                subjectName.toLowerCase()
            );

          const total =
            subjectTasks.length;

          const completed =
            subjectTasks.filter(
              (task) =>
                task.completed === true
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

    // -----------------------------------------------
    // BEST SUBJECT
    // -----------------------------------------------

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

    // -----------------------------------------------
    // WEEKLY ACTIVITY
    // -----------------------------------------------

    const lastSevenDays =
      getLastSevenDays();

    const weeklyActivity =
      lastSevenDays.map(
        (date) => {
          const dayTasks =
            tasks.filter(
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
                task.completed === true
            ).length;

          return {
            day:
              formatDay(date),
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

    // -----------------------------------------------
    // CONSISTENCY
    // -----------------------------------------------

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

    // -----------------------------------------------
    // QUIZ ANALYTICS
    // -----------------------------------------------

    const totalQuizzes =
      quizResults.length;

    const totalQuizQuestions =
      quizResults.reduce(
        (sum, result) =>
          sum +
          Number(
            result.totalQuestions ||
              0
          ),
        0
      );

    const totalQuizCorrect =
      quizResults.reduce(
        (sum, result) =>
          sum +
          Number(
            result.score || 0
          ),
        0
      );

    const averageQuizScore =
      totalQuizzes === 0
        ? 0
        : Math.round(
            quizResults.reduce(
              (sum, result) =>
                sum +
                Number(
                  result.percentage ||
                    0
                ),
              0
            ) / totalQuizzes
          );

    const bestQuizScore =
      totalQuizzes === 0
        ? 0
        : Math.max(
            ...quizResults.map(
              (result) =>
                Number(
                  result.percentage ||
                    0
                )
            )
          );

    // -----------------------------------------------
    // QUIZ SUBJECT PERFORMANCE
    // -----------------------------------------------

    const quizSubjectMap = {};

    quizResults.forEach(
      (result) => {
        const subject =
          result.subject ||
          "General";

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
            result.percentage ||
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

    const recentQuizResults =
      quizResults.slice(0, 5);

    // -----------------------------------------------
    // QUIZ TREND
    // -----------------------------------------------

    const quizTrendResults =
      [...quizResults]
        .sort(
          (a, b) =>
            new Date(
              a.createdAt || 0
            ) -
            new Date(
              b.createdAt || 0
            )
        )
        .slice(-10);

    const quizProgressTrend =
      quizTrendResults.map(
        (result, index) => ({
          id:
            result._id ||
            `${result.subject || "quiz"}-${index}`,
          label:
            `Quiz ${index + 1}`,
          topic:
            result.topic ||
            "General",
          subject:
            result.subject ||
            "General",
          score:
            Number(
              result.percentage || 0
            ),
          date:
            result.createdAt
              ? new Date(
                  result.createdAt
                ).toLocaleDateString()
              : "",
        })
      );

    // -----------------------------------------------
    // PERFORMANCE DIRECTION
    // -----------------------------------------------

    const firstQuizScore =
      quizProgressTrend.length > 0
        ? quizProgressTrend[0]
            .score
        : 0;

    const latestQuizScore =
      quizProgressTrend.length > 0
        ? quizProgressTrend[
            quizProgressTrend.length -
              1
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

    // -----------------------------------------------
    // WEAK SUBJECT
    // -----------------------------------------------

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
        : quizProgressTrend.length <
            2
          ? weakSubject.percentage <
            50
            ? "Needs Attention"
            : weakSubject.percentage <
                70
              ? "Improving"
              : "Good"
          : performanceDirection;

    const weakSubjectMessage =
      !weakSubject
        ? "Complete an AI quiz to identify the subject that needs the most attention."
        : performanceDirection ===
            "Declining"
          ? `${weakSubject.name} needs attention because your latest quiz performance declined. Review the latest quiz mistakes before attempting another quiz.`
          : performanceDirection ===
              "Improving"
            ? `${weakSubject.name} is improving. Keep practicing and review mistakes to strengthen your understanding.`
            : performanceDirection ===
                "Stable"
              ? `${weakSubject.name} is currently stable. Target the concepts you miss most often to create an upward trend.`
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
            : performanceDirection ===
                "Stable"
              ? `Focus on ${weakSubject.name}. Identify repeated mistakes and practice targeted questions to improve your next score.`
              : `Prioritize ${weakSubject.name}. Review the core concepts, practice 10–15 questions, and retake a quiz after revision.`;

    // -----------------------------------------------
    // SMART ACTIONS
    // -----------------------------------------------

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
                title: `Revise ${weakSubject.name}`,
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
          : performanceDirection ===
              "Improving"
            ? [
                {
                  icon: "📈",
                  title:
                    "Maintain the momentum",
                  text: `Keep practicing ${weakSubject.name} while your score is moving upward.`,
                },
                {
                  icon: "🧠",
                  title:
                    "Review mistakes",
                  text:
                    "Spend a few minutes reviewing incorrect answers so improvement becomes consistent.",
                },
                {
                  icon: "🎯",
                  title:
                    "Challenge yourself",
                  text:
                    "Try another short quiz to confirm that the improvement is sustained.",
                },
              ]
            : [
                {
                  icon: "🎯",
                  title: `Target ${weakSubject.name}`,
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
  }, [tasks, quizResults]);

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

    if (!taskResult.success) {
      setError(
        taskResult.message
      );
    } else {
      setTasks(
        taskResult.tasks
      );
    }

    if (!quizResult.success) {
      setQuizError(
        quizResult.message
      );
    } else {
      setQuizResults(
        quizResult.results
      );

      generateAIRecommendation(
        quizResult.results
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
    <main
      className="analytics-page"
    >
      {/* =================================================
          HEADER
          ================================================= */}

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

      {/* =================================================
          ERROR
          ================================================= */}

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

      {/* =================================================
          OVERVIEW
          ================================================= */}

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

      {/* =================================================
          OVERALL PROGRESS
          ================================================= */}

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
            {analytics.completedTasks}{" "}
            completed
          </span>

          <span>
            {analytics.pendingTasks}{" "}
            pending
          </span>

          <span>
            {analytics.completionRatio}
          </span>
        </div>
      </section>

      {/* =================================================
          WEEKLY ACTIVITY
          ================================================= */}

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
                  key={day.date.toISOString()}
                  className="analytics-bar-column"
                >
                  <span className="analytics-bar-value">
                    {day.total}
                  </span>

                  <div
                    title={`${day.total} task(s), ${day.completed} completed`}
                    className={`analytics-bar ${
                      day.completed > 0
                        ? "analytics-bar-completed"
                        : ""
                    }`}
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

      {/* =================================================
          CONSISTENCY
          ================================================= */}

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
              {analytics.activeStudyDays} / 7
            </h3>
          </div>

          <div className="analytics-mini-card">
            <small>
              Completed Days
            </small>

            <h3>
              {analytics.completedStudyDays} / 7
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

      {/* =================================================
          SUBJECT PERFORMANCE
          ================================================= */}

      <section className="analytics-panel">
        <div className="analytics-panel-header">
          <div>
            <h2>
              📚 Subject Performance
            </h2>

            <p>
              Your progress across different
              subjects.
            </p>
          </div>
        </div>

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
                      {" "}
                      completed /{" "}
                      {subject.total}
                      {" "}
                      tasks
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
      </section>

      {/* =================================================
          QUIZ PERFORMANCE
          ================================================= */}

      <section className="analytics-panel">
        <div className="analytics-panel-header">
          <div>
            <h2>
              🧠 Quiz Performance
            </h2>

            <p>
              Your AI quiz results saved from
              Learnova AI.
            </p>
          </div>

          {analytics.totalQuizzes > 0 && (
            <strong>
              {analytics.averageQuizScore}%
              {" "}
              avg.
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
              No quiz results yet.
            </strong>

            <p>
              Complete an AI quiz to see your
              performance here.
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
                          {subject.quizzes}{" "}
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
                (result) => (
                  <div
                    key={
                      result._id ||
                      `${result.subject}-${result.createdAt}`
                    }
                    className="analytics-result-card"
                  >
                    <div>
                      <strong>
                        {result.topic ||
                          "General"}
                      </strong>

                      <div className="analytics-result-meta">
                        {result.subject ||
                          "General"}
                        {" • "}
                        {result.score}
                        {" / "}
                        {
                          result.totalQuestions
                        }
                      </div>
                    </div>

                    <strong>
                      {result.percentage}%
                    </strong>
                  </div>
                )
              )}
            </div>
          </>
        )}
      </section>

      {/* =================================================
          QUIZ TREND
          ================================================= */}

      <section className="analytics-panel">
        <div className="analytics-panel-header">
          <div>
            <h2>
              📈 Quiz Progress Trend
            </h2>

            <p>
              See how your quiz performance is
              changing over time.
            </p>
          </div>

          {analytics.quizProgressTrend.length >
            0 && (
            <strong>
              Latest:{" "}
              {
                analytics.quizProgressTrend[
                  analytics.quizProgressTrend
                    .length - 1
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
              Complete quizzes to build your
              performance trend.
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
                  {
                    analytics
                      .quizProgressTrend[0]
                      .score
                  }%
                </h3>
              </div>

              <div className="analytics-mini-card">
                <small>
                  Latest Quiz
                </small>

                <h3>
                  {
                    analytics
                      .quizProgressTrend[
                      analytics
                        .quizProgressTrend
                        .length - 1
                    ].score
                  }%
                </h3>
              </div>
            </div>
          </>
        )}
      </section>

      {/* =================================================
          PERFORMANCE DIRECTION
          ================================================= */}

      <section className="analytics-panel">
        <div className="analytics-panel-header">
          <div>
            <h2>
              {analytics.performanceDirectionIcon}{" "}
              Performance Direction
            </h2>

            <p>
              Learnova compares your first and
              latest quiz performance.
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
            }{" "}
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

      {/* =================================================
          INTELLIGENT INSIGHT
          ================================================= */}

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
          {/* WEAK SUBJECT */}

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
                    analytics
                      .weakSubject
                      .quizzes > 1
                      ? "zes"
                      : ""
                  }`
                : "Complete an AI quiz to detect your weakest subject."}
            </small>

            <p>
              {
                analytics.weakSubjectMessage
              }
            </p>
          </div>

          {/* AI RECOMMENDATION */}

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
                quiz performance...
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

      {/* =================================================
          SMART ACTIONS
          ================================================= */}

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

      {/* =================================================
          STUDY SUMMARY
          ================================================= */}

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

      {/* =================================================
          DARK MODE STYLES
          ================================================= */}
    </main>
  );
}

export default Analytics;