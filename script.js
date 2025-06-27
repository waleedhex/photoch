console.log('تم تحميل سكربت تحدي الصور بنجاح');

const ADMIN_CODE = 'wfra1403';

let imageList = [];
let currentRoundIndex = 1;
let team1Score = 0;
let team2Score = 0;
let timer;
let timeLeft = 60;
let availableIndices = [];

const gameImage = document.getElementById('game-image');
const timerDisplay = document.getElementById('timer');
const timeInput = document.getElementById('time-input');
const solutionText = document.getElementById('solution-text');

// دالة للتحقق مما إذا كان المستخدم أوفلاين أو في وضع PWA
function isOfflineOrPWA() {
    return !navigator.onLine || window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
}

function getImageUrl(basePath) {
    const extensions = ['.webp', '.png'];
    const pathsToTry = [];
    extensions.forEach(ext => {
        pathsToTry.push(basePath.replace(/\.(webp|png)$/i, ext));
    });
    console.log('محاولة تحميل الصورة من المسارات:', pathsToTry);
    return pathsToTry;
}

// دالة لتأخير التنفيذ (debounce) لمنع التكرار السريع للطلبات
let isVerifying = false;
async function verifyAccessCode() {
    if (isVerifying) {
        console.log('جارٍ التحقق من الرمز، يرجى الانتظار...');
        return;
    }

    const code = document.getElementById('access-code').value.trim();
    const verifyButton = document.getElementById('verify-button');
    const verifyingIndicator = document.getElementById('verifying-indicator');

    if (!code) {
        alert('الرجاء إدخال رمز الوصول!');
        return;
    }

    isVerifying = true;
    verifyButton.disabled = true;
    verifyButton.textContent = 'جار التحقق...';
    verifyingIndicator.style.display = 'block';

    try {
        if (isOfflineOrPWA()) {
            console.log('أوفلاين أو في وضع PWA، تخطي التحقق...');
            document.getElementById('access-code-container').style.display = 'none';
            document.getElementById('start-container').style.display = 'flex';
            return;
        }

        if (code.toLowerCase() === ADMIN_CODE.toLowerCase()) {
            console.log('رمز الأدمن مُدخل، جارٍ التوجيه إلى admin.html...');
            window.location.href = './admin.html';
            return;
        }

        const response = await fetch('codes.json', { cache: 'no-store' });
        const data = await response.json();
        const validCodesLowerCase = data.validCodes.map(c => c.toLowerCase());

        if (validCodesLowerCase.includes(code.toLowerCase())) {
            console.log('الرمز صالح، جارٍ عرض شاشة البداية...');
            document.getElementById('access-code-container').style.display = 'none';
            document.getElementById('start-container').style.display = 'flex';
        } else {
            alert('رمز غير صالح! حاول مرة أخرى.');
        }
    } catch (error) {
        console.error('خطأ في تحميل codes.json:', error);
        alert('حدث خطأ أثناء التحقق من الرمز. تأكد من وجود الملف.');
    } finally {
        isVerifying = false;
        verifyButton.disabled = false;
        verifyButton.textContent = 'تأكيد';
        verifyingIndicator.style.display = 'none';
    }
}

async function loadAnnouncements() {
    if (isOfflineOrPWA()) {
        console.log('أوفلاين أو في وضع PWA، تخطي تحميل الإعلانات...');
        return;
    }

    try {
        const response = await fetch('announcements.json');
        const data = await response.json();
        const announcementsContainer = document.getElementById('announcements-container');
        announcementsContainer.innerHTML = '';
        data.announcements.forEach(announcement => {
            const announcementCard = document.createElement('div');
            announcementCard.className = 'announcement-card';
            if (announcement.title) {
                const title = document.createElement('h3');
                title.textContent = announcement.title;
                announcementCard.appendChild(title);
            }
            if (announcement.text) {
                const text = document.createElement('p');
                text.textContent = announcement.text;
                announcementCard.appendChild(text);
            }
            if (announcement.link && announcement.button) {
                const button = document.createElement('button');
                button.textContent = announcement.button;
                button.onclick = () => window.open(announcement.link, '_blank');
                announcementCard.appendChild(button);
            }
            announcementsContainer.appendChild(announcementCard);
        });
        console.log('تم تحميل announcements.json بنجاح');
    } catch (error) {
        console.error('خطأ في تحميل announcements.json:', error);
    }
}

function getRandomImageIndex() {
    if (imageList.length === 0) {
        console.error('لا توجد صور للعرض. imageList فارغة.');
        return null;
    }
    if (availableIndices.length === 0) {
        availableIndices = Array.from({ length: imageList.length }, (_, i) => i + 1);
    }
    const randomIndex = Math.floor(Math.random() * availableIndices.length);
    const selectedIndex = availableIndices.splice(randomIndex, 1)[0];
    return selectedIndex;
}

async function getImageAndAudio(index) {
    if (!index || index < 1 || index > imageList.length) {
        console.error('فهرس الصورة غير صالح:', index);
        return {
            img: 'assets/default_category.webp',
            solution: '',
            onError: () => {}
        };
    }

    const imageData = imageList[index - 1];
    const imgBase = `assets/${imageData.name}`;
    const imagePaths = getImageUrl(imgBase);
    let pathIndex = 0;
    let img = imagePaths[pathIndex];
    console.log('محاولة تحميل الصورة:', img);
    return {
        img,
        solution: imageData.solution || '',
        onError: (element) => {
            pathIndex++;
            if (pathIndex < imagePaths.length) {
                console.error(`فشل تحميل الصورة من ${element.src}, جارٍ المحاولة مع ${imagePaths[pathIndex]}`);
                element.src = imagePaths[pathIndex];
            } else {
                console.error(`فشل تحميل الصورة من جميع المسارات`);
                element.src = 'assets/default_category.webp';
            }
        }
    };
}

