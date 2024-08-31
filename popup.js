document.addEventListener('DOMContentLoaded', () => {
    const taskInput = document.getElementById('new-task');
    const dueDateInput = document.getElementById('due-date');
    const prioritySelect = document.getElementById('priority');
    const taskList = document.getElementById('task-list');
    const addTaskButton = document.getElementById('add-task');
    const clearCompletedButton = document.getElementById('clear-completed');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const progressCircle = document.getElementById('progress-circle');
    const progressText = document.getElementById('progress-text');
    const searchBar = document.getElementById('search-bar');
    const searchIcon = document.getElementById('search-icon');
  
    let searchVisible = false;
  
    // Load tasks from storage
    chrome.storage.sync.get('tasks', (result) => {
      const tasks = result.tasks || [];
      renderTasks(tasks);
      updateProgress(tasks);
      updateBackground(tasks);
    });
  
    // Toggle search bar visibility
    searchIcon.addEventListener('click', () => {
      searchVisible = !searchVisible;
      searchBar.classList.toggle('hidden', !searchVisible);
      if (searchVisible) {
        searchBar.focus();
      } else {
        performSearch();
      }
    });
  
    // Perform search when Enter is pressed
    searchBar.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        performSearch();
      }
    });
  
    function performSearch() {
      const query = searchBar.value.toLowerCase();
      chrome.storage.sync.get('tasks', (result) => {
        const tasks = result.tasks || [];
        const filteredTasks = tasks.filter(task => task.text.toLowerCase().includes(query));
        renderTasks(filteredTasks);
      });
    }
  
    // Add new task
    addTaskButton.addEventListener('click', () => {
      const taskText = taskInput.value.trim();
      const dueDate = dueDateInput.value;
      const priority = prioritySelect.value;
  
      if (taskText) {
        const newTask = { text: taskText, dueDate, priority, done: false };
        chrome.storage.sync.get('tasks', (result) => {
          const tasks = result.tasks || [];
          tasks.push(newTask);
          chrome.storage.sync.set({ tasks }, () => {
            renderTasks(tasks);
            updateProgress(tasks);
            updateBackground(tasks);
          });
        });
        taskInput.value = '';
        dueDateInput.value = '';
        prioritySelect.value = 'low';
      }
    });
  
    // Task filtering
    filterButtons.forEach(button => {
      button.addEventListener('click', () => {
        filterButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        chrome.storage.sync.get('tasks', (result) => {
          renderTasks(result.tasks || []);
        });
      });
    });
  
    // Clear completed tasks
    clearCompletedButton.addEventListener('click', () => {
      chrome.storage.sync.get('tasks', (result) => {
        let tasks = result.tasks || [];
        tasks = tasks.filter(task => !task.done);
        chrome.storage.sync.set({ tasks }, () => {
          renderTasks(tasks);
          updateProgress(tasks);
          updateBackground(tasks);
        });
      });
    });
  
    // Render tasks
    function renderTasks(tasks) {
      const filter = document.querySelector('.filter-btn.active').id.replace('filter-', '');
      taskList.innerHTML = '';
      tasks.forEach((task, index) => {
        if (filter === 'all' || (filter === 'active' && !task.done) || (filter === 'completed' && task.done)) {
          const taskItem = document.createElement('li');
          taskItem.className = `priority-${task.priority}`;
          taskItem.innerHTML = `
            <input type="checkbox" ${task.done ? 'checked' : ''} data-index="${index}">
            <span class="task-info">${task.text}</span>
            <span class="due-date">${task.dueDate ? `Due: ${task.dueDate}` : ''}</span>
            <button class="delete" data-index="${index}">🗑️</button>
          `;
          taskList.appendChild(taskItem);
        }
      });
  
      // Task completion
      taskList.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', () => {
          const index = checkbox.getAttribute('data-index');
          chrome.storage.sync.get('tasks', (result) => {
            const tasks = result.tasks || [];
            tasks[index].done = checkbox.checked;
            chrome.storage.sync.set({ tasks }, () => {
              updateProgress(tasks);
              renderTasks(tasks);
              updateBackground(tasks);
            });
          });
        });
      });
  
      // Task deletion
      taskList.querySelectorAll('.delete').forEach(button => {
        button.addEventListener('click', () => {
          const index = button.getAttribute('data-index');
          chrome.storage.sync.get('tasks', (result) => {
            let tasks = result.tasks || [];
            tasks.splice(index, 1);
            chrome.storage.sync.set({ tasks }, () => {
              renderTasks(tasks);
              updateProgress(tasks);
              updateBackground(tasks);
            });
          });
        });
      });
    }
  
    // Update progress
    function updateProgress(tasks) {
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(task => task.done).length;
      const progress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
  
      const ctx = progressCircle.getContext('2d');
      const radius = 40;
      const circumference = 2 * Math.PI * radius;
  
      ctx.clearRect(0, 0, 80, 80);
      ctx.beginPath();
      ctx.arc(40, 40, radius, 0, 2 * Math.PI);
      ctx.strokeStyle = '#e0e0e0';
      ctx.lineWidth = 10;
      ctx.stroke();
      ctx.closePath();
  
      ctx.beginPath();
      ctx.arc(40, 40, radius, -Math.PI / 2, (-Math.PI / 2) + (2 * Math.PI * (progress / 100)));
      ctx.strokeStyle = '#8ac7db';
      ctx.lineWidth = 10;
      ctx.stroke();
      ctx.closePath();
  
      ctx.beginPath();
      ctx.arc(40, 40, radius - 10, 0, 2 * Math.PI);
      ctx.strokeStyle = 'transparent';
      ctx.lineWidth = 10;
      ctx.stroke();
      ctx.closePath();
  
      progressText.textContent = `${progress}%`;
  
      // Smooth transition for the background color
      document.body.style.transition = 'background-color 0.5s ease';
      updateBackground(tasks);
    }
  
    // Update background color based on task completion
    function updateBackground(tasks) {
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(task => task.done).length;
      const completionRatio = totalTasks === 0 ? 0 : completedTasks / totalTasks;
  
      const darkColor = [74, 74, 74]; // RGB for #4a4a4a
      const lightColor = [138, 199, 219]; // RGB for #8ac7db
  
      const newColor = darkColor.map((dark, index) => {
        const light = lightColor[index];
        return Math.round(dark + (light - dark) * completionRatio);
      });
  
      const [r, g, b] = newColor;
      document.body.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
    }
  });
  