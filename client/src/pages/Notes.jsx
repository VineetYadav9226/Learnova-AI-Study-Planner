import { useEffect, useMemo, useState } from "react";

// =====================================================
// LEARNOVA AI - NOTES
// =====================================================
//
// IMPORTANT:
// Subjects are NOT hard-coded here.
//
// Current subjects come ONLY from:
// user-specific localStorage -> "learnova_subjects_<USER_ID>"
//
// Therefore:
// - Old subjects will not appear in dropdowns.
// - Old subjects will not appear in subject filters.
// - Old notes belonging to deleted subjects are hidden.
// - Adding/deleting a subject on Subjects page updates Notes.
// =====================================================

const SUBJECTS_STORAGE_BASE_KEY = "learnova_subjects";
const NOTES_STORAGE_BASE_KEY = "learnova_notes";



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
// GET CURRENT SUBJECTS
// =====================================================

const getCurrentSubjects = () => {
  try {
    const storageKey =
      getUserStorageKey(
        SUBJECTS_STORAGE_BASE_KEY
      );

    if (!storageKey) {
      return [];
    }

    const saved = localStorage.getItem(
      storageKey
    );

    if (!saved) {
      return [];
    }

    const parsed = JSON.parse(saved);

    if (!Array.isArray(parsed)) {
      return [];
    }

    const names = parsed
      .map((subject) =>
        String(subject?.name || "").trim()
      )
      .filter(Boolean);

    // Remove duplicate subject names.
    return names.filter(
      (name, index, array) =>
        index ===
        array.findIndex(
          (item) =>
            item.toLowerCase() ===
            name.toLowerCase()
        )
    );
  } catch (error) {
    console.error(
      "Unable to load current subjects:",
      error
    );

    return [];
  }
};


// =====================================================
// CREATE ID
// =====================================================

