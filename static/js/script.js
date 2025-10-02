// Enhanced Student Performance Tracker with All Features

// Global Variables
let individualChart, passFailChart, studyTimeChart, absencesChart, gradeComparisonChart;
let recentEntries = [];
let currentTheme = 'light';
let currentPredictionData = null;

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Initialize Application
function initializeApp() {
    // Hide loading screen after 2 seconds
    setTimeout(() => {
        document.getElementById('loadingScreen').style.opacity = '0';
        setTimeout(() => {
            document.getElementById('loadingScreen').style.display = 'none';
        }, 500);
    }, 2000);

    // Initialize event listeners
    initializeEventListeners();
    
    // Initialize charts
    initializeCharts();
    
    // Load any saved data
    loadSavedData();
    
    // Show welcome notification
    showToast('Welcome to EduTrack Pro!', 'success');
    
    // Handle browser back button
    setupBrowserNavigation();
}

// Initialize Event Listeners
function initializeEventListeners() {
    // Landing page
    document.getElementById('getStartedBtn').addEventListener('click', showDashboard);
    
    // Navigation
    document.getElementById('individualBtn').addEventListener('click', () => switchSection('individual'));
    document.getElementById('batchBtn').addEventListener('click', () => switchSection('batch'));
    document.getElementById('classBtn').addEventListener('click', () => switchSection('class'));
    document.getElementById('recentBtn').addEventListener('click', () => switchSection('recent'));
    
    // Theme toggle
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    
    // Form handling
    document.getElementById('predictForm').addEventListener('submit', handlePrediction);
    
    // Action buttons
    document.getElementById('newPredictionBtn').addEventListener('click', resetPredictionForm);
    document.getElementById('batchAnalysisBtn').addEventListener('click', () => switchSection('batch'));
    
    // Table actions
    document.getElementById('exportTableBtn').addEventListener('click', exportTableData);
    document.getElementById('clearHistoryBtn').addEventListener('click', clearHistory);
}

// Setup Browser Navigation
function setupBrowserNavigation() {
    window.addEventListener('popstate', function(event) {
        if (event.state && event.state.section) {
            switchSection(event.state.section);
        }
    });
}

// Update Browser History
function updateBrowserHistory(section) {
    window.history.pushState({ section: section }, '', `#${section}`);
}

// Show Dashboard
function showDashboard() {
    const hero = document.getElementById('hero');
    const dashboard = document.getElementById('dashboard');
    
    hero.style.opacity = '0';
    hero.style.transform = 'translateY(-20px)';
    
    setTimeout(() => {
        hero.style.display = 'none';
        dashboard.style.display = 'block';
        
        setTimeout(() => {
            dashboard.style.opacity = '1';
        }, 50);
        
        // Update browser history
        updateBrowserHistory('individual');
        
        // Initialize class charts
        initializeClassCharts();
    }, 500);
}

// Switch Sections
function switchSection(section) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    
    // Remove active class from all nav items
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    
    // Show selected section and activate nav item
    switch(section) {
        case 'individual':
            document.getElementById('individualSection').classList.add('active');
            document.getElementById('individualBtn').classList.add('active');
            document.getElementById('currentSectionTitle').textContent = 'Individual Student Analytics';
            break;
        case 'batch':
            document.getElementById('batchSection').classList.add('active');
            document.getElementById('batchBtn').classList.add('active');
            document.getElementById('currentSectionTitle').textContent = 'Batch Analysis';
            break;
        case 'class':
            document.getElementById('classSection').classList.add('active');
            document.getElementById('classBtn').classList.add('active');
            document.getElementById('currentSectionTitle').textContent = 'Class Performance Overview';
            initializeClassCharts();
            break;
        case 'recent':
            document.getElementById('recentSection').classList.add('active');
            document.getElementById('recentBtn').classList.add('active');
            document.getElementById('currentSectionTitle').textContent = 'Recent Predictions';
            updateRecentTable();
            break;
    }
    
    // Update browser history
    updateBrowserHistory(section);
}

