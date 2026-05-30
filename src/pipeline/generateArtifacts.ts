import { StructuredContent, InfographicData } from './parseResponse';

export interface ArtifactBundle {
  resumeHtml: string;
  coverLetterHtml: string;
  infographicSvg: string;
}

function buildInfographicSvg(data: InfographicData): string {
  const scoreColor = data.fitScore >= 7 ? '#16a34a' : data.fitScore >= 4 ? '#d97706' : '#dc2626';

  const recColor  = data.recommendation === 'Yes'   ? '#166534'
                  : data.recommendation === 'No'    ? '#991b1b'
                  : '#92400e';
  const recBg     = data.recommendation === 'Yes'   ? '#dcfce7'
                  : data.recommendation === 'No'    ? '#fee2e2'
                  : '#fef9c3';
  const recBorder = data.recommendation === 'Yes'   ? '#86efac'
                  : data.recommendation === 'No'    ? '#fca5a5'
                  : '#fde68a';
  const recLabel  = data.recommendation === 'Yes'   ? '✓ Yes, apply'
                  : data.recommendation === 'No'    ? '✗ Skip this one'
                  : '~ Worth considering';

  const prosHtml = data.pros
    .map(p => `<div style="margin-bottom:10px;color:#166534;font-size:13px;line-height:1.4">✓ ${escHtml(p)}</div>`)
    .join('');

  const consHtml = data.cons
    .map(c => `<div style="margin-bottom:10px;color:#991b1b;font-size:13px;line-height:1.4">✗ ${escHtml(c)}</div>`)
    .join('');

  const skillsHtml = data.keySkillsRequired
    .map(s => `<div style="margin-bottom:10px;color:#1e3a5f;font-size:13px;line-height:1.4">• ${escHtml(s)}</div>`)
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xhtml="http://www.w3.org/1999/xhtml" width="900" height="720" font-family="Arial, sans-serif">

  <!-- Background -->
  <rect width="900" height="720" fill="#f8fafc" rx="12"/>

  <!-- Header -->
  <rect width="900" height="72" fill="#1e3a5f" rx="12"/>
  <rect y="60" width="900" height="12" fill="#1e3a5f"/>
  <text x="450" y="32" text-anchor="middle" font-size="20" font-weight="bold" fill="white">${escXml(data.companyName)}</text>
  <text x="450" y="58" text-anchor="middle" font-size="14" fill="#93c5fd">${escXml(data.roleName)}</text>

  <!-- Fit Score -->
  <text x="450" y="108" text-anchor="middle" font-size="12" font-weight="bold" fill="#475569" letter-spacing="2">FIT SCORE</text>
  <text x="450" y="150" text-anchor="middle" font-size="48" font-weight="bold" fill="${scoreColor}">${data.fitScore}/10</text>

  <!-- PROS card -->
  <rect x="16" y="168" width="276" height="340" fill="white" rx="8" stroke="#d1fae5" stroke-width="1.5"/>
  <text x="154" y="194" text-anchor="middle" font-size="13" font-weight="bold" fill="#166534" letter-spacing="1">PROS</text>
  <line x1="16" y1="202" x2="292" y2="202" stroke="#d1fae5" stroke-width="1"/>
  <foreignObject x="24" y="210" width="260" height="290">
    <xhtml:div style="font-family:Arial,sans-serif">${prosHtml}</xhtml:div>
  </foreignObject>

  <!-- CONS card -->
  <rect x="312" y="168" width="276" height="340" fill="white" rx="8" stroke="#fee2e2" stroke-width="1.5"/>
  <text x="450" y="194" text-anchor="middle" font-size="13" font-weight="bold" fill="#991b1b" letter-spacing="1">CONS</text>
  <line x1="312" y1="202" x2="588" y2="202" stroke="#fee2e2" stroke-width="1"/>
  <foreignObject x="320" y="210" width="260" height="290">
    <xhtml:div style="font-family:Arial,sans-serif">${consHtml}</xhtml:div>
  </foreignObject>

  <!-- KEY SKILLS card -->
  <rect x="608" y="168" width="276" height="340" fill="white" rx="8" stroke="#dbeafe" stroke-width="1.5"/>
  <text x="746" y="194" text-anchor="middle" font-size="13" font-weight="bold" fill="#1e3a5f" letter-spacing="1">KEY SKILLS</text>
  <line x1="608" y1="202" x2="884" y2="202" stroke="#dbeafe" stroke-width="1"/>
  <foreignObject x="616" y="210" width="260" height="290">
    <xhtml:div style="font-family:Arial,sans-serif">${skillsHtml}</xhtml:div>
  </foreignObject>

  <!-- Should I apply? banner -->
  <rect x="16" y="526" width="868" height="48" fill="${recBg}" rx="8" stroke="${recBorder}" stroke-width="1.5"/>
  <text x="450" y="545" text-anchor="middle" font-size="12" font-weight="bold" fill="${recColor}" letter-spacing="1">SHOULD YOU APPLY?</text>
  <text x="450" y="564" text-anchor="middle" font-size="16" font-weight="bold" fill="${recColor}">${recLabel}</text>

  <!-- Summary card -->
  <rect x="16" y="586" width="868" height="118" fill="white" rx="8" stroke="#e2e8f0" stroke-width="1.5"/>
  <foreignObject x="28" y="596" width="844" height="100">
    <xhtml:div style="font-family:Arial,sans-serif;font-size:13px;color:#334155;line-height:1.6">${escHtml(data.summary)}</xhtml:div>
  </foreignObject>

</svg>`;
}

function escXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function generateArtifacts(content: StructuredContent): ArtifactBundle {
  return {
    resumeHtml: content.resumeHtml,
    coverLetterHtml: content.coverLetterHtml,
    infographicSvg: buildInfographicSvg(content.infographic),
  };
}
