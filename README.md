# MC // Cipher Division

An interactive cybersecurity portfolio for Mia Cook, built for GitHub Pages with plain HTML, CSS, and JavaScript.

## Included

- Animated cyber globe and clickable operation nodes
- Classified Mode and Recruiter Mode
- Data-driven mission dossiers
- Technical gadget/tool showcase
- Credentials and education section
- Searchable cybersecurity vocabulary vault
- Owner Tools forms for drafting missions and vocabulary
- Responsive desktop, tablet, and mobile layout
- Accessible navigation and reduced-motion support

## Publish this starter

1. Unzip the package.
2. Copy everything inside the `cipher-division-portfolio` folder into the root of your `mcookcyber90.github.io` repository.
3. In GitHub Desktop, confirm the new and changed files.
4. Use the commit summary `Build Cipher Division portfolio dashboard`.
5. Select **Commit to main**.
6. Select **Push origin**.
7. Wait a few minutes and refresh `https://mcookcyber90.github.io`.

## Add your links

Open `index.html` in VS Code and search for `placeholder`. Replace the disabled résumé, LinkedIn, and email links only after you have the correct public URLs.

## Publish a new mission without redesigning the site

1. Open the live portfolio.
2. Select **Owner Tools** in the footer or **Draft a mission** above the mission cards.
3. Complete the Mission Builder form.
4. Select **Save local mission draft**.
5. Review the draft on the dashboard.
6. Return to Owner Tools and select **Export missions.json**.
7. Select **Export latest mission report.md** to create a structured report draft from your form entries.
8. Review, complete, and redact the report before placing it in the appropriate project repository.
9. Replace `data/missions.json` in the repository with the exported file.
10. Commit and push the change through GitHub Desktop.

Drafts saved in Owner Tools remain only in that browser until exported. This is intentional: GitHub Pages cannot securely write directly to a repository without an authenticated service.

## Add vocabulary

Use the Vocabulary Builder in Owner Tools, export `vocabulary.json`, and replace `data/vocabulary.json` before committing and pushing.

## Mission evidence structure

Create a separate repository for each major case study. A mission repository should normally include:

```text
README.md
screenshots/
evidence/
scripts/
reports/
references/
```

Do not publish passwords, API keys, personal data, restricted lab answers, malware samples, or employer-owned information.

## Local preview

Because the dashboard loads JSON files, opening `index.html` directly may block the mission data. In VS Code, install the Live Server extension, right-click `index.html`, and select **Open with Live Server**. GitHub Pages will load the files normally after publishing.

## Files you will update most often

- `data/missions.json` — project and mission content
- `data/vocabulary.json` — terms and analyst notes
- `assets/` — photo, résumé, and approved images
- `reports/` — public PDF reports

The visual layout code is in `index.html`, `styles.css`, `app.js`, and `globe.js`.
