import axios from "axios";
import fs from "fs";

let pdfParse;
(async () => { pdfParse = (await import("pdf-parse")).default; })();

const analyzeWithAI = async (resumeText) => {
  try {
    const response = await axios.post(
      "https://api-inference.huggingface.co/models/google/flan-t5-large",
      { inputs: `Analyze this resume: ${resumeText.substring(0, 2000)}` },
      { headers: { Authorization: `Bearer ${process.env.HF_API_KEY}` }, timeout: 30000 }
    );
    return response.data[0]?.generated_text;
  } catch (error) {
    console.error("AI Error:", error.message);
    return null;
  }
};

const generateLocalAnalysis = (resumeText) => {
  const text = resumeText.toLowerCase();
  const strengths = [], gaps = [], suggestions = [];
  if (text.includes("javascript") || text.includes("react")) strengths.push("Frontend Development");
  if (text.includes("python") || text.includes("django")) strengths.push("Backend Development");
  if (text.includes("node")) strengths.push("Node.js");
  if (text.includes("sql") || text.includes("mysql")) strengths.push("Database");
  if (text.includes("aws") || text.includes("cloud")) strengths.push("Cloud Computing");
  if (!text.includes("docker")) gaps.push("Docker/Kubernetes");
  if (!text.includes("agile") && !text.includes("scrum")) gaps.push("Agile/Scrum");
  if (!text.includes("communication")) suggestions.push("Highlight communication skills");
  return { strengths, gaps, suggestions };
};

export const analyzeResume = async (req, res) => {
  try {
    const { resumeText } = req.body;
    if (!resumeText || resumeText.trim().length < 20) return res.status(400).json({ message: "Resume too short" });

    const aiResult = await analyzeWithAI(resumeText);
    if (aiResult) return res.json({ result: aiResult });

    const local = generateLocalAnalysis(resumeText);
    res.json({ result: `📊 ANALYSIS\n\n✅ STRENGTHS:\n${local.strengths.map(s => `• ${s}`).join("\n") || "• Skills detected"}\n\n⚠️ GAPS:\n${local.gaps.map(s => `• ${s}`).join("\n") || "• None"}\n\n💡 SUGGESTIONS:\n${local.suggestions.map(s => `• ${s}`).join("\n") || "• Keep learning"}` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const analyzeResumeFile = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Upload a PDF" });
    const tempPath = "./temp.pdf";
    fs.writeFileSync(tempPath, req.file.buffer);
    const data = await pdfParse(fs.readFileSync(tempPath));
    fs.unlinkSync(tempPath);
    if (!data.text || data.text.trim().length < 20) return res.status(400).json({ message: "Could not read PDF" });

    const aiResult = await analyzeWithAI(data.text);
    if (aiResult) return res.json({ result: aiResult });

    const local = generateLocalAnalysis(data.text);
    res.json({ result: `📊 ANALYSIS\n\n✅ STRENGTHS:\n${local.strengths.map(s => `• ${s}`).join("\n")}\n\n⚠️ GAPS:\n${local.gaps.map(s => `• ${s}`).join("\n") || "• None"}\n\n💡 SUGGESTIONS:\n${local.suggestions.map(s => `• ${s}`).join("\n")}` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DOODLE CHATBOT
const doodleResponses = {
  greeting: ["Hello! I'm Doodle, your AI career assistant! 🤖 How can I help you today?", "Hi there! I'm Doodle! Need help with your job search? 😊", "Hey! I'm Doodle - ready to help you with your career!"],
  help: ["I can help you with:\n• Resume tips\n• Job search advice\n• Interview preparation\n• Career guidance\n• Skills recommendations\n\nWhat would you like to know? 🌟"],
  resume: ["📄 Resume Tips:\n1. Keep it concise (1-2 pages)\n2. Highlight achievements, not just duties\n3. Use action verbs\n4. Tailor for each job\n5. Include keywords from job description\n\nNeed more specific help? 😊"],
  interview: ["🎯 Interview Prep:\n\n1. Research the company\n2. Practice common questions\n3. Prepare your own questions\n4. Dress professionally\n5. Be on time (or 5 min early)\n\nBonus: STAR method for behavioral questions!\n• Situation\n• Task\n• Action\n• Result\n\nGood luck! 💪"],
  jobs: ["🔍 Job Search Tips:\n\n1. Use multiple job platforms\n2. Network actively\n3. Customize your resume\n4. Follow up on applications\n5. Build your LinkedIn\n\nWould you like me to analyze your resume? 📄"],
  skills: ["💡 Top In-Demand Skills:\n\n• JavaScript/React\n• Python\n• Cloud (AWS/Azure)\n• Data Analysis\n• AI/ML Basics\n• Communication\n\nWhat field are you interested in? I can give more specific recommendations!"],
  default: ["That's interesting! 🤔 Let me think...\n\nI can help with resumes, interviews, job search, or career advice. Just ask! 🌟"]
};

const getDoodleResponse = (message) => {
  const msg = message.toLowerCase();
  if (msg.includes("hi") || msg.includes("hello") || msg.includes("hey")) return doodleResponses.greeting[Math.floor(Math.random() * 3)];
  if (msg.includes("help") || msg.includes("what can you do")) return doodleResponses.help;
  if (msg.includes("resume") || msg.includes("cv")) return doodleResponses.resume;
  if (msg.includes("interview")) return doodleResponses.interview;
  if (msg.includes("job") || msg.includes("search")) return doodleResponses.jobs;
  if (msg.includes("skill") || msg.includes("learn")) return doodleResponses.skills;
  return doodleResponses.default;
};

export const doodleChat = async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message) return res.status(400).json({ message: "Message is required" });

    // Simulate typing delay
    await new Promise(r => setTimeout(r, 500));
    
    const response = getDoodleResponse(message);
    res.json({ 
      response, 
      bot: "Doodle",
      avatar: "🤖",
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};