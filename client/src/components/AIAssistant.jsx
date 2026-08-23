// =====================================================
// LEARNOVA AI
// ADVANCED PERSONALIZED LOCAL AI ASSISTANT + AI QUIZ
// =====================================================
//
// React
//   ↓
// Express
//   ↓
// /api/ai/chat
// /api/ai/quiz
// /api/tasks
// /api/quiz-results
//   ↓
// Ollama
//   ↓
// Llama 3.2 3B
//
// Features:
// - Personalized AI chat
// - Live task context
// - Live quiz-result context
// - Weak-subject detection
// - Average quiz score
// - Personalized recommendations
// - AI Quiz
// - Quiz result saving
// - Chat history
// - Local fallback
// =====================================================

import {
  useEffect,
  useRef,
  useState,
} from "react";

import ReactMarkdown from "react-markdown";


// =====================================================
// API CONFIG
// =====================================================

const AI_API_URL =
  "http://localhost:5000/api/ai/chat";

const QUIZ_API_URL =
  "http://localhost:5000/api/ai/quiz";

const TASKS_API_URL =
  "http://localhost:5000/api/tasks";

const QUIZ_RESULTS_API_URL =
  "http://localhost:5000/api/quiz-results";

const QUIZ_RESULT_API_URL =
  "http://localhost:5000/api/quiz-results";

const REQUEST_TIMEOUT =
  60000;


// =====================================================
// DEFAULT / PERSONALIZED WELCOME MESSAGE
// =====================================================

const getDisplayName = (user) => {
  const name =
    user?.name ||
    user?.fullName ||
    user?.username ||
    user?.firstName ||
    user?.displayName;

  if (typeof name === "string" && name.trim()) {
    return name.trim().split(" ")[0];
  }

  return "Student";
};

const createDefaultMessage = (user) => {
  const displayName = getDisplayName(user);

  return {
    id: "learnova-welcome",
    sender: "ai",
    text:
      `Hi ${displayName}! 👋 I'm **Learnova AI**, your personal study assistant.\n\nAsk me anything about your studies, programming, projects, or general topics.`,
  };
};


// =====================================================
// GET CURRENT USER
// =====================================================

const getCurrentUser = () => {
  try {
    const savedUser =
      localStorage.getItem(
        "learnova_user"
      );

    if (!savedUser) {
      return null;
    }

    return JSON.parse(savedUser);

  } catch (error) {

    console.error(
      "Learnova user error:",
      error
    );

    return null;
  }
};


// =====================================================
// GET AUTH TOKEN
// =====================================================

const getAuthToken = () => {
  return localStorage.getItem(
    "learnova_token"
  );
};


// =====================================================
// NORMALIZE TASKS
// =====================================================

const normalizeTasks = (tasks) => {

  if (!Array.isArray(tasks)) {
    return [];
  }

  return tasks.map((task) => ({
    ...task,

    title:
      task?.title ||
      "Untitled Task",

    subject:
      task?.subject ||
      "General",

    time:
      task?.time ||
      task?.dueTime ||
      "Not specified",

    completed:
      Boolean(task?.completed),
  }));
};


// =====================================================
// NORMALIZE QUIZ RESULTS
// =====================================================

const normalizeQuizResults = (
  results
) => {

  if (!Array.isArray(results)) {
    return [];
  }

  return results.map((result) => ({
    ...result,

    subject:
      result?.subject ||
      "General",

    topic:
      result?.topic ||
      "General",

    difficulty:
      result?.difficulty ||
      "easy",

    score:
      Number(result?.score || 0),

    totalQuestions:
      Number(
        result?.totalQuestions || 0
      ),

    percentage:
      Number(
        result?.percentage || 0
      ),
  }));
};


// =====================================================
// BUILD PERSONALIZED CONTEXT
// =====================================================

