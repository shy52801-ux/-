var lastCategory = '';
var HISTORY_KEY = 'wy_history';
var HISTORY_DAYS = 30;
var QUESTS_KEY = 'wy_quests';
var QUESTS_DONE_KEY = 'wy_quests_done';
var SETTINGS_KEY = 'wy_settings';
var NUDGE_KEY = 'wy_nudge';

var currentWeekStart = getWeekStart(new Date());
var selectedDateKey = formatDateKey(new Date());
var currentView = 'home';

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
    var entry = {
        id: 'wy-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
        content: rec.content,
        category: rec.category || '',
        ts: Date.now()
    };
    var history = getHistory();
    history.push(entry);
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(history)); } catch (e) {}
    return entry;
}

function removeHistoryById(id) {
    var history = getHistory();
    var filtered = history.filter(function(entry) {
        return entry.id !== id;
    });
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered)); } catch (e) {}
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
    window._lastCompletedEntry = null;
    document.getElementById('card-category').textContent = rec.category;
    document.getElementById('card-content').textContent = rec.content;
    document.getElementById('card-details').style.display = 'none';
    hideDetails();
    
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
    var confirmBtn = document.getElementById('confirm-done-btn');
    confirmBtn.disabled = false;
    
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
        if (confirmBtn.disabled) return;
        confirmBtn.disabled = true;
        window._lastCompletedEntry = addToHistory(rec);
        hideCard();
        setTimeout(function() { showFinalFeedback(); }, 400);
    };
}

function undoLastCompletion() {
    var entry = window._lastCompletedEntry;
    if (!entry || !entry.id) return;
    var undoBtn = document.getElementById('undo-btn');
    if (undoBtn.disabled) return;
    undoBtn.disabled = true;
    removeHistoryById(entry.id);
    if (entry.category && entry.category.indexOf('主线·') === 0) {
        undoQuestDoneByEntry(entry);
    }
    window._lastCompletedEntry = null;
    clearTimeout(window._feedbackTimer);
    document.getElementById('complete-feedback').classList.remove('show');
    undoBtn.style.display = 'none';
    renderQuests();
    showUndoToast();
}

function undoQuestDoneByEntry(entry) {
    var quest = null;
    if (entry.mainlineId) {
        for (var i = 0; i < MAIN_QUESTS.length; i++) {
            if (MAIN_QUESTS[i].id === entry.mainlineId) { quest = MAIN_QUESTS[i]; break; }
        }
    }
    if (!quest && entry.content) {
        for (var j = 0; j < MAIN_QUESTS.length; j++) {
            var q = MAIN_QUESTS[j];
            if (q.name + '：' + q.today === entry.content) { quest = q; break; }
        }
    }
    if (!quest) return;
    var todayKey = formatDateKey(new Date());
    try {
        var done = JSON.parse(localStorage.getItem(QUESTS_DONE_KEY) || '{}') || {};
        var list = done[todayKey] || [];
        var idx = list.indexOf(quest.id);
        if (idx >= 0) list.splice(idx, 1);
        done[todayKey] = list;
        localStorage.setItem(QUESTS_DONE_KEY, JSON.stringify(done));
    } catch (e) {}
}

function showUndoToast(text) {
    var toast = document.getElementById('undo-toast');
    if (!toast) return;
    toast.textContent = text || '已撤销';
    toast.classList.add('show');
    clearTimeout(window._undoToastTimer);
    window._undoToastTimer = setTimeout(function() {
        toast.classList.remove('show');
    }, 1200);
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
    var feedback = document.getElementById('complete-feedback');
    var undoBtn = document.getElementById('undo-btn');
    document.getElementById('feedback-text').innerHTML = '这一刻<br>你选择了自己。';
    if (window._lastCompletedEntry) {
        undoBtn.style.display = 'block';
        undoBtn.disabled = false;
        undoBtn.onclick = undoLastCompletion;
    } else {
        undoBtn.style.display = 'none';
    }
    feedback.classList.add('show');
    clearTimeout(window._feedbackTimer);
    window._feedbackTimer = setTimeout(function() {
        feedback.classList.remove('show');
        undoBtn.style.display = 'none';
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
            showDayRecords(this.dataset.date);
        });
        grid.appendChild(dayCell);

        date.setDate(date.getDate() + 1);
    }

    document.getElementById('week-range').textContent = getWeekRangeText();
}

