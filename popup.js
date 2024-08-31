document.addEventListener('DOMContentLoaded', function () {
    const taskInput = document.getElementById('new-task');
    const taskList = document.getElementById('task-list');
    const addTaskButton = document.getElementById('add-task');
    const clearTasksButton = document.getElementById('clear-tasks');
    const progressDisplay = document.getElementById('progress');
  
    // Load tasks from Chrome storage
    chrome.storage.sync.get(['tasks'], function (result) {
      if (result.tasks) {
        result.tasks.forEach(task => addTaskToDOM(task.text, task.done));
        updateProgress();
      }
    });
  
    // Add new task
    addTaskButton.addEventListener('click', function () {
      const taskText = taskInput.value.trim();
      if (taskText) {
        addTaskToDOM(taskText);
        saveTask(taskText, false);
        taskInput.value = '';
      }
    });
  
    // Clear completed tasks
    clearTasksButton.addEventListener('click', function () {
      const completedTasks = document.querySelectorAll('input[type="checkbox"]:checked');
      completedTasks.forEach(taskCheckbox => {
        const taskItem = taskCheckbox.parentNode;
        taskItem.remove();
        deleteTask(taskItem.dataset.text);
      });
      updateProgress();
    });
  
    // Add task to DOM
    function addTaskToDOM(text, done = false) {
      const li = document.createElement('li');
      li.dataset.text = text;
  
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = done;
      checkbox.addEventListener('change', function () {
        updateTaskStatus(text, checkbox.checked);
        updateProgress();
      });
  
      const taskText = document.createElement('span');
      taskText.textContent = text;
      taskText.addEventListener('dblclick', function () {
        editTask(taskText, text);
      });
  
      const deleteButton = document.createElement('button');
      deleteButton.textContent = 'Delete';
      deleteButton.className = 'delete';
      deleteButton.onclick = function () {
        li.remove();
        deleteTask(text);
        updateProgress();
      };
  
      li.appendChild(checkbox);
      li.appendChild(taskText);
      li.appendChild(deleteButton);
      taskList.appendChild(li);
    }
  
    // Save task to storage
    function saveTask(text, done) {
      chrome.storage.sync.get(['tasks'], function (result) {
        const tasks = result.tasks || [];
        tasks.push({ text, done });
        chrome.storage.sync.set({ tasks });
        updateProgress();
      });
    }
  
    // Update task status in storage
    function updateTaskStatus(text, done) {
      chrome.storage.sync.get(['tasks'], function (result) {
        const tasks = result.tasks.map(task =>
          task.text === text ? { text, done } : task
        );
        chrome.storage.sync.set({ tasks });
      });
    }
  
    // Delete task from storage
    function deleteTask(text) {
      chrome.storage.sync.get(['tasks'], function (result) {
        const tasks = result.tasks.filter(task => task.text !== text);
        chrome.storage.sync.set({ tasks });
      });
    }
  
    // Edit task
    function editTask(taskElement, oldText) {
      const newText = prompt('Edit task:', oldText);
      if (newText) {
        taskElement.textContent = newText;
        updateTask(oldText, newText);
      }
    }
  
    // Update task text in storage
    function updateTask(oldText, newText) {
      chrome.storage.sync.get(['tasks'], function (result) {
        const tasks = result.tasks.map(task =>
          task.text === oldText ? { text: newText, done: task.done } : task
        );
        chrome.storage.sync.set({ tasks });
      });
    }
  
    // Update progress display
    function updateProgress() {
      chrome.storage.sync.get(['tasks'], function (result) {
        const tasks = result.tasks || [];
        const completedTasks = tasks.filter(task => task.done).length;
        const totalTasks = tasks.length;
        const progress = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;
        progressDisplay.textContent = `Progress: ${progress}% (${completedTasks}/${totalTasks})`;
      });
    }
  });
  