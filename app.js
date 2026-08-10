var lastCategory = '';
var HISTORY_KEY = 'wy_history';
var HISTORY_DAYS = 30;

function getTimeCategory() {
    var hour = new Date().getHours();
    if (hour >= 22 || hour < 6) return 'night';
    if (hour >= 9 && hour < 22) return 'social';
    return 'day';
}

function getRandomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function getHistory() {
    try {
        var raw = localStorage.getItem(HISTORY_KEY);
        if (!raw) return [];
        var arr = JSON.parse(raw);
        var now = Date.now();
        var cutoff = now - HISTORY_DAYS * 24 * 60 * 60 * 1000;
        return arr.filter(function(entry) { return entry.ts > cutoff; });
    } catch (e) {
        return [];
    }
}

function addToHistory(content) {
    var history = getHistory();
    history.push({ content: content, ts: Date.now() });
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(history)); } catch (e) {}
}

function getHistorySet() {
    var history = getHistory();
    var set = {};
    for (var i = 0; i < history.length; i++) {
        set[history[i].content] = true;
    }
    return set;
}

function getRecommendation() {
    var timeCat = getTimeCategory();
    var historySet = getHistorySet();

    var eligible = recommendations.filter(function(r) {
        return r.time === 'all' || r.time === timeCat;
    });

    var notSeen = eligible.filter(function(r) {
        return !historySet[r.content];
    });

    if (notSeen.length === 0) {
        try { localStorage.removeItem(HISTORY_KEY); } catch (e) {}
        notSeen = eligible;
    }

    if (lastCategory && notSeen.length > 1) {
        var diffCategory = notSeen.filter(function(r) {
            return r.category !== lastCategory;
        });
        if (diffCategory.length > 0) {
            notSeen = diffCategory;
        }
    }

    var item = getRandomItem(notSeen);
    lastCategory = item.category;
    return item;
}

function showCard() {
    var rec = getRecommendation();
    window._currentRec = rec;
    document.getElementById('card-category').textContent = rec.category;
    document.getElementById('card-content').textContent = rec.content;
    
    var detailBtn = document.getElementById('detail-btn');
    var refreshBtn = document.getElementById('refresh-btn');
    var doneBtn = document.getElementById('done-btn');
    var skipBtn = document.getElementById('skip-btn');
    var confirmBtn = document.getElementById('confirm-done-btn');
    
    detailBtn.style.display = rec.details ? 'block' : 'none';
    refreshBtn.style.display = 'block';
    doneBtn.style.display = 'block';
    skipBtn.style.display = 'none';
    confirmBtn.style.display = 'none';
    
    detailBtn.onclick = rec.details ? function() { showDetails(rec.details); } : null;
    refreshBtn.onclick = function() { hideCard(); setTimeout(showCard, 300); };
    doneBtn.onclick = function() { showConfirmCard(rec); };
    
    document.getElementById('card-container').classList.add('show');
}

function showConfirmCard(rec) {
    document.getElementById('card-category').textContent = rec.category;
    document.getElementById('card-content').textContent = rec.content;
    
    document.getElementById('detail-btn').style.display = 'none';
    document.getElementById('refresh-btn').style.display = 'none';
    document.getElementById('done-btn').style.display = 'none';
    document.getElementById('skip-btn').style.display = 'block';
    document.getElementById('confirm-done-btn').style.display = 'block';
    
    document.getElementById('skip-btn').onclick = function() {
        hideCard();
        setTimeout(showCard, 300);
    };
    document.getElementById('confirm-done-btn').onclick = function() {
        addToHistory(rec.content);
        hideCard();
        setTimeout(showFinalFeedback, 400);
    };
}

function showFinalFeedback() {
    document.getElementById('feedback-text').innerHTML = '这一刻<br>你选择了自己。';
    document.getElementById('complete-feedback').classList.add('show');
    setTimeout(function() {
        document.getElementById('complete-feedback').classList.remove('show');
    }, 2500);
}

function hideCard() {
    document.getElementById('card-container').classList.remove('show');
    document.getElementById('detail-panel').classList.remove('show');
}

function showDetails(details) {
    var list = document.getElementById('detail-list');
    list.innerHTML = details.map(function(d) { return '<li>' + d + '</li>'; }).join('');
    document.getElementById('detail-panel').classList.add('show');
}

function hideDetails() {
    document.getElementById('detail-panel').classList.remove('show');
}

window.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
        document.getElementById('tilt-line').classList.add('animate');
    }, 500);

    setTimeout(function() {
        document.getElementById('brand-name').classList.add('show');
    }, 800);

    setTimeout(function() {
        document.getElementById('tagline').classList.add('show');
    }, 1200);

    setTimeout(function() {
        document.getElementById('splash').classList.add('hidden');
        document.getElementById('main').classList.add('show');
    }, 2800);

    document.getElementById('main-btn').addEventListener('click', showCard);
    document.getElementById('close-detail').addEventListener('click', hideDetails);
});
