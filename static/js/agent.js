
        async function getRecommendations() {
            const queryInput = document.getElementById('queryInput');
            const loading = document.getElementById('loading');
            const recommendations = document.getElementById('recommendations');
            const askButton = document.getElementById('askButton');

            const query = queryInput.value.trim();
            if (!query) {
                alert('Please enter a query');
                return;
            }

            // Show loading state and clear previous results
            loading.classList.remove('hidden');
            recommendations.classList.add('hidden');
            recommendations.innerHTML = '';
            askButton.disabled = true;
            askButton.classList.add('opacity-50');
            
            try {
                const response = await fetch(
                    `/agent/clothing-recommendations/?query=${encodeURIComponent(query)}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                        }
                    }
                );

                if (response.status === 401) {
                    window.location.href = '/login';
                    return;
                }

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.detail || 'Failed to get recommendations');
                }

                const data = await response.json();

                if (data.status === 'error') {
                    throw new Error(data.message);
                }

                // Clean and format the message
                let formattedMessage = data.message || '';
                formattedMessage = formattedMessage
                    .replace(/\\\\/g, '')
                    .replace(/\\n/g, '\n')
                    .replace(/\\/g, '')
                    .trim();

                // Convert markdown and newlines to HTML
                formattedMessage = formattedMessage
                    .split('\n')
                    .filter(line => line.trim() !== '')
                    .map(line => line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'))  //  Keep the strong tags
                    .join('<br>');

                // Display the formatted message
                recommendations.classList.remove('hidden');
                if (formattedMessage) {
                    recommendations.innerHTML = `
                        <div class="prose prose-lg max-w-none">
                            ${formattedMessage}
                        </div>
                    `;
                } else {
                    recommendations.innerHTML = `
                        <div class="text-gray-500">
                            No recommendations available at this time.
                        </div>
                    `;
                }

            } catch (error) {
                console.error('Error:', error);
                recommendations.classList.remove('hidden');
                recommendations.innerHTML = `
                    <div class="bg-red-50 text-red-600 p-4 rounded-lg">
                        ${error.message || 'An error occurred while getting recommendations'}
                    </div>
                `;
            } finally {
                loading.classList.add('hidden');
                askButton.disabled = false;
                askButton.classList.remove('opacity-50');
            }
        }

        // Add event listener for Enter key in textarea (keeping your existing logic)
        document.getElementById('queryInput').addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                getRecommendations();
            }
        });

        // Logout functionality (keeping your existing logic)
        document.getElementById('logoutBtn').addEventListener('click', () => {
            localStorage.removeItem('authToken');
            window.location.href = '/login';
        });
    