const createId = () =>
  `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;


// =====================================================
// LOAD NOTES
// =====================================================

const getInitialNotes = () => {
  try {
    const storageKey =
      getUserStorageKey(
        NOTES_STORAGE_BASE_KEY
      );

    if (!storageKey) {
      return [];
    }

    const saved = localStorage.getItem(
      storageKey
    );

    if (!saved) {
      return [];
    }

    const parsed = JSON.parse(saved);

    return Array.isArray(parsed)
      ? parsed
      : [];
  } catch (error) {
    console.error(
      "Notes loading error:",
      error
    );

    return [];
  }
};


// =====================================================
// NOTES COMPONENT
// =====================================================

function Notes() {

  // ===================================================
  // NOTES
  // ===================================================

  const [notes, setNotes] =
    useState(getInitialNotes);


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
  // SEARCH / FILTER
  // ===================================================

  const [search, setSearch] =
    useState("");

  const [subjectFilter, setSubjectFilter] =
    useState("All");


  // ===================================================
  // EDITOR
  // ===================================================

  const [selectedNote, setSelectedNote] =
    useState(null);

  const [showEditor, setShowEditor] =
    useState(false);

  const [error, setError] =
    useState("");


  // ===================================================
  // FORM
  // ===================================================

  const [form, setForm] =
    useState({
      title: "",
      subject: "",
      content: "",
    });


  // ===================================================
  // SAVE NOTES
  // ===================================================

  useEffect(() => {
    try {
      const storageKey =
        getUserStorageKey(
          NOTES_STORAGE_BASE_KEY
        );

      if (!storageKey) {
        return;
      }

      localStorage.setItem(
        storageKey,
        JSON.stringify(notes)
      );
    } catch (error) {
      console.error(
        "Notes saving error:",
        error
      );
    }
  }, [notes]);


  // ===================================================
  // SYNC CURRENT SUBJECTS
  // ===================================================
  //
  // Subjects page uses:
  // localStorage -> learnova_subjects
  //
  // We refresh when:
  // 1. Subjects are changed in another tab
  // 2. User returns to Notes
  // 3. Subjects page dispatches our custom event
  // ===================================================

  useEffect(() => {

    const syncSubjects = () => {
      const nextSubjects =
        getCurrentSubjects();

      setCurrentSubjects(
        nextSubjects
      );
    };

    const syncUserData = () => {
      setCurrentSubjects(
        getCurrentSubjects()
      );
      setNotes(
        getInitialNotes()
      );
      setSubjectFilter("All");
      setSelectedNote(null);
      setShowEditor(false);
    };


    window.addEventListener(
      "storage",
      syncSubjects
    );

    window.addEventListener(
      "focus",
      syncSubjects
    );

    window.addEventListener(
      "learnova:subjects-updated",
      syncSubjects
    );

    window.addEventListener(
      "learnova:user-updated",
      syncUserData
    );

    window.addEventListener(
      "learnova:auth-changed",
      syncUserData
    );


    return () => {

      window.removeEventListener(
        "storage",
        syncSubjects
      );

      window.removeEventListener(
        "focus",
        syncSubjects
      );

      window.removeEventListener(
        "learnova:subjects-updated",
        syncSubjects
      );

    };

  }, []);


  // ===================================================
  // KEEP FILTER VALID
  // ===================================================
  //
  // If user deletes the currently selected subject,
  // automatically return to "All".
  // ===================================================

  useEffect(() => {

    if (
      subjectFilter !== "All" &&
      !currentSubjects.some(
        (subject) =>
          subject.toLowerCase() ===
          subjectFilter.toLowerCase()
      )
    ) {
      const timerId =
        window.setTimeout(() => {
          setSubjectFilter("All");
        }, 0);

      return () =>
        window.clearTimeout(timerId);
    }

    return undefined;

  }, [
    currentSubjects,
    subjectFilter,
  ]);


  // ===================================================
  // CURRENT NOTES ONLY
  // ===================================================
  //
  // Old notes can still exist in localStorage.
  // They are intentionally hidden when their subject
  // is no longer present in the current Subjects page.
  // ===================================================

  const currentNotes = useMemo(() => {

    return notes.filter((note) => {

      const noteSubject =
        String(
          note?.subject || ""
        ).trim();

      if (!noteSubject) {
        return false;
      }

      return currentSubjects.some(
        (subject) =>
          subject.toLowerCase() ===
          noteSubject.toLowerCase()
      );

    });

  }, [
    notes,
    currentSubjects,
  ]);


  // ===================================================
  // FILTERED NOTES
  // ===================================================

  const filteredNotes = useMemo(() => {

    const query =
      search.trim().toLowerCase();

    return currentNotes
      .filter((note) => {

        const title =
          String(
            note?.title || ""
          ).toLowerCase();

        const content =
          String(
            note?.content || ""
          ).toLowerCase();

        const noteSubject =
          String(
            note?.subject || ""
          ).toLowerCase();

        const matchesSubject =
          subjectFilter === "All" ||
          noteSubject ===
            subjectFilter.toLowerCase();

        const matchesSearch =
          !query ||
          title.includes(query) ||
          content.includes(query) ||
          noteSubject.includes(query);

        return (
          matchesSubject &&
          matchesSearch
        );
      })
      .sort(
        (a, b) =>
          new Date(
            b?.updatedAt ||
              b?.createdAt ||
              0
          ) -
          new Date(
            a?.updatedAt ||
              a?.createdAt ||
              0
          )
      );

  }, [
    currentNotes,
    search,
    subjectFilter,
  ]);


  // ===================================================
  // CURRENT SUBJECT STATS
  // ===================================================

  const subjectCount =
    new Set(
      currentNotes
        .map((note) =>
          String(
            note?.subject || ""
          )
            .trim()
            .toLowerCase()
        )
        .filter(Boolean)
    ).size;


  // ===================================================
  // CREATE NOTE
  // ===================================================

  const openCreate = () => {

    setError("");

    setForm({
      title: "",
      subject:
        currentSubjects[0] || "",
      content: "",
    });

    setSelectedNote(null);
    setShowEditor(true);

  };


  // ===================================================
  // EDIT NOTE
  // ===================================================

  const openEdit = (note) => {

    setError("");

    setForm({
      title:
        note?.title || "",

      subject:
        note?.subject || "",

      content:
        note?.content || "",
    });

    setSelectedNote(note);
    setShowEditor(true);

  };


  // ===================================================
  // CLOSE EDITOR
  // ===================================================

  const closeEditor = () => {

    setShowEditor(false);
    setSelectedNote(null);
    setError("");

  };


  // ===================================================
  // FORM CHANGE
  // ===================================================

  const handleChange = (event) => {

    const {
      name,
      value,
    } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

  };


  // ===================================================
  // SAVE NOTE
  // ===================================================

  const saveNote = (event) => {

    event.preventDefault();

    const title =
      form.title.trim();

    const content =
      form.content.trim();

    const subject =
      form.subject.trim();


    if (!title) {
      setError(
        "Please enter a note title."
      );
      return;
    }


    if (!subject) {
      setError(
        "Please select a current subject."
      );
      return;
    }


    // IMPORTANT:
    // Do not allow an old/deleted subject to
    // be saved into a new note.
    const subjectStillExists =
      currentSubjects.some(
        (currentSubject) =>
          currentSubject.toLowerCase() ===
          subject.toLowerCase()
      );


    if (!subjectStillExists) {
      setError(
        "This subject is no longer available. Please select a current subject."
      );
      return;
    }


    if (!content) {
      setError(
        "Please write some note content."
      );
      return;
    }


    const now =
      new Date().toISOString();


    // =================================================
    // UPDATE
    // =================================================

    if (selectedNote) {

      setNotes((current) =>
        current.map((note) => {

          if (
            note.id !==
            selectedNote.id
          ) {
            return note;
          }

          return {
            ...note,
            title,
            subject:
              currentSubjects.find(
                (currentSubject) =>
                  currentSubject.toLowerCase() ===
                  subject.toLowerCase()
              ) || subject,
            content,
            updatedAt: now,
          };

        })
      );

    }

    // =================================================
    // CREATE
    // =================================================

    else {

      setNotes((current) => [

        {
          id: createId(),
          title,

          subject:
            currentSubjects.find(
              (currentSubject) =>
                currentSubject.toLowerCase() ===
                subject.toLowerCase()
            ) || subject,

          content,

          createdAt: now,
          updatedAt: now,
        },

        ...current,

      ]);

    }


    closeEditor();

  };


  // ===================================================
  // DELETE NOTE
  // ===================================================

  const deleteNote = (note) => {

    const confirmed =
      window.confirm(
        `Delete "${note.title}"?`
      );

    if (!confirmed) {
      return;
    }


    setNotes((current) =>
      current.filter(
        (item) =>
          item.id !== note.id
      )
    );


    if (
      selectedNote?.id ===
      note.id
    ) {
      closeEditor();
    }

  };


  // ===================================================
  // FORMAT DATE
  // ===================================================

  const formatDate = (value) => {

    if (!value) {
      return "";
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "";
    }

    return date.toLocaleDateString(
      "en-IN",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );

  };


  // ===================================================
  // UI
  // ===================================================

  return (

    <main className="notes-page">

      <div className="notes-container">


        {/* =================================================
           HEADER
           ================================================= */}

        <div className="notes-header">

          <div>

            <p className="notes-brand">
              📝 LEARNOVA NOTES
            </p>

            <h1>
              Your Study Notes
            </h1>

            <p className="notes-subtitle">
              Create, organize and revise
              your notes in one place.
            </p>

          </div>


          <button
            type="button"
            className="new-note-btn"
            onClick={openCreate}
            disabled={
              currentSubjects.length === 0
            }
          >
            + New Note
          </button>

        </div>


        {/* =================================================
           STATS
           ================================================= */}

        <section className="notes-stats">

          <div className="note-stat-card">

            <div className="note-stat-icon">
              📚
            </div>

            <div className="note-stat-label">
              Current Notes
            </div>

            <strong>
              {currentNotes.length}
            </strong>

          </div>


          <div className="note-stat-card">

            <div className="note-stat-icon">
              🎯
            </div>

            <div className="note-stat-label">
              Current Subjects
            </div>

            <strong>
              {currentSubjects.length}
            </strong>

          </div>


          <div className="note-stat-card">

            <div className="note-stat-icon">
              🗂️
            </div>

            <div className="note-stat-label">
              Subjects Covered
            </div>

            <strong>
              {subjectCount}
            </strong>

          </div>

        </section>


        {/* =================================================
           SEARCH
           ================================================= */}

        <section className="notes-search-card">

          <div className="notes-search-row">

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="🔎 Search current notes..."
              aria-label="Search notes"
            />


            <select
              value={subjectFilter}
              onChange={(event) =>
                setSubjectFilter(
                  event.target.value
                )
              }
              aria-label="Filter notes by current subject"
            >

              <option value="All">
                All Current Subjects
              </option>


              {currentSubjects.map(
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

        </section>


        {/* =================================================
           ERROR
           ================================================= */}

        {error && (
          <div className="notes-error">
            {error}
          </div>
        )}


        {/* =================================================
           NO CURRENT SUBJECTS
           ================================================= */}

        {currentSubjects.length === 0 ? (

          <section className="empty-notes">

            <div className="empty-notes-icon">
              📚
            </div>

            <h2>
              No current subjects
            </h2>

            <p>
              Add a subject from the Subjects
              page first. Notes will use only
              your current subjects.
            </p>

          </section>

        ) : filteredNotes.length === 0 ? (

          <section className="empty-notes">

            <div className="empty-notes-icon">
              📝
            </div>

            <h2>
              {currentNotes.length === 0
                ? "No notes for current subjects"
                : "No matching notes"}
            </h2>

            <p>
              {currentNotes.length === 0
                ? "Create a note using one of your current subjects."
                : "Try another search term or current subject filter."}
            </p>


            {currentSubjects.length > 0 && (
              <button
                type="button"
                className="create-first-note-btn"
                onClick={openCreate}
              >
                Create Note
              </button>
            )}

          </section>

        ) : (

          <section className="notes-grid">

            {filteredNotes.map(
              (note) => (

                <article
                  className="note-card"
                  key={note.id}
                >

                  <div className="note-card-top">

                    <span className="note-subject">
                      {note.subject}
                    </span>

                    <span className="note-date">
                      {formatDate(
                        note.updatedAt ||
                          note.createdAt
                      )}
                    </span>

                  </div>


                  <h3>
                    {note.title}
                  </h3>


                  <p className="note-content-preview">
                    {String(
                      note.content || ""
                    ).length > 160
                      ? `${String(
                          note.content || ""
                        ).slice(0, 160)}...`
                      : note.content}
                  </p>


                  <div className="note-card-actions">

                    <button
                      type="button"
                      className="note-edit-btn"
                      onClick={() =>
                        openEdit(note)
                      }
                    >
                      Edit
                    </button>


                    <button
                      type="button"
                      className="note-delete-btn"
                      onClick={() =>
                        deleteNote(note)
                      }
                    >
                      Delete
                    </button>

                  </div>

                </article>

              )
            )}

          </section>

        )}

      </div>


      {/* ===================================================
         EDITOR MODAL
         =================================================== */}

      {showEditor && (

        <div
          className="notes-modal-overlay"
          onClick={closeEditor}
        >

          <form
            className="notes-editor-modal"
            onSubmit={saveNote}
            onClick={(event) =>
              event.stopPropagation()
            }
          >


            <div className="notes-modal-header">

              <div>

                <h2>
                  {selectedNote
                    ? "Edit Note"
                    : "Create New Note"}
                </h2>

                <p>
                  Keep your important study
                  concepts organized.
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


            <label htmlFor="note-title">
              Title
            </label>

            <input
              id="note-title"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="e.g. Python Functions"
              autoFocus
            />


            <label htmlFor="note-subject">
              Current Subject
            </label>

            <select
              id="note-subject"
              name="subject"
              value={form.subject}
              onChange={handleChange}
              required
            >

              {currentSubjects.length ===
              0 ? (

                <option value="">
                  No subjects available
                </option>

              ) : (

                currentSubjects.map(
                  (subject) => (

                    <option
                      key={subject}
                      value={subject}
                    >
                      {subject}
                    </option>

                  )
                )

              )}

            </select>


            <label htmlFor="note-content">
              Note Content
            </label>

            <textarea
              id="note-content"
              name="content"
              value={form.content}
              onChange={handleChange}
              placeholder="Write your study notes here..."
              rows={10}
            />


            {error && (
              <div className="notes-form-error">
                {error}
              </div>
            )}


            <div className="notes-modal-actions">

              <button
                type="button"
                className="notes-cancel-btn"
                onClick={closeEditor}
              >
                Cancel
              </button>


              <button
                type="submit"
                className="notes-save-btn"
                disabled={
                  currentSubjects.length === 0
                }
              >
                {selectedNote
                  ? "Update Note"
                  : "Save Note"}
              </button>

            </div>

          </form>

        </div>

      )}


      {/* ===================================================
         STYLES
         =================================================== */}

      <style>{`

        .notes-page {
          min-height: 100vh;
          box-sizing: border-box;
          padding: 36px 44px 70px;
          background: #f7f8fc;
          color: #13213f;
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

        .new-note-btn:hover:not(:disabled),
        .create-first-note-btn:hover,
        .notes-save-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          background: #5b4ae8;
        }

        .new-note-btn:disabled,
        .notes-save-btn:disabled {
          opacity: .55;
          cursor: not-allowed;
          box-shadow: none;
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
          transition: .2s ease;
        }

        .notes-search-row input {
          flex: 1 1 280px;
          min-height: 48px;
          padding: 12px 15px;
        }

        .notes-search-row select {
          min-width: 210px;
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
          transition: .2s ease;
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