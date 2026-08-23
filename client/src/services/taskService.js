// =====================================================
// LEARNOVA TASK SERVICE
// =====================================================

const API_URL = "http://localhost:5000/api/tasks";


// =====================================================
// GET AUTH TOKEN
// =====================================================

const getToken = () => {
  return localStorage.getItem("learnova_token");
};


// =====================================================
// GET ALL TASKS
// =====================================================

export const getTasks = async () => {
  try {
    const token = getToken();

    const response = await fetch(API_URL, {
      method: "GET",

      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    return {
      success: response.ok,
      ...data,
    };

  } catch (error) {
    console.error("Get tasks error:", error);

    return {
      success: false,
      message: "Unable to load tasks.",
    };
  }
};


// =====================================================
// CREATE TASK
// =====================================================

export const createTask = async (taskData) => {
  try {
    const token = getToken();

    const response = await fetch(API_URL, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },

      body: JSON.stringify(taskData),
    });

    const data = await response.json();

    return {
      success: response.ok,
      ...data,
    };

  } catch (error) {
    console.error("Create task error:", error);

    return {
      success: false,
      message: "Unable to create task.",
    };
  }
};


// =====================================================
// UPDATE TASK
// =====================================================

export const updateTaskAPI = async (taskId, taskData) => {
  try {
    const token = getToken();

    const response = await fetch(
      `${API_URL}/${taskId}`,
      {
        method: "PUT",

        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },

        body: JSON.stringify(taskData),
      }
    );

    const data = await response.json();

    return {
      success: response.ok,
      ...data,
    };

  } catch (error) {
    console.error("Update task error:", error);

    return {
      success: false,
      message: "Unable to update task.",
    };
  }
};


// =====================================================
// DELETE TASK
// =====================================================

export const deleteTaskAPI = async (taskId) => {
  try {
    const token = getToken();

    const response = await fetch(
      `${API_URL}/${taskId}`,
      {
        method: "DELETE",

        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    return {
      success: response.ok,
      ...data,
    };

  } catch (error) {
    console.error("Delete task error:", error);

    return {
      success: false,
      message: "Unable to delete task.",
    };
  }
};