import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to get Gemini AI client with BYOK support
function getGeminiClientForRequest(userKey?: string): GoogleGenAI | null {
  const key = (userKey && userKey.trim()) ? userKey.trim() : (process.env.GEMINI_API_KEY || '');
  if (!key) {
    return null;
  }
  return new GoogleGenAI({ apiKey: key });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '25mb' }));

  // API Health Check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'RECALL Intelligence Engine',
      geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
      timestamp: new Date().toISOString(),
    });
  });

  // 1. Scan Mistakes for Patterns, Conceptual Weaknesses & 3x Alerts
  app.post('/api/gemini/scan-mistakes', async (req, res) => {
    try {
      const { mistakes, subjects, exams } = req.body;
      const userApiKey = (req.headers['x-gemini-api-key'] as string) || req.body?.userApiKey;

      if (!mistakes || !Array.isArray(mistakes) || mistakes.length === 0) {
        return res.status(400).json({ error: 'No mistakes provided for analysis' });
      }

      const client = getGeminiClientForRequest(userApiKey);
      if (!client) {
        // High quality rule-based fallback if API key is not yet configured
        return res.json(generateLocalHeuristicScan(mistakes));
      }

      const structuredMistakes = mistakes.map((m: any, idx: number) => ({
        id: m.id || `M-${idx + 1}`,
        subject: m.subjectName || 'General',
        chapter: m.chapter || 'Unknown',
        topic: m.topic || 'General',
        source: m.source || 'General',
        question: m.questionText ? m.questionText.slice(0, 300) : `Question ${m.questionNumber || idx + 1}`,
        mistakeType: m.mistakeType || 'Conceptual',
        severity: m.severity || 'Medium',
        status: m.status || 'Unresolved',
        whatWentWrong: m.whatWentWrong || '',
        correctApproach: m.correctApproach || '',
        whyMadeMistake: m.whyMadeMistake || '',
        takeaway: m.takeaway || '',
        occurrences: m.occurrencesCount || 1,
        date: m.createdAt || new Date().toISOString(),
      }));

      const prompt = `You are the academic intelligence engine for RECALL (Academic Mistake Intelligence System).
Analyze the following student mistake history to identify:
1. Real underlying conceptual weaknesses connecting seemingly different questions.
2. Recurring error patterns (especially mistakes made 3+ times or grouped under a shared misconception).
3. Critical diagnostic insights for the student's revision priorities.
4. Specific actionable takeaways to stop repeating these mistakes.

MISTAKE HISTORY:
${JSON.stringify(structuredMistakes, null, 2)}

Respond with a valid JSON object matching this schema:
{
  "summary": "Brief executive diagnostic summary of current academic state (2-3 sentences)",
  "overallHealth": "Critical" | "Needs Attention" | "Good",
  "recurringPatterns": [
    {
      "patternTitle": "string (e.g., Quantum Numbers Boundary Values Confusion)",
      "subject": "string",
      "chapter": "string",
      "topic": "string",
      "occurrences": number,
      "isRepeatedAlert": boolean, // MUST be true if occurrences >= 3 or multiple distinct questions share this root flaw
      "severity": "High" | "Critical" | "Medium",
      "rootCause": "Detailed explanation of the underlying conceptual or execution trap",
      "relatedMistakeIds": ["string"],
      "prescribedAction": "Specific 1-sentence revision instruction"
    }
  ],
  "insights": [
    {
      "type": "diagnostic" | "trend" | "trap_warning",
      "title": "string",
      "content": "Deep analytical observation (e.g. 'Most Physics errors in Electrostatics are sign convention slips, whereas Chemistry errors are fundamental formula assumptions.')",
      "subject": "string",
      "priority": "High" | "Medium" | "Urgent"
    }
  ],
  "topWeakTopics": [
    {
      "topic": "string",
      "chapter": "string",
      "subject": "string",
      "mistakeCount": number,
      "riskLevel": "High" | "Medium"
    }
  ]
}
Return ONLY JSON, with no markdown fences, no explanatory preambles.`;

      const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      const text = response.text?.trim() || '{}';
      try {
        const parsed = JSON.parse(text);
        return res.json(parsed);
      } catch (parseError) {
        console.error('Failed to parse Gemini JSON output, falling back:', parseError);
        return res.json(generateLocalHeuristicScan(mistakes));
      }
    } catch (error: any) {
      console.error('Gemini scan error:', error);
      return res.json(generateLocalHeuristicScan(req.body?.mistakes || []));
    }
  });

  // 2. Deep Mistake Analysis & Root Cause Diagnostic
  app.post('/api/gemini/analyze-mistake', async (req, res) => {
    try {
      const { mistake } = req.body;
      const userApiKey = (req.headers['x-gemini-api-key'] as string) || req.body?.userApiKey;
      if (!mistake) {
        return res.status(400).json({ error: 'Mistake payload is required' });
      }

      const client = getGeminiClientForRequest(userApiKey);
      if (!client) {
        return res.json({
          diagnostic: `Review this ${mistake.mistakeType || 'conceptual'} error in ${mistake.topic || 'the topic'}. Focus on mastering the fundamental derivation.`,
          rootCauseType: mistake.mistakeType || 'Conceptual Gap',
          suggestedTakeaway: `Always double-check the initial boundary conditions and sign conventions before applying standard formulas in ${mistake.chapter || 'this chapter'}.`,
          preventativeRule: 'Write down known constraints explicitly before solving.',
        });
      }
      const prompt = `You are RECALL's Academic Intelligence Diagnostic Engine.
A student logged the following mistake:
Subject: ${mistake.subjectName || ''}
Chapter: ${mistake.chapter || ''}
Topic: ${mistake.topic || ''}
Source: ${mistake.source || ''}
Question Number: ${mistake.questionNumber || ''}
Question Description: ${mistake.questionText || 'Not provided'}
Mistake Type: ${mistake.mistakeType || 'Conceptual'}
Student's Notes on what went wrong: "${mistake.whatWentWrong || ''}"
Student's Correct Approach notes: "${mistake.correctApproach || ''}"
Student's Reason why they slipped: "${mistake.whyMadeMistake || ''}"
Student's Takeaway: "${mistake.takeaway || ''}"

Provide an academic diagnostic JSON with:
1. "diagnostic": Precise assessment of the exact misconception or trap (2 sentences)
2. "rootCauseType": "Core Conceptual Gap" | "Procedural Slipped Step" | "Notation Ambiguity" | "Calculation Under Pressure"
3. "suggestedTakeaway": A crisp, memorable high-yield takeaway rule to memorize
4. "preventativeRule": 1 actionable golden check to perform next time this problem type is encountered
5. "relatedConceptCheck": A quick 1-line self-check question the student should ask themselves

Return ONLY valid JSON.`;

      const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      const text = response.text?.trim() || '{}';
      try {
        const parsed = JSON.parse(text);
        return res.json(parsed);
      } catch {
        return res.json({
          diagnostic: 'Focus on mastering the exact sequence of reasoning and avoid rushing the intermediate steps.',
          rootCauseType: mistake.mistakeType || 'Conceptual',
          suggestedTakeaway: mistake.takeaway || 'Isolate variables before substituting numerical values.',
          preventativeRule: 'Verify units and limits before finalizing the answer.',
        });
      }
    } catch (error: any) {
      console.error('Error analyzing mistake:', error);
      return res.status(500).json({ error: error.message || 'Failed to analyze mistake' });
    }
  });

  // 3. Exam Prep Brief
  app.post('/api/gemini/exam-prep-brief', async (req, res) => {
    try {
      const { exam, mistakes } = req.body;
      const userApiKey = (req.headers['x-gemini-api-key'] as string) || req.body?.userApiKey;

      const syllabus = exam?.syllabus || [];
      const relevantMistakes = (mistakes || []).filter((m: any) =>
        syllabus.length === 0 ||
        syllabus.some((s: string) =>
          (m.chapter && m.chapter.toLowerCase().includes(s.toLowerCase())) ||
          (m.topic && m.topic.toLowerCase().includes(s.toLowerCase())) ||
          (m.subjectName && m.subjectName.toLowerCase().includes(s.toLowerCase()))
        )
      );

      const client = getGeminiClientForRequest(userApiKey);
      if (!client) {
        return res.json({
          title: `Revision Strategy for ${exam?.name || 'Upcoming Exam'}`,
          totalRelevant: relevantMistakes.length,
          criticalTraps: relevantMistakes.slice(0, 3).map((m: any) => ({
            topic: m.topic || m.chapter,
            warning: m.takeaway || m.whatWentWrong || 'Review fundamental definitions',
          })),
          prioritizedChecklist: [
            'Re-solve unresolved mistakes without viewing answers first',
            'Review all formulas associated with repeated errors',
            'Practice time management for multi-concept problems',
          ],
        });
      }
      const prompt = `You are RECALL's Exam Prep strategist.
Exam: ${exam?.name || 'Upcoming Exam'}
Date: ${exam?.date || 'Soon'}
Target Score: ${exam?.targetScore || 'N/A'}/${exam?.totalMarks || '100'}
Syllabus: ${JSON.stringify(syllabus)}

Relevant historical mistakes made by this student in these topics:
${JSON.stringify(relevantMistakes.slice(0, 20), null, 2)}

Produce a high-yield Exam Preparation Intelligence Brief in JSON:
{
  "title": "string",
  "totalRelevant": number,
  "highRiskTopics": ["string"],
  "criticalTraps": [
    {
      "topic": "string",
      "warning": "string (the exact recurring error to guard against during this exam)"
    }
  ],
  "prioritizedChecklist": [
    "string (step 1)",
    "string (step 2)",
    "string (step 3)"
  ],
  "estimatedScoreLeakageRisk": "Low" | "Medium" | "High",
  "closingMindsetRule": "string"
}
Return ONLY valid JSON.`;

      const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const parsed = JSON.parse(response.text?.trim() || '{}');
      return res.json(parsed);
    } catch (error: any) {
      console.error('Error generating exam brief:', error);
      return res.status(500).json({ error: error.message });
    }
  });

  // Vite integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`RECALL server running on http://0.0.0.0:${PORT}`);
  });
}

