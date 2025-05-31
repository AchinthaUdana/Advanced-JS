export class Storage {
  constructor() {
    this.tasksKey = "taskManagerTasks";
    this.projectsKey = "taskManagerProjects";
  }

  getTasks() {
    const tasksJSON = localStorage.getItem(this.tasksKey);
    return tasksJSON ? JSON.parse(tasksJSON) : this.getSampleTasks();
  }

  saveTasks(tasks) {
    localStorage.setItem(this.tasksKey, JSON.stringify(tasks));
  }

  getProjects() {
    const projectsJSON = localStorage.getItem(this.projectsKey);
    return projectsJSON
      ? JSON.parse(projectsJSON)
      : ["Work", "Personal", "Shopping"];
  }

  saveProjects(projects) {
    localStorage.setItem(this.projectsKey, JSON.stringify(projects));
  }

  getSampleTasks() {
    return [
      {
        id: "1",
        title: "Complete project proposal",
        description:
          "Finish the proposal document and send to client for review",
        dueDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
        priority: "high",
        project: "work",
        tags: ["urgent", "important"],
        status: "todo",
        createdAt: new Date().toISOString(),
        completed: false,
      },
      {
        id: "2",
        title: "Buy groceries",
        description: "Milk, eggs, bread, fruits, and vegetables",
        dueDate: new Date(Date.now() + 172800000).toISOString().split("T")[0],
        priority: "medium",
        project: "shopping",
        tags: [],
        status: "todo",
        createdAt: new Date().toISOString(),
        completed: false,
      },
      {
        id: "3",
        title: "Morning run",
        description: "5km run in the park",
        dueDate: "",
        priority: "low",
        project: "personal",
        tags: ["important"],
        status: "in-progress",
        createdAt: new Date().toISOString(),
        completed: false,
      },
      {
        id: "4",
        title: "Read new book",
        description: "Atomic Habits by James Clear",
        dueDate: new Date(Date.now() + 259200000).toISOString().split("T")[0],
        priority: "low",
        project: "personal",
        tags: ["later"],
        status: "done",
        createdAt: new Date().toISOString(),
        completed: true,
      },
    ];
  }
}
