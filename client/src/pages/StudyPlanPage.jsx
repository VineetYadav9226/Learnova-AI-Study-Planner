import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getTasks,
  createTask,
  updateTaskAPI,
  deleteTaskAPI,
} from "../services/taskService";


// =====================================================
// SUBJECTS
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
// DATE HELPERS
// =====================================================

const getTaskDate = (task) => {
  const value =
    task.date ||
    task.dueDate ||
    task.createdAt ||
    task.created_at;

  if (!value) return null;

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? null
    : date;
};


const isToday = (task) => {
  const date = getTaskDate(task);

  if (!date) return false;

  const today = new Date();

  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
};


// =====================================================
// STUDY PLAN PAGE
// =====================================================

function StudyPlanPage() {

  // ===================================================
  // STATE
  // ===================================================

  const [tasks, setTasks] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  // Filters
  const [view, setView] = useState("today");

  const [search, setSearch] = useState("");

  const [subjectFilter, setSubjectFilter] =
    useState("all");

  const [statusFilter, setStatusFilter] =
    useState("all");

  // Create modal
  const [showCreate, setShowCreate] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [form, setForm] = useState({
    title: "",
    subject: "Python",
    time: "",
    date: "",
  });


  // ===================================================
  // LOAD TASKS
  // ===================================================

  useEffect(() => {
    let cancelled = false;

    const loadTasks = async () => {
      try {
        setLoading(true);
        setError("");

        const result = await getTasks();

        if (cancelled) return;

        if (!result.success) {
          setError(
            result.message ||
              "Unable to load your study plan."
          );
          return;
        }

        setTasks(
          Array.isArray(result.tasks)
            ? result.tasks
            : []
        );

      } catch (err) {
        if (cancelled) return;

        console.error(
          "Study plan loading error:",
          err
        );

        setError(
          "Unable to connect to the task server."
        );

      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadTasks();

    return () => {
      cancelled = true;
    };
  }, []);


  // ===================================================
  // SUBJECT OPTIONS
  // ===================================================

  const subjectOptions = useMemo(() => {
    const fromTasks = tasks
      .map((task) => task.subject)
      .filter(Boolean);

    return [
      ...new Set([
        ...SUBJECTS,
        ...fromTasks,
      ]),
    ];
  }, [tasks]);


  // ===================================================
  // STATISTICS
  // ===================================================

  const totalTasks = tasks.length;

  const completedTasks = tasks.filter(
    (task) => Boolean(task.completed)
  ).length;

  const pendingTasks =
    totalTasks - completedTasks;

  const progress =
    totalTasks === 0
      ? 0
      : Math.round(
          (completedTasks / totalTasks) * 100
        );


  // ===================================================
  // TODAY STATISTICS
  // ===================================================

  const todayTasks = tasks.filter(
    (task) => isToday(task)
  );

  const todayCompleted = todayTasks.filter(
    (task) => task.completed
  ).length;

  const todayProgress =
    todayTasks.length === 0
      ? 0
      : Math.round(
          (todayCompleted / todayTasks.length) *
            100
        );


  // ===================================================
  // FILTER TASKS
  // ===================================================

  const filteredTasks = useMemo(() => {

    const query = search
      .trim()
      .toLowerCase();

    return tasks.filter((task) => {

      const matchesView =
        view === "all" ||
        isToday(task);

      const matchesSearch =
        !query ||
        String(task.title || "")
          .toLowerCase()
          .includes(query) ||
        String(task.subject || "")
          .toLowerCase()
          .includes(query);

      const matchesSubject =
        subjectFilter === "all" ||
        String(task.subject || "")
          .toLowerCase() ===
          subjectFilter.toLowerCase();

      const matchesStatus =
        statusFilter === "all" ||
        (
          statusFilter === "completed" &&
          task.completed
        ) ||
        (
          statusFilter === "pending" &&
          !task.completed
        );

      return (
        matchesView &&
        matchesSearch &&
        matchesSubject &&
        matchesStatus
      );
    });

  }, [
    tasks,
    view,
    search,
    subjectFilter,
    statusFilter,
  ]);


  // ===================================================
  // TOGGLE TASK
  // ===================================================

  const toggleTask = async (task) => {

    const id = task._id || task.id;

    const completed = !task.completed;

    setTasks((current) =>
      current.map((item) =>
        item._id === id || item.id === id
          ? {
              ...item,
              completed,
            }
          : item
      )
    );

    try {

      const result = await updateTaskAPI(
        id,
        {
          completed,
        }
      );

      if (!result.success) {
        throw new Error(
          result.message ||
            "Unable to update task."
        );
      }

    } catch (err) {

      console.error(
        "Toggle study task error:",
        err
      );

      setTasks((current) =>
        current.map((item) =>
          item._id === id || item.id === id
            ? {
                ...item,
                completed:
                  task.completed,
              }
            : item
        )
      );

      setError(
        err.message ||
          "Unable to update task."
      );
    }
  };


  // ===================================================
  // DELETE TASK
  // ===================================================

  const deleteTask = async (task) => {

    const id = task._id || task.id;

    const confirmed = window.confirm(
      `Delete "${task.title}" from your study plan?`
    );

    if (!confirmed) return;

    try {

      setError("");

      const result =
        await deleteTaskAPI(id);

      if (!result.success) {
        throw new Error(
          result.message ||
            "Unable to delete task."
        );
      }

      setTasks((current) =>
        current.filter(
          (item) =>
            item._id !== id &&
            item.id !== id
        )
      );

    } catch (err) {

      console.error(
        "Delete study task error:",
        err
      );

      setError(
        err.message ||
          "Unable to delete task."
      );
    }
  };


  // ===================================================
  // CREATE TASK
  // ===================================================

  const createStudyTask = async (event) => {

    event.preventDefault();

    if (
      !form.title.trim() ||
      !form.time.trim()
    ) {
      setError(
        "Please enter a task title and time."
      );

      return;
    }

    try {

      setSaving(true);
      setError("");

      const payload = {
        title: form.title.trim(),
        subject: form.subject,
        time: form.time.trim(),
      };

      if (form.date) {
        payload.date = form.date;
      }

      const result =
        await createTask(payload);

      if (!result.success) {
        throw new Error(
          result.message ||
            "Unable to create task."
        );
      }

      setTasks((current) => [
        ...current,
        result.task,
      ]);

      setForm({
        title: "",
        subject: "Python",
        time: "",
        date: "",
      });

      setShowCreate(false);

    } catch (err) {

      console.error(
        "Create study task error:",
        err
      );

      setError(
        err.message ||
          "Unable to create task."
      );

    } finally {
      setSaving(false);
    }
  };


  // ===================================================
  // EMPTY TEXT
  // ===================================================

  const emptyText =
    view === "today"
      ? "No tasks scheduled for today."
      : "No study tasks found.";


  // ===================================================
  // RENDER
  // ===================================================

  return (
    <>
      {/* =================================================
          PAGE STYLES
      ================================================= */}

      <style>{`

        .study-plan-page {
          width: 100%;
          max-width: 1320px;
          margin: 0 auto;
          padding: 34px 38px 60px;
          box-sizing: border-box;
          color: #172033;
        }

        .sp-page-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 30px;
          margin-bottom: 28px;
        }

        .sp-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          color: #6557f5;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.08em;
          margin-bottom: 8px;
        }

        .sp-page-title {
          margin: 0;
          font-size: 36px;
          line-height: 1.1;
          font-weight: 800;
          letter-spacing: -0.03em;
          color: #172033;
        }

        .sp-page-subtitle {
          margin: 9px 0 0;
          color: #6b7890;
          font-size: 15px;
          line-height: 1.5;
        }

        .sp-primary-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border: 0;
          border-radius: 11px;
          padding: 13px 18px;
          min-height: 46px;
          background: linear-gradient(
            135deg,
            #6557f5,
            #5544e8
          );
          color: #ffffff;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
          box-shadow:
            0 10px 24px
            rgba(101, 87, 245, 0.22);
          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease;
        }

        .sp-primary-btn:hover {
          transform: translateY(-2px);
          box-shadow:
            0 14px 28px
            rgba(101, 87, 245, 0.28);
        }

        .sp-error {
          display: flex;
          align-items: center;
          gap: 9px;
          margin-bottom: 20px;
          padding: 12px 15px;
          border: 1px solid #fecdd3;
          border-radius: 11px;
          background: #fff5f6;
          color: #be123c;
          font-size: 13px;
        }

        /* =========================
           STATS
        ========================= */

        .sp-stats-grid {
          display: grid;
          grid-template-columns:
            repeat(4, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 20px;
        }

        .sp-stat-card {
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 15px;
          min-height: 112px;
          padding: 19px;
          box-sizing: border-box;
          border: 1px solid #e7eaf0;
          border-radius: 15px;
          background: #ffffff;
          box-shadow:
            0 5px 20px
            rgba(20, 30, 60, 0.045);
          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease;
        }

        .sp-stat-card:hover {
          transform: translateY(-2px);
          box-shadow:
            0 10px 25px
            rgba(20, 30, 60, 0.07);
        }

        .sp-stat-icon {
          width: 50px;
          height: 50px;
          flex: 0 0 50px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 14px;
          font-size: 22px;
        }

        .sp-stat-icon.purple {
          background: #f0edff;
        }

        .sp-stat-icon.green {
          background: #eafaf1;
        }

        .sp-stat-icon.orange {
          background: #fff6df;
        }

        .sp-stat-icon.blue {
          background: #edf4ff;
        }

        .sp-stat-content {
          min-width: 0;
        }

        .sp-stat-label {
          color: #71809a;
          font-size: 12px;
          font-weight: 600;
        }

        .sp-stat-value {
          margin-top: 2px;
          color: #172033;
          font-size: 25px;
          line-height: 1.1;
          font-weight: 800;
        }

        .sp-stat-help {
          margin-top: 4px;
          color: #9aa5b7;
          font-size: 11px;
        }

        /* =========================
           TODAY BANNER
        ========================= */

        .sp-today-card {
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 20px;
          padding: 19px 23px;
          border-radius: 16px;
          background:
            linear-gradient(
              135deg,
              #5040cb 0%,
              #6959f7 100%
            );
          color: #ffffff;
          box-shadow:
            0 12px 28px
            rgba(82, 67, 204, 0.18);
        }

        .sp-today-card::after {
          content: "";
          position: absolute;
          width: 170px;
          height: 170px;
          right: -60px;
          top: -100px;
          border-radius: 50%;
          background:
            rgba(255, 255, 255, 0.08);
        }

        .sp-today-content {
          position: relative;
          z-index: 1;
        }

        .sp-today-title {
          margin: 0;
          font-size: 18px;
          font-weight: 800;
        }

        .sp-today-text {
          margin: 4px 0 0;
          color: rgba(255,255,255,0.82);
          font-size: 13px;
        }

        .sp-today-progress {
          position: relative;
          z-index: 1;
          min-width: 70px;
          text-align: right;
          font-size: 29px;
          font-weight: 800;
        }

        /* =========================
           FILTER BAR
        ========================= */

        .sp-filter-card {
          display: grid;
          grid-template-columns:
            minmax(250px, 1.5fr)
            repeat(3, minmax(150px, 0.8fr));
          gap: 11px;
          margin-bottom: 24px;
          padding: 14px;
          border: 1px solid #e7eaf0;
          border-radius: 15px;
          background: #ffffff;
          box-shadow:
            0 4px 16px
            rgba(20, 30, 60, 0.035);
        }

        .sp-input-wrap {
          position: relative;
          min-width: 0;
        }

        .sp-search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #8793a8;
          font-size: 16px;
          pointer-events: none;
        }

        .sp-input,
        .sp-select {
          width: 100%;
          height: 44px;
          box-sizing: border-box;
          border: 1px solid #dfe4ec;
          border-radius: 10px;
          outline: none;
          background: #ffffff;
          color: #172033;
          font-family: inherit;
          font-size: 13px;
          transition:
            border-color 0.2s ease,
            box-shadow 0.2s ease;
        }

        .sp-input {
          padding: 0 14px 0 40px;
        }

        .sp-select {
          padding: 0 12px;
        }

        .sp-input:focus,
        .sp-select:focus {
          border-color: #8b80ff;
          box-shadow:
            0 0 0 3px
            rgba(101, 87, 245, 0.10);
        }

        /* =========================
           TASK SECTION
        ========================= */

        .sp-task-section {
          margin-top: 2px;
        }

        .sp-section-heading {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 15px;
          margin-bottom: 13px;
        }

        .sp-section-title {
          margin: 0;
          color: #172033;
          font-size: 23px;
          line-height: 1.2;
          font-weight: 800;
          letter-spacing: -0.02em;
        }

        .sp-section-count {
          margin: 4px 0 0;
          color: #8a96a9;
          font-size: 12px;
        }

        .sp-task-list {
          display: flex;
          flex-direction: column;
          gap: 9px;
        }

        .sp-task-item {
          display: flex;
          align-items: center;
          gap: 14px;
          min-width: 0;
          min-height: 78px;
          padding: 13px 15px;
          box-sizing: border-box;
          border: 1px solid #e6eaf0;
          border-radius: 14px;
          background: #ffffff;
          box-shadow:
            0 4px 15px
            rgba(20, 30, 60, 0.035);
          transition:
            transform 0.18s ease,
            box-shadow 0.18s ease,
            border-color 0.18s ease;
        }

        .sp-task-item:hover {
          transform: translateY(-1px);
          border-color: #ddd9ff;
          box-shadow:
            0 8px 22px
            rgba(20, 30, 60, 0.065);
        }

        .sp-task-check {
          width: 24px;
          height: 24px;
          flex: 0 0 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #d5dbe6;
          border-radius: 7px;
          background: #ffffff;
          color: #ffffff;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
          transition: 0.2s ease;
        }

        .sp-task-check:hover {
          border-color: #7b6ff5;
        }

        .sp-task-check.completed {
          border-color: #6557f5;
          background: #6557f5;
        }

        .sp-task-main {
          flex: 1;
          min-width: 0;
        }

        .sp-task-title {
          overflow: hidden;
          color: #172033;
          font-size: 15px;
          font-weight: 750;
          line-height: 1.35;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .sp-task-title.completed {
          color: #98a2b3;
          text-decoration: line-through;
        }

        .sp-task-time {
          margin-top: 4px;
          color: #738198;
          font-size: 12px;
        }

        .sp-task-subject {
          flex: 0 0 auto;
          padding: 7px 11px;
          border-radius: 9px;
          background: #f0edff;
          color: #5b4ae8;
          font-size: 11px;
          font-weight: 750;
          white-space: nowrap;
        }

        .sp-task-status {
          flex: 0 0 auto;
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 750;
          white-space: nowrap;
        }

        .sp-task-status.pending {
          background: #fff6e8;
          color: #c56a08;
        }

        .sp-task-status.completed {
          background: #eafaf1;
          color: #087b4d;
        }

        .sp-delete-btn {
          width: 36px;
          height: 36px;
          flex: 0 0 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #e6eaf0;
          border-radius: 9px;
          background: #ffffff;
          color: #e45c69;
          cursor: pointer;
          font-size: 15px;
          transition: 0.2s ease;
        }

        .sp-delete-btn:hover {
          border-color: #fecdd3;
          background: #fff4f5;
        }

        /* =========================
           EMPTY / LOADING
        ========================= */

        .sp-empty {
          padding: 42px 20px;
          border: 1px dashed #dfe3eb;
          border-radius: 14px;
          background: #fafaff;
          text-align: center;
        }

        .sp-empty-icon {
          margin-bottom: 9px;
          font-size: 32px;
        }

        .sp-empty-title {
          color: #273247;
          font-size: 14px;
          font-weight: 700;
        }

        .sp-empty-text {
          margin: 6px 0 16px;
          color: #8994a7;
          font-size: 12px;
        }

        .sp-secondary-btn {
          border: 1px solid #dcd8ff;
          border-radius: 9px;
          padding: 9px 14px;
          background: #f7f5ff;
          color: #5b4ae8;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        .sp-loading {
          padding: 42px 20px;
          color: #7d899d;
          text-align: center;
          font-size: 13px;
        }

        /* =========================
           MODAL
        ========================= */

        .sp-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          box-sizing: border-box;
          background:
            rgba(15, 23, 42, 0.48);
          backdrop-filter: blur(5px);
        }

        .sp-modal {
          width: 100%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
          box-sizing: border-box;
          padding: 25px;
          border: 1px solid #e8eaf0;
          border-radius: 18px;
          background: #ffffff;
          box-shadow:
            0 25px 70px
            rgba(15, 23, 42, 0.22);
        }

        .sp-modal-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 15px;
          margin-bottom: 20px;
        }

        .sp-modal-title {
          margin: 0;
          color: #172033;
          font-size: 20px;
          font-weight: 800;
        }

        .sp-modal-subtitle {
          margin: 5px 0 0;
          color: #8994a7;
          font-size: 12px;
        }

        .sp-close-btn {
          width: 32px;
          height: 32px;
          flex: 0 0 32px;
          border: 0;
          border-radius: 9px;
          background: #f3f4f7;
          color: #64748b;
          cursor: pointer;
          font-size: 19px;
        }

        .sp-form-group {
          margin-bottom: 15px;
        }

        .sp-form-label {
          display: block;
          margin-bottom: 6px;
          color: #273247;
          font-size: 12px;
          font-weight: 700;
        }

        .sp-form-input,
        .sp-form-select {
          width: 100%;
          height: 43px;
          box-sizing: border-box;
          padding: 0 12px;
          border: 1px solid #dfe3ea;
          border-radius: 9px;
          outline: none;
          background: #ffffff;
          color: #172033;
          font-family: inherit;
          font-size: 13px;
        }

        .sp-form-input:focus,
        .sp-form-select:focus {
          border-color: #8b80ff;
          box-shadow:
            0 0 0 3px
            rgba(101, 87, 245, 0.10);
        }

        .sp-modal-submit {
          width: 100%;
          height: 45px;
          margin-top: 7px;
          border: 0;
          border-radius: 10px;
          background:
            linear-gradient(
              135deg,
              #6557f5,
              #5544e8
            );
          color: #ffffff;
          font-size: 13px;
          font-weight: 750;
          cursor: pointer;
        }

        .sp-modal-submit:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        /* =========================
           RESPONSIVE
        ========================= */

        @media (max-width: 1150px) {

          .study-plan-page {
            padding: 28px 25px 50px;
          }

          .sp-stats-grid {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }

          .sp-filter-card {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }

          .sp-filter-card .sp-input-wrap {
            grid-column: 1 / -1;
          }

        }


        @media (max-width: 760px) {

          .study-plan-page {
            padding: 22px 16px 40px;
          }

          .sp-page-header {
            align-items: stretch;
            flex-direction: column;
            gap: 18px;
          }

          .sp-primary-btn {
            width: 100%;
          }

          .sp-page-title {
            font-size: 30px;
          }

          .sp-stats-grid {
            grid-template-columns: 1fr;
          }

          .sp-filter-card {
            grid-template-columns: 1fr;
          }

          .sp-filter-card .sp-input-wrap {
            grid-column: auto;
          }

          .sp-today-card {
            align-items: flex-start;
          }

          .sp-task-item {
            align-items: flex-start;
            flex-wrap: wrap;
          }

          .sp-task-main {
            min-width: calc(100% - 45px);
          }

          .sp-task-subject,
          .sp-task-status,
          .sp-delete-btn {
            margin-top: 2px;
          }

        }


        @media (max-width: 480px) {

          .study-plan-page {
            padding: 18px 12px 32px;
          }

          .sp-page-title {
            font-size: 27px;
          }

          .sp-stat-card {
            min-height: 98px;
            padding: 15px;
          }

          .sp-stat-icon {
            width: 44px;
            height: 44px;
            flex-basis: 44px;
          }

          .sp-stat-value {
            font-size: 23px;
          }

          .sp-today-card {
            padding: 17px;
          }

          .sp-today-progress {
            font-size: 25px;
          }

          .sp-task-item {
            padding: 12px;
          }

          .sp-task-status {
            display: none;
          }

        }

      `}</style>


      {/* =================================================
          MAIN PAGE
      ================================================= */}

      <main className="study-plan-page">

        {/* HEADER */}

        <header className="sp-page-header">

          <div>

            <div className="sp-eyebrow">
              📅 LEARNOVA STUDY PLANNER
            </div>

            <h1 className="sp-page-title">
              Your Study Plan
            </h1>

            <p className="sp-page-subtitle">
              Organize your study tasks and stay
              consistent with your goals.
            </p>

          </div>


          <button
            type="button"
            className="sp-primary-btn"
            onClick={() =>
              setShowCreate(true)
            }
          >
            <span>＋</span>
            Create Study Task
          </button>

        </header>


        {/* ERROR */}

        {error && (
          <div className="sp-error">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}


        {/* =================================================
            STATISTICS
        ================================================= */}

        <section className="sp-stats-grid">

          <div className="sp-stat-card">

            <div className="sp-stat-icon purple">
              📚
            </div>

            <div className="sp-stat-content">

              <div className="sp-stat-label">
                Total Tasks
              </div>

              <div className="sp-stat-value">
                {totalTasks}
              </div>

              <div className="sp-stat-help">
                All study tasks
              </div>

            </div>

          </div>


          <div className="sp-stat-card">

            <div className="sp-stat-icon green">
              ✓
            </div>

            <div className="sp-stat-content">

              <div className="sp-stat-label">
                Completed
              </div>

              <div className="sp-stat-value">
                {completedTasks}
              </div>

              <div className="sp-stat-help">
                Tasks completed
              </div>

            </div>

          </div>


          <div className="sp-stat-card">

            <div className="sp-stat-icon orange">
              ◷
            </div>

            <div className="sp-stat-content">

              <div className="sp-stat-label">
                Pending
              </div>

              <div className="sp-stat-value">
                {pendingTasks}
              </div>

              <div className="sp-stat-help">
                Tasks remaining
              </div>

            </div>

          </div>


          <div className="sp-stat-card">

            <div className="sp-stat-icon blue">
              %
            </div>

            <div className="sp-stat-content">

              <div className="sp-stat-label">
                Progress
              </div>

              <div className="sp-stat-value">
                {progress}%
              </div>

              <div className="sp-stat-help">
                Overall completion
              </div>

            </div>

          </div>

        </section>


        {/* =================================================
            TODAY'S PLAN
        ================================================= */}

        <section className="sp-today-card">

          <div className="sp-today-content">

            <h2 className="sp-today-title">
              📅 Today's Plan
            </h2>

            <p className="sp-today-text">
              {todayCompleted} of{" "}
              {todayTasks.length}{" "}
              today's tasks completed.
            </p>

          </div>

          <div className="sp-today-progress">
            {todayProgress}%
          </div>

        </section>


        {/* =================================================
            FILTERS
        ================================================= */}

        <section className="sp-filter-card">

          <div className="sp-input-wrap">

            <span className="sp-search-icon">
              ⌕
            </span>

            <input
              className="sp-input"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search tasks..."
            />

          </div>


          <select
            className="sp-select"
            value={view}
            onChange={(event) =>
              setView(event.target.value)
            }
          >
            <option value="today">
              Today's Plan
            </option>

            <option value="all">
              All Tasks
            </option>
          </select>


          <select
            className="sp-select"
            value={subjectFilter}
            onChange={(event) =>
              setSubjectFilter(
                event.target.value
              )
            }
          >

            <option value="all">
              All Subjects
            </option>

            {subjectOptions.map(
              (subject) => (
                <option
                  key={subject}
                  value={subject}
                >
                  {subject}
                </option>
              )
            )}

          </select>


          <select
            className="sp-select"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value
              )
            }
          >

            <option value="all">
              All Status
            </option>

            <option value="pending">
              Pending
            </option>

            <option value="completed">
              Completed
            </option>

          </select>

        </section>


        {/* =================================================
            TASKS
        ================================================= */}

        <section className="sp-task-section">

          <div className="sp-section-heading">

            <div>

              <h2 className="sp-section-title">
                Study Tasks
              </h2>

              <p className="sp-section-count">
                {filteredTasks.length}{" "}
                {filteredTasks.length === 1
                  ? "task"
                  : "tasks"}{" "}
                shown
              </p>

            </div>

          </div>


          {/* LOADING */}

          {loading && (

            <div className="sp-loading">
              ⏳ Loading your study plan...
            </div>

          )}


          {/* EMPTY */}

          {!loading &&
            filteredTasks.length === 0 && (

              <div className="sp-empty">

                <div className="sp-empty-icon">
                  📭
                </div>

                <div className="sp-empty-title">
                  {emptyText}
                </div>

                <p className="sp-empty-text">
                  Create a study task to start
                  building your plan.
                </p>

                <button
                  type="button"
                  className="sp-secondary-btn"
                  onClick={() =>
                    setShowCreate(true)
                  }
                >
                  + Create Task
                </button>

              </div>

            )}


          {/* TASK LIST */}

          {!loading &&
            filteredTasks.length > 0 && (

              <div className="sp-task-list">

                {filteredTasks.map((task) => {

                  const id =
                    task._id || task.id;

                  return (

                    <div
                      key={id}
                      className="sp-task-item"
                    >

                      {/* CHECKBOX */}

                      <button
                        type="button"
                        className={`sp-task-check ${
                          task.completed
                            ? "completed"
                            : ""
                        }`}
                        onClick={() =>
                          toggleTask(task)
                        }
                        aria-label={
                          task.completed
                            ? "Mark task pending"
                            : "Mark task complete"
                        }
                      >
                        {task.completed
                          ? "✓"
                          : ""}
                      </button>


                      {/* TASK INFO */}

                      <div className="sp-task-main">

                        <div
                          className={`sp-task-title ${
                            task.completed
                              ? "completed"
                              : ""
                          }`}
                        >
                          {task.title}
                        </div>

                        <div className="sp-task-time">
                          ◷{" "}
                          {task.time ||
                            "Time not set"}
                        </div>

                      </div>


                      {/* SUBJECT */}

                      <span className="sp-task-subject">
                        {task.subject ||
                          "General"}
                      </span>


                      {/* STATUS */}

                      <span
                        className={`sp-task-status ${
                          task.completed
                            ? "completed"
                            : "pending"
                        }`}
                      >
                        {task.completed
                          ? "Completed"
                          : "Pending"}
                      </span>


                      {/* DELETE */}

                      <button
                        type="button"
                        className="sp-delete-btn"
                        onClick={() =>
                          deleteTask(task)
                        }
                        aria-label="Delete task"
                        title="Delete task"
                      >
                        🗑
                      </button>

                    </div>

                  );

                })}

              </div>

            )}

        </section>

      </main>


      {/* =================================================
          CREATE MODAL
      ================================================= */}

      {showCreate && (

        <div
          className="sp-modal-overlay"
          role="dialog"
          aria-modal="true"
        >

          <form
            className="sp-modal"
            onSubmit={createStudyTask}
          >

            <div className="sp-modal-header">

              <div>

                <h2 className="sp-modal-title">
                  📅 Create Study Task
                </h2>

                <p className="sp-modal-subtitle">
                  Add a new task to your study plan.
                </p>

              </div>


              <button
                type="button"
                className="sp-close-btn"
                onClick={() =>
                  setShowCreate(false)
                }
                aria-label="Close"
              >
                ×
              </button>

            </div>


            {/* TITLE */}

            <div className="sp-form-group">

              <label className="sp-form-label">
                Task Title
              </label>

              <input
                className="sp-form-input"
                value={form.title}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    title:
                      event.target.value,
                  }))
                }
                placeholder="e.g. Python Functions"
              />

            </div>


            {/* SUBJECT */}

            <div className="sp-form-group">

              <label className="sp-form-label">
                Subject
              </label>

              <select
                className="sp-form-select"
                value={form.subject}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    subject:
                      event.target.value,
                  }))
                }
              >

                {subjectOptions.map(
                  (subject) => (
                    <option
                      key={subject}
                      value={subject}
                    >
                      {subject}
                    </option>
                  )
                )}

              </select>

            </div>


            {/* TIME */}

            <div className="sp-form-group">

              <label className="sp-form-label">
                Study Time
              </label>

              <input
                className="sp-form-input"
                value={form.time}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    time:
                      event.target.value,
                  }))
                }
                placeholder="e.g. 7:00 PM - 8:00 PM"
              />

            </div>


            {/* DATE */}

            <div className="sp-form-group">

              <label className="sp-form-label">
                Date
              </label>

              <input
                className="sp-form-input"
                type="date"
                value={form.date}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    date:
                      event.target.value,
                  }))
                }
              />

            </div>


            {/* SUBMIT */}

            <button
              type="submit"
              className="sp-modal-submit"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : "Create Study Task"}
            </button>

          </form>

        </div>

      )}

    </>
  );
}


// =====================================================
// EXPORT
// =====================================================

export default StudyPlanPage;