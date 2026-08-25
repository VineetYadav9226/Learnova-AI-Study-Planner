// =====================================================
// LEARNOVA AI
// QUIZZES PAGE
// =====================================================
//
// This page handles:
// 1. User subjects from localStorage
// 2. Quiz creation
// 3. Quiz questions
// 4. Quiz scoring
// 5. Quiz result saving
// 6. Recent quiz results
//
// IMPORTANT:
// Subjects are NOT loaded from backend.
// They are loaded from:
// user-specific localStorage -> "learnova_subjects_<USER_ID>"
//
// =====================================================
import "./Quizzes.css";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";



// =====================================================
// CURRENT USER STORAGE HELPERS
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

      if (parsed && typeof parsed === "object") {
        return parsed;
      }
    } catch {
      // Ignore invalid JSON.
    }
  }

  return null;
};

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

  return identifier ? String(identifier) : null;
};

const getUserStorageKey = (baseKey) => {
  const userId = getUserIdentifier();

  if (!userId) {
    return null;
  }

  return `${baseKey}_${userId}`;
};

// =====================================================
// STORAGE KEYS
// =====================================================

const SUBJECTS_STORAGE_BASE_KEY = "learnova_subjects";
const QUIZ_RESULTS_BASE_KEY = "learnova_quiz_results";
const QUIZ_QUESTION_HISTORY_BASE_KEY = "learnova_quiz_question_history";

// Backend quiz-result API.
// Analytics reads quiz results from this endpoint.
const QUIZ_RESULTS_API_URL =
  "http://localhost:5000/api/quiz-results";

const getAuthToken = () => {
  return (
    localStorage.getItem("learnova_token") ||
    localStorage.getItem("token")
  );
};


// =====================================================
// DEFAULT TOPIC
// =====================================================

const DEFAULT_TOPIC = "Programming Basics";


// =====================================================
// HELPER
// =====================================================

function normalizeSubjectName(value) {

  if (!value) {
    return "";
  }

  return String(value).trim();
}


// =====================================================
// GET SUBJECT NAME FROM DIFFERENT OBJECT FORMATS
// =====================================================

function getSubjectName(item) {

  if (typeof item === "string") {
    return normalizeSubjectName(item);
  }

  if (!item || typeof item !== "object") {
    return "";
  }

  return normalizeSubjectName(
    item.name ||
    item.subjectName ||
    item.title ||
    item.subject ||
    ""
  );
}


// =====================================================
// QUIZ QUESTION HISTORY
// =====================================================

const normalizeQuestionText = (value) => {
  return String(value || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^a-z0-9 ]/gi, "")
    .trim();
};

const getPreviousQuizQuestions = () => {
  try {
    const storageKey = getUserStorageKey(
      QUIZ_QUESTION_HISTORY_BASE_KEY
    );

    if (!storageKey) {
      return [];
    }

    const saved = localStorage.getItem(storageKey);
    const parsed = saved ? JSON.parse(saved) : [];

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter(
        (question) =>
          typeof question === "string" &&
          question.trim()
      )
      .slice(-30);
  } catch {
    return [];
  }
};

const saveQuizQuestionHistory = (questions) => {
  try {
    const storageKey = getUserStorageKey(
      QUIZ_QUESTION_HISTORY_BASE_KEY
    );

    if (!storageKey || !Array.isArray(questions)) {
      return;
    }

    const oldQuestions = getPreviousQuizQuestions();
    const combined = [...oldQuestions, ...questions];
    const seen = new Set();
    const unique = [];

    for (const question of combined) {
      const text = String(question || "").trim();
      const normalized = normalizeQuestionText(text);

      if (!normalized || seen.has(normalized)) {
        continue;
      }

      seen.add(normalized);
      unique.push(text);
    }

    // Keep a useful history without making localStorage enormous.
    localStorage.setItem(
      storageKey,
      JSON.stringify(unique.slice(-200))
    );
  } catch (error) {
    console.warn(
      "Quiz question history save failed:",
      error
    );
  }
};


// =====================================================
// MAIN COMPONENT
// =====================================================

