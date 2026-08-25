// =====================================================
// LEARNOVA AI
// LOCAL OLLAMA AI
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
// OLLAMA REQUEST
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


    console.log(
      "🤖 Sending request to Ollama..."
    );


    const response =
      await fetch(
        OLLAMA_URL,
        {

          method:
            "POST",

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
        "Ollama Error:",
        response.status,
        responseText
      );

      throw new Error(
        `Ollama request failed: ${response.status}`
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
        "Invalid response from Ollama."
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
// CLEAN JSON
// =====================================================

const cleanAIJson = (
  rawText
) => {

  if (
    typeof rawText !==
    "string"
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


  const firstBrace =
    text.indexOf("{");


  const lastBrace =
    text.lastIndexOf("}");


  if (
    firstBrace !== -1 &&
    lastBrace !== -1
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
// QUESTION NORMALIZATION
// =====================================================

const normalizeQuestion = (
  value = ""
) => {

  return String(value)
    .toLowerCase()
    .replace(
      /[^a-z0-9\s]/g,
      " "
    )
    .replace(
      /\s+/g,
      " "
    )
    .trim();

};


// =====================================================
// QUESTION DUPLICATE CHECK
// =====================================================

const isDuplicateQuestion = (
  question,
  previousQuestions = []
) => {

  const normalized =
    normalizeQuestion(
      question
    );


  if (!normalized) {

    return true;

  }


  return previousQuestions.some(
    (oldQuestion) => {

      const old =
        normalizeQuestion(
          oldQuestion
        );


      if (
        old === normalized
      ) {

        return true;

      }


      const a =
        new Set(
          normalized.split(" ")
        );


      const b =
        new Set(
          old.split(" ")
        );


      const intersection =
        [...a].filter(
          (word) =>
            b.has(word)
        ).length;


      const union =
        new Set([
          ...a,
          ...b,
        ]).size;


      const similarity =
        union === 0
          ? 0
          : intersection /
            union;


      return (
        similarity >= 0.82
      );

    }
  );

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


      if (
        !question.options.every(
          (option) =>
            typeof option ===
              "string" &&
            option.trim()
        )
      ) {

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
// UNIQUE QUIZ GENERATOR
// =====================================================

const generateUniqueQuiz = async ({
  subject,
  topic,
  difficulty,
  count,
  previousQuestions = [],
}) => {

  const previous =
    Array.isArray(
      previousQuestions
    )
      ? previousQuestions
          .filter(
            (question) =>
              typeof question ===
                "string" &&
              question.trim()
          )
          .slice(-200)
      : [];


  const previousText =
    previous.length > 0
      ? previous
          .map(
            (question, index) =>
              `${index + 1}. ${question}`
          )
          .join("\n")
      : "NONE";


  for (
    let attempt = 1;
    attempt <= 8;
    attempt++
  ) {

    const prompt = `

You are Learnova AI.

Generate a NEW multiple choice quiz.

Subject:
${subject}

Topic:
${topic}

Difficulty:
${difficulty}

Number of questions:
${count}


IMPORTANT:

The student has already seen the questions
listed below.

DO NOT repeat them.

DO NOT paraphrase them.

DO NOT ask the same concept using different words.

Every question must test a different concept.


PREVIOUS QUESTIONS:

${previousText}


Return ONLY JSON.

Format:

{
  "questions": [
    {
      "question": "Question",
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


Rules:

1. Exactly ${count} questions.
2. Exactly four options.
3. Only one correct answer.
4. answer must be 0, 1, 2 or 3.
5. Questions must match the subject.
6. Questions must match the topic.
7. Questions must match difficulty.
8. No duplicate questions.
9. No paraphrased questions.
10. JSON only.

`;


    try {

      console.log(
        `🧠 Quiz generation attempt ${attempt}/8`
      );


      const data =
        await callOllama(
          prompt,
          {

            temperature:
              0.85,

            top_p:
              0.95,

            top_k:
              60,

            num_ctx:
              4096,

            num_predict:
              1800,

          },
          "json"
        );


      let raw =
        safeText(
          data.response,
          ""
        );


      raw =
        cleanAIJson(
          raw
        );


      if (!raw) {

        continue;

      }


      let quiz;


      try {

        quiz =
          JSON.parse(
            raw
          );

      } catch {

        continue;

      }


      if (
        !validateQuiz(
          quiz,
          count
        )
      ) {

        continue;

      }


      const unique =
        [];


      for (
        const question of
        quiz.questions
      ) {

        if (
          isDuplicateQuestion(
            question.question,
            [
              ...previous,
              ...unique.map(
                (item) =>
                  item.question
              ),
            ]
          )
        ) {

          continue;

        }


        unique.push(
          question
        );

      }


      if (
        unique.length ===
        count
      ) {

        return {
          questions:
            unique,
        };

      }


      console.log(
        "♻️ Duplicate questions detected. Regenerating..."
      );


    } catch (error) {

      console.error(
        "Quiz generation attempt failed:",
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
    "Could not generate enough unique questions."
  );

};


// =====================================================
// AI CHAT
// POST /api/ai/chat
// =====================================================

router.post(
  "/chat",
  async (req, res) => {

    try {

      const {
        message,
        studyTasks = [],
      } = req.body;


      if (
        !message ||
        !String(message).trim()
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Please enter a message.",

        });

      }


      const prompt = `

You are Learnova AI,
a helpful personal study assistant.

Student question:

${message}

Study tasks:

${JSON.stringify(
  studyTasks
)}


Answer the student's question clearly.

Use simple language.

If the student asks in Hindi,
reply in Hindi.

If the student asks in Hinglish,
reply in Hinglish.

Do not invent student information.

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


      return res.status(200).json({

        success: true,

        reply,

        model:
          MODEL_NAME,

      });


    } catch (error) {

      console.error(
        "AI Chat Error:",
        error
      );


      return res.status(500).json({

        success: false,

        message:
          error.message ||
          "Unable to connect to Ollama.",

      });

    }

  }
);


// =====================================================
// AI QUIZ
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
        previousQuestions = [],
      } = req.body;


      const count =
        Math.min(
          Math.max(
            Number(
              numberOfQuestions
            ) || 5,
            1
          ),
          10
        );


      const quiz =
        await generateUniqueQuiz({

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

          previousQuestions,

        });


      return res.status(200).json({

        success: true,

        quiz: {

          subject,

          topic,

          difficulty,

          questions:
            quiz.questions,

        },

      });


    } catch (error) {

      console.error(
        "Quiz Error:",
        error
      );


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
// AI RESOURCES
// POST /api/ai/resources
// =====================================================

router.post(
  "/resources",
  async (req, res) => {

    try {

      const {
        subject = "",
        description = "",
        numberOfResources = 8,
      } = req.body;


      const cleanSubject =
        safeText(
          subject,
          ""
        ).trim();


      const cleanDescription =
        safeText(
          description,
          ""
        ).trim();


      if (!cleanSubject) {

        return res.status(400).json({

          success: false,

          message:
            "Subject is required.",

        });

      }


      const count =
        Math.min(
          Math.max(
            Number(
              numberOfResources
            ) || 8,
            4
          ),
          12
        );


      const prompt = `

You are Learnova AI,
a personalized college study-resource planner.

The student added this subject:

SUBJECT:
${cleanSubject}

SUBJECT DESCRIPTION:
${cleanDescription || "No description provided."}


Generate ${count} useful learning resources.

Cover a mixture of:

- Fundamentals
- Important concepts
- Practice
- Revision
- Projects
- Exam preparation
- Videos
- Courses


IMPORTANT:

You cannot browse the internet.

DO NOT invent URLs.

Instead generate a useful searchQuery.

The application will convert that searchQuery
into a Google or YouTube search link.


Return ONLY valid JSON.

Format:

{
  "resources": [
    {
      "title": "Resource title",
      "description": "What the student will learn",
      "type": "Website",
      "searchQuery": "specific search query",
      "whyUseful": "Why this is useful"
    }
  ]
}


Allowed type:

Website
Video
Course
Note


Rules:

1. Exactly ${count} resources.
2. Every resource must be related to ${cleanSubject}.
3. No duplicate resources.
4. Do not create fake URLs.
5. Search queries must be specific.
6. Keep descriptions short.
7. Return JSON only.

`;


      const data =
        await callOllama(
          prompt,
          {

            temperature:
              0.65,

            top_p:
              0.9,

            top_k:
              50,

            num_ctx:
              4096,

            num_predict:
              1800,

          },
          "json"
        );


      let raw =
        safeText(
          data.response,
          ""
        );


      raw =
        cleanAIJson(
          raw
        );


      if (!raw) {

        throw new Error(
          "Ollama returned an empty resource response."
        );

      }


      let result;


      try {

        result =
          JSON.parse(
            raw
          );

      } catch {

        throw new Error(
          "Ollama returned invalid resource JSON."
        );

      }


      if (
        !result ||
        !Array.isArray(
          result.resources
        )
      ) {

        throw new Error(
          "Invalid resource data."
        );

      }


      const resources =
        result.resources
          .filter(
            (resource) =>
              resource &&
              typeof resource.title ===
                "string" &&
              resource.title.trim()
          )
          .slice(
            0,
            count
          )
          .map(
            (resource) => ({

              title:
                safeText(
                  resource.title,
                  "Learning Resource"
                ).trim(),

              description:
                safeText(
                  resource.description,
                  "AI recommended learning resource."
                ).trim(),

              type:
                [
                  "Website",
                  "Video",
                  "Course",
                  "Note",
                ].includes(
                  resource.type
                )
                  ? resource.type
                  : "Website",

              searchQuery:
                safeText(
                  resource.searchQuery,
                  `${cleanSubject} ${resource.title}`
                ).trim(),

              whyUseful:
                safeText(
                  resource.whyUseful,
                  ""
                ).trim(),

            })
          );


      return res.status(200).json({

        success: true,

        subject:
          cleanSubject,

        resources,

        model:
          MODEL_NAME,

      });


    } catch (error) {

      console.error(
        "AI Resource Error:",
        error
      );


      return res.status(500).json({

        success: false,

        message:
          error.message ||
          "Unable to generate resources.",

      });

    }

  }
);


// =====================================================
// AI RECOMMENDATION
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
      } = req.body;


      const prompt = `

You are Learnova AI.

Give a personalized study recommendation.

Average Score:
${averageScore}%

Weak Subject:
${weakSubject}

Weak Subject Score:
${weakSubjectScore}%

Total Quizzes:
${totalQuizzes}


Give practical and encouraging advice.

Keep the answer between
2 and 4 sentences.

Do not invent data.

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


      return res.status(200).json({

        success: true,

        recommendation,

        model:
          MODEL_NAME,

      });


    } catch (error) {

      console.error(
        "Recommendation Error:",
        error
      );


      return res.status(500).json({

        success: false,

        message:
          error.message ||
          "Unable to generate recommendation.",

      });

    }

  }
);


// =====================================================
// EXPORT
// =====================================================

module.exports =
  router;