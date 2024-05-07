document.addEventListener('DOMContentLoaded', function () {
    const generateButton = document.getElementById('generateButton');
    const testButton = document.getElementById('testButton');
    const journalTextarea = document.getElementById('journalTextarea');
    const taskList = document.getElementById('taskList');
    const suggestionIntro = document.getElementById('suggestionIntro');
    var doneWaiting = false;

    testButton.addEventListener('click', async () => {
        journalTextarea.value = document.getElementById('sampleJournal').innerHTML;
    });


    generateButton.addEventListener('click', async () => {
        const journalText = journalTextarea.value.trim();
        if (journalText === '') {
            alert('Please add your text.');
            return;
        }

        // Show waiting animation
        suggestionIntro.textContent = 'Waiting';

        // Define a function to update the waiting animation
        function updateWaitingAnimation() {
            setTimeout(() => {
                if (doneWaiting) return; // Check if the waiting element still exists
                const text = suggestionIntro.textContent;
                suggestionIntro.textContent = suggestionIntro.textContent + '.';
                updateWaitingAnimation(); // Recursively call the function to continue updating the animation
            }, 500); // Update every 500 milliseconds (adjust as needed)
        }

        // Start updating the waiting animation
        updateWaitingAnimation();

        try {
            const response = await fetch('http://localhost:8000/suggest', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 'content': journalText })
            });
            if (!response.ok) {
                throw new Error('Failed to fetch suggestions.');
            }
            const data = await response.json();
            doneWaiting = true;
            suggestionIntro.textContent = '';
            displaySuggestions(data);
        } catch (error) {
            console.error('Error fetching suggestions:', error.message);
            alert('Failed to fetch suggestions.');
        }
    });

    async function exportTask(taskId) {
        try {
            const response = await fetch(`http://localhost:8000/tasks/${taskId}/export`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ taskId })
            });
            if (!response.ok) {
                throw new Error('Failed to export task.');
            }
            alert('Task exported successfully.');
        } catch (error) {
            console.error('Error exporting task:', error.message);
            alert('Failed to export task.');
        }
    }

     function displaySuggestions(suggestions) {
        suggestionIntro.innerHTML = '';
        taskTable.style.display = "block";
        taskList.innerHTML = ''; // Clear existing tasks
        suggestions.forEach(suggestion => {
            const row = document.createElement('tr');
            const titleCell = document.createElement('td');
            titleCell.textContent = suggestion.title;

            const descriptionCell = document.createElement('td');
            descriptionCell.textContent = suggestion.description;

            const actionCell = document.createElement('td');
            const createButton = document.createElement('button');
            createButton.textContent = 'Create';
            createButton.addEventListener('click', () => {
                exportTask(suggestion.id);
            });
            actionCell.appendChild(createButton);
            row.appendChild(titleCell);
            row.appendChild(descriptionCell);
            row.appendChild(actionCell);
            taskList.appendChild(row);
        });
    }
});
