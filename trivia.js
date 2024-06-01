import { getFirestore, collection, addDoc, getDocs, query, orderBy, limit, doc, runTransaction, getDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

const db = window.db;

let currentQuestionIndex = 0;
let questions = [];
let score = 0;
const totalQuestions = 15;

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('submitAnswerButton').addEventListener('click', checkAnswer);
    loadQuestions();
    retrieveHighScores();
});

function shuffleQuestions(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function loadQuestions() {
    fetch('questions.json')
        .then(response => response.json())
        .then(data => {
            questions = data;
            shuffleQuestions(questions);
            displayQuestion();
        })
        .catch(error => console.error('Error loading the questions:', error));
}

function displayQuestion() {
    if (currentQuestionIndex < totalQuestions && currentQuestionIndex < questions.length) {
        const questionElement = document.getElementById('question');
        if (questionElement) {
            questionElement.textContent = questions[currentQuestionIndex].Questions;
            document.getElementById('userAnswer').value = '';
            document.getElementById('feedback').textContent = '';
            updateScoreDisplay();
        } else {
            console.error('Question element not found');
        }
    } else {
        endGame();
    }
}

function checkAnswer() {
    const userAnswer = document.getElementById('userAnswer').value.trim().toLowerCase();
    const correctAnswer = questions[currentQuestionIndex].Answers.toLowerCase();
    const distance = levenshteinDistance(userAnswer, correctAnswer);
    if (distance <= 2) {
        document.getElementById('feedback').textContent = 'Correct!';
        score += 5;
    } else {
        document.getElementById('feedback').textContent = 'Wrong!';
    }
    currentQuestionIndex++;
    setTimeout(displayQuestion, 2000);
}

function updateScoreDisplay() {
    document.getElementById('currentScore').textContent = `Current Score: ${score}`;
}

function endGame() {
    document.getElementById('question').textContent = 'Game Over!';
    document.getElementById('feedback').textContent = '';
    document.getElementById('currentScore').textContent = `Final Score: ${score}`;
    document.getElementById('userAnswer').style.display = 'none';
    document.getElementById('userNamePrompt').style.display = 'block';
}

function submitScore() {
    const userName = document.getElementById('userName').value.trim();
    if (userName.length > 0) {
        saveHighScore(userName, score);
        document.getElementById('userNamePrompt').style.display = 'none';
        retrieveHighScores();
    } else {
        alert("Please enter a name.");
    }
}

function levenshteinDistance(s, t) {
    if (s.length === 0) return t.length;
    if (t.length === 0) return s.length;

    let v0 = Array(t.length + 1).fill(0);
    let v1 = Array(t.length + 1).fill(0);

    for (let i = 1; i <= t.length; i++) {
        v0[i] = i;
    }

    for (let i = 1; i <= s.length; i++) {
        v1[0] = i;

        for (let j = 1; j <= t.length; j++) {
            const cost = s[i - 1] === t[j - 1] ? 0 : 1;
            v1[j] = Math.min(v1[j - 1] + 1, v0[j] + 1, v0[j - 1] + cost);
        }

        [v0, v1] = [v1, v0];
    }

    return v0[t.length];
}

function saveHighScore(userName, score) {
    const scoresRef = collection(db, "highScores");
    addDoc(scoresRef, {
        name: userName,
        score: score,
        timestamp: serverTimestamp()
    }).then(() => {
        console.log("Score saved!");
    }).catch((error) => {
        console.error("Error saving score: ", error);
    });
}

function retrieveHighScores() {
    const scoresRef = collection(db, "highScores");
    const q = query(scoresRef, orderBy("score", "desc"), limit(3));
    getDocs(q).then((querySnapshot) => {
        const scoresList = document.getElementById('topScoresList');
        scoresList.innerHTML = '';
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const scoreEntry = document.createElement('li');
            scoreEntry.textContent = `${data.name}: ${data.score}`;
            scoresList.appendChild(scoreEntry);
        });
    }).catch(error => {
        console.error("Error retrieving high scores:", error);
    });
}
