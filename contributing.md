# Contributing to Koxik

First off, thanks for taking the time to contribute! 🎉

The following is a set of guidelines for contributing to Koxik. These are mostly guidelines, not rules. Use your best judgment and feel free to propose changes to this document in a pull request.

### Our Pledge

In the interest of fostering an open and welcoming environment, we as contributors and maintainers pledge to making participation in our project and our community a harassment-free experience for everyone, regardless of age, body size, disability, ethnicity, sex characteristics, gender identity and expression, level of experience, education, socio-economic status, nationality, personal appearance, race, religion, or sexual identity and orientation.

### Our Standards

Examples of behavior that contributes to creating a positive environment include:

*   Using welcoming and inclusive language
*   Being respectful of differing viewpoints and experiences
*   Gracefully accepting constructive criticism
*   Focusing on what is best for the community
*   Showing empathy towards other community members

Examples of unacceptable behavior by participants include:

*   The use of sexualized language or imagery and unwelcome sexual attention or advances
*   Trolling, insulting/derogatory comments, and personal or political attacks
*   Public or private harassment
*   Publishing others' private information without explicit permission
*   Other conduct which could reasonably be considered inappropriate in a professional setting

### Enforcement

Project maintainers are responsible for clarifying the standards of acceptable behavior and are expected to take appropriate and fair corrective action in response to any instances of unacceptable behavior, abusive, threatening, or harmful behavior.

Project maintainers have the right and responsibility to remove, edit, or reject comments, commits, code, wiki edits, issues, and other contributions that are not aligned to this Code of Conduct, or to ban temporarily or permanently any contributor for other behaviors that they deem inappropriate, threatening, offensive, or harmful.

## How Can I Contribute?

### Reporting Bugs

-   **Ensure the bug was not already reported** by searching on GitHub under [Issues](https://github.com/Oz-Org/Koxik/issues).
-   If you're unable to find an open issue addressing the problem, [open a new one](https://github.com/Oz-Org/Koxik/issues/new). Be sure to include a title and clear description, as much relevant information as possible, and a code sample or an executable test case demonstrating the expected behavior that is not occurring.

### Suggesting Enhancements

-   Open a new issue with a clear title and detailed description of the suggested enhancement.
-   Explain why this enhancement would be useful.

### Pull Requests

1.  Fork the repo and create your branch from `main`.
2.  If you've added code that should be tested, add tests.
3.  Ensure your code follows the existing style stringently.
4.  Make sure your code lints.
5.  Issue that Pull Request!

## Development Setup

1.  **Clone the repo**: `git clone https://github.com/Oz-Org/Koxik.git`
2.  **Install dependencies**: `bun install`
3.  **Setup Environment**: `cp .env.example .env` and configure your credentials.
4.  **Database**: Run `docker-compose up -d` to start the Postgres database.
5.  **Run Development Server**: `bun dev`

## Styleguides

### Git Commit Messages

-   Use the present tense ("Add feature" not "Added feature")
-   Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
-   Reference issues and pull requests liberally after the first line
