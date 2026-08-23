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
// localStorage -> "learnova_subjects"
//
// =====================================================
import "./Quizzes.css";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";


// =====================================================
// STORAGE KEYS
// =====================================================

const SUBJECTS_STORAGE_KEY = "learnova_subjects";
const QUIZ_RESULTS_STORAGE_KEY = "learnova_quiz_results";


// =====================================================
// DEFAULT TOPIC
// =====================================================

const DEFAULT_TOPIC = "Programming Basics";


// =====================================================
// QUESTION BANK
// =====================================================
//
// Questions are organized according to subject name.
//
// More questions can easily be added later.
// =====================================================

const QUESTION_BANK = {

  Python: [
    {
      question:
        "What is the primary purpose of the print() function in Python?",
      options: [
        "To display the output of a program",
        "To store data in a variable",
        "To read input from the user",
        "To exit a program",
      ],
      answer: 0,
    },

    {
      question:
        "Which keyword is used to define a function in Python?",
      options: [
        "function",
        "def",
        "func",
        "define",
      ],
      answer: 1,
    },

    {
      question:
        "Which of the following is a Python list?",
      options: [
        "{1, 2, 3}",
        "(1, 2, 3)",
        "[1, 2, 3]",
        "<1, 2, 3>",
      ],
      answer: 2,
    },

    {
      question:
        "Which function is used to take input from the user?",
      options: [
        "get()",
        "input()",
        "read()",
        "scan()",
      ],
      answer: 1,
    },

    {
      question:
        "Which symbol is used for a single-line comment in Python?",
      options: [
        "//",
        "/*",
        "#",
        "--",
      ],
      answer: 2,
    },
  ],


  AI: [
    {
      question:
        "What does AI stand for?",
      options: [
        "Automated Internet",
        "Artificial Intelligence",
        "Advanced Information",
        "Artificial Internet",
      ],
      answer: 1,
    },

    {
      question:
        "Which of the following is a common AI technique?",
      options: [
        "Machine Learning",
        "Word Processing",
        "File Compression",
        "Screen Recording",
      ],
      answer: 0,
    },

    {
      question:
        "What is Machine Learning mainly concerned with?",
      options: [
        "Making computers learn from data",
        "Designing computer hardware",
        "Creating network cables",
        "Formatting documents",
      ],
      answer: 0,
    },

    {
      question:
        "Which is an example of AI?",
      options: [
        "Calculator",
        "AI chatbot",
        "USB cable",
        "Keyboard",
      ],
      answer: 1,
    },

    {
      question:
        "What is a dataset?",
      options: [
        "A collection of data",
        "A programming language",
        "A computer device",
        "A network protocol",
      ],
      answer: 0,
    },
  ],


  AIML: [
    {
      question:
        "What does ML stand for?",
      options: [
        "Machine Learning",
        "Memory Logic",
        "Machine Language",
        "Model Logic",
      ],
      answer: 0,
    },

    {
      question:
        "Which type of learning uses labelled data?",
      options: [
        "Supervised Learning",
        "Unsupervised Learning",
        "Random Learning",
        "Manual Learning",
      ],
      answer: 0,
    },

    {
      question:
        "Which of these is commonly used for classification?",
      options: [
        "Decision Tree",
        "Text Editor",
        "Compiler",
        "File Manager",
      ],
      answer: 0,
    },

    {
      question:
        "What is training data?",
      options: [
        "Data used to train a model",
        "Data used only for storage",
        "Deleted data",
        "Operating system files",
      ],
      answer: 0,
    },

    {
      question:
        "What does AI primarily attempt to simulate?",
      options: [
        "Human intelligence",
        "Computer hardware",
        "Internet speed",
        "File storage",
      ],
      answer: 0,
    },
  ],


  DBMS: [
    {
      question:
        "What does DBMS stand for?",
      options: [
        "Database Management System",
        "Data Backup Management Software",
        "Database Machine System",
        "Data Management Service",
      ],
      answer: 0,
    },

    {
      question:
        "Which language is commonly used to query relational databases?",
      options: [
        "HTML",
        "SQL",
        "CSS",
        "XML",
      ],
      answer: 1,
    },

    {
      question:
        "What is a primary key?",
      options: [
        "A unique identifier for a record",
        "A password",
        "A database backup",
        "A table name",
      ],
      answer: 0,
    },

    {
      question:
        "Which of these is a relational database?",
      options: [
        "MySQL",
        "Photoshop",
        "Chrome",
        "Windows",
      ],
      answer: 0,
    },

    {
      question:
        "What is a table made up of?",
      options: [
        "Rows and columns",
        "Only images",
        "Only files",
        "Only keys",
      ],
      answer: 0,
    },
  ],


  DSA: [
    {
      question:
        "What does DSA stand for?",
      options: [
        "Data Structure and Algorithms",
        "Data System Application",
        "Digital Software Architecture",
        "Database Structure Application",
      ],
      answer: 0,
    },

    {
      question:
        "Which data structure follows FIFO?",
      options: [
        "Stack",
        "Queue",
        "Tree",
        "Graph",
      ],
      answer: 1,
    },

    {
      question:
        "Which data structure follows LIFO?",
      options: [
        "Queue",
        "Stack",
        "Array",
        "Graph",
      ],
      answer: 1,
    },

    {
      question:
        "Which data structure contains nodes connected by edges?",
      options: [
        "Graph",
        "Array",
        "Stack",
        "Queue",
      ],
      answer: 0,
    },

    {
      question:
        "Which algorithm is commonly used for sorting?",
      options: [
        "Bubble Sort",
        "Print",
        "Input",
        "Compile",
      ],
      answer: 0,
    },
  ],


  "Data Structure": [
    {
      question:
        "Which data structure follows LIFO?",
      options: [
        "Queue",
        "Stack",
        "Array",
        "Graph",
      ],
      answer: 1,
    },

    {
      question:
        "Which data structure follows FIFO?",
      options: [
        "Stack",
        "Queue",
        "Tree",
        "Graph",
      ],
      answer: 1,
    },

    {
      question:
        "Which structure stores data using key-value pairs?",
      options: [
        "Dictionary",
        "Stack",
        "Queue",
        "Array",
      ],
      answer: 0,
    },

    {
      question:
        "Which structure is hierarchical?",
      options: [
        "Tree",
        "Queue",
        "Stack",
        "Array",
      ],
      answer: 0,
    },

    {
      question:
        "Which structure consists of nodes and edges?",
      options: [
        "Graph",
        "Stack",
        "Queue",
        "String",
      ],
      answer: 0,
    },
  ],


  SPM: [
    {
      question:
        "What does SPM stand for?",
      options: [
        "Software Project Management",
        "System Programming Method",
        "Software Process Machine",
        "System Project Model",
      ],
      answer: 0,
    },

    {
      question:
        "What is project planning?",
      options: [
        "Defining project activities and resources",
        "Deleting project files",
        "Installing software",
        "Writing only code",
      ],
      answer: 0,
    },

    {
      question:
        "What is project estimation?",
      options: [
        "Estimating time, cost and resources",
        "Writing documentation only",
        "Testing hardware",
        "Creating passwords",
      ],
      answer: 0,
    },

    {
      question:
        "What is a project schedule?",
      options: [
        "A timeline of project activities",
        "A database table",
        "A programming language",
        "A network protocol",
      ],
      answer: 0,
    },

    {
      question:
        "Risk management is used to:",
      options: [
        "Identify and manage possible project risks",
        "Delete all project data",
        "Create user accounts",
        "Install an operating system",
      ],
      answer: 0,
    },
  ],


  "Software Project Management": [
    {
      question:
        "What is the main purpose of software project management?",
      options: [
        "To plan and control software projects",
        "To design computer hardware",
        "To browse websites",
        "To manage only databases",
      ],
      answer: 0,
    },

    {
      question:
        "Which is an important project constraint?",
      options: [
        "Time",
        "Keyboard",
        "Monitor",
        "Mouse",
      ],
      answer: 0,
    },

    {
      question:
        "What is project estimation?",
      options: [
        "Estimating project resources and effort",
        "Writing HTML",
        "Installing drivers",
        "Creating images",
      ],
      answer: 0,
    },

    {
      question:
        "What is risk management?",
      options: [
        "Managing possible project risks",
        "Deleting source code",
        "Creating websites",
        "Formatting disks",
      ],
      answer: 0,
    },

    {
      question:
        "A project schedule mainly describes:",
      options: [
        "When project activities will happen",
        "Computer specifications",
        "Database passwords",
        "Programming syntax",
      ],
      answer: 0,
    },
  ],


  CN: [
    {
      question:
        "What does CN stand for?",
      options: [
        "Computer Network",
        "Computer Number",
        "Central Network",
        "Control Node",
      ],
      answer: 0,
    },

    {
      question:
        "Which protocol is used for web communication?",
      options: [
        "HTTP",
        "FTP",
        "SMTP",
        "SSH",
      ],
      answer: 0,
    },

    {
      question:
        "What does IP stand for?",
      options: [
        "Internet Protocol",
        "Internal Process",
        "Internet Program",
        "Input Protocol",
      ],
      answer: 0,
    },

    {
      question:
        "Which device connects different networks?",
      options: [
        "Router",
        "Keyboard",
        "Monitor",
        "Printer",
      ],
      answer: 0,
    },

    {
      question:
        "Which protocol is used to send email?",
      options: [
        "SMTP",
        "HTTP",
        "FTP",
        "DNS",
      ],
      answer: 0,
    },
  ],


  "Cloud Computing": [
    {
      question:
        "What is cloud computing?",
      options: [
        "Delivery of computing services over the internet",
        "Only local file storage",
        "A programming language",
        "A computer monitor",
      ],
      answer: 0,
    },

    {
      question:
        "Which is an example of cloud storage?",
      options: [
        "Google Drive",
        "Keyboard",
        "CPU",
        "RAM",
      ],
      answer: 0,
    },

    {
      question:
        "What does SaaS stand for?",
      options: [
        "Software as a Service",
        "System as a Software",
        "Storage as a System",
        "Software and System",
      ],
      answer: 0,
    },

    {
      question:
        "Which is a cloud service provider?",
      options: [
        "AWS",
        "Notepad",
        "Windows Explorer",
        "Calculator",
      ],
      answer: 0,
    },

    {
      question:
        "Cloud services can be accessed through:",
      options: [
        "The internet",
        "Only USB",
        "Only keyboard",
        "Only printer",
      ],
      answer: 0,
    },
  ],


  OS: [
    {
      question:
        "What does OS stand for?",
      options: [
        "Operating System",
        "Open Software",
        "Operating Service",
        "Online System",
      ],
      answer: 0,
    },

    {
      question:
        "Which is an operating system?",
      options: [
        "Windows",
        "HTML",
        "MySQL",
        "Chrome",
      ],
      answer: 0,
    },

    {
      question:
        "What does an operating system manage?",
      options: [
        "Computer resources",
        "Only websites",
        "Only databases",
        "Only images",
      ],
      answer: 0,
    },

    {
      question:
        "Which is responsible for process management?",
      options: [
        "Operating System",
        "Keyboard",
        "Monitor",
        "Printer",
      ],
      answer: 0,
    },

    {
      question:
        "Which is a mobile operating system?",
      options: [
        "Android",
        "Python",
        "MySQL",
        "HTML",
      ],
      answer: 0,
    },
  ],
};


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
// GET QUESTIONS FOR SUBJECT
// =====================================================

