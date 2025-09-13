

let diaryEntries = JSON.parse(localStorage.getItem("diaryEntries")) || [];
let currentDate = new Date();
let chartInstance = null;

const navItems = document.querySelectorAll('.nav-item');
const tabContents = document.querySelectorAll('.tab-content');
const moodButtons = document.querySelectorAll('.mood-btn');
const saveEntryButton = document.getElementById('save-entry');
const diaryContent = document.getElementById('diary-content');
const entryDate = document.getElementById('entry-date');
const currentDateElement = document.getElementById('current-date');
const wordCountElement = document.getElementById('word-count');
const streakCountElement = document.getElementById('streak-count');
const calendar = document.getElementById('calendar');
const currentMonthElement = document.getElementById('current-month');
const prevMonthBtn = document.getElementById('prev-month');
const nextMonthBtn = document.getElementById('next-month');
const chartCanvas = document.getElementById('mood-chart').getContext('2d');
const deleteEntryBtn = document.getElementById('delete-entry');
const deleteDateInput = document.getElementById('delete-date');
const exportDataBtn = document.getElementById('export-data');
const resetAllBtn = document.getElementById('reset-all');
const entryModal = document.getElementById('entry-modal');
const closeModalBtn = document.querySelector('.close-button');
const darkModeToggle = document.getElementById('dark-mode-toggle');
const toast = document.getElementById('toast');

document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    setupEventListeners();
    setCurrentDate();
    updateWordCount();
    updateStreak();
    initCalendar();
    updateChart();
    updateAnalytics();
    setPreferredTheme();    
    loadTodaysEntry();
}

function setupEventListeners() {
    navItems.forEach(item => {
        item.addEventListener('click', () => switchTab(item.dataset.tab));
    });   
    moodButtons.forEach(btn => {
        btn.addEventListener('click', () => selectMood(btn));
    });
    saveEntryButton.addEventListener('click', saveEntry);

    diaryContent.addEventListener('input', updateWordCount);

    prevMonthBtn.addEventListener('click', () => navigateMonth(-1));
    nextMonthBtn.addEventListener('click', () => navigateMonth(1));

    deleteEntryBtn.addEventListener('click', deleteEntry);
    exportDataBtn.addEventListener('click', exportData);
    resetAllBtn.addEventListener('click', resetAllData);

    closeModalBtn.addEventListener('click', closeModal);
    window.addEventListener('click', (e) => {
        if (e.target === entryModal) closeModal();
    });
    darkModeToggle.addEventListener('click', toggleDarkMode);
    document.addEventListener('keydown', handleKeyboardShortcuts);
}

function handleKeyboardShortcuts(e) {
    if (e.ctrlKey || e.metaKey) {
        switch(e.key) {
            case 's':
                e.preventDefault();
                saveEntry();
                break;
            case '1':
                e.preventDefault();
                switchTab('write');
                break;
            case '2':
                e.preventDefault();
                switchTab('calendar');
                break;
            case '3':
                e.preventDefault();
                switchTab('analytics');
                break;
        }
    }
    
    if (e.key === 'Escape') {
        closeModal();
    }
}

function switchTab(tabName) {
    navItems.forEach(item => {
        item.classList.remove('active');
        if (item.dataset.tab === tabName) {
            item.classList.add('active');
        }
    });

    tabContents.forEach(content => {
        content.classList.remove('active');
        if (content.id === `${tabName}-tab`) {
            content.classList.add('active');
        }
    });

    if (tabName === 'calendar') {
        initCalendar();
    } else if (tabName === 'analytics') {
        updateChart();
        updateAnalytics();
    }
}

function setCurrentDate() {
    const today = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    currentDateElement.textContent = today.toLocaleDateString('en-US', options);
    entryDate.value = today.toISOString().split('T')[0];
}

function formatDate(date) {
    return date.toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric',
        year: 'numeric'
    });
}

function selectMood(selectedBtn) {
    moodButtons.forEach(btn => btn.classList.remove('active'));
    selectedBtn.classList.add('active');
  
    selectedBtn.style.transform = 'scale(1.1)';
    setTimeout(() => {
        selectedBtn.style.transform = '';
    }, 200);
}

