import { useEffect, useMemo, useState } from "react";
import {
  FiBookOpen,
  FiPlus,
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiX,
  FiCheck,
} from "react-icons/fi";

const STORAGE_KEY = "learnova_subjects";

const DEFAULT_SUBJECTS = [
  {
    id: "python",
    name: "Python",
    description: "Programming fundamentals and Python development.",
    progress: 72,
    color: "#635bff",
  },
  {
    id: "ai",
    name: "Artificial Intelligence",
    description: "AI concepts, agents and intelligent systems.",
    progress: 58,
    color: "#0ea5e9",
  },
  {
    id: "dbms",
    name: "DBMS",
    description: "Database management systems and SQL.",
    progress: 64,
    color: "#10b981",
  },
  {
    id: "dsa",
    name: "Data Structures",
    description: "Algorithms and fundamental data structures.",
    progress: 48,
    color: "#f59e0b",
  },
  {
    id: "spm",
    name: "Software Project Management",
    description: "Project planning, estimation and evaluation.",
    progress: 55,
    color: "#ec4899",
  },
  {
    id: "os",
    name: "Operating System",
    description: "Processes, memory, scheduling and OS concepts.",
    progress: 42,
    color: "#8b5cf6",
  },
];

const COLORS = [
  "#635bff",
  "#0ea5e9",
  "#10b981",
  "#f59e0b",
  "#ec4899",
  "#8b5cf6",
];

