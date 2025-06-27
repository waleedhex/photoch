console.log('تم تحميل سكربت index.html بنجاح');

const ADMIN_CODE = 'wfra1403';

let imageList = [];
let solutionsList = []; // New: To store solutions
let currentRoundIndex = 1;
let team1Score = 0;
let team2Score = 0;
let timer;
let timeLeft = 60; // Adjusted default time to 60
let availableIndices = [];

const gameImage = document.getElementById('game-image');
const timerDisplay = document.getElementById('timer');
const timeInput = document.getElementById('time-input');
const hintButton = document.getElementById('hint-button'); // Now "Show Solution" button

// New: Create a div for solution text
const solutionTextDiv = document.createElement('div');
solutionTextDiv.id = 'solution-text';
solutionTextDiv.style.cssText = `
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 10px 15px;
    border-radius: 8px;
    font-size: 1.5rem;
    font-weight: bold;
    text-align: center;
    z-index: 10;
    display: none; /* Hidden by default */
`;
document.querySelector('.image-container').appendChild(solutionTextDiv);

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
    if (verifyingIndicator) {
        verifyingIndicator.style.display = 'block';
    }

    try {
        if (isOfflineOrPWA()) {
            console.log('أوفلاين أو في وضع PWA، تخطي التحقق...');
            document.getElementById('access-code-container').style.display = 'none';
            document.getElementById('game-container').style.display = 'flex';
            await startGame();
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
            console.log('الرمز صالح، جارٍ تحميل صفحة اللعبة...');
            document.getElementById('access-code-container').style.display = 'none';
            document.getElementById('game-container').style.display = 'flex';
            await startGame();
        } else {
            alert('رمز غير صالح! حاول مرة أخرى.');
        }
    } catch (error) {
        console.error('خطأ في تحميل codes.json:', error);
        alert('حدث خطأ أثناء التحقق من الرمز. تأكد من وجود الملف.');
    } finally {
        isVerifying = false;
        verifyButton.disabled = false;
        verifyButton.textContent = 'تحقق';
        if (verifyingIndicator) {
            verifyingIndicator.style.display = 'none';
        }
    }
}

async function loadAnnouncements() {
    // تحميل الإعلانات فقط إذا كان المستخدم أونلاين وليس في وضع PWA
    if (isOfflineOrPWA()) {
        console.log('أوفلاين أو في وضع PWA، تخطي تحميل الإعلانات...');
        return;
    }

    try {
        const response = await fetch('announcements.json');
        const data = await response.json();
        const announcementsContainer = document.getElementById('announcements-container');
        if (announcementsContainer) { // Check if container exists (it's removed in index.html)
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
        }
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
    const imgBase = `assets/${imageData.name}`; // Assuming images are directly in 'assets' now
    const imagePaths = getImageUrl(imgBase);
    let pathIndex = 0;
    let img = imagePaths[pathIndex];
    
    // Find the solution for the current image
    const solutionData = solutionsList.find(s => s.image === imageData.name);
    const solution = solutionData ? solutionData.solution : 'لا يوجد حل';

    return {
        img,
        solution,
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
    timeLeft = parseInt(timeInput.value) || 60; // Default to 60 if input is empty
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

// Renamed from playHint to showSolution
function showSolution() {
    const imageData = imageList[currentRoundIndex - 1];
    const solutionData = solutionsList.find(s => s.image === imageData.name);
    if (solutionData && solutionData.solution) {
        solutionTextDiv.textContent = solutionData.solution;
        solutionTextDiv.style.display = 'block';
    } else {
        solutionTextDiv.textContent = 'لا يوجد حل لهذه الصورة.';
        solutionTextDiv.style.display = 'block';
    }
}

function addScore(team) {
    const points = 1; // Always add 1 point
    if (team === 1) {
        team1Score += points;
        document.getElementById('team1-score').textContent = team1Score;
    } else {
        team2Score += points;
        document.getElementById('team2-score').textContent = team2Score;
    }
}

async function nextRound() {
    clearInterval(timer); // Stop timer from previous round
    solutionTextDiv.style.display = 'none'; // Hide solution for next round

    const nextIndex = getRandomImageIndex();
    if (!nextIndex) {
        alert('لا توجد صور للعرض! ستتم إعادة اللعب.');
        // If no more images, reset availableIndices and start fresh
        availableIndices = Array.from({ length: imageList.length }, (_, i) => i + 1);
        const newFirstIndex = getRandomImageIndex();
        if (!newFirstIndex) {
             // This case should ideally not happen if imageList is populated
            console.error('No images to start a new round even after resetting available indices.');
            return;
        }
        currentRoundIndex = newFirstIndex;
    } else {
        currentRoundIndex = nextIndex;
    }

    const { img, solution, onError } = await getImageAndAudio(currentRoundIndex);
    gameImage.src = img;
    gameImage.onerror = () => onError(gameImage);
    
    startTimer(); // Start timer automatically for the new round
}

async function startGame() {
    // Load announcements (handled within loadAnnouncements)
    await loadAnnouncements();

    try {
        // Load metadata.json
        const metadataResponse = await fetch('assets/metadata.json');
        const metadata = await metadataResponse.json();
        imageList = metadata.images.map(img => ({
            name: img.name // Assuming 'name' is the identifier for images
        }));
        availableIndices = Array.from({ length: imageList.length }, (_, i) => i + 1);
        console.log('تم تحميل metadata.json بنجاح:', imageList);

        // Load solutions.json
        const solutionsResponse = await fetch('assets/solutions.json');
        solutionsList = await solutionsResponse.json();
        console.log('تم تحميل solutions.json بنجاح:', solutionsList);

    } catch (error) {
        console.error('خطأ في تحميل بيانات اللعبة (metadata.json أو solutions.json):', error);
        alert('فشل تحميل بيانات اللعبة. يرجى التأكد من توفر الملفات.');
        return;
    }

    document.getElementById('start-container').style.display = 'none';
    document.getElementById('game-container').style.display = 'flex';

    const firstIndex = getRandomImageIndex();
    if (!firstIndex) {
        alert('لا توجد صور للعرض! يرجى التحقق من ملفات اللعبة.');
        return;
    }
    currentRoundIndex = firstIndex;
    const { img, solution, onError } = await getImageAndAudio(currentRoundIndex);
    gameImage.src = img;
    gameImage.onerror = () => onError(gameImage);

    startTimer(); // Start timer automatically for the first round
}


function returnToCategories() { // This function now returns to the start screen
    clearInterval(timer);
    solutionTextDiv.style.display = 'none'; // Hide solution if visible
    document.getElementById('game-container').style.display = 'none';
    document.getElementById('start-container').style.display = 'flex'; // Show start screen
    imageList = [];
    solutionsList = [];
    availableIndices = [];
    team1Score = 0;
    team2Score = 0;
    document.getElementById('team1-score').textContent = team1Score;
    document.getElementById('team2-score').textContent = team2Score;
    timeLeft = parseInt(timeInput.value) || 60;
    updateTimerDisplay();
}

// دالة لإظهار زر التثبيت
let deferredPrompt;
function showInstallPrompt() {
    const installButton = document.getElementById('install-button');

    // إظهار الزر فقط إذا كان المستخدم أونلاين وليس في وضع PWA
    if (!isOfflineOrPWA()) {
        installButton.style.display = 'block';
    } else {
        installButton.style.display = 'none';
    }

    // التقاط حدث التثبيت
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
    clearInterval(timer); // إيقاف العداد عند تغيير الوقت
    timeLeft = parseInt(timeInput.value) || 60; // Default to 60 if input is empty
    updateTimerDisplay();
});

// ربط الأزرار وتحميل الإعلانات عند بدء الصفحة
document.addEventListener('DOMContentLoaded', () => {
    // تحميل الإعلانات (سيتم التحكم في هذا في loadAnnouncements)
    loadAnnouncements();
    console.log('جارٍ تحميل الإعلانات عند بدء الصفحة');

    // إظهار زر التثبيت
    showInstallPrompt();

    // ربط زر بدء العداد
    const startTimerButton = document.getElementById('start-timer-button');
    if (startTimerButton) {
        startTimerButton.addEventListener('click', startTimer);
        console.log('تم ربط زر بدء العداد بنجاح');
    } else {
        console.error('لم يتم العثور على زر بدء العداد!');
    }

    // ربط زر "بداية"
    const startGameButton = document.getElementById('start-game');
    if (startGameButton) {
        startGameButton.addEventListener('click', () => {
            document.getElementById('start-container').style.display = 'none';
            document.getElementById('game-container').style.display = 'flex';
            startGame();
        });
        console.log('تم ربط زر "بداية" بنجاح');
    } else {
        console.error('لم يتم العثور على زر "بداية"!');
    }

    // ربط زر التحقق من رمز الوصول (if it still exists in HTML, though it's removed in current instructions)
    // The previous instruction had `#access-code-container` and its elements removed.
    // Assuming it's no longer present for the main game flow based on `index.html` changes.
    // If you intend to re-introduce it for admin, that would be a separate step.

    // No longer need to verify access code for main game start directly.
    // The entry point is now the "بداية" button or PWA offline mode.

    // Initially hide game container and show start container
    document.getElementById('game-container').style.display = 'none';
    document.getElementById('start-container').style.display = 'flex';

    // Set initial timer display based on default value
    updateTimerDisplay();
});

document.addEventListener('contextmenu', event => event.preventDefault());