function getMoodColor(mood) {
    const colors = {
        'Ecstatic': '#ff6b6b',
        'Happy': '#4ecdc4',
        'Content': '#45b7d1',
        'Anxious': '#f9ca24',
        'Sad': '#6c5ce7',
        'Angry': '#fd79a8'
    };
    return colors[mood] || '#ddd';
}

function getMoodIcon(mood) {
    const icons = {
        'Ecstatic': '😍',
        'Happy': '😊',
        'Content': '😌',
        'Anxious': '😰',
        'Sad': '😢',
        'Angry': '😠'
    };
    return icons[mood] || '😐';
}

function saveEntry() {
    const selectedMoodBtn = document.querySelector('.mood-btn.active');
    
    if (!selectedMoodBtn) {
        showToast('Please select a mood!', 'error');
        return;
    }

    const mood = selectedMoodBtn.dataset.mood;
    const date = entryDate.value;
    const content = diaryContent.value.trim();

    if (!date) {
        showToast('Please select a valid date!', 'error');
        return;
    }

    if (!content) {
        showToast('Please write something in your diary!', 'error');
        return;
    }

    saveEntryButton.classList.add('loading');
    saveEntryButton.innerHTML = '<i class="fas fa-spinner"></i> Saving...';

    setTimeout(() => {
        const entry = {
            id: Date.now(),
            date: date,
            mood: mood,
            content: content,
            timestamp: new Date().toISOString(),
            wordCount: content.split(/\s+/).length
        };
        const existingEntryIndex = diaryEntries.findIndex(entry => entry.date === date);
        if (existingEntryIndex !== -1) {
 
            entry.id = diaryEntries[existingEntryIndex].id;
            diaryEntries[existingEntryIndex] = entry;
            showToast('Entry updated successfully!', 'success');
        } else {
            diaryEntries.push(entry);
            showToast('Entry saved successfully!', 'success');
        }
        localStorage.setItem('diaryEntries', JSON.stringify(diaryEntries));

        resetForm();
        updateStreak();
        updateAnalytics();

        saveEntryButton.classList.remove('loading');
        saveEntryButton.innerHTML = '<i class="fas fa-save"></i> Save Entry';
    }, 1000);
}

function loadTodaysEntry() {
    const today = new Date().toISOString().split('T')[0];
    const todaysEntry = diaryEntries.find(entry => entry.date === today);
    
    if (todaysEntry) {
        const moodBtn = document.querySelector(`[data-mood="${todaysEntry.mood}"]`);
        if (moodBtn) {
            selectMood(moodBtn);
        }
        diaryContent.value = todaysEntry.content;
        updateWordCount();
    }
}

function resetForm() {
    diaryContent.value = '';
    moodButtons.forEach(btn => btn.classList.remove('active'));
    updateWordCount();
    setCurrentDate();
}

function updateWordCount() {
    const words = diaryContent.value.trim().split(/\s+/).filter(word => word.length > 0);
    const count = diaryContent.value.trim() ? words.length : 0;
    wordCountElement.textContent = `${count} words`;
}

function updateStreak() {
    const streak = calculateStreak();
    streakCountElement.textContent = streak;
    document.getElementById('current-streak').textContent = streak;
}

function calculateStreak() {
    if (diaryEntries.length === 0) return 0;

    const sortedEntries = diaryEntries
        .map(entry => new Date(entry.date))
        .sort((a, b) => b - a);

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (let i = 0; i < sortedEntries.length; i++) {
        const entryDate = new Date(sortedEntries[i]);
        entryDate.setHours(0, 0, 0, 0);

        const diffTime = currentDate - entryDate;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === streak) {
            streak++;
            currentDate.setDate(currentDate.getDate() - 1);
        } else if (diffDays === streak + 1) {
            if (streak === 0) {
                streak++;
                currentDate.setDate(currentDate.getDate() - 1);
            } else {
                break;
            }
        } else {
            break;
        }
    }

    return streak;
}

