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
  overview: z.string().describe('A short, plain English summary of the insurance policy, explaining its core purpose and coverage in simple terms.'),
  benefits: z.array(z.string()).describe('A comprehensive list of key benefits provided by the policy. Be specific and clear.'),
  risks: z.array(z.string()).describe('A list of all significant exclusions, hidden clauses, and potential penalties. Quote or reference the source section where possible.'),
  future_problems: z.array(z.string()).describe('A list of possible future issues that could arise, such as problems with surrendering the policy, claim rejections, or lower-than-expected returns.'),
  pros_cons: z.object({
    pros: z.array(z.string()).describe('A list of clear advantages or pros of this policy.'),
    cons: z.array(z.string()).describe('A list of clear disadvantages or cons of this policy.'),
  }),
  final_verdict: z.string().describe('Provide a final verdict on the policy (e.g., "Safe", "Risky", or "Neutral") and accompany it with clear, concise reasoning based on the analysis.'),
});

export type AnalyzeInsurancePolicyOutput = z.infer<typeof AnalyzeInsurancePolicyOutputSchema>;

export async function analyzeInsurancePolicy(input: AnalyzeInsurancePolicyInput): Promise<AnalyzeInsurancePolicyOutput> {
  return analyzeInsurancePolicyFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeInsurancePolicyPrompt',
  input: {schema: AnalyzeInsurancePolicyInputSchema},
  output: {schema: AnalyzeInsurancePolicyOutputSchema},
  prompt: `You are an expert insurance advisor with 20 years of experience. Your goal is to provide a clear, unbiased, and comprehensive analysis of an insurance policy document for a non-expert user.

  Analyze the following insurance policy document and return a structured JSON object with the specified keys. Your language should be simple, direct, and easy to understand. Avoid jargon where possible.

  {{#if documentText}}
  Document Text:
  {{{documentText}}}
  {{/if}}

  {{#if documentDataUri}}
  Document File:
  {{media url=documentDataUri}}
  {{/if}}

  Your response must be in a JSON format.
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
