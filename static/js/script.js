// Enhanced Student Performance Tracker - Individual, Batch & Recent Only

// Global Variables
let individualChart, batchPredictionChart, batchStudyTimeChart, batchAbsencesChart, batchGradeChart, featureCorrelationChart;
let recentEntries = [];
let currentTheme = 'light';
let currentPredictionData = null;
let currentBatchResults = null;

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
    document.getElementById('recentBtn').addEventListener('click', () => switchSection('recent'));
    
    // Theme toggle
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    
    // Form handling
    document.getElementById('predictForm').addEventListener('submit', handlePrediction);
    
    // Action buttons
    document.getElementById('newPredictionBtn').addEventListener('click', resetPredictionForm);
    document.getElementById('batchAnalysisBtn').addEventListener('click', () => switchSection('batch'));
    
    // Batch analysis
    document.getElementById('batchForm').addEventListener('submit', handleBatchAnalysis);
    document.getElementById('downloadSampleBtn').addEventListener('click', downloadSampleCSV);
    document.getElementById('downloadResultsBtn').addEventListener('click', downloadBatchResults);
    document.getElementById('exportPredictionsBtn').addEventListener('click', function() {
        if (!currentBatchResults) {
            showToast('No predictions available to export', 'warning');
            return;
        }
        downloadBatchResults();
    });
    
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
        // Make API call to backend
        const response = await fetch('/predict', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error('Prediction failed');
        }
        
        const result = await response.json();
        
        // Display results
        displayPredictionResult(result, data);
        
        // Update recent entries
        updateRecentEntries(data, result);
        
        // Show success notification
        showToast('Prediction completed successfully!', 'success');
        
    } catch (error) {
        console.error('Prediction error:', error);
        // Fallback to simulated prediction if backend fails
        const simulatedResult = await simulatePrediction(data);
        displayPredictionResult(simulatedResult, data);
        updateRecentEntries(data, simulatedResult);
        showToast('Using simulated prediction (backend unavailable)', 'warning');
    } finally {
        // Remove loading state
        button.classList.remove('loading');
    }
}

// Simulate Prediction (Fallback when backend is unavailable)
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

// Handle Batch Analysis
async function handleBatchAnalysis(e) {
    e.preventDefault();
    
    const form = e.target;
    const fileInput = document.getElementById('file');
    const button = form.querySelector('button[type="submit"]');
    const batchResults = document.getElementById('batchResults');
    const batchAnalytics = document.getElementById('batchAnalytics');
    const originalText = button.innerHTML;
    
    if (!fileInput.files.length) {
        showToast('Please select a CSV file to upload', 'error');
        return;
    }
    
    // Show loading state
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing...';
    button.disabled = true;
    batchResults.style.display = 'none';
    batchAnalytics.style.display = 'none';
    
    try {
        const formData = new FormData(form);
        
        const response = await fetch('/predict_batch', {
            method: 'POST',
            body: formData
        });
        
        if (response.ok) {
            // Store the blob for download
            const blob = await response.blob();
            currentBatchResults = blob;
            
            // Parse the CSV for analytics
            const csvText = await blob.text();
            const analyticsData = parseBatchResults(csvText);
            
            // Display analytics
            displayBatchAnalytics(analyticsData);
            
            // Show success message
            batchResults.style.display = 'block';
            batchAnalytics.style.display = 'block';
            showToast('Batch analysis completed successfully!', 'success');
            
            // Reset form
            form.reset();
        } else {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Analysis failed');
        }
    } catch (error) {
        console.error('Batch analysis error:', error);
        
        // Fallback: Create simulated batch results and analytics
        if (fileInput.files.length) {
            const file = fileInput.files[0];
            const simulatedResults = await simulateBatchAnalysis(file);
            currentBatchResults = simulatedResults;
            
            // Parse simulated results for analytics
            const csvText = await simulatedResults.text();
            const analyticsData = parseBatchResults(csvText);
            
            // Display analytics
            displayBatchAnalytics(analyticsData);
            
            batchResults.style.display = 'block';
            batchAnalytics.style.display = 'block';
            showToast('Using simulated analysis (backend unavailable)', 'warning');
        } else {
            showToast(`Analysis failed: ${error.message}`, 'error');
        }
    } finally {
        // Reset button state
        button.innerHTML = originalText;
        button.disabled = false;
    }
}

