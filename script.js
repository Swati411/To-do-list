/**
 * TaskFlow - To-Do List Dashboard Application
 * A simple yet powerful task management system
 */

// ============================================
// STATE MANAGEMENT
// ============================================

let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

// ============================================
// JSON FILE MANAGEMENT
// ============================================

/**
 * Exports tasks to a JSON file format
 * Creates a downloadable tasks.json file
 */
function exportTasksToJSON() {
    const dataStr = JSON.stringify(tasks, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    
    link.href = url;
    link.download = 'tasks.json';
    link.click();
    
    URL.revokeObjectURL(url);
}

/**
 * Updates the tasks.json file in the server (if using Node.js backend)
 * For now, uses localStorage as primary storage
 */
function updateTasksJSON() {
    // This would be called to sync with a backend
    // For frontend-only, we use localStorage
    console.log('Tasks JSON:', JSON.stringify(tasks, null, 2));
}

// ============================================
// DOM ELEMENTS
// ============================================

const domElements = {
    taskInput: document.getElementById('taskInput'),
    addTaskBtn: document.getElementById('addTaskBtn'),
    exportBtn: document.getElementById('exportBtn'),
    tasksList: document.getElementById('tasksList'),
    tasksListContainer: document.getElementById('tasksListContainer'),
    emptyStateContainer: document.getElementById('emptyStateContainer'),
    totalTasksDisplay: document.getElementById('totalTasksDisplay'),
    completedTasksDisplay: document.getElementById('completedTasksDisplay'),
    pendingTasksDisplay: document.getElementById('pendingTasksDisplay')
};

// ============================================
// EVENT LISTENERS
// ============================================

domElements.addTaskBtn.addEventListener('click', handleAddTask);
domElements.exportBtn.addEventListener('click', handleExportTasks);
domElements.taskInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        handleAddTask();
    }
});

// ============================================
// TASK MANAGEMENT FUNCTIONS
// ============================================

/**
 * Handles adding a new task to the list
 */
function handleAddTask() {
    const taskText = domElements.taskInput.value.trim();

    // Validate input
    if (taskText === '') {
        domElements.taskInput.classList.add('shake');
        showNotification('Please enter a task! 📝', 'warning');
        setTimeout(() => {
            domElements.taskInput.classList.remove('shake');
        }, 400);
        return;
    }

    // Validate length
    if (taskText.length > 150) {
        showNotification('Task is too long! Keep it under 150 characters. ✏️', 'warning');
        return;
    }

    // Create new task object
    const newTask = {
        id: Date.now(),
        text: taskText,
        completed: false,
        createdAt: new Date().toLocaleString()
    };

    // Add task to array
    tasks.push(newTask);

    // Reset input and update UI
    domElements.taskInput.value = '';
    domElements.taskInput.focus();

    // Persist and render
    persistTasks();
    renderAllTasks();

    showNotification(`Task added successfully! ✨ "${taskText.substring(0, 30)}..."`, 'success');
}

/**
 * Handles task deletion
 * @param {number} taskId - The ID of the task to delete
 */
function handleDeleteTask(taskId) {
    // Find the task text for notification
    const task = tasks.find(t => t.id === taskId);
    const taskText = task ? task.text.substring(0, 30) : 'Task';

    // Confirm deletion
    if (!confirm(`Delete "${taskText}${taskText.length > 30 ? '...' : ''}"? This cannot be undone.`)) {
        return;
    }

    // Filter out the deleted task
    tasks = tasks.filter(task => task.id !== taskId);

    // Persist and render
    persistTasks();
    renderAllTasks();

    showNotification('Task deleted! 🗑️', 'success', 2000);
}

/**
 * Handles toggling a task's completion status
 * @param {number} taskId - The ID of the task to toggle
 */
function handleToggleComplete(taskId) {
    const task = tasks.find(task => task.id === taskId);

    if (task) {
        const wasCompleted = task.completed;
        task.completed = !task.completed;
        persistTasks();
        renderAllTasks();

        if (!wasCompleted) {
            // Celebration message for completing a task
            const emoji = ['🎉', '🚀', '⭐', '🎊', '✅'][Math.floor(Math.random() * 5)];
            showNotification(`Great job! You crushed it! ${emoji}`, 'success', 2000);
        } else {
            showNotification('Task marked as incomplete ↩️', 'info', 1500);
        }
    }
}

/**
 * Handles exporting tasks to a JSON file
 */
