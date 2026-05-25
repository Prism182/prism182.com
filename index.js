async function initStats() {
    try {
        const res = await fetch("https://github-statistics.kylefos.workers.dev/");
        const data = await res.json();

        if (data.error) {
            console.error("Worker error:", data.error);
            return;
        }

        document.getElementById("projects").textContent = data.projects;
        document.getElementById("commits").textContent = data.commits;

        const topLanguages = data.languages.slice(0, 4);
        const otherLanguages = data.languages.slice(4);

        const labels = topLanguages.map(l => l.name);
        const counts = topLanguages.map(l => l.count);

        if (otherLanguages.length > 0) {
            labels.push("Other");
            counts.push(otherLanguages.reduce((acc, l) => acc + l.count, 0));
        }

        const total = counts.reduce((acc, c) => acc + c, 0);

        const style = getComputedStyle(document.documentElement);
        const colors = [
            style.getPropertyValue('--primary').trim(),
            style.getPropertyValue('--secondary').trim(),
            style.getPropertyValue('--tertiary').trim(),
            style.getPropertyValue('--pink').trim(),
            style.getPropertyValue('--accent').trim()
        ];

        const ctx = document.getElementById('languagesChart').getContext('2d');
        const customTooltip = document.getElementById('chart-tooltip');

        new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: counts,
                    backgroundColor: colors,
                    borderColor: 'rgba(8, 8, 18, 0.8)',
                    borderWidth: 2,
                    hoverOffset: 15
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        enabled: false,
                        external: function(context) {
                            const tooltipModel = context.tooltip;
                            if (tooltipModel.opacity === 0) {
                                customTooltip.style.opacity = 0;
                                return;
                            }

                            if (tooltipModel.body) {
                                const dataIndex = tooltipModel.dataPoints[0].dataIndex;
                                const label = labels[dataIndex];
                                const value = counts[dataIndex];
                                const percentage = ((value / total) * 100).toFixed(1) + '%';

                                customTooltip.querySelector('.tooltip-title').textContent = label;
                                customTooltip.querySelector('.tooltip-value').textContent = percentage;
                            }

                            // Correctly position tooltip relative to page scroll and chart canvas
                            const rect = context.chart.canvas.getBoundingClientRect();

                            customTooltip.style.opacity = 1;
                            customTooltip.style.left = (rect.left + window.scrollX + tooltipModel.caretX) + 'px';
                            customTooltip.style.top = (rect.top + window.scrollY + tooltipModel.caretY) + 'px';
                        }
                    }
                }
            }
        });
    } catch (err) {
        console.error("Failed to load stats:", err);
    }
}

initStats();