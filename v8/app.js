function getTimeCategory() {
    const hour = new Date().getHours();
    if (hour >= 22 || hour < 6) return 'night';
    if (hour >= 9 && hour < 22) return 'social';
    return 'day';
}

function getRandomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function getRecommendation() {
    const timeCat = getTimeCategory();
    const filtered = recommendations.filter(r => r.time === 'all' || r.time === timeCat);
    return getRandomItem(filtered);
}

function showCard() {
    const rec = getRecommendation();
    document.getElementById('card-category').textContent = rec.category;
    document.getElementById('card-content').textContent = rec.content;
    
    // 详情按钮
    const detailBtn = document.getElementById('detail-btn');
    if (rec.details) {
        detailBtn.style.display = 'block';
        detailBtn.onclick = () => showDetails(rec.details);
    } else {
        detailBtn.style.display = 'none';
    }
    
    document.getElementById('card-container').classList.add('show');
}

function hideCard() {
    document.getElementById('card-container').classList.remove('show');
    document.getElementById('detail-panel').classList.remove('show');
}

function showDetails(details) {
    const list = document.getElementById('detail-list');
    list.innerHTML = details.map(d => `<li>${d}</li>`).join('');
    document.getElementById('detail-panel').classList.add('show');
}

function hideDetails() {
    document.getElementById('detail-panel').classList.remove('show');
}

function showFeedback() {
    document.getElementById('feedback-text').innerHTML = getRandomItem(feedbacks);
    document.getElementById('complete-feedback').classList.add('show');
    setTimeout(() => {
        document.getElementById('complete-feedback').classList.remove('show');
    }, 2000);
}

window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        document.getElementById('tilt-line').classList.add('animate');
    }, 500);

    setTimeout(() => {
        document.getElementById('brand-name').classList.add('show');
    }, 800);

    setTimeout(() => {
        document.getElementById('tagline').classList.add('show');
    }, 1200);

    setTimeout(() => {
        document.getElementById('splash').classList.add('hidden');
        document.getElementById('main').classList.add('show');
    }, 2800);

    document.getElementById('main-btn').addEventListener('click', showCard);
    document.getElementById('refresh-btn').addEventListener('click', () => {
        hideCard();
        setTimeout(showCard, 300);
    });
    document.getElementById('done-btn').addEventListener('click', () => {
        hideCard();
        setTimeout(showFeedback, 400);
    });
    document.getElementById('close-detail').addEventListener('click', hideDetails);
});
