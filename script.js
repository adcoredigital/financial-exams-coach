/* ==========================================================================
   MCQ MOCK TEST — Application logic
   Static, client-side only. No build step, no server. Works on GitHub Pages
   project sites because every path used below is relative (never starts
   with "/").
   ========================================================================== */

(function () {
  "use strict";

  /* ------------------------------------------------------------------ *
   * Configuration
   * ------------------------------------------------------------------ */

  var TOTAL_TESTS = 20;
  var QUESTIONS_PER_TEST = 100;
  var LETTERS = ["A", "B", "C", "D"];

  // Flip this to true if you ever want questions shuffled per attempt.
  // Answer-choice order is intentionally left alone either way, since the
  // "Correct Option" letters in the CSV refer to fixed A/B/C/D positions.
  var RANDOMIZE_QUESTION_ORDER = false;

  var STORAGE_KEYS = {
    activeTest: "mcqMockTest.activeTest",
    history: "mcqMockTest.history"
  };

  /* ------------------------------------------------------------------ *
   * DOM references
   * ------------------------------------------------------------------ */

  var dom = {};

  function cacheDom() {
    dom.headerStatus = document.getElementById("headerStatus");
    dom.brandHomeBtn = document.getElementById("brandHomeBtn");

    dom.views = {
      home: document.getElementById("view-home"),
      loading: document.getElementById("view-loading"),
      error: document.getElementById("view-error"),
      quiz: document.getElementById("view-quiz"),
      result: document.getElementById("view-result")
    };

    dom.testGrid = document.getElementById("testGrid");

    dom.historyEmpty = document.getElementById("historyEmpty");
    dom.historyTableWrap = document.getElementById("historyTableWrap");
    dom.historyTableBody = document.getElementById("historyTableBody");
    dom.clearHistoryBtn = document.getElementById("clearHistoryBtn");

    dom.loadingText = document.getElementById("loadingText");
    dom.errorText = document.getElementById("errorText");
    dom.errorBackBtn = document.getElementById("errorBackBtn");

    dom.quizTestName = document.getElementById("quizTestName");
    dom.quitTestBtn = document.getElementById("quitTestBtn");
    dom.quizProgressLabel = document.getElementById("quizProgressLabel");
    dom.quizProgressPercent = document.getElementById("quizProgressPercent");
    dom.progressBar = document.getElementById("progressBar");
    dom.progressFill = document.getElementById("progressFill");
    dom.tallyCorrect = document.getElementById("tallyCorrect");
    dom.tallyWrong = document.getElementById("tallyWrong");

    dom.questionText = document.getElementById("questionText");
    dom.optionsList = document.getElementById("optionsList");

    dom.feedbackPanel = document.getElementById("feedbackPanel");
    dom.feedbackResult = document.getElementById("feedbackResult");
    dom.feedbackYourAnswer = document.getElementById("feedbackYourAnswer");
    dom.feedbackCorrectAnswer = document.getElementById("feedbackCorrectAnswer");
    dom.feedbackExplanationText = document.getElementById("feedbackExplanationText");

    dom.submitAnswerBtn = document.getElementById("submitAnswerBtn");
    dom.nextQuestionBtn = document.getElementById("nextQuestionBtn");

    dom.resultTestName = document.getElementById("resultTestName");
    dom.scoreRing = document.getElementById("scoreRing");
    dom.scoreRingValue = document.getElementById("scoreRingValue");
    dom.resultMessage = document.getElementById("resultMessage");
    dom.resultScoreFraction = document.getElementById("resultScoreFraction");
    dom.resultTotal = document.getElementById("resultTotal");
    dom.resultCorrect = document.getElementById("resultCorrect");
    dom.resultWrong = document.getElementById("resultWrong");
    dom.resultPercentage = document.getElementById("resultPercentage");

    dom.retakeTestBtn = document.getElementById("retakeTestBtn");
    dom.backToTestsBtn = document.getElementById("backToTestsBtn");
    dom.reviewAnswersBtn = document.getElementById("reviewAnswersBtn");

    dom.reviewPanel = document.getElementById("reviewPanel");
    dom.reviewList = document.getElementById("reviewList");

    dom.reviewModalOverlay = document.getElementById("reviewModalOverlay");
    dom.reviewModalClose = document.getElementById("reviewModalClose");
    dom.reviewModalEyebrow = document.getElementById("reviewModalEyebrow");
    dom.reviewModalTitle = document.getElementById("reviewModalTitle");
    dom.reviewModalYourAnswer = document.getElementById("reviewModalYourAnswer");
    dom.reviewModalCorrectAnswer = document.getElementById("reviewModalCorrectAnswer");
    dom.reviewModalExplanation = document.getElementById("reviewModalExplanation");
  }

  /* ------------------------------------------------------------------ *
   * Application state
   * ------------------------------------------------------------------ */

  var state = {
    testNumber: null,
    testName: "",
    questions: [],       // validated question objects for the active test
    currentIndex: 0,      // zero-based
    answers: [],           // one entry per question once answered: {selectedLetter, isCorrect}
    correctCount: 0,
    wrongCount: 0,
    hasSubmittedCurrent: false,
    selectedLetter: null
  };

  /* ------------------------------------------------------------------ *
   * View switching
   * ------------------------------------------------------------------ */

  function showView(name) {
    Object.keys(dom.views).forEach(function (key) {
      dom.views[key].hidden = key !== name;
    });
    window.scrollTo({ top: 0, behavior: "auto" });
    dom.headerStatus.textContent = name === "quiz" ? state.testName : "";
  }

  /* ------------------------------------------------------------------ *
   * Home view — test grid
   * ------------------------------------------------------------------ */

  function buildTestGrid() {
    var frag = document.createDocumentFragment();

    for (var i = 1; i <= TOTAL_TESTS; i++) {
      var card = document.createElement("article");
      card.className = "test-card";

      var top = document.createElement("div");
      top.className = "test-card-top";

      var num = document.createElement("span");
      num.className = "test-card-number";
      num.textContent = "No. " + String(i).padStart(2, "0");
      top.appendChild(num);

      var best = getBestHistoryForTest(i);
      if (best) {
        var badge = document.createElement("span");
        badge.className = "test-card-badge";
        badge.textContent = "Best " + best.percentage + "%";
        top.appendChild(badge);
      }

      var title = document.createElement("h3");
      title.className = "test-card-title";
      title.textContent = "Mock Test " + i;

      var meta = document.createElement("p");
      meta.className = "test-card-meta";
      meta.textContent = QUESTIONS_PER_TEST + " questions";

      var startBtn = document.createElement("button");
      startBtn.type = "button";
      startBtn.className = "btn btn-primary";
      startBtn.textContent = "Start test";
      startBtn.setAttribute("aria-label", "Start Mock Test " + i);
      (function (testNum) {
        startBtn.addEventListener("click", function () {
          loadTest(testNum);
        });
      })(i);

      card.appendChild(top);
      card.appendChild(title);
      card.appendChild(meta);
      card.appendChild(startBtn);
      frag.appendChild(card);
    }

    dom.testGrid.innerHTML = "";
    dom.testGrid.appendChild(frag);
  }

  function renderHomeView(clearActive) {
    if (clearActive) clearActiveTest();
    renderHistoryTable();
    showView("home");
  }

  /* ------------------------------------------------------------------ *
   * CSV loading + parsing
   * ------------------------------------------------------------------ */

  function loadTest(testNumber, resumeState) {
    state.testNumber = testNumber;
    state.testName = "Mock Test " + testNumber;

    dom.loadingText.textContent = "Loading Mock Test " + testNumber + "\u2026";
    showView("loading");

    var path = "data/test" + testNumber + ".csv";

    fetch(path)
      .then(function (response) {
        if (!response.ok) {
          throw new Error("HTTP " + response.status);
        }
        return response.text();
      })
      .then(function (csvText) {
        var rawRows = parseCSV(csvText);
        var validation = validateQuestions(rawRows);

        if (validation.questions.length === 0) {
          showError(
            "This mock test's question file looks empty or invalid. " +
            "Please check data/test" + testNumber + ".csv and try again."
          );
          return;
        }

        if (validation.warning) {
          console.warn(validation.warning);
        }
        if (validation.errors.length) {
          console.warn(
            "Skipped " + validation.errors.length + " invalid row(s) in test" +
            testNumber + ".csv:",
            validation.errors
          );
        }

        startTest(testNumber, validation.questions, resumeState);
      })
      .catch(function (err) {
        console.error("Failed to load " + path, err);
        showError("Unable to load this mock test. Please try again.");
      });
  }

  // Robust CSV parsing via Papa Parse (handles quoted fields, embedded
  // commas, embedded quotes, and Unicode/Telugu text correctly).
  function parseCSV(csvText) {
    var result = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: function (h) {
        return h.trim();
      }
    });
    return result.data || [];
  }

  // Validates and normalizes raw parsed rows into clean question objects.
  // Rows missing required fields, or with an invalid Correct Option, are
  // dropped (and reported) rather than allowed to break the quiz.
  function validateQuestions(rawRows) {
    var questions = [];
    var errors = [];

    rawRows.forEach(function (row, i) {
      var qNumber = (row["Question Number"] || "").toString().trim();
      var qText = (row["Question"] || "").toString().trim();
      var optA = (row["Option A"] || "").toString().trim();
      var optB = (row["Option B"] || "").toString().trim();
      var optC = (row["Option C"] || "").toString().trim();
      var optD = (row["Option D"] || "").toString().trim();
      var correctOption = (row["Correct Option"] || "").toString().trim().toUpperCase();
      var correctAnswer = (row["Correct Answer"] || "").toString().trim();
      var explanation = (row["Explanation"] || "").toString().trim();

      var missing = !qText || !optA || !optB || !optC || !optD || !correctOption;
      var validLetter = LETTERS.indexOf(correctOption) !== -1;

      if (missing || !validLetter) {
        errors.push({ row: i + 2, reason: missing ? "missing required field(s)" : "invalid Correct Option" });
        return;
      }

      questions.push({
        number: qNumber || String(questions.length + 1),
        text: qText,
        options: { A: optA, B: optB, C: optC, D: optD },
        correctOption: correctOption,
        correctAnswerText: correctAnswer || row["Option " + correctOption],
        explanation: explanation || "No explanation was provided for this question."
      });
    });

    var warning = null;
    if (questions.length !== QUESTIONS_PER_TEST) {
      warning = "This test has " + questions.length + " valid question(s); expected " +
        QUESTIONS_PER_TEST + ".";
    }

    return { questions: questions, errors: errors, warning: warning };
  }

  function showError(message) {
    dom.errorText.textContent = message;
    showView("error");
  }

  /* ------------------------------------------------------------------ *
   * Starting / resuming a test
   * ------------------------------------------------------------------ */

  function startTest(testNumber, questions, resumeState) {
    if (RANDOMIZE_QUESTION_ORDER) {
      questions = shuffleArray(questions.slice());
    }

    state.testNumber = testNumber;
    state.testName = "Mock Test " + testNumber;
    state.questions = questions;

    if (resumeState) {
      state.currentIndex = Math.min(resumeState.currentIndex || 0, questions.length - 1);
      state.answers = resumeState.answers || [];
      state.correctCount = resumeState.correctCount || 0;
      state.wrongCount = resumeState.wrongCount || 0;
    } else {
      state.currentIndex = 0;
      state.answers = [];
      state.correctCount = 0;
      state.wrongCount = 0;
    }

    state.hasSubmittedCurrent = state.answers[state.currentIndex] !== undefined;
    state.selectedLetter = state.hasSubmittedCurrent ? state.answers[state.currentIndex].selectedLetter : null;

    persistActiveTest();
    showQuestion(state.currentIndex);
    showView("quiz");
  }

  function shuffleArray(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return arr;
  }

  /* ------------------------------------------------------------------ *
   * Quiz — rendering a question
   * ------------------------------------------------------------------ */

  function showQuestion(index) {
    var question = state.questions[index];
    var total = state.questions.length;

    dom.quizTestName.textContent = state.testName;
    dom.quizProgressLabel.textContent = "Question " + (index + 1) + " of " + total;

    var percent = Math.round(((index + 1) / total) * 100);
    dom.quizProgressPercent.textContent = percent + "% completed";
    dom.progressFill.style.width = percent + "%";
    dom.progressBar.setAttribute("aria-valuenow", String(percent));

    dom.tallyCorrect.textContent = state.correctCount;
    dom.tallyWrong.textContent = state.wrongCount;

    dom.questionText.textContent = question.text;

    dom.optionsList.innerHTML = "";
    dom.optionsList.classList.remove("is-answered");

    var priorAnswer = state.answers[index];
    state.selectedLetter = priorAnswer ? priorAnswer.selectedLetter : null;
    state.hasSubmittedCurrent = !!priorAnswer;

    LETTERS.forEach(function (letter) {
      var row = document.createElement("div");
      row.className = "option-row";
      row.dataset.letter = letter;

      var input = document.createElement("input");
      input.type = "radio";
      input.name = "answerOption";
      input.id = "opt-" + letter;
      input.value = letter;
      input.checked = state.selectedLetter === letter;
      input.disabled = state.hasSubmittedCurrent;
      input.addEventListener("change", function () {
        selectAnswer(letter);
      });

      var label = document.createElement("label");
      label.setAttribute("for", "opt-" + letter);

      var letterBadge = document.createElement("span");
      letterBadge.className = "option-letter";
      letterBadge.textContent = letter;
      letterBadge.setAttribute("aria-hidden", "true");

      var textSpan = document.createElement("span");
      textSpan.className = "option-text";
      textSpan.textContent = question.options[letter];

      label.appendChild(letterBadge);
      label.appendChild(textSpan);
      row.appendChild(input);
      row.appendChild(label);
      dom.optionsList.appendChild(row);
    });

    if (state.hasSubmittedCurrent) {
      renderFeedback(priorAnswer.selectedLetter, priorAnswer.isCorrect, question, true);
    } else {
      dom.feedbackPanel.hidden = true;
      dom.submitAnswerBtn.hidden = false;
      dom.submitAnswerBtn.disabled = true;
      dom.nextQuestionBtn.hidden = true;
    }
  }

  function selectAnswer(letter) {
    if (state.hasSubmittedCurrent) return;
    state.selectedLetter = letter;
    dom.submitAnswerBtn.disabled = false;
  }

  /* ------------------------------------------------------------------ *
   * Quiz — submitting an answer
   * ------------------------------------------------------------------ */

  function submitAnswer() {
    if (!state.selectedLetter || state.hasSubmittedCurrent) return;

    var question = state.questions[state.currentIndex];
    var isCorrect = state.selectedLetter === question.correctOption;

    state.answers[state.currentIndex] = {
      selectedLetter: state.selectedLetter,
      isCorrect: isCorrect
    };

    if (isCorrect) {
      state.correctCount++;
    } else {
      state.wrongCount++;
    }

    state.hasSubmittedCurrent = true;
    dom.tallyCorrect.textContent = state.correctCount;
    dom.tallyWrong.textContent = state.wrongCount;

    persistActiveTest();
    renderFeedback(state.selectedLetter, isCorrect, question, false);
  }

  function renderFeedback(selectedLetter, isCorrect, question, isResume) {
    // Lock option list and mark correct / incorrect choices.
    dom.optionsList.classList.add("is-answered");
    Array.prototype.forEach.call(dom.optionsList.children, function (row) {
      var letter = row.dataset.letter;
      var input = row.querySelector("input");
      input.disabled = true;

      row.classList.remove("is-correct", "is-wrong-selected");
      if (letter === question.correctOption) {
        row.classList.add("is-correct");
      } else if (letter === selectedLetter) {
        row.classList.add("is-wrong-selected");
      }
    });

    dom.feedbackResult.textContent = isCorrect ? "\u2713 Correct!" : "\u2717 Incorrect";
    dom.feedbackResult.className = "feedback-result " + (isCorrect ? "is-correct" : "is-wrong");

    dom.feedbackYourAnswer.textContent = selectedLetter + ". " + question.options[selectedLetter];
    dom.feedbackCorrectAnswer.textContent = question.correctOption + ". " + question.options[question.correctOption];
    dom.feedbackExplanationText.textContent = question.explanation;

    var isLastQuestion = state.currentIndex >= state.questions.length - 1;
    dom.nextQuestionBtn.textContent = isLastQuestion ? "View results" : "Next question";

    dom.feedbackPanel.hidden = false;
    dom.submitAnswerBtn.hidden = true;
    dom.nextQuestionBtn.hidden = false;
    dom.nextQuestionBtn.focus();
  }

  /* ------------------------------------------------------------------ *
   * Quiz — advancing
   * ------------------------------------------------------------------ */

  function nextQuestion() {
    var isLast = state.currentIndex >= state.questions.length - 1;

    if (isLast) {
      finishTest();
      return;
    }

    state.currentIndex++;
    persistActiveTest();
    showQuestion(state.currentIndex);
  }

  function finishTest() {
    var result = calculateResult();
    saveResult(result);
    clearActiveTest();
    showResult(result);
  }

  /* ------------------------------------------------------------------ *
   * Scoring
   * ------------------------------------------------------------------ */

  function calculateResult() {
    var total = state.questions.length;
    var correct = state.correctCount;
    var wrong = state.wrongCount;
    var percentage = Math.round((correct / total) * 100);

    return {
      testNumber: state.testNumber,
      testName: state.testName,
      total: total,
      correct: correct,
      wrong: wrong,
      percentage: percentage,
      timestamp: Date.now()
    };
  }

  function messageForPercentage(pct) {
    if (pct >= 90) return "Excellent!";
    if (pct >= 80) return "Very good!";
    if (pct >= 60) return "Good!";
    if (pct >= 40) return "Needs improvement";
    return "Keep practicing";
  }

  /* ------------------------------------------------------------------ *
   * Result view
   * ------------------------------------------------------------------ */

  function showResult(result) {
    dom.resultTestName.textContent = result.testName;
    dom.scoreRing.style.setProperty("--pct", String(result.percentage));
    dom.scoreRingValue.textContent = result.percentage + "%";
    dom.resultMessage.textContent = messageForPercentage(result.percentage);
    dom.resultScoreFraction.textContent = result.correct + " / " + result.total;
    dom.resultTotal.textContent = result.total;
    dom.resultCorrect.textContent = result.correct;
    dom.resultWrong.textContent = result.wrong;
    dom.resultPercentage.textContent = result.percentage + "%";

    dom.reviewPanel.hidden = true;
    dom.reviewAnswersBtn.textContent = "Review answers";

    showView("result");
  }

  function reviewAnswers() {
    var isOpen = !dom.reviewPanel.hidden;
    if (isOpen) {
      dom.reviewPanel.hidden = true;
      dom.reviewAnswersBtn.textContent = "Review answers";
      return;
    }

    dom.reviewList.innerHTML = "";
    var frag = document.createDocumentFragment();

    state.questions.forEach(function (question, i) {
      var answer = state.answers[i];
      var isCorrect = answer ? answer.isCorrect : false;

      var item = document.createElement("button");
      item.type = "button";
      item.className = "review-item " + (isCorrect ? "is-correct" : "is-wrong");

      var label = document.createElement("span");
      label.textContent = "Question " + (i + 1);

      var mark = document.createElement("span");
      mark.className = "review-item-mark";
      mark.textContent = isCorrect ? "\u2713" : "\u2717";

      item.appendChild(label);
      item.appendChild(mark);
      item.addEventListener("click", function () {
        openReviewDetail(i);
      });

      frag.appendChild(item);
    });

    dom.reviewList.appendChild(frag);
    dom.reviewPanel.hidden = false;
    dom.reviewAnswersBtn.textContent = "Hide review";
    dom.reviewPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function openReviewDetail(index) {
    var question = state.questions[index];
    var answer = state.answers[index];
    var selectedLetter = answer ? answer.selectedLetter : null;

    dom.reviewModalEyebrow.textContent = "Question " + (index + 1) + " of " + state.questions.length;
    dom.reviewModalTitle.textContent = question.text;
    dom.reviewModalYourAnswer.textContent = selectedLetter
      ? selectedLetter + ". " + question.options[selectedLetter]
      : "Not answered";
    dom.reviewModalCorrectAnswer.textContent = question.correctOption + ". " + question.options[question.correctOption];
    dom.reviewModalExplanation.textContent = question.explanation;

    dom.reviewModalOverlay.hidden = false;
    dom.reviewModalClose.focus();
  }

  function closeReviewDetail() {
    dom.reviewModalOverlay.hidden = true;
  }

  /* ------------------------------------------------------------------ *
   * Retake / navigation
   * ------------------------------------------------------------------ */

  function retakeTest() {
    var testNumber = state.testNumber;
    var questions = state.questions;

    state.currentIndex = 0;
    state.answers = [];
    state.correctCount = 0;
    state.wrongCount = 0;
    state.hasSubmittedCurrent = false;
    state.selectedLetter = null;

    persistActiveTest();
    showQuestion(0);
    showView("quiz");
  }

  function returnToTests() {
    clearActiveTest();
    renderHomeView(false);
  }

  function quitTest() {
    var confirmed = window.confirm(
      "End this test now? Your progress on " + state.testName + " will be cleared."
    );
    if (!confirmed) return;
    clearActiveTest();
    renderHomeView(false);
  }

  /* ------------------------------------------------------------------ *
   * Persistence — resume-on-refresh (sessionStorage)
   * ------------------------------------------------------------------ */

  function persistActiveTest() {
    try {
      var payload = {
        testNumber: state.testNumber,
        currentIndex: state.currentIndex,
        answers: state.answers,
        correctCount: state.correctCount,
        wrongCount: state.wrongCount
      };
      sessionStorage.setItem(STORAGE_KEYS.activeTest, JSON.stringify(payload));
    } catch (e) {
      console.warn("Could not persist test progress:", e);
    }
  }

  function clearActiveTest() {
    try {
      sessionStorage.removeItem(STORAGE_KEYS.activeTest);
    } catch (e) {
      /* ignore */
    }
  }

  function tryRestoreActiveTest() {
    var raw;
    try {
      raw = sessionStorage.getItem(STORAGE_KEYS.activeTest);
    } catch (e) {
      return false;
    }
    if (!raw) return false;

    var saved;
    try {
      saved = JSON.parse(raw);
    } catch (e) {
      return false;
    }
    if (!saved || !saved.testNumber) return false;

    loadTest(saved.testNumber, saved);
    return true;
  }

  /* ------------------------------------------------------------------ *
   * Persistence — result history (localStorage)
   * ------------------------------------------------------------------ */

  function loadHistory() {
    try {
      var raw = localStorage.getItem(STORAGE_KEYS.history);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.warn("Could not read test history:", e);
      return [];
    }
  }

  function saveResult(result) {
    try {
      var history = loadHistory();
      history.unshift(result);
      // Keep the list from growing without bound.
      if (history.length > 200) history = history.slice(0, 200);
      localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(history));
    } catch (e) {
      console.warn("Could not save test result:", e);
    }
  }

  function clearHistory() {
    var confirmed = window.confirm("Clear all saved test history? This cannot be undone.");
    if (!confirmed) return;
    try {
      localStorage.removeItem(STORAGE_KEYS.history);
    } catch (e) {
      /* ignore */
    }
    renderHistoryTable();
  }

  function getBestHistoryForTest(testNumber) {
    var history = loadHistory();
    var best = null;
    history.forEach(function (entry) {
      if (entry.testNumber !== testNumber) return;
      if (!best || entry.percentage > best.percentage) best = entry;
    });
    return best;
  }

  function renderHistoryTable() {
    var history = loadHistory();

    if (!history.length) {
      dom.historyEmpty.hidden = false;
      dom.historyTableWrap.hidden = true;
      dom.clearHistoryBtn.hidden = true;
      return;
    }

    dom.historyEmpty.hidden = true;
    dom.historyTableWrap.hidden = false;
    dom.clearHistoryBtn.hidden = false;

    dom.historyTableBody.innerHTML = "";
    var frag = document.createDocumentFragment();

    history.forEach(function (entry) {
      var tr = document.createElement("tr");

      var tdTest = document.createElement("td");
      tdTest.textContent = entry.testName || ("Mock Test " + entry.testNumber);

      var tdDate = document.createElement("td");
      tdDate.textContent = formatDate(entry.timestamp);

      var tdScore = document.createElement("td");
      tdScore.textContent = entry.correct + " / " + entry.total;

      var tdPct = document.createElement("td");
      tdPct.textContent = entry.percentage + "%";
      tdPct.className = scoreClassForPercentage(entry.percentage);

      tr.appendChild(tdTest);
      tr.appendChild(tdDate);
      tr.appendChild(tdScore);
      tr.appendChild(tdPct);
      frag.appendChild(tr);
    });

    dom.historyTableBody.appendChild(frag);
  }

  function scoreClassForPercentage(pct) {
    if (pct >= 80) return "history-score-good";
    if (pct >= 60) return "history-score-mid";
    return "history-score-bad";
  }

  function formatDate(timestamp) {
    var d = new Date(timestamp);
    var day = String(d.getDate()).padStart(2, "0");
    var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return day + " " + months[d.getMonth()] + " " + d.getFullYear();
  }

  /* ------------------------------------------------------------------ *
   * Event wiring
   * ------------------------------------------------------------------ */

  function bindEvents() {
    dom.brandHomeBtn.addEventListener("click", function () {
      if (!dom.views.quiz.hidden) {
        quitTest();
      } else {
        renderHomeView(false);
      }
    });

    dom.clearHistoryBtn.addEventListener("click", clearHistory);
    dom.errorBackBtn.addEventListener("click", function () {
      renderHomeView(true);
    });

    dom.submitAnswerBtn.addEventListener("click", submitAnswer);
    dom.nextQuestionBtn.addEventListener("click", nextQuestion);
    dom.quitTestBtn.addEventListener("click", quitTest);

    dom.retakeTestBtn.addEventListener("click", retakeTest);
    dom.backToTestsBtn.addEventListener("click", returnToTests);
    dom.reviewAnswersBtn.addEventListener("click", reviewAnswers);

    dom.reviewModalClose.addEventListener("click", closeReviewDetail);
    dom.reviewModalOverlay.addEventListener("click", function (e) {
      if (e.target === dom.reviewModalOverlay) closeReviewDetail();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !dom.reviewModalOverlay.hidden) closeReviewDetail();
    });
  }

  /* ------------------------------------------------------------------ *
   * Init
   * ------------------------------------------------------------------ */

  function init() {
    cacheDom();
    bindEvents();
    buildTestGrid();

    var restored = tryRestoreActiveTest();
    if (!restored) {
      renderHomeView(false);
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
