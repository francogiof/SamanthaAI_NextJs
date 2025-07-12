export interface ScreeningStepScript {
  id: string;
  step_name: string;
  type: 'static' | 'semi-static' | 'dynamic' | 'relational';
  focus?: string;
  includes?: string[];
  text: string;
  notes?: string;
  fallback_if_missing?: string;
}

export const SCREENING_SCRIPT_TEMPLATE: ScreeningStepScript[] = [
  {
    id: 'good_manners',
    step_name: 'Greeting and Welcome',
    type: 'semi-static',
    includes: ['candidate_info.full_name'],
    text: "Hello [candidate_info.full_name], it's a pleasure to meet you. I hope you're having a great day! Thanks for being here today and for your interest in our company. I'm excited to learn more about your background.",
  },
  {
    id: 'introduction',
    step_name: 'Interview Introduction',
    type: 'static',
    text: "I'll be conducting your screening interview today. It will take around 15–20 minutes. We'll cover your experience, skills, expectations, and give you a quick overview of the role. Feel free to ask questions at any point — I'll answer them if they're relevant or return us to the main path if needed.",
  },
  {
    id: 'context_brief',
    step_name: 'Role Context and Project Overview',
    type: 'semi-static',
    includes: ['context_role_info.project_description', 'context_role_info.ML_stack'],
    fallback_if_missing: 'Use [job_offer_info.role_mission_summary] if missing',
    text: "Let me give you a bit of context. In this role, you'd be working on [context_role_info.project_description], using technologies such as [context_role_info.ML_stack]. You'd be collaborating with engineers to optimize recommendation models and deliver scalable, production-ready systems.",
  },
  {
    id: 'explanation_about_screening',
    step_name: 'Screening Process Explanation',
    type: 'static',
    text: "This is a structured screening interview designed to give every candidate a fair and consistent experience. There are 12 predefined questions. Please answer honestly and clearly — there's no need to be perfect. If at any point you're unsure, feel free to ask. You can also ask up to 3 questions of your own.",
  },
  {
    id: 'candidate_introduction_petition',
    step_name: 'Candidate Self-Introduction Request',
    type: 'static',
    text: "Before we begin, I'd love to hear more about you. Please introduce yourself. You can take around 50 seconds and include your current role, experience, and what interests you about this opportunity.",
  },
  {
    id: 'Q1',
    step_name: 'Recent ML Project Experience',
    type: 'semi-static',
    focus: 'recent_ml_project',
    includes: ['candidate_info.last_job_description'],
    text: "Can you tell me about a recent machine learning project you've worked on? What was your role, and what were the outcomes?",
  },
  {
    id: 'Q2',
    step_name: 'Technical Stack and Tools',
    type: 'semi-static',
    focus: 'technical_stack_match',
    includes: ['job_offer_info.required_tools', 'candidate_info.ml_frameworks_used'],
    text: "Which tools or ML frameworks are you most comfortable with? Do you have experience with technologies like [job_offer_info.required_tools]?",
  },
  {
    id: 'Q3',
    step_name: 'Cloud Platform Experience',
    type: 'semi-static',
    focus: 'cloud_experience',
    includes: ['candidate_info.cloud_experience'],
    text: "Have you worked with cloud platforms like AWS, GCP, or Azure? What kinds of tasks did you use them for?",
  },
  {
    id: 'Q4',
    step_name: 'Big Data Handling Experience',
    type: 'semi-static',
    focus: 'big_data_handling',
    includes: ['candidate_info.project_highlights'],
    text: "Tell me about a time you worked with large-scale datasets. How did you manage the volume, and what tools did you use?",
  },
  {
    id: 'Q5',
    step_name: 'ML Model Deployment Experience',
    type: 'semi-static',
    focus: 'deployment_experience',
    includes: ['candidate_info.devops_tools'],
    text: "Have you ever deployed an ML model into production? What did the process look like, and did you face any challenges?",
  },
  {
    id: 'Q6',
    step_name: 'Cross-Functional Team Collaboration',
    type: 'semi-static',
    focus: 'teamwork_experience',
    text: "How do you usually collaborate with cross-functional teams like data engineers or backend developers?",
  },
  {
    id: 'Q7',
    step_name: 'Technical Problem Solving',
    type: 'semi-static',
    focus: 'problem_solving',
    text: "Can you describe a technical challenge you faced recently and how you solved it?",
  },
  {
    id: 'Q8',
    step_name: 'Learning and Skill Development',
    type: 'semi-static',
    focus: 'learning_ability',
    text: "How do you stay up to date with new ML tools and techniques? Can you name something new you've learned recently?",
  },
  {
    id: 'Q9',
    step_name: 'Technical Communication Skills',
    type: 'semi-static',
    focus: 'communication_skills',
    text: "In your opinion, what makes technical communication effective in a team? Can you give an example from your experience?",
  },
  {
    id: 'Q10',
    step_name: 'Role Motivation and Interest',
    type: 'semi-static',
    focus: 'motivation_for_this_role',
    includes: ['context_role_info.project_description'],
    text: "Why are you interested in this specific role? What attracts you about [context_role_info.project_description]?",
  },
  {
    id: 'Q11',
    step_name: 'Availability and Start Date',
    type: 'semi-static',
    focus: 'availability',
    includes: ['candidate_info.availability_date'],
    text: "When would you be available to start if selected?",
  },
  {
    id: 'Q12',
    step_name: 'Salary Expectations Alignment',
    type: 'semi-static',
    focus: 'salary_alignment',
    includes: ['candidate_info.salary_expectations', 'context_role_info.salary_range'],
    text: "The expected salary range for this role is [context_role_info.salary_range]. Does this match your expectations?",
  },
  {
    id: 'candidate_questions',
    step_name: 'Candidate Questions Opportunity',
    type: 'relational',
    text: "You're welcome to ask up to 3 questions during this interview. I'll do my best to answer them quickly and then we'll return to the structured flow. Is there anything you'd like to ask at this moment?",
  },
  {
    id: 'conclusion',
    step_name: 'Interview Conclusion and Next Steps',
    type: 'static',
    includes: ['candidate_info.full_name', 'job_offer_info.job_title', 'company_info.company_name'],
    text: "Thank you for your time, [candidate_info.full_name]. It was a pleasure learning about you. This concludes the screening for the [job_offer_info.job_title] position at [company_info.company_name]. You'll hear from us in the next few days with information about the next step. Have a great rest of your day!",
  },
]; 