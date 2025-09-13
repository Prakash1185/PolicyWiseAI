// Summarizes a privacy policy given a URL.

'use server';

/**
 * @fileOverview Summarizes a privacy policy given a URL.
 *
 * - summarizePrivacyPolicy - A function that summarizes a privacy policy.
 * - SummarizePrivacyPolicyInput - The input type for the summarizePrivacyPolicy function.
 * - SummarizePrivacyPolicyOutput - The return type for the summarizePrivacyPolicy function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizePrivacyPolicyInputSchema = z.object({
  url: z.string().url().describe('The URL of the privacy policy to summarize.'),
});
export type SummarizePrivacyPolicyInput = z.infer<
  typeof SummarizePrivacyPolicyInputSchema
>;

const SummarizePrivacyPolicyOutputSchema = z.object({
  summary: z.string().describe('A summary of the privacy policy.'),
});
export type SummarizePrivacyPolicyOutput = z.infer<
  typeof SummarizePrivacyPolicyOutputSchema
>;

export async function summarizePrivacyPolicy(
  input: SummarizePrivacyPolicyInput
): Promise<SummarizePrivacyPolicyOutput> {
  return summarizePrivacyPolicyFlow(input);
}

const summarizePrivacyPolicyPrompt = ai.definePrompt({
  name: 'summarizePrivacyPolicyPrompt',
  input: {schema: SummarizePrivacyPolicyInputSchema},
  output: {schema: SummarizePrivacyPolicyOutputSchema},
  prompt: `You are an expert in summarizing privacy policies.

  Summarize the privacy policy at the following URL:
  {{{url}}}
  \n  Provide a concise summary of the key points of the privacy policy. Focus on data collection, usage, and sharing practices.
  \n  Summary:`,
});

const summarizePrivacyPolicyFlow = ai.defineFlow(
  {
    name: 'summarizePrivacyPolicyFlow',
    inputSchema: SummarizePrivacyPolicyInputSchema,
    outputSchema: SummarizePrivacyPolicyOutputSchema,
  },
  async input => {
    const {output} = await summarizePrivacyPolicyPrompt(input);
    return output!;
  }
);