function applyView(view) {
    currentView = view;
    var showMap = {
        'home': 'main',
        'history': 'history-page',
        'history-day': 'history-day-page',
        'quests': 'quests-page',
        'picker': 'quest-picker-page',
        'settings': 'settings-page'
    };
    for (var key in showMap) {
        var el = document.getElementById(showMap[key]);
        if (!el) continue;
        var ref = key;
        if (key === 'home') el.classList.toggle('show', currentView === 'home');
        else el.classList.toggle('show', currentView === ref);
    }
}

function navigateTo(view) {
    applyView(view);
    try { history.pushState({ view: view }, ''); } catch (e) {}
}

function showDayRecords(dateKey) {
    selectedDateKey = dateKey;
    renderDayRecords();
    navigateTo('history-day');
}

function renderDayRecords() {
    var records = getRecordsForDate(selectedDateKey);
    var container = document.getElementById('day-records');

    var todayKey = formatDateKey(new Date());
    var monthDay = Number(selectedDateKey.split('-')[1]) + '月' + Number(selectedDateKey.split('-')[2]) + '日';
    if (selectedDateKey === todayKey) {
        document.getElementById('day-summary').textContent = '今天 · 完成了 ' + records.length + ' 件小事';
    } else {
        document.getElementById('day-summary').textContent = monthDay + ' · 完成了 ' + records.length + ' 件小事';
    }
    document.getElementById('day-date').textContent = monthDay;

    if (records.length === 0) {
        container.innerHTML = '<div class="empty-hint">这一天，还没有留下记录。</div>';
        return;
    }

    var html = '';
    for (var i = 0; i < records.length; i++) {
        var catText = records[i].category || '';
        if (records[i].mainlineId) {
            var qName = '';
            for (var qi = 0; qi < MAIN_QUESTS.length; qi++) {
                if (MAIN_QUESTS[qi].id === records[i].mainlineId) { qName = MAIN_QUESTS[qi].name; break; }
            }
            catText = qName ? '主线·' + qName : (records[i].category || '主线');
        }
        var cat = catText ? '<span class="rec-cat">' + catText + '</span>' : '';
        var undoLink = records[i].id
            ? '<button class="rec-undo" data-id="' + records[i].id + '">撤销</button>'
            : '';
        html += '<div class="rec-item">' + cat + '<span class="rec-content">' + records[i].content + '</span>' + undoLink + '</div>';
    }
    container.innerHTML = html;

    var undoBtns = container.querySelectorAll('.rec-undo');
    for (var j = 0; j < undoBtns.length; j++) {
        undoBtns[j].addEventListener('click', function() {
            undoRecord(this.getAttribute('data-id'), this);
        });
    }
}

function undoRecord(id, btn) {
    if (!id || btn.disabled) return;
    btn.disabled = true;
    var target = null;
    var history = getHistory();
    for (var i = 0; i < history.length; i++) {
        if (history[i].id === id) { target = history[i]; break; }
    }
    window._lastCompletedEntry = null;
    removeHistoryById(id);
    if (target && target.category && target.category.indexOf('主线·') === 0) {
        undoQuestDoneByEntry(target);
    }
    renderDayRecords();
    renderWeek();
    renderQuests();
    showUndoToast();
}

function showHistory() {
    currentWeekStart = getWeekStart(new Date());
    selectedDateKey = formatDateKey(new Date());
    renderWeek();
    navigateTo('history');
}

function hideHistory() {
    applyView('home');
    try { history.pushState({ view: 'home' }, ''); } catch (e) {}
}

function hideDayRecords() {
    renderWeek();
    navigateTo('history');
}

function getSelectedQuests() {
    try {
        var raw = localStorage.getItem(QUESTS_KEY);
        if (!raw) return [];
        var ids = JSON.parse(raw);
        return MAIN_QUESTS.filter(function(q) {
            return ids.indexOf(q.id) >= 0;
        });
    } catch (e) {
        return [];
    }
}

function saveSelectedQuests(quests) {
    var ids = quests.map(function(q) { return q.id; });
    try { localStorage.setItem(QUESTS_KEY, JSON.stringify(ids)); } catch (e) {}
}

