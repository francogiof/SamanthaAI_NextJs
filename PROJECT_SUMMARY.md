# Multi-Tenant Hiring Platform - Project Summary

## Overview
This project is a comprehensive multi-tenant hiring platform built with Next.js, featuring an AI-powered screening interview agent. The platform enables companies to create job requirements, screen candidates through automated interviews, and manage the entire hiring process through a modern web interface.

## Tech Stack
- **Frontend**: Next.js 14 with App Router, TypeScript, Tailwind CSS, Shadcn UI
- **Backend**: Next.js API Routes, SQLite database
- **AI/ML**: LangChain.js, Lemonfox LLM API (GPT-4o-mini)
- **Voice**: Web Speech API, Lemonfox TTS/STT
- **Authentication**: Stack Auth (multi-tenant)
- **Database**: SQLite with comprehensive schema

## Key Features Implemented

### 1. Database Architecture & Migration
**File**: `database_migration.sql`

The platform uses a comprehensive database schema with the following core tables:

#### Core Tables:
- `requirements_table` - Job requirements and role specifications
- `candidate_table` - Candidate profiles and information
- `company_table` - Company information and details
- `context_requirements_table` - Additional job context (salary, contract type, etc.)

#### Interview System Tables:
- `screening_questions_table` - AI-generated screening questions
- `screening_answers_table` - Candidate responses to screening questions
- `behavioral_questions_table` - Behavioral interview questions
- `behavioral_answers_table` - Behavioral interview responses
- `technical_questions_table` - Technical assessment questions
- `technical_answers_table` - Technical interview responses

#### Management Tables:
- `candidate_status_table` - Tracks candidate progress through hiring stages

**Key Migration Achievements:**
- Added primary key constraints to prevent foreign key issues
- Migrated from old `qa_table` to new `technical_questions_table`
- Cleaned duplicate data and fixed data type inconsistencies
- Established proper foreign key relationships

### 2. AI-Powered Placeholder Completion
**File**: `app/api/screening/register-steps/route.ts`

#### Features:
- **AI-Powered Placeholder Completion**: Uses Lemonfox LLM to intelligently complete interview script placeholders
- **Contextual Personalization**: Generates personalized content based on candidate background, experience, and role requirements
- **Fallback System**: Falls back to simple placeholder replacement if AI is unavailable
- **Structured Approach**: Processes static and semi-static interview steps with AI enhancement

#### Technical Implementation:
- **Lemonfox LLM Integration**: Uses GPT-4o-mini for intelligent placeholder completion
- **Rich Context**: Incorporates candidate projects, education, experience, and role requirements
- **Database Storage**: Automatically saves completed steps to `screening_interview_steps` table
- **Error Handling**: Comprehensive error handling with fallback to simple replacement
- **Async Processing**: Handles AI API calls asynchronously for better performance

#### AI Prompt Engineering:
The system uses sophisticated prompts that include:
- Candidate background and experience data
- Role-specific requirements and responsibilities
- Company context and job details
- Step-specific information and focus areas
- Professional tone and engagement guidelines

#### Placeholder Completion Process:
1. **Data Gathering**: Collects candidate, job, and company data from database
2. **Context Building**: Creates rich context for AI processing
3. **AI Completion**: Sends each step to LLM for intelligent placeholder completion
4. **Database Storage**: Saves completed steps with personalized content
5. **Fallback Handling**: Uses simple replacement if AI fails

### 3. Voice Chat Integration
**File**: `VOICE_CHAT_INTEGRATION.md`, `components/screening-interface.tsx`

#### Real-Time Voice Features:
- **Web Speech API**: Browser-native speech recognition for real-time transcription
- **Lemonfox TTS**: High-quality text-to-speech for AI agent responses
- **Automatic Flow**: Seamless conversation flow with countdown timers
- **Visual Indicators**: Google Meet-style visual feedback for speaking states

#### User Experience:
- **Permission Management**: Proper microphone permission handling
- **Visual Feedback**: Pulsing avatars, animated dots, and status indicators
- **Error Recovery**: Graceful handling of permission denials and API failures
- **Cross-Browser Support**: Works on Chrome, Edge, Safari (Firefox with limitations)

### 4. Frontend Application Flow
**File**: `app/dashboard/candidate/application/[requirementId]/page.tsx`

#### Multi-Step Hiring Process:
1. **CV Upload & Profile Creation** - Parse and confirm candidate information
2. **Screening Interview** - AI-powered video interview with voice chat
3. **Behavioral Interview** - Structured behavioral assessment
4. **Technical Interview** - Role-specific technical questions
5. **Mini Project Challenge** - Practical assessment

#### Key UI Components:
- **Step Progress Bar**: Visual progress tracking through hiring stages
- **Camera/Microphone Preview**: Pre-interview setup and testing
- **Question Generation Button**: Trigger AI question generation
- **Interview Interface**: Full-screen video chat with AI agent
- **Results Display**: Score and pass/fail status

