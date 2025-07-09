candidate_status_table # SamanthaAI — Data Dictionary

This document defines the structure and logic of the database powering SamanthaAI, a dual-role (candidate/team leader) AI-powered hiring platform.

---

## Table: `user_roles`
**Purpose:** Core identity and authentication mapping using StackAuth.

| Field | Type | Description |
|-------|------|-------------|
| `user_id` | INT PK | Unique internal ID assigned to every user. |
| `stack_auth_id` | VARCHAR | External ID used by StackAuth for login. |
| `role` | ENUM('candidate', 'team_leader') | Decides which dashboard and permissions apply to the user. |

**Logic:**
- Drives conditional dashboard rendering.
- After login, creates entry in `candidate_table` or `team_leader_table` based on role.

---

## Table: `candidate_table`
**Purpose:** Contains all relevant candidate data parsed from their CV.

| Field | Type | Description |
|-------|------|-------------|
| `candidate_id` | INT PK | Unique candidate ID. |
| `user_id` | INT FK | References `user_roles.user_id`. |
| `name`, `age`, `cv_path`, `linkedin`, `github` | Various | Profile basics. |
| `experience_years`, `education`, `personal_projects` | Various | Career background and personal effort. |
| `introduction`, `cv_experience` | TEXT | Extracted summary by agents. |

---

## Table: `team_leader_table`
**Purpose:** Stores professional data of users in team leader role.

| Field | Type | Description |
|-------|------|-------------|
| `leader_id` | INT PK | Unique team leader ID. |
| `user_id` | INT FK | References `user_roles.user_id`. |
| `first_name`, `last_name`, `email` | VARCHAR | Professional contact info. |
| `department`, `notes` | TEXT | Contextual team info. |

---

## Table: `requirements_table`
**Purpose:** Central entry point for all hiring/simulation flows.

| Field | Type | Description |
|-------|------|-------------|
| `requirement_id` | INT PK | Unique requirement ID. |
| `creator_user_id` | INT FK | References `user_roles.user_id`. |
| `creator_role` | ENUM | Determines if it's a simulation or real job. |
| `role_name`, `responsibilities`, `required_skills`, `experience_required_years` | Various | Defines job expectations. |

---

## Table: `context_requirements_table`
**Purpose:** Additional info needed during screening and offer presentation. This info gives mor context about the conditions and espcific details for the role.
candidate_status_table 
| Field | Type | Description |
|-------|------|-------------|
| `context_id` | INT PK | Unique context entry. |
| `requirement_id` | INT FK | Linked job. |
| `salary_range`, `contract_type`, `start_date`, `schedule`, `extra_notes`, `exclusion_criteria` | Various | Expanded details for contextual understanding. |

---

## Table: `company_table`
**Purpose:** Contains meta information about the company involved.

| Field | Type | Description |
|-------|------|-------------|
| `company_id` | INT PK | Unique identifier. |
| `name`, `industry`, `size`, `location`, `website` | Various | Descriptive metadata about the company. |

---

## Tables for Interview Phases
Each interview phase (screening, behavioral, technical) has a pair of tables:
- **Questions Table** (e.g., `technical_questions_table`)
- **Answers Table** (e.g., `technical_answers_table`)

### Screening
#### `screening_questions_table`
| `screening_question_id`, `requirement_id`, `question`, `type` |

#### `screening_answers_table`
| `answer_id`, `candidate_id`, `screening_question_id`, `user_answer`, `score`, `feedback` |

### Behavioral
#### `behavioral_questions_table`
| `behavioral_question_id`, `requirement_id`, `question`, `ideal_traits` |

#### `behavioral_answers_table`
| `answer_id`, `candidate_id`, `behavioral_question_id`, `user_answer`, `score`, `feedback` |

### Technical
#### `technical_questions_table`
| `technical_question_id`, `requirement_id`, `question`, `ideal_answer` |

#### `technical_answers_table`
| `answer_id`, `candidate_id`, `technical_question_id`, `user_answer`, `score`, `feedback` |

---

## Table: `scores_table`
**Purpose:** Stores aggregated metrics per candidate per requirement. here will be implmented with mani metrics to evaluate candidates in each stage of the hirinh process.

| Field | Type | Description |
|-------|------|-------------|
| `score_id`, `candidate_id`, `requirement_id` | INT | Unique reference keys. |
| `initial_screening_score`, `technical_score`, `behavioral_score`, `project_score`, `matching_percentage` | INT | Score breakdowns. |

---

## Table: `user_project_submission_table`
**Purpose:** Final evaluation phase — candidate’s submitted project.

| Field | Type | Description |
|-------|------|-------------|
| `submission_id`, `candidate_id`, `requirement_id`, `submission_link`, `evaluation_score`, `evaluator_feedback`, `submitted_at` |

---

## Table: `candidate_assignments_table`
**Purpose:** Tracks which candidate is tied to which job.

| Field | Type | Description |
|-------|------|-------------|
| `assignment_id`, `requirement_id`, `candidate_id`, `assigned_by`, `assigned_at`, `status` |

---

## Table: `candidate_status_table`
**Purpose:** Tracks process state in each interview independently. this is used for candidates to pint to the last stage, that is for enhance the user experience for users and to allow him to continue from the last stage he was working

| Field | Type | Description |
|-------|------|-------------|
| `status_id`, `candidate_id`, `requirement_id`, `current_step`, `status` |

---

## Summary
The database system is highly normalized and modular. The `requirement_id` is the backbone for all process tracking, while `user_roles` and `role` guide access. Each interview type has atomic control of its questions and answers, allowing for scalable metric tracking and dynamic user experiences.

Let me know if you want this exported to a real `.md` file or visualized as a diagram.

