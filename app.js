var lastCategory = '';
var HISTORY_KEY = 'wy_history';
var HISTORY_DAYS = 30;

var currentWeekStart = getWeekStart(new Date());
var selectedDateKey = formatDateKey(new Date());

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

function addToHistory(rec) {
    var history = getHistory();
    history.push({
        content: rec.content,
        category: rec.category || '',
        ts: Date.now()
    });
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
    renderInlineDetails(rec.details);
    
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
        addToHistory(rec);
        hideCard();
        setTimeout(showFinalFeedback, 400);
    };
}

function renderInlineDetails(details) {
    var box = document.getElementById('card-details');
    var list = document.getElementById('card-details-list');
    if (!details || details.length === 0) {
        box.style.display = 'none';
        return;
    }
    list.innerHTML = details.map(function(d) { return '<li>' + d + '</li>'; }).join('');
    box.style.display = 'block';
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

var WEEK_LABELS = ['日', '一', '二', '三', '四', '五', '六'];

function formatDateKey(date) {
    var m = date.getMonth() + 1;
    var d = date.getDate();
    return date.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (d < 10 ? '0' : '') + d;
}

function getWeekStart(date) {
    var d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    var dow = d.getDay();
    var diff = dow === 0 ? -6 : 1 - dow;
    d.setDate(d.getDate() + diff);
    return d;
}

function getWeekRangeText() {
    var start = currentWeekStart;
    var end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
    return (start.getMonth() + 1) + '月' + start.getDate() + '日 — ' + (end.getMonth() + 1) + '月' + end.getDate() + '日';
}

function getRecordsForDate(dateKey) {
    var history = getHistory();
    var list = [];
    for (var i = 0; i < history.length; i++) {
        if (formatDateKey(new Date(history[i].ts)) === dateKey) {
            history[i].category = history[i].category || '';
            list.push(history[i]);
        }
    }
    list.sort(function(a, b) { return a.ts - b.ts; });
    return list;
}

function renderWeek() {
    var todayKey = formatDateKey(new Date());
    var grid = document.getElementById('week-grid');
    grid.innerHTML = '';

    var date = new Date(currentWeekStart.getFullYear(), currentWeekStart.getMonth(), currentWeekStart.getDate());
    for (var i = 0; i < 7; i++) {
        var dayKey = formatDateKey(date);
        var dayCell = document.createElement('div');
        dayCell.className = 'day-cell';
        if (dayKey === selectedDateKey) dayCell.className += ' selected';

        var label = document.createElement('div');
        label.className = 'day-label';
        label.textContent = WEEK_LABELS[date.getDay()];

        var num = document.createElement('div');
        num.className = 'day-num';
        num.textContent = date.getDate();
        if (dayKey === todayKey) num.className += ' today';

        var dot = document.createElement('div');
        dot.className = 'day-dot';
        dot.style.display = getRecordsForDate(dayKey).length > 0 ? 'block' : 'none';

        dayCell.appendChild(label);
        dayCell.appendChild(num);
        dayCell.appendChild(dot);
        dayCell.dataset.date = dayKey;
        dayCell.addEventListener('click', function() {
            selectedDateKey = this.dataset.date;
            renderWeek();
            renderDayRecords();
        });
        grid.appendChild(dayCell);

        date.setDate(date.getDate() + 1);
    }

    document.getElementById('week-range').textContent = getWeekRangeText();
    renderDayRecords();
}

function renderDayRecords() {
    var records = getRecordsForDate(selectedDateKey);
    var container = document.getElementById('day-records');

    var parts = selectedDateKey.split('-');
    var dateLabel = '月' + Number(parts[1]) + '日';
    var todayKey = formatDateKey(new Date());
    if (selectedDateKey === todayKey) {
        dateLabel = '今天 · 月' + Number(parts[1]) + '日';
    }

    if (records.length === 0) {
        container.innerHTML = '<div class="day-title">' + dateLabel + '</div>' +
            '<div class="empty-hint">这一天，还没有留下记录。</div>';
        return;
    }

    var html = '<div class="day-title">' + dateLabel + ' · 完成了 ' + records.length + ' 件小事</div>';
    for (var i = 0; i < records.length; i++) {
        var cat = records[i].category ? '<span class="rec-cat">' + records[i].category + '</span>' : '';
        html += '<div class="rec-item">' + cat + '<span class="rec-content">' + records[i].content + '</span></div>';
    }
    container.innerHTML = html;
}

function showHistory() {
    currentWeekStart = getWeekStart(new Date());
    selectedDateKey = formatDateKey(new Date());
    renderWeek();
    document.getElementById('history-page').classList.add('show');
}

function hideHistory() {
    document.getElementById('history-page').classList.remove('show');
}

window.addEventListener('DOMContentLoaded', function() {
    var riseLine = document.getElementById('riseLine');
    var riseDot = document.getElementById('riseDot');

    var len = riseLine.getTotalLength();
    riseLine.style.strokeDasharray = len;
    riseLine.style.strokeDashoffset = len;

    setTimeout(function() {
        riseLine.classList.add('animate');
    }, 300);

    setTimeout(function() {
        riseDot.classList.add('animate');
    }, 300 + 1100 - 150);

    setTimeout(function() {
        document.getElementById('brand-name').classList.add('show');
    }, 300 + 1100 + 100);

    setTimeout(function() {
        document.getElementById('tagline').classList.add('show');
    }, 300 + 1100 + 500);

    setTimeout(function() {
        document.getElementById('splash').classList.add('hidden');
        document.getElementById('main').classList.add('show');
    }, 300 + 1100 + 1400);

    document.getElementById('main-btn').addEventListener('click', showCard);
    document.getElementById('close-detail').addEventListener('click', hideDetails);
    document.getElementById('history-link').addEventListener('click', showHistory);
    document.getElementById('history-back').addEventListener('click', hideHistory);
    document.getElementById('prev-week').addEventListener('click', function() {
        currentWeekStart.setDate(currentWeekStart.getDate() - 7);
        renderWeek();
    });
    document.getElementById('next-week').addEventListener('click', function() {
        currentWeekStart.setDate(currentWeekStart.getDate() + 7);
        renderWeek();
    });
});
