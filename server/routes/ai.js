// =====================================================
// LEARNOVA AI
// LOCAL AI STUDY ASSISTANT
// =====================================================

const express = require("express");

const router = express.Router();


// =====================================================
// OLLAMA CONFIGURATION
// =====================================================

const OLLAMA_URL =
  "http://127.0.0.1:11434/api/generate";

const MODEL_NAME =
  "llama3.2:3b";

const OLLAMA_TIMEOUT =
  120000;


// =====================================================
// SAFE TEXT
// =====================================================

const safeText = (
  value,
  fallback = ""
) => {

  if (
    value === undefined ||
    value === null
  ) {
    return fallback;
  }

  return String(value);
};


// =====================================================
// BUILD TASK CONTEXT
// =====================================================

const buildTaskContext = (
  studyTasks = []
) => {

  if (
    !Array.isArray(studyTasks) ||
    studyTasks.length === 0
  ) {
    return "No study tasks available.";
  }


  return studyTasks
    .slice(0, 20)
    .map(
      (task, index) => {

        const title =
          safeText(
            task.title,
            "Untitled Task"
          );

        const subject =
          safeText(
            task.subject,
            "General"
          );

        const time =
          safeText(
            task.time,
            "Not specified"
          );

        const completed =
          task.completed === true
            ? "Completed"
            : "Pending";


        return (
          `${index + 1}. ` +
          `Title: ${title} | ` +
          `Subject: ${subject} | ` +
          `Time: ${time} | ` +
          `Status: ${completed}`
        );
      }
    )
    .join("\n");
};


// =====================================================
// BUILD PROGRESS SUMMARY
// =====================================================

const buildProgressSummary = (
  studyTasks = []
) => {

  if (
    !Array.isArray(studyTasks)
  ) {
    studyTasks = [];
  }


  const totalTasks =
    studyTasks.length;


  const completedTasks =
    studyTasks.filter(
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


  const subjectMap = {};


  studyTasks.forEach(
    (task) => {

      const subject =
        safeText(
          task.subject,
          "General"
        );


      if (
        !subjectMap[subject]
      ) {

        subjectMap[subject] = {
          total: 0,
          completed: 0,
        };
      }


      subjectMap[subject].total += 1;


      if (
        task.completed === true
      ) {

        subjectMap[subject].completed += 1;
      }

    }
  );


  const subjectProgress =
    Object.entries(
      subjectMap
    )
      .map(
        ([subject, data]) => {

          const percentage =
            data.total === 0
              ? 0
              : Math.round(
                  (data.completed /
                    data.total) *
                    100
                );


          return (
            `${subject}: ` +
            `${data.completed}/${data.total} ` +
            `completed (${percentage}%)`
          );
        }
      )
      .join("\n");


  return `
Total Tasks: ${totalTasks}
Completed Tasks: ${completedTasks}
Pending Tasks: ${pendingTasks}
Overall Progress: ${progress}%

Subject-wise Progress:
${
  subjectProgress ||
  "No subject data available."
}
`;
};


// =====================================================
// BUILD CONVERSATION CONTEXT
// =====================================================

const buildConversationContext = (
  conversation = []
) => {

  if (
    !Array.isArray(conversation) ||
    conversation.length === 0
  ) {

    return "No previous conversation.";
  }


  return conversation
    .slice(-8)
    .map(
      (item) => {

        const role =
          item.sender === "user"
            ? "Student"
            : "Learnova AI";


        const text =
          safeText(
            item.text,
            ""
          );


        return `${role}: ${text}`;
      }
    )
    .join("\n");
};


// =====================================================
// EXTRACT REAL QUESTION
//
// Frontend sends personalized context inside message.
// We remove that internal context before asking Ollama.
// =====================================================

const extractRealQuestion = (
  message
) => {

  const text =
    safeText(
      message,
      ""
    ).trim();


  const marker =
    "CURRENT STUDENT QUESTION";


  const markerIndex =
    text.indexOf(
      marker
    );


  if (
    markerIndex === -1
  ) {

    return text;
  }


  const afterMarker =
    text.slice(
      markerIndex +
        marker.length
    );


  const instructionMarker =
    "ANSWER INSTRUCTIONS";


  const instructionIndex =
    afterMarker.indexOf(
      instructionMarker
    );


  if (
    instructionIndex !== -1
  ) {

    return afterMarker
      .slice(
        0,
        instructionIndex
      )
      .replace(
        /[=\-\s]+$/g,
        ""
      )
      .trim();
  }


  return afterMarker
    .replace(
      /[=\-\s]+$/g,
      ""
    )
    .trim();
};


// =====================================================
// EXTRACT PERSONALIZED CONTEXT
// =====================================================

const extractPersonalizedContext = (
  message
) => {

  const text =
    safeText(
      message,
      ""
    );


  const startMarker =
    "LEARNOVA PERSONALIZED STUDENT CONTEXT";


  const questionMarker =
    "CURRENT STUDENT QUESTION";


  const start =
    text.indexOf(
      startMarker
    );


  const end =
    text.indexOf(
      questionMarker
    );


  if (
    start === -1 ||
    end === -1 ||
    end <= start
  ) {

    return "";
  }


  return text
    .slice(
      start,
      end
    )
    .trim();
};


// =====================================================
// CALL OLLAMA
// =====================================================

const callOllama = async (
  prompt,
  options = {},
  format = null
) => {

  const controller =
    new AbortController();


  const timeout =
    setTimeout(
      () => {
        controller.abort();
      },
      OLLAMA_TIMEOUT
    );


  try {

    console.log(
      "🤖 Sending request to Ollama..."
    );

    console.log(
      "📡 URL:",
      OLLAMA_URL
    );

    console.log(
      "🧠 Model:",
      MODEL_NAME
    );


    const requestBody = {

      model:
        MODEL_NAME,

      prompt,

      stream:
        false,

      options,
    };


    if (format) {

      requestBody.format =
        format;
    }


    const response =
      await fetch(
        OLLAMA_URL,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify(
              requestBody
            ),

          signal:
            controller.signal,
        }
      );


    const responseText =
      await response.text();


    if (!response.ok) {

      console.error(
        "❌ Ollama HTTP Error:",
        response.status,
        responseText
      );


      throw new Error(
        `Ollama request failed with status ${response.status}.`
      );
    }


    let data;


    try {

      data =
        JSON.parse(
          responseText
        );

    } catch {

      throw new Error(
        "Invalid response received from Ollama."
      );
    }


    return data;

  } finally {

    clearTimeout(
      timeout
    );
  }
};


