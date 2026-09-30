export class SurveyAttemptNotFoundError extends Error {
  constructor(message = 'Attempt not found') {
    super(message);
    this.name = SurveyAttemptNotFoundError.name;
  }
}

export class SurveyRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = SurveyRequestError.name;
  }
}