function initCalendar() {
    calendar.innerHTML = '';
    updateCurrentMonthDisplay();

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayHeaders.forEach(day => {
        const headerDiv = document.createElement('div');
        headerDiv.textContent = day;
        headerDiv.style.fontWeight = '600';
        headerDiv.style.color = 'var(--text-secondary)';
        headerDiv.style.fontSize = '0.9rem';
        headerDiv.style.display = 'flex';
        headerDiv.style.alignItems = 'center';
        headerDiv.style.justifyContent = 'center';
        headerDiv.style.padding = '0.5rem';
        calendar.appendChild(headerDiv);
    });

    for (let i = 0; i < startingDayOfWeek; i++) {
        const emptyDiv = document.createElement('div');
        emptyDiv.style.visibility = 'hidden';
        calendar.appendChild(emptyDiv);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dayDiv = document.createElement('div');
        dayDiv.textContent = day;
        
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const entry = diaryEntries.find(entry => entry.date === dateStr);
        
        if (entry) {
            dayDiv.classList.add('logged-day');
            dayDiv.style.background = `linear-gradient(135deg, ${getMoodColor(entry.mood)}, ${getMoodColor(entry.mood)}dd)`;
            dayDiv.addEventListener('click', () => openEntryModal(entry));
            dayDiv.style.cursor = 'pointer';
            dayDiv.title = `${entry.mood} - Click to view entry`;
        }
        const today = new Date();
        if (year === today.getFullYear() && 
            month === today.getMonth() && 
            day === today.getDate()) {
            dayDiv.style.border = '2px solid var(--primary-color)';
            dayDiv.style.fontWeight = '700';
        }
        calendar.appendChild(dayDiv);
    }
}

function updateCurrentMonthDisplay() {
    const options = { month: 'long', year: 'numeric' };
    currentMonthElement.textContent = currentDate.toLocaleDateString('en-US', options);
}

function navigateMonth(direction) {
    currentDate.setMonth(currentDate.getMonth() + direction);
    initCalendar();
}

function updateChart() {
    if (chartInstance) {
        chartInstance.destroy();
    }

    const moodCounts = diaryEntries.reduce((counts, entry) => {
        counts[entry.mood] = (counts[entry.mood] || 0) + 1;
        return counts;
    }, {});

    const hasData = Object.keys(moodCounts).length > 0;
    const labels = hasData ? Object.keys(moodCounts) : ['No Data'];
    const data = hasData ? Object.values(moodCounts) : [1];
    const backgroundColors = hasData ? labels.map(getMoodColor) : ['#ddd'];

    chartInstance = new Chart(chartCanvas, {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{
                data,
                backgroundColor: backgroundColors,
                borderWidth: 3,
                borderColor: getComputedStyle(document.documentElement).getPropertyValue('--bg-primary'),
                hoverBorderWidth: 5,
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        pointStyle: 'circle',
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary'),
                        font: {
                            family: 'Inter',
                            size: 12,
                            weight: '500'
                        }
                    }
                },
                tooltip: {
                    backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--bg-secondary'),
                    titleColor: getComputedStyle(document.documentElement).getPropertyValue('--text-primary'),
                    bodyColor: getComputedStyle(document.documentElement).getPropertyValue('--text-primary'),
                    borderColor: getComputedStyle(document.documentElement).getPropertyValue('--border-color'),
                    borderWidth: 1,
                    cornerRadius: 8,
                    callbacks: {
                        label: (context) => `${context.label}: ${context.raw} entries`
                    }
                }
            },
            cutout: '60%',
            animation: {
                animateRotate: true,
                animateScale: true,
                duration: 1000,
                easing: 'easeOutCubic'
            }
        }
    });
}

function updateAnalytics() {
    const totalEntries = diaryEntries.length;
    const happyMoods = ['Ecstatic', 'Happy', 'Content'];
    const happyDays = diaryEntries.filter(entry => happyMoods.includes(entry.mood)).length;
    const currentStreak = calculateStreak();

    document.getElementById('total-entries').textContent = totalEntries;
    document.getElementById('happy-days').textContent = happyDays;
    document.getElementById('current-streak').textContent = currentStreak;

    animateCounter('total-entries', totalEntries);
    animateCounter('happy-days', happyDays);
    animateCounter('current-streak', currentStreak);
}

function animateCounter(elementId, targetValue) {
    const element = document.getElementById(elementId);
    const startValue = 0;
    const duration = 1000;
    const startTime = performance.now();

    function updateCounter(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const currentValue = Math.floor(startValue + (targetValue - startValue) * progress);
        
        element.textContent = currentValue;
        
        if (progress < 1) {
            requestAnimationFrame(updateCounter);
        }
    }
    
    requestAnimationFrame(updateCounter);
}

