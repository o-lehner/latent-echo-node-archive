document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('.container');
    const audio = document.getElementById('audio');
    const playPauseBtn = document.getElementById('play-pause-btn');
    const timeline = document.querySelector('.timeline');
    const progress = document.querySelector('.progress');

    const playIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>';
    const pauseIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>';

    // --- Flower Generation (Better Anti-Overlap + Avoid Player) ---
    const numberOfFlowers = 30;
    const placedFlowers = [];
    const flowerSize = 80; 
    const padding = 10; // Odstęp między kwiatkami
    const playerPadding = 15; // Odstęp od odtwarzacza

    const playerRect = document.querySelector('.audio-player').getBoundingClientRect();

    for (let i = 0; i < numberOfFlowers; i++) {
        let x, y, overlap;
        let attempts = 0;

        do {
            overlap = false;
            x = Math.random() * (window.innerWidth - flowerSize);
            y = Math.random() * (window.innerHeight - flowerSize);
            attempts++;

            // 1. Sprawdź kolizję z odtwarzaczem
            const flowerRect = {
                left: x - playerPadding,
                right: x + flowerSize + playerPadding,
                top: y - playerPadding,
                bottom: y + flowerSize + playerPadding
            };

            if (!(flowerRect.right < playerRect.left || 
                  flowerRect.left > playerRect.right || 
                  flowerRect.bottom < playerRect.top || 
                  flowerRect.top > playerRect.bottom)) {
                overlap = true;
                continue;
            }

            // 2. Sprawdź kolizję z innymi kwiatkami
            for (const f of placedFlowers) {
                if (!(x + flowerSize + padding < f.x || 
                      x > f.x + flowerSize + padding || 
                      y + flowerSize + padding < f.y || 
                      y > f.y + flowerSize + padding)) {
                    overlap = true;
                    break;
                }
            }
        } while (overlap && attempts < 200);

        if (!overlap) {
            placedFlowers.push({ x, y });
            const flower = document.createElement('div');
            flower.classList.add('flower');
            flower.style.left = `${x}px`;
            flower.style.top = `${y}px`;
            flower.style.transform = `scale(${Math.random() * 0.4 + 0.6}) rotate(${Math.random() * 360}deg)`;
            container.appendChild(flower);
        }
    }

    // --- Player Logic ---
    function togglePlayPause() {
        if (audio.paused) {
            audio.play();
            playPauseBtn.innerHTML = pauseIcon;
        } else {
            audio.pause();
            playPauseBtn.innerHTML = playIcon;
        }
    }

    function updateProgress() {
        if (!isDragging) {
            const percent = (audio.currentTime / audio.duration) * 100;
            progress.style.width = `${percent}%`;
        }
    }

    let isDragging = false;

    function setProgress(e) {
        const rect = timeline.getBoundingClientRect();
        const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
        const width = rect.width;
        let clickX = clientX - rect.left;
        
        // Ograniczenie do granic paska
        clickX = Math.max(0, Math.min(clickX, width));
        
        const duration = audio.duration;
        if (duration) {
            const percent = (clickX / width) * 100;
            progress.style.width = `${percent}%`;
            if (!isDragging) {
                audio.currentTime = (clickX / width) * duration;
            }
        }
    }

    function startDragging(e) {
        isDragging = true;
        setProgress(e);
    }

    function stopDragging(e) {
        if (isDragging) {
            const rect = timeline.getBoundingClientRect();
            const clientX = e.type.includes('touch') ? e.changedTouches[0].clientX : e.clientX;
            const width = rect.width;
            let clickX = clientX - rect.left;
            clickX = Math.max(0, Math.min(clickX, width));
            
            audio.currentTime = (clickX / width) * audio.duration;
            isDragging = false;
        }
    }

    function drag(e) {
        if (isDragging) {
            setProgress(e);
            e.preventDefault(); // Zapobiega przewijaniu strony na telefonie podczas przesuwania paska
        }
    }

    playPauseBtn.addEventListener('click', togglePlayPause);
    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', () => {
        playPauseBtn.innerHTML = playIcon;
        progress.style.width = '0%';
    });

    // Obsługa myszy
    timeline.addEventListener('mousedown', startDragging);
    window.addEventListener('mousemove', drag);
    window.addEventListener('mouseup', stopDragging);

    // Obsługa dotyku
    timeline.addEventListener('touchstart', startDragging);
    window.addEventListener('touchmove', drag, { passive: false });
    window.addEventListener('touchend', stopDragging);
});