// Toggle Theme
function toggleTheme() {
    const themeToggle = document.getElementById('themeToggle');
    const icon = themeToggle.querySelector('i');
    
    if (currentTheme === 'light') {
        document.documentElement.setAttribute('data-theme', 'dark');
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
        currentTheme = 'dark';
        localStorage.setItem('theme', 'dark');
    } else {
        document.documentElement.removeAttribute('data-theme');
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
        currentTheme = 'light';
        localStorage.setItem('theme', 'light');
    }
}

// Handle Prediction Form
async function handlePrediction(e) {
    e.preventDefault();
    
    const form = e.target;
    const button = form.querySelector('.predict-button');
    
    // Show loading state
    button.classList.add('loading');
    
    // Get form data
    const formData = new FormData(form);
    const data = {
        studytime: formData.get('studytime'),
        failures: formData.get('failures'),
        absences: formData.get('absences'),
        G1: formData.get('G1'),
        G2: formData.get('G2'),
        famsup: document.getElementById('famsup').checked ? 'yes' : 'no',
        schoolsup: document.getElementById('schoolsup').checked ? 'yes' : 'no',
        internet: document.getElementById('internet').checked ? 'yes' : 'no',
        paid: document.getElementById('paid').checked ? 'yes' : 'no'
    };
    
    try {
        // Simulate API call (replace with actual backend call)
        const result = await simulatePrediction(data);
        
        // Display results
        displayPredictionResult(result, data);
        
        // Update recent entries
        updateRecentEntries(data, result);
        
        // Show success notification
        showToast('Prediction completed successfully!', 'success');
        
    } catch (error) {
        console.error('Prediction error:', error);
        showToast('Prediction failed. Please try again.', 'error');
    } finally {
        // Remove loading state
        button.classList.remove('loading');
    }
}

// Simulate Prediction (Replace with actual backend API call)
async function simulatePrediction(data) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Calculate probabilities based on input data
    const studyTimeWeight = (parseInt(data.studytime) - 1) * 0.15;
    const failuresWeight = (4 - parseInt(data.failures)) * 0.1;
    const absencesWeight = Math.max(0, (20 - parseInt(data.absences)) / 20) * 0.1;
    const g1Weight = (parseInt(data.G1) / 20) * 0.3;
    const g2Weight = (parseInt(data.G2) / 20) * 0.3;
    
    // Support factors
    const supportBonus = (data.famsup === 'yes' ? 0.05 : 0) + 
                        (data.schoolsup === 'yes' ? 0.05 : 0) + 
                        (data.internet === 'yes' ? 0.05 : 0) + 
                        (data.paid === 'yes' ? 0.05 : 0);
    
    let passProbability = studyTimeWeight + failuresWeight + absencesWeight + g1Weight + g2Weight + supportBonus;
    passProbability = Math.max(0.1, Math.min(0.95, passProbability));
    
    const failProbability = 1 - passProbability;
    
    const prediction = passProbability > 0.6 ? 'PASS' : 'FAIL';
    const confidence = Math.round(Math.max(passProbability, failProbability) * 100);
    
    return {
        prediction: prediction,
        confidence: confidence,
        probability_pass: Math.round(passProbability * 100),
        probability_fail: Math.round(failProbability * 100),
        input_data: data
    };
}

