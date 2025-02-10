import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateMotivationalMessage(
  habitName: string,
  streak: number,
): Promise<{ message: string }> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are a motivational coach helping users stay committed to their habits. Provide a short, energetic message (max 100 chars) celebrating their streak. Return JSON format: { 'message': string }",
        },
        {
          role: "user",
          content: `The user has maintained their habit "${habitName}" for ${streak} days in a row.`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No response from OpenAI");
    }

    const parsed = JSON.parse(content) as { message: string };
    if (!parsed.message) {
      throw new Error("Invalid response format from OpenAI");
    }

    return parsed;
  } catch (error) {
    console.error("Error generating motivational message:", error);
    return {
      message: `Amazing work! ${streak} days of dedication to ${habitName}. Keep going! 🎉`,
    };
  }
}