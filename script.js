// Teacher Evaluation System
// Complete Dashboard with Search & Charts

class TeacherEvaluationSystem {
    constructor() {
        this.teachers = [];
        this.evaluations = [];
        this.currentTeacher = null;
        this.charts = {
            avgScores: null,
            distribution: null
        };
        
        this.initialize();
    }

    async initialize() {
        await this.loadData();
        this.setupEventListeners();
        this.updateStats();
    }

    async loadData() {
        try {
            // Load from Google Sheets JSON feed
            const response = await fetch(this.getSheetDataURL());
            const data = await response.json();
            
            this.processSheetData(data);
            this.populateTeacherList();
            
        } catch (error) {
            console.error('Error loading data:', error);
            this.loadSampleData(); // Fallback to sample data
        }
    }

    getSheetDataURL() {
        // REPLACE WITH YOUR PUBLISHED GOOGLE SHEET URL
        return 'https://docs.google.com/spreadsheets/d/e/YOUR-SHEET-ID/pub?output=json';
    }

    processSheetData(data) {
        // Process Google Sheets JSON data
        this.evaluations = [];
        const teacherMap = new Map();
        
        data.feed.entry.forEach(entry => {
            const evaluation = {
                teacher: entry.gsx$teacher?.$t || '',
                yearGroup: entry.gsx$yeargroup?.$t || '',
                question: entry.gsx$question?.$t || '',
                rating: parseInt(entry.gsx$rating?.$t) || 0,
                timestamp: entry.gsx$timestamp?.$t || ''
            };
            
            if (evaluation.teacher && evaluation.rating) {
                this.evaluations.push(evaluation);
                
                if (!teacherMap.has(evaluation.teacher)) {
                    teacherMap.set(evaluation.teacher, {
                        name: evaluation.teacher,
                        yearGroups: new Set(),
                        totalResponses: 0,
                        totalRatings: 0,
                        ratingSum: 0
                    });
                }
                
                const teacher = teacherMap.get(evaluation.teacher);
                teacher.yearGroups.add(evaluation.yearGroup);
                teacher.totalResponses++;
                teacher.totalRatings++;
                teacher.ratingSum += evaluation.rating;
            }
        });
        
        this.teachers = Array.from(teacherMap.values()).map(t => ({
            ...t,
            yearGroups: Array.from(t.yearGroups),
            averageRating: t.ratingSum / t.totalRatings
        }));
        
        this.teachers.sort((a, b) => a.name.localeCompare(b.name));
    }

    loadSampleData() {
        // Sample data for testing
        this.teachers = [
            { name: 'Yoni', yearGroups: ['Year 6', 'Year 7'], totalResponses: 156, averageRating: 3.6 },
            { name: 'Anna', yearGroups: ['Year 4-5', 'Year 6'], totalResponses: 142, averageRating: 3.8 },
            { name: 'Bengtsson', yearGroups: ['Year 7', 'Year 8'], totalResponses: 168, averageRating: 3.4 },
            { name: 'Maria', yearGroups: ['Year 8', 'Year 9'], totalResponses: 134, averageRating: 3.9 },
            { name: 'Ahmed', yearGroups: ['Year 9'], totalResponses: 98, averageRating: 3.5 }
        ];
        
        this.evaluations = [
            { teacher: 'Yoni', question: 'Börjar lektionerna i tid?', rating: 4, count: 78 },
            { teacher: 'Yoni', question: 'Börjar lektionerna i tid?', rating: 3, count: 21 },
            { teacher: 'Yoni', question: 'Får du den hjälpen du behöver?', rating: 4, count: 64 },
            // Add more sample data as needed
        ];
    }

