// use server'

/**
 * @fileOverview A flow that analyzes legal jargon in a document and interprets it into a more easily understood format.
 *
 * - analyzeLegalJargon - A function that handles the legal jargon analysis process.
 * - AnalyzeLegalJargonInput - The input type for the analyzeLegalJargon function.
 * - AnalyzeLegalJargonOutput - The return type for the analyzeLegalJargon function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeLegalJargonInputSchema = z.object({
  documentText: z.string().describe('The text content of the legal document to be analyzed.'),
});

export type AnalyzeLegalJargonInput = z.infer<typeof AnalyzeLegalJargonInputSchema>;

const AnalyzeLegalJargonOutputSchema = z.object({
  simplifiedExplanation: z.string().describe('A simplified explanation of the legal jargon in the document.'),
});

export type AnalyzeLegalJargonOutput = z.infer<typeof AnalyzeLegalJargonOutputSchema>;

export async function analyzeLegalJargon(input: AnalyzeLegalJargonInput): Promise<AnalyzeLegalJargonOutput> {
  return analyzeLegalJargonFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeLegalJargonPrompt',
  input: {schema: AnalyzeLegalJargonInputSchema},
  output: {schema: AnalyzeLegalJargonOutputSchema},
  prompt: `You are an AI assistant specialized in simplifying legal jargon.

  Please analyze the following legal document and provide a simplified explanation that is easy to understand for a layperson.

  Document Text: {{{documentText}}}
  `,
});

const analyzeLegalJargonFlow = ai.defineFlow(
  {
    name: 'analyzeLegalJargonFlow',
    inputSchema: AnalyzeLegalJargonInputSchema,
    outputSchema: AnalyzeLegalJargonOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