// Simulate Batch Analysis (Fallback)
async function simulateBatchAnalysis(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            // Simulate processing delay
            setTimeout(() => {
                // Create simulated results CSV
                const csvContent = `studytime,failures,absences,G1,G2,famsup,schoolsup,internet,paid,prediction,pass_probability,fail_probability,confidence
2,0,4,12,13,yes,no,yes,no,PASS,85.2,14.8,85.2
3,1,2,15,16,no,yes,yes,no,PASS,92.1,7.9,92.1
1,2,10,8,7,yes,no,no,yes,FAIL,35.6,64.4,64.4
4,0,1,18,17,yes,no,yes,no,PASS,96.8,3.2,96.8
2,1,5,11,12,no,no,yes,no,FAIL,42.3,57.7,57.7
3,0,3,14,15,yes,yes,yes,no,PASS,88.5,11.5,88.5
1,3,8,9,8,no,no,no,no,FAIL,28.9,71.1,71.1
4,0,2,16,17,yes,no,yes,yes,PASS,94.2,5.8,94.2
2,2,6,10,9,yes,yes,yes,no,FAIL,38.7,61.3,61.3
3,1,4,13,14,no,yes,yes,no,PASS,79.6,20.4,79.6`;
                
                const blob = new Blob([csvContent], { type: 'text/csv' });
                resolve(blob);
            }, 2000);
        };
        
        reader.readAsText(file);
    });
}

// Parse Batch Results CSV
function parseBatchResults(csvText) {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',');
    const students = [];
    
    for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim() === '') continue;
        
        const values = lines[i].split(',');
        const student = {};
        
        headers.forEach((header, index) => {
            student[header.trim()] = values[index] ? values[index].trim() : '';
        });
        
        students.push(student);
    }
    
    return students;
}

// Display Batch Analytics
function displayBatchAnalytics(students) {
    // Calculate statistics
    const totalStudents = students.length;
    const predictedPass = students.filter(s => s.prediction === 'PASS').length;
    const atRiskStudents = students.filter(s => s.prediction === 'FAIL').length;
    const passRate = ((predictedPass / totalStudents) * 100).toFixed(1);
    const atRiskRate = ((atRiskStudents / totalStudents) * 100).toFixed(1);
    
    const avgConfidence = students.reduce((sum, s) => sum + parseFloat(s.confidence || 0), 0) / totalStudents;
    const avgStudyTime = students.reduce((sum, s) => sum + parseFloat(s.studytime || 0), 0) / totalStudents;
    const avgAbsences = students.reduce((sum, s) => sum + parseFloat(s.absences || 0), 0) / totalStudents;
    
    // Update summary stats
    document.getElementById('totalStudents').textContent = totalStudents;
    document.getElementById('predictedPass').textContent = predictedPass;
    document.getElementById('atRiskStudents').textContent = atRiskStudents;
    document.getElementById('passRate').textContent = `${passRate}%`;
    document.getElementById('atRiskRate').textContent = `${atRiskRate}%`;
    document.getElementById('avgConfidence').textContent = `${avgConfidence.toFixed(1)}%`;
    document.getElementById('avgStudyTime').textContent = `${avgStudyTime.toFixed(1)}h`;
    document.getElementById('avgAbsences').textContent = avgAbsences.toFixed(1);
    
    // Generate insights
    generateQuickInsights(students);
    
    // Display at-risk students
    displayAtRiskStudents(students);
    
    // Update charts
    updateBatchCharts(students);
    
    // Update predictions table
    updatePredictionsTable(students);
    
    // Generate risk analysis
    generateRiskAnalysis(students);
}