    setupEventListeners() {
        const searchInput = document.getElementById('teacherSearch');
        const searchResults = document.getElementById('searchResults');
        
        searchInput.addEventListener('input', () => {
            const query = searchInput.value.toLowerCase();
            if (query.length < 1) {
                searchResults.style.display = 'none';
                return;
            }
            
            const matches = this.teachers.filter(t => 
                t.name.toLowerCase().includes(query)
            ).slice(0, 5);
            
            this.displaySearchResults(matches);
        });
        
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-container')) {
                searchResults.style.display = 'none';
            }
        });
    }

    displaySearchResults(results) {
        const container = document.getElementById('searchResults');
        container.innerHTML = '';
        
        if (results.length === 0) {
            container.innerHTML = '<div class="search-result-item">No teachers found</div>';
        } else {
            results.forEach(teacher => {
                const div = document.createElement('div');
                div.className = 'search-result-item';
                div.innerHTML = `
                    <i class="fas fa-user"></i>
                    <div>
                        <strong>${teacher.name}</strong>
                        <small style="display: block; color: #666;">
                            ${teacher.yearGroups.join(', ')} • 
                            ${teacher.totalResponses} responses • 
                            Avg: ${teacher.averageRating.toFixed(1)}
                        </small>
                    </div>
                `;
                div.addEventListener('click', () => this.selectTeacher(teacher));
                container.appendChild(div);
            });
        }
        
        container.style.display = 'block';
    }

    selectTeacher(teacher) {
        this.currentTeacher = teacher;
        
        // Update UI
        document.getElementById('teacherProfile').classList.remove('hidden');
        document.getElementById('teacherName').textContent = teacher.name;
        document.getElementById('teacherYearGroups').innerHTML = 
            `<i class="fas fa-graduation-cap"></i> ${teacher.yearGroups.join(', ')}`;
        document.getElementById('teacherResponses').innerHTML = 
            `<i class="fas fa-clipboard-check"></i> ${teacher.totalResponses} Evaluations`;
        
        const overallRating = document.querySelector('.rating-number');
        overallRating.textContent = teacher.averageRating.toFixed(1);
        
        // Update stars
        const starsElement = document.getElementById('ratingStars');
        const fullStars = Math.round(teacher.averageRating);
        starsElement.innerHTML = '★'.repeat(fullStars) + '☆'.repeat(4 - fullStars);
        
        // Load teacher data
        this.loadTeacherData(teacher.name);
        
        // Hide search results
        document.getElementById('searchResults').style.display = 'none';
        document.getElementById('teacherSearch').value = teacher.name;
    }

    loadTeacherData(teacherName) {
        // Filter evaluations for this teacher
        const teacherEvals = this.evaluations.filter(e => e.teacher === teacherName);
        
        // Group by question
        const questions = {};
        teacherEvals.forEach(eval => {
            if (!questions[eval.question]) {
                questions[eval.question] = {
                    name: eval.question,
                    ratings: {1:0, 2:0, 3:0, 4:0},
                    total: 0,
                    sum: 0
                };
            }
            questions[eval.question].ratings[eval.rating]++;
            questions[eval.question].total++;
            questions[eval.question].sum += eval.rating;
        });
        
        // Calculate averages
        Object.values(questions).forEach(q => {
            q.average = q.sum / q.total;
        });
        
        // Update charts
        this.updateCharts(Object.values(questions));
        
        // Update table
        this.updateTable(Object.values(questions));
    }

    updateCharts(questions) {
        // Destroy existing charts
        if (this.charts.avgScores) this.charts.avgScores.destroy();
        if (this.charts.distribution) this.charts.distribution.destroy();
        
        // Average Scores Chart
        const avgCtx = document.getElementById('avgScoresChart').getContext('2d');
        this.charts.avgScores = new Chart(avgCtx, {
            type: 'bar',
            data: {
                labels: questions.map(q => this.truncateText(q.name, 30)),
                datasets: [{
                    label: 'Average Rating (1-4)',
                    data: questions.map(q => q.average),
                    backgroundColor: 'rgba(102, 126, 234, 0.8)',
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 4,
                        grid: { color: '#f0f0f0' }
                    }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
        
        // Rating Distribution Chart
        const distCtx = document.getElementById('ratingDistributionChart').getContext('2d');
        this.charts.distribution = new Chart(distCtx, {
            type: 'doughnut',
            data: {
                labels: ['Rating 1', 'Rating 2', 'Rating 3', 'Rating 4'],
                datasets: [{
                    data: [
                        questions.reduce((sum, q) => sum + q.ratings[1], 0),
                        questions.reduce((sum, q) => sum + q.ratings[2], 0),
                        questions.reduce((sum, q) => sum + q.ratings[3], 0),
                        questions.reduce((sum, q) => sum + q.ratings[4], 0)
                    ],
                    backgroundColor: [
                        '#ff4444',
                        '#ffbb33',
                        '#00C851',
                        '#33b5e5'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });
    }

    updateTable(questions) {
        const tbody = document.getElementById('tableBody');
        tbody.innerHTML = '';
        
        questions.forEach(q => {
            const row = tbody.insertRow();
            row.innerHTML = `
                <td><strong>${q.name}</strong></td>
                <td>${q.ratings[1]}</td>
                <td>${q.ratings[2]}</td>
                <td>${q.ratings[3]}</td>
                <td>${q.ratings[4]}</td>
                <td><strong>${q.total}</strong></td>
                <td><strong style="color: ${this.getScoreColor(q.average)}">${q.average.toFixed(1)}</strong></td>
            `;
        });
    }

    updateStats() {
        document.getElementById('totalTeachers').textContent = this.teachers.length;
        
        const totalEvals = this.evaluations.length;
        document.getElementById('totalEvals').textContent = totalEvals;
        
        const schoolAvg = this.teachers.reduce((sum, t) => sum + t.averageRating, 0) / this.teachers.length;
        document.getElementById('schoolAvg').textContent = schoolAvg.toFixed(1);
    }

    populateTeacherList() {
        // Store for search
        console.log(`Loaded ${this.teachers.length} teachers`);
    }

    truncateText(text, maxLength) {
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }

    getScoreColor(score) {
        if (score >= 3.5) return '#00C851';
        if (score >= 2.5) return '#ffbb33';
        return '#ff4444';
    }
}

// Initialize the system
document.addEventListener('DOMContentLoaded', () => {
    window.teacherSystem = new TeacherEvaluationSystem();
});

// Export functions
function exportAsPDF() {
    window.print();
}

function exportAsExcel() {
    const teacher = window.teacherSystem.currentTeacher;
    if (!teacher) return;
    
    // Create CSV
    const rows = [
        ['Question', 'Rating 1', 'Rating 2', 'Rating 3', 'Rating 4', 'Total', 'Average']
    ];
    
    // Add table data
    const tableRows = document.querySelectorAll('#tableBody tr');
    tableRows.forEach(row => {
        const rowData = [];
        row.querySelectorAll('td').forEach(cell => {
            rowData.push(cell.textContent);
        });
        rows.push(rowData);
    });
    
    // Convert to CSV
    const csv = rows.map(row => row.join(',')).join('\n');
    
    // Download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${teacher.name}_evaluation.csv`;
    a.click();
}