function Subjects() {
  const [subjects, setSubjects] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (saved) {
        const parsed = JSON.parse(saved);

        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (error) {
      console.error("Subjects loading error:", error);
    }

    return DEFAULT_SUBJECTS;
  });

  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    progress: 0,
    color: COLORS[0],
  });

  /* ================================
     SAVE TO LOCAL STORAGE
  ================================= */

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(subjects)
      );
    } catch (error) {
      console.error("Subjects save error:", error);
    }
  }, [subjects]);

  /* ================================
     SEARCH
  ================================= */

  const filteredSubjects = useMemo(() => {
    const query = search.toLowerCase().trim();

    if (!query) {
      return subjects;
    }

    return subjects.filter((subject) =>
      `${subject.name} ${subject.description}`
        .toLowerCase()
        .includes(query)
    );
  }, [subjects, search]);

  /* ================================
     STATISTICS
  ================================= */

  const averageProgress =
    subjects.length === 0
      ? 0
      : Math.round(
          subjects.reduce(
            (total, subject) =>
              total + Number(subject.progress || 0),
            0
          ) / subjects.length
        );

  const completedSubjects = subjects.filter(
    (subject) => Number(subject.progress || 0) >= 100
  ).length;

  /* ================================
     CREATE MODAL
  ================================= */

  const openCreateModal = () => {
    setEditingSubject(null);

    setForm({
      name: "",
      description: "",
      progress: 0,
      color: COLORS[subjects.length % COLORS.length],
    });

    setShowModal(true);
  };

  /* ================================
     EDIT MODAL
  ================================= */

  const openEditModal = (subject) => {
    setEditingSubject(subject);

    setForm({
      name: subject.name || "",
      description: subject.description || "",
      progress: Number(subject.progress || 0),
      color: subject.color || COLORS[0],
    });

    setShowModal(true);
  };

  /* ================================
     CLOSE MODAL
  ================================= */

  const closeModal = () => {
    setShowModal(false);
    setEditingSubject(null);

    setForm({
      name: "",
      description: "",
      progress: 0,
      color: COLORS[0],
    });
  };

  /* ================================
     FORM CHANGE
  ================================= */

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  /* ================================
     SAVE SUBJECT
  ================================= */

  const handleSubmit = (event) => {
    event.preventDefault();

    const subjectName = form.name.trim();

    if (!subjectName) {
      alert("Please enter a subject name.");
      return;
    }

    const progress = Math.min(
      100,
      Math.max(0, Number(form.progress) || 0)
    );

    if (editingSubject) {
      setSubjects((previous) =>
        previous.map((subject) =>
          subject.id === editingSubject.id
            ? {
                ...subject,
                name: subjectName,
                description: form.description.trim(),
                progress,
                color: form.color,
              }
            : subject
        )
      );
    } else {
      const newSubject = {
        id: Date.now().toString(),
        name: subjectName,
        description: form.description.trim(),
        progress,
        color: form.color,
      };

      setSubjects((previous) => [
        newSubject,
        ...previous,
      ]);
    }

    closeModal();
  };

  /* ================================
     DELETE SUBJECT
  ================================= */

  const deleteSubject = (id) => {
    const subject = subjects.find(
      (item) => item.id === id
    );

    const confirmed = window.confirm(
      `Delete "${subject?.name || "this subject"}"?`
    );

    if (!confirmed) {
      return;
    }

    setSubjects((previous) =>
      previous.filter((item) => item.id !== id)
    );
  };

  /* ================================
     PROGRESS LABEL
  ================================= */

  const getProgressLabel = (progress) => {
    if (progress >= 100) return "Completed";
    if (progress >= 80) return "Excellent";
    if (progress >= 60) return "Good";
    if (progress >= 40) return "In Progress";

    return "Needs Focus";
  };

  return (
    <>
      <main className="subjects-page">
        <div className="subjects-container">

          {/* ============================
              HEADER
          ============================= */}

          <section className="subjects-header">
            <div>
              <div className="subjects-label">
                <FiBookOpen />
                <span>LEARNOVA SUBJECTS</span>
              </div>

              <h1>My Subjects</h1>

              <p>
                Organize your subjects and track your
                learning progress.
              </p>
            </div>

            <button
              type="button"
              className="add-subject-button"
              onClick={openCreateModal}
            >
              <FiPlus />
              Add Subject
            </button>
          </section>

          {/* ============================
              STATISTICS
          ============================= */}

          <section className="subjects-stats">

            <div className="subject-stat-card">
              <div className="stat-icon purple">
                📚
              </div>

              <div>
                <span>Total Subjects</span>
                <strong>{subjects.length}</strong>
              </div>
            </div>

            <div className="subject-stat-card">
              <div className="stat-icon blue">
                📊
              </div>

              <div>
                <span>Average Progress</span>
                <strong>{averageProgress}%</strong>
              </div>
            </div>

            <div className="subject-stat-card">
              <div className="stat-icon green">
                <FiCheck />
              </div>

              <div>
                <span>Completed</span>
                <strong>{completedSubjects}</strong>
              </div>
            </div>

          </section>

          {/* ============================
              SEARCH
          ============================= */}

          <div className="subject-search">
            <FiSearch />

            <input
              type="text"
              placeholder="Search subjects..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />
          </div>

          {/* ============================
              SUBJECT GRID
          ============================= */}

          <section className="subjects-grid">

            {filteredSubjects.length === 0 ? (
              <div className="subjects-empty">

                <FiBookOpen size={52} />

                <h2>No subjects found</h2>

                <p>
                  Try another search or create a new
                  subject.
                </p>

                <button
                  type="button"
                  onClick={openCreateModal}
                >
                  <FiPlus />
                  Add Subject
                </button>

              </div>
            ) : (
              filteredSubjects.map((subject) => (
                <article
                  className="subject-card"
                  key={subject.id}
                >

                  {/* CARD HEADER */}

                  <div className="subject-card-header">

                    <div
                      className="subject-icon"
                      style={{
                        background: `${subject.color}18`,
                        color: subject.color,
                      }}
                    >
                      <FiBookOpen />
                    </div>

                    <div className="subject-actions">

                      <button
                        type="button"
                        className="edit-subject"
                        onClick={() =>
                          openEditModal(subject)
                        }
                        title="Edit subject"
                      >
                        <FiEdit2 />
                      </button>

                      <button
                        type="button"
                        className="delete-subject"
                        onClick={() =>
                          deleteSubject(subject.id)
                        }
                        title="Delete subject"
                      >
                        <FiTrash2 />
                      </button>

                    </div>
                  </div>

                  {/* SUBJECT NAME */}

                  <h2>{subject.name}</h2>

                  {/* DESCRIPTION */}

                  <p className="subject-description">
                    {subject.description ||
                      "No description added."}
                  </p>

                  {/* PROGRESS */}

                  <div className="progress-header">
                    <span>Progress</span>

                    <strong>
                      {subject.progress}%
                    </strong>
                  </div>

                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${subject.progress}%`,
                        background: subject.color,
                      }}
                    />
                  </div>

                  {/* FOOTER */}

                  <div className="subject-footer">

                    <span
                      style={{
                        color: subject.color,
                      }}
                    >
                      {getProgressLabel(
                        Number(subject.progress || 0)
                      )}
                    </span>

                    <span>
                      {Number(subject.progress || 0) >=
                      100
                        ? "Completed"
                        : "Keep learning"}
                    </span>

                  </div>

                </article>
              ))
            )}

          </section>
        </div>
      </main>

      {/* ================================
          ADD / EDIT MODAL
      ================================= */}

      {showModal && (
        <div
          className="subject-modal-overlay"
          onClick={closeModal}
        >
          <div
            className="subject-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="modal-title">

              <div>
                <h2>
                  {editingSubject
                    ? "Edit Subject"
                    : "Add New Subject"}
                </h2>

                <p>
                  {editingSubject
                    ? "Update your subject information."
                    : "Create a subject for your learning plan."}
                </p>
              </div>

              <button
                type="button"
                className="close-modal"
                onClick={closeModal}
              >
                <FiX />
              </button>

            </div>

            <form onSubmit={handleSubmit}>

              {/* NAME */}

              <div className="form-group">
                <label>Subject Name</label>

                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. Python"
                  required
                />
              </div>

              {/* DESCRIPTION */}

              <div className="form-group">
                <label>Description</label>

                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Describe what you are learning..."
                  rows={4}
                />
              </div>

              {/* PROGRESS */}

              <div className="form-group">

                <div className="label-row">
                  <label>Current Progress</label>

                  <strong>
                    {form.progress}%
                  </strong>
                </div>

                <input
                  type="range"
                  name="progress"
                  min="0"
                  max="100"
                  value={form.progress}
                  onChange={handleChange}
                />

              </div>

              {/* COLOR */}

              <div className="form-group">

                <label>Subject Color</label>

                <div className="color-options">

                  {COLORS.map((color) => (
                    <button
                      type="button"
                      key={color}
                      className={`color-option ${
                        form.color === color
                          ? "selected"
                          : ""
                      }`}
                      style={{
                        background: color,
                      }}
                      onClick={() =>
                        setForm((previous) => ({
                          ...previous,
                          color,
                        }))
                      }
                    >
                      {form.color === color && (
                        <FiCheck />
                      )}
                    </button>
                  ))}

                </div>

              </div>

              {/* BUTTONS */}

              <div className="modal-buttons">

                <button
                  type="button"
                  className="cancel-button"
                  onClick={closeModal}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="save-subject-button"
                >
                  <FiCheck />

                  {editingSubject
                    ? "Update Subject"
                    : "Create Subject"}
                </button>

              </div>

            </form>
          </div>
        </div>
      )}

      {/* ================================
          SUBJECTS PAGE CSS
      ================================= */}

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
          letter-spacing: 0.8px;
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
          box-shadow:
            0 10px 25px rgba(99, 91, 255, 0.2);
          transition: 0.2s ease;
        }

        .add-subject-button:hover {
          transform: translateY(-2px);
        }

        .subjects-stats {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
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
          box-shadow:
            0 7px 24px rgba(30, 40, 80, 0.045);
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
          box-shadow:
            0 0 0 3px rgba(99, 91, 255, 0.1);
        }

        .subjects-grid {
          display: grid;
          grid-template-columns:
            repeat(3, minmax(0, 1fr));
          gap: 20px;
        }

        .subject-card {
          min-width: 0;
          background: #fff;
          border: 1px solid #e5e7f0;
          border-radius: 19px;
          padding: 22px;
          box-sizing: border-box;
          box-shadow:
            0 8px 28px rgba(30, 40, 80, 0.05);
          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease;
        }

        .subject-card:hover {
          transform: translateY(-3px);
          box-shadow:
            0 14px 35px rgba(30, 40, 80, 0.09);
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
          transition: 0.2s ease;
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
          transition: width 0.3s ease;
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

        /* MODAL */

        .subject-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          padding: 20px;
          box-sizing: border-box;
          background: rgba(15, 23, 42, 0.5);
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
          box-shadow:
            0 25px 80px rgba(0, 0, 0, 0.2);
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
          box-shadow:
            0 0 0 3px rgba(99, 91, 255, 0.1);
        }

        .label-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .label-row strong {
          color: #635bff;
          font-size: 14px;
        }

        .form-group input[type="range"] {
          width: 100%;
          accent-color: #635bff;
          cursor: pointer;
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

        /* RESPONSIVE */

        @media (max-width: 1100px) {
          .subjects-page {
            padding: 30px;
          }

          .subjects-grid {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 800px) {
          .subjects-page {
            padding: 24px 18px 40px;
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