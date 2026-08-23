import { useEffect, useState } from "react";
import {
  FiSettings,
  FiUser,
  FiBell,
  FiMoon,
  FiSun,
  FiSave,
  FiLogOut,
  FiShield,
  FiCheck,
} from "react-icons/fi";

const DEFAULT_PROFILE = {
  name: "Learnova Student",
  email: "student@learnova.ai",
};

/* =========================================================
   PROFILE
========================================================= */

const getInitialProfile = () => {
  try {
    const savedProfile = localStorage.getItem("learnovaProfile");

    if (savedProfile) {
      const profile = JSON.parse(savedProfile);

      return {
        name:
          profile?.name ||
          profile?.displayName ||
          profile?.fullName ||
          DEFAULT_PROFILE.name,

        email:
          profile?.email || DEFAULT_PROFILE.email,
      };
    }

    const savedUser = localStorage.getItem("learnovaUser");

    if (savedUser) {
      const user = JSON.parse(savedUser);

      return {
        name:
          user?.name ||
          user?.displayName ||
          user?.fullName ||
          user?.username ||
          DEFAULT_PROFILE.name,

        email:
          user?.email || DEFAULT_PROFILE.email,
      };
    }
  } catch (error) {
    console.error("Error loading profile:", error);
  }

  return DEFAULT_PROFILE;
};

/* =========================================================
   BOOLEAN
========================================================= */

const getBoolean = (key, defaultValue) => {
  try {
    const value = localStorage.getItem(key);

    if (value === null) {
      return defaultValue;
    }

    return value === "true";
  } catch (error) {
    console.error("Error reading setting:", error);
    return defaultValue;
  }
};

/* =========================================================
   APPLY THEME
========================================================= */

const applyTheme = (isDark) => {
  const html = document.documentElement;
  const body = document.body;

  if (isDark) {
    html.classList.add("learnova-dark");
    html.setAttribute("data-theme", "dark");

    body.classList.add("learnova-dark-body");
    body.setAttribute("data-theme", "dark");
  } else {
    html.classList.remove("learnova-dark");
    html.setAttribute("data-theme", "light");

    body.classList.remove("learnova-dark-body");
    body.setAttribute("data-theme", "light");
  }
};

/* =========================================================
   SETTINGS
========================================================= */

