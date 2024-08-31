chrome.runtime.onInstalled.addListener(() => {
    chrome.alarms.create('checkDueTasks', { periodInMinutes: 1 });
});

chrome.alarms.onAlarm.addListener(() => {
    chrome.storage.sync.get('tasks', (result) => {
        const tasks = result.tasks || [];
        const now = new Date().toISOString().split('T')[0];
        tasks.forEach(task => {
            if (!task.done && task.dueDate && task.dueDate === now) {
                chrome.notifications.create(`due-${task.text}`, {
                    type: 'basic',
                    iconUrl: 'icon_3.png',
                    title: 'Task Due Today!',
                    message: task.text,
                    priority: 1
                });
            }
        });
    });
});
