'use server';

/**
 * @fileOverview A flow that analyzes an insurance policy document and returns a structured JSON analysis.
 *
 * - analyzeInsurancePolicy - A function that handles the insurance policy analysis process.
 * - AnalyzeInsurancePolicyInput - The input type for the analyzeInsurancePolicy function.
 * - AnalyzeInsurancePolicyOutput - The return type for the analyzeInsurancePolicy function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeInsurancePolicyInputSchema = z.object({
  documentText: z.string().optional().describe('The text content of the insurance policy document to be analyzed.'),
  documentDataUri: z.string().optional().describe("The insurance policy document as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
});

export type AnalyzeInsurancePolicyInput = z.infer<typeof AnalyzeInsurancePolicyInputSchema>;

const AnalyzeInsurancePolicyOutputSchema = z.object({
  overview: z.string().describe('A short, plain English summary of the insurance policy.'),
  benefits: z.array(z.string()).describe('A list of key benefits provided by the policy.'),
  risks: z.array(z.string()).describe('A list of exclusions, hidden clauses, and penalties.'),
  future_problems: z.array(z.string()).describe('A list of possible future issues like surrender problems, claim rejection, or low returns.'),
  pros_cons: z.object({
    pros: z.array(z.string()).describe('A list of pros of the policy.'),
    cons: z.array(z.string()).describe('A list of cons of the policy.'),
  }),
  final_verdict: z.string().describe('The final verdict on the policy (e.g., "Safe", "Risky", or "Neutral") with clear reasoning.'),
});

export type AnalyzeInsurancePolicyOutput = z.infer<typeof AnalyzeInsurancePolicyOutputSchema>;

export async function analyzeInsurancePolicy(input: AnalyzeInsurancePolicyInput): Promise<AnalyzeInsurancePolicyOutput> {
  return analyzeInsurancePolicyFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeInsurancePolicyPrompt',
  input: {schema: AnalyzeInsurancePolicyInputSchema},
  output: {schema: AnalyzeInsurancePolicyOutputSchema},
  prompt: `You are an expert insurance advisor. Analyze the following insurance policy document and return a JSON object with the specified keys.

  {{#if documentText}}
  Document Text:
  {{{documentText}}}
  {{/if}}

  {{#if documentDataUri}}
  Document File:
  {{media url=documentDataUri}}
  {{/if}}
  `,
});

const analyzeInsurancePolicyFlow = ai.defineFlow(
  {
    name: 'analyzeInsurancePolicyFlow',
    inputSchema: AnalyzeInsurancePolicyInputSchema,
    outputSchema: AnalyzeInsurancePolicyOutputSchema,
  },
  async input => {
    if (!input.documentText && !input.documentDataUri) {
      throw new Error('Either documentText or documentDataUri must be provided.');
    }
    const {output} = await prompt(input);
    return output!;
  }
);