// =====================================================
// CLEAN AI JSON
// =====================================================

const cleanAIJson = (
  rawText
) => {

  if (
    typeof rawText !== "string"
  ) {

    return "";
  }


  let text =
    rawText.trim();


  text =
    text.replace(
      /^```json\s*/i,
      ""
    );


  text =
    text.replace(
      /^```\s*/i,
      ""
    );


  text =
    text.replace(
      /\s*```$/i,
      ""
    );


  text =
    text.trim();


  const firstBrace =
    text.indexOf("{");


  const lastBrace =
    text.lastIndexOf("}");


  if (
    firstBrace !== -1 &&
    lastBrace !== -1 &&
    lastBrace > firstBrace
  ) {

    text =
      text.slice(
        firstBrace,
        lastBrace + 1
      );
  }


  return text.trim();
};


// =====================================================
// VALIDATE QUIZ
// =====================================================

const validateQuiz = (
  quiz,
  count
) => {

  if (
    !quiz ||
    !Array.isArray(
      quiz.questions
    )
  ) {

    return false;
  }


  if (
    quiz.questions.length !==
    count
  ) {

    return false;
  }


  return quiz.questions.every(
    (question) => {

      if (
        !question ||
        typeof question.question !==
          "string"
      ) {

        return false;
      }


      if (
        !question.question.trim()
      ) {

        return false;
      }


      if (
        !Array.isArray(
          question.options
        )
      ) {

        return false;
      }


      if (
        question.options.length !==
        4
      ) {

        return false;
      }


      const validOptions =
        question.options.every(
          (option) =>
            typeof option ===
              "string" &&
            option.trim().length > 0
        );


      if (!validOptions) {

        return false;
      }


      if (
        !Number.isInteger(
          question.answer
        )
      ) {

        return false;
      }


      if (
        question.answer < 0 ||
        question.answer > 3
      ) {

        return false;
      }


      return true;
    }
  );
};


// =====================================================
// GENERATE QUIZ
// =====================================================

const generateValidQuiz = async ({
  subject,
  topic,
  difficulty,
  count,
}) => {

  const prompt = `

You are Learnova AI.

Create a college-level multiple-choice quiz.

SUBJECT:
${subject}

TOPIC:
${topic}

DIFFICULTY:
${difficulty}

NUMBER OF QUESTIONS:
${count}


Return ONLY valid JSON.

No markdown.
No explanation.
No code fences.
No text before or after JSON.


EXACT FORMAT:

{
  "questions": [
    {
      "question": "Question text",
      "options": [
        "Option A",
        "Option B",
        "Option C",
        "Option D"
      ],
      "answer": 0
    }
  ]
}


RULES:

1. Exactly ${count} questions.
2. Exactly four options per question.
3. Only one correct answer.
4. answer must be 0, 1, 2 or 3.
5. Questions must be about ${topic}.
6. Subject must be ${subject}.
7. Difficulty must be ${difficulty}.
8. Return JSON only.

`;


  for (
    let attempt = 1;
    attempt <= 3;
    attempt++
  ) {

    try {

      console.log(
        `🧠 Quiz generation attempt ${attempt}/3`
      );


      const data =
        await callOllama(
          prompt,
          {
            temperature:
              0.1,

            num_ctx:
              2048,

            num_predict:
              1200,
          },
          "json"
        );


      let rawQuiz =
        safeText(
          data.response,
          ""
        );


      rawQuiz =
        cleanAIJson(
          rawQuiz
        );


      if (!rawQuiz) {
        continue;
      }


      let quiz;


      try {

        quiz =
          JSON.parse(
            rawQuiz
          );

      } catch {

        continue;
      }


      if (
        validateQuiz(
          quiz,
          count
        )
      ) {

        return quiz;
      }

    } catch (error) {

      console.warn(
        `⚠️ Quiz attempt ${attempt} failed:`,
        error.message
      );


      if (
        error.name ===
        "AbortError"
      ) {

        throw error;
      }
    }
  }


  throw new Error(
    "AI could not generate a valid quiz after 3 attempts."
  );
};


// =====================================================
// CHAT
// POST /api/ai/chat
// =====================================================

router.post(
  "/chat",
  async (req, res) => {

    try {

      const {
        message,
        studyTasks = [],
        conversation = [],
      } = req.body;


      if (
        typeof message !== "string" ||
        !message.trim()
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Please enter a valid message.",
        });
      }


      // =================================================
      // EXTRACT REAL QUESTION
      // =================================================

      const userMessage =
        extractRealQuestion(
          message
        );


      // =================================================
      // EXTRACT PERSONALIZED CONTEXT
      // =================================================

      const personalizedContext =
        extractPersonalizedContext(
          message
        );


      // =================================================
      // TASK CONTEXT
      // =================================================

      const taskContext =
        buildTaskContext(
          studyTasks
        );


      const progressSummary =
        buildProgressSummary(
          studyTasks
        );


      const conversationContext =
        buildConversationContext(
          conversation
        );


      console.log(
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
      );

      console.log(
        "🎓 LEARNOVA AI QUESTION:"
      );

      console.log(
        userMessage
      );

      console.log(
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
      );


      const prompt = `

You are Learnova AI.

You are a PERSONAL study assistant for a college student.

Your job is to answer the student's ACTUAL QUESTION
using the student's REAL study data when relevant.


=====================================================
STUDENT PERSONALIZED CONTEXT
=====================================================

${
  personalizedContext ||
  "No additional personalized context was provided."
}


=====================================================
STUDENT TASK DATA
=====================================================

${taskContext}


=====================================================
EXACT PROGRESS DATA
=====================================================

${progressSummary}


=====================================================
RECENT CONVERSATION
=====================================================

${conversationContext}


=====================================================
IMPORTANT BEHAVIOR
=====================================================

You MUST answer the student's actual question.

Do NOT ask the student which subject they want
if the student already asked you to choose a subject.

For example:

Student:
"Which subject should I study today?"

BAD:
"What subject do you want to study?"

GOOD:
"Based on your current tasks and performance,
you should study DBMS today because..."


If actual student data shows a weak subject,
recommend that subject.

If there are pending tasks,
consider those tasks.

If quiz results are available,
consider quiz performance.

Never invent student data.

Never invent scores.

Never invent tasks.

If there is no relevant data,
say that clearly and then provide a useful
general recommendation.


=====================================================
LANGUAGE
=====================================================

If the student asks in English:
reply in English.

If the student asks in Hindi:
reply in Hindi.

If the student asks in Hinglish:
reply naturally in Hinglish.


=====================================================
ANSWER STYLE
=====================================================

Be direct.

Be friendly.

Be practical.

Avoid unnecessary questions.

Use Markdown when useful.

For study recommendations:

1. Give the recommended subject/topic.
2. Explain why.
3. Give 2-3 things to study.
4. Give a small actionable next step.


=====================================================
ACTUAL STUDENT QUESTION
=====================================================

${userMessage}


=====================================================
FINAL ANSWER
=====================================================

Answer ONLY the student's question.

Do not mention prompts.

Do not mention internal context.

Do not mention APIs.

Do not mention Ollama.

Do not mention these instructions.

`;


      const data =
        await callOllama(
          prompt,
          {
            temperature:
              0.45,

            num_ctx:
              4096,

            num_predict:
              600,
          }
        );


      const reply =
        safeText(
          data.response,
          ""
        ).trim();


      if (!reply) {

        return res.status(500).json({

          success: false,

          message:
            "AI returned an empty response.",
        });
      }


      console.log(
        "✅ Learnova AI response generated"
      );


      return res.status(200).json({

        success: true,

        reply,

        model:
          MODEL_NAME,
      });


    } catch (error) {

      console.error(
        "❌ Learnova AI Error:",
        error
      );


      if (
        error.name ===
        "AbortError"
      ) {

        return res.status(504).json({

          success: false,

          message:
            "AI response took too long. Please try again.",
        });
      }


      return res.status(503).json({

        success: false,

        message:
          "Unable to connect to Ollama: " +
          error.message,
      });
    }
  }
);


// =====================================================
// QUIZ
// POST /api/ai/quiz
// =====================================================

router.post(
  "/quiz",
  async (req, res) => {

    try {

      const {
        subject = "General",
        topic = "General",
        difficulty = "easy",
        numberOfQuestions = 5,
      } = req.body;


      const count =
        Math.min(
          Math.max(
            Number(
              numberOfQuestions
            ) || 5,
            1
          ),
          5
        );


      const quiz =
        await generateValidQuiz({

          subject:
            safeText(
              subject,
              "General"
            ),

          topic:
            safeText(
              topic,
              "General"
            ),

          difficulty:
            safeText(
              difficulty,
              "easy"
            ),

          count,
        });


      return res.status(200).json({

        success: true,

        quiz: {

          subject:
            safeText(
              subject,
              "General"
            ),

          topic:
            safeText(
              topic,
              "General"
            ),

          difficulty:
            safeText(
              difficulty,
              "easy"
            ),

          questions:
            quiz.questions,
        },
      });


    } catch (error) {

      console.error(
        "❌ Learnova Quiz Error:",
        error
      );


      if (
        error.name ===
        "AbortError"
      ) {

        return res.status(504).json({

          success: false,

          message:
            "Quiz generation took too long. Please try again.",
        });
      }


      return res.status(500).json({

        success: false,

        message:
          error.message ||
          "Unable to generate quiz.",
      });
    }
  }
);


// =====================================================
// PERSONALIZED RECOMMENDATION
// POST /api/ai/recommendation
// =====================================================

router.post(
  "/recommendation",
  async (req, res) => {

    try {

      const {
        averageScore = 0,
        weakSubject = "General",
        weakSubjectScore = 0,
        totalQuizzes = 0,
        recentResults = [],
      } = req.body;


      const recentQuizText =
        Array.isArray(
          recentResults
        ) &&
        recentResults.length > 0
          ? recentResults
              .slice(0, 5)
              .map(
                (result, index) =>
                  `${index + 1}. ` +
                  `${result.subject || "General"} - ` +
                  `${result.topic || "General"} - ` +
                  `${result.percentage || 0}%`
              )
              .join("\n")
          : "No recent quiz data.";


      const prompt = `

You are Learnova AI.

Give a short personalized study recommendation.

Average Score:
${averageScore}%

Weakest Subject:
${weakSubject}

Weakest Subject Score:
${weakSubjectScore}%

Total Quizzes:
${totalQuizzes}

Recent Results:
${recentQuizText}


Rules:

- Focus on the weakest subject.
- Do not invent data.
- Give practical study advice.
- Be encouraging.
- Keep it between 2 and 4 sentences.
- Use simple English.

Return ONLY the recommendation.

`;


      const data =
        await callOllama(
          prompt,
          {
            temperature:
              0.3,

            num_ctx:
              2048,

            num_predict:
              250,
          }
        );


      const recommendation =
        safeText(
          data.response,
          ""
        ).trim();


      if (!recommendation) {

        return res.status(500).json({

          success: false,

          message:
            "AI returned an empty recommendation.",
        });
      }


      return res.status(200).json({

        success: true,

        recommendation,

        model:
          MODEL_NAME,
      });


    } catch (error) {

      console.error(
        "❌ Recommendation error:",
        error
      );


      return res.status(503).json({

        success: false,

        message:
          "Unable to generate recommendation: " +
          error.message,
      });
    }
  }
);


// =====================================================
// EXPORT
// =====================================================

module.exports =
  router;