function isQuestDoneToday(questId) {
    var todayKey = formatDateKey(new Date());
    try {
        var raw = localStorage.getItem(QUESTS_DONE_KEY);
        if (!raw) return false;
        var map = JSON.parse(raw);
        var list = map[todayKey] || [];
        return list.indexOf(questId) >= 0;
    } catch (e) {
        return false;
    }
}

function markQuestDone(questId) {
    var todayKey = formatDateKey(new Date());
    var map = {};
    try { map = JSON.parse(localStorage.getItem(QUESTS_DONE_KEY) || '{}') || {}; } catch (e) {}
    var list = map[todayKey] || [];
    if (list.indexOf(questId) < 0) list.push(questId);
    map[todayKey] = list;
    try { localStorage.setItem(QUESTS_DONE_KEY, JSON.stringify(map)); } catch (e) {}
}

function addMainQuestDone(quest) {
    var entry = addToHistory({
        content: quest.name + '：' + quest.today,
        category: '主线·' + quest.group,
        ts: Date.now()
    });
    entry.type = 'main';
    entry.mainlineId = quest.id;
    var history = getHistory();
    for (var i = history.length - 1; i >= 0; i--) {
        if (history[i].id === entry.id) {
            history[i].type = 'main';
            history[i].mainlineId = quest.id;
            break;
        }
    }
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(history)); } catch (e) {}
    return entry;
}

function renderQuests() {
    var list = document.getElementById('quests-list');
    var quests = getSelectedQuests();
    if (quests.length === 0) {
        list.innerHTML = '<div class="empty-hint">还没有主线。<br>给自己一个想走去的方向。</div>' +
            '<button class="quest-add-empty" id="quest-add-empty">添加主线</button>';
        var addBtn = document.getElementById('quest-add-empty');
        if (addBtn) addBtn.addEventListener('click', showPicker);
        return;
    }
    var html = '';
    for (var i = 0; i < quests.length; i++) {
        var q = quests[i];
        var done = isQuestDoneToday(q.id);
        var foot = '';
        if (done) {
            foot = '<span class="quest-done-mark">✓ 已完成</span>' +
                '<button class="quest-undo-btn" data-quest="' + q.id + '">撤销</button>';
        } else {
            foot = '<button class="quest-done-btn" data-quest="' + q.id + '">做完了</button>';
        }
        html += '<div class="quest-item" data-quest="' + q.id + '">' +
            '<div class="quest-head"><span class="quest-name">' + q.name + '</span>' +
            '<button class="quest-more" data-quest="' + q.id + '">···</button></div>' +
            '<div class="quest-stage">' + q.stage + '</div>' +
            '<div class="quest-week">本周：' + q.weekGoal + '</div>' +
            '<div class="quest-today">下一步：' + q.today + '</div>' +
            '<div class="quest-foot">' + foot + '</div>' +
            '<div class="quest-confirm" data-quest="' + q.id + '" style="display:none;">' +
            '<div class="quest-confirm-title">删除「' + q.name + '」？</div>' +
            '<div class="quest-confirm-text">将停止这个主线之后的任务安排。过去已经完成的记录仍会保留。</div>' +
            '<div class="quest-confirm-actions">' +
            '<button class="quest-cancel" data-quest="' + q.id + '">取消</button>' +
            '<button class="quest-delete" data-quest="' + q.id + '">删除主线</button>' +
            '</div></div>' +
            '</div>';
    }
    list.innerHTML = html;

    var btns = list.querySelectorAll('.quest-done-btn');
    for (var j = 0; j < btns.length; j++) {
        btns[j].addEventListener('click', function() {
            var id = this.getAttribute('data-quest');
            var quest = null;
            for (var k = 0; k < MAIN_QUESTS.length; k++) {
                if (MAIN_QUESTS[k].id === id) quest = MAIN_QUESTS[k];
            }
            if (quest) {
                this.disabled = true;
                window._lastCompletedEntry = addMainQuestDone(quest);
                markQuestDone(id);
                renderQuests();
                showFinalFeedback();
            }
        });
    }

    var undoBtns = list.querySelectorAll('.quest-undo-btn');
    for (var u = 0; u < undoBtns.length; u++) {
        undoBtns[u].addEventListener('click', function() {
            undoMainQuestToday(this.getAttribute('data-quest'));
        });
    }

    var moreBtns = list.querySelectorAll('.quest-more');
    for (var m = 0; m < moreBtns.length; m++) {
        moreBtns[m].addEventListener('click', function() {
            var id = this.getAttribute('data-quest');
            var confirmBox = list.querySelector('.quest-confirm[data-quest="' + id + '"]');
            if (confirmBox) {
                var isHidden = confirmBox.style.display === 'none';
                var allBoxes = list.querySelectorAll('.quest-confirm');
                for (var b = 0; b < allBoxes.length; b++) allBoxes[b].style.display = 'none';
                confirmBox.style.display = isHidden ? 'block' : 'none';
            }
        });
    }

    var cancelBtns = list.querySelectorAll('.quest-cancel');
    for (var c = 0; c < cancelBtns.length; c++) {
        cancelBtns[c].addEventListener('click', function() {
            var id = this.getAttribute('data-quest');
            var confirmBox = list.querySelector('.quest-confirm[data-quest="' + id + '"]');
            if (confirmBox) confirmBox.style.display = 'none';
        });
    }

    var delBtns = list.querySelectorAll('.quest-delete');
    for (var d = 0; d < delBtns.length; d++) {
        delBtns[d].addEventListener('click', function() {
            deleteQuest(this.getAttribute('data-quest'));
        });
    }
}

