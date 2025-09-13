'use server';

/**
 * @fileOverview A flow that analyzes an insurance policy and provides personalized recommendations.
 *
 * - analyzeInsurancePolicy - A function that handles the insurance policy analysis process.
 * - AnalyzeInsurancePolicyInput - The input type for the analyzeInsurancePolicy function.
 * - AnalyzeInsurancePolicyOutput - The return type for the analyzeInsurancePolicy function.
 * - PolicyRecommendationInput - The input type for getting a recommendation.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const UserContextSchema = z.object({
  age: z.number().describe('The age of the user.'),
  annualSalary: z.number().describe('The annual salary of the user in USD.'),
  investmentGoal: z.string().describe('The primary financial or investment goal of the user (e.g., retirement, education, wealth growth).'),
});

const AnalyzeInsurancePolicyInputSchema = z.object({
  documentText: z.string().optional().describe('The text content of the insurance policy document to be analyzed.'),
  documentDataUri: z.string().optional().describe("The insurance policy document as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
});
export type AnalyzeInsurancePolicyInput = z.infer<typeof AnalyzeInsurancePolicyInputSchema>;

const AnalyzeInsurancePolicyOutputSchema = z.object({
  isPolicy: z.boolean().describe('Whether the document is an insurance policy or not.'),
  policyName: z.string().optional().describe('The official name or title of the insurance policy.'),
  policyNumber: z.string().optional().describe('The unique identifier or policy number.'),
  overview: z.string().describe('A short, plain English summary of the insurance policy, explaining its core purpose and coverage in simple terms. Maximum 2-3 sentences.'),
  benefits: z.array(z.string()).describe('A comprehensive list of key benefits provided by the policy. Be specific and clear.'),
  risks: z.array(z.string()).describe('A list of all significant exclusions, hidden clauses, and potential penalties. Quote or reference the source section where possible.'),
  future_problems: z.array(z.string()).describe('A list of possible future issues that could arise, such as problems with surrendering the policy, claim rejections, or lower-than-expected returns.'),
  pros_cons: z.object({
    pros: z.array(z.string()).describe('A list of clear advantages or pros of this policy.'),
    cons: z.array(z.string()).describe('A list of clear disadvantages or cons of this policy.'),
  }),
  final_verdict: z.string().describe('Provide a final verdict on the policy (e.g., "Safe Choice", "Risky Option", or "Neutral Policy") and accompany it with clear, concise reasoning based on the analysis. Start with the verdict, followed by a colon, then the reasoning.'),
  recommendation: z.string().optional().describe('A personalized recommendation for the user based on their context.'),
});
export type AnalyzeInsurancePolicyOutput = z.infer<typeof AnalyzeInsurancePolicyOutputSchema>;


export type PolicyRecommendationInput = {
  analysis: AnalyzeInsurancePolicyOutput;
  userContext: z.infer<typeof UserContextSchema>;
};

// Main function that can handle both analysis and recommendation
export async function analyzeInsurancePolicy(
  input: AnalyzeInsurancePolicyInput | PolicyRecommendationInput
): Promise<AnalyzeInsurancePolicyOutput> {
  if ('analysis' in input && 'userContext' in input) {
    return getPolicyRecommendationFlow(input);
  }
  return analyzeInsurancePolicyFlow(input);
}


const analysisPrompt = ai.definePrompt({
  name: 'analyzeInsurancePolicyPrompt',
  input: {schema: AnalyzeInsurancePolicyInputSchema},
  output: {schema: AnalyzeInsurancePolicyOutputSchema},
  prompt: `You are an expert insurance advisor with 20 years of experience. Your goal is to provide a clear, unbiased, and comprehensive analysis of an insurance policy document for a non-expert user.

  First, determine if the provided document is an insurance policy. If it is not, set 'isPolicy' to false and fill the other fields with brief messages indicating the document is not a policy.

  If it IS an insurance policy, set 'isPolicy' to true and perform the following analysis:
  1. Extract the Policy Name and Policy Number.
  2. Provide a clear, unbiased, and comprehensive analysis of the insurance policy document.
  3. Return a structured JSON object with the specified schema. Your language should be simple, direct, and easy to understand. Avoid jargon where possible.

  {{#if documentText}}
  Document Text:
  {{{documentText}}}
  {{/if}}

  {{#if documentDataUri}}
  Document File:
  {{media url=documentDataUri}}
  {{/if}}

  Your response must be in the specified JSON format.
  For the 'final_verdict', start with one of "Safe Choice", "Risky Option", or "Neutral Policy", followed by a colon and then a brief, clear justification.
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
    const {output} = await analysisPrompt(input);
    if (!output!.isPolicy) {
      throw new Error("The provided document does not appear to be an insurance policy. Please upload a valid policy.");
    }
    return output!;
  }
);


const recommendationPrompt = ai.definePrompt({
  name: 'policyRecommendationPrompt',
  input: { schema: z.object({
    analysis: AnalyzeInsurancePolicyOutputSchema,
    userContext: UserContextSchema,
  })},
  output: { schema: z.object({
    recommendation: z.string().describe('A personalized recommendation for the user based on their context.'),
  }) },
  prompt: `You are an expert financial advisor. Based on the provided insurance policy analysis and the user's personal context, provide a personalized recommendation.

  **Policy Analysis:**
  - **Overview:** {{{analysis.overview}}}
  - **Verdict:** {{{analysis.final_verdict}}}
  - **Pros:** {{#each analysis.pros_cons.pros}}- {{this}} {{/each}}
  - **Cons:** {{#each analysis.pros_cons.cons}}- {{this}} {{/each}}

  **User Context:**
  - **Age:** {{userContext.age}}
  - **Annual Salary:** {{userContext.annualSalary}}
  - **Investment Goal:** {{{userContext.investmentGoal}}}

  Based on this, provide a concise, actionable recommendation. Explain whether this policy aligns with the user's goals and financial situation, and what they should consider.
  `,
});


const getPolicyRecommendationFlow = ai.defineFlow(
    {
        name: 'getPolicyRecommendationFlow',
        inputSchema: z.object({
            analysis: AnalyzeInsurancePolicyOutputSchema,
            userContext: UserContextSchema,
        }),
        outputSchema: AnalyzeInsurancePolicyOutputSchema,
    },
    async (input) => {
        const { output } = await recommendationPrompt(input);
        return {
            ...input.analysis,
            recommendation: output!.recommendation,
        };
    }
);
