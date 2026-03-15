class InesBotSearcher {
    constructor() {
        this.words = [];
        // ONLY source - your specific URL
        this.wordListUrl = 'https://raw.githubusercontent.com/hoshiyoshi-cpu/915247839457/main/yinglish';
        
        this.initEventListeners();
    }

    initEventListeners() {
        // Single search button
        document.getElementById('search-btn').addEventListener('click', () => this.performSearch());
        document.getElementById('load-words-btn').addEventListener('click', () => this.loadWordsFromURL());
        document.getElementById('clear-btn').addEventListener('click', () => this.clearAll());
        
        // Allow Enter key to trigger search
        document.getElementById('prefix-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.performSearch();
        });
        document.getElementById('suffix-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.performSearch();
        });
    }

    async loadWordsFromURL() {
        this.showLoading('Loading words from your list...');
        
        try {
            console.log('Fetching from:', this.wordListUrl);
            
            const response = await fetch(this.wordListUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'text/plain',
                }
            });
            
            console.log('Response status:', response.status);
            
            if (!response.ok) {
                throw new Error(`Failed to load: ${response.status} ${response.statusText}`);
            }
            
            const text = await response.text();
            console.log('First 100 chars:', text.substring(0, 100));
            
            if (!text || text.length === 0) {
                throw new Error('Word list file is empty');
            }
            
            // Split by new lines and clean up
            const words = text.split('\n')
                .map(word => word.trim())
                .filter(word => word.length > 0);
            
            if (words.length === 0) {
                throw new Error('No words found in the file');
            }
            
            // Remove duplicates and sort
            this.words = [...new Set(words)];
            
            // Update word count
            document.getElementById('word-count').textContent = this.words.length;
            
            // Show success message
            this.showSuccess(`✅ Successfully loaded ${this.words.length} words!`);
            document.getElementById('result-count').textContent = '0';
            
        } catch (error) {
            console.error('Error loading words:', error);
            this.showError(`Failed to load words: ${error.message}`);
            this.words = []; // Ensure words array is empty on failure
            document.getElementById('word-count').textContent = '0';
        }
    }

    performSearch() {
        if (this.words.length === 0) {
            this.showError('No words loaded. Click "Load Words" first.');
            return;
        }

        const prefix = document.getElementById('prefix-input').value.toLowerCase().trim();
        const suffix = document.getElementById('suffix-input').value.toLowerCase().trim();
        
        const sortOption = document.querySelector('input[name="sort"]:checked').value;
        
        let criteria = [];
        if (prefix) criteria.push(`starts with '${prefix}'`);
        if (suffix) criteria.push(`ends with '${suffix}'`);
        
        // Filter words based ONLY on current filters
        let results = this.words.filter(word => {
            const wordLower = word.toLowerCase();
            
            if (prefix && !wordLower.startsWith(prefix)) return false;
            if (suffix && !wordLower.endsWith(suffix)) return false;
            
            return true;
        });
        
        // Sort results based on selected option
        if (sortOption === 'shortest') {
            results.sort((a, b) => a.length - b.length);
        } else if (sortOption === 'longest') {
            results.sort((a, b) => b.length - a.length);
        } else if (sortOption === 'alpha') {
            results.sort((a, b) => a.localeCompare(b));
        }
        // 'none' keeps original order (as loaded from file)
        
        // Update result count
        document.getElementById('result-count').textContent = results.length;
        
        // Display results
        this.displayResults(results, criteria);
    }

    displayResults(results, criteria) {
        const resultsBox = document.getElementById('results-box');
        
        if (results.length === 0) {
            let message = 'No words match your criteria';
            if (criteria.length > 0) {
                message += ` (${criteria.join(' and ')})`;
            }
            resultsBox.innerHTML = `<p class="placeholder-text">🔍 ${message}</p>`;
            return;
        }
        
        let html = '';
        const displayResults = results.slice(0, 20); // Show top 20 only
        
        // Add summary header
        if (criteria.length > 0) {
            html += `<div class="result-item" style="background: #e3f2fd; font-weight: bold; border-radius: 8px; margin-bottom: 10px;">
                Found ${results.length} words matching: ${criteria.join(' and ')}
            </div>`;
        } else {
            html += `<div class="result-item" style="background: #f5f5f5; font-weight: bold; border-radius: 8px; margin-bottom: 10px;">
                Showing ${results.length} words (no filters)
            </div>`;
        }
        
        displayResults.forEach((word, index) => {
            const prefix = document.getElementById('prefix-input').value.toLowerCase().trim();
            const suffix = document.getElementById('suffix-input').value.toLowerCase().trim();
            
            let matches = [];
            if (prefix && word.toLowerCase().startsWith(prefix)) {
                matches.push(`starts with '${prefix}'`);
            }
            if (suffix && word.toLowerCase().endsWith(suffix)) {
                matches.push(`ends with '${suffix}'`);
            }
            
            const matchInfo = matches.length > 0 ? `<span class="result-highlight"> (${matches.join(', ')})</span>` : '';
            
            html += `
                <div class="result-item">
                    <span class="result-number">${index + 1}.</span>
                    ${word}${matchInfo}
                    <span class="result-length">[${word.length}]</span>
                </div>
            `;
        });
        
        if (results.length > 20) {
            html += `
                <div class="result-item" style="color: #6c757d; font-style: italic; background: #f8f9fa;">
                    ... and ${results.length - 20} more results (showing top 20 only)
                </div>
            `;
        }
        
        resultsBox.innerHTML = html;
    }

    showSuccess(message) {
        const resultsBox = document.getElementById('results-box');
        resultsBox.innerHTML = `<div class="success-message">${message}</div>`;
    }

    showError(message) {
        const resultsBox = document.getElementById('results-box');
        resultsBox.innerHTML = `<div class="error-message">❌ ${message}</div>`;
    }

    showLoading(message) {
        const resultsBox = document.getElementById('results-box');
        resultsBox.innerHTML = `<div class="loading-message">⏳ ${message}</div>`;
    }

    clearAll() {
        document.getElementById('results-box').innerHTML = '<p class="placeholder-text">Click "Load Words" to begin...</p>';
        document.getElementById('prefix-input').value = '';
        document.getElementById('suffix-input').value = '';
        document.querySelector('input[name="sort"][value="none"]').checked = true;
        document.getElementById('result-count').textContent = '0';
        // Clear loaded words as well
        this.words = [];
        document.getElementById('word-count').textContent = '0';
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new InesBotSearcher();
});