// Generate Quick Insights
function generateQuickInsights(students) {
    const insightsContainer = document.getElementById('quickInsights');
    const insights = [];
    
    // Calculate various metrics
    const highPerformers = students.filter(s => 
        s.prediction === 'PASS' && parseFloat(s.confidence) > 80
    ).length;
    
    const lowStudyHighPass = students.filter(s => 
        s.prediction === 'PASS' && parseFloat(s.studytime) <= 2
    ).length;
    
    const highAbsencePass = students.filter(s => 
        s.prediction === 'PASS' && parseFloat(s.absences) > 10
    ).length;
    
    const avgG1 = students.reduce((sum, s) => sum + parseFloat(s.G1 || 0), 0) / students.length;
    const avgG2 = students.reduce((sum, s) => sum + parseFloat(s.G2 || 0), 0) / students.length;
    
    // Generate insights based on data
    if (highPerformers > students.length * 0.3) {
        insights.push({
            icon: 'fas fa-trophy',
            color: 'success',
            title: 'Strong Performance Cluster',
            description: `${highPerformers} students show excellent performance with high confidence scores.`
        });
    }
    
    if (lowStudyHighPass > 0) {
        insights.push({
            icon: 'fas fa-lightbulb',
            color: 'warning',
            title: 'Efficient Learners',
            description: `${lowStudyHighPass} students pass despite low study time - consider their learning strategies.`
        });
    }
    
    if (highAbsencePass > 0) {
        insights.push({
            icon: 'fas fa-user-clock',
            color: 'info',
            title: 'Resilient Performers',
            description: `${highAbsencePass} students maintain passing grades despite high absence rates.`
        });
    }
    
    if (avgG2 > avgG1) {
        insights.push({
            icon: 'fas fa-chart-line',
            color: 'primary',
            title: 'Positive Trend',
            description: 'Average second period grades are higher than first period, showing improvement.'
        });
    }
    
    // Default insights if no specific patterns
    if (insights.length === 0) {
        insights.push(
            {
                icon: 'fas fa-chart-bar',
                color: 'primary',
                title: 'Balanced Distribution',
                description: 'Student performance shows a typical distribution across various metrics.'
            },
            {
                icon: 'fas fa-clock',
                color: 'info',
                title: 'Study Time Impact',
                description: 'Study time appears to be a significant factor in student performance.'
            }
        );
    }
    
    // Display insights
    insightsContainer.innerHTML = insights.map(insight => `
        <div class="insight-item">
            <i class="${insight.icon} text-${insight.color}"></i>
            <div>
                <strong>${insight.title}</strong>
                <p class="mb-0">${insight.description}</p>
            </div>
        </div>
    `).join('');
}

// Display At-Risk Students
function displayAtRiskStudents(students) {
    const atRiskList = document.getElementById('atRiskList');
    const atRiskStudents = students.filter(s => s.prediction === 'FAIL')
                                  .sort((a, b) => parseFloat(b.confidence) - parseFloat(a.confidence))
                                  .slice(0, 5); // Top 5 most confident failures
    
    if (atRiskStudents.length === 0) {
        atRiskList.innerHTML = '<p class="text-muted">No at-risk students identified.</p>';
        return;
    }
    
    atRiskList.innerHTML = atRiskStudents.map(student => `
        <div class="at-risk-item">
            <div class="student-info">
                <strong>Student ${students.indexOf(student) + 1}</strong>
                <div class="risk-factors">
                    <small class="text-muted">
                        Study: ${student.studytime}h • 
                        Absences: ${student.absences} • 
                        G1: ${student.G1} • 
                        G2: ${student.G2}
                    </small>
                </div>
            </div>
            <div class="risk-score">
                <span class="confidence-badge ${parseFloat(student.confidence) > 70 ? 'high' : 'medium'}">
                    ${student.confidence}% confidence
                </span>
            </div>
        </div>
    `).join('');
}

// Update Batch Charts
function updateBatchCharts(students) {
    updatePredictionDistributionChart(students);
    updateStudyTimeImpactChart(students);
    updateAbsencesAnalysisChart(students);
    updateGradeComparisonChart(students);
    updateFeatureCorrelationChart(students);
}

