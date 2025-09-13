'use server';

/**
 * @fileOverview A flow that allows a user to chat about their insurance policy analysis.
 *
 * - chatWithPolicyBot - A function that handles the chatbot interaction.
 * - ChatWithPolicyBotInput - The input type for the function.
 * - ChatWithPolicyBotOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { AnalyzeInsurancePolicyOutput } from './analyze-insurance-policy';

const ChatMessageSchema = z.object({
    role: z.enum(['user', 'bot']),
    content: z.string(),
});

const ChatWithPolicyBotInputSchema = z.object({
  analysis: z.custom<AnalyzeInsurancePolicyOutput>().describe('The JSON object of the insurance policy analysis.'),
  chatHistory: z.array(ChatMessageSchema).describe('The history of the conversation so far.'),
});
export type ChatWithPolicyBotInput = z.infer<typeof ChatWithPolicyBotInputSchema>;

const ChatWithPolicyBotOutputSchema = z.object({
  response: z.string().describe('The chatbot\'s response to the user\'s query.'),
});
export type ChatWithPolicyBotOutput = z.infer<typeof ChatWithPolicyBotOutputSchema>;

export async function chatWithPolicyBot(input: ChatWithPolicyBotInput): Promise<ChatWithPolicyBotOutput> {
  return chatWithPolicyBotFlow(input);
}

const prompt = ai.definePrompt({
  name: 'chatWithPolicyBotPrompt',
  input: { schema: z.object({
    analysisJson: z.string(),
    chatHistory: z.array(ChatMessageSchema),
  }) },
  output: { schema: ChatWithPolicyBotOutputSchema },
  prompt: `You are an AI assistant that helps users understand their insurance policy analysis.
You will be given the full analysis of their policy and the conversation history.
Your role is to answer the user's questions based ONLY on the provided policy analysis.
Do not make up information or answer questions that are not related to the document.
Keep your answers concise and easy to understand.

**Policy Analysis Document:**
\`\`\`json
{{{analysisJson}}}
\`\`\`

**Conversation History:**
{{#each chatHistory}}
**{{role}}:** {{content}}
{{/each}}

Based on the latest user query, provide a helpful response.
`,
});


const chatWithPolicyBotFlow = ai.defineFlow(
  {
    name: 'chatWithPolicyBotFlow',
    inputSchema: ChatWithPolicyBotInputSchema,
    outputSchema: ChatWithPolicyBotOutputSchema,
  },
  async (input) => {
    const { output } = await prompt({
        analysisJson: JSON.stringify(input.analysis, null, 2),
        chatHistory: input.chatHistory,
    });
    return output!;
  }
);
