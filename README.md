# SamanthaAI Screening Interview Agent

## Overview

This project implements a robust, LLM-powered screening interview agent for technical and behavioral interviews. It features:
- **LangChain/LLM-based logic** for dynamic, context-aware interviewing
- **Persistent session and answer tracking** using SQLite (`app.db`)
- **Progress bar and step tracking** compatible with the frontend UI
- **Seamless integration** between backend APIs and React frontend

---

## Key Features & Architecture

### 1. LangChain/LLM Integration
- The main interview flow is powered by a LangChain/LLM-based agent (see `app/api/screening/langgraph-conversation/route.ts`).
- The agent dynamically generates follow-ups, evaluates candidate responses, and manages interview state.
- Uses the Lemonfox LLM API for memory extraction, step evaluation, and agent responses.

### 2. Persistent Session & Answer Tracking
- **All session and answer data is stored in SQLite (`app.db`)**, not in-memory, ensuring reliability in serverless/production environments.
- Candidate answers are saved in the `candidate_answers_table` with step/question IDs, types, and answers.
- Interview steps are loaded from `screening_interview_steps` (ordered by `step_order`).
- Session state (current step, memory, etc.) is reconstructed on each request from the DB and request payload.

#### Database Tables
- `candidate_answers_table`: Tracks all candidate answers, keyed by candidate and question/step.
- `screening_interview_steps`: Defines the ordered steps/questions for each interview, including the `structure` field for progress tracking.

### 3. Progress Bar & Step Status
- The backend always returns an `allStepsWithStatus` array, with each step's `structure` and completion status (`completed` or `pending`).
- The frontend progress bar uses this array to display step completion and navigation.
- Step status is determined by checking for an answer in `candidate_answers_table` for each step.

### 4. API Endpoints
- **Legacy step-by-step API:** `app/api/screening/step-by-step/route.ts` (still uses persistent storage)
- **New LangChain/LLM API:** `app/api/screening/langgraph-conversation/route.ts`
  - Handles candidate messages, generates agent responses, saves answers, updates memory, and returns progress status.
  - Always saves the answer for the just-answered step and increments the step index if the agent determines to move forward.
  - Returns `allStepsWithStatus` for frontend progress bar compatibility.

### 5. Frontend Integration
- The React component (`components/screening-interface.tsx`) consumes the API, displays questions, collects answers, and renders the progress bar.
- Progress bar is always in sync with backend step status via `allStepsWithStatus`.

---

## Migration & Refactoring Notes

- **In-memory session management is deprecated.** All state is now persisted in SQLite for reliability.
- **Session and answer logic** in both legacy and new APIs has been refactored to use the DB.
- **Progress bar bugs** (repeating questions, stuck progress) are fixed by always saving answers and updating step status in the DB.
- **LangChain/LLM logic** is fully integrated, with robust session/answer persistence and progress tracking.

---

## Development & Testing

- To run locally, ensure `app.db` is present and migrated with the correct schema (see `database_migration.sql`).
- Test the full interview flow, including edge cases (interruptions, reloads, etc.).
- For new features or bugfixes, update both backend and frontend as needed to maintain compatibility.

---

## File Reference

- `app/api/screening/langgraph-conversation/route.ts`: Main LLM-based API logic
- `app/api/screening/step-by-step/route.ts`: Legacy step-by-step API
- `components/screening-interview/interviewManager.ts`: Session and step management
- `components/screening-interface.tsx`: Frontend UI and progress bar
- `candidate_answers_table`, `screening_interview_steps`: Main DB tables

---

## Changelog (Recent Major Changes)
- Migrated all session/answer logic to persistent SQLite storage
- Integrated LangChain/LLM agent for dynamic interviewing
- Fixed progress bar and step tracking bugs
- Updated API to always return `allStepsWithStatus` for frontend
- Documented new architecture and migration steps

---

For further details, see code comments in the main API and component files.
