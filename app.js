"use strict";
class ClaudeTimerTracker {
    constructor() {
        this.clickCount = 0;
        this.resetDateInput = document.getElementById('resetDate');
        this.resetTimeInput = document.getElementById('resetTime');
        this.calculateBtn = document.getElementById('calculateBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.resultsSection = document.getElementById('resultsSection');
        this.resetTimesDiv = document.getElementById('resetTimes');
        this.clickCounter = document.getElementById('click-counter');
        this.initializeEventListeners();
        this.loadSavedData();
        this.initializeClickCounter();
    }
    initializeEventListeners() {
        this.calculateBtn.addEventListener('click', () => this.calculateAndDisplay());
        this.clearBtn.addEventListener('click', () => this.clearSavedData());
    }
    loadSavedData() {
        const savedData = localStorage.getItem('claudeResetInfo');
        if (savedData) {
            try {
                const resetInfo = JSON.parse(savedData);
                // Validate data structure
                if (resetInfo && typeof resetInfo.date === 'string' && typeof resetInfo.time === 'string') {
                    this.resetDateInput.value = resetInfo.date;
                    this.resetTimeInput.value = resetInfo.time;
                    const resetTimes = this.calculateResetTimes(resetInfo.date, resetInfo.time);
                    this.displayResetTimes(resetTimes, resetInfo.clickedTimers || []);
                }
            }
            catch (error) {
                console.warn('Failed to load saved data:', error);
                // Clear corrupted data
                localStorage.removeItem('claudeResetInfo');
            }
            // Move input section below results since results are displayed on load
            const inputSection = document.querySelector('.input-section');
            const container = document.querySelector('.container');
            const aboutSection = document.querySelector('.about-section');
            if (inputSection && container && aboutSection) {
                container.removeChild(inputSection);
                container.insertBefore(inputSection, aboutSection);
            }
        }
        // Load click count
        const savedClickCount = localStorage.getItem('clickCount');
        if (savedClickCount) {
            const parsedCount = parseInt(savedClickCount, 10);
            if (!isNaN(parsedCount) && parsedCount >= 0) {
                this.clickCount = parsedCount;
                this.updateClickCounter();
            }
        }
    }
    saveData(clickedTimers) {
        const resetInfo = {
            date: this.resetDateInput.value,
            time: this.resetTimeInput.value,
            clickedTimers: clickedTimers
        };
        localStorage.setItem('claudeResetInfo', JSON.stringify(resetInfo));
    }
    clearSavedData() {
        localStorage.removeItem('claudeResetInfo');
        this.resetDateInput.value = '';
        this.resetTimeInput.value = '';
        this.resultsSection.style.display = 'none';
        // Move input section back to original position above results
        const inputSection = document.querySelector('.input-section');
        const container = document.querySelector('.container');
        const resultsSection = document.querySelector('.results-section');
        const aboutSection = document.querySelector('.about-section');
        if (inputSection && container && resultsSection && aboutSection) {
            container.removeChild(inputSection);
            container.insertBefore(inputSection, resultsSection);
        }
    }
    initializeClickCounter() {
        // Listen for all clicks anywhere on the page (including free space)
        document.addEventListener('click', () => {
            this.clickCount++;
            this.updateClickCounter();
            localStorage.setItem('clickCount', this.clickCount.toString());
        });
    }
    updateClickCounter() {
        this.clickCounter.textContent = `Clicks: ${this.clickCount}`;
    }
    calculateAndDisplay() {
        const dateValue = this.resetDateInput.value;
        const timeValue = this.resetTimeInput.value;
        if (!dateValue || !timeValue) {
            alert('Please enter both date and time');
            return;
        }
        // Validate date format and range
        const inputDate = new Date(`${dateValue}T${timeValue}`);
        if (isNaN(inputDate.getTime())) {
            alert('Please enter a valid date and time');
            return;
        }
        // Prevent future dates beyond reasonable limits
        const now = new Date();
        const maxFutureDate = new Date(now.getTime() + (365 * 24 * 60 * 60 * 1000)); // 1 year from now
        if (inputDate > maxFutureDate) {
            alert('Please enter a date within the next year');
            return;
        }
        // Prevent dates too far in the past
        const minPastDate = new Date(now.getTime() - (365 * 24 * 60 * 60 * 1000)); // 1 year ago
        if (inputDate < minPastDate) {
            alert('Please enter a date within the last year');
            return;
        }
        const resetTimes = this.calculateResetTimes(dateValue, timeValue);
        this.displayResetTimes(resetTimes);
        this.saveData();
    }
    calculateResetTimes(startDateStr, startTimeStr) {
        const startDateTime = new Date(`${startDateStr}T${startTimeStr}`);
        const resetTimes = [];
        // Start from the provided reset time
        let currentTime = new Date(startDateTime.getTime());
        // Calculate 30 occurrences forward (5 hours each)
        for (let i = 0; i < 30; i++) {
            resetTimes.push(new Date(currentTime.getTime()));
            currentTime = new Date(currentTime.getTime() + 5 * 60 * 60 * 1000);
        }
        return resetTimes;
    }
    displayResetTimes(resetTimes, clickedTimers = []) {
        this.resetTimesDiv.innerHTML = '';
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today.getTime());
        yesterday.setDate(yesterday.getDate() - 1);
        const tomorrow = new Date(today.getTime());
        tomorrow.setDate(tomorrow.getDate() + 1);
        // Find the next upcoming reset time
        let nextResetIndex = -1;
        for (let i = 0; i < resetTimes.length; i++) {
            if (resetTimes[i] > now) {
                nextResetIndex = i;
                break;
            }
        }
        resetTimes.forEach((resetTime, index) => {
            const timeDiv = document.createElement('div');
            timeDiv.className = 'reset-time';
            // Restore clicked state from localStorage
            if (clickedTimers.includes(index)) {
                timeDiv.classList.add('clicked');
            }
            // Highlight the next upcoming reset time
            if (index === nextResetIndex) {
                timeDiv.classList.add('next-reset');
            }
            const dateStr = resetTime.toLocaleDateString();
            const timeStr = resetTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            let dateTag = '';
            const resetDate = new Date(resetTime.getFullYear(), resetTime.getMonth(), resetTime.getDate());
            if (resetDate.getTime() === yesterday.getTime()) {
                dateTag = 'Yesterday';
                timeDiv.classList.add('yesterday');
            }
            else if (resetDate.getTime() === today.getTime()) {
                dateTag = 'Today';
                timeDiv.classList.add('today');
            }
            else if (resetDate.getTime() === tomorrow.getTime()) {
                dateTag = 'Tomorrow';
                timeDiv.classList.add('tomorrow');
            }
            else {
                dateTag = resetTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                timeDiv.classList.add('future');
            }
            let upcomingText = '';
            if (index === nextResetIndex) {
                upcomingText = '<span class="upcoming-label">Upcoming</span>';
            }
            timeDiv.innerHTML = `
                <span class="date-tag">${dateTag}${upcomingText}</span>
                <span class="time">${timeStr}</span>
            `;
            // Add click event listener to toggle clicked state
            timeDiv.addEventListener('click', () => {
                timeDiv.classList.toggle('clicked');
                // Save clicked state to localStorage
                const clickedTimers = Array.from(document.querySelectorAll('.reset-time'))
                    .map((timer, idx) => timer.classList.contains('clicked') ? idx : -1)
                    .filter(idx => idx !== -1);
                this.saveData(clickedTimers);
            });
            this.resetTimesDiv.appendChild(timeDiv);
        });
        // Move input section below results when results are displayed
        const inputSection = document.querySelector('.input-section');
        const container = document.querySelector('.container');
        const aboutSection = document.querySelector('.about-section');
        if (inputSection && container && aboutSection) {
            // Remove input section from current position
            container.removeChild(inputSection);
            // Insert it before the about section (so about section stays at bottom)
            container.insertBefore(inputSection, aboutSection);
        }
        this.resultsSection.style.display = 'block';
    }
}
// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ClaudeTimerTracker();
});
//# sourceMappingURL=app.js.map