import type { PiiRedactionResult } from '@/types/incident';

const NIK_REGEX = /\b\d{16}\b/g;
const PHONE_REGEX = /(?:\+62|62|0)8[1-9][0-9\-\s]{6,12}\b/g;
const NAMED_PERSON_REGEX = /\b(?:patient|victim|named|name|a\.n\.|mr\.|mrs\.|ms\.)[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})/gi;

export function redactSensitivePii(rawText: string): PiiRedactionResult {
  if (!rawText || !rawText.trim()) {
    return {
      redactedText: '',
      piiRedactedCount: 0,
      piiRedactedTypes: [],
    };
  }

  let redactedText = rawText;
  let count = 0;
  const types = new Set<string>();

  redactedText = redactedText.replace(NIK_REGEX, () => {
    count += 1;
    types.add('NATIONAL_ID_NIK');
    return '[NIK_REDACTED]';
  });

  redactedText = redactedText.replace(PHONE_REGEX, () => {
    count += 1;
    types.add('PHONE_NUMBER');
    return '[PHONE_REDACTED]';
  });

  redactedText = redactedText.replace(NAMED_PERSON_REGEX, (fullMatch, capturedName: string) => {
    count += 1;
    types.add('PERSON_NAME');
    return fullMatch.replace(capturedName, '[NAME_REDACTED]');
  });

  return {
    redactedText,
    piiRedactedCount: count,
    piiRedactedTypes: Array.from(types),
  };
}
