export function buildSurveyPayload(attempt: any, answers: any[]) {
  return {
    attemptId: attempt.id,
    subjectUserId: attempt.subjectUserId,
    evaluationType: attempt.evaluationType,
    submittedAt: attempt.submittedAt?.toISOString(),
    answers: answers.map(a => {
      let val: number | null = null;
      let text: string | null = null;

      if (a.questionTypeSnapshot === 'MULTIPLE_CHOICE') {
        val = a.optionValueSnapshot ? Number(a.optionValueSnapshot) : null;
      } else if (a.questionTypeSnapshot === 'SLIDER') {
        // Calculate normalized value: (numericValue - minValue) / (maxValue - minValue)
        // Ensure values exist on the question (they are not saved in Answer right now, but for this builder we will pass them or compute them in the service before calling this builder)
        // Wait, the prompt says: "Para SLIDER, value es el valor normalizado (numericValue - minValue) / (maxValue - minValue), redondeado a 4 decimales."
        // We'll calculate it in the service and pass it inside `a`.
        val = a.computedNormalizedValue;
      } else if (a.questionTypeSnapshot === 'OPEN') {
        text = a.textValue;
      }

      return {
        questionId: a.questionId,
        type: a.questionTypeSnapshot,
        dimension: a.dimensionSnapshot,
        weight: Number(a.weightSnapshot),
        value: val !== undefined ? val : null,
        text: text,
        questionText: a.questionTextSnapshot,
        selectedOptionText: a.questionTypeSnapshot === 'SLIDER' 
          ? `Valor seleccionado: ${a.numericValue}`
          : a.optionTextSnapshot,
      };
    })
  };
}
