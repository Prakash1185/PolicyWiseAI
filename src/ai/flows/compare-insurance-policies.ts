'use server';

/**
 * @fileOverview Compares two insurance policies to identify key differences.
 *
 * - compareInsurancePolicies - A function that compares two insurance policies.
 * - CompareInsurancePoliciesInput - The input type for the compareInsurancePolicies function.
 * - CompareInsurancePoliciesOutput - The return type for the compareInsurancePolicies function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CompareInsurancePoliciesInputSchema = z.object({
  policy1DataUri: z
    .string()
    .describe(
      "The first insurance policy document, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  policy2DataUri: z
    .string()
    .describe(
      "The second insurance policy document, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});

export type CompareInsurancePoliciesInput = z.infer<typeof CompareInsurancePoliciesInputSchema>;

const CompareInsurancePoliciesOutputSchema = z.object({
  comparisonSummary: z
    .string()
    .describe('A summary of the key differences between the two insurance policies.'),
});

export type CompareInsurancePoliciesOutput = z.infer<typeof CompareInsurancePoliciesOutputSchema>;

export async function compareInsurancePolicies(
  input: CompareInsurancePoliciesInput
): Promise<CompareInsurancePoliciesOutput> {
  return compareInsurancePoliciesFlow(input);
}

const compareInsurancePoliciesPrompt = ai.definePrompt({
  name: 'compareInsurancePoliciesPrompt',
  input: {schema: CompareInsurancePoliciesInputSchema},
  output: {schema: CompareInsurancePoliciesOutputSchema},
  prompt: `You are an expert insurance policy analyst.

You will receive two insurance policies as data URIs. Analyze both policies and identify the key differences in their terms and conditions. Focus on coverage details, exclusions, premiums, deductibles, and any other significant clauses that may impact the policyholder.

Summarize the key differences between the two policies in a clear and concise manner.

Policy 1: {{media url=policy1DataUri}}
Policy 2: {{media url=policy2DataUri}}`,
});

const compareInsurancePoliciesFlow = ai.defineFlow(
  {
    name: 'compareInsurancePoliciesFlow',
    inputSchema: CompareInsurancePoliciesInputSchema,
    outputSchema: CompareInsurancePoliciesOutputSchema,
  },
  async input => {
    const {output} = await compareInsurancePoliciesPrompt(input);
    return output!;
  }
);