function getQuestionsForSubject(subject) {

  const cleanSubject = normalizeSubjectName(subject);

  if (!cleanSubject) {
    return [];
  }

  // Exact match
  if (QUESTION_BANK[cleanSubject]) {
    return QUESTION_BANK[cleanSubject];
  }

  // Case-insensitive match
  const matchingKey = Object.keys(QUESTION_BANK)
    .find(
      (key) =>
        key.toLowerCase() === cleanSubject.toLowerCase()
    );

  if (matchingKey) {
    return QUESTION_BANK[matchingKey];
  }

  // Subject aliases
  const lower = cleanSubject.toLowerCase();

  if (
    lower.includes("python")
  ) {
    return QUESTION_BANK.Python;
  }

  if (
    lower.includes("artificial") ||
    lower === "ai" ||
    lower.includes("aiml") ||
    lower.includes("machine learning")
  ) {
    return QUESTION_BANK.AI;
  }

  if (
    lower.includes("data structure") ||
    lower === "dsa"
  ) {
    return QUESTION_BANK["Data Structure"];
  }

  if (
    lower.includes("project management") ||
    lower === "spm"
  ) {
    return QUESTION_BANK[
      "Software Project Management"
    ];
  }

  if (
    lower.includes("network") ||
    lower === "cn"
  ) {
    return QUESTION_BANK.CN;
  }

  if (
    lower.includes("cloud")
  ) {
    return QUESTION_BANK["Cloud Computing"];
  }

  if (
    lower === "dbms" ||
    lower.includes("database")
  ) {
    return QUESTION_BANK.DBMS;
  }

  if (
    lower === "os" ||
    lower.includes("operating system")
  ) {
    return QUESTION_BANK.OS;
  }

  // Generic fallback
  return [
    {
      question:
        `Which statement is related to ${cleanSubject}?`,
      options: [
        `Studying ${cleanSubject}`,
        "Playing a game",
        "Watching a movie",
        "None of these",
      ],
      answer: 0,
    },

    {
      question:
        `Why is ${cleanSubject} important for students?`,
      options: [
        "It helps improve subject knowledge",
        "It deletes files",
        "It shuts down the computer",
        "It has no purpose",
      ],
      answer: 0,
    },

    {
      question:
        `What is a good way to learn ${cleanSubject}?`,
      options: [
        "Practice and revision",
        "Never study",
        "Ignore the topic",
        "Avoid examples",
      ],
      answer: 0,
    },

    {
      question:
        `Which approach is useful while learning ${cleanSubject}?`,
      options: [
        "Understand concepts and practice",
        "Memorize without understanding",
        "Skip all exercises",
        "Avoid revision",
      ],
      answer: 0,
    },

    {
      question:
        `What can improve your performance in ${cleanSubject}?`,
      options: [
        "Regular practice",
        "Skipping classes",
        "Avoiding questions",
        "Never revising",
      ],
      answer: 0,
    },
  ];
}


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

      const saved =
        localStorage.getItem(
          SUBJECTS_STORAGE_KEY
        );


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

      const saved =
        localStorage.getItem(
          QUIZ_RESULTS_STORAGE_KEY
        );


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


      setResults(parsed);

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


    window.addEventListener(
      "learnova:subjects-updated",
      handleSubjectsUpdated
    );


    return () => {

      window.removeEventListener(
        "learnova:subjects-updated",
        handleSubjectsUpdated
      );

    };

  }, [loadSubjects]);


  // =====================================================
  // GENERATE QUIZ
  // =====================================================

  const generateQuiz = () => {

    setError("");


    if (!subject) {

      setError(
        "Please add a subject from the Subjects page first."
      );

      return;
    }


    const availableQuestions =
      getQuestionsForSubject(subject);


    if (
      !availableQuestions.length
    ) {

      setError(
        "No questions are available for this subject yet."
      );

      return;
    }


    // Always generate exactly 5 questions
    const questions = [
      ...availableQuestions,
    ];


    // Shuffle questions
    questions.sort(
      () => Math.random() - 0.5
    );


    // Take first 5
    const selectedQuestions =
      questions.slice(0, 5);


    setQuizQuestions(
      selectedQuestions
    );

    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setScore(0);

    setQuizStarted(true);
    setQuizCompleted(false);

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


    // Quiz finished
    finishQuiz();

  };


  // =====================================================
  // FINISH QUIZ
  // =====================================================

  const finishQuiz = () => {

    const finalScore =
      score;


    const percentage =
      Math.round(
        (finalScore /
          quizQuestions.length) *
          100
      );


    const newResult = {

      id:
        Date.now(),

      subject,

      topic,

      difficulty,

      score:
        finalScore,

      total:
        quizQuestions.length,

      percentage,

      date:
        new Date().toISOString(),

    };


    try {

      const saved =
        localStorage.getItem(
          QUIZ_RESULTS_STORAGE_KEY
        );


      const oldResults =
        saved
          ? JSON.parse(saved)
          : [];


      const updatedResults = [
        newResult,
        ...(Array.isArray(oldResults)
          ? oldResults
          : []),
      ].slice(0, 20);


      localStorage.setItem(
        QUIZ_RESULTS_STORAGE_KEY,
        JSON.stringify(
          updatedResults
        )
      );


      setResults(
        updatedResults
      );

    } catch (err) {

      console.error(
        "Saving quiz result failed:",
        err
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
              onClick={() => {
                handleNewQuiz();
              }}
            >
              🔄 New Quiz
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
            !subject
          }
        >

          ✨ Generate 5 Questions

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