const buildPersonalizedContext = (
  tasks,
  results
) => {

  const safeTasks =
    normalizeTasks(tasks);

  const safeResults =
    normalizeQuizResults(results);


  // ---------------------------------------------------
  // TASK STATS
  // ---------------------------------------------------

  const totalTasks =
    safeTasks.length;

  const completedTasks =
    safeTasks.filter(
      (task) =>
        task.completed
    ).length;

  const pendingTasks =
    totalTasks -
    completedTasks;

  const taskProgress =
    totalTasks === 0
      ? 0
      : Math.round(
          (completedTasks /
            totalTasks) *
            100
        );


  // ---------------------------------------------------
  // QUIZ STATS
  // ---------------------------------------------------

  const totalQuizzes =
    safeResults.length;

  const averageQuizScore =
    totalQuizzes === 0
      ? 0
      : Math.round(
          safeResults.reduce(
            (sum, result) =>
              sum +
              Number(
                result.percentage ||
                  0
              ),
            0
          ) /
            totalQuizzes
        );


  const bestQuizScore =
    totalQuizzes === 0
      ? 0
      : Math.max(
          ...safeResults.map(
            (result) =>
              Number(
                result.percentage ||
                  0
              )
          )
        );


  // ---------------------------------------------------
  // SUBJECT PERFORMANCE
  // ---------------------------------------------------

  const subjectMap = {};

  safeResults.forEach(
    (result) => {

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
          result.percentage ||
            0
        );

      subjectMap[subject].count +=
        1;
    }
  );


  const subjectPerformance =
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


  const weakestSubject =
    subjectPerformance[0] ||
    null;

  const strongestSubject =
    subjectPerformance[
      subjectPerformance.length - 1
    ] || null;


  // ---------------------------------------------------
  // PERFORMANCE DIRECTION
  // ---------------------------------------------------

  let performanceDirection =
    "Not enough data";

  if (safeResults.length >= 2) {

    const recent =
      Number(
        safeResults[0]
          ?.percentage || 0
      );

    const previous =
      Number(
        safeResults[1]
          ?.percentage || 0
      );

    if (
      recent > previous
    ) {
      performanceDirection =
        "Improving";
    } else if (
      recent < previous
    ) {
      performanceDirection =
        "Needs attention";
    } else {
      performanceDirection =
        "Stable";
    }
  }


  // ---------------------------------------------------
  // PENDING TASKS
  // ---------------------------------------------------

  const pendingTaskList =
    safeTasks
      .filter(
        (task) =>
          !task.completed
      )
      .slice(0, 10)
      .map(
        (task, index) =>
          `${index + 1}. ${task.title} — ${task.subject} — ${task.time}`
      )
      .join("\n");


  // ---------------------------------------------------
  // COMPLETED TASKS
  // ---------------------------------------------------

  const completedTaskList =
    safeTasks
      .filter(
        (task) =>
          task.completed
      )
      .slice(0, 10)
      .map(
        (task, index) =>
          `${index + 1}. ${task.title} — ${task.subject}`
      )
      .join("\n");


  // ---------------------------------------------------
  // RECENT QUIZ RESULTS
  // ---------------------------------------------------

  const recentQuizResults =
    safeResults
      .slice(0, 10)
      .map(
        (result, index) =>
          `${index + 1}. ${result.subject} — ${result.topic} — ${result.percentage}% (${result.difficulty})`
      )
      .join("\n");


  // ---------------------------------------------------
  // RETURN CONTEXT
  // ---------------------------------------------------

  return `
=====================================================
LEARNOVA PERSONALIZED STUDENT CONTEXT
=====================================================

TASK SUMMARY
------------
Total Tasks: ${totalTasks}
Completed Tasks: ${completedTasks}
Pending Tasks: ${pendingTasks}
Task Completion: ${taskProgress}%


PENDING TASKS
-------------
${
  pendingTaskList ||
  "No pending tasks."
}


RECENTLY COMPLETED TASKS
------------------------
${
  completedTaskList ||
  "No completed tasks available."
}


QUIZ PERFORMANCE
----------------
Total Quizzes: ${totalQuizzes}
Average Quiz Score: ${averageQuizScore}%
Best Quiz Score: ${bestQuizScore}%
Performance Direction: ${performanceDirection}


WEAKEST SUBJECT
---------------
${
  weakestSubject
    ? `${weakestSubject.subject} — ${weakestSubject.average}%`
    : "Not enough quiz data."
}


STRONGEST SUBJECT
-----------------
${
  strongestSubject
    ? `${strongestSubject.subject} — ${strongestSubject.average}%`
    : "Not enough quiz data."
}


SUBJECT PERFORMANCE
-------------------
${
  subjectPerformance.length > 0
    ? subjectPerformance
        .map(
          (item) =>
            `${item.subject}: ${item.average}%`
        )
        .join("\n")
    : "No subject performance data."
}


RECENT QUIZ RESULTS
-------------------
${
  recentQuizResults ||
  "No quiz results available."
}


PERSONALIZATION RULES
---------------------
1. Use actual student data when relevant.
2. Never invent tasks, scores, subjects, or results.
3. If there is a weak subject, prioritize revision for it.
4. Prefer pending tasks when suggesting today's study plan.
5. If quiz performance is low, recommend revision and practice.
6. If performance is improving, encourage continued progress.
7. If performance is strong, recommend slightly harder practice.
8. Give practical and actionable study advice.
9. Keep explanations student-friendly.
10. Do not mention this internal context to the student.
`;
};


// =====================================================
// AI ASSISTANT
// =====================================================

