"""
Profiling questions and scoring logic for OCH track assessment.
"""
from .profiling import ProfilingQuestion, OCH_TRACKS

# Technical Aptitude Questions
TECHNICAL_APTITUDE_QUESTIONS = [
    ProfilingQuestion(
        id="tech_aptitude_1",
        question="When debugging a complex system issue, you prefer to:",
        category="technical_aptitude",
        options=[
            {
                "value": "A",
                "text": "Examine the code line by line, checking logic and data flow",
                "scores": {"builders": 3, "researchers": 2, "leaders": 1}
            },
            {
                "value": "B",
                "text": "Check system logs and performance metrics first",
                "scores": {"builders": 2, "leaders": 2, "educators": 1}
            },
            {
                "value": "C",
                "text": "Talk to team members to understand the context and recent changes",
                "scores": {"leaders": 3, "educators": 2, "entrepreneurs": 1}
            }
        ]
    ),
    ProfilingQuestion(
        id="tech_aptitude_2",
        question="When learning a new programming framework, you:",
        category="technical_aptitude",
        options=[
            {
                "value": "A",
                "text": "Build a complete working example from scratch",
                "scores": {"builders": 3, "researchers": 1, "entrepreneurs": 2}
            },
            {
                "value": "B",
                "text": "Study the documentation and understand the architecture",
                "scores": {"researchers": 3, "builders": 2, "educators": 1}
            },
            {
                "value": "C",
                "text": "Look for existing implementations and adapt them",
                "scores": {"entrepreneurs": 3, "builders": 2, "leaders": 1}
            }
        ]
    )
]

# Problem-Solving Style Questions
PROBLEM_SOLVING_QUESTIONS = [
    ProfilingQuestion(
        id="problem_solving_1",
        question="Your team is facing a critical deadline with a complex feature. You would:",
        category="problem_solving",
        options=[
            {
                "value": "A",
                "text": "Break down the feature into smaller tasks and assign them strategically",
                "scores": {"leaders": 3, "builders": 2, "entrepreneurs": 1}
            },
            {
                "value": "B",
                "text": "Dive deep into the technical implementation to understand the complexity",
                "scores": {"builders": 3, "researchers": 2, "leaders": 1}
            },
            {
                "value": "C",
                "text": "Brainstorm creative solutions and evaluate business impact",
                "scores": {"entrepreneurs": 3, "leaders": 2, "researchers": 1}
            }
        ]
    ),
    ProfilingQuestion(
        id="problem_solving_2",
        question="When a project encounters an unexpected technical roadblock, you:",
        category="problem_solving",
        options=[
            {
                "value": "A",
                "text": "Research alternative approaches and prototype solutions",
                "scores": {"researchers": 3, "builders": 2, "entrepreneurs": 1}
            },
            {
                "value": "B",
                "text": "Reorganize the team and redistribute workload",
                "scores": {"leaders": 3, "educators": 2, "builders": 1}
            },
            {
                "value": "C",
                "text": "Assess if this changes the project scope or business goals",
                "scores": {"entrepreneurs": 3, "leaders": 2, "researchers": 1}
            }
        ]
    )
]