function handleExportTasks() {
    if (tasks.length === 0) {
        showNotification('No tasks to export! Add some tasks first. 📝', 'warning');
        return;
    }

    try {
        const dataStr = JSON.stringify(tasks, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        
        link.href = url;
        link.download = `tasks-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
        showNotification(`Exported ${tasks.length} task${tasks.length !== 1 ? 's' : ''} successfully! 📥`, 'success', 3000);
    } catch (error) {
        showNotification('Failed to export tasks. Please try again. ❌', 'error');
        console.error('Export error:', error);
    }
}

// ============================================
// PERSISTENCE
// ============================================

/**
 * Saves all tasks to localStorage in JSON format
 */
function persistTasks() {
    try {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    } catch (error) {
        console.error('Failed to save tasks:', error);
        showNotification('Failed to save tasks. Please try again.', 'error');
    }
}

// ============================================
// RENDERING
// ============================================

/**
 * Renders all tasks to the DOM
 * Handles both empty state and populated states
 */
function renderAllTasks() {
    // Clear current list
    domElements.tasksList.innerHTML = '';

    // Handle empty state
    if (tasks.length === 0) {
        domElements.emptyStateContainer.style.display = 'block';
        domElements.tasksListContainer.style.display = 'none';
        updateStatistics();
        return;
    }

    // Show tasks list
    domElements.emptyStateContainer.style.display = 'none';
    domElements.tasksListContainer.style.display = 'block';

    // Render each task
    tasks.forEach(task => {
        const taskElement = createTaskElement(task);
        domElements.tasksList.appendChild(taskElement);
    });

    updateStatistics();
}

/**
 * Creates a DOM element for a single task
 * @param {Object} task - The task object
 * @returns {HTMLElement} - The task list item element
 */
function createTaskElement(task) {
    const listItem = document.createElement('li');
    listItem.className = `task-item ${task.completed ? 'completed' : ''}`;

    listItem.innerHTML = `
        <input 
            type="checkbox" 
            class="task-checkbox" 
            ${task.completed ? 'checked' : ''}
            onchange="handleToggleComplete(${task.id})"
            aria-label="Mark task as ${task.completed ? 'incomplete' : 'complete'}"
        >
        <span class="task-text">${escapeHtml(task.text)}</span>
        <div class="task-actions">
            <button 
                class="delete-btn" 
                onclick="handleDeleteTask(${task.id})"
                aria-label="Delete task"
            >
                🗑️ Delete
            </button>
        </div>
    `;

    return listItem;
}

// ============================================
// STATISTICS
// ============================================

/**
 * Updates task statistics displays
 */
function updateStatistics() {
    const totalCount = tasks.length;
    const completedCount = tasks.filter(task => task.completed).length;
    const pendingCount = totalCount - completedCount;

    // Update DOM with smooth animation
    animateCountChange(
        domElements.totalTasksDisplay,
        domElements.totalTasksDisplay.textContent,
        totalCount.toString()
    );

    animateCountChange(
        domElements.completedTasksDisplay,
        domElements.completedTasksDisplay.textContent,
        completedCount.toString()
    );

    animateCountChange(
        domElements.pendingTasksDisplay,
        domElements.pendingTasksDisplay.textContent,
        pendingCount.toString()
    );
}

/**
 * Animates number changes in statistics
 * @param {HTMLElement} element - The element to update
 * @param {string} oldValue - The current value
 * @param {string} newValue - The new value
 */
function animateCountChange(element, oldValue, newValue) {
    if (oldValue !== newValue) {
        element.style.transition = 'all 0.3s ease';
        element.style.transform = 'scale(0.7)';
        element.style.opacity = '0.5';

        setTimeout(() => {
            element.textContent = newValue;
            element.style.transform = 'scale(1.2)';
            element.style.opacity = '1';

            setTimeout(() => {
                element.style.transform = 'scale(1)';
            }, 100);
        }, 150);
    }
}

// ============================================
// UTILITIES
// ============================================

/**
 * Escapes HTML special characters to prevent XSS attacks
 * @param {string} text - The text to escape
 * @returns {string} - The escaped text
 */
function escapeHtml(text) {
    const htmlEscapeMap = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };

    return text.replace(/[&<>"']/g, (character) => htmlEscapeMap[character]);
}

/**
 * Shows a notification message to the user
 * @param {string} message - The notification message
 * @param {string} type - The notification type (success, error, warning, info)
 * @param {number} duration - Duration in milliseconds (default: 3000)
 */
function showNotification(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Auto-remove notification
    setTimeout(() => {
        notification.classList.add('remove');
        setTimeout(() => {
            notification.remove();
        }, 400);
    }, duration);
}

// ============================================
// INITIALIZATION
// ============================================

// Render tasks on page load
renderAllTasks();