// Prediction Distribution Chart
function updatePredictionDistributionChart(students) {
    const ctx = document.getElementById('batchPredictionChart').getContext('2d');
    
    if (batchPredictionChart) {
        batchPredictionChart.destroy();
    }
    
    const passCount = students.filter(s => s.prediction === 'PASS').length;
    const failCount = students.filter(s => s.prediction === 'FAIL').length;
    
    batchPredictionChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Pass', 'Fail'],
            datasets: [{
                data: [passCount, failCount],
                backgroundColor: ['#4caf50', '#f44336'],
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
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.raw;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${context.label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Study Time Impact Chart
function updateStudyTimeImpactChart(students) {
    const ctx = document.getElementById('batchStudyTimeChart').getContext('2d');
    
    if (batchStudyTimeChart) {
        batchStudyTimeChart.destroy();
    }
    
    const studyTimeLabels = ['1-2h', '2-5h', '5-10h', '10+h'];
    const passRates = [1, 2, 3, 4].map(hours => {
        const studentsInGroup = students.filter(s => parseInt(s.studytime) === hours);
        if (studentsInGroup.length === 0) return 0;
        const passCount = studentsInGroup.filter(s => s.prediction === 'PASS').length;
        return (passCount / studentsInGroup.length) * 100;
    });
    
    batchStudyTimeChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: studyTimeLabels,
            datasets: [{
                label: 'Pass Rate (%)',
                data: passRates,
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
                    max: 100,
                    title: {
                        display: true,
                        text: 'Pass Rate (%)'
                    }
                }
            }
        }
    });
}

// Absences Analysis Chart
function updateAbsencesAnalysisChart(students) {
    const ctx = document.getElementById('batchAbsencesChart').getContext('2d');
    
    if (batchAbsencesChart) {
        batchAbsencesChart.destroy();
    }
    
    const absenceRanges = ['0-2', '3-5', '6-10', '11-15', '16+'];
    const passRatesByAbsence = absenceRanges.map(range => {
        const [min, max] = range.split('-').map(Number);
        const studentsInRange = students.filter(s => {
            const absences = parseInt(s.absences);
            if (range === '16+') return absences >= 16;
            return absences >= min && absences <= max;
        });
        if (studentsInRange.length === 0) return 0;
        const passCount = studentsInRange.filter(s => s.prediction === 'PASS').length;
        return (passCount / studentsInRange.length) * 100;
    });
    
    batchAbsencesChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: absenceRanges,
            datasets: [{
                label: 'Pass Rate by Absences',
                data: passRatesByAbsence,
                borderColor: '#ff6584',
                backgroundColor: 'rgba(255, 101, 132, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Pass Rate (%)'
                    }
                }
            }
        }
    });
}

// Grade Comparison Chart
function updateGradeComparisonChart(students) {
    const ctx = document.getElementById('batchGradeChart').getContext('2d');
    
    if (batchGradeChart) {
        batchGradeChart.destroy();
    }
    
    const passingStudents = students.filter(s => s.prediction === 'PASS');
    const failingStudents = students.filter(s => s.prediction === 'FAIL');
    
    batchGradeChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['G1 Average', 'G2 Average'],
            datasets: [
                {
                    label: 'Passing Students',
                    data: [
                        passingStudents.reduce((sum, s) => sum + parseFloat(s.G1), 0) / passingStudents.length,
                        passingStudents.reduce((sum, s) => sum + parseFloat(s.G2), 0) / passingStudents.length
                    ],
                    backgroundColor: '#4caf50'
                },
                {
                    label: 'Failing Students',
                    data: [
                        failingStudents.reduce((sum, s) => sum + parseFloat(s.G1), 0) / failingStudents.length,
                        failingStudents.reduce((sum, s) => sum + parseFloat(s.G2), 0) / failingStudents.length
                    ],
                    backgroundColor: '#f44336'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 20,
                    title: {
                        display: true,
                        text: 'Average Grade'
                    }
                }
            }
        }
    });
}

