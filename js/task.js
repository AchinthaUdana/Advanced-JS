import { showToast } from "./utils.js";

export class TaskManager {
  constructor(storage) {
    this.storage = storage;
    this.tasks = [];
  }

  loadTasks() {
    this.tasks = this.storage.getTasks();
    this.renderTasks(this.tasks);
  }

  getAllTasks() {
    return [...this.tasks];
  }

  addTask(taskData) {
    const newTask = {
      id: Date.now().toString(),
      status: "todo",
      createdAt: new Date().toISOString(),
      completed: false,
      ...taskData,
    };

    this.tasks.push(newTask);
    this.storage.saveTasks(this.tasks);
    this.renderTasks(this.tasks);
  }

  updateTask(taskId, taskData) {
    const taskIndex = this.tasks.findIndex((task) => task.id === taskId);

    if (taskIndex !== -1) {
      this.tasks[taskIndex] = {
        ...this.tasks[taskIndex],
        ...taskData,
      };

      this.storage.saveTasks(this.tasks);
      this.renderTasks(this.tasks);
    }
  }

  updateTaskStatus(taskId, newStatus) {
    const task = this.tasks.find((task) => task.id === taskId);

    if (task) {
      task.status = newStatus;
      task.completed = newStatus === "done";
      this.storage.saveTasks(this.tasks);
      this.renderTasks(this.tasks);
    }
  }

  deleteTask(taskId) {
    this.tasks = this.tasks.filter((task) => task.id !== taskId);
    this.storage.saveTasks(this.tasks);
    this.renderTasks(this.tasks);
    showToast("Task deleted successfully!");
  }

  toggleTaskCompletion(taskId) {
    const task = this.tasks.find((task) => task.id === taskId);

    if (task) {
      task.completed = !task.completed;
      task.status = task.completed ? "done" : "todo";
      this.storage.saveTasks(this.tasks);
      this.renderTasks(this.tasks);
    }
  }

  filterTasks({
    search = "",
    sort = "dueDate",
    filter = "all",
    project = "all",
    tag = "",
  }) {
    let filteredTasks = [...this.tasks];

    // Apply search filter
    if (search) {
      const searchTerm = search.toLowerCase();
      filteredTasks = filteredTasks.filter(
        (task) =>
          task.title.toLowerCase().includes(searchTerm) ||
          (task.description &&
            task.description.toLowerCase().includes(searchTerm))
      );
    }

    // Apply status filter
    if (filter === "completed") {
      filteredTasks = filteredTasks.filter((task) => task.completed);
    } else if (filter === "pending") {
      filteredTasks = filteredTasks.filter((task) => !task.completed);
    }

    // Apply project filter
    if (project !== "all") {
      filteredTasks = filteredTasks.filter((task) => task.project === project);
    }

    // Apply tag filter
    if (tag) {
      filteredTasks = filteredTasks.filter(
        (task) => task.tags && task.tags.includes(tag)
      );
    }

    // Apply sorting
    filteredTasks.sort((a, b) => {
      if (sort === "dueDate") {
        return (
          new Date(a.dueDate || "9999-12-31") -
          new Date(b.dueDate || "9999-12-31")
        );
      } else if (sort === "priority") {
        const priorityOrder = { high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      } else if (sort === "createdAt") {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
      return 0;
    });

    this.renderTasks(filteredTasks);
  }

  renderTasks(tasks) {
    // Clear all task lists
    document.querySelectorAll(".tasks-list").forEach((list) => {
      list.innerHTML = "";
    });

    // Group tasks by status
    const tasksByStatus = {
      todo: [],
      "in-progress": [],
      done: [],
    };

    tasks.forEach((task) => {
      tasksByStatus[task.status].push(task);
    });

    // Render tasks in their respective columns
    for (const [status, taskList] of Object.entries(tasksByStatus)) {
      const taskListElement = document.getElementById(`${status}-tasks`);

      taskList.forEach((task) => {
        const taskElement = this.createTaskElement(task);
        taskListElement.appendChild(taskElement);
      });
    }
  }

  createTaskElement(task) {
    const taskElement = document.createElement("div");
    taskElement.className = `task-card ${
      task.completed ? "completed" : ""
    } priority-${task.priority}`;
    taskElement.dataset.taskId = task.id;
    taskElement.draggable = true;

    // Format due date
    let dueDateText = "No due date";
    let dueDateClass = "";

    if (task.dueDate) {
      const dueDate = new Date(task.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      dueDateText = dueDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: task.dueDate.includes(today.getFullYear())
          ? undefined
          : "numeric",
      });

      if (dueDate < today && !task.completed) {
        dueDateClass = "overdue";
        dueDateText += " (Overdue)";
      }
    }

    // Create tags
    let tagsHTML = "";
    if (task.tags && task.tags.length > 0) {
      tagsHTML = `<div class="task-tags">${task.tags
        .map((tag) => `<span class="task-tag ${tag}">${tag}</span>`)
        .join("")}</div>`;
    }

    taskElement.innerHTML = `
            <div class="task-title">
                ${task.title}
                <div class="task-actions">
                    <button class="edit-task" title="Edit"><i class="fas fa-edit"></i></button>
                    <button class="delete-task" title="Delete"><i class="fas fa-trash"></i></button>
                </div>
            </div>
            ${
              task.description
                ? `<div class="task-description">${task.description}</div>`
                : ""
            }
            <div class="task-meta">
                <div class="task-due-date ${dueDateClass}">
                    <i class="far fa-calendar-alt"></i> ${dueDateText}
                </div>
                <div class="task-project">
                    <i class="fas fa-project-diagram"></i> ${task.project}
                </div>
            </div>
            ${tagsHTML}
        `;

    // Add event listeners to action buttons
    taskElement.querySelector(".edit-task").addEventListener("click", (e) => {
      e.stopPropagation();
      this.openEditTaskModal(task);
    });

    taskElement.querySelector(".delete-task").addEventListener("click", (e) => {
      e.stopPropagation();
      if (confirm("Are you sure you want to delete this task?")) {
        this.deleteTask(task.id);
      }
    });

    // Toggle completion on click
    taskElement.addEventListener("click", () => {
      this.toggleTaskCompletion(task.id);
    });

    return taskElement;
  }

  openEditTaskModal(task) {
    document.getElementById("modal-title").textContent = "Edit Task";
    document.getElementById("task-id").value = task.id;
    document.getElementById("task-title").value = task.title;
    document.getElementById("task-description").value = task.description || "";
    document.getElementById("task-due-date").value = task.dueDate || "";
    document.getElementById("task-priority").value = task.priority;
    document.getElementById("task-project").value = task.project;

    // Clear all tag checkboxes
    document
      .querySelectorAll('.tag-selector input[type="checkbox"]')
      .forEach((checkbox) => {
        checkbox.checked = false;
      });

    // Check the tags that this task has
    if (task.tags) {
      task.tags.forEach((tag) => {
        const checkbox = document.getElementById(`tag-${tag}`);
        if (checkbox) checkbox.checked = true;
      });
    }

    document.getElementById("task-modal").classList.add("show");
  }
}