function deleteQuest(questId) {
    var ids = [];
    try { ids = JSON.parse(localStorage.getItem(QUESTS_KEY) || '[]') || []; } catch (e) {}
    var idx = ids.indexOf(questId);
    if (idx >= 0) ids.splice(idx, 1);
    try { localStorage.setItem(QUESTS_KEY, JSON.stringify(ids)); } catch (e) {}

    var todayKey = formatDateKey(new Date());
    try {
        var done = JSON.parse(localStorage.getItem(QUESTS_DONE_KEY) || '{}') || {};
        var list = done[todayKey] || [];
        var didx = list.indexOf(questId);
        if (didx >= 0) list.splice(didx, 1);
        done[todayKey] = list;
        localStorage.setItem(QUESTS_DONE_KEY, JSON.stringify(done));
    } catch (e) {}

    window._lastCompletedEntry = null;
    renderQuests();
    showUndoToast('已删除主线');
}

function undoMainQuestToday(questId) {
    var quest = null;
    for (var k = 0; k < MAIN_QUESTS.length; k++) {
        if (MAIN_QUESTS[k].id === questId) quest = MAIN_QUESTS[k];
    }
    if (!quest) return;
    var todayKey = formatDateKey(new Date());
    var history = getHistory();
    var candidates = [];
    for (var i = 0; i < history.length; i++) {
        var e = history[i];
        if (formatDateKey(new Date(e.ts)) !== todayKey) continue;
        var isMain = (e.type === 'main' && e.mainlineId === questId) ||
            (!e.type && e.content === quest.name + '：' + quest.today);
        if (isMain) candidates.push(e);
    }
    candidates.sort(function(a, b) { return a.ts - b.ts; });
    if (candidates.length > 0) {
        var target = candidates[candidates.length - 1];
        if (target.id) {
            removeHistoryById(target.id);
        } else {
            var filtered = history.filter(function(ent) {
                return !(ent.content === target.content && ent.ts === target.ts);
            });
            try { localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered)); } catch (e) {}
        }
    }
    try {
        var done = JSON.parse(localStorage.getItem(QUESTS_DONE_KEY) || '{}') || {};
        var list = done[todayKey] || [];
        var didx = list.indexOf(questId);
        if (didx >= 0) list.splice(didx, 1);
        done[todayKey] = list;
        localStorage.setItem(QUESTS_DONE_KEY, JSON.stringify(done));
    } catch (e) {}

    window._lastCompletedEntry = null;
    renderQuests();
    renderWeek();
    renderDayRecords();
    showUndoToast();
}

function showQuests() {
    renderQuests();
    navigateTo('quests');
}

function hideQuests() {
    applyView('home');
    try { history.pushState({ view: 'home' }, ''); } catch (e) {}
}

function renderPicker() {
    var container = document.getElementById('picker-groups');
    var selected = getSelectedQuests();
    var groups = {};
    for (var i = 0; i < MAIN_QUESTS.length; i++) {
        var q = MAIN_QUESTS[i];
        if (!groups[q.group]) groups[q.group] = [];
        groups[q.group].push(q);
    }
    var html = '';
    for (var g in groups) {
        html += '<div class="picker-group"><div class="picker-group-title">' + g + '</div>';
        for (var j = 0; j < groups[g].length; j++) {
            var q = groups[g][j];
            var isSel = selected.some(function(s) { return s.id === q.id; });
            html += '<button class="picker-item' + (isSel ? ' selected' : '') + '" data-quest="' + q.id + '">' +
                '<span class="picker-name">' + q.name + '</span>' +
                '<span class="picker-mark">' + (isSel ? '✓' : '') + '</span></button>';
        }
        html += '</div>';
    }
    container.innerHTML = html;

    var items = container.querySelectorAll('.picker-item');
    for (var k = 0; k < items.length; k++) {
        items[k].addEventListener('click', function() {
            var id = this.getAttribute('data-quest');
            var q = null;
            for (var m = 0; m < MAIN_QUESTS.length; m++) {
                if (MAIN_QUESTS[m].id === id) q = MAIN_QUESTS[m];
            }
            if (!q) return;
            var cur = getSelectedQuests();
            var idx = -1;
            for (var n = 0; n < cur.length; n++) {
                if (cur[n].id === q.id) idx = n;
            }
            if (idx >= 0) {
                cur.splice(idx, 1);
            } else {
                if (cur.length >= 3) {
                    window._lastCompletedEntry = null;
                    showFinalFeedback();
                    return;
                }
                cur.push(q);
            }
            saveSelectedQuests(cur);
            renderPicker();
        });
    }
}

function showPicker() {
    renderPicker();
    navigateTo('picker');
}

function hidePicker() {
    renderQuests();
    navigateTo('quests');
}

function renderSettings() {
    var s = getSettings();
    document.getElementById('morning-enabled').checked = s.morning.enabled;
    document.getElementById('evening-enabled').checked = s.evening.enabled;
}

function getSettings() {
    var def = {
        morning: { enabled: false, time: '08:00' },
        evening: { enabled: true, time: '21:30' }
    };
    try {
        var raw = localStorage.getItem(SETTINGS_KEY);
        if (!raw) return def;
        var s = JSON.parse(raw);
        if (!s.morning) s.morning = def.morning;
        if (!s.evening) s.evening = def.evening;
        return s;
    } catch (e) {
        return def;
    }
}

function saveSettings(s) {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch (e) {}
}

function showSettings() {
    renderSettings();
    navigateTo('settings');
}

function hideSettings() {
    applyView('home');
    try { history.pushState({ view: 'home' }, ''); } catch (e) {}
}

function getCurrentMinutes() {
    var now = new Date();
    return now.getHours() * 60 + now.getMinutes();
}

function isEveningNudgeTime(settings) {
    if (!settings.evening.enabled) return false;
    var parts = settings.evening.time.split(':');
    var target = Number(parts[0]) * 60 + Number(parts[1]);
    return getCurrentMinutes() >= target;
}

function nudgeShownToday() {
    var todayKey = formatDateKey(new Date());
    try {
        var raw = localStorage.getItem(NUDGE_KEY);
        if (!raw) return true;
        var map = JSON.parse(raw);
        return map[todayKey] === true;
    } catch (e) {
        return true;
    }
}

function markNudgeShown() {
    var todayKey = formatDateKey(new Date());
    var map = {};
    try { map = JSON.parse(localStorage.getItem(NUDGE_KEY) || '{}') || {}; } catch (e) {}
    map[todayKey] = true;
    try { localStorage.setItem(NUDGE_KEY, JSON.stringify(map)); } catch (e) {}
}

function checkNudge() {
    var settings = getSettings();
    if (!isEveningNudgeTime(settings)) return;
    if (nudgeShownToday()) return;
    document.getElementById('evening-nudge').classList.add('show');
}

function hideNudge() {
    document.getElementById('evening-nudge').classList.remove('show');
    markNudgeShown();
}

var sqCurrentRec = null;

