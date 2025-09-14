// This is an AI-powered insights tool that analyzes transaction patterns and provides users with automated savings and spending suggestions.

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TransactionSchema = z.object({
  date: z.string().describe('The date of the transaction (YYYY-MM-DD).'),
  time: z.string().describe('The time of the transaction (HH:MM).'),
  asset: z.string().describe('The asset used for the transaction.'),
  amount: z.number().describe('The amount of the transaction.'),
  remarks: z.string().describe('Optional remarks about the transaction.'),
  type: z.enum(['income', 'expenditure']).describe('The type of transaction.'),
});

const SpendingInsightsInputSchema = z.object({
  transactions: z.array(TransactionSchema).describe('The list of transactions to analyze.'),
});
export type SpendingInsightsInput = z.infer<typeof SpendingInsightsInputSchema>;

const SpendingInsightsOutputSchema = z.object({
  insights: z.string().describe('The insights generated from the transaction history.'),
});
export type SpendingInsightsOutput = z.infer<typeof SpendingInsightsOutputSchema>;

export async function getSpendingInsights(input: SpendingInsightsInput): Promise<SpendingInsightsOutput> {
  return spendingInsightsFlow(input);
}

const spendingInsightsPrompt = ai.definePrompt({
  name: 'spendingInsightsPrompt',
  input: {schema: SpendingInsightsInputSchema},
  output: {schema: SpendingInsightsOutputSchema},
  prompt: `You are a personal finance advisor. Analyze the following transaction history and provide personalized insights to help the user improve their financial habits.

Transaction History:
{{#each transactions}}
  - Date: {{date}}, Time: {{time}}, Asset: {{asset}}, Amount: {{amount}}, Remarks: {{remarks}}, Type: {{type}}
{{/each}}

Provide insights such as potential savings opportunities, unusual spending patterns, and suggestions for budgeting.`,
});

const spendingInsightsFlow = ai.defineFlow(
  {
    name: 'spendingInsightsFlow',
    inputSchema: SpendingInsightsInputSchema,
    outputSchema: SpendingInsightsOutputSchema,
  },
  async input => {
    const {output} = await spendingInsightsPrompt(input);
    return output!;
  }
);