// Feature Correlation Chart
function updateFeatureCorrelationChart(students) {
    const ctx = document.getElementById('featureCorrelationChart').getContext('2d');
    
    if (featureCorrelationChart) {
        featureCorrelationChart.destroy();
    }
    
    // Calculate correlation scores (simplified)
    const features = ['Study Time', 'Past Grades', 'Attendance', 'Support', 'Resources'];
    const passingScores = [85, 78, 82, 75, 80]; // These would be calculated from actual data
    const failingScores = [45, 38, 52, 35, 40];
    
    featureCorrelationChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: features,
            datasets: [
                {
                    label: 'High Correlation with Passing',
                    data: passingScores,
                    backgroundColor: 'rgba(76, 175, 80, 0.2)',
                    borderColor: '#4caf50',
                    borderWidth: 2
                },
                {
                    label: 'High Correlation with Failing',
                    data: failingScores,
                    backgroundColor: 'rgba(244, 67, 54, 0.2)',
                    borderColor: '#f44336',
                    borderWidth: 2
                }
            ]
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

// Update Predictions Table
function updatePredictionsTable(students) {
    const tableBody = document.querySelector('#batchPredictionsTable tbody');
    
    tableBody.innerHTML = students.slice(0, 10).map((student, index) => `
        <tr>
            <td>Student ${index + 1}</td>
            <td>${student.studytime}h</td>
            <td>${student.G1}/20</td>
            <td>${student.G2}/20</td>
            <td>
                <span class="prediction-badge ${student.prediction.toLowerCase()}">
                    <i class="fas fa-${student.prediction === 'PASS' ? 'check' : 'times'}"></i>
                    ${student.prediction}
                </span>
            </td>
            <td>
                <div class="progress" style="height: 20px;">
                    <div class="progress-bar 
                        ${parseFloat(student.confidence) >= 80 ? 'bg-success' : 
                          parseFloat(student.confidence) >= 60 ? 'bg-warning' : 'bg-danger'}" 
                        style="width: ${student.confidence}%">
                        ${student.confidence}%
                    </div>
                </div>
            </td>
            <td>
                <span class="status-badge ${student.prediction === 'PASS' ? 'safe' : 'risk'}">
                    ${student.prediction === 'PASS' ? 'Safe' : 'At Risk'}
                </span>
            </td>
        </tr>
    `).join('');
    
    // Show message if there are more students
    if (students.length > 10) {
        tableBody.innerHTML += `
            <tr>
                <td colspan="7" class="text-center text-muted">
                    ... and ${students.length - 10} more students. Download full results for complete data.
                </td>
            </tr>
        `;
    }
}

// Generate Risk Analysis
function generateRiskAnalysis(students) {
    const riskIndicators = document.getElementById('riskIndicators');
    const interventionRecommendations = document.getElementById('interventionRecommendations');
    
    const failingStudents = students.filter(s => s.prediction === 'FAIL');
    
    // Calculate risk factors
    const lowStudyRisk = failingStudents.filter(s => parseInt(s.studytime) <= 2).length;
    const highAbsenceRisk = failingStudents.filter(s => parseInt(s.absences) > 10).length;
    const pastFailureRisk = failingStudents.filter(s => parseInt(s.failures) > 0).length;
    const lowGradeRisk = failingStudents.filter(s => parseInt(s.G1) < 10 || parseInt(s.G2) < 10).length;
    
    // Display risk indicators
    riskIndicators.innerHTML = `
        <div class="risk-factor">
            <i class="fas fa-clock text-warning"></i>
            <span>Low Study Time: ${lowStudyRisk} students</span>
        </div>
        <div class="risk-factor">
            <i class="fas fa-calendar-times text-danger"></i>
            <span>High Absences: ${highAbsenceRisk} students</span>
        </div>
        <div class="risk-factor">
            <i class="fas fa-times-circle text-danger"></i>
            <span>Past Failures: ${pastFailureRisk} students</span>
        </div>
        <div class="risk-factor">
            <i class="fas fa-star text-warning"></i>
            <span>Low Grades: ${lowGradeRisk} students</span>
        </div>
    `;
    
    // Generate recommendations
    const recommendations = [];
    
    if (lowStudyRisk > 0) {
        recommendations.push('Implement study skills workshops and time management training');
    }
    
    if (highAbsenceRisk > 0) {
        recommendations.push('Develop attendance improvement plans and early warning systems');
    }
    
    if (pastFailureRisk > 0) {
        recommendations.push('Provide targeted academic support and remediation programs');
    }
    
    if (lowGradeRisk > 0) {
        recommendations.push('Offer tutoring services and personalized learning plans');
    }
    
    if (recommendations.length === 0) {
        recommendations.push('Monitor student progress and maintain current support systems');
    }
    
    interventionRecommendations.innerHTML = recommendations.map(rec => `
        <div class="recommendation-item">
            <i class="fas fa-check-circle text-success"></i>
            <span>${rec}</span>
        </div>
    `).join('');
}

// Download Sample CSV
function downloadSampleCSV() {
    const sampleData = `studytime,failures,absences,G1,G2,famsup,schoolsup,internet,paid
2,0,4,12,13,yes,no,yes,no
3,1,2,15,16,no,yes,yes,no
1,2,10,8,7,yes,no,no,yes
4,0,1,18,17,yes,no,yes,no`;
    
    const blob = new Blob([sampleData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_student_data.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    showToast('Sample CSV downloaded!', 'success');
}

// Download Batch Results
function downloadBatchResults() {
    if (!currentBatchResults) {
        showToast('No results available to download', 'error');
        return;
    }
    
    const url = window.URL.createObjectURL(currentBatchResults);
    const a = document.createElement('a');
    a.href = url;
    a.download = `batch_predictions_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    showToast('Results downloaded successfully!', 'success');
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
    // Clear existing sparkles
    const existingSparkles = resultCard.querySelectorAll('.result-sparkle');
    existingSparkles.forEach(sparkle => sparkle.remove());
    
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
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `edutrack-data-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
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