function Quizzes() {

  const navigate = useNavigate();


  // ===================================================
  // SUBJECT STATE
  // ===================================================

  const [subjects, setSubjects] = useState([]);

  const [subjectsLoading, setSubjectsLoading] =
    useState(true);


  // ===================================================
  // FORM STATE
  // ===================================================

  const [subject, setSubject] = useState("");

  const [topic, setTopic] =
    useState(DEFAULT_TOPIC);

  const [difficulty, setDifficulty] =
    useState("Easy");


  // ===================================================
  // QUIZ STATE
  // ===================================================

  const [quizQuestions, setQuizQuestions] =
    useState([]);

  const [currentQuestion, setCurrentQuestion] =
    useState(0);

  const [selectedAnswer, setSelectedAnswer] =
    useState(null);

  const [score, setScore] =
    useState(0);

  const [quizStarted, setQuizStarted] =
    useState(false);

  const [quizCompleted, setQuizCompleted] =
    useState(false);

  const [quizGenerating, setQuizGenerating] =
    useState(false);


  // ===================================================
  // RESULTS STATE
  // ===================================================

  const [results, setResults] =
    useState([]);


  // ===================================================
  // ERROR STATE
  // ===================================================

  const [error, setError] =
    useState("");


  // ===================================================
  // LOAD SUBJECTS
  // ===================================================
  //
  // IMPORTANT:
  // No setState is called directly inside useEffect.
  //
  // ===================================================

  const loadSubjects = useCallback(() => {

    try {

      const storageKey =
        getUserStorageKey(
          SUBJECTS_STORAGE_BASE_KEY
        );

      if (!storageKey) {
        setSubjects([]);
        setSubject("");
        setSubjectsLoading(false);
        return;
      }

      const saved =
        localStorage.getItem(storageKey);


      if (!saved) {

        setSubjects([]);
        setSubjectsLoading(false);

        return;
      }


      const parsed =
        JSON.parse(saved);


      if (!Array.isArray(parsed)) {

        setSubjects([]);
        setSubjectsLoading(false);

        return;
      }


      const subjectNames = parsed
        .map(getSubjectName)
        .filter(Boolean);


      // Remove duplicate subjects
      const uniqueSubjects = [
        ...new Set(subjectNames),
      ];


      setSubjects(uniqueSubjects);


      // Keep currently selected subject
      // if it still exists.
      setSubject((previousSubject) => {

        if (
          previousSubject &&
          uniqueSubjects.includes(
            previousSubject
          )
        ) {
          return previousSubject;
        }

        return uniqueSubjects[0] || "";
      });


      setError("");

    } catch (err) {

      console.error(
        "Subjects loading error:",
        err
      );

      setSubjects([]);
      setSubject("");

      setError(
        "Unable to read your saved subjects."
      );

    } finally {

      setSubjectsLoading(false);

    }

  }, []);


  // =====================================================
  // LOAD QUIZ RESULTS
  // =====================================================

  const loadResults = useCallback(() => {

    try {

      const storageKey =
        getUserStorageKey(
          QUIZ_RESULTS_BASE_KEY
        );

      if (!storageKey) {
        setResults([]);
        return;
      }

      const saved =
        localStorage.getItem(storageKey);


      if (!saved) {

        setResults([]);

        return;
      }


      const parsed =
        JSON.parse(saved);


      if (!Array.isArray(parsed)) {

        setResults([]);

        return;
      }


      
      const validResults =
        parsed.filter((result) => {
          const resultScore = Number(result?.score);
          const resultTotal = Number(
            result?.total ??
            result?.totalQuestions ??
            0
          );

          return (
            Number.isFinite(resultScore) &&
            Number.isFinite(resultTotal) &&
            resultTotal >= 1 &&
            resultScore >= 0 &&
            resultScore <= resultTotal
          );
        });

      // Remove legacy invalid records such as 6/5 and 120%.
      localStorage.setItem(
        storageKey,
        JSON.stringify(validResults)
      );

      setResults(validResults);

    } catch (err) {

      console.error(
        "Quiz results loading error:",
        err
      );

      setResults([]);

    }

  }, []);


  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {

    const timer = setTimeout(() => {

      loadSubjects();
      loadResults();

    }, 0);


    return () => {

      clearTimeout(timer);

    };

  }, [loadSubjects, loadResults]);


  // =====================================================
  // LISTEN FOR SUBJECT CHANGES
  // =====================================================
  //
  // Subjects page dispatches:
  //
  // "learnova:subjects-updated"
  //
  // whenever subjects change.
  //
  // =====================================================

  useEffect(() => {

    const handleSubjectsUpdated = () => {
      loadSubjects();
    };

    const handleAuthChanged = () => {
      loadSubjects();
      loadResults();
    };


    window.addEventListener(
      "learnova:subjects-updated",
      handleSubjectsUpdated
    );

    window.addEventListener(
      "learnova:user-updated",
      handleAuthChanged
    );

    window.addEventListener(
      "learnova:auth-changed",
      handleAuthChanged
    );

    window.addEventListener(
      "focus",
      handleAuthChanged
    );


    return () => {

      window.removeEventListener(
        "learnova:subjects-updated",
        handleSubjectsUpdated
      );

      window.removeEventListener(
        "learnova:user-updated",
        handleAuthChanged
      );

      window.removeEventListener(
        "learnova:auth-changed",
        handleAuthChanged
      );

      window.removeEventListener(
        "focus",
        handleAuthChanged
      );

    };

  }, [loadSubjects, loadResults]);


  // =====================================================
  // GENERATE AI QUIZ
  //
  // Questions are generated by local Ollama through:
  // POST /api/ai/quiz
  //
  // Questions are generated dynamically by Ollama.
  // Previous question history is sent to prevent repeats.
  // =====================================================

  const generateQuiz = async () => {

    setError("");


    if (!subject) {

      setError(
        "Please add a subject from the Subjects page first."
      );

      return;
    }


    const cleanTopic =
      String(topic || "").trim();


    if (!cleanTopic) {

      setError(
        "Please enter a topic for the quiz."
      );

      return;
    }


    setQuizGenerating(true);
    setQuizQuestions([]);
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setScore(0);
    setQuizStarted(false);
    setQuizCompleted(false);


    try {

      console.log("🧠 Generating quiz with Ollama...");
      console.log("Subject:", subject);
      console.log("Topic:", cleanTopic);
      console.log("Difficulty:", difficulty);


      const response =
        await fetch(
          "http://localhost:5000/api/ai/quiz",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              subject,
              topic: cleanTopic,
              difficulty,
              numberOfQuestions: 5,
              previousQuestions:
                getPreviousQuizQuestions(),
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
            `Quiz generation failed (${response.status}).`
        );
      }


      const generatedQuestions =
        data?.quiz?.questions;


      if (
        !Array.isArray(generatedQuestions) ||
        generatedQuestions.length !== 5
      ) {
        throw new Error(
          "Ollama did not return exactly 5 valid questions. Please try again."
        );
      }


      const validQuestions =
        generatedQuestions.filter(
          (question) =>
            question &&
            typeof question.question ===
              "string" &&
            question.question.trim() &&
            Array.isArray(question.options) &&
            question.options.length === 4 &&
            question.options.every(
              (option) =>
                typeof option === "string" &&
                option.trim()
            ) &&
            Number.isInteger(question.answer) &&
            question.answer >= 0 &&
            question.answer <= 3
        );


      if (validQuestions.length !== 5) {
        throw new Error(
          "Ollama returned an invalid question format. Please generate again."
        );
      }


      // Remove duplicate question text inside the same quiz.
      const uniqueQuestions = [];
      const seen = new Set();

      for (const question of validQuestions) {
        const key =
          question.question
            .trim()
            .toLowerCase();

        if (!seen.has(key)) {
          seen.add(key);
          uniqueQuestions.push(question);
        }
      }


      if (uniqueQuestions.length !== 5) {
        throw new Error(
          "Ollama generated duplicate questions. Please generate again."
        );
      }

      saveQuizQuestionHistory(
        uniqueQuestions.map(
          (question) => question.question
        )
      );

      setQuizQuestions(
        uniqueQuestions
      );

      setCurrentQuestion(0);
      setSelectedAnswer(null);
      setScore(0);
      setQuizStarted(true);
      setQuizCompleted(false);

      console.log("✅ Fresh AI quiz generated.");

    } catch (err) {

      console.error("❌ AI quiz generation error:", err);

      setError(
        err?.message ||
          "Unable to generate AI quiz. Make sure Ollama is running."
      );

      setQuizQuestions([]);
      setQuizStarted(false);

    } finally {

      setQuizGenerating(false);
    }

  };

  // =====================================================
  // SELECT ANSWER
  // =====================================================

  const handleAnswer = (index) => {

    if (
      selectedAnswer !== null
    ) {
      return;
    }


    setSelectedAnswer(index);


    const question =
      quizQuestions[currentQuestion];


    if (
      question &&
      index === question.answer
    ) {

      setScore(
        (previousScore) =>
          previousScore + 1
      );

    }

  };


  // =====================================================
  // NEXT QUESTION
  // =====================================================

  const handleNextQuestion = () => {

    if (
      selectedAnswer === null
    ) {

      return;
    }


    if (
      currentQuestion <
      quizQuestions.length - 1
    ) {

      setCurrentQuestion(
        (previous) =>
          previous + 1
      );

      setSelectedAnswer(null);

      return;
    }


    // Quiz finished.
    //
    // IMPORTANT:
    // handleAnswer() already updates the score for the
    // selected answer. Do NOT add the last answer again.
    //
    // This prevents impossible scores such as 6/5.
    // handleAnswer() already counted the selected answer.
    // Do not add the last answer again.
    const finalScore = Math.min(
      Math.max(Number(score) || 0, 0),
      quizQuestions.length
    );

    finishQuiz(finalScore);

  };


  // =====================================================
  // FINISH QUIZ
  // =====================================================

  const finishQuiz = async (finalScore) => {

    const safeTotal =
      Math.max(
        Number(quizQuestions.length) || 0,
        0
      );

    const safeScore = Math.min(
      Math.max(Number(finalScore) || 0, 0),
      safeTotal
    );

    const percentage =
      safeTotal > 0
        ? Math.round(
            (safeScore / safeTotal) * 100
          )
        : 0;


    const newResult = {

      id:
        Date.now(),

      subject,

      topic,

      difficulty,

      score:
        safeScore,

      total:
        safeTotal,

      percentage,

      date:
        new Date().toISOString(),

    };


    try {

      const storageKey =
        getUserStorageKey(
          QUIZ_RESULTS_BASE_KEY
        );

      const saved =
        storageKey
          ? localStorage.getItem(storageKey)
          : null;

      const oldResults =
        saved
          ? JSON.parse(saved)
          : [];

      const validOldResults =
        Array.isArray(oldResults)
          ? oldResults.filter((result) => {
              const oldScore = Number(result?.score);
              const oldTotal = Number(
                result?.total ??
                result?.totalQuestions ??
                0
              );

              return (
                Number.isFinite(oldScore) &&
                Number.isFinite(oldTotal) &&
                oldTotal >= 1 &&
                oldScore >= 0 &&
                oldScore <= oldTotal
              );
            })
          : [];

      const updatedResults = [
        newResult,
        ...validOldResults,
      ].slice(0, 20);

      if (storageKey) {
        localStorage.setItem(
          storageKey,
          JSON.stringify(updatedResults)
        );
      }

      setResults(updatedResults);

    } catch (err) {

      console.error(
        "Saving quiz result failed:",
        err
      );

    }


    // =====================================================
    // SAVE QUIZ RESULT TO MONGODB
    // =====================================================
    //
    // Backend attaches req.user._id from the JWT.
    // This keeps quiz results isolated per user.
    // =====================================================

    try {
      const token = getAuthToken();

      if (!token) {
        throw new Error(
          "Authentication token not found."
        );
      }

      const response = await fetch(
        QUIZ_RESULTS_API_URL,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`,
          },

          body: JSON.stringify({
            subject:
              String(subject || "").trim(),

            topic:
              String(topic || "General").trim() ||
              "General",

            difficulty:
              String(
                difficulty || "easy"
              )
                .trim()
                .toLowerCase(),

            score:
              safeScore,

            totalQuestions:
              safeTotal,
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
            `Unable to save quiz result (${response.status}).`
        );
      }

      console.log(
        "✅ Quiz result saved to MongoDB:",
        data?.result
      );

      // Analytics can refresh immediately.
      window.dispatchEvent(
        new Event(
          "learnova:quiz-results-updated"
        )
      );

    } catch (err) {

      console.error(
        "❌ MongoDB quiz result save failed:",
        err
      );

      setError(
        `Quiz completed, but Analytics sync failed: ${
          err?.message ||
          "Unable to save quiz result."
        }`
      );
    }


    setQuizCompleted(true);

  };


  // =====================================================
  // NEW QUIZ
  // =====================================================

  const handleNewQuiz = () => {

    setQuizQuestions([]);
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setScore(0);

    setQuizStarted(false);
    setQuizCompleted(false);

    setError("");

  };


  // =====================================================
  // EXIT QUIZ
  // =====================================================

  const handleExitQuiz = () => {

    handleNewQuiz();

  };


  // =====================================================
  // CURRENT QUESTION
  // =====================================================

  const currentQuestionData =
    quizQuestions[currentQuestion];


  // =====================================================
  // DISPLAY RESULTS
  // =====================================================

  const displayedResults =
    useMemo(() => {

      return results.slice(0, 10);

    }, [results]);


  // =====================================================
  // QUIZ COMPLETED SCREEN
  // =====================================================

  if (
    quizStarted &&
    quizCompleted
  ) {

    const percentage =
      Math.round(
        (score /
          quizQuestions.length) *
          100
      );


    return (

      <main className="page quizzes-page">

        <section className="quiz-complete-card">

          <div className="quiz-trophy">
            🏆
          </div>


          <h1>
            Quiz Completed!
          </h1>


          <p className="quiz-complete-subtitle">
            {subject} • {topic}
          </p>


          <div className="quiz-final-score">
            {score}/{quizQuestions.length}
          </div>


          <h2>
            {percentage}% Score
          </h2>

          {error && (
            <div className="quiz-error">
              ⚠️ {error}
            </div>
          )}


          <div className="quiz-result-actions">

            <button
              type="button"
              className="secondary-btn"
              onClick={() => {
                handleNewQuiz();
              }}
            >
              Back to Quizzes
            </button>


            <button
              type="button"
              className="primary-btn"
              onClick={generateQuiz}
              disabled={quizGenerating}
            >
              {quizGenerating
                ? "🤖 Generating with Ollama..."
                : "🔄 New Quiz"}
            </button>

          </div>

        </section>

      </main>

    );

  }


  // =====================================================
  // ACTIVE QUIZ SCREEN
  // =====================================================

  if (
    quizStarted &&
    currentQuestionData
  ) {

    const progress =
      Math.round(
        ((currentQuestion + 1) /
          quizQuestions.length) *
          100
      );


    return (

      <main className="page quizzes-page">

        <section className="active-quiz-card">

          {/* ===============================
             QUIZ HEADER
             =============================== */}

          <div className="quiz-header">

            <div>

              <span className="quiz-subject-badge">
                {subject}
              </span>


              <h1>
                {topic}
              </h1>


              <p>
                Question{" "}
                {currentQuestion + 1}
                {" "}of{" "}
                {quizQuestions.length}
                {" "}•{" "}
                {difficulty.toLowerCase()}
              </p>

            </div>


            <div className="quiz-score">

              {score}/{quizQuestions.length}

            </div>

          </div>


          {/* ===============================
             PROGRESS BAR
             =============================== */}

          <div className="quiz-progress">

            <div
              className="quiz-progress-fill"
              style={{
                width: `${progress}%`,
              }}
            />

          </div>


          {/* ===============================
             QUESTION
             =============================== */}

          <h2 className="quiz-question">

            {currentQuestionData.question}

          </h2>


          {/* ===============================
             OPTIONS
             =============================== */}

          <div className="quiz-options">

            {currentQuestionData.options.map(
              (option, index) => {

                const isSelected =
                  selectedAnswer === index;


                const isCorrect =
                  index ===
                  currentQuestionData.answer;


                let optionClass =
                  "quiz-option";


                if (
                  selectedAnswer !== null
                ) {

                  if (isCorrect) {

                    optionClass +=
                      " correct";

                  } else if (
                    isSelected
                  ) {

                    optionClass +=
                      " incorrect";

                  }

                } else if (
                  isSelected
                ) {

                  optionClass +=
                    " selected";

                }


                return (

                  <button
                    key={index}
                    type="button"
                    className={
                      optionClass
                    }
                    onClick={() =>
                      handleAnswer(index)
                    }
                    disabled={
                      selectedAnswer !== null
                    }
                  >

                    <span className="option-letter">

                      {String.fromCharCode(
                        65 + index
                      )}

                    </span>


                    <span>
                      {option}
                    </span>

                  </button>

                );

              }
            )}

          </div>


          {/* ===============================
             QUIZ ACTIONS
             =============================== */}

          <div className="quiz-footer">

            <button
              type="button"
              className="secondary-btn"
              onClick={
                handleExitQuiz
              }
            >
              Exit Quiz
            </button>


            <button
              type="button"
              className="primary-btn"
              onClick={
                handleNextQuestion
              }
              disabled={
                selectedAnswer === null
              }
            >

              {currentQuestion ===
              quizQuestions.length - 1
                ? "Finish Quiz ✓"
                : "Next Question →"}

            </button>

          </div>

        </section>

      </main>

    );

  }


  // =====================================================
  // MAIN QUIZZES PAGE
  // =====================================================

  return (

    <main className="page quizzes-page">

      {/* =================================================
         PAGE HEADER
         ================================================= */}

      <header className="page-header">

        <div>

          <h1>
            🧠 Learnova Quizzes
          </h1>


          <p>
            Generate an AI-powered quiz,
            test yourself and track your
            performance.
          </p>

        </div>

      </header>


      {/* =================================================
         ERROR MESSAGE
         ================================================= */}

      {error && (

        <div className="quiz-error">

          ⚠️ {error}

        </div>

      )}


      {/* =================================================
         CREATE QUIZ CARD
         ================================================= */}

      <section className="quiz-create-card">

        <div className="quiz-card-heading">

          <h2>
            Create Your AI Quiz
          </h2>


          <p>
            Choose your subject, topic
            and difficulty.
          </p>

        </div>


        <div className="quiz-form">

          {/* ===========================
             SUBJECT
             =========================== */}

          <div className="form-group">

            <label htmlFor="quiz-subject">
              Subject
            </label>


            <select
              id="quiz-subject"
              value={subject}
              onChange={(event) =>
                setSubject(
                  event.target.value
                )
              }
              disabled={
                subjectsLoading ||
                subjects.length === 0
              }
            >

              {subjectsLoading ? (

                <option value="">
                  Loading subjects...
                </option>

              ) : subjects.length === 0 ? (

                <option value="">
                  No subjects found
                </option>

              ) : (

                subjects.map(
                  (item) => (

                    <option
                      key={item}
                      value={item}
                    >
                      {item}
                    </option>

                  )
                )

              )}

            </select>


            {subjects.length === 0 &&
              !subjectsLoading && (

                <small className="form-help error-text">

                  Add a subject from
                  Subjects page first.

                </small>

              )}

          </div>


          {/* ===========================
             TOPIC
             =========================== */}

          <div className="form-group">

            <label htmlFor="quiz-topic">
              Topic
            </label>


            <input
              id="quiz-topic"
              type="text"
              value={topic}
              onChange={(event) =>
                setTopic(
                  event.target.value
                )
              }
              placeholder="Enter quiz topic..."
            />

          </div>


          {/* ===========================
             DIFFICULTY
             =========================== */}

          <div className="form-group">

            <label htmlFor="quiz-difficulty">
              Difficulty
            </label>


            <select
              id="quiz-difficulty"
              value={difficulty}
              onChange={(event) =>
                setDifficulty(
                  event.target.value
                )
              }
            >

              <option value="Easy">
                Easy
              </option>

              <option value="Medium">
                Medium
              </option>

              <option value="Hard">
                Hard
              </option>

            </select>

          </div>

        </div>


        {/* =================================================
           GENERATE BUTTON
           ================================================= */}

        <button
          type="button"
          className="primary-btn generate-quiz-btn"
          onClick={generateQuiz}
          disabled={
            subjectsLoading ||
            subjects.length === 0 ||
            !subject ||
            !String(topic || "").trim() ||
            quizGenerating
          }
        >

          {quizGenerating
            ? "🤖 Generating with Ollama..."
            : "✨ Generate 5 Questions"}

        </button>

      </section>


      {/* =================================================
         RECENT RESULTS
         ================================================= */}

      <section className="quiz-results-card">

        <div className="results-header">

          <div>

            <h2>
              Recent Quiz Results
            </h2>


            <p>
              Your latest saved
              performance.
            </p>

          </div>


          <span className="results-count">

            {results.length} saved

          </span>

        </div>


        {displayedResults.length === 0 ? (

          <div className="empty-results">

            <p>
              No quiz results yet.
              Generate your first
              quiz above.
            </p>

          </div>

        ) : (

          <div className="results-list">

            {displayedResults.map(
              (result) => (

                <div
                  className="result-item"
                  key={result.id}
                >

                  <div>

                    <h3>
                      {result.topic ||
                        "Quiz"}
                    </h3>


                    <p>

                      {result.subject}
                      {" • "}
                      {result.score}
                      /
                      {result.total}

                    </p>

                  </div>


                  <strong>

                    {result.percentage}%

                  </strong>

                </div>

              )
            )}

          </div>

        )}

      </section>


      {/* =================================================
         BACK TO SUBJECTS
         ================================================= */}

      <div className="quiz-page-footer">

        <button
          type="button"
          className="secondary-btn"
          onClick={() =>
            navigate("/subjects")
          }
        >

          📚 Manage Subjects

        </button>

      </div>

    </main>

  );

}


// =====================================================
// EXPORT
// =====================================================

export default Quizzes;