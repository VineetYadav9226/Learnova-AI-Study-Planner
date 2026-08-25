import { useEffect, useMemo, useState } from "react";
import {
  FiFolder,
  FiFileText,
  FiLink,
  FiPlus,
  FiSearch,
  FiTrash2,
  FiExternalLink,
  FiEdit3,
  FiStar,
  FiClock,
  FiX,
  FiFilter,
  FiPlayCircle,
  FiBookOpen,
} from "react-icons/fi";

// =====================================================
// USER-SPECIFIC RESOURCE STORAGE
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
      if (!value) continue;

      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === "object") {
        return parsed;
      }
    } catch {
      // Ignore invalid user data.
    }
  }

  return null;
};

const getUserIdentifier = () => {
  const user = getCurrentUser();
  if (!user) return null;

  const identifier =
    user._id ||
    user.id ||
    user.userId ||
    user.email;

  return identifier ? String(identifier) : null;
};

const getResourceStorageKey = (userId) =>
  userId
    ? `learnova_resources_${userId}`
    : "learnova_resources";

const DEFAULT_RESOURCES = [];

function Resources() {

  // =====================================================
  // LOAD RESOURCES
  // =====================================================

  const [userKey, setUserKey] = useState(() =>
    getUserIdentifier()
  );

  const loadResourcesForUser = (currentUserKey) => {
    try {
      const key = getResourceStorageKey(currentUserKey);
      const saved = localStorage.getItem(key);

      if (saved) {
        const parsed = JSON.parse(saved);

        if (Array.isArray(parsed)) {
          return parsed.map((item) => ({
            ...item,
            favorite: Boolean(item.favorite),
            note: item.note || "",
            fileName: item.fileName || "",
            fileUrl: item.fileUrl || "",
            lastOpened: item.lastOpened || null,
          }));
        }
      }

      // Migrate legacy resources once for the currently logged-in user.
      if (currentUserKey) {
        const legacy = localStorage.getItem("learnova_resources");
        if (legacy) {
          const parsedLegacy = JSON.parse(legacy);
          if (Array.isArray(parsedLegacy)) {
            const normalized = parsedLegacy.map((item) => ({
              ...item,
              favorite: Boolean(item.favorite),
              note: item.note || "",
              fileName: item.fileName || "",
              fileUrl: item.fileUrl || "",
              lastOpened: item.lastOpened || null,
            }));

            localStorage.setItem(
              key,
              JSON.stringify(normalized)
            );
            return normalized;
          }
        }
      }
    } catch (error) {
      console.error("Resource loading error:", error);
    }

    return DEFAULT_RESOURCES;
  };

  const [resources, setResources] = useState(() =>
    loadResourcesForUser(getUserIdentifier())
  );

  // =====================================================
  // STATES
  // =====================================================

  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("All Subjects");
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [showFavoritesOnly, setShowFavoritesOnly] =
    useState(false);

  const [showModal, setShowModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [noteResource, setNoteResource] = useState(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "Website",
    url: "",
    subject: "General",
    note: "",
    fileName: "",
    fileUrl: "",
  });

  const [fileError, setFileError] = useState("");

  // =====================================================
  // SAVE TO LOCAL STORAGE
  // =====================================================

  const saveResources = (updatedResources) => {
    setResources(updatedResources);

    try {
      localStorage.setItem(
        getResourceStorageKey(userKey),
        JSON.stringify(updatedResources)
      );

      window.dispatchEvent(
        new Event("learnova:resources-updated")
      );
    } catch (error) {
      console.error("Resource saving error:", error);
    }
  };

  // =====================================================
  // SYNC AFTER SUBJECT DELETE / USER CHANGE
  // =====================================================

  useEffect(() => {
    const refreshResources = () => {
      const nextUserKey = getUserIdentifier();
      setUserKey(nextUserKey);
      setResources(
        loadResourcesForUser(nextUserKey)
      );
    };

    window.addEventListener(
      "learnova:resources-updated",
      refreshResources
    );
    window.addEventListener(
      "learnova:user-updated",
      refreshResources
    );
    window.addEventListener(
      "learnova:auth-changed",
      refreshResources
    );
    window.addEventListener(
      "storage",
      refreshResources
    );

    return () => {
      window.removeEventListener(
        "learnova:resources-updated",
        refreshResources
      );
      window.removeEventListener(
        "learnova:user-updated",
        refreshResources
      );
      window.removeEventListener(
        "learnova:auth-changed",
        refreshResources
      );
      window.removeEventListener(
        "storage",
        refreshResources
      );
    };
  }, []);

  // =====================================================
  // SUBJECTS
  // =====================================================

  const subjects = useMemo(() => {
    const uniqueSubjects = resources
      .map((resource) => resource.subject)
      .filter(Boolean);

    return [...new Set(uniqueSubjects)].sort();
  }, [resources]);

  // =====================================================
  // FILTERED RESOURCES
  // =====================================================

  const filteredResources = useMemo(() => {
    const query = search.toLowerCase().trim();

    return resources.filter((resource) => {
      const searchableText = [
        resource.title,
        resource.description,
        resource.type,
        resource.subject,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !query || searchableText.includes(query);

      const matchesSubject =
        subjectFilter === "All Subjects" ||
        resource.subject === subjectFilter;

      const matchesType =
        typeFilter === "All Types" ||
        resource.type === typeFilter;

      const matchesFavorite =
        !showFavoritesOnly || resource.favorite;

      return (
        matchesSearch &&
        matchesSubject &&
        matchesType &&
        matchesFavorite
      );
    });
  }, [
    resources,
    search,
    subjectFilter,
    typeFilter,
    showFavoritesOnly,
  ]);

  // =====================================================
  // STATISTICS
  // =====================================================

  const totalResources = resources.length;

  const websiteCount = resources.filter(
    (resource) => resource.type === "Website"
  ).length;

  const noteCount = resources.filter(
    (resource) => resource.type === "Note"
  ).length;

  const favoriteCount = resources.filter(
    (resource) => resource.favorite
  ).length;

  const recentResources = [...resources]
    .filter((resource) => resource.lastOpened)
    .sort(
      (a, b) =>
        new Date(b.lastOpened) -
        new Date(a.lastOpened)
    )
    .slice(0, 3);

  // =====================================================
  // RESET FORM
  // =====================================================

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      type: "Website",
      url: "",
      subject: "General",
      note: "",
      fileName: "",
      fileUrl: "",
    });

    setFileError("");
    setEditingId(null);
  };

  // =====================================================
  // OPEN ADD MODAL
  // =====================================================

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  // =====================================================
  // OPEN EDIT MODAL
  // =====================================================

  const openEditModal = (resource) => {
    setForm({
      title: resource.title || "",
      description: resource.description || "",
      type: resource.type || "Website",
      url: resource.url || "",
      subject: resource.subject || "General",
      note: resource.note || "",
      fileName: resource.fileName || "",
      fileUrl: resource.fileUrl || "",
    });

    setFileError("");
    setEditingId(resource.id);
    setShowModal(true);
  };

  // =====================================================
  // FILE UPLOAD
  // =====================================================

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const isPdf = file.type === "application/pdf";
    const isVideo = file.type.startsWith("video/");

    if (form.type === "PDF" && !isPdf) {
      setFileError("Please select a PDF file.");
      return;
    }

    if (form.type === "Video" && !isVideo) {
      setFileError("Please select a video file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFileError("File must be smaller than 5MB.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setForm((previous) => ({
        ...previous,
        fileName: file.name,
        fileUrl:
          typeof reader.result === "string"
            ? reader.result
            : "",
      }));
      setFileError("");
    };

    reader.onerror = () => {
      setFileError("Unable to read the selected file.");
    };

    reader.readAsDataURL(file);
  };

  const clearUploadedFile = () => {
    setForm((previous) => ({
      ...previous,
      fileName: "",
      fileUrl: "",
    }));
    setFileError("");
  };

  // =====================================================
  // ADD / UPDATE RESOURCE
  // =====================================================

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!form.title.trim()) {
      alert("Please enter a resource title.");
      return;
    }

    if (
      form.url.trim() &&
      !/^https?:\/\//i.test(form.url.trim())
    ) {
      alert(
        "Please enter a valid URL starting with http:// or https://"
      );
      return;
    }

    if (
      form.type === "PDF" &&
      !form.url.trim() &&
      !form.fileUrl
    ) {
      alert("Add a PDF URL or upload a PDF file.");
      return;
    }

    if (
      form.type === "Video" &&
      !form.url.trim() &&
      !form.fileUrl
    ) {
      alert("Add a video URL or upload a video file.");
      return;
    }

    if (
      form.type === "Course" &&
      !form.url.trim()
    ) {
      alert("Please add the course URL.");
      return;
    }

    if (editingId) {
      const updatedResources = resources.map(
        (resource) => {
          if (resource.id !== editingId) {
            return resource;
          }

          return {
            ...resource,
            title: form.title.trim(),
            description: form.description.trim(),
            type: form.type,
            url: form.url.trim(),
            subject:
              form.subject.trim() || "General",
            note: form.note.trim(),
            fileName: form.fileName || "",
            fileUrl: form.fileUrl || "",
          };
        }
      );

      saveResources(updatedResources);
    } else {
      const newResource = {
        id:
          Date.now().toString() +
          Math.random().toString(36).slice(2),
        title: form.title.trim(),
        description: form.description.trim(),
        type: form.type,
        url: form.url.trim(),
        subject:
          form.subject.trim() || "General",
        note: form.note.trim(),
        fileName: form.fileName || "",
        fileUrl: form.fileUrl || "",
        favorite: false,
        lastOpened: null,
      };

      saveResources([
        newResource,
        ...resources,
      ]);
    }

    resetForm();
    setShowModal(false);
  };

  // =====================================================
  // DELETE RESOURCE
  // =====================================================

  const deleteResource = (id) => {
    const resource = resources.find(
      (item) => item.id === id
    );

    if (!resource) {
      return;
    }

    const confirmed = window.confirm(
      `Delete "${resource.title}"?`
    );

    if (!confirmed) {
      return;
    }

    saveResources(
      resources.filter(
        (item) => item.id !== id
      )
    );
  };

  // =====================================================
  // TOGGLE FAVORITE
  // =====================================================

  const toggleFavorite = (id) => {
    const updatedResources = resources.map(
      (resource) =>
        resource.id === id
          ? {
              ...resource,
              favorite: !resource.favorite,
            }
          : resource
    );

    saveResources(updatedResources);
  };

  // =====================================================
  // OPEN RESOURCE
  // =====================================================

  const openResource = (resource) => {
    const updatedResources = resources.map(
      (item) =>
        item.id === resource.id
          ? {
              ...item,
              lastOpened: new Date().toISOString(),
            }
          : item
    );

    saveResources(updatedResources);

    const target = resource.fileUrl || resource.url;

    if (!target) {
      alert("No URL or uploaded file is available for this resource.");
      return;
    }

    window.open(
      target,
      "_blank",
      "noopener,noreferrer"
    );
  };

  // =====================================================
  // OPEN NOTE MODAL
  // =====================================================

  const openNoteModal = (resource) => {
    setNoteResource(resource);
    setShowNoteModal(true);
  };

  // =====================================================
  // SAVE PERSONAL NOTE
  // =====================================================

  const savePersonalNote = () => {
    if (!noteResource) {
      return;
    }

    const updatedResources = resources.map(
      (resource) =>
        resource.id === noteResource.id
          ? {
              ...resource,
              note: noteResource.note || "",
            }
          : resource
    );

    saveResources(updatedResources);
    setShowNoteModal(false);
    setNoteResource(null);
  };

  // =====================================================
  // CLEAR FILTERS
  // =====================================================

  const clearFilters = () => {
    setSearch("");
    setSubjectFilter("All Subjects");
    setTypeFilter("All Types");
    setShowFavoritesOnly(false);
  };

  // =====================================================
  // RESOURCE ICON
  // =====================================================

  const getResourceIcon = (type) => {
    if (type === "Website") {
      return <FiLink size={22} />;
    }

    if (type === "PDF") {
      return <FiFileText size={22} />;
    }

    if (type === "Video") {
      return <FiPlayCircle size={22} />;
    }

    if (type === "Course") {
      return <FiBookOpen size={22} />;
    }

    return <FiFileText size={22} />;
  };

  // =====================================================
  // JSX
  // =====================================================

  return (
    <div className="resources-page">
      <div className="resources-container">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="resources-header">
          <div>
            <div className="resources-title-row">
              <FiFolder
                size={30}
                className="resources-title-icon"
              />

              <h1>Study Resources</h1>
            </div>

            <p>
              Keep your useful learning resources
              organized in one place.
            </p>
          </div>

          <button
            className="add-resource-btn"
            onClick={openAddModal}
          >
            <FiPlus size={18} />
            Add Resource
          </button>
        </div>

        {/* =================================================
            SEARCH + FILTER
        ================================================= */}

        <div className="search-filter-panel">
          <div className="search-wrapper">
            <FiSearch
              className="search-icon"
              size={19}
            />

            <input
              type="text"
              placeholder="Search resources..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />
          </div>

          <div className="filter-row">
            <div className="filter-box">
              <FiFilter size={16} />

              <select
                value={subjectFilter}
                onChange={(event) =>
                  setSubjectFilter(
                    event.target.value
                  )
                }
              >
                <option>
                  All Subjects
                </option>

                {subjects.map((subject) => (
                  <option
                    key={subject}
                    value={subject}
                  >
                    {subject}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-box">
              <select
                value={typeFilter}
                onChange={(event) =>
                  setTypeFilter(
                    event.target.value
                  )
                }
              >
                <option>
                  All Types
                </option>

                <option value="Website">
                  Website
                </option>

                <option value="Note">
                  Note
                </option>

                <option value="PDF">
                  PDF
                </option>

                <option value="Video">
                  Video
                </option>

                <option value="Course">
                  Course
                </option>
              </select>
            </div>

            <button
              className={
                showFavoritesOnly
                  ? "favorite-filter active"
                  : "favorite-filter"
              }
              onClick={() =>
                setShowFavoritesOnly(
                  !showFavoritesOnly
                )
              }
            >
              <FiStar
                size={16}
                fill={
                  showFavoritesOnly
                    ? "currentColor"
                    : "none"
                }
              />

              Favorites
            </button>

            {(search ||
              subjectFilter !==
                "All Subjects" ||
              typeFilter !== "All Types" ||
              showFavoritesOnly) && (
              <button
                className="clear-filter-btn"
                onClick={clearFilters}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* =================================================
            STATISTICS
        ================================================= */}

        <div className="resource-stats">

          <div className="resource-stat-card">
            <div className="stat-icon purple">
              <FiFolder size={21} />
            </div>

            <div>
              <span>Total Resources</span>
              <strong>
                {totalResources}
              </strong>
            </div>
          </div>

          <div className="resource-stat-card">
            <div className="stat-icon blue">
              <FiLink size={21} />
            </div>

            <div>
              <span>Websites</span>
              <strong>
                {websiteCount}
              </strong>
            </div>
          </div>

          <div className="resource-stat-card">
            <div className="stat-icon pink">
              <FiFileText size={21} />
            </div>

            <div>
              <span>Notes</span>
              <strong>
                {noteCount}
              </strong>
            </div>
          </div>

          <div className="resource-stat-card">
            <div className="stat-icon yellow">
              <FiStar
                size={21}
                fill="currentColor"
              />
            </div>

            <div>
              <span>Favorites</span>
              <strong>
                {favoriteCount}
              </strong>
            </div>
          </div>

        </div>

        {/* =================================================
            RECENTLY OPENED
        ================================================= */}

        {recentResources.length > 0 && (
          <div className="recent-section">
            <div className="section-heading">
              <div>
                <h2>
                  <FiClock size={19} />
                  Recently Opened
                </h2>

                <p>
                  Quickly access your recent
                  learning resources.
                </p>
              </div>
            </div>

            <div className="recent-list">
              {recentResources.map(
                (resource) => (
                  <button
                    key={resource.id}
                    className="recent-item"
                    onClick={() =>
                      openResource(resource)
                    }
                  >
                    <div className="recent-icon">
                      {getResourceIcon(
                        resource.type
                      )}
                    </div>

                    <div>
                      <strong>
                        {resource.title}
                      </strong>

                      <span>
                        {resource.subject}
                      </span>
                    </div>

                    <FiExternalLink
                      size={16}
                    />
                  </button>
                )
              )}
            </div>
          </div>
        )}

        {/* =================================================
            RESOURCE HEADER
        ================================================= */}

        <div className="resource-list-header">
          <div>
            <h2>
              Your Resources
            </h2>

            <p>
              {filteredResources.length}{" "}
              resource
              {filteredResources.length !== 1
                ? "s"
                : ""}{" "}
              found
            </p>
          </div>

          <button
            className="small-add-btn"
            onClick={openAddModal}
          >
            <FiPlus size={16} />
            Add Resource
          </button>
        </div>

        {/* =================================================
            RESOURCE GRID
        ================================================= */}

        {filteredResources.length === 0 ? (

          <div className="empty-resources">
            <FiFolder
              size={55}
              className="empty-icon"
            />

            <h2>
              No resources found
            </h2>

            <p>
              Try another search or add a
              new study resource.
            </p>

            <button
              className="empty-add-btn"
              onClick={openAddModal}
            >
              <FiPlus />
              Add Resource
            </button>
          </div>

        ) : (

          <div className="subject-resource-sections">
            {Object.entries(
              filteredResources.reduce((groups, resource) => {
                const subject =
                  String(resource.subject || "General").trim() ||
                  "General";

                if (!groups[subject]) {
                  groups[subject] = [];
                }

                groups[subject].push(resource);
                return groups;
              }, {})
            ).map(([subject, subjectResources]) => (
              <section
                className="resource-subject-section"
                key={subject}
              >
                <div className="resource-subject-heading">
                  <div>
                    <h2>📚 {subject}</h2>
                    <p>
                      {subjectResources.length} resource
                      {subjectResources.length !== 1 ? "s" : ""}
                    </p>
                  </div>

                  <span className="resource-subject-count">
                    {subjectResources.length}
                  </span>
                </div>

                <div className="resource-grid">
                  {subjectResources.map((resource) => (
                    <div
                      className="resource-card"
                      key={resource.id}
                    >

                  {/* CARD TOP */}

                  <div className="resource-card-top">

                    <div className="resource-info">

                      <div className="resource-icon-box">
                        {getResourceIcon(
                          resource.type
                        )}
                      </div>

                      <div>
                        <h3>
                          {resource.title}
                        </h3>

                        <span className="subject-badge">
                          {resource.subject}
                        </span>
                      </div>

                    </div>

                    <div className="card-actions">

                      <button
                        className={
                          resource.favorite
                            ? "icon-btn favorite active"
                            : "icon-btn favorite"
                        }
                        onClick={() =>
                          toggleFavorite(
                            resource.id
                          )
                        }
                        title={
                          resource.favorite
                            ? "Remove favorite"
                            : "Add favorite"
                        }
                      >
                        <FiStar
                          size={17}
                          fill={
                            resource.favorite
                              ? "currentColor"
                              : "none"
                          }
                        />
                      </button>

                      <button
                        className="icon-btn edit"
                        onClick={() =>
                          openEditModal(
                            resource
                          )
                        }
                        title="Edit resource"
                      >
                        <FiEdit3 size={17} />
                      </button>

                      <button
                        className="icon-btn delete"
                        onClick={() =>
                          deleteResource(
                            resource.id
                          )
                        }
                        title="Delete resource"
                      >
                        <FiTrash2 size={17} />
                      </button>

                    </div>
                  </div>

                  {/* DESCRIPTION */}

                  <p className="resource-description">
                    {resource.description ||
                      "No description added."}
                  </p>

                  {/* TYPE */}

                  <div className="resource-meta">
                    <span>
                      Type:
                      <strong>{resource.type}</strong>
                    </span>

                    {resource.platform && (
                      <span>
                        Source:
                        <strong>{resource.platform}</strong>
                      </span>
                    )}

                    {resource.aiGenerated && (
                      <span>
                        🤖 AI Recommended
                      </span>
                    )}

                    {resource.lastOpened && (
                      <span>
                        Recently opened
                      </span>
                    )}
                  </div>

                  {resource.fileName && (
                    <div className="uploaded-file-badge">
                      📎 {resource.fileName}
                    </div>
                  )}

                  {/* PERSONAL NOTE */}

                  {resource.note && (
                    <div className="personal-note-preview">
                      <FiFileText size={15} />

                      <span>
                        {resource.note.length >
                        90
                          ? `${resource.note.slice(
                              0,
                              90
                            )}...`
                          : resource.note}
                      </span>
                    </div>
                  )}

                  {/* BUTTONS */}

                  <div className="resource-buttons">

                    {resource.url || resource.fileUrl ? (
                      <button
                        className="open-resource-btn"
                        onClick={() =>
                          openResource(resource)
                        }
                      >
                        {resource.fileUrl
                          ? resource.type === "PDF"
                            ? "Open PDF"
                            : "Watch Video"
                          : resource.type === "Course"
                          ? "Open Course"
                          : "Open Resource"}
                        <FiExternalLink size={15} />
                      </button>
                    ) : (
                      <span className="no-url">
                        No URL or file added
                      </span>
                    )}

                    <button
                      className="note-btn"
                      onClick={() =>
                        openNoteModal(resource)
                      }
                    >
                      <FiFileText size={15} />

                      {resource.note
                        ? "Edit Note"
                        : "Add Note"}
                    </button>

                  </div>

                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

      </div>

      {/* =================================================
          ADD / EDIT MODAL
      ================================================= */}

      {showModal && (
        <div
          className="modal-overlay"
          onClick={() =>
            setShowModal(false)
          }
        >

          <div
            className="resource-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="modal-header">

              <div>
                <h2>
                  {editingId
                    ? "Edit Resource"
                    : "Add Study Resource"}
                </h2>

                <p>
                  {editingId
                    ? "Update your learning resource."
                    : "Save a useful resource for your studies."}
                </p>
              </div>

              <button
                className="modal-close-btn"
                type="button"
                onClick={() =>
                  setShowModal(false)
                }
              >
                <FiX size={20} />
              </button>

            </div>

            <form
              onSubmit={handleSubmit}
            >

              <label>
                Resource Title
              </label>

              <input
                className="form-input"
                type="text"
                placeholder="e.g. Python Functions Notes"
                value={form.title}
                onChange={(event) =>
                  setForm({
                    ...form,
                    title:
                      event.target.value,
                  })
                }
                required
              />

              <label>
                Description
              </label>

              <textarea
                className="form-input"
                rows="4"
                placeholder="Describe this resource..."
                value={form.description}
                onChange={(event) =>
                  setForm({
                    ...form,
                    description:
                      event.target.value,
                  })
                }
              />

              <div className="form-two-columns">

                <div>
                  <label>
                    Resource Type
                  </label>

                  <select
                    className="form-input"
                    value={form.type}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        type:
                          event.target.value,
                      })
                    }
                  >
                    <option value="Website">
                      Website
                    </option>

                    <option value="Note">
                      Note
                    </option>

                    <option value="PDF">
                      PDF
                    </option>

                    <option value="Video">
                      Video
                    </option>

                    <option value="Course">
                      Course
                    </option>
                  </select>
                </div>

                <div>
                  <label>
                    Subject
                  </label>

                  <input
                    className="form-input"
                    type="text"
                    placeholder="e.g. Python"
                    value={form.subject}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        subject:
                          event.target.value,
                      })
                    }
                  />
                </div>

              </div>

              <label>
                Resource URL
              </label>

              <input
                className="form-input"
                type="url"
                placeholder={
                  form.type === "Video"
                    ? "https://youtube.com/... or video URL"
                    : form.type === "Course"
                    ? "https://course.example.com/..."
                    : "https://example.com"
                }
                value={form.url}
                onChange={(event) =>
                  setForm({
                    ...form,
                    url: event.target.value,
                  })
                }
              />

              {(form.type === "PDF" ||
                form.type === "Video") && (
                <>
                  <div className="upload-or">
                    <span>OR</span>
                  </div>

                  <label>
                    Upload {form.type}
                  </label>

                  <div className="file-upload-box">
                    <input
                      type="file"
                      accept={
                        form.type === "PDF"
                          ? ".pdf,application/pdf"
                          : "video/*"
                      }
                      onChange={handleFileChange}
                    />

                    <div className="file-upload-content">
                      {form.type === "PDF" ? (
                        <FiFileText size={28} />
                      ) : (
                        <FiPlayCircle size={28} />
                      )}

                      <strong>
                        Choose {form.type} file
                      </strong>

                      <span>
                        Maximum file size: 5MB
                      </span>

                      {form.fileName && (
                        <div className="selected-file">
                          ✓ {form.fileName}
                          <button
                            type="button"
                            onClick={clearUploadedFile}
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {fileError && (
                    <div className="file-error">
                      {fileError}
                    </div>
                  )}
                </>
              )}

              <label>
                Personal Note
              </label>

              <textarea
                className="form-input"
                rows="3"
                placeholder="Add your own study note..."
                value={form.note}
                onChange={(event) =>
                  setForm({
                    ...form,
                    note:
                      event.target.value,
                  })
                }
              />

              <div className="modal-actions">

                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => {
                    resetForm();
                    setShowModal(false);
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="save-resource-btn"
                >
                  <FiPlus size={17} />

                  {editingId
                    ? "Save Changes"
                    : "Add Resource"}
                </button>

              </div>

            </form>

          </div>
        </div>
      )}

      {/* =================================================
          PERSONAL NOTE MODAL
      ================================================= */}

      {showNoteModal &&
        noteResource && (
          <div
            className="modal-overlay"
            onClick={() =>
              setShowNoteModal(false)
            }
          >

            <div
              className="note-modal"
              onClick={(event) =>
                event.stopPropagation()
              }
            >

              <div className="modal-header">

                <div>
                  <h2>
                    Personal Study Note
                  </h2>

                  <p>
                    {noteResource.title}
                  </p>
                </div>

                <button
                  className="modal-close-btn"
                  type="button"
                  onClick={() =>
                    setShowNoteModal(false)
                  }
                >
                  <FiX size={20} />
                </button>

              </div>

              <textarea
                className="note-textarea"
                rows="8"
                placeholder="Write something important you want to remember..."
                value={noteResource.note || ""}
                onChange={(event) =>
                  setNoteResource({
                    ...noteResource,
                    note:
                      event.target.value,
                  })
                }
              />

              <div className="modal-actions">

                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() =>
                    setShowNoteModal(false)
                  }
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="save-resource-btn"
                  onClick={
                    savePersonalNote
                  }
                >
                  Save Note
                </button>

              </div>

            </div>
          </div>
        )}

      {/* =================================================
          STYLES
      ================================================= */}

      <style>{`

        * {
          box-sizing: border-box;
        }

        .resources-page {
          min-height: 100vh;
          background: #f7f8fc;
          padding: 40px;
          color: #13213f;
        }

        .resources-container {
          max-width: 1250px;
          margin: 0 auto;
        }

        /* HEADER */

        .resources-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 25px;
          margin-bottom: 28px;
        }

        .resources-title-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .resources-title-row h1 {
          margin: 0;
          font-size: 34px;
          font-weight: 800;
          color: #13213f;
        }

        .resources-title-icon {
          color: #635bff;
        }

        .resources-header p {
          margin: 8px 0 0;
          color: #68738a;
          font-size: 16px;
        }

        .add-resource-btn {
          border: none;
          background: #635bff;
          color: white;
          padding: 14px 21px;
          border-radius: 13px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow:
            0 10px 25px
            rgba(99, 91, 255, 0.25);
          transition: 0.2s ease;
        }

        .add-resource-btn:hover {
          transform: translateY(-2px);
          box-shadow:
            0 14px 30px
            rgba(99, 91, 255, 0.32);
        }

        /* SEARCH FILTER */

        .search-filter-panel {
          background: white;
          border: 1px solid #e4e7ef;
          border-radius: 18px;
          padding: 18px;
          margin-bottom: 22px;
          box-shadow:
            0 6px 25px
            rgba(30, 40, 80, 0.04);
        }

        .search-wrapper {
          position: relative;
        }

        .search-wrapper input {
          width: 100%;
          height: 52px;
          padding: 0 18px 0 48px;
          border: 1px solid #dfe3ee;
          border-radius: 13px;
          outline: none;
          font-size: 15px;
          color: #13213f;
          background: white;
        }

        .search-wrapper input:focus {
          border-color: #635bff;
          box-shadow:
            0 0 0 3px
            rgba(99, 91, 255, 0.09);
        }

        .search-icon {
          position: absolute;
          left: 17px;
          top: 50%;
          transform: translateY(-50%);
          color: #7d89a2;
          pointer-events: none;
        }

        .filter-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 13px;
          flex-wrap: wrap;
        }

        .filter-box {
          height: 42px;
          border: 1px solid #dfe3ee;
          border-radius: 10px;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0 12px;
          background: white;
          color: #68738a;
        }

        .filter-box select {
          border: none;
          outline: none;
          color: #13213f;
          background: transparent;
          cursor: pointer;
          font-size: 14px;
        }

        .favorite-filter,
        .clear-filter-btn {
          height: 42px;
          border-radius: 10px;
          padding: 0 14px;
          display: flex;
          align-items: center;
          gap: 7px;
          cursor: pointer;
          font-weight: 600;
          font-size: 13px;
        }

        .favorite-filter {
          border: 1px solid #dfe3ee;
          background: white;
          color: #68738a;
        }

        .favorite-filter.active {
          background: #fff8dc;
          border-color: #f5d77b;
          color: #d39b00;
        }

        .clear-filter-btn {
          border: none;
          background: #f1efff;
          color: #635bff;
        }

        /* STATS */

        .resource-stats {
          display: grid;
          grid-template-columns:
            repeat(4, 1fr);
          gap: 18px;
          margin-bottom: 25px;
        }

        .resource-stat-card {
          background: white;
          border: 1px solid #e4e7ef;
          border-radius: 17px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 15px;
          box-shadow:
            0 7px 25px
            rgba(30, 40, 80, 0.04);
        }

        .resource-stat-card span {
          display: block;
          color: #68738a;
          font-size: 13px;
          margin-bottom: 5px;
        }

        .resource-stat-card strong {
          display: block;
          color: #13213f;
          font-size: 27px;
        }

        .stat-icon {
          width: 45px;
          height: 45px;
          border-radius: 13px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stat-icon.purple {
          color: #635bff;
          background: #f0edff;
        }

        .stat-icon.blue {
          color: #3182ce;
          background: #eaf5ff;
        }

        .stat-icon.pink {
          color: #ec4899;
          background: #fff0f7;
        }

        .stat-icon.yellow {
          color: #d99b00;
          background: #fff8dc;
        }

        /* RECENT */

        .recent-section {
          background: white;
          border: 1px solid #e4e7ef;
          border-radius: 18px;
          padding: 20px;
          margin-bottom: 25px;
        }

        .section-heading h2 {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0;
          font-size: 18px;
        }

        .section-heading p {
          margin: 5px 0 15px;
          color: #7b8499;
          font-size: 13px;
        }

        .recent-list {
          display: grid;
          grid-template-columns:
            repeat(3, 1fr);
          gap: 12px;
        }

        .recent-item {
          border: 1px solid #e7e9f1;
          background: #fafaff;
          border-radius: 12px;
          padding: 12px;
          display: flex;
          align-items: center;
          gap: 10px;
          text-align: left;
          cursor: pointer;
          color: #68738a;
          transition: 0.2s ease;
        }

        .recent-item:hover {
          border-color: #cfcaff;
          background: #f6f4ff;
          transform: translateY(-2px);
        }

        .recent-icon {
          width: 36px;
          height: 36px;
          background: #f0edff;
          color: #635bff;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .recent-item div:nth-child(2) {
          flex: 1;
          min-width: 0;
        }

        .recent-item strong {
          display: block;
          color: #13213f;
          font-size: 13px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .recent-item span {
          display: block;
          color: #8a94a8;
          font-size: 11px;
          margin-top: 3px;
        }

        /* LIST HEADER */

        .resource-list-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }

        .resource-list-header h2 {
          margin: 0;
          font-size: 21px;
        }

        .resource-list-header p {
          margin: 4px 0 0;
          color: #7b8499;
          font-size: 13px;
        }

        .small-add-btn {
          border: none;
          background: #eeecff;
          color: #635bff;
          padding: 9px 13px;
          border-radius: 9px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        /* GRID */

        .resource-grid {
          display: grid;
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
          gap: 20px;
        }

        /* CARD */

        .resource-card {
          background: white;
          border: 1px solid #e4e7ef;
          border-radius: 19px;
          padding: 23px;
          box-shadow:
            0 9px 28px
            rgba(30, 40, 80, 0.055);
          transition: 0.2s ease;
        }

        .resource-card:hover {
          transform: translateY(-3px);
          box-shadow:
            0 15px 35px
            rgba(30, 40, 80, 0.09);
        }

        .resource-card-top {
          display: flex;
          justify-content: space-between;
          gap: 15px;
        }

        .resource-info {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          min-width: 0;
        }

        .resource-icon-box {
          width: 46px;
          height: 46px;
          border-radius: 13px;
          background: #f0edff;
          color: #635bff;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .resource-info h3 {
          margin: 1px 0 8px;
          color: #13213f;
          font-size: 18px;
          font-weight: 750;
          line-height: 1.3;
        }

        .subject-badge {
          display: inline-block;
          padding: 5px 10px;
          border-radius: 20px;
          background: #f0edff;
          color: #635bff;
          font-size: 11px;
          font-weight: 700;
        }

        .card-actions {
          display: flex;
          gap: 6px;
          flex-shrink: 0;
        }

        .icon-btn {
          width: 36px;
          height: 36px;
          border: none;
          border-radius: 9px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: 0.15s ease;
        }

        .icon-btn.favorite {
          background: #fff8dc;
          color: #c79b19;
        }

        .icon-btn.favorite.active {
          background: #fff0bd;
          color: #e0a900;
        }

        .icon-btn.edit {
          background: #f0edff;
          color: #635bff;
        }

        .icon-btn.delete {
          background: #fff0f2;
          color: #e11d48;
        }

        .icon-btn:hover {
          transform: translateY(-2px);
        }

        .resource-description {
          color: #68738a;
          line-height: 1.6;
          margin: 18px 0;
          min-height: 48px;
          font-size: 14px;
        }

        .resource-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: #8a94a8;
          font-size: 12px;
          margin-bottom: 14px;
        }

        .resource-meta strong {
          color: #13213f;
          margin-left: 5px;
        }

        .uploaded-file-badge {
          background: #f4f2ff;
          color: #635bff;
          border-radius: 9px;
          padding: 8px 10px;
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 12px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .personal-note-preview {
          display: flex;
          align-items: flex-start;
          gap: 7px;
          background: #fff9e8;
          color: #8b6a18;
          border: 1px solid #f6e6ac;
          border-radius: 9px;
          padding: 9px 10px;
          font-size: 12px;
          line-height: 1.4;
          margin-bottom: 14px;
        }

        .resource-buttons {
          display: flex;
          align-items: center;
          gap: 9px;
          flex-wrap: wrap;
        }

        .open-resource-btn,
        .note-btn {
          border-radius: 10px;
          padding: 10px 14px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 7px;
        }

        .open-resource-btn {
          border: none;
          background: #635bff;
          color: white;
        }

        .open-resource-btn:hover {
          background: #5148e8;
        }

        .note-btn {
          border: 1px solid #dfe3ee;
          background: white;
          color: #635bff;
        }

        .note-btn:hover {
          background: #f6f4ff;
        }

        .no-url {
          color: #a0a8b8;
          font-size: 12px;
        }

        /* EMPTY */

        .empty-resources {
          grid-column: 1 / -1;
          background: white;
          border: 1px solid #e4e7ef;
          border-radius: 20px;
          padding: 70px 30px;
          text-align: center;
        }

        .empty-icon {
          color: #635bff;
          margin-bottom: 12px;
        }

        .empty-resources h2 {
          color: #13213f;
          margin: 8px 0;
        }

        .empty-resources p {
          color: #68738a;
          margin-bottom: 20px;
        }

        .empty-add-btn {
          border: none;
          background: #635bff;
          color: white;
          padding: 11px 18px;
          border-radius: 10px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          font-weight: 700;
        }

        /* FILE UPLOAD */

        .upload-or {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 15px 0 5px;
          color: #8a94a8;
          font-size: 11px;
          font-weight: 700;
        }

        .upload-or::before,
        .upload-or::after {
          content: "";
          height: 1px;
          background: #e4e7ef;
          flex: 1;
        }

        .file-upload-box {
          position: relative;
          border: 2px dashed #d8d5ff;
          background: #faf9ff;
          border-radius: 13px;
          min-height: 125px;
          overflow: hidden;
        }

        .file-upload-box > input {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          opacity: 0;
          cursor: pointer;
          z-index: 2;
        }

        .file-upload-content {
          min-height: 125px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          gap: 5px;
          color: #635bff;
          text-align: center;
          padding: 15px;
        }

        .file-upload-content strong {
          color: #13213f;
          font-size: 14px;
        }

        .file-upload-content > span {
          color: #7b8499;
          font-size: 12px;
        }

        .selected-file {
          position: relative;
          z-index: 3;
          color: #16835b;
          font-size: 12px;
          font-weight: 700;
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .selected-file button {
          margin-left: 8px;
          border: none;
          background: transparent;
          color: #e11d48;
          cursor: pointer;
          font-weight: 700;
        }

        .file-error {
          margin-top: 7px;
          color: #e11d48;
          font-size: 12px;
        }

        /* MODAL */

        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.52);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          z-index: 9999;
        }

        .resource-modal,
        .note-modal {
          width: 100%;
          max-width: 600px;
          max-height: 90vh;
          overflow-y: auto;
          background: white;
          border-radius: 22px;
          padding: 30px;
          box-shadow:
            0 25px 80px
            rgba(0, 0, 0, 0.2);
        }

        .note-modal {
          max-width: 520px;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 20px;
        }

        .modal-header h2 {
          margin: 0;
          color: #13213f;
          font-size: 22px;
        }

        .modal-header p {
          margin: 6px 0 0;
          color: #68738a;
          font-size: 13px;
        }

        .modal-close-btn {
          width: 36px;
          height: 36px;
          border: none;
          border-radius: 10px;
          background: #f1f2f7;
          color: #475569;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .modal-close-btn:hover {
          background: #e8e9ef;
        }

        .resource-modal label {
          display: block;
          margin: 15px 0 7px;
          color: #13213f;
          font-weight: 700;
          font-size: 13px;
        }

        .form-input {
          width: 100%;
          padding: 12px 14px;
          border: 1px solid #dfe3ee;
          border-radius: 10px;
          outline: none;
          font-size: 14px;
          color: #13213f;
          background: white;
          font-family: inherit;
        }

        .form-input:focus,
        .note-textarea:focus {
          border-color: #635bff;
          box-shadow:
            0 0 0 3px
            rgba(99, 91, 255, 0.1);
        }

        .form-two-columns {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 25px;
        }

        .cancel-btn,
        .save-resource-btn {
          padding: 11px 18px;
          border-radius: 10px;
          cursor: pointer;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          gap: 7px;
        }

        .cancel-btn {
          border: 1px solid #dfe3ee;
          background: white;
          color: #475569;
        }

        .save-resource-btn {
          border: none;
          background: #635bff;
          color: white;
        }

        .note-textarea {
          width: 100%;
          resize: vertical;
          padding: 14px;
          border: 1px solid #dfe3ee;
          border-radius: 12px;
          outline: none;
          font-family: inherit;
          font-size: 14px;
          line-height: 1.6;
          color: #13213f;
        }

        /* RESPONSIVE */

        @media (max-width: 1050px) {
          .resource-stats {
            grid-template-columns:
              repeat(2, 1fr);
          }

          .resource-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 800px) {
          .resources-page {
            padding: 25px;
          }

          .resources-header {
            align-items: flex-start;
            flex-direction: column;
          }

          .add-resource-btn {
            width: 100%;
            justify-content: center;
          }

          .recent-list {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 600px) {
          .resources-page {
            padding: 18px;
          }

          .resources-title-row h1 {
            font-size: 27px;
          }

          .resources-title-icon {
            width: 25px;
          }

          .resource-stats {
            grid-template-columns: 1fr;
          }

          .resource-card {
            padding: 18px;
          }

          .card-actions {
            gap: 4px;
          }

          .icon-btn {
            width: 33px;
            height: 33px;
          }

          .form-two-columns {
            grid-template-columns: 1fr;
            gap: 0;
          }

          .resource-modal,
          .note-modal {
            padding: 22px;
          }

          .resource-buttons {
            flex-direction: column;
            align-items: stretch;
          }

          .open-resource-btn,
          .note-btn {
            justify-content: center;
          }

          .resource-list-header {
            align-items: flex-start;
            gap: 10px;
          }
        }

      `}</style>
    </div>
  );
}

export default Resources;