function AIAssistant({
  studyTasks = [],
}) {

  // ===================================================
  // USER
  // ===================================================

  const currentUser =
    getCurrentUser();

  const userId =
    currentUser?._id ||
    currentUser?.id ||
    "guest";

  const chatStorageKey =
    `learnovaChatMessages_${userId}`;


  // ===================================================
  // TASKS
  // ===================================================

  const safeTasks =
    normalizeTasks(
      studyTasks
    );


  // ===================================================
  // CHAT STATE
  // ===================================================

  const [messages, setMessages] =
    useState(() => {

      try {

        const saved =
          localStorage.getItem(
            chatStorageKey
          );

        if (!saved) {
          return [
            createDefaultMessage(currentUser),
          ];
        }

        const parsed =
          JSON.parse(saved);

        if (
          Array.isArray(parsed) &&
          parsed.length > 0
        ) {
          // Sync old welcome messages with the currently logged-in user.
          return parsed.map((message, index) => {
            if (
              index === 0 &&
              message?.id === "learnova-welcome"
            ) {
              return createDefaultMessage(currentUser);
            }

            return message;
          });
        }

      } catch (error) {

        console.error(
          "Chat history error:",
          error
        );
      }

      return [
        createDefaultMessage(currentUser),
      ];
    });


  const [input, setInput] =
    useState("");


  const [isTyping, setIsTyping] =
    useState(false);


  const [error, setError] =
    useState("");


  // ===================================================
  // STUDENT DATA
  // ===================================================

  const [quizResults, setQuizResults] =
    useState([]);


  const [
    studentDataLoading,
    setStudentDataLoading,
  ] = useState(false);


  // ===================================================
  // QUIZ STATE
  // ===================================================

  const [quiz, setQuiz] =
    useState(null);


  const [quizLoading, setQuizLoading] =
    useState(false);


  const [quizError, setQuizError] =
    useState("");


  const [
    currentQuestion,
    setCurrentQuestion,
  ] = useState(0);


  const [
    selectedAnswer,
    setSelectedAnswer,
  ] = useState(null);


  const [quizScore, setQuizScore] =
    useState(0);


  const [
    quizFinished,
    setQuizFinished,
  ] = useState(false);


  // ===================================================
  // REFS
  // ===================================================

  const chatEndRef =
    useRef(null);

  const abortControllerRef =
    useRef(null);

  const quizAbortControllerRef =
    useRef(null);


  // ===================================================
  // SAVE CHAT
  // ===================================================

  useEffect(() => {

    try {

      localStorage.setItem(
        chatStorageKey,
        JSON.stringify(messages)
      );

    } catch (error) {

      console.error(
        "Unable to save Learnova chat:",
        error
      );
    }

  }, [
    messages,
    chatStorageKey,
  ]);


  // ===================================================
  // AUTO SCROLL
  // ===================================================

  useEffect(() => {

    chatEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });

  }, [
    messages,
    isTyping,
  ]);


  // ===================================================
  // FETCH STUDENT CONTEXT
  // ===================================================

  const fetchStudentContext =
    async () => {

      const token =
        getAuthToken();

      if (!token) {

        return {
          tasks: safeTasks,
          quizResults: [],
        };
      }


      try {

        setStudentDataLoading(
          true
        );


        const headers = {
          "Content-Type":
            "application/json",

          Authorization:
            `Bearer ${token}`,
        };


        const [
          tasksResponse,
          quizResponse,
        ] = await Promise.all([

          fetch(
            TASKS_API_URL,
            {
              method: "GET",
              headers,
            }
          ),

          fetch(
            QUIZ_RESULTS_API_URL,
            {
              method: "GET",
              headers,
            }
          ),

        ]);


        let tasksData = {};

        let quizData = {};


        try {

          tasksData =
            await tasksResponse.json();

        } catch {

          tasksData = {};

        }


        try {

          quizData =
            await quizResponse.json();

        } catch {

          quizData = {};

        }


        const latestTasks =
          Array.isArray(
            tasksData.tasks
          )
            ? tasksData.tasks
            : safeTasks;


        const latestQuizResults =
          Array.isArray(
            quizData.results
          )
            ? quizData.results
            : [];


        const normalizedResults =
          normalizeQuizResults(
            latestQuizResults
          );


        setQuizResults(
          normalizedResults
        );


        return {

          tasks:
            normalizeTasks(
              latestTasks
            ),

          quizResults:
            normalizedResults,

        };

      } catch (error) {

        console.error(
          "Student context error:",
          error
        );


        return {

          tasks:
            safeTasks,

          quizResults:
            quizResults,

        };

      } finally {

        setStudentDataLoading(
          false
        );
      }
    };


  // ===================================================
  // INITIAL STUDENT DATA LOAD
  // ===================================================

  

  // ===================================================
  // STUDY PLAN RESPONSE
  // ===================================================
  const getStudyPlanResponse = () => {

    if (
      safeTasks.length === 0
    ) {

      return (
        "## 📚 Today's Study Plan\n\n" +
        "Your study plan is currently empty.\n\n" +
        "Create a study task to get started."
      );
    }


    const total =
      safeTasks.length;


    const completed =
      safeTasks.filter(
        (task) =>
          task.completed
      ).length;


    const progress =
      Math.round(
        (completed / total) *
          100
      );


    const pending =
      safeTasks.filter(
        (task) =>
          !task.completed
      );


    const taskList =
      pending.length > 0
        ? pending
            .map(
              (task, index) =>
                `${index + 1}. **${task.title}** — ${task.time} — *${task.subject}*`
            )
            .join("\n")
        : "🎉 All study tasks are completed!";


    return (
      `## 📚 Today's Study Plan\n\n` +
      `**Total Tasks:** ${total}\n\n` +
      `**Completed:** ${completed}\n\n` +
      `**Progress:** ${progress}%\n\n` +
      `### Pending Tasks\n\n${taskList}`
    );
  };


  // ===================================================
  // TASK RESPONSE
  // ===================================================

  const getTasksResponse = () => {

    if (
      safeTasks.length === 0
    ) {

      return (
        "## 📋 Study Tasks\n\n" +
        "You don't have any study tasks yet."
      );
    }


    const pending =
      safeTasks.filter(
        (task) =>
          !task.completed
      );


    if (
      pending.length === 0
    ) {

      return (
        `## 🎉 All Tasks Completed!\n\n` +
        `You completed all **${safeTasks.length}** study tasks.`
      );
    }


    const taskList =
      pending
        .map(
          (task, index) =>
            `${index + 1}. **${task.title}** — ${task.subject} — ${task.time}`
        )
        .join("\n");


    return (
      `## 📋 Pending Tasks\n\n` +
      `You have **${pending.length} pending task${
        pending.length > 1
          ? "s"
          : ""
      }**.\n\n${taskList}`
    );
  };


  // ===================================================
  // PROGRESS RESPONSE
  // ===================================================

  const getProgressResponse = () => {

    const total =
      safeTasks.length;


    if (
      total === 0
    ) {

      return (
        "## 📊 Your Progress\n\n" +
        "You currently have no study tasks.\n\n" +
        "**Progress: 0%**"
      );
    }


    const completed =
      safeTasks.filter(
        (task) =>
          task.completed
      ).length;


    const pending =
      total -
      completed;


    const progress =
      Math.round(
        (completed / total) *
          100
      );


    const averageQuiz =
      quizResults.length === 0
        ? null
        : Math.round(
            quizResults.reduce(
              (sum, result) =>
                sum +
                Number(
                  result.percentage ||
                    0
                ),
              0
            ) /
              quizResults.length
          );


    return (
      `## 📊 Your Current Progress\n\n` +
      `### ${progress}% Task Completion\n\n` +
      `- ✅ Completed: **${completed}**\n` +
      `- ⏳ Pending: **${pending}**\n` +
      `- 📚 Total Tasks: **${total}**\n\n` +
      `${
        averageQuiz !== null
          ? `🧠 Average Quiz Score: **${averageQuiz}%**`
          : "🧠 Quiz Score: **No quiz data yet**"
      }`
    );
  };


  // ===================================================
  // PERFORMANCE RESPONSE
  // ===================================================

  const getPerformanceResponse = () => {

    if (
      quizResults.length === 0
    ) {

      return (
        "## 📈 Your Performance\n\n" +
        "You don't have enough quiz data yet.\n\n" +
        "Take an AI Quiz to start building your performance analytics."
      );
    }


    const average =
      Math.round(
        quizResults.reduce(
          (sum, result) =>
            sum +
            Number(
              result.percentage ||
                0
            ),
          0
        ) /
          quizResults.length
      );


    const subjectMap = {};


    quizResults.forEach(
      (result) => {

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
            result.percentage ||
              0
          );

        subjectMap[subject].count +=
          1;
      }
    );


    const subjects =
      Object.entries(
        subjectMap
      )
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
      subjects[0];

    const strongest =
      subjects[
        subjects.length - 1
      ];


    return (
      `## 📈 Your Quiz Performance\n\n` +
      `**Average Score:** ${average}%\n\n` +
      `**Total Quizzes:** ${quizResults.length}\n\n` +
      `### 🎯 Needs More Attention\n` +
      `${
        weakest
          ? `${weakest.subject}: **${weakest.average}%**`
          : "Not available"
      }\n\n` +
      `### 🌟 Strongest Subject\n` +
      `${
        strongest
          ? `${strongest.subject}: **${strongest.average}%**`
          : "Not available"
      }`
    );
  };


  // ===================================================
  // LOCAL FALLBACK
  // ===================================================

  const getFallbackResponse =
    (question) => {

      const text =
        question
          .toLowerCase()
          .trim();


      if (
        text.includes(
          "study plan"
        ) ||
        text.includes(
          "today plan"
        ) ||
        text.includes(
          "my plan"
        )
      ) {

        return getStudyPlanResponse();
      }


      if (
        text.includes(
          "my tasks"
        ) ||
        text.includes(
          "pending tasks"
        ) ||
        text === "tasks"
      ) {

        return getTasksResponse();
      }


      if (
        text.includes(
          "progress"
        ) ||
        text.includes(
          "completed"
        )
      ) {

        return getProgressResponse();
      }


      if (
        text.includes(
          "performance"
        ) ||
        text.includes(
          "quiz score"
        ) ||
        text.includes(
          "my score"
        ) ||
        text.includes(
          "weak subject"
        )
      ) {

        return getPerformanceResponse();
      }


      if (
        text.includes(
          "python"
        )
      ) {

        return (
          "## 🐍 Python\n\n" +
          "I can help you with:\n\n" +
          "- Variables\n" +
          "- Operators\n" +
          "- If-Else\n" +
          "- Loops\n" +
          "- Functions\n" +
          "- Lists\n" +
          "- Dictionaries\n" +
          "- OOP\n\n" +
          "Ask me any Python question!"
        );
      }


      if (
        text.includes(
          "what is ai"
        ) ||
        text.includes(
          "artificial intelligence"
        )
      ) {

        return (
          "## 🤖 Artificial Intelligence\n\n" +
          "Artificial Intelligence is a field of computer science that focuses on creating systems capable of performing tasks that normally require human intelligence.\n\n" +
          "Examples include:\n\n" +
          "- Language understanding\n" +
          "- Image recognition\n" +
          "- Prediction\n" +
          "- Problem solving"
        );
      }


      return (
        "⚠️ **Local AI is currently unavailable.**\n\n" +
        "Please make sure:\n\n" +
        "1. Ollama is running.\n" +
        "2. `llama3.2:3b` is installed.\n" +
        "3. Learnova backend is running on port `5000`.\n\n" +
        "Then try again."
      );
    };


  // ===================================================
  // SEND CHAT TO BACKEND
  // ===================================================

  const sendToAI =
    async (
      question,
      context = null
    ) => {

      if (
        abortControllerRef.current
      ) {

        abortControllerRef.current.abort();
      }


      const controller =
        new AbortController();

      abortControllerRef.current =
        controller;


      const timeout =
        setTimeout(
          () => {
            controller.abort();
          },
          REQUEST_TIMEOUT
        );


      try {

        const headers = {
          "Content-Type":
            "application/json",
        };


        const token =
          getAuthToken();


        if (token) {

          headers.Authorization =
            `Bearer ${token}`;
        }


        const currentTasks =
          context?.tasks ||
          safeTasks;


        const currentQuizResults =
          context?.quizResults ||
          quizResults;


        const studentContext =
          buildPersonalizedContext(
            currentTasks,
            currentQuizResults
          );


        const personalizedQuestion =
          `${studentContext}

=====================================================
CURRENT STUDENT QUESTION
=====================================================

${question}

=====================================================
ANSWER INSTRUCTIONS
=====================================================

Answer the student's question naturally.

Use the student context when it is relevant.

If the student asks for a study plan:
- Prioritize pending tasks.
- Consider weak subjects.
- Consider recent quiz performance.

If the student asks about performance:
- Use actual quiz data.

If the student asks what to study:
- Recommend the most important pending topic.
- Prefer weak subjects when appropriate.

If there is not enough student data:
- Say that clearly.
- Do not invent information.

Do not mention the internal student context,
API, prompt, or these instructions.
`;


        const response =
          await fetch(
            AI_API_URL,
            {
              method: "POST",

              headers,

              signal:
                controller.signal,

              body:
                JSON.stringify({

                  message:
                    personalizedQuestion,

                  studyTasks:
                    currentTasks,

                  conversation:
                    messages
                      .slice(-10)
                      .map(
                        (message) => ({
                          sender:
                            message.sender,

                          text:
                            message.text,
                        })
                      ),

                }),
            }
          );


        let data = {};


        try {

          data =
            await response.json();

        } catch {

          data = {};
        }


        if (!response.ok) {

          throw new Error(
            data.message ||
            `AI server error: ${response.status}`
          );
        }


        const reply =
          data.reply ||
          data.message;


        if (
          !reply ||
          typeof reply !==
            "string"
        ) {

          throw new Error(
            "AI returned an empty response."
          );
        }


        return reply.trim();

      } finally {

        clearTimeout(
          timeout
        );
      }
    };


  // ===================================================
  // SAVE QUIZ RESULT
  // ===================================================

  const saveQuizResult =
    async (
      finalScore = quizScore
    ) => {

      if (!quiz) {
        return;
      }


      try {

        const token =
          getAuthToken();


        if (!token) {

          console.warn(
            "No auth token found. Quiz result not saved."
          );

          return;
        }


        const totalQuestions =
          quiz.questions.length;


        const percentage =
          totalQuestions === 0
            ? 0
            : Math.round(
                (finalScore /
                  totalQuestions) *
                  100
              );


        const response =
          await fetch(
            QUIZ_RESULT_API_URL,
            {
              method: "POST",

              headers: {

                "Content-Type":
                  "application/json",

                Authorization:
                  `Bearer ${token}`,
              },

              body:
                JSON.stringify({

                  subject:
                    quiz.subject,

                  topic:
                    quiz.topic,

                  difficulty:
                    quiz.difficulty,

                  score:
                    finalScore,

                  totalQuestions,

                  percentage,
                }),
            }
          );


        let data = {};


        try {

          data =
            await response.json();

        } catch {

          data = {};
        }


        if (!response.ok) {

          throw new Error(
            data.message ||
            "Unable to save quiz result."
          );
        }


        console.log(
          "✅ Quiz result saved:",
          data.result
        );


        // Refresh analytics data
        const latestContext =
          await fetchStudentContext();


        if (
          latestContext?.quizResults
        ) {

          setQuizResults(
            latestContext.quizResults
          );
        }

      } catch (error) {

        console.error(
          "❌ Save quiz result error:",
          error
        );
      }
    };


  // ===================================================
  // GENERATE AI QUIZ
  // ===================================================

  const generateQuiz =
    async () => {

      if (quizLoading) {
        return;
      }


      setQuizLoading(true);

      setQuizError("");

      setQuiz(null);

      setCurrentQuestion(0);

      setSelectedAnswer(null);

      setQuizScore(0);

      setQuizFinished(false);


      if (
        quizAbortControllerRef.current
      ) {

        quizAbortControllerRef.current.abort();
      }


      const controller =
        new AbortController();

      quizAbortControllerRef.current =
        controller;


      const timeout =
        setTimeout(
          () => {
            controller.abort();
          },
          REQUEST_TIMEOUT
        );


      try {

        // ---------------------------------------------
        // GET LATEST STUDENT DATA
        // ---------------------------------------------

        const context =
          await fetchStudentContext();


        const currentTasks =
          context?.tasks ||
          safeTasks;


        const currentResults =
          context?.quizResults ||
          quizResults;


        // ---------------------------------------------
        // FIND WEAK SUBJECT
        // ---------------------------------------------

        const subjectMap = {};


        currentResults.forEach(
          (result) => {

            const subject =
              result.subject ||
              "General";


            if (
              !subjectMap[subject]
            ) {

              subjectMap[subject] = {
                total: 0,
                count: 0,
              };
            }


            subjectMap[subject]
              .total +=
              Number(
                result.percentage ||
                  0
              );


            subjectMap[subject]
              .count +=
              1;
          }
        );


        const subjectPerformance =
          Object.entries(
            subjectMap
          )
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


        const weakestSubject =
          subjectPerformance[0]
            ?.subject;


        // ---------------------------------------------
        // FIND PENDING TASK
        // ---------------------------------------------

        const pendingTask =
          currentTasks.find(
            (task) =>
              !task.completed
          );


        const subject =
          weakestSubject ||
          pendingTask?.subject ||
          currentTasks[0]
            ?.subject ||
          "Python";


        const topic =
          pendingTask?.title ||
          "Programming Basics";


        // ---------------------------------------------
        // QUIZ DIFFICULTY
        // ---------------------------------------------

        const averageScore =
          currentResults.length ===
          0
            ? 0
            : Math.round(
                currentResults.reduce(
                  (sum, result) =>
                    sum +
                    Number(
                      result.percentage ||
                        0
                    ),
                  0
                ) /
                  currentResults.length
              );


        let difficulty =
          "easy";


        if (
          averageScore >= 80
        ) {

          difficulty =
            "medium";

        } else if (
          averageScore >= 60
        ) {

          difficulty =
            "easy";

        } else {

          difficulty =
            "easy";
        }


        // ---------------------------------------------
        // REQUEST
        // ---------------------------------------------

        const response =
          await fetch(
            QUIZ_API_URL,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              signal:
                controller.signal,

              body:
                JSON.stringify({

                  subject,

                  topic,

                  difficulty,

                  numberOfQuestions:
                    5,

                }),
            }
          );


        let data = {};


        try {

          data =
            await response.json();

        } catch {

          data = {};
        }


        if (!response.ok) {

          throw new Error(
            data.message ||
            `Quiz server error: ${response.status}`
          );
        }


        if (
          !data.success ||
          !data.quiz ||
          !Array.isArray(
            data.quiz.questions
          )
        ) {

          throw new Error(
            "Invalid quiz response from server."
          );
        }


        if (
          data.quiz.questions
            .length === 0
        ) {

          throw new Error(
            "AI generated no questions."
          );
        }


        setQuiz(
          data.quiz
        );

        setCurrentQuestion(0);

        setSelectedAnswer(null);

        setQuizScore(0);

        setQuizFinished(false);

      } catch (error) {

        console.error(
          "Quiz generation error:",
          error
        );


        if (
          error?.name ===
          "AbortError"
        ) {

          setQuizError(
            "Quiz request timed out. Make sure Ollama is running."
          );

        } else {

          setQuizError(
            error?.message ||
            "Unable to generate quiz."
          );
        }

      } finally {

        clearTimeout(
          timeout
        );

        setQuizLoading(false);
      }
    };


  // ===================================================
  // HANDLE QUIZ ANSWER
  // ===================================================

  const handleQuizAnswer =
    (answerIndex) => {

      if (
        !quiz ||
        quizFinished ||
        selectedAnswer !== null
      ) {

        return;
      }


      const question =
        quiz.questions[
          currentQuestion
        ];


      if (!question) {
        return;
      }


      setSelectedAnswer(
        answerIndex
      );


      if (
        Number(answerIndex) ===
        Number(question.answer)
      ) {

        setQuizScore(
          (previous) =>
            previous + 1
        );
      }
    };


  // ===================================================
  // NEXT QUIZ QUESTION
  // ===================================================

  const nextQuizQuestion =
    async () => {

      if (!quiz) {
        return;
      }


      const lastQuestion =
        currentQuestion >=
        quiz.questions.length - 1;


      if (lastQuestion) {

        // ---------------------------------------------
        // FIX LAST ANSWER SCORE
        // ---------------------------------------------

        const activeQuestion =
          quiz.questions[
            currentQuestion
          ];


        const lastAnswerCorrect =
          selectedAnswer !== null &&
          Number(
            selectedAnswer
          ) ===
            Number(
              activeQuestion?.answer
            );


        const finalScore =
          lastAnswerCorrect
            ? quizScore + 1
            : quizScore;


        await saveQuizResult(
          finalScore
        );


        setQuizScore(
          finalScore
        );


        setQuizFinished(true);

        return;
      }


      setCurrentQuestion(
        (previous) =>
          previous + 1
      );


      setSelectedAnswer(
        null
      );
    };


  // ===================================================
  // CLOSE QUIZ
  // ===================================================

  const closeQuiz =
    () => {

      setQuiz(null);

      setQuizError("");

      setCurrentQuestion(0);

      setSelectedAnswer(null);

      setQuizScore(0);

      setQuizFinished(false);
    };


  // ===================================================
  // SEND MESSAGE
  // ===================================================

  const sendMessage =
    async (
      customMessage = null
    ) => {

      const message =
        (
          customMessage ??
          input
        ).trim();


      if (!message) {
        return;
      }


      if (isTyping) {
        return;
      }


      setError("");


      const userMessage = {

        id:
          `user-${Date.now()}`,

        sender:
          "user",

        text:
          message,
      };


      setMessages(
        (previous) => [
          ...previous,
          userMessage,
        ]
      );


      setInput("");

      setIsTyping(true);


      try {

        // ---------------------------------------------
        // GET FRESH DATA BEFORE EVERY AI REQUEST
        // ---------------------------------------------

        const context =
          await fetchStudentContext();


        const reply =
          await sendToAI(
            message,
            context
          );


        const aiMessage = {

          id:
            `ai-${Date.now()}`,

          sender:
            "ai",

          text:
            reply,
        };


        setMessages(
          (previous) => [
            ...previous,
            aiMessage,
          ]
        );

      } catch (error) {

        console.error(
          "Learnova AI error:",
          error
        );


        const fallback =
          getFallbackResponse(
            message
          );


        setMessages(
          (previous) => [
            ...previous,

            {
              id:
                `fallback-${Date.now()}`,

              sender:
                "ai",

              text:
                fallback,
            },
          ]
        );


        if (
          error?.name ===
          "AbortError"
        ) {

          setError(
            "AI request timed out. Make sure Ollama is running."
          );

        } else {

          setError(
            "Local AI server unavailable. Showing fallback response."
          );
        }

      } finally {

        setIsTyping(false);
      }
    };


  // ===================================================
  // ENTER KEY
  // ===================================================

  const handleKeyDown =
    (event) => {

      if (
        event.key === "Enter" &&
        !event.shiftKey
      ) {

        event.preventDefault();

        sendMessage();
      }
    };


  // ===================================================
  // QUICK ACTION
  // ===================================================

  const handleQuickAction =
    (message) => {

      if (isTyping) {
        return;
      }

      setInput(message);
    };


  // ===================================================
  // CLEAR CHAT
  // ===================================================

  const clearChat =
    () => {

      const confirmed =
        window.confirm(
          "Are you sure you want to clear your Learnova AI chat?"
        );


      if (!confirmed) {
        return;
      }


      setMessages([
        createDefaultMessage(currentUser),
      ]);


      setInput("");

      setError("");


      localStorage.removeItem(
        chatStorageKey
      );
    };


  // ===================================================
  // CURRENT QUESTION
  // ===================================================

  const activeQuestion =
    quiz?.questions?.[
      currentQuestion
    ];


  // ===================================================
  // RENDER
  // ===================================================

  return (

    <section className="ai-assistant">

      {/* =============================================
          HEADER
          ============================================= */}

      <div className="ai-header">

        <div>

          <h2>
            🤖 Learnova AI
          </h2>

          <p>
            {studentDataLoading
              ? "Analyzing your study data..."
              : "Your personalized AI study assistant"}
          </p>

        </div>


        <button
          className="clear-chat-btn"
          type="button"
          onClick={clearChat}
          title="Clear chat"
          aria-label="Clear chat"
          disabled={
            isTyping ||
            quizLoading
          }
        >
          🗑️
        </button>

      </div>


      {/* =============================================
          ERROR
          ============================================= */}

      {error && (

        <div className="ai-error">

          ⚠️ {error}

        </div>
      )}


      {/* =============================================
          QUIZ ERROR
          ============================================= */}

      {quizError && (

        <div className="ai-error">

          ❌ {quizError}

          <button
            type="button"
            onClick={
              generateQuiz
            }
            style={{
              marginLeft:
                "10px",
              cursor:
                "pointer",
            }}
          >
            Try Again
          </button>

        </div>
      )}


      {/* =============================================
          AI QUIZ
          ============================================= */}

      {quiz && (

        <div
          className="learnova-quiz"
          style={{
            background:
              "#ffffff",

            color:
              "#17213a",

            borderRadius:
              "18px",

            padding:
              "22px",

            marginBottom:
              "12px",

            maxHeight:
              "430px",

            overflowY:
              "auto",

            boxShadow:
              "0 10px 30px rgba(0,0,0,0.12)",
          }}
        >

          {!quizFinished ? (

            <>

              {/* QUIZ HEADER */}

              <div
                style={{
                  display:
                    "flex",

                  justifyContent:
                    "space-between",

                  alignItems:
                    "center",

                  gap:
                    "12px",

                  marginBottom:
                    "18px",
                }}
              >

                <div>

                  <div
                    style={{
                      fontSize:
                        "12px",

                      fontWeight:
                        "700",

                      color:
                        "#6557f5",

                      textTransform:
                        "uppercase",
                    }}
                  >
                    🤖 Learnova AI Quiz
                  </div>

                  <h3
                    style={{
                      margin:
                        "5px 0 0",

                      fontSize:
                        "24px",
                    }}
                  >
                    {quiz.subject}
                  </h3>

                </div>


                <button
                  type="button"
                  onClick={
                    closeQuiz
                  }
                  style={{
                    border:
                      "none",

                    background:
                      "#f0efff",

                    color:
                      "#5b4df5",

                    borderRadius:
                      "10px",

                    padding:
                      "8px 12px",

                    cursor:
                      "pointer",

                    fontWeight:
                      "600",
                  }}
                >
                  ✕
                </button>

              </div>


              {/* QUIZ PROGRESS */}

              <div
                style={{
                  display:
                    "flex",

                  justifyContent:
                    "space-between",

                  fontSize:
                    "14px",

                  color:
                    "#68738a",

                  marginBottom:
                    "10px",
                }}
              >

                <span>
                  Question{" "}
                  {currentQuestion + 1}
                  {" "}
                  of{" "}
                  {quiz.questions.length}
                </span>

                <span>
                  Score:{" "}
                  {quizScore}
                </span>

              </div>


              {/* PROGRESS BAR */}

              <div
                style={{
                  height:
                    "7px",

                  background:
                    "#ecebf5",

                  borderRadius:
                    "10px",

                  overflow:
                    "hidden",

                  marginBottom:
                    "22px",
                }}
              >

                <div
                  style={{
                    width:
                      `${
                        ((currentQuestion + 1) /
                          quiz.questions.length) *
                        100
                      }%`,

                    height:
                      "100%",

                    background:
                      "#6557f5",

                    borderRadius:
                      "10px",

                    transition:
                      "width 0.3s ease",
                  }}
                />

              </div>


              {/* QUESTION */}

              {activeQuestion && (

                <>

                  <h3
                    style={{
                      fontSize:
                        "20px",

                      lineHeight:
                        "1.5",

                      marginBottom:
                        "18px",
                    }}
                  >
                    {activeQuestion.question}
                  </h3>


                  {/* OPTIONS */}

                  <div
                    style={{
                      display:
                        "flex",

                      flexDirection:
                        "column",

                      gap:
                        "10px",
                    }}
                  >

                    {activeQuestion.options.map(
                      (
                        option,
                        index
                      ) => {

                        const isSelected =
                          selectedAnswer ===
                          index;


                        const isCorrect =
                          index ===
                          Number(
                            activeQuestion.answer
                          );


                        let background =
                          "#f7f7fb";


                        let border =
                          "1px solid #e4e3ef";


                        let color =
                          "#17213a";


                        if (
                          selectedAnswer !==
                          null
                        ) {

                          if (
                            isCorrect
                          ) {

                            background =
                              "#dcfce7";

                            border =
                              "1px solid #22c55e";

                            color =
                              "#166534";

                          } else if (
                            isSelected
                          ) {

                            background =
                              "#fee2e2";

                            border =
                              "1px solid #ef4444";

                            color =
                              "#991b1b";
                          }
                        }


                        return (

                          <button
                            key={index}
                            type="button"
                            onClick={() =>
                              handleQuizAnswer(
                                index
                              )
                            }
                            disabled={
                              selectedAnswer !==
                              null
                            }
                            style={{
                              width:
                                "100%",

                              textAlign:
                                "left",

                              padding:
                                "13px 15px",

                              border,

                              borderRadius:
                                "12px",

                              background,

                              color,

                              cursor:
                                selectedAnswer ===
                                null
                                  ? "pointer"
                                  : "default",

                              fontSize:
                                "15px",

                              fontWeight:
                                "500",

                              transition:
                                "0.2s",
                            }}
                          >

                            <strong>
                              {String.fromCharCode(
                                65 +
                                  index
                              )}
                              .
                            </strong>{" "}

                            {option}


                            {selectedAnswer !==
                              null &&
                              isCorrect && (

                                <span
                                  style={{
                                    float:
                                      "right",
                                  }}
                                >
                                  ✅
                                </span>

                              )}


                            {selectedAnswer !==
                              null &&
                              isSelected &&
                              !isCorrect && (

                                <span
                                  style={{
                                    float:
                                      "right",
                                  }}
                                >
                                  ❌
                                </span>

                              )}

                          </button>

                        );
                      }
                    )}

                  </div>


                  {/* NEXT */}

                  {selectedAnswer !==
                    null && (

                    <button
                      type="button"
                      onClick={
                        nextQuizQuestion
                      }
                      style={{
                        width:
                          "100%",

                        marginTop:
                          "18px",

                        padding:
                          "13px",

                        border:
                          "none",

                        borderRadius:
                          "12px",

                        background:
                          "#6557f5",

                        color:
                          "#ffffff",

                        cursor:
                          "pointer",

                        fontWeight:
                          "700",

                        fontSize:
                          "15px",
                      }}
                    >
                      {currentQuestion >=
                      quiz.questions.length -
                        1
                        ? "🏆 View Result"
                        : "Next Question →"}
                    </button>
                  )}

                </>
              )}

            </>

          ) : (

            /* =======================================
               RESULT
               ======================================= */

            <div
              style={{
                textAlign:
                  "center",

                padding:
                  "25px 10px",
              }}
            >

              <div
                style={{
                  fontSize:
                    "55px",

                  marginBottom:
                    "10px",
                }}
              >
                🏆
              </div>


              <h2
                style={{
                  margin:
                    "0 0 8px",

                  fontSize:
                    "28px",
                }}
              >
                Quiz Completed!
              </h2>


              <p
                style={{
                  color:
                    "#68738a",

                  marginBottom:
                    "20px",
                }}
              >
                {quiz.subject} •{" "}
                {quiz.topic}
              </p>


              <div
                style={{
                  fontSize:
                    "42px",

                  fontWeight:
                    "800",

                  color:
                    "#6557f5",

                  marginBottom:
                    "5px",
                }}
              >
                {quizScore}
                {" / "}
                {quiz.questions.length}
              </div>


              <p
                style={{
                  fontSize:
                    "16px",

                  color:
                    "#68738a",
                }}
              >
                {quiz.questions.length ===
                0
                  ? 0
                  : Math.round(
                      (quizScore /
                        quiz.questions
                          .length) *
                        100
                    )}
                % Score
              </p>


              <div
                style={{
                  display:
                    "flex",

                  gap:
                    "10px",

                  justifyContent:
                    "center",

                  marginTop:
                    "25px",

                  flexWrap:
                    "wrap",
                }}
              >

                <button
                  type="button"
                  onClick={
                    generateQuiz
                  }
                  style={{
                    border:
                      "none",

                    borderRadius:
                      "12px",

                    padding:
                      "12px 20px",

                    background:
                      "#6557f5",

                    color:
                      "#ffffff",

                    cursor:
                      "pointer",

                    fontWeight:
                      "700",
                  }}
                >
                  🔄 New Quiz
                </button>


                <button
                  type="button"
                  onClick={
                    closeQuiz
                  }
                  style={{
                    border:
                      "1px solid #d9d7ea",

                    borderRadius:
                      "12px",

                    padding:
                      "12px 20px",

                    background:
                      "#ffffff",

                    color:
                      "#17213a",

                    cursor:
                      "pointer",

                    fontWeight:
                      "700",
                  }}
                >
                  💬 Back to AI
                </button>

              </div>

            </div>
          )}

        </div>
      )}


      {/* =============================================
          CHAT
          ============================================= */}

      {!quiz && (

        <div className="ai-chat">

          {messages.map(
            (message) => (

              <div
                key={message.id}
                className={
                  `ai-chat-message ${
                    message.sender ===
                    "user"
                      ? "user-message"
                      : "ai-message"
                  }`
                }
              >

                {message.sender ===
                  "ai" && (

                  <span className="ai-avatar">
                    🤖
                  </span>
                )}


                <div className="ai-message-content">

                  {message.sender ===
                  "ai" ? (

                    <ReactMarkdown>
                      {message.text}
                    </ReactMarkdown>

                  ) : (

                    <p>
                      {message.text}
                    </p>
                  )}

                </div>

              </div>
            )
          )}


          {/* TYPING */}

          {isTyping && (

            <div className="ai-chat-message ai-message">

              <span className="ai-avatar">
                🤖
              </span>

              <div className="typing-indicator">

                <span></span>
                <span></span>
                <span></span>

              </div>

            </div>
          )}


          <div
            ref={chatEndRef}
          />

        </div>
      )}


      {/* =============================================
          QUICK ACTIONS
          ============================================= */}

      <div className="ai-actions">

        <button
          type="button"
          disabled={
            isTyping ||
            quizLoading
          }
          onClick={() =>
            handleQuickAction(
              "What is my study plan today? Use my pending tasks and quiz performance to suggest the best order."
            )
          }
        >
          📅 Study Plan
        </button>


        <button
          type="button"
          disabled={
            isTyping ||
            quizLoading
          }
          onClick={
            generateQuiz
          }
        >
          {quizLoading
            ? "🤖 Generating..."
            : "🧠 Quiz Me"}
        </button>


        <button
          type="button"
          disabled={
            isTyping ||
            quizLoading
          }
          onClick={() =>
            handleQuickAction(
              "Analyze my current progress using my tasks and quiz results. Tell me what I should improve."
            )
          }
        >
          📊 Progress
        </button>


        <button
          type="button"
          disabled={
            isTyping ||
            quizLoading
          }
          onClick={() => {

            const pendingTask =
              safeTasks.find(
                (task) =>
                  !task.completed
              );


            const topic =
              pendingTask?.title ||
              "Artificial Intelligence";


            handleQuickAction(
              `Explain ${topic} in simple language.

Please include:
1. Simple definition
2. How it works
3. Real-life examples
4. Important points
5. One short practice question

Also consider my current learning performance when explaining the topic.`
            );
          }}
        >
          💡 Explain Topic
        </button>

      </div>


      {/* =============================================
          INPUT
          ============================================= */}

      <div className="ai-input-area">

        <input
          type="text"
          value={input}
          placeholder={
            isTyping
              ? "Learnova AI is thinking..."
              : quizLoading
                ? "Generating your AI quiz..."
                : "Ask Learnova AI anything..."
          }
          onChange={(event) =>
            setInput(
              event.target.value
            )
          }
          onKeyDown={
            handleKeyDown
          }
          disabled={
            isTyping ||
            quizLoading
          }
          autoComplete="off"
        />


        <button
          className="send-btn"
          type="button"
          onClick={() =>
            sendMessage()
          }
          disabled={
            isTyping ||
            quizLoading ||
            !input.trim()
          }
          aria-label="Send message"
        >
          ➤
        </button>

      </div>

    </section>
  );
}


// =====================================================
// EXPORT
// =====================================================

export default AIAssistant;