function generateLocalHeuristicScan(mistakes: any[]) {
  const topicCounts: Record<string, { count: number; chapter: string; subject: string; mistakes: any[] }> = {};

  mistakes.forEach((m) => {
    const topicKey = m.topic || m.chapter || 'General';
    if (!topicCounts[topicKey]) {
      topicCounts[topicKey] = {
        count: 0,
        chapter: m.chapter || 'General',
        subject: m.subjectName || 'Subject',
        mistakes: [],
      };
    }
    topicCounts[topicKey].count += m.occurrencesCount || 1;
    topicCounts[topicKey].mistakes.push(m);
  });

  const recurringPatterns = Object.entries(topicCounts)
    .filter(([_, data]) => data.count >= 2)
    .map(([topic, data]) => ({
      patternTitle: `${topic} Recurring Vulnerability`,
      subject: data.subject,
      chapter: data.chapter,
      topic: topic,
      occurrences: data.count,
      isRepeatedAlert: data.count >= 3,
      severity: data.count >= 3 ? 'Critical' : 'High',
      rootCause: `Detected ${data.count} recurring mistakes logged under ${topic}. Repeated misconceptions in this topic require active recall revision.`,
      relatedMistakeIds: data.mistakes.map((m) => m.id),
      prescribedAction: `Review chapter notes for ${data.chapter} and solve 5 clean concept checks on ${topic}.`,
    }));

  const topWeakTopics = Object.entries(topicCounts)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)
    .map(([topic, data]) => ({
      topic,
      chapter: data.chapter,
      subject: data.subject,
      mistakeCount: data.count,
      riskLevel: data.count >= 3 ? 'High' : 'Medium',
    }));

  const insights = [
    {
      type: 'diagnostic',
      title: 'Mistake Distribution Analysis',
      content: `You have logged ${mistakes.length} total mistakes across ${Object.keys(topicCounts).length} distinct topics. ${recurringPatterns.filter((p) => p.isRepeatedAlert).length} topics have reached the 3× repeated threshold alert.`,
      subject: 'Overall',
      priority: recurringPatterns.length > 0 ? 'High' : 'Medium',
    },
    {
      type: 'trap_warning',
      title: 'Active Recall Priority',
      content: 'Unresolved mistakes left without active recall within 7 days have an 80% higher recurrence probability in tests.',
      subject: 'Memory Science',
      priority: 'Medium',
    },
  ];

  return {
    summary: `Analysis of ${mistakes.length} mistakes detected ${recurringPatterns.length} pattern clusters and ${recurringPatterns.filter((p) => p.isRepeatedAlert).length} repeated 3× weakness alerts.`,
    overallHealth: recurringPatterns.some((p) => p.isRepeatedAlert) ? 'Needs Attention' : 'Good',
    recurringPatterns,
    insights,
    topWeakTopics,
  };
}

startServer();
