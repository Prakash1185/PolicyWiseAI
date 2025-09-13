'use server';

/**
 * @fileOverview Summarizes terms and conditions from a given URL.
 *
 * - summarizeTermsAndConditions - A function that accepts a URL and returns a summary of the T&Cs.
 * - SummarizeTermsAndConditionsInput - The input type for the summarizeTermsAndConditions function.
 * - SummarizeTermsAndConditionsOutput - The return type for the summarizeTermsAndConditions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeTermsAndConditionsInputSchema = z.object({
  termsAndConditionsUrl: z
    .string()
    .url()
    .describe('The URL of the terms and conditions document to summarize.'),
});
export type SummarizeTermsAndConditionsInput = z.infer<
  typeof SummarizeTermsAndConditionsInputSchema
>;

const SummarizeTermsAndConditionsOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the terms and conditions.'),
});
export type SummarizeTermsAndConditionsOutput = z.infer<
  typeof SummarizeTermsAndConditionsOutputSchema
>;

export async function summarizeTermsAndConditions(
  input: SummarizeTermsAndConditionsInput
): Promise<SummarizeTermsAndConditionsOutput> {
  return summarizeTermsAndConditionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeTermsAndConditionsPrompt',
  input: {schema: SummarizeTermsAndConditionsInputSchema},
  output: {schema: SummarizeTermsAndConditionsOutputSchema},
  prompt: `You are an AI assistant designed to summarize terms and conditions documents from a URL.

  Please summarize the terms and conditions from the following URL:
  {{{termsAndConditionsUrl}}}
  `,
});

const summarizeTermsAndConditionsFlow = ai.defineFlow(
  {
    name: 'summarizeTermsAndConditionsFlow',
    inputSchema: SummarizeTermsAndConditionsInputSchema,
    outputSchema: SummarizeTermsAndConditionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
