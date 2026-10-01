export const GUIDELINES_CONTEXT = Symbol('GUIDELINES_CONTEXT');

export interface GuidelinesContext {
  getText(): string;
}