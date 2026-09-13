# MCQ Mock Test

A static, client-side mock-test website: 20 tests, 100 questions each, 2,000 questions total. No backend, no build step, no database — it runs entirely in the browser and is designed to be hosted on GitHub Pages for free.

## What's included

```
mfd-mock-tests/
├── index.html          Single-page app: home, quiz, feedback, result, review
├── style.css            All styling
├── script.js             All application logic
├── data/
│   ├── test1.csv         Sample test with 10 real questions
│   └── test2.csv … test20.csv   Placeholder files (3 sample rows each) — replace with your real questions
└── README.md
```

Everything is wired together with **relative paths** (`data/test1.csv`, not `/data/test1.csv`), so the site works both locally and when hosted at `https://USERNAME.github.io/REPOSITORY-NAME/`.

## External code used

- **[Papa Parse 5.4.1](https://www.papaparse.com/)**, loaded from the `cdnjs` CDN in `index.html`:
  `https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.4.1/papaparse.min.js`
  Used to parse the CSV files correctly — it handles quoted fields, commas inside quotes, escaped quotes, and Unicode text (including Telugu), which a simple `line.split(",")` cannot do reliably.
- **Google Fonts** (`Source Serif 4`, `Inter`, `Roboto Mono`), loaded in the `<head>` of `index.html`. Optional — the site will still work if this CDN is blocked, just with system fonts instead.

No other external libraries, frameworks, or services are used.

## How it works, at a glance

1. The home screen lists all 20 tests as cards. Clicking **Start test** fetches the matching `data/testN.csv` file.
2. `script.js` parses the CSV with Papa Parse, validates every row, and drops (and logs to the console) any row that's missing a field or has an invalid `Correct Option`.
3. The quiz shows one question at a time with a progress bar. Selecting an option enables **Submit answer**; submitting locks the question, highlights the correct option, and shows an explanation.
4. After question 100, a result screen shows the score, percentage, and a message based on performance. From there you can retake the test, review every answer, or go back to the test list.
5. Finished results are saved to the browser's `localStorage` and shown in **My test history** on the home page. Progress mid-test is saved to `sessionStorage` so an accidental page refresh doesn't lose your place.

No personal information is collected or stored anywhere — only test scores, dates, and question numbers, and only inside your own browser.

## CSV format (required)

Each `data/testN.csv` file must use exactly these column headers, in any order, on the first row:

```
Question Number,Question,Option A,Option B,Option C,Option D,Correct Option,Correct Answer,Explanation
```

| Column | Required | Notes |
|---|---|---|
| `Question Number` | Optional | Used for display only; the app numbers questions by position either way. |
| `Question` | Required | The question text. |
| `Option A` … `Option D` | Required | The four answer choices. |
| `Correct Option` | Required | Must be exactly `A`, `B`, `C`, or `D`. |
| `Correct Answer` | Recommended | The correct option's full text, shown in the feedback panel. If left blank, the app falls back to whichever `Option X` matches `Correct Option`. |
| `Explanation` | Recommended | Shown after the question is answered. If left blank, a placeholder message is shown instead. |

Formatting tips:

- Wrap any field that contains a comma, a quotation mark, or a line break in double quotes: `"like this, with a comma"`.
- To include a literal double quote inside a quoted field, double it: `"She said ""yes"""`.
- Save the file as UTF-8 so non-English text (Telugu, etc.) displays correctly.
- Each file should contain 100 data rows. If it has more or fewer, the app still works but logs a console warning — there's no hard requirement in the code, only for the intended test length.

## Adding your real questions

1. Open `data/test1.csv` in a spreadsheet program (Excel, Google Sheets, LibreOffice Calc) or a text editor.
2. Replace the sample rows with your real questions, keeping the header row and column order.
3. **Save/export as CSV (UTF-8)** — not `.xlsx`.
4. Repeat for `data/test2.csv` through `data/test20.csv` (each currently contains 3 placeholder rows marking where your real questions go).
5. Keep the filenames exactly as `test1.csv` … `test20.csv` inside the `data/` folder — the app builds these paths automatically from the test number.

## Renaming tests or changing the count

- Test titles ("Mock Test 1", etc.) are generated automatically from the test number in `script.js`. To use custom names (e.g. "Chapter 3 — Risk Management"), edit the `buildTestGrid()` function in `script.js` and the title-setting lines in `loadTest()` / `startTest()`.
- To change how many tests appear, edit the `TOTAL_TESTS` constant near the top of `script.js` and add/remove the matching CSV files.
- To change the questions-per-test target used for the warning message, edit `QUESTIONS_PER_TEST` in `script.js`.

## Enabling question randomization (optional, off by default)

Per the project requirements, questions are shown in the exact order they appear in the CSV, and answer choices are never shuffled. If you want randomized question order in the future, open `script.js` and set:

```js
var RANDOMIZE_QUESTION_ORDER = true;
```

Answer-choice order is intentionally never shuffled, because `Correct Option` refers to a fixed `A`/`B`/`C`/`D` position.

## Customizing colors and branding

All design tokens live at the top of `style.css` inside `:root`:

```css
:root {
  --ink: #1c2541;      /* primary text / header background */
  --paper: #eef0ea;    /* page background */
  --brass: #a9762f;    /* accent color: progress bar, links, badges */
  --success: #2e7d5b;  /* correct-answer color */
  --error: #b33f3f;    /* wrong-answer color */
  ...
}
```

Change these hex values to re-theme the whole site. To change the site name, edit the `<title>` tag and the `.brand-name` text in `index.html`.

## Running locally

Because the app loads CSV files with `fetch()`, opening `index.html` directly from the file system (`file://…`) will fail in most browsers due to CORS restrictions on local files. Instead, serve the folder with any simple local server, for example:

```bash
# Python 3
cd mfd-mock-tests
python3 -m http.server 8000
# then open http://localhost:8000 in your browser
```

or use any static server / editor "Live Server" extension you prefer. No `npm install` or build step is required.

## Deploying to GitHub Pages

1. **Create a GitHub repository** (e.g. `mcq-mock-tests`) and note your GitHub username.
2. **Create the folders** locally to match the structure above: the project root, plus a `data/` subfolder.
3. **Add the three website files** — `index.html`, `style.css`, `script.js` — to the project root.
4. **Add your 20 CSV files** into `data/`, named `test1.csv` through `test20.csv`.
5. **Test locally** using the steps above to confirm everything loads before publishing.
6. **Push everything to GitHub**, then enable GitHub Pages:
   - Go to the repository's **Settings → Pages**.
   - Under **Source**, choose the branch (usually `main`) and the `/ (root)` folder.
   - Save. GitHub will publish the site at `https://USERNAME.github.io/REPOSITORY-NAME/`.
7. **Test the live website**: open the published URL, confirm the home page loads, start a test, answer a few questions, finish it, and check that it appears under **My test history**.

Because every file reference in this project is a relative path, this works whether the repository is a normal project site (`.../REPOSITORY-NAME/`) or a user/organization root site (`USERNAME.github.io`).

## Accessibility notes

- Options are real `<input type="radio">` elements with associated `<label>`s, so they work with screen readers and are keyboard-operable (Tab to move, Space/Enter to select).
- Focus is visibly outlined throughout, including on custom answer cards.
- Color is never the only signal for correct/incorrect — a checkmark/cross symbol and text label are always shown alongside color.
- Animations are minimal and respect `prefers-reduced-motion`.
