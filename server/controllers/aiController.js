import axios from "axios";

export const analyzeResume = async (req, res) => {
  try {
    const { resumeText } = req.body;

    const response = await axios.post(
      "https://api-inference.huggingface.co/models/google/flan-t5-large",
      {
        inputs: `Analyze this resume and give strengths, missing skills, and suggestions:\n${resumeText}`
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.HF_API_KEY}`,
        },
      }
    );

    res.json({
      result: response.data[0]?.generated_text || "No response",
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};