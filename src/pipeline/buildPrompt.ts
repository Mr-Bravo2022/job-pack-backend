export interface PipelineInput {
  jobDescription: string;
  candidateProfile: string;
}

export interface PromptBundle {
  resumePrompt: string;
  coverLetterPrompt: string;
  infographicPrompt: string;
}

export function buildPrompt(input: PipelineInput): PromptBundle {
  const { jobDescription, candidateProfile } = input;

  const resumePrompt = `You are a résumé writer. Produce a tailored résumé as a complete HTML document (including <html>, <head>, <style>, and <body> tags) with inline CSS for clean print formatting.

Rules:
- Sections in this order: Summary, Experience, Skills, Education.
- Lead each section with content that directly matches the job requirements.
- If a section has no supporting content in the candidate profile, include the heading with "Not provided."
- Return ONLY the HTML document. No markdown fences, no commentary before or after.

Job Description:
${jobDescription}

Candidate Profile:
${candidateProfile}`;

  const coverLetterPrompt = `You are a career coach. Write a tailored cover letter as a complete HTML document (including <html>, <head>, <style>, and <body> tags) with inline CSS for clean print formatting.

Rules:
- Address it to "Dear Hiring Manager" unless a specific name appears in the job description.
- Structure: 3 paragraphs — (1) why this role, (2) why this candidate, (3) call to action.
- Close with a professional signature block.
- Return ONLY the HTML document. No markdown fences, no commentary before or after the document, nothing after the closing signature.

Job Description:
${jobDescription}

Candidate Profile:
${candidateProfile}`;

  const infographicPrompt = `Return a JSON object analyzing the job and candidate fit. No markdown fences, no prose before or after — raw JSON only.

Schema (follow exactly):
{
  "companyName": "Acme Corp",
  "roleName": "Senior Software Engineer",
  "pros": ["pro one", "pro two", "pro three"],
  "cons": ["con one", "con two", "con three"],
  "fitScore": 7,
  "keySkillsRequired": ["skill one", "skill two", "skill three"],
  "recommendation": "Should I apply? Yes / No / Maybe",
  "summary": "Two plain-English sentences explaining why the candidate is or isn't a strong fit for this role."
}

Rules:
- pros, cons, keySkillsRequired: 3 to 5 items each.
- fitScore: integer from 1 to 10. 10 = perfect match, 1 = no match.
- recommendation: exactly one of "Yes", "No", or "Maybe".
- summary: 2 sentences max. Plain English. No jargon. Write directly to the candidate (use "you").
- If the job description lacks enough information for a field, use an empty array [] or 0 for fitScore.

Job Description:
${jobDescription}

Candidate Profile:
${candidateProfile}`;

  return { resumePrompt, coverLetterPrompt, infographicPrompt };
}