function openEntryModal(entry) {
    document.getElementById('modal-date').textContent = formatDate(new Date(entry.date));
    document.getElementById('modal-mood-icon').textContent = getMoodIcon(entry.mood);
    document.getElementById('modal-mood-text').textContent = entry.mood;
    document.getElementById('modal-entry').textContent = entry.content;
    
    entryModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    entryModal.classList.remove('active');
    document.body.style.overflow = '';
}

function deleteEntry() {
    const dateToDelete = deleteDateInput.value;
    if (!dateToDelete) {
        showToast('Please select a date to delete!', 'error');
        return;
    }

    const entryIndex = diaryEntries.findIndex(entry => entry.date === dateToDelete);
    if (entryIndex === -1) {
        showToast('No entry found for this date!', 'error');
        return;
    }

    if (confirm('Are you sure you want to delete this entry? This action cannot be undone.')) {
        diaryEntries.splice(entryIndex, 1);
        localStorage.setItem('diaryEntries', JSON.stringify(diaryEntries));
        
        showToast('Entry deleted successfully!', 'success');
        deleteDateInput.value = '';

        updateStreak();
        updateAnalytics();
        initCalendar();
        updateChart();
    }
}

function exportData() {
    if (diaryEntries.length === 0) {
        showToast('No data to export!', 'error');
        return;
    }

    const dataStr = JSON.stringify(diaryEntries, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `diary-entries-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showToast('Data exported successfully!', 'success');
}

function resetAllData() {
    if (confirm('Are you sure you want to delete all diary entries? This action cannot be undone.')) {
        if (confirm('This will permanently delete all your diary entries. Are you absolutely sure?')) {
            diaryEntries = [];
            localStorage.removeItem('diaryEntries');
            
            showToast('All data has been reset!', 'success');
            
            resetForm();
            updateStreak();
            updateAnalytics();
            initCalendar();
            updateChart();
        }
    }
}

function setPreferredTheme() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
    } else if (prefersDark) {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
    }
    
    updateThemeIcon();
}

function toggleDarkMode() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    updateThemeIcon();
  
    if (chartInstance) {
        setTimeout(() => updateChart(), 100);
    }
}

function updateThemeIcon() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const icon = darkModeToggle.querySelector('i');
    
    if (currentTheme === 'dark') {
        icon.className = 'fas fa-sun';
    } else {
        icon.className = 'fas fa-moon';
    }
}

function showToast(message, type = 'success') {
    const toastMessage = document.getElementById('toast-message');
    const toastIcon = toast.querySelector('i');
    
    toastMessage.textContent = message;
    
    toast.className = 'toast';
    if (type === 'error') {
        toast.style.background = 'var(--error-color)';
        toastIcon.className = 'fas fa-exclamation-circle';
    } else if (type === 'warning') {
        toast.style.background = 'var(--warning-color)';
        toastIcon.className = 'fas fa-exclamation-triangle';
    } else {
        toast.style.background = 'var(--success-color)';
        toastIcon.className = 'fas fa-check-circle';
    }

    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

const autoSave = debounce(() => {
    const selectedMoodBtn = document.querySelector('.mood-btn.active');
    const content = diaryContent.value.trim();
    
    if (selectedMoodBtn && content) {
        const draft = {
            mood: selectedMoodBtn.dataset.mood,
            content: content,
            date: entryDate.value
        };
        localStorage.setItem('currentDraft', JSON.stringify(draft));
    }
}, 2000);

function loadDraft() {
    const draft = JSON.parse(localStorage.getItem('currentDraft'));
    if (draft && draft.date === new Date().toISOString().split('T')[0]) {
        const moodBtn = document.querySelector(`[data-mood="${draft.mood}"]`);
        if (moodBtn) {
            selectMood(moodBtn);
        }
        diaryContent.value = draft.content;
        updateWordCount();
    }
}
diaryContent.addEventListener('input', autoSave);
document.addEventListener('DOMContentLoaded', loadDraft);
function clearDraft() {
    localStorage.removeItem('currentDraft');
}

const originalSaveEntry = saveEntry;
saveEntry = function() {
    originalSaveEntry();
    clearDraft();
};
