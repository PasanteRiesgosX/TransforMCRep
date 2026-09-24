import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { surveyService } from '../../services/survey.service';
import type { SurveyQuestion, SurveyAttempt } from '../../services/survey.service';
import clsx from 'clsx';
import { ChevronRight } from 'lucide-react';

interface AnswerState {
  questionId: string;
  selectedOptionId: string | null;
  numericValue: number | null;
}

export default function SurveyFormPage() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [attempt, setAttempt] = useState<SurveyAttempt | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  // Map of questionId -> answer object
  const [answers, setAnswers] = useState<Record<string, AnswerState>>({});

  const QUESTIONS_PER_PAGE = 5;

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [qs, att] = await Promise.all([
          surveyService.getQuestions(),
          surveyService.getActiveAttempt(),
        ]);

        if (att.status === 'SUBMITTED') {
          navigate('/results', { replace: true });
          return;
        }

        setQuestions(qs);
        setAttempt(att);

        const ansMap: Record<string, AnswerState> = {};
        att.answers.forEach(a => {
          ansMap[a.questionId] = {
            questionId: a.questionId,
            selectedOptionId: a.selectedOptionId || null,
            numericValue: a.numericValue !== undefined && a.numericValue !== null ? a.numericValue : null,
          };
        });
        setAnswers(ansMap);

      } catch (err) {
        console.error('Error loading survey data', err);
        setError('Error al cargar la encuesta. Por favor, intenta de nuevo.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [navigate]);

  const handleOptionSelect = (questionId: string, optionId: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        questionId,
        selectedOptionId: optionId,
        numericValue: null
      }
    }));
  };

  const handleSliderChange = (questionId: string, val: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        questionId,
        selectedOptionId: null,
        numericValue: val
      }
    }));
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0e0e0e]">
        <span className="w-8 h-8 border-4 border-[#00D7D0] border-t-transparent rounded-full animate-spin"></span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0e0e0e] text-white flex-col gap-4">
        <p className="text-red-400">{error}</p>
        <button onClick={() => navigate('/survey')} className="bg-[#00D7D0] px-4 py-2 text-black font-bold rounded">Volver</button>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0e0e0e] text-white flex-col gap-4">
        <p>No hay preguntas configuradas.</p>
        <button onClick={() => navigate('/survey')} className="bg-[#00D7D0] px-4 py-2 text-black font-bold rounded">Volver</button>
      </div>
    );
  }

  const currentPage = attempt?.currentPage || 0;
  const totalPages = Math.ceil(questions.length / QUESTIONS_PER_PAGE);

  // If somehow currentPage is out of bounds
  if (currentPage >= totalPages) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0e0e0e] text-white flex-col gap-4">
        <p>Has completado todas las preguntas.</p>
        <button onClick={() => navigate('/results')} className="bg-[#00D7D0] px-4 py-2 text-black font-bold rounded">Ver mis resultados</button>
      </div>
    );
  }

  const startIndex = currentPage * QUESTIONS_PER_PAGE;
  const currentQuestions = questions.slice(startIndex, startIndex + QUESTIONS_PER_PAGE);
  const isLastPage = currentPage === totalPages - 1;

  // Check if all current page questions are answered
  const allAnswered = currentQuestions.every(q => {
    const ans = answers[q.id];
    if (!ans) return false;
    if (q.type === 'MULTIPLE_CHOICE' && !ans.selectedOptionId) return false;
    if (q.type === 'SLIDER' && (ans.numericValue === null || ans.numericValue === undefined)) return false;
    return true;
  });

  const handleNext = async () => {
    if (!allAnswered || isSaving) return;
    
    try {
      setIsSaving(true);
      // Collect answers only for the current page to send
      const pageAnswers = currentQuestions.map(q => answers[q.id]);

      if (isLastPage) {
        await surveyService.submitAttempt(attempt!.id, pageAnswers);
        navigate('/results');
      } else {
        const nextAttempt = await surveyService.saveProgress(attempt!.id, {
          currentPage: currentPage + 1,
          answers: pageAnswers
        });
        setAttempt(nextAttempt);
        window.scrollTo(0, 0);
      }
    } catch (err: unknown) {
      console.error('Error saving progress', err);
      alert('Ocurrió un error al guardar. Intenta nuevamente.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="min-h-[calc(100vh-3.5rem)] w-full bg-[#0e0e0e] px-4 py-8 text-white md:px-8 md:py-12">
      <div className="mx-auto w-full max-w-3xl">
        
        <div className="mb-8 flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold uppercase tracking-wide text-white md:text-3xl">
            Evaluación <span className="text-gray-500 text-lg">({currentPage + 1}/{totalPages})</span>
          </h1>
          <div className="text-sm font-mono text-[#00D7D0]">
            Página {currentPage + 1} de {totalPages}
          </div>
        </div>

        <div className="mb-10 h-2 w-full overflow-hidden rounded-full bg-white/10">
          <div 
            className="h-full bg-[#00D7D0] transition-all duration-500 ease-out"
            style={{ width: `${((currentPage) / totalPages) * 100}%` }}
          />
        </div>

        <div className="flex flex-col gap-10">
          {currentQuestions.map((q, idx) => (
            <div key={q.id} className="rounded-xl border border-white/10 bg-[#121212] p-6 shadow-lg">
              <h3 className="mb-6 font-body text-lg font-medium leading-relaxed text-white">
                <span className="text-[#00D7D0] font-bold mr-2">{startIndex + idx + 1}.</span>
                {q.text}
              </h3>

              {q.type === 'MULTIPLE_CHOICE' && (
                <div className="flex flex-col gap-3">
                  {q.options.map(opt => {
                    const isSelected = answers[q.id]?.selectedOptionId === opt.id;
                    return (
                      <label 
                        key={opt.id}
                        className={clsx(
                          "flex cursor-pointer items-center gap-4 rounded-lg border p-4 transition-all duration-200",
                          isSelected 
                            ? "border-[#00D7D0] bg-[#00D7D0]/10"
                            : "border-white/10 bg-[#1a1a1a] hover:border-white/30 hover:bg-[#222]"
                        )}
                      >
                        <input 
                          type="radio" 
                          name={`question-${q.id}`} 
                          value={opt.id} 
                          className="sr-only"
                          checked={isSelected}
                          onChange={() => handleOptionSelect(q.id, opt.id)}
                        />
                        <div className={clsx(
                          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                          isSelected ? "border-[#00D7D0]" : "border-gray-500"
                        )}>
                          {isSelected && <div className="h-2.5 w-2.5 rounded-full bg-[#00D7D0]" />}
                        </div>
                        <span className="text-sm md:text-base text-gray-200 font-body">{opt.text}</span>
                      </label>
                    );
                  })}
                </div>
              )}

              {q.type === 'SLIDER' && (
                <div className="flex flex-col gap-6 pt-4">
                  <div className="flex justify-between px-2 text-xs font-bold text-gray-400">
                    <span>{q.minLabel || q.minValue}</span>
                    <span>{q.maxLabel || q.maxValue}</span>
                  </div>
                  <input
                    type="range"
                    min={q.minValue}
                    max={q.maxValue}
                    step={q.stepValue}
                    value={answers[q.id]?.numericValue !== null && answers[q.id]?.numericValue !== undefined ? answers[q.id].numericValue! : ((q.minValue || 1) + (q.maxValue || 10)) / 2}
                    onChange={e => handleSliderChange(q.id, Number(e.target.value))}
                    className="w-full accent-[#00D7D0]"
                  />
                  <div className="text-center font-mono text-xl font-bold text-[#00D7D0]">
                    {answers[q.id]?.numericValue !== undefined && answers[q.id]?.numericValue !== null 
                      ? answers[q.id].numericValue 
                      : '--'}
                  </div>
                </div>
              )}

            </div>
          ))}
        </div>

        <div className="mt-12 flex justify-end">
          <button
            onClick={handleNext}
            disabled={!allAnswered || isSaving}
            className={clsx(
              "flex items-center gap-2 rounded-lg px-8 py-4 font-mono text-sm font-bold uppercase tracking-wider transition-all",
              allAnswered && !isSaving
                ? "bg-[#00D7D0] text-black hover:bg-[#5ff3ee] hover:-translate-y-1 shadow-[0_4px_14px_0_rgba(0,215,208,0.39)]"
                : "bg-white/10 text-gray-500 cursor-not-allowed"
            )}
          >
            {isSaving ? (
              <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
            ) : isLastPage ? (
              'Ver mis resultados'
            ) : (
              <>Siguiente <ChevronRight size={18} /></>
            )}
          </button>
        </div>

      </div>
    </section>
  );
}