# Scenario Preference Questions (Choose-your-path stories)
SCENARIO_QUESTIONS = [
    ProfilingQuestion(
        id="scenario_1",
        question="You've just been given leadership of a struggling development team. Your first action is to:",
        category="scenario_preference",
        options=[
            {
                "value": "A",
                "text": "Meet with each team member individually to understand their challenges",
                "scores": {"leaders": 3, "educators": 2, "builders": 1}
            },
            {
                "value": "B",
                "text": "Review the codebase and identify technical debt and architectural issues",
                "scores": {"builders": 3, "researchers": 2, "leaders": 1}
            },
            {
                "value": "C",
                "text": "Analyze the team's output metrics and market position",
                "scores": {"entrepreneurs": 3, "leaders": 2, "researchers": 1}
            }
        ]
    ),
    ProfilingQuestion(
        id="scenario_2",
        question="You discover a new AI technology that could revolutionize your product. You:",
        category="scenario_preference",
        options=[
            {
                "value": "A",
                "text": "Build a proof-of-concept to test the technology's capabilities",
                "scores": {"researchers": 3, "builders": 2, "entrepreneurs": 1}
            },
            {
                "value": "B",
                "text": "Assess market timing and competitive advantage",
                "scores": {"entrepreneurs": 3, "leaders": 2, "researchers": 1}
            },
            {
                "value": "C",
                "text": "Train your team on the technology and plan knowledge sharing",
                "scores": {"educators": 3, "leaders": 2, "builders": 1}
            }
        ]
    ),
    ProfilingQuestion(
        id="scenario_3",
        question="A major client requests a custom feature that's technically challenging. You:",
        category="scenario_preference",
        options=[
            {
                "value": "A",
                "text": "Evaluate the business value and negotiate scope",
                "scores": {"entrepreneurs": 3, "leaders": 2, "builders": 1}
            },
            {
                "value": "B",
                "text": "Architect a scalable solution and estimate development effort",
                "scores": {"builders": 3, "researchers": 2, "leaders": 1}
            },
            {
                "value": "C",
                "text": "Ensure your team has the skills needed and plan training if necessary",
                "scores": {"educators": 3, "leaders": 2, "builders": 1}
            }
        ]
    )
]

# Work Style Questions
WORK_STYLE_QUESTIONS = [
    ProfilingQuestion(
        id="work_style_1",
        question="In your ideal work environment, you prefer:",
        category="work_style",
        options=[
            {
                "value": "A",
                "text": "Deep focus time to solve complex technical problems",
                "scores": {"builders": 3, "researchers": 2, "leaders": 1}
            },
            {
                "value": "B",
                "text": "Dynamic collaboration with team members and stakeholders",
                "scores": {"leaders": 3, "educators": 2, "entrepreneurs": 1}
            },
            {
                "value": "C",
                "text": "Exploring new opportunities and market trends",
                "scores": {"entrepreneurs": 3, "researchers": 2, "leaders": 1}
            }
        ]
    ),
    ProfilingQuestion(
        id="work_style_2",
        question="When working on a project, you are most energized by:",
        category="work_style",
        options=[
            {
                "value": "A",
                "text": "Building something tangible that works reliably",
                "scores": {"builders": 3, "entrepreneurs": 2, "researchers": 1}
            },
            {
                "value": "B",
                "text": "Helping others grow and develop their skills",
                "scores": {"educators": 3, "leaders": 2, "builders": 1}
            },
            {
                "value": "C",
                "text": "Discovering new possibilities and pushing boundaries",
                "scores": {"researchers": 3, "entrepreneurs": 2, "leaders": 1}
            }
        ]
    ),
    ProfilingQuestion(
        id="work_style_3",
        question="Your approach to risk in projects is:",
        category="work_style",
        options=[
            {
                "value": "A",
                "text": "Calculated and measured - research thoroughly before committing",
                "scores": {"researchers": 3, "builders": 2, "leaders": 1}
            },
            {
                "value": "B",
                "text": "Balanced - assess impact and have contingency plans",
                "scores": {"leaders": 3, "entrepreneurs": 2, "builders": 1}
            },
            {
                "value": "C",
                "text": "Opportunity-focused - willing to take calculated risks for big rewards",
                "scores": {"entrepreneurs": 3, "leaders": 2, "researchers": 1}
            }
        ]
    )
]

# Combined question set
ALL_PROFILING_QUESTIONS = (
    TECHNICAL_APTITUDE_QUESTIONS +
    PROBLEM_SOLVING_QUESTIONS +
    SCENARIO_QUESTIONS +
    WORK_STYLE_QUESTIONS
)

# Scoring weights for different categories
CATEGORY_WEIGHTS = {
    "technical_aptitude": 1.2,  # Most important
    "problem_solving": 1.1,     # Very important
    "scenario_preference": 1.0, # Baseline
    "work_style": 0.9          # Supporting factor
}

# Minimum questions required for valid assessment
MIN_QUESTIONS_FOR_ASSESSMENT = 8
























