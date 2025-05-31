import { TaskManager } from "./task.js";
import { Storage } from "./storage.js";
import { showToast, toggleTheme, debounce } from "./utils.js";

document.addEventListener("DOMContentLoaded", () => {
  // Initialize task manager with storage
  const storage = new Storage();
  const taskManager = new TaskManager(storage);

  // UI Elements
  const addTaskBtn = document.getElementById("add-task-btn");
  const addProjectBtn = document.getElementById("add-project-btn");
  const taskModal = document.getElementById("task-modal");
  const projectModal = document.getElementById("project-modal");
  const taskForm = document.getElementById("task-form");
  const projectForm = document.getElementById("project-form");
  const closeModalButtons = document.querySelectorAll(".close-modal");
  const themeSwitch = document.getElementById("theme-switch");
  const taskSearch = document.getElementById("task-search");
  const sortBy = document.getElementById("sort-by");
  const filterBy = document.getElementById("filter-by");
  const projectList = document.querySelector(".project-list");
  const tagCloud = document.querySelector(".tag-cloud");

  // Initialize UI
  initTheme();
  setupEventListeners();
  taskManager.loadTasks();
  updateStats();

  function initTheme() {
    const savedTheme = localStorage.getItem("theme") || "light";
    document.documentElement.setAttribute("data-theme", savedTheme);
    themeSwitch.checked = savedTheme === "dark";
  }

  function setupEventListeners() {
    // Theme toggle
    themeSwitch.addEventListener("change", () => {
      toggleTheme();
    });

    // Modals
    addTaskBtn.addEventListener("click", () => {
      taskForm.reset();
      document.getElementById("modal-title").textContent = "Add New Task";
      document.getElementById("task-id").value = "";
      taskModal.classList.add("show");
    });

    addProjectBtn.addEventListener("click", () => {
      projectForm.reset();
      projectModal.classList.add("show");
    });

    closeModalButtons.forEach((button) => {
      button.addEventListener("click", () => {
        taskModal.classList.remove("show");
        projectModal.classList.remove("show");
      });
    });

    // Forms
    taskForm.addEventListener("submit", (e) => {
      e.preventDefault();
      handleTaskSubmit();
    });

    projectForm.addEventListener("submit", (e) => {
      e.preventDefault();
      handleProjectSubmit();
    });

    // Search and filters
    taskSearch.addEventListener(
      "input",
      debounce(() => {
        taskManager.filterTasks({
          search: taskSearch.value,
          sort: sortBy.value,
          filter: filterBy.value,
        });
      }, 300)
    );

    sortBy.addEventListener("change", () => {
      taskManager.filterTasks({
        search: taskSearch.value,
        sort: sortBy.value,
        filter: filterBy.value,
      });
    });

    filterBy.addEventListener("change", () => {
      taskManager.filterTasks({
        search: taskSearch.value,
        sort: sortBy.value,
        filter: filterBy.value,
      });
    });

    // Projects and tags
    projectList.addEventListener("click", (e) => {
      if (e.target.tagName === "LI") {
        const project = e.target.dataset.project;
        document.querySelectorAll(".project-list li").forEach((li) => {
          li.classList.remove("active");
        });
        e.target.classList.add("active");
        taskManager.filterTasks({ project });
      }
    });

    tagCloud.addEventListener("click", (e) => {
      if (e.target.classList.contains("tag")) {
        const tag = e.target.dataset.tag;
        taskManager.filterTasks({ tag });
      }
    });

    // Drag and drop
    setupDragAndDrop();
  }

  function handleTaskSubmit() {
    const taskId = document.getElementById("task-id").value;
    const taskData = {
      title: document.getElementById("task-title").value,
      description: document.getElementById("task-description").value,
      dueDate: document.getElementById("task-due-date").value,
      priority: document.getElementById("task-priority").value,
      project: document.getElementById("task-project").value,
      tags: [],
    };

    // Get selected tags
    document
      .querySelectorAll('.tag-selector input[type="checkbox"]:checked')
      .forEach((checkbox) => {
        taskData.tags.push(checkbox.value);
      });

    if (taskId) {
      // Update existing task
      taskManager.updateTask(taskId, taskData);
      showToast("Task updated successfully!");
    } else {
      // Add new task
      taskManager.addTask(taskData);
      showToast("Task added successfully!");
    }

    taskModal.classList.remove("show");
    updateStats();
  }

  function handleProjectSubmit() {
    const projectName = document.getElementById("project-name").value;
    const projectColor = document.getElementById("project-color").value;

    if (projectName) {
      // Add project to the list
      const projectItem = document.createElement("li");
      projectItem.textContent = projectName;
      projectItem.dataset.project = projectName.toLowerCase();
      projectList.insertBefore(projectItem, addProjectBtn.parentNode);

      showToast("Project added successfully!");
      projectModal.classList.remove("show");
    }
  }

  function setupDragAndDrop() {
    const taskLists = document.querySelectorAll(".tasks-list");

    taskLists.forEach((list) => {
      list.addEventListener("dragover", (e) => {
        e.preventDefault();
        list.classList.add("drag-over");
      });

      list.addEventListener("dragleave", () => {
        list.classList.remove("drag-over");
      });

      list.addEventListener("drop", (e) => {
        e.preventDefault();
        list.classList.remove("drag-over");

        const taskId = e.dataTransfer.getData("text/plain");
        const newStatus = list.dataset.status;

        if (taskId) {
          taskManager.updateTaskStatus(taskId, newStatus);
          updateStats();
        }
      });
    });

    document.addEventListener("dragstart", (e) => {
      if (e.target.classList.contains("task-card")) {
        e.target.classList.add("dragging");
        e.dataTransfer.setData("text/plain", e.target.dataset.taskId);
        e.dataTransfer.effectAllowed = "move";
      }
    });

    document.addEventListener("dragend", (e) => {
      if (e.target.classList.contains("task-card")) {
        e.target.classList.remove("dragging");
      }
    });
  }

  function updateStats() {
    const tasks = taskManager.getAllTasks();
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(
      (task) => task.status === "done"
    ).length;
    const pendingTasks = totalTasks - completedTasks;

    document.getElementById("total-tasks").textContent = totalTasks;
    document.getElementById("completed-tasks").textContent = completedTasks;
    document.getElementById("pending-tasks").textContent = pendingTasks;

    // Update column counts
    document.querySelectorAll(".task-column").forEach((column) => {
      const status = column.querySelector(".tasks-list").dataset.status;
      const count = tasks.filter((task) => task.status === status).length;
      column.querySelector(".task-count").textContent = count;
    });
  }

  // Expose taskManager for debugging
  window.taskManager = taskManager;
});
