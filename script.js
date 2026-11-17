// CHINH PHỤC SỐ NGUYÊN - TOÁN LỚP 6
    // 4 chế độ: cộng, trừ, cộng-trừ kết hợp và thử thách 20 câu đúng liên tiếp.

    let audioCtx = null;
    let soundEnabled = true;

    let currentMode = '';
    let currentProblem = null;
    let currentInput = '';
    let questionAnswered = false;
    let score = 0;
    let questionNumber = 0;
    let correctCount = 0;

    const CHALLENGE_TARGET = 20;
    const MIN_INTEGER = -20;
    const MAX_INTEGER = 20;

    function getAudioContext() {
        if (!audioCtx) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) audioCtx = new AudioContextClass();
        }
        if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
        return audioCtx;
    }

    function playSound(type) {
        if (!soundEnabled) return;
        try {
            const ctx = getAudioContext();
            if (!ctx) return;
            const now = ctx.currentTime;
            const oscillator = ctx.createOscillator();
            const gain = ctx.createGain();
            oscillator.connect(gain);
            gain.connect(ctx.destination);

            if (type === 'correct') {
                oscillator.type = 'triangle';
                oscillator.frequency.setValueAtTime(523, now);
                oscillator.frequency.setValueAtTime(659, now + 0.08);
                oscillator.frequency.setValueAtTime(784, now + 0.16);
                gain.gain.setValueAtTime(0.13, now);
                gain.gain.linearRampToValueAtTime(0.001, now + 0.3);
                oscillator.start(now);
                oscillator.stop(now + 0.3);
            } else if (type === 'wrong') {
                oscillator.type = 'sawtooth';
                oscillator.frequency.setValueAtTime(210, now);
                oscillator.frequency.linearRampToValueAtTime(140, now + 0.18);
                gain.gain.setValueAtTime(0.08, now);
                gain.gain.linearRampToValueAtTime(0.001, now + 0.2);
                oscillator.start(now);
                oscillator.stop(now + 0.2);
            } else if (type === 'complete') {
                [523, 659, 784, 1047].forEach((frequency, index) => {
                    const osc = ctx.createOscillator();
                    const volume = ctx.createGain();
                    osc.connect(volume);
                    volume.connect(ctx.destination);
                    osc.frequency.setValueAtTime(frequency, now + index * 0.1);
                    volume.gain.setValueAtTime(0.12, now + index * 0.1);
                    volume.gain.linearRampToValueAtTime(0.001, now + index * 0.1 + 0.2);
                    osc.start(now + index * 0.1);
                    osc.stop(now + index * 0.1 + 0.2);
                });
            } else {
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(420, now);
                gain.gain.setValueAtTime(0.06, now);
                gain.gain.linearRampToValueAtTime(0.001, now + 0.07);
                oscillator.start(now);
                oscillator.stop(now + 0.07);
            }
        } catch (error) {
            console.warn('Không thể phát âm thanh:', error);
        }
    }

    function toggleSound() {
        soundEnabled = !soundEnabled;
        const button = document.getElementById('sound-toggle-btn');
        if (button) button.textContent = soundEnabled ? '🔊' : '🔇';
        if (soundEnabled) playSound('click');
    }

    function randomInteger(min = MIN_INTEGER, max = MAX_INTEGER) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function formatInteger(number) {
        return number < 0 ? `(${number})` : String(number);
    }

    function generateProblem(mode) {
        const operator = mode === 'addition' ? '+' :
            mode === 'subtraction' ? '-' :
            (Math.random() < 0.5 ? '+' : '-');

        const a = randomInteger();
        const b = randomInteger();
        const answer = operator === '+' ? a + b : a - b;

        return {
            num1: a,
            num2: b,
            operator,
            answer,
            type: operator === '+' ? 'addition' : 'subtraction'
        };
    }

    function getModeInfo(mode) {
        const info = {
            addition: {
                badge: '➕ TẬP CỘNG',
                subtitle: 'Luyện tập phép cộng hai số nguyên',
                className: 'mode-badge mode-add'
            },
            subtraction: {
                badge: '➖ TẬP TRỪ',
                subtitle: 'Luyện tập phép trừ hai số nguyên',
                className: 'mode-badge mode-sub'
            },
            mixed: {
                badge: '🔀 CỘNG VÀ TRỪ',
                subtitle: 'Phối hợp phép cộng và phép trừ số nguyên',
                className: 'mode-badge mode-mixed'
            },
            challenge: {
                badge: '🏆 THỬ THÁCH 20 ĐIỂM',
                subtitle: 'Trả lời đúng 20 câu liên tiếp để chiến thắng',
                className: 'mode-badge mode-challenge'
            }
        };
        return info[mode];
    }

    function startPractice(mode) {
        playSound('click');
        getAudioContext();

        if (!['addition', 'subtraction', 'mixed', 'challenge'].includes(mode)) return;

        currentMode = mode;
        score = 0;
        questionNumber = 0;
        correctCount = 0;
        currentInput = '';
        questionAnswered = false;

        const info = getModeInfo(mode);
        document.getElementById('game-mode-badge').textContent = info.badge;
        document.getElementById('game-mode-badge').className = info.className;
        document.getElementById('game-subtitle').textContent = info.subtitle;

        document.getElementById('view-home').classList.add('hidden');
        document.getElementById('view-summary').classList.add('hidden');
        document.getElementById('view-game').classList.remove('hidden');
        document.getElementById('home-btn').classList.remove('hidden');

        const progressWrap = document.getElementById('progress-wrap');
        const progressCaption = document.getElementById('progress-caption');
        if (mode === 'challenge') {
            progressWrap.classList.remove('hidden');
            progressCaption.textContent = 'Số câu đúng liên tiếp';
        } else {
            progressWrap.classList.add('hidden');
        }
        loadQuestion();
    }

    function loadQuestion() {
        currentProblem = generateProblem(currentMode);
        currentInput = '';
        questionAnswered = false;
        questionNumber += 1;

        const isChallenge = currentMode === 'challenge';
        document.getElementById('score-display').textContent = score;
        document.getElementById('current-q-num').textContent = questionNumber;
        document.getElementById('question-label').textContent =
            isChallenge ? 'Trả lời đúng để tiến gần hơn tới 20 điểm!' : 'Tính kết quả phép tính sau:';

        document.getElementById('problem-text').textContent =
            `${formatInteger(currentProblem.num1)} ${currentProblem.operator} ${formatInteger(currentProblem.num2)}`;
        document.getElementById('user-answer-display').textContent = '?';
        document.getElementById('user-answer-display').classList.remove('filled');

        const feedback = document.getElementById('feedback-text');
        feedback.textContent = 'Hãy nhập đáp án của em nhé!';
        feedback.className = 'feedback-text';

        document.getElementById('rule-box').classList.add('hidden');
        document.getElementById('action-buttons-container').classList.add('hidden');
        document.getElementById('keypad-container').classList.remove('hidden');
        document.getElementById('btn-retry').classList.remove('hidden');
        document.getElementById('btn-next').classList.add('hidden');

        updateProgress();
    }

    function updateProgress() {
        if (currentMode !== 'challenge') return;
        const percentage = Math.min(100, (score / CHALLENGE_TARGET) * 100);
        document.getElementById('progress-bar').style.width = `${percentage}%`;
        document.getElementById('progress-value').textContent = `${score}/${CHALLENGE_TARGET}`;
        document.getElementById('score-display').textContent = score;
    }

    function renderInput() {
        const display = document.getElementById('user-answer-display');
        display.textContent = currentInput || '?';
        display.classList.toggle('filled', currentInput !== '');
    }

    function appendNumber(number) {
        playSound('click');
        if (questionAnswered || currentInput.replace('-', '').length >= 3) return;
        if (number === '0' && currentInput === '0') return;
        if (currentInput === '-0') currentInput = '-';
        currentInput += String(number);
        renderInput();
    }

    function toggleNegative() {
        playSound('click');
        if (questionAnswered) return;
        if (currentInput.startsWith('-')) {
            currentInput = currentInput.slice(1);
        } else {
            currentInput = currentInput === '' ? '-' : `-${currentInput}`;
        }
        if (currentInput === '-0') currentInput = '-';
        renderInput();
    }

    function deleteNumber() {
        playSound('click');
        if (questionAnswered) return;
        currentInput = currentInput.slice(0, -1);
        renderInput();
    }

    function getRule(problem) {
        const a = problem.num1;
        const b = problem.num2;
        const operator = problem.operator;

        if (operator === '+') {
            if (a === 0 || b === 0) {
                return {
                    title: 'Cộng với số 0',
                    text: 'Cộng một số nguyên với 0 thì kết quả bằng chính số nguyên đó.',
                    example: `${formatInteger(a)} + ${formatInteger(b)} = ${problem.answer}`
                };
            }
            if (a * b > 0) {
                return {
                    title: 'Cộng hai số nguyên cùng dấu',
                    text: 'Ta cộng hai giá trị tuyệt đối rồi giữ nguyên dấu chung của hai số.',
                    example: `Ví dụ: (-4) + (-3) = -(4 + 3) = -7.`
                };
            }
            if (a * b < 0) {
                return {
                    title: 'Cộng hai số nguyên khác dấu',
                    text: 'Ta lấy giá trị tuyệt đối lớn trừ giá trị tuyệt đối nhỏ; kết quả mang dấu của số có giá trị tuyệt đối lớn hơn. Nếu hai số đối nhau thì tổng bằng 0.',
                    example: `Ví dụ: (-8) + 3 = -(8 - 3) = -5.`
                };
            }
            return {
                title: 'Hai số đối nhau',
                text: 'Tổng của hai số nguyên đối nhau bằng 0.',
                example: 'Ví dụ: (-6) + 6 = 0.'
            };
        }

        return {
            title: 'Phép trừ số nguyên',
            text: 'Muốn trừ một số nguyên, ta cộng số bị trừ với số đối của số trừ: a - b = a + (-b).',
            example: `Ví dụ: 5 - (-3) = 5 + 3 = 8.`
        };
    }

    function showRule(problem) {
        const rule = getRule(problem);
        document.getElementById('rule-content').innerHTML =
            `<p><strong>${rule.title}:</strong> ${rule.text}</p><p class="example">${rule.example}</p>`;
        document.getElementById('rule-box').classList.remove('hidden');
    }

    function submitAnswer() {
        if (questionAnswered || currentInput === '' || currentInput === '-') return;

        const userAnswer = Number(currentInput);
        if (!Number.isInteger(userAnswer)) return;

        const correct = userAnswer === currentProblem.answer;
        const feedback = document.getElementById('feedback-text');
        const keypad = document.getElementById('keypad-container');
        const actions = document.getElementById('action-buttons-container');
        const retryButton = document.getElementById('btn-retry');
        const nextButton = document.getElementById('btn-next');

        if (correct) {
            questionAnswered = true;
            playSound('correct');
            correctCount += 1;
            score += 1;
            document.getElementById('score-display').textContent = score;
            feedback.textContent = '🎉 Chính xác! Em làm rất tốt!';
            feedback.className = 'feedback-text success';
            keypad.classList.add('hidden');
            actions.classList.remove('hidden');
            retryButton.classList.add('hidden');
            nextButton.classList.remove('hidden');

            if (currentMode === 'challenge') {
                updateProgress();
                if (score >= CHALLENGE_TARGET) {
                    nextButton.textContent = 'NHẬN THƯỞNG 🏆';
                    nextButton.onclick = showSummary;
                } else {
                    nextButton.textContent = 'CÂU TIẾP ➜';
                    nextButton.onclick = nextQuestion;
                }
            } else {
                nextButton.textContent = 'CÂU TIẾP ➜';
                nextButton.onclick = nextQuestion;
            }
            return;
        }

        playSound('wrong');
        feedback.className = 'feedback-text error';

        if (currentMode === 'challenge') {
            score = 0;
            updateProgress();
            questionAnswered = true;
            feedback.textContent = `Chưa đúng! Điểm trở về 0. Đáp án đúng là ${currentProblem.answer}. Em hãy đọc lời giải rồi tiếp tục nhé.`;
            showRule(currentProblem);
            keypad.classList.add('hidden');
            actions.classList.remove('hidden');
            retryButton.classList.add('hidden');
            nextButton.classList.remove('hidden');
            nextButton.textContent = 'TIẾP TỤC THỬ THÁCH ➜';
            nextButton.onclick = nextQuestion;
        } else {
            feedback.textContent = '😊 Chưa chính xác. Em xem quy tắc và thử tính lại nhé!';
            showRule(currentProblem);
            actions.classList.remove('hidden');
            retryButton.classList.remove('hidden');
            nextButton.classList.add('hidden');
            // Không khóa bàn phím: học sinh có thể sửa đáp án ngay.
            keypad.classList.remove('hidden');
        }
    }

    function retryQuestion() {
        playSound('click');
        currentInput = '';
        questionAnswered = false;
        renderInput();
        document.getElementById('feedback-text').textContent = 'Em đã xem quy tắc. Hãy thử lại nhé!';
        document.getElementById('feedback-text').className = 'feedback-text';
        document.getElementById('action-buttons-container').classList.add('hidden');
        document.getElementById('keypad-container').classList.remove('hidden');
        // Giữ phần quy tắc hiển thị để học sinh vừa quan sát vừa làm lại.
    }

    function nextQuestion() {
        playSound('click');
        loadQuestion();
    }

    function showSummary() {
        playSound('complete');
        document.getElementById('view-game').classList.add('hidden');
        document.getElementById('view-summary').classList.remove('hidden');
        document.getElementById('final-score').textContent = `${score}/${CHALLENGE_TARGET}`;
    }

    function restartCurrentMode() {
        startPractice(currentMode);
    }

    function confirmGoHome() {
        playSound('click');
        if (!document.getElementById('view-game').classList.contains('hidden')) {
            document.getElementById('confirm-modal').classList.remove('hidden');
        } else {
            goHome();
        }
    }

    function closeConfirmModal() {
        playSound('click');
        document.getElementById('confirm-modal').classList.add('hidden');
    }

    function executeGoHome() {
        closeConfirmModal();
        goHome();
    }

    function goHome() {
        document.getElementById('view-game').classList.add('hidden');
        document.getElementById('view-summary').classList.add('hidden');
        document.getElementById('view-home').classList.remove('hidden');
        document.getElementById('home-btn').classList.add('hidden');
        document.getElementById('confirm-modal').classList.add('hidden');
    }

    // Hỗ trợ nhập bằng bàn phím vật lý.
    document.addEventListener('keydown', function (event) {
        if (document.getElementById('view-game').classList.contains('hidden')) return;
        if (event.key >= '0' && event.key <= '9') appendNumber(event.key);
        else if (event.key === '-') toggleNegative();
        else if (event.key === 'Backspace') deleteNumber();
        else if (event.key === 'Enter') {
            if (!document.getElementById('keypad-container').classList.contains('hidden')) submitAnswer();
            else if (!document.getElementById('btn-next').classList.contains('hidden')) nextQuestion();
        }
    });
	
	window.toggleFullscreen = async function () {
		if (typeof playSound === 'function') playSound('click');

		const root = document.documentElement;
		const isFullscreen = Boolean(
			document.fullscreenElement ||
			document.webkitFullscreenElement
		);

		try {
			if (isFullscreen) {
				if (document.exitFullscreen) {
					await document.exitFullscreen();
				} else if (document.webkitExitFullscreen) {
					document.webkitExitFullscreen();
				}
				return;
			}

			if (root.requestFullscreen) {
				await root.requestFullscreen();
			} else if (root.webkitRequestFullscreen) {
				root.webkitRequestFullscreen();
			} else {
				showFullscreenNotice();
			}
		} catch (error) {
			console.warn('Không thể bật toàn màn hình:', error);
			showFullscreenNotice();
		}
	};

	function updateFullscreenButton() {
		const button = document.getElementById('fullscreen-btn');
		if (!button) return;

		const isFullscreen = Boolean(
			document.fullscreenElement ||
			document.webkitFullscreenElement
		);

		button.textContent = isFullscreen ? '\u2922' : '\u26F6';
		button.title = isFullscreen ? 'Thoát toàn màn hình' : 'Bật toàn màn hình';
		button.setAttribute(
			'aria-label',
			isFullscreen ? 'Thoát toàn màn hình' : 'Bật toàn màn hình'
		);
	}

	function showFullscreenNotice() {
		alert(
			'Trình duyệt này chưa hỗ trợ bật toàn màn hình trực tiếp. ' +
			'Em có thể chọn "Thêm vào màn hình chính" trong menu trình duyệt.'
		);
	}

	document.addEventListener('fullscreenchange', updateFullscreenButton);
	document.addEventListener('webkitfullscreenchange', updateFullscreenButton);

	// Cập nhật trạng thái nút khi trang vừa tải
	document.addEventListener('DOMContentLoaded', updateFullscreenButton);