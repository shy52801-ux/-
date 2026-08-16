var BLINDS = (function() {
    var MAX_DIST = 250;
    var THRESHOLD = 0.5;
    var SETTLE_MS = 340;

    var progress = 0;
    var tracking = false;
    var startY = 0;
    var settling = false;

    function clamp(v, min, max) {
        return v < min ? min : (v > max ? max : v);
    }

    function setProgress(p) {
        progress = p;
        document.documentElement.style.setProperty('--open-progress', p);
    }

    function isOverlayOpen() {
        if (document.getElementById('card-container').classList.contains('show')) return true;
        if (document.getElementById('detail-panel').classList.contains('show')) return true;
        if (document.getElementById('history-page').classList.contains('show')) return true;
        if (document.getElementById('history-day-page').classList.contains('show')) return true;
        return false;
    }

    function isEnteringOrOpen() {
        return document.body.classList.contains('side-quest-entering') ||
               document.body.classList.contains('side-quest-open');
    }

    function onTouchStart(e) {
        if (settling || isEnteringOrOpen() || isOverlayOpen()) return;
        tracking = true;
        startY = e.touches[0].clientY;
        document.body.classList.remove('blind-settling');
    }

    function onTouchMove(e) {
        if (!tracking) return;
        var y = e.touches[0].clientY;
        var deltaY = startY - y;
        if (deltaY <= 0) {
            setProgress(0);
            return;
        }
        e.preventDefault();
        setProgress(clamp(deltaY / MAX_DIST, 0, 1));
    }

    function onTouchEnd() {
        if (!tracking) return;
        tracking = false;
        if (progress > THRESHOLD) {
            settleTo(1);
        } else {
            settleTo(0);
        }
    }

    function settleTo(target) {
        settling = true;
        document.body.classList.add('blind-settling');
        if (target >= 1) {
            document.body.classList.add('side-quest-entering');
        }
        setProgress(target);
        setTimeout(function() {
            document.body.classList.remove('blind-settling');
            settling = false;
            if (target >= 1) {
                enterSideQuest();
            }
        }, SETTLE_MS);
    }

    function enterSideQuest() {
        document.body.classList.remove('side-quest-entering');
        document.body.classList.add('side-quest-open');
        if (window.onSideQuestOpen) window.onSideQuestOpen();
    }

    function navigateToSideQuest() {
        if (isEnteringOrOpen()) return;
        settleTo(1);
    }

    function navigateToMainQuest() {
        var body = document.body;
        if (body.classList.contains('side-quest-exiting')) return;
        if (!body.classList.contains('side-quest-open')) return;
        settling = true;
        body.classList.remove('side-quest-open');
        body.classList.add('side-quest-exiting', 'blind-settling');
        setProgress(0);
        setTimeout(function() {
            body.classList.remove('side-quest-exiting', 'blind-settling');
            settling = false;
        }, SETTLE_MS + 60);
    }

    function init() {
        document.addEventListener('touchstart', onTouchStart, { passive: true });
        document.addEventListener('touchmove', onTouchMove, { passive: false });
        document.addEventListener('touchend', onTouchEnd, { passive: true });
        var back = document.getElementById('sq-back');
        if (back) back.addEventListener('click', navigateToMainQuest);
    }

    return {
        init: init,
        getProgress: function() { return progress; },
        navigateToSideQuest: navigateToSideQuest,
        navigateToMainQuest: navigateToMainQuest
    };
})();

if (typeof window !== 'undefined') {
    window.BLINDS = BLINDS;
    window.navigateToSideQuest = BLINDS.navigateToSideQuest;
    window.navigateToMainQuest = BLINDS.navigateToMainQuest;
}

document.addEventListener('DOMContentLoaded', BLINDS.init);