function showSideQuestCard() {
    var rec = getRecommendation();
    sqCurrentRec = rec;
    document.getElementById('sq-cat').textContent = rec.category;
    document.getElementById('sq-task').textContent = rec.content;
    document.getElementById('sq-details').style.display = 'none';

    var refreshBtn = document.getElementById('sq-refresh');
    var doBtn = document.getElementById('sq-do');
    var skipBtn = document.getElementById('sq-skip');
    var confirmBtn = document.getElementById('sq-confirm');
    var undoBtn = document.getElementById('sq-undo');
    undoBtn.style.display = 'none';
    confirmBtn.disabled = false;

    refreshBtn.style.display = 'block';
    doBtn.style.display = 'block';
    skipBtn.style.display = 'none';
    confirmBtn.style.display = 'none';

    refreshBtn.onclick = function() { showSideQuestCard(); };
    doBtn.onclick = function() {
        renderSqInlineDetails(rec.details);
        refreshBtn.style.display = 'none';
        doBtn.style.display = 'none';
        skipBtn.style.display = 'block';
        confirmBtn.style.display = 'block';
        confirmBtn.disabled = false;
    };
    skipBtn.onclick = function() { showSideQuestCard(); };
    confirmBtn.onclick = function() {
        if (confirmBtn.disabled) return;
        confirmBtn.disabled = true;
        window._lastCompletedEntry = addToHistory(rec);
        document.getElementById('sq-details').style.display = 'none';
        skipBtn.style.display = 'none';
        confirmBtn.style.display = 'none';
        document.getElementById('sq-task').textContent = '这一刻 你选择了自己。';
        undoBtn.style.display = 'block';
        undoBtn.disabled = false;
        undoBtn.onclick = function() {
            clearTimeout(window._sqNextTimer);
            undoLastCompletion();
            undoBtn.style.display = 'none';
            showSideQuestCard();
        };
        clearTimeout(window._sqNextTimer);
        window._sqNextTimer = setTimeout(function() {
            undoBtn.style.display = 'none';
            showSideQuestCard();
        }, 1400);
    };
}

function renderSqInlineDetails(details) {
    var box = document.getElementById('sq-details');
    var list = document.getElementById('sq-details-list');
    if (!details || details.length === 0) {
        box.style.display = 'none';
        return;
    }
    list.innerHTML = details.map(function(d) { return '<li>' + d + '</li>'; }).join('');
    box.style.display = 'block';
}

window.addEventListener('popstate', function(e) {
    var target = (e.state && e.state.view) || 'home';
    if (target === 'history-day') {
        renderDayRecords();
    } else if (target === 'history') {
        renderWeek();
    } else if (target === 'quests') {
        renderQuests();
    } else if (target === 'picker') {
        renderPicker();
    }
    applyView(target);
});

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

    document.getElementById('quests-entry').addEventListener('click', showQuests);
    document.getElementById('side-entry').addEventListener('click', function() {
        window.navigateToSideQuest();
    });
    document.getElementById('close-detail').addEventListener('click', hideDetails);
    document.getElementById('history-link').addEventListener('click', showHistory);
    document.getElementById('settings-link').addEventListener('click', showSettings);
    document.getElementById('history-home-back').addEventListener('click', hideHistory);
    document.getElementById('day-back').addEventListener('click', hideDayRecords);
    document.getElementById('prev-week').addEventListener('click', function() {
        currentWeekStart.setDate(currentWeekStart.getDate() - 7);
        renderWeek();
    });
    document.getElementById('next-week').addEventListener('click', function() {
        currentWeekStart.setDate(currentWeekStart.getDate() + 7);
        renderWeek();
    });
    document.getElementById('quests-back').addEventListener('click', hideQuests);
    document.getElementById('add-quest-btn').addEventListener('click', showPicker);
    document.getElementById('picker-back').addEventListener('click', hidePicker);
    document.getElementById('settings-back').addEventListener('click', hideSettings);
    document.getElementById('morning-enabled').addEventListener('change', function() {
        var s = getSettings();
        s.morning.enabled = this.checked;
        saveSettings(s);
    });
    document.getElementById('evening-enabled').addEventListener('change', function() {
        var s = getSettings();
        s.evening.enabled = this.checked;
        saveSettings(s);
    });
    document.getElementById('nudge-dismiss').addEventListener('click', hideNudge);
    document.getElementById('nudge-open').addEventListener('click', function() {
        hideNudge();
        showHistory();
    });
    window.onSideQuestOpen = showSideQuestCard;
    checkNudge();
});