#### Technical Features:
- **Media Stream Management**: Camera and microphone stream handling
- **Audio Level Monitoring**: Real-time audio level visualization
- **Permission Handling**: Browser permission request flow
- **State Management**: Complex state handling for interview flow

### 5. API Architecture
**Directory**: `app/api/`

#### Core Endpoints:
- `/api/screening/register-steps` - Register screening interview steps with AI completion
- `/api/screening/start` - Initialize screening session
- `/api/screening/conversation` - Real-time conversation with AI interviewer
- `/api/screening/score` - Calculate and store screening scores
- `/api/speech/tts` - Text-to-speech conversion
- `/api/speech/stt` - Speech-to-text conversion
- `/api/candidate/*` - Candidate management
- `/api/requirements/*` - Job requirements management

#### Data Flow:
1. **Question Generation**: Requirements + Candidate → AI → Database
2. **Interview Flow**: Questions → TTS → Voice Chat → STT → Scoring
3. **Results Storage**: Scores and feedback stored in database

## Database Schema Highlights

### Requirements Table Structure:
```sql
CREATE TABLE requirements_table (
    requirement_id TEXT PRIMARY KEY,
    role_name TEXT NOT NULL,
    responsibilities TEXT,
    required_skills TEXT,
    experience_required_years INTEGER,
    company_id TEXT,
    creator_user_id TEXT
);
```

### Candidate Table Structure:
```sql
CREATE TABLE candidate_table (
    candidate_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    experience_years INTEGER,
    education TEXT,
    personal_projects TEXT,
    introduction TEXT,
    cv_experience TEXT,
    user_id TEXT
);
```

### Screening Questions Table:
```sql
CREATE TABLE screening_questions_table (
    screening_question_id TEXT PRIMARY KEY,
    requirement_id TEXT NOT NULL,
    question TEXT NOT NULL,
    type TEXT NOT NULL,
    FOREIGN KEY (requirement_id) REFERENCES requirements_table(requirement_id)
);
```

## Environment Configuration

### Required Environment Variables:
```bash
LEMONFOX_LLM_KEY=your_lemonfox_api_key
LEMONFOX_TTS_KEY=your_lemonfox_tts_key
```

### Database Configuration:
- SQLite database file: `app.db`
- Automatic migrations via `database_migration.sql`
- Foreign key constraints enabled

## Key Achievements

### 1. Database Migration Success
- Successfully migrated from old schema to new comprehensive structure
- Fixed foreign key constraint issues
- Cleaned duplicate data and type inconsistencies
- Established proper relationships between all tables

### 2. AI Integration
- Implemented sophisticated question generation using Lemonfox LLM
- Created personalized questions based on candidate and role data
- Established reliable API integration with error handling
- Generated 10 structured questions per requirement

### 3. Voice Chat System
- Implemented real-time voice chat using Web Speech API
- Integrated high-quality TTS for AI agent responses
- Created intuitive visual feedback system
- Established proper permission handling flow

### 4. User Experience
- Created multi-step hiring process with progress tracking
- Implemented camera/microphone preview system
- Added question generation trigger button
- Established comprehensive error handling and user feedback

### 5. Technical Architecture
- Built scalable API architecture with proper separation of concerns
- Implemented comprehensive error handling and logging
- Created reusable components and utilities
- Established proper TypeScript types and interfaces

## Testing & Validation

### Question Generation Testing:
- ✅ Generates 10 questions per requirement
- ✅ Uses candidate background data for personalization
- ✅ Saves questions to database correctly
- ✅ Handles API errors gracefully

### Voice Chat Testing:
- ✅ Microphone permissions work correctly
- ✅ Speech recognition transcribes accurately
- ✅ TTS plays agent responses clearly
- ✅ Visual indicators update properly

### Database Testing:
- ✅ Foreign key constraints work correctly
- ✅ Data types are consistent
- ✅ No duplicate data issues
- ✅ Migration completed successfully

## Future Enhancements

### Planned Features:
1. **Advanced Scoring**: Implement more sophisticated interview scoring algorithms
2. **Video Recording**: Add interview recording capabilities
3. **Analytics Dashboard**: Create hiring analytics and insights
4. **Multi-language Support**: Add internationalization
5. **Integration APIs**: Connect with external HR systems

### Technical Improvements:
1. **Performance Optimization**: Implement caching and optimization
2. **Scalability**: Move to production database (PostgreSQL/MySQL)
3. **Security**: Add encryption and security measures
4. **Testing**: Implement comprehensive test suite

## Conclusion

This multi-tenant hiring platform represents a comprehensive solution for modern recruitment needs. The combination of AI-powered question generation, real-time voice chat, and structured hiring processes creates an efficient and user-friendly experience for both candidates and hiring managers.

The platform successfully demonstrates:
- Modern web development practices with Next.js and TypeScript
- AI integration for intelligent automation
- Real-time communication capabilities
- Robust database design and migration strategies
- Comprehensive user experience design

The foundation is solid and ready for production deployment with additional features and optimizations. 