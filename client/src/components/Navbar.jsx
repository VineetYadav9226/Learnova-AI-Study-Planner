// =====================================================
// LEARNOVA AI
// PROFESSIONAL NAVBAR
// =====================================================

import { useRef, useState } from "react";

import {
  FiHome,
  FiCalendar,
  FiBookOpen,
  FiMessageCircle,
  FiBarChart2,
  FiMoon,
  FiBell,
  FiLogOut,
  FiUser,
  FiSettings,
  FiChevronDown,
  FiCamera,
} from "react-icons/fi";

import {
  useNavigate,
  useLocation,
} from "react-router-dom";

// =====================================================
// NAVBAR COMPONENT
// =====================================================

function Navbar() {

  const navigate = useNavigate();
  const location = useLocation();

  const [profileOpen, setProfileOpen] =
    useState(false);

  // ===================================================
  // PROFILE PHOTO
  // ===================================================

  const fileInputRef = useRef(null);

  const [profilePhoto, setProfilePhoto] =
    useState(
      () =>
        localStorage.getItem(
          "learnova_profile_photo"
        ) || ""
    );

  // ===================================================
  // LOGIN STATUS
  // ===================================================

  const token =
    localStorage.getItem("learnova_token");

  // ===================================================
  // USER DATA
  // ===================================================

  let user = null;

  try {

    const storedUser =
      localStorage.getItem("learnova_user");

    if (storedUser) {
      user = JSON.parse(storedUser);
    }

  } catch (error) {

    console.error(
      "Unable to read user data:",
      error
    );

  }

  // ===================================================
  // USER NAME
  // ===================================================

  const userName =
    user?.name ||
    user?.username ||
    user?.fullName ||
    "Vineet";

  // ===================================================
  // USER ROLE
  // ===================================================

  const userRole =
    user?.role ||
    "Student";

  // ===================================================
  // USER INITIAL
  // ===================================================

  const userInitial =
    userName
      .charAt(0)
      .toUpperCase();

  // ===================================================
  // CHANGE PROFILE PHOTO
  // ===================================================

  const handleProfilePhoto = (event) => {

    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {

      alert(
        "Please select an image file."
      );

      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {

      alert(
        "Image size should be less than 5 MB."
      );

      event.target.value = "";
      return;
    }

    const reader =
      new FileReader();

    reader.onload = () => {

      const imageData =
        reader.result;

      setProfilePhoto(imageData);

      localStorage.setItem(
        "learnova_profile_photo",
        imageData
      );
    };

    reader.readAsDataURL(file);

    event.target.value = "";
  };

  // ===================================================
  // LOGOUT
  // ===================================================

  const handleLogout = () => {

    setProfileOpen(false);

    const confirmLogout =
      window.confirm(
        "Are you sure you want to logout?"
      );

    if (!confirmLogout) {
      return;
    }

    localStorage.removeItem(
      "learnova_token"
    );

    localStorage.removeItem(
      "learnova_user"
    );

    navigate(
      "/login",
      {
        replace: true,
      }
    );
  };

  // ===================================================
  // NAVIGATION
  // ===================================================

  const goTo = (path) => {

    setProfileOpen(false);

    navigate(path);
  };

  // ===================================================
  // ACTIVE LINK
  // ===================================================

  const isActive = (path) => {

    return (
      location.pathname === path
    );
  };

  // ===================================================
  // TOGGLE PROFILE
  // ===================================================

  const toggleProfile = () => {

    setProfileOpen(
      (previous) =>
        !previous
    );
  };

  // ===================================================
  // RENDER
  // ===================================================

  return (

    <header className="navbar">

      {/* =================================================
          LOGO
          ================================================= */}

      <button
        type="button"
        className="navbar-logo"
        onClick={() =>
          goTo("/dashboard")
        }
        aria-label="Go to Dashboard"
      >

        <div className="logo-icon">
          ✦
        </div>

        <span>
          Learnova AI
        </span>

      </button>


      {/* =================================================
          NAVIGATION
          ================================================= */}

      <nav
        className="nav-links"
        aria-label="Main navigation"
      >

        {/* HOME */}

        <button
          type="button"
          className={
            isActive("/dashboard")
              ? "active"
              : ""
          }
          onClick={() =>
            goTo("/dashboard")
          }
        >

          <FiHome />

          <span>
            Home
          </span>

        </button>


        {/* PLANNER */}

        <button
          type="button"
          className={
            isActive("/study-plan")
              ? "active"
              : ""
          }
          onClick={() =>
            goTo("/study-plan")
          }
        >

          <FiCalendar />

          <span>
            Planner
          </span>

        </button>


        {/* SUBJECTS */}

        <button
          type="button"
          className={
            isActive("/subjects")
              ? "active"
              : ""
          }
          onClick={() =>
            goTo("/subjects")
          }
        >

          <FiBookOpen />

          <span>
            Subjects
          </span>

        </button>


        {/* AI ASSISTANT */}

        <button
          type="button"
          className={
            isActive("/ai-assistant")
              ? "active"
              : ""
          }
          onClick={() =>
            goTo("/ai-assistant")
          }
        >

          <FiMessageCircle />

          <span>
            AI Assistant
          </span>

        </button>


        {/* ANALYTICS */}

        <button
          type="button"
          className={
            isActive("/analytics")
              ? "active"
              : ""
          }
          onClick={() =>
            goTo("/analytics")
          }
        >

          <FiBarChart2 />

          <span>
            Analytics
          </span>

        </button>

      </nav>


      {/* =================================================
          RIGHT SIDE ACTIONS
          ================================================= */}

      <div className="navbar-actions">

        {/* =================================================
            DARK MODE
            ================================================= */}

        <button
          type="button"
          className="icon-btn"
          title="Dark mode"
          aria-label="Toggle dark mode"
          onClick={() => {

            document.body.classList.toggle(
              "dark-mode"
            );

          }}
        >

          <FiMoon />

        </button>


        {/* =================================================
            NOTIFICATIONS
            ================================================= */}

        <button
          type="button"
          className="icon-btn notification-btn"
          title="Notifications"
          aria-label="Notifications"
          onClick={() => {

            console.log(
              "Notifications clicked"
            );

          }}
        >

          <FiBell />

          <span className="notification-dot" />

        </button>


        {/* =================================================
            PROFILE
            ================================================= */}

        {token ? (

          <div className="profile-wrapper">

            {/* PROFILE BUTTON */}

            <button
              type="button"
              className={
                `profile-button${
                  profileOpen
                    ? " open"
                    : ""
                }`
              }
              onClick={toggleProfile}
              aria-expanded={profileOpen}
              aria-haspopup="menu"
              title="Open profile menu"
            >

              {/* AVATAR */}

              <div className="profile-avatar">

                {profilePhoto ? (

                  <img
                    src={profilePhoto}
                    alt={`${userName} profile`}
                  />

                ) : (

                  <span>
                    {userInitial}
                  </span>

                )}

              </div>


              {/* USER INFO */}

              <div className="profile-info">

                <strong>
                  {userName}
                </strong>

                <span>
                  {userRole}
                </span>

              </div>


              {/* ARROW */}

              <FiChevronDown
                className={
                  `profile-chevron${
                    profileOpen
                      ? " rotate"
                      : ""
                  }`
                }
              />

            </button>


            {/* =================================================
                DROPDOWN
                ================================================= */}

            {profileOpen && (

              <div
                className="profile-dropdown"
                role="menu"
              >

                {/* PROFILE HEADER */}

                <div className="profile-dropdown-header">

                  <div className="profile-dropdown-avatar">

                    {profilePhoto ? (

                      <img
                        src={profilePhoto}
                        alt={`${userName} profile`}
                      />

                    ) : (

                      <span>
                        {userInitial}
                      </span>

                    )}

                  </div>

                  <div>

                    <strong>
                      {userName}
                    </strong>

                    <span>
                      {userRole}
                    </span>

                  </div>

                </div>


                <div className="profile-divider" />


                {/* CHANGE PHOTO */}

                <button
                  type="button"
                  className="profile-menu-item"
                  role="menuitem"
                  onClick={() => {
                    fileInputRef.current?.click();
                  }}
                >

                  <FiCamera />

                  <span>
                    Change Photo
                  </span>

                </button>


                {/* HIDDEN FILE INPUT */}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePhoto}
                  style={{
                    display: "none",
                  }}
                />


                {/* PROFILE */}

                <button
                  type="button"
                  className="profile-menu-item"
                  role="menuitem"
                  onClick={() =>
                    goTo("/profile")
                  }
                >

                  <FiUser />

                  <span>
                    My Profile
                  </span>

                </button>


                {/* SETTINGS */}

                <button
                  type="button"
                  className="profile-menu-item"
                  role="menuitem"
                  onClick={() =>
                    goTo("/settings")
                  }
                >

                  <FiSettings />

                  <span>
                    Settings
                  </span>

                </button>


                <div className="profile-divider" />


                {/* LOGOUT */}

                <button
                  type="button"
                  className="profile-menu-item logout"
                  role="menuitem"
                  onClick={handleLogout}
                >

                  <FiLogOut />

                  <span>
                    Logout
                  </span>

                </button>

              </div>

            )}

          </div>

        ) : (

          <button
            type="button"
            className="login-btn"
            onClick={() =>
              goTo("/login")
            }
          >
            Login
          </button>

        )}

      </div>

    </header>
  );
}

// =====================================================
// EXPORT
// =====================================================

export default Navbar;