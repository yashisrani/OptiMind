import { chatCompletion } from './otari-client';
import { calculateCost } from './experiment-service';

export async function compressPrompt(prompt: string, model: string) {
  const originalTokens = Math.ceil(prompt.length / 4);
  const originalCost = calculateCost({ prompt_tokens: originalTokens, completion_tokens: 0 }, model);

  const compressionPrompt = `Compress the following prompt to use fewer tokens while maintaining the exact same meaning, instructions, and constraints. Remove redundancy, filler words, and unnecessary details. Keep all critical instructions.

Original prompt:
"${prompt}"

Return ONLY the compressed prompt. Do not include any explanation or quotes.`;

  const response = await chatCompletion({
    model: 'alibaba/qwen3.8-flash',
    messages: [{ role: 'user', content: compressionPrompt }],
  });

  const compressedPrompt = response.choices[0].message.content;
  const compressedTokens = Math.ceil(compressedPrompt.length / 4);
  const compressedCost = calculateCost({ prompt_tokens: compressedTokens, completion_tokens: 0 }, model);

  return {
    original: { prompt, tokens: originalTokens, cost: originalCost },
    compressed: { prompt: compressedPrompt, tokens: compressedTokens, cost: compressedCost },
    savings: { 
      tokens: originalTokens - compressedTokens, 
      cost: originalCost - compressedCost, 
      percentage: originalCost > 0 ? ((originalCost - compressedCost) / originalCost) * 100 : 0 
    },
  };
}