function startTimer() {
    clearInterval(timer);
    timeLeft = parseInt(timeInput.value) || 60;
    updateTimerDisplay();
    timer = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        if (timeLeft <= 0) {
            clearInterval(timer);
            alert('انتهى الوقت! انتقل إلى الجولة التالية.');
            nextRound();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function showSolution() {
    if (solutionText.style.display === 'block') {
        solutionText.style.display = 'none';
    } else {
        solutionText.textContent = imageList[currentRoundIndex - 1].solution || 'لا يوجد حل';
        solutionText.style.display = 'block';
    }
}

function addScore(team) {
    if (team === 1) {
        team1Score += 1;
        document.getElementById('team1-score').textContent = team1Score;
    } else {
        team2Score += 1;
        document.getElementById('team2-score').textContent = team2Score;
    }
}

async function nextRound() {
    solutionText.style.display = 'none';
    const nextIndex = getRandomImageIndex();
    if (!nextIndex) {
        alert('لا توجد صور للعرض! العودة إلى شاشة البداية.');
        returnToStart();
        return;
    }
    currentRoundIndex = nextIndex;
    const { img, solution, onError } = await getImageAndAudio(currentRoundIndex);
    gameImage.src = img;
    gameImage.onerror = () => onError(gameImage);
    solutionText.textContent = solution;
    startTimer();
}

async function startGame() {
    await loadAnnouncements();
    imageList = [];
    availableIndices = [];

    try {
        const metadataResponse = await fetch('assets/metadata.json');
        const metadata = await metadataResponse.json();
        const solutionsResponse = await fetch('assets/solutions.json');
        const solutions = await solutionsResponse.json();

        imageList = metadata.images.map(img => {
            const solution = solutions.solutions.find(s => s.image === img.name);
            return {
                ...img,
                solution: solution ? solution.solution : ''
            };
        });
        availableIndices = Array.from({ length: imageList.length }, (_, i) => i + 1);
        console.log('تم تحميل metadata.json وsolutions.json بنجاح:', imageList);
    } catch (error) {
        console.error('خطأ في تحميل metadata.json أو solutions.json:', error);
        alert('فشل تحميل بيانات الصور.');
        return;
    }

    if (imageList.length === 0) {
        console.warn('لا توجد صور للعرض! العودة إلى شاشة البداية.');
        returnToStart();
        return;
    }

    document.getElementById('start-container').style.display = 'none';
    document.getElementById('game-container').style.display = 'flex';
    const firstIndex = getRandomImageIndex();
    if (!firstIndex) {
        alert('لا توجد صور للعرض! العودة إلى شاشة البداية.');
        returnToStart();
        return;
    }
    currentRoundIndex = firstIndex;
    const { img, solution, onError } = await getImageAndAudio(currentRoundIndex);
    gameImage.src = img;
    gameImage.onerror = () => onError(gameImage);
    solutionText.textContent = solution;
    startTimer();
}

function returnToStart() {
    clearInterval(timer);
    document.getElementById('game-container').style.display = 'none';
    document.getElementById('start-container').style.display = 'flex';
    imageList = [];
    availableIndices = [];
    timeLeft = parseInt(timeInput.value) || 60;
    updateTimerDisplay();
}

// دالة لإظهار زر التثبيت
let deferredPrompt;
function showInstallPrompt() {
    const installButton = document.getElementById('install-button');

    if (!isOfflineOrPWA()) {
        installButton.style.display = 'block';
    } else {
        installButton.style.display = 'none';
    }

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        if (!isOfflineOrPWA()) {
            installButton.style.display = 'block';
        }
    });

    installButton.addEventListener('click', () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('المستخدم وافق على تثبيت اللعبة');
                    installButton.style.display = 'none';
                } else {
                    console.log('المستخدم رفض تثبيت اللعبة');
                }
                deferredPrompt = null;
            });
        } else {
            alert('لتشغيل اللعبة أوفلاين، انقر على "إضافة إلى الشاشة الرئيسية" من قائمة المتصفح.');
        }
    });
}

timeInput.addEventListener('change', () => {
    clearInterval(timer);
    timeLeft = parseInt(timeInput.value) || 60;
    updateTimerDisplay();
});

document.addEventListener('DOMContentLoaded', () => {
    loadAnnouncements();
    console.log('جارٍ تحميل الإعلانات عند بدء الصفحة');

    showInstallPrompt();

    const startTimerButton = document.getElementById('start-timer-button');
    if (startTimerButton) {
        startTimerButton.addEventListener('click', startTimer);
        console.log('تم ربط زر بدء العداد بنجاح');
    } else {
        console.error('لم يتم العثور على زر بدء العداد!');
    }

    const startGameButton = document.getElementById('start-game');
    if (startGameButton) {
        startGameButton.addEventListener('click', startGame);
        console.log('تم ربط زر بداية بنجاح');
    } else {
        console.error('لم يتم العثور على زر بداية!');
    }

    const verifyButton = document.getElementById('verify-button');
    if (verifyButton) {
        verifyButton.addEventListener('click', verifyAccessCode);
        console.log('تم ربط زر التحقق من رمز الوصول بنجاح');
    } else {
        console.error('لم يتم العثور على زر التحقق من رمز الوصول!');
    }

    const hintButton = document.getElementById('hint-button');
    if (hintButton) {
        hintButton.addEventListener('click', showSolution);
        console.log('تم ربط زر إظهار الحل بنجاح');
    } else {
        console.error('لم يتم العثور على زر إظهار الحل!');
    }
});

document.addEventListener('contextmenu', event => event.preventDefault());