// Display Prediction Result
function displayPredictionResult(result, formData) {
    const resultCard = document.getElementById('result');
    const probabilityCards = document.getElementById('probabilityCards');
    const inputSummary = document.getElementById('inputSummary');
    const recommendations = document.getElementById('recommendations');
    const actionButtons = document.getElementById('actionButtons');
    
    // Store current prediction data
    currentPredictionData = { result, formData };
    
    // Create sparkle elements for celebration
    createSparkles();
    
    // Display main result
    if (result.prediction === "PASS") {
        resultCard.innerHTML = `
            <div class="result-content result-success prediction-result">
                <div class="result-icon">
                    <i class="fas fa-trophy"></i>
                </div>
                <div class="result-title">🎉 Excellent! Student Will PASS</div>
                <div class="result-message">Based on the analysis, this student shows strong potential for academic success.</div>
                <div class="confidence-meter">
                    <div class="confidence-level">
                        <span class="confidence-label">Prediction Confidence</span>
                        <span class="confidence-value">${result.confidence}%</span>
                    </div>
                    <div class="confidence-bar">
                        <div class="confidence-fill" style="width: ${result.confidence}%"></div>
                    </div>
                </div>
            </div>
        `;
        
        // Trigger celebration for PASS
        triggerCelebration();
    } else {
        resultCard.innerHTML = `
            <div class="result-content result-danger prediction-result">
                <div class="result-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <div class="result-title">⚠️ Attention Needed: Student Might FAIL</div>
                <div class="result-message">This student may need additional support to improve academic performance.</div>
                <div class="confidence-meter">
                    <div class="confidence-level">
                        <span class="confidence-label">Prediction Confidence</span>
                        <span class="confidence-value">${result.confidence}%</span>
                    </div>
                    <div class="confidence-bar">
                        <div class="confidence-fill" style="width: ${result.confidence}%"></div>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Show probability cards with animation
    setTimeout(() => {
        probabilityCards.style.display = 'block';
        document.getElementById('passProbability').textContent = `${result.probability_pass}%`;
        document.getElementById('failProbability').textContent = `${result.probability_fail}%`;
        
        // Animate probability bars
        setTimeout(() => {
            document.getElementById('passProbabilityBar').style.width = `${result.probability_pass}%`;
            document.getElementById('failProbabilityBar').style.width = `${result.probability_fail}%`;
        }, 100);
    }, 500);
    
    // Show input summary
    setTimeout(() => {
        inputSummary.style.display = 'block';
        updateInputSummary(formData);
    }, 800);
    
    // Show recommendations
    setTimeout(() => {
        recommendations.style.display = 'block';
        generateRecommendations(result, formData);
    }, 1100);
    
    // Show action buttons
    setTimeout(() => {
        actionButtons.style.display = 'block';
    }, 1400);
    
    // Update individual chart
    updateIndividualChart(formData, result.prediction, result.probability_pass);
}

// Create Sparkle Effects
function createSparkles() {
    const resultCard = document.getElementById('result');
    for (let i = 0; i < 20; i++) {
        const sparkle = document.createElement('div');
        sparkle.className = 'result-sparkle';
        sparkle.style.left = `${Math.random() * 100}%`;
        sparkle.style.top = `${Math.random() * 100}%`;
        sparkle.style.animationDelay = `${Math.random() * 2}s`;
        resultCard.appendChild(sparkle);
    }
}

// Update Input Summary
function updateInputSummary(formData) {
    const studyTimeLabels = {
        '1': '<2 hours',
        '2': '2-5 hours', 
        '3': '5-10 hours',
        '4': '>10 hours'
    };
    
    document.getElementById('summaryStudyTime').textContent = studyTimeLabels[formData.studytime] || '-';
    document.getElementById('summaryFailures').textContent = formData.failures;
    document.getElementById('summaryAbsences').textContent = formData.absences;
    document.getElementById('summaryG1').textContent = `${formData.G1}/20`;
    document.getElementById('summaryG2').textContent = `${formData.G2}/20`;
    document.getElementById('summaryInternet').textContent = formData.internet === 'yes' ? 'Yes' : 'No';
}

// Generate Recommendations
function generateRecommendations(result, formData) {
    const recommendationsContent = document.getElementById('recommendationsContent');
    let recommendations = [];
    
    if (result.prediction === "PASS") {
        recommendations = [
            {
                icon: 'fas fa-graduation-cap',
                title: 'Maintain Current Performance',
                description: 'Continue with current study habits and attendance patterns.'
            },
            {
                icon: 'fas fa-chart-line',
                title: 'Focus on Excellence',
                description: 'Aim for grades above 15/20 to achieve academic excellence.'
            },
            {
                icon: 'fas fa-users',
                title: 'Peer Leadership',
                description: 'Consider becoming a peer tutor to help other students.'
            },
            {
                icon: 'fas fa-trophy',
                title: 'Advanced Opportunities',
                description: 'Explore advanced courses or extracurricular activities.'
            }
        ];
    } else {
        recommendations = [
            {
                icon: 'fas fa-clock',
                title: 'Increase Study Time',
                description: `Aim for ${parseInt(formData.studytime) < 3 ? '5-10 hours' : 'consistent'} weekly study time.`
            },
            {
                icon: 'fas fa-calendar-check',
                title: 'Improve Attendance',
                description: `Reduce absences from current ${formData.absences} to below 5.`
            },
            {
                icon: 'fas fa-hands-helping',
                title: 'Seek Academic Support',
                description: 'Utilize school tutoring services and teacher office hours.'
            },
            {
                icon: 'fas fa-home',
                title: 'Family Engagement',
                description: 'Discuss academic progress with family for additional support.'
            },
            {
                icon: 'fas fa-book',
                title: 'Foundation Building',
                description: 'Focus on improving fundamental concepts in weaker subjects.'
            }
        ];
        
        // Add specific recommendations based on data
        if (parseInt(formData.G1) < 10 || parseInt(formData.G2) < 10) {
            recommendations.push({
                icon: 'fas fa-star',
                title: 'Grade Improvement',
                description: 'Work on bringing both G1 and G2 grades above 10/20.'
            });
        }
        
        if (parseInt(formData.failures) > 0) {
            recommendations.push({
                icon: 'fas fa-redo',
                title: 'Address Past Failures',
                description: 'Focus on subjects where previous failures occurred.'
            });
        }
    }
    
    // Display recommendations
    recommendationsContent.innerHTML = recommendations.map(rec => `
        <div class="recommendation-item">
            <i class="${rec.icon}"></i>
            <div class="recommendation-content">
                <h6>${rec.title}</h6>
                <p>${rec.description}</p>
            </div>
        </div>
    `).join('');
}

// Reset Prediction Form
function resetPredictionForm() {
    document.getElementById('predictForm').reset();
    document.getElementById('result').innerHTML = `
        <div class="result-placeholder">
            <i class="fas fa-chart-bar"></i>
            <p>Enter student data and click "Predict Performance" to see results</p>
        </div>
    `;
    
    // Hide result sections
    document.getElementById('probabilityCards').style.display = 'none';
    document.getElementById('inputSummary').style.display = 'none';
    document.getElementById('recommendations').style.display = 'none';
    document.getElementById('actionButtons').style.display = 'none';
    
    // Reset chart
    updateIndividualChart({G1: 0, G2: 0}, 'NONE', 0);
    
    showToast('Form reset successfully!', 'info');
}

// Update Individual Chart
function updateIndividualChart(formData, prediction, probability) {
    const ctx = document.getElementById('individualChart').getContext('2d');
    
    if (individualChart) {
        individualChart.destroy();
    }
    
    const predictedGrade = prediction === 'PASS' ? 
        Math.min(20, Math.max(parseInt(formData.G1), parseInt(formData.G2)) + 2) : 
        Math.max(0, Math.min(parseInt(formData.G1), parseInt(formData.G2)) - 3);
    
    individualChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['First Period (G1)', 'Second Period (G2)', 'Predicted Final'],
            datasets: [{
                label: 'Grade Progression',
                data: [parseInt(formData.G1), parseInt(formData.G2), predictedGrade],
                borderColor: prediction === 'PASS' ? '#4caf50' : '#f44336',
                backgroundColor: prediction === 'PASS' ? 
                    'rgba(76, 175, 80, 0.1)' : 
                    'rgba(244, 67, 54, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 20,
                    title: {
                        display: true,
                        text: 'Grade (0-20)'
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Update Recent Entries
function updateRecentEntries(formData, result) {
    const entry = {
        ...formData,
        prediction: result.prediction,
        confidence: result.confidence,
        timestamp: new Date().toLocaleString()
    };
    
    recentEntries.unshift(entry);
    
    // Keep only last 10 entries
    if (recentEntries.length > 10) {
        recentEntries.pop();
    }
    
    // Save to localStorage
    localStorage.setItem('recentEntries', JSON.stringify(recentEntries));
    
    // Update table if on recent section
    if (document.getElementById('recentSection').classList.contains('active')) {
        updateRecentTable();
    }
}

// Update Recent Table
function updateRecentTable() {
    const tableBody = document.querySelector('#recentTable tbody');
    
    if (recentEntries.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align: center; padding: 2rem; color: var(--gray);">
                    <i class="fas fa-inbox" style="font-size: 2em; margin-bottom: 1rem; display: block; opacity: 0.5;"></i>
                    No predictions yet. Make your first prediction to see history here.
                </td>
            </tr>
        `;
        return;
    }
    
    tableBody.innerHTML = recentEntries.map(entry => `
        <tr>
            <td>${entry.timestamp}</td>
            <td>
                <span class="badge 
                    ${entry.studytime == 1 ? 'bg-secondary' : 
                      entry.studytime == 2 ? 'bg-info' : 
                      entry.studytime == 3 ? 'bg-primary' : 'bg-success'}">
                    ${entry.studytime}
                </span>
            </td>
            <td>
                <span class="badge 
                    ${entry.failures == 0 ? 'bg-success' : 
                      entry.failures == 1 ? 'bg-warning' : 'bg-danger'}">
                    ${entry.failures}
                </span>
            </td>
            <td>${entry.absences}</td>
            <td>
                <span class="badge 
                    ${entry.G1 >= 14 ? 'bg-success' : 
                      entry.G1 >= 10 ? 'bg-warning' : 'bg-danger'}">
                    ${entry.G1}
                </span>
            </td>
            <td>
                <span class="badge 
                    ${entry.G2 >= 14 ? 'bg-success' : 
                      entry.G2 >= 10 ? 'bg-warning' : 'bg-danger'}">
                    ${entry.G2}
                </span>
            </td>
            <td>
                ${entry.famsup === 'yes' ? '<i class="fas fa-home" title="Family Support"></i>' : ''}
                ${entry.schoolsup === 'yes' ? '<i class="fas fa-school" title="School Support"></i>' : ''}
                ${entry.internet === 'yes' ? '<i class="fas fa-wifi" title="Internet Access"></i>' : ''}
            </td>
            <td>
                <span class="prediction-badge ${entry.prediction.toLowerCase()}">
                    <i class="fas fa-${entry.prediction === 'PASS' ? 'check' : 'times'}"></i>
                    ${entry.prediction}
                </span>
            </td>
            <td>
                <div class="progress" style="height: 20px;">
                    <div class="progress-bar 
                        ${entry.confidence >= 80 ? 'bg-success' : 
                          entry.confidence >= 60 ? 'bg-warning' : 'bg-danger'}" 
                        style="width: ${entry.confidence}%">
                        ${entry.confidence}%
                    </div>
                </div>
            </td>
        </tr>
    `).join('');
}

// Initialize Charts
function initializeCharts() {
    // Individual chart will be created on prediction
    const individualCtx = document.getElementById('individualChart').getContext('2d');
    
    individualChart = new Chart(individualCtx, {
        type: 'line',
        data: {
            labels: ['G1', 'G2', 'Predicted'],
            datasets: [{
                label: 'Grades',
                data: [0, 0, 0],
                borderColor: '#6c63ff',
                backgroundColor: 'rgba(108, 99, 255, 0.1)',
                borderWidth: 2,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 20
                }
            }
        }
    });
}

// Initialize Class Charts
function initializeClassCharts() {
    // Pass/Fail Chart
    const passFailCtx = document.getElementById('passFailChart').getContext('2d');
    
    if (passFailChart) {
        passFailChart.destroy();
    }
    
    passFailChart = new Chart(passFailCtx, {
        type: 'doughnut',
        data: {
            labels: ['Pass', 'Fail', 'At Risk'],
            datasets: [{
                data: [65, 20, 15],
                backgroundColor: ['#4caf50', '#f44336', '#ff9800'],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
    
    // Study Time Impact Chart
    const studyTimeCtx = document.getElementById('studyTimeChart').getContext('2d');
    
    if (studyTimeChart) {
        studyTimeChart.destroy();
    }
    
    studyTimeChart = new Chart(studyTimeCtx, {
        type: 'bar',
        data: {
            labels: ['1-2h', '2-5h', '5-10h', '10+h'],
            datasets: [{
                label: 'Average Grade',
                data: [8.2, 11.5, 14.8, 16.3],
                backgroundColor: '#6c63ff',
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 20
                }
            }
        }
    });
    
    // Absences Chart
    const absencesCtx = document.getElementById('absencesChart').getContext('2d');
    
    if (absencesChart) {
        absencesChart.destroy();
    }
    
    absencesChart = new Chart(absencesCtx, {
        type: 'bar',
        data: {
            labels: ['0-2', '3-5', '6-10', '11-15', '16+'],
            datasets: [{
                label: 'Number of Students',
                data: [25, 18, 12, 8, 5],
                backgroundColor: '#ff6584',
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
    
    // Grade Comparison Chart
    const gradeComparisonCtx = document.getElementById('gradeComparisonChart').getContext('2d');
    
    if (gradeComparisonChart) {
        gradeComparisonChart.destroy();
    }
    
    gradeComparisonChart = new Chart(gradeComparisonCtx, {
        type: 'radar',
        data: {
            labels: ['Study Time', 'Past Grades', 'Attendance', 'Support', 'Resources'],
            datasets: [{
                label: 'Passing Students',
                data: [85, 78, 82, 75, 80],
                backgroundColor: 'rgba(76, 175, 80, 0.2)',
                borderColor: '#4caf50',
                borderWidth: 2
            }, {
                label: 'At-Risk Students',
                data: [45, 38, 52, 35, 40],
                backgroundColor: 'rgba(244, 67, 54, 0.2)',
                borderColor: '#f44336',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });
}

// Export Table Data
function exportTableData() {
    if (recentEntries.length === 0) {
        showToast('No data available to export', 'warning');
        return;
    }
    
    // Convert to CSV
    const headers = ['Timestamp', 'Study Time', 'Failures', 'Absences', 'G1', 'G2', 'Family Support', 'School Support', 'Internet', 'Paid Classes', 'Prediction', 'Confidence'];
    const csvData = recentEntries.map(entry => [
        entry.timestamp,
        entry.studytime,
        entry.failures,
        entry.absences,
        entry.G1,
        entry.G2,
        entry.famsup,
        entry.schoolsup,
        entry.internet,
        entry.paid,
        entry.prediction,
        `${entry.confidence}%`
    ]);
    
    const csvContent = [headers, ...csvData].map(row => row.join(',')).join('\n');
    
    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `edutrack-data-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('Data exported successfully!', 'success');
}

// Clear History
function clearHistory() {
    if (recentEntries.length === 0) {
        showToast('No history to clear', 'warning');
        return;
    }
    
    if (confirm('Are you sure you want to clear all prediction history? This action cannot be undone.')) {
        recentEntries = [];
        localStorage.removeItem('recentEntries');
        updateRecentTable();
        showToast('History cleared successfully', 'success');
    }
}

// Load Saved Data
function loadSavedData() {
    // Load theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        toggleTheme(); // Apply dark theme
    }
    
    // Load recent entries
    const savedEntries = localStorage.getItem('recentEntries');
    if (savedEntries) {
        recentEntries = JSON.parse(savedEntries);
    }
}

// Show Toast Notification
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
    };
    
    toast.innerHTML = `
        <i class="${icons[type]}"></i>
        <span>${message}</span>
    `;
    
    toastContainer.appendChild(toast);
    
    // Remove toast after 5 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
            toastContainer.removeChild(toast);
        }, 300);
    }, 5000);
}

// Trigger Celebration
function triggerCelebration() {
    // Confetti effect
    confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }
    });
    
    // Additional bursts for better celebration
    setTimeout(() => {
        confetti({
            particleCount: 100,
            angle: 60,
            spread: 55,
            origin: { x: 0 }
        });
        
        confetti({
            particleCount: 100,
            angle: 120,
            spread: 55,
            origin: { x: 1 }
        });
    }, 250);
    
    // Final burst
    setTimeout(() => {
        confetti({
            particleCount: 200,
            spread: 100,
            origin: { y: 0.6 }
        });
    }, 500);
}



// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);