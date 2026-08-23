import { useEffect, useMemo, useState } from "react";

const SUBJECTS = ["All", "Python", "AI", "SPM", "DBMS", "DSA", "OS"];
const STORAGE_KEY = "learnova_notes";
const createId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const getInitialNotes = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];

    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Notes loading error:", error);
    return [];
  }
};

function Notes() {
  const [notes, setNotes] = useState(getInitialNotes);
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("All");
  const [selectedNote, setSelectedNote] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    title: "",
    subject: "Python",
    content: "",
  });

  // Save notes.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    } catch (error) {
      console.error("Notes saving error:", error);
    }
  }, [notes]);

 const filteredNotes = useMemo(() => {
    const query = search.trim().toLowerCase();

    return notes
      .filter((note) => {
        const title = String(note.title || "").toLowerCase();
        const content = String(note.content || "").toLowerCase();

        const matchesSubject =
          subjectFilter === "All" ||
          note.subject === subjectFilter;

        const matchesSearch =
          !query ||
          title.includes(query) ||
          content.includes(query);

        return matchesSubject && matchesSearch;
      })
      .sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt) -
          new Date(a.updatedAt || a.createdAt)
      );
  }, [notes, search, subjectFilter]);

  const openCreate = () => {
    setError("");
    setForm({
      title: "",
      subject: "Python",
      content: "",
    });
    setSelectedNote(null);
    setShowEditor(true);
  };

  const openEdit = (note) => {
    setError("");
    setForm({
      title: note.title || "",
      subject: note.subject || "Python",
      content: note.content || "",
    });
    setSelectedNote(note);
    setShowEditor(true);
  };

  const closeEditor = () => {
    setShowEditor(false);
    setSelectedNote(null);
    setError("");
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const saveNote = (event) => {
    event.preventDefault();

    const title = form.title.trim();
    const content = form.content.trim();

    if (!title) {
      setError("Please enter a note title.");
      return;
    }

    if (!content) {
      setError("Please write some note content.");
      return;
    }

    const now = new Date().toISOString();

    if (selectedNote) {
      setNotes((current) =>
        current.map((note) =>
          note.id === selectedNote.id
            ? {
                ...note,
                title,
                subject: form.subject,
                content,
                updatedAt: now,
              }
            : note
        )
      );
    } else {
      setNotes((current) => [
        {
          id: createId(),
          title,
          subject: form.subject,
          content,
          createdAt: now,
          updatedAt: now,
        },
        ...current,
      ]);
    }

    closeEditor();
  };

  const deleteNote = (note) => {
    const confirmed = window.confirm(`Delete "${note.title}"?`);

    if (!confirmed) return;

    setNotes((current) =>
      current.filter((item) => item.id !== note.id)
    );

    if (selectedNote?.id === note.id) {
      closeEditor();
    }
  };

  const formatDate = (value) => {
    if (!value) return "";

    return new Date(value).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <main className="notes-page">
      <div className="notes-container">
        <div className="notes-header">
          <div>
            <p className="notes-brand">📝 LEARNOVA NOTES</p>

            <h1>Your Study Notes</h1>

            <p className="notes-subtitle">
              Create, organize and revise your notes in one place.
            </p>
          </div>

          <button
            type="button"
            className="new-note-btn"
            onClick={openCreate}
          >
            + New Note
          </button>
        </div>

        <section className="notes-stats">
          <div className="note-stat-card">
            <div className="note-stat-icon">📚</div>
            <div className="note-stat-label">Total Notes</div>
            <strong>{notes.length}</strong>
          </div>

          <div className="note-stat-card">
            <div className="note-stat-icon">🐍</div>
            <div className="note-stat-label">Python Notes</div>
            <strong>
              {notes.filter((note) => note.subject === "Python").length}
            </strong>
          </div>

          <div className="note-stat-card">
            <div className="note-stat-icon">🎯</div>
            <div className="note-stat-label">Subjects Covered</div>
            <strong>
              {new Set(notes.map((note) => note.subject).filter(Boolean)).size}
            </strong>
          </div>
        </section>

        <section className="notes-search-card">
          <div className="notes-search-row">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="🔎 Search notes..."
              aria-label="Search notes"
            />

            <select
              value={subjectFilter}
              onChange={(event) => setSubjectFilter(event.target.value)}
              aria-label="Filter notes by subject"
            >
              {SUBJECTS.map((subject) => (
                <option key={subject} value={subject}>
                  {subject === "All" ? "All Subjects" : subject}
                </option>
              ))}
            </select>
          </div>
        </section>

        {error && <div className="notes-error">{error}</div>}

        {filteredNotes.length === 0 ? (
          <section className="empty-notes">
            <div className="empty-notes-icon">📝</div>

            <h2>
              {notes.length === 0 ? "No notes yet" : "No matching notes"}
            </h2>

            <p>
              {notes.length === 0
                ? "Create your first study note and start building your knowledge library."
                : "Try another search term or subject filter."}
            </p>

            {notes.length === 0 && (
              <button
                type="button"
                className="create-first-note-btn"
                onClick={openCreate}
              >
                Create First Note
              </button>
            )}
          </section>
        ) : (
          <section className="notes-grid">
            {filteredNotes.map((note) => (
              <article className="note-card" key={note.id}>
                <div className="note-card-top">
                  <span className="note-subject">{note.subject}</span>

                  <span className="note-date">
                    {formatDate(note.updatedAt || note.createdAt)}
                  </span>
                </div>

                <h3>{note.title}</h3>

                <p className="note-content-preview">
                  {note.content.length > 160
                    ? `${note.content.slice(0, 160)}...`
                    : note.content}
                </p>

                <div className="note-card-actions">
                  <button
                    type="button"
                    className="note-edit-btn"
                    onClick={() => openEdit(note)}
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    className="note-delete-btn"
                    onClick={() => deleteNote(note)}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>

      {showEditor && (
        <div className="notes-modal-overlay" onClick={closeEditor}>
          <form
            className="notes-editor-modal"
            onSubmit={saveNote}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="notes-modal-header">
              <div>
                <h2>
                  {selectedNote ? "Edit Note" : "Create New Note"}
                </h2>

                <p>
                  Keep your important study concepts organized.
                </p>
              </div>

              <button
                type="button"
                className="notes-close-btn"
                onClick={closeEditor}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <label htmlFor="note-title">Title</label>
            <input
              id="note-title"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="e.g. Python Functions"
              autoFocus
            />

            <label htmlFor="note-subject">Subject</label>
            <select
              id="note-subject"
              name="subject"
              value={form.subject}
              onChange={handleChange}
            >
              {SUBJECTS.filter((item) => item !== "All").map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>

            <label htmlFor="note-content">Note Content</label>
            <textarea
              id="note-content"
              name="content"
              value={form.content}
              onChange={handleChange}
              placeholder="Write your study notes here..."
              rows={10}
            />

            {error && <div className="notes-form-error">{error}</div>}

            <div className="notes-modal-actions">
              <button
                type="button"
                className="notes-cancel-btn"
                onClick={closeEditor}
              >
                Cancel
              </button>

              <button type="submit" className="notes-save-btn">
                {selectedNote ? "Update Note" : "Save Note"}
              </button>
            </div>
          </form>
        </div>
      )}

      <style>{`
        .notes-page {
          min-height: 100vh;
          box-sizing: border-box;
          padding: 36px 44px 70px;
          background: #f7f8fc;
          color: #13213f;
          transition: background .25s ease, color .25s ease;
        }

        .notes-container {
          width: 100%;
          max-width: 1250px;
          margin: 0 auto;
        }

        .notes-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          margin-bottom: 28px;
        }

        .notes-brand {
          margin: 0 0 8px;
          color: #6d5dfc;
          font-size: 16px;
          font-weight: 800;
          letter-spacing: .04em;
        }

        .notes-header h1 {
          margin: 0 0 8px;
          color: #13213f;
          font-size: 38px;
          line-height: 1.15;
          font-weight: 800;
        }

        .notes-subtitle {
          margin: 0;
          color: #64748b;
          font-size: 16px;
        }

        .new-note-btn,
        .create-first-note-btn,
        .notes-save-btn {
          border: none;
          border-radius: 12px;
          padding: 13px 20px;
          background: #6d5dfc;
          color: #fff;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 10px 25px rgba(109, 93, 252, .22);
          transition: .2s ease;
        }

        .new-note-btn:hover,
        .create-first-note-btn:hover,
        .notes-save-btn:hover {
          transform: translateY(-1px);
          background: #5b4ae8;
        }

        .notes-stats {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 18px;
          margin-bottom: 24px;
        }

        .note-stat-card,
        .notes-search-card,
        .empty-notes,
        .note-card {
          background: #fff;
          border: 1px solid #e8e7f3;
          box-shadow: 0 8px 25px rgba(31, 41, 55, .04);
          transition: background .25s ease, border-color .25s ease,
            color .25s ease, box-shadow .25s ease;
        }

        .note-stat-card {
          min-height: 150px;
          padding: 24px;
          border-radius: 18px;
        }

        .note-stat-icon {
          margin-bottom: 10px;
          font-size: 25px;
        }

        .note-stat-label {
          color: #64748b;
          font-size: 14px;
        }

        .note-stat-card strong {
          display: block;
          margin-top: 4px;
          color: #13213f;
          font-size: 29px;
        }

        .notes-search-card {
          margin-bottom: 24px;
          padding: 20px;
          border-radius: 18px;
        }

        .notes-search-row {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .notes-search-row input,
        .notes-search-row select,
        .notes-editor-modal input,
        .notes-editor-modal select,
        .notes-editor-modal textarea {
          box-sizing: border-box;
          outline: none;
          font: inherit;
          border: 1px solid #ddd9f4;
          border-radius: 10px;
          background: #fff;
          color: #13213f;
          transition: background .2s ease, color .2s ease,
            border-color .2s ease, box-shadow .2s ease;
        }

        .notes-search-row input {
          flex: 1 1 280px;
          min-height: 48px;
          padding: 12px 15px;
        }

        .notes-search-row select {
          min-width: 160px;
          min-height: 48px;
          padding: 12px 15px;
        }

        .notes-search-row input:focus,
        .notes-search-row select:focus,
        .notes-editor-modal input:focus,
        .notes-editor-modal select:focus,
        .notes-editor-modal textarea:focus {
          border-color: #6d5dfc;
          box-shadow: 0 0 0 3px rgba(109, 93, 252, .12);
        }

        .notes-error,
        .notes-form-error {
          margin-bottom: 18px;
          padding: 12px 15px;
          border: 1px solid #fecdd3;
          border-radius: 10px;
          background: #fff1f2;
          color: #be123c;
        }

        .empty-notes {
          padding: 70px 30px;
          text-align: center;
          border-radius: 20px;
        }

        .empty-notes-icon {
          margin-bottom: 10px;
          font-size: 54px;
        }

        .empty-notes h2 {
          margin: 14px 0 8px;
          color: #13213f;
          font-size: 24px;
        }

        .empty-notes p {
          max-width: 650px;
          margin: 0 auto 22px;
          color: #64748b;
          line-height: 1.6;
        }

        .notes-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 18px;
        }

        .note-card {
          padding: 20px;
          border-radius: 18px;
        }

        .note-card:hover {
          transform: translateY(-3px);
        }

        .note-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .note-subject {
          display: inline-block;
          padding: 5px 9px;
          border-radius: 999px;
          background: #f0edff;
          color: #5b4ae8;
          font-size: 12px;
          font-weight: 700;
        }

        .note-date {
          color: #94a3b8;
          font-size: 12px;
        }

        .note-card h3 {
          margin: 16px 0 8px;
          color: #13213f;
          font-size: 19px;
        }

        .note-content-preview {
          min-height: 76px;
          margin: 0;
          color: #64748b;
          line-height: 1.6;
          white-space: pre-wrap;
        }

        .note-card-actions {
          display: flex;
          gap: 10px;
          margin-top: 18px;
        }

        .note-edit-btn,
        .note-delete-btn,
        .notes-cancel-btn {
          border-radius: 9px;
          padding: 10px 14px;
          font-weight: 700;
          cursor: pointer;
        }

        .note-edit-btn {
          flex: 1;
          border: 1px solid #ddd9f4;
          background: #fff;
          color: #5b4ae8;
        }

        .note-delete-btn {
          border: 1px solid #fecdd3;
          background: #fff1f2;
          color: #be123c;
        }

        .notes-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: rgba(15, 23, 42, .58);
          backdrop-filter: blur(4px);
        }

        .notes-editor-modal {
          width: min(700px, 100%);
          max-height: 92vh;
          overflow-y: auto;
          padding: 26px;
          box-sizing: border-box;
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 20px;
          color: #13213f;
          box-shadow: 0 25px 70px rgba(15, 23, 42, .25);
        }

        .notes-modal-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 20px;
        }

        .notes-modal-header h2 {
          margin: 0;
          color: #13213f;
        }

        .notes-modal-header p {
          margin: 6px 0 0;
          color: #64748b;
          font-size: 14px;
        }

        .notes-close-btn {
          width: 36px;
          height: 36px;
          border: none;
          border-radius: 50%;
          background: #f1f5f9;
          color: #334155;
          font-size: 21px;
          cursor: pointer;
        }

        .notes-editor-modal label {
          display: block;
          margin: 0 0 7px;
          color: #13213f;
          font-weight: 600;
        }

        .notes-editor-modal input,
        .notes-editor-modal select,
        .notes-editor-modal textarea {
          width: 100%;
          padding: 13px;
          margin-bottom: 16px;
        }

        .notes-editor-modal textarea {
          resize: vertical;
          line-height: 1.6;
        }

        .notes-modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 4px;
        }

        .notes-cancel-btn {
          border: 1px solid #ddd9f4;
          background: #fff;
          color: #475569;
        }

        @media (max-width: 900px) {
          .notes-page {
            padding: 28px 24px 60px;
          }

          .notes-stats {
            grid-template-columns: 1fr;
          }

          .notes-header {
            align-items: flex-start;
            flex-direction: column;
          }

          .new-note-btn {
            width: 100%;
          }
        }

        @media (max-width: 600px) {
          .notes-page {
            padding: 20px 16px 50px;
          }

          .notes-header h1 {
            font-size: 30px;
          }

          .notes-search-row {
            flex-direction: column;
          }

          .notes-search-row input,
          .notes-search-row select {
            width: 100%;
          }

          .notes-editor-modal {
            padding: 20px;
          }
        }
      `}</style>
    </main>
  );
}

export default Notes;