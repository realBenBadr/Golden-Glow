class TriviaGame {
    constructor() {
        this.initializeVariables();
        this.initializeElements();
        this.initializeEventListeners();
        this.loadQuestions();
    }

    initializeVariables() {
        this.currentScore = 0;
        this.currentLevel = 1;
        this.lives = 3;
        this.currentQuestion = null;
        this.timer = null;
        this.timeLeft = 15; // seconds per question
        this.questions = [];
        this.usedQuestions = new Set();
        this.lifelines = {
            fiftyFifty: 2,
            hint: 2,
            skip: 1
        };
    }

    initializeElements() {
        // Stats elements
        this.scoreElement = document.getElementById('current-score');
        this.levelElement = document.getElementById('current-level');
        this.livesElement = document.getElementById('remaining-lives');

        // Question elements
        this.questionText = document.getElementById('question-text');
        this.answerButtons = document.querySelectorAll('.answer-button');
        this.timerProgress = document.querySelector('.timer-progress');

        // Lifeline buttons
        this.fiftyFiftyButton = document.getElementById('fifty-fifty');
        this.hintButton = document.getElementById('hint');
        this.skipButton = document.getElementById('skip');

        // Message elements
        this.messageOverlay = document.querySelector('.message-overlay');
        this.messageTitle = document.querySelector('.message-title');
        this.messageText = document.querySelector('.message-text');
        this.continueButton = document.querySelector('.continue-button');
        this.retryButton = document.querySelector('.retry-button');

        // Gate elements
        this.leftGate = document.querySelector('.left-gate');
        this.rightGate = document.querySelector('.right-gate');
    }

    initializeEventListeners() {
        // Answer button listeners
        this.answerButtons.forEach(button => {
            button.addEventListener('click', (e) => this.handleAnswer(e));
        });

        // Lifeline button listeners
        this.fiftyFiftyButton.addEventListener('click', () => this.useFiftyFifty());
        this.hintButton.addEventListener('click', () => this.useHint());
        this.skipButton.addEventListener('click', () => this.useSkip());

        // Message button listeners
        this.continueButton.addEventListener('click', () => this.continueGame());
        this.retryButton.addEventListener('click', () => this.restartGame());
    }

    async loadQuestions() {
        // Temporary questions for testing
        this.questions = [
            {
                question: "What is the capital of France?",
                answers: ["London", "Berlin", "Paris", "Madrid"],
                correctAnswer: 2,
                difficulty: 1,
                category: "Geography",
                explanation: "Paris is the capital and largest city of France."
            },
            // Add more questions here
        ];

        this.startGame();
    }

    startGame() {
        this.updateStats();
        this.showNextQuestion();
    }

    showNextQuestion() {
        if (this.timer) clearInterval(this.timer);
        
        // Get a random question for the current level
        const availableQuestions = this.questions.filter(q => 
            q.difficulty === this.currentLevel && !this.usedQuestions.has(q)
        );

        if (availableQuestions.length === 0) {
            this.handleLevelComplete();
            return;
        }

        const randomIndex = Math.floor(Math.random() * availableQuestions.length);
        this.currentQuestion = availableQuestions[randomIndex];
        this.usedQuestions.add(this.currentQuestion);

        // Display the question and answers
        this.questionText.textContent = this.currentQuestion.question;
        this.answerButtons.forEach((button, index) => {
            button.textContent = this.currentQuestion.answers[index];
            button.className = 'answer-button';
            button.disabled = false;
        });

        // Reset and start timer
        this.timeLeft = 15;
        this.startTimer();

        // Close the gates
        this.closeGates();
    }

    startTimer() {
        this.timerProgress.style.width = '100%';
        this.timer = setInterval(() => {
            this.timeLeft--;
            this.timerProgress.style.width = `${(this.timeLeft / 15) * 100}%`;
            
            if (this.timeLeft <= 0) {
                this.handleTimeUp();
            }
        }, 1000);
    }

    handleAnswer(event) {
        clearInterval(this.timer);
        const selectedIndex = parseInt(event.target.dataset.index);
        const isCorrect = selectedIndex === this.currentQuestion.correctAnswer;

        // Disable all buttons
        this.answerButtons.forEach(button => button.disabled = true);

        // Show correct/incorrect styling
        event.target.classList.add(isCorrect ? 'correct' : 'incorrect');
        if (!isCorrect) {
            this.answerButtons[this.currentQuestion.correctAnswer].classList.add('correct');
        }

        // Update score and show feedback
        setTimeout(() => {
            if (isCorrect) {
                this.handleCorrectAnswer();
            } else {
                this.handleIncorrectAnswer();
            }
        }, 1500);
    }

    handleCorrectAnswer() {
        this.currentScore += Math.ceil(this.timeLeft * 10);
        this.openGates();
        
        setTimeout(() => {
            this.showMessage('Correct!', this.currentQuestion.explanation, 'continue');
        }, 500);
    }

    handleIncorrectAnswer() {
        this.lives--;
        this.updateStats();

        if (this.lives <= 0) {
            this.handleGameOver();
        } else {
            this.showMessage('Incorrect', this.currentQuestion.explanation, 'continue');
        }
    }

    handleTimeUp() {
        clearInterval(this.timer);
        this.lives--;
        this.updateStats();

        if (this.lives <= 0) {
            this.handleGameOver();
        } else {
            this.showMessage('Time\'s Up!', 'You ran out of time.', 'continue');
        }
    }

    handleLevelComplete() {
        this.currentLevel++;
        this.usedQuestions.clear();
        this.showMessage(
            'Level Complete!',
            `Congratulations! You've completed level ${this.currentLevel - 1}`,
            'continue'
        );
    }

    handleGameOver() {
        this.showMessage(
            'Game Over',
            `Final Score: ${this.currentScore}`,
            'retry'
        );
    }

    showMessage(title, text, type) {
        this.messageTitle.textContent = title;
        this.messageText.textContent = text;
        this.continueButton.style.display = type === 'continue' ? 'block' : 'none';
        this.retryButton.style.display = type === 'retry' ? 'block' : 'none';
        this.messageOverlay.classList.remove('hidden');
    }

    continueGame() {
        this.messageOverlay.classList.add('hidden');
        this.showNextQuestion();
    }

    restartGame() {
        this.initializeVariables();
        this.updateStats();
        this.messageOverlay.classList.add('hidden');
        this.startGame();
    }

    updateStats() {
        this.scoreElement.textContent = this.currentScore;
        this.levelElement.textContent = this.currentLevel;
        this.livesElement.textContent = this.lives;
    }

    // Lifeline methods
    useFiftyFifty() {
        if (this.lifelines.fiftyFifty <= 0) return;
        
        this.lifelines.fiftyFifty--;
        this.fiftyFiftyButton.disabled = this.lifelines.fiftyFifty <= 0;

        const wrongAnswers = this.answerButtons.length - 1;
        const answersToRemove = 2;
        let removed = 0;

        while (removed < answersToRemove) {
            const index = Math.floor(Math.random() * this.answerButtons.length);
            const button = this.answerButtons[index];
            
            if (index !== this.currentQuestion.correctAnswer && !button.disabled) {
                button.disabled = true;
                button.textContent = '';
                removed++;
            }
        }
    }

    useHint() {
        if (this.lifelines.hint <= 0) return;
        
        this.lifelines.hint--;
        this.hintButton.disabled = this.lifelines.hint <= 0;

        // Show hint message
        this.showMessage('Hint', this.currentQuestion.explanation, 'continue');
    }

    useSkip() {
        if (this.lifelines.skip <= 0) return;
        
        this.lifelines.skip--;
        this.skipButton.disabled = this.lifelines.skip <= 0;

        this.showNextQuestion();
    }

    // Gate animation methods
    openGates() {
        this.leftGate.parentElement.classList.add('gates-open');
    }

    closeGates() {
        this.leftGate.parentElement.classList.remove('gates-open');
    }
}

// Initialize the game when the document is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.game = new TriviaGame();
}); 