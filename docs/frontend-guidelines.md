# Community Carpooling Frontend Guidelines

## 1. Design System

All developers must use SCSS variables from:

```text
src/styles/_variables.scss
```

Never hardcode colors.

Wrong:

```scss
background: #2563eb;
```

Correct:

```scss
background: $primary;
```

---

## 2. Component Structure

Each feature should follow:

```text

FeatureName/

├── Component.jsx
├── Component.scss

```

Example:

```text

Login/

├── Login.jsx
├── Login.scss

```

---

## 3. Page Layout

All pages should use:

```jsx
<div className="page-container">
```

provided by global.scss.

---

## 4. Buttons

Use predefined classes only.

```jsx
btn btn-primary
btn btn-success
btn btn-outline
```

Do not create new button styles unless discussed with the team.

---

## 5. Cards

Use:

```jsx
<div className="card">
```

for ride cards, user cards, recommendation cards, etc.

---

## 6. API Calls

Never call axios directly inside components.

Wrong:

```jsx
axios.get(...)
```

Correct:

```jsx
rideService.getRides();
```

Services must be inside:

```text
src/services/
```

---

## 7. Routing

Routes are registered only in:

```text
src/routes/
```

Avoid route definitions inside feature folders.

---

## 8. Naming Convention

Components:
PascalCase

```text
LoginPage.jsx
RouteMap.jsx
MatchCard.jsx
```

Variables:

```javascript
const rideData;
const userProfile;
```

SCSS classes:

```scss
.route-card
.match-score
.user-profile
```

---

## 9. Git Workflow

main
↑
develop
↑
feature/branches

Never push directly to main.

Merge flow:

feature -> develop -> main

---

## 10. Pre-Commit Ritual & Automated Linting (Husky)

To maintain code quality and prevent broken formatting from entering the repository, this project uses Husky paired with lint-staged.

### The Ritual

Whenever you run git commit, Husky automatically triggers an isolated linting workflow behind the scenes:

1.  Staging: It identifies only the files you have modified and staged (git add).

2.  Automated Fixing: It runs eslint --fix and formatting rules via Prettier only on those staged files.

3.  Safety Evaluation:

        If conflicts or syntax errors cannot be automatically resolved, the commit will fail.

        If a commit fails, your work is completely safe. Check your terminal output for error logs, resolve the breaking lines manually, and try the commit again.

### Manual Sanity Check

While Husky guards the gate, developers should still ensure their code passes basic health checks before creating a Pull Request:

1.npm run build passes cleanly.

2.No residual console.log() statements left behind.

3.No hardcoded local or absolute URLs.

4.New API endpoints are successfully documented.

5.SCSS variables are utilized correctly.

6.Responsive design has been checked across breakpoints.

---

## 11. Common Colors

Primary: Route Blue

Secondary: Eco Green

Accent: Notification Orange

Error: Red

Success: Green

These values must always come from \_variables.scss.