const Settings = () => {
  const [profile, setProfile] = useState(getInitialProfile);

  const [notifications, setNotifications] = useState(() =>
    getBoolean("learnovaNotifications", true)
  );

  const [darkMode, setDarkMode] = useState(() =>
    getBoolean("learnovaDarkMode", false)
  );

  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  /* =======================================================
     APPLY DARK MODE
  ======================================================= */

  useEffect(() => {
    applyTheme(darkMode);

    localStorage.setItem(
      "learnovaDarkMode",
      String(darkMode)
    );

    window.dispatchEvent(
      new CustomEvent("learnovaThemeChanged", {
        detail: {
          darkMode,
        },
      })
    );
  }, [darkMode]);

  /* =======================================================
     PROFILE CHANGE
  ======================================================= */

  const handleProfileChange = (event) => {
    const { name, value } = event.target;

    setProfile((previous) => ({
      ...previous,
      [name]: value,
    }));

    setSaved(false);
  };

  /* =======================================================
     NOTIFICATION TOGGLE
  ======================================================= */

  const handleNotificationToggle = () => {
    setNotifications((previous) => {
      const nextValue = !previous;

      localStorage.setItem(
        "learnovaNotifications",
        String(nextValue)
      );

      return nextValue;
    });

    setSaved(false);
  };

  /* =======================================================
     DARK MODE TOGGLE
  ======================================================= */

  const handleDarkModeToggle = () => {
    setDarkMode((previous) => !previous);
    setSaved(false);
  };

  /* =======================================================
     SAVE
  ======================================================= */

  const handleSave = () => {
    setSaving(true);

    try {
      const cleanName =
        profile.name.trim() || DEFAULT_PROFILE.name;

      const cleanEmail =
        profile.email.trim() || DEFAULT_PROFILE.email;

      const updatedProfile = {
        name: cleanName,
        displayName: cleanName,
        fullName: cleanName,
        email: cleanEmail,
      };

      /* Save profile */
      localStorage.setItem(
        "learnovaProfile",
        JSON.stringify(updatedProfile)
      );

      /* Save notifications */
      localStorage.setItem(
        "learnovaNotifications",
        String(notifications)
      );

      /* Save dark mode */
      localStorage.setItem(
        "learnovaDarkMode",
        String(darkMode)
      );

      /* ===================================================
         UPDATE USER
      =================================================== */

      const existingUser =
        localStorage.getItem("learnovaUser");

      if (existingUser) {
        try {
          const user = JSON.parse(existingUser);

          const updatedUser = {
            ...user,
            name: cleanName,
            displayName: cleanName,
            fullName: cleanName,
            email: cleanEmail,
          };

          localStorage.setItem(
            "learnovaUser",
            JSON.stringify(updatedUser)
          );
        } catch (error) {
          console.error(
            "Error updating user:",
            error
          );
        }
      }

      /* ===================================================
         APPLY THEME AGAIN
      =================================================== */

      applyTheme(darkMode);

      /* ===================================================
         GLOBAL EVENTS
      =================================================== */

      window.dispatchEvent(
        new CustomEvent("learnovaSettingsUpdated", {
          detail: {
            profile: updatedProfile,
            notifications,
            darkMode,
          },
        })
      );

      window.dispatchEvent(
        new CustomEvent("learnovaProfileUpdated", {
          detail: {
            profile: updatedProfile,
          },
        })
      );

      window.dispatchEvent(
        new CustomEvent("learnovaThemeChanged", {
          detail: {
            darkMode,
          },
        })
      );

      /* Update state */
      setProfile({
        name: cleanName,
        email: cleanEmail,
      });

      setSaved(true);

      window.setTimeout(() => {
        setSaved(false);
      }, 3000);
    } catch (error) {
      console.error(
        "Error saving settings:",
        error
      );
    } finally {
      setSaving(false);
    }
  };

  /* =======================================================
     LOGOUT
  ======================================================= */

  const handleLogout = () => {
    const confirmLogout = window.confirm(
      "Are you sure you want to logout?"
    );

    if (!confirmLogout) {
      return;
    }

    localStorage.removeItem("learnovaUser");
    localStorage.removeItem("learnova_token");
    localStorage.removeItem("token");

    window.location.href = "/login";
  };

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div className="settings-page">

      {/* HEADER */}
      <div className="settings-header">
        <div>
          <div className="settings-brand">
            <span className="settings-brand-icon">
              <FiSettings />
            </span>

            <span>LEARNOVA SETTINGS</span>
          </div>

          <h1>Settings</h1>

          <p>
            Manage your Learnova AI account and
            application preferences.
          </p>
        </div>
      </div>

      {/* PROFILE */}
      <section className="settings-card">

        <div className="settings-section-header">

          <div className="settings-section-icon">
            <FiUser />
          </div>

          <div>
            <h2>Profile Settings</h2>

            <p>
              Manage your personal information.
            </p>
          </div>

        </div>

        <div className="settings-form">

          <div className="settings-field">

            <label htmlFor="settings-name">
              Full Name
            </label>

            <input
              id="settings-name"
              name="name"
              type="text"
              value={profile.name}
              onChange={handleProfileChange}
              placeholder="Enter your full name"
              autoComplete="name"
            />

          </div>

          <div className="settings-field">

            <label htmlFor="settings-email">
              Email Address
            </label>

            <input
              id="settings-email"
              name="email"
              type="email"
              value={profile.email}
              onChange={handleProfileChange}
              placeholder="Enter your email"
              autoComplete="email"
            />

          </div>

        </div>

      </section>

      {/* NOTIFICATIONS */}
      <section className="settings-card">

        <div className="settings-section-header">

          <div className="settings-section-icon">
            <FiBell />
          </div>

          <div>
            <h2>Notifications</h2>

            <p>
              Control your study reminders and
              notifications.
            </p>
          </div>

        </div>

        <div className="settings-option">

          <div className="settings-option-info">

            <strong>
              Study Notifications
            </strong>

            <span>
              Receive reminders about upcoming
              study tasks and plans.
            </span>

          </div>

          <button
            type="button"
            className={`toggle-button ${
              notifications
                ? "toggle-active"
                : ""
            }`}
            onClick={handleNotificationToggle}
            aria-pressed={notifications}
            aria-label={
              notifications
                ? "Disable study notifications"
                : "Enable study notifications"
            }
          >
            <span />
          </button>

        </div>

      </section>

      {/* APPEARANCE */}
      <section className="settings-card">

        <div className="settings-section-header">

          <div className="settings-section-icon">
            {darkMode ? (
              <FiMoon />
            ) : (
              <FiSun />
            )}
          </div>

          <div>
            <h2>Appearance</h2>

            <p>
              Customize how Learnova AI looks.
            </p>
          </div>

        </div>

        <div className="settings-option">

          <div className="settings-option-info">

            <strong>
              Dark Mode
            </strong>

            <span>
              Switch between light and dark
              appearance.
            </span>

          </div>

          <button
            type="button"
            className={`toggle-button ${
              darkMode
                ? "toggle-active"
                : ""
            }`}
            onClick={handleDarkModeToggle}
            aria-pressed={darkMode}
            aria-label={
              darkMode
                ? "Disable dark mode"
                : "Enable dark mode"
            }
          >
            <span />
          </button>

        </div>

      </section>

      {/* PRIVACY */}
      <section className="settings-card">

        <div className="settings-section-header">

          <div className="settings-section-icon">
            <FiShield />
          </div>

          <div>
            <h2>
              Privacy & Security
            </h2>

            <p>
              Your Learnova AI account and
              learning data.
            </p>
          </div>

        </div>

        <div className="privacy-box">

          <strong>
            Your learning data stays organized.
          </strong>

          <p>
            Study tasks, quiz results and
            preferences are stored locally
            for this application.
          </p>

        </div>

      </section>

      {/* ACTIONS */}
      <section className="settings-actions">

        <div className="save-message">

          {saved && (
            <span className="save-success">
              <FiCheck />
              Settings saved successfully
            </span>
          )}

        </div>

        <button
          type="button"
          className="save-settings-button"
          onClick={handleSave}
          disabled={saving}
        >
          <FiSave />

          {saving
            ? "Saving..."
            : "Save Changes"}
        </button>

        <button
          type="button"
          className="logout-settings-button"
          onClick={handleLogout}
        >
          <FiLogOut />
          Logout
        </button>

      </section>

    </div>
  );
};

export default Settings;