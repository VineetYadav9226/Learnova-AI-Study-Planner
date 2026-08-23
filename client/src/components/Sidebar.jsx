// =====================================================
// LEARNOVA AI
// SIDEBAR NAVIGATION
// =====================================================

import { NavLink, useNavigate } from "react-router-dom";

import {
  FiHome,
  FiCalendar,
  FiCheckSquare,
  FiBookOpen,
  FiMessageCircle,
  FiHelpCircle,
  FiBarChart2,
  FiFileText,
  FiFolder,
  FiSettings,
  FiLogOut,
} from "react-icons/fi";

// =====================================================
// SIDEBAR COMPONENT
// =====================================================

function Sidebar() {

  const navigate = useNavigate();

  // ===================================================
  // NAVIGATION ITEMS
  // ===================================================

  const navigationItems = [
    {
      path: "/dashboard",
      label: "Dashboard",
      icon: FiHome,
    },
    {
      path: "/study-plan",
      label: "Study Plan",
      icon: FiCalendar,
    },
    {
      path: "/tasks",
      label: "Tasks",
      icon: FiCheckSquare,
    },
    {
      path: "/subjects",
      label: "Subjects",
      icon: FiBookOpen,
    },
    {
      path: "/ai-assistant",
      label: "AI Assistant",
      icon: FiMessageCircle,
    },
    {
      path: "/quizzes",
      label: "Quizzes",
      icon: FiHelpCircle,
    },
    {
      path: "/analytics",
      label: "Analytics",
      icon: FiBarChart2,
    },
    {
      path: "/notes",
      label: "Notes",
      icon: FiFileText,
    },
    {
      path: "/resources",
      label: "Resources",
      icon: FiFolder,
    },
    {
      path: "/settings",
      label: "Settings",
      icon: FiSettings,
    },
  ];

  // ===================================================
  // LOGOUT
  // ===================================================

  const handleLogout = () => {

    const confirmLogout =
      window.confirm(
        "Are you sure you want to logout?"
      );

    if (!confirmLogout) {
      return;
    }

    // Remove authentication data

    localStorage.removeItem(
      "learnova_token"
    );

    localStorage.removeItem(
      "learnova_user"
    );

    // Redirect to login

    navigate(
      "/login",
      {
        replace: true,
      }
    );
  };

  // ===================================================
  // RENDER
  // ===================================================

  return (

    <aside
      className="sidebar"
      aria-label="Main sidebar"
    >

      {/* =================================================
          NAVIGATION
          ================================================= */}

      <nav
        className="sidebar-nav"
        aria-label="Main navigation"
      >

        {navigationItems.map(
          ({
            path,
            label,
            icon: Icon,
          }) => (

            <NavLink
              key={path}
              to={path}
              end={
                path === "/dashboard"
              }
              className={({ isActive }) =>
                `sidebar-link${
                  isActive
                    ? " active"
                    : ""
                }`
              }
              aria-label={label}
            >

              <Icon
                className="sidebar-link-icon"
                aria-hidden="true"
              />

              <span className="sidebar-link-label">
                {label}
              </span>

            </NavLink>

          )
        )}

      </nav>


      {/* =================================================
          SIDEBAR BOTTOM
          ================================================= */}

      <div className="sidebar-bottom">

        {/* =================================================
            LOGOUT BUTTON
            ================================================= */}

        <button
          type="button"
          className="sidebar-logout-btn"
          onClick={handleLogout}
          aria-label="Logout"
          title="Logout"
        >

          <FiLogOut
            aria-hidden="true"
          />

          <span>
            Logout
          </span>

        </button>

      </div>

    </aside>

  );
}


// =====================================================
// EXPORT
// =====================================================

export default Sidebar;