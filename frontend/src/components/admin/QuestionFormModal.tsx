import { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';

interface OptionInput {
  id?: string;
  text: string;
  value: number;
  isPassing?: boolean;
}

export interface QuestionFormData {
  text: string;
  type: string;
  dimension: string;
  rubricCategory: string;
  weight: number;
  isGate: boolean;
  scoreEligible: boolean;
  
  options?: OptionInput[];
  
  minValue?: number;
  maxValue?: number;
  stepValue?: number;
  minLabel?: string;
  maxLabel?: string;
  passingValue?: number;
}

interface QuestionFormModalProps {
  initialData?: any;
  onClose: () => void;
  onSave: (data: QuestionFormData) => void;
  isLoading: boolean;
}

const DIMENSIONS = [
  "No aplica",
  "Comunicación",
  "Liderazgo",
  "Trabajo en equipo",
  "Resolución de problemas",
  "Pensamiento crítico"
];

const RUBRIC_CATEGORIES = [
  "No aplica",
  "Competencia técnica",
  "Habilidades blandas",
  "Cumplimiento de objetivos"
];

const OPTION_VALUES = [
  { label: 'Básico (0)', value: 0 },
  { label: 'Intermedio (0.5)', value: 0.5 },
  { label: 'Avanzado (1)', value: 1 }
];

export default function QuestionFormModal({ initialData, onClose, onSave, isLoading }: QuestionFormModalProps) {
  const [formData, setFormData] = useState<QuestionFormData>({
    text: '',
    type: 'MULTIPLE_CHOICE',
    dimension: 'No aplica',
    rubricCategory: 'No aplica',
    weight: 1,
    isGate: false,
    scoreEligible: true,
    options: [{ text: '', value: 0, isPassing: false }],
    minValue: 1,
    maxValue: 10,
    stepValue: 1,
    minLabel: '',
    maxLabel: '',
    passingValue: 5,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        options: initialData.options?.length ? initialData.options : [{ text: '', value: 0, isPassing: false }],
        passingValue: initialData.passingValue ?? 5,
      });
    }
  }, [initialData]);

  // Handle side-effects of isGate
  useEffect(() => {
    if (formData.isGate) {
      setFormData(prev => ({
        ...prev,
        dimension: 'No aplica',
        rubricCategory: 'No aplica'
      }));
    }
  }, [formData.isGate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const addOption = () => {
    setFormData(prev => ({
      ...prev,
      options: [...(prev.options || []), { text: '', value: 0, isPassing: false }]
    }));
  };

  const removeOption = (index: number) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options?.filter((_, i) => i !== index)
    }));
  };

  const updateOption = (index: number, key: keyof OptionInput, val: any) => {
    setFormData(prev => {
      const newOptions = [...(prev.options || [])];
      newOptions[index] = { ...newOptions[index], [key]: val };
      return { ...prev, options: newOptions };
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1a1a1a] border border-white/10 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-bold font-display text-white">
            {initialData ? 'Editar Pregunta' : 'Nueva Pregunta'}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto flex-1">
          <form id="question-form" onSubmit={handleSubmit} className="flex flex-col gap-6">
            
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-gray-300">Tipo de Pregunta</label>
              <select 
                className="bg-[#121212] border border-white/10 rounded-lg p-3 text-white outline-none focus:border-[#00D7D0] transition-colors"
                value={formData.type}
                onChange={e => setFormData({...formData, type: e.target.value})}
              >
                <option value="MULTIPLE_CHOICE">Opción Múltiple</option>
                <option value="SLIDER">Slider (Escala Numérica)</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-gray-300">Texto de la pregunta</label>
              <textarea 
                required
                className="bg-[#121212] border border-white/10 rounded-lg p-3 text-white outline-none focus:border-[#00D7D0] transition-colors min-h-[80px]"
                value={formData.text}
                onChange={e => setFormData({...formData, text: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-gray-300">Dimensión</label>
                <select 
                  className="bg-[#121212] border border-white/10 rounded-lg p-3 text-white outline-none disabled:opacity-50"
                  value={formData.dimension}
                  disabled={formData.isGate}
                  onChange={e => setFormData({...formData, dimension: e.target.value})}
                >
                  {DIMENSIONS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-gray-300">Categoría Rúbrica</label>
                <select 
                  className="bg-[#121212] border border-white/10 rounded-lg p-3 text-white outline-none disabled:opacity-50"
                  value={formData.rubricCategory}
                  disabled={formData.isGate}
                  onChange={e => setFormData({...formData, rubricCategory: e.target.value})}
                >
                  {RUBRIC_CATEGORIES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-gray-300">Peso (Ponderación)</label>
                <input 
                  type="number" 
                  step="0.1"
                  min="1"
                  max="10"
                  required
                  className="bg-[#121212] border border-white/10 rounded-lg p-3 text-white outline-none"
                  value={formData.weight}
                  onChange={e => setFormData({...formData, weight: parseFloat(e.target.value)})}
                />
              </div>
              <div className="flex items-center gap-3 pt-8">
                <input 
                  type="checkbox"
                  id="isGate"
                  className="w-5 h-5 rounded border-white/20"
                  checked={formData.isGate}
                  onChange={e => setFormData({...formData, isGate: e.target.checked})}
                />
                <label htmlFor="isGate" className="text-sm font-bold text-gray-300 cursor-pointer">
                  Es Gate (Pregunta filtro)
                </label>
              </div>
            </div>

            {/* Dynamic fields based on Type */}
            {formData.type === 'MULTIPLE_CHOICE' && (
              <div className="border border-white/10 rounded-lg p-4 bg-[#121212]/50">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-white text-sm">Opciones</h3>
                  <button type="button" onClick={addOption} className="text-[#00D7D0] hover:text-[#00b5af] text-sm flex items-center gap-1">
                    <Plus size={16} /> Agregar Opción
                  </button>
                </div>
                {formData.isGate && (
                  <p className="text-xs text-gray-400 mb-3">Selecciona la(s) respuesta(s) correcta(s) que aprueban este Gate.</p>
                )}
                <div className="flex flex-col gap-3">
                  {formData.options?.map((opt, i) => (
                    <div key={i} className="flex items-center gap-3">
                      {formData.isGate && (
                         <input 
                           type="checkbox"
                           className="w-4 h-4 rounded border-white/20"
                           checked={opt.isPassing || false}
                           onChange={e => updateOption(i, 'isPassing', e.target.checked)}
                           title="Es aprobatoria"
                         />
                      )}
                      <input 
                        type="text"
                        required
                        placeholder="Texto de la opción"
                        className="flex-1 bg-[#1a1a1a] border border-white/10 rounded p-2 text-white text-sm outline-none"
                        value={opt.text}
                        onChange={e => updateOption(i, 'text', e.target.value)}
                      />
                      <select
                        className="w-40 bg-[#1a1a1a] border border-white/10 rounded p-2 text-white text-sm outline-none"
                        value={opt.value}
                        onChange={e => updateOption(i, 'value', parseFloat(e.target.value))}
                      >
                        {OPTION_VALUES.map(ov => <option key={ov.value} value={ov.value}>{ov.label}</option>)}
                      </select>
                      <button 
                        type="button"
                        onClick={() => removeOption(i)}
                        className="text-red-400 hover:text-red-300 p-2"
                        disabled={formData.options!.length <= 1}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {formData.type === 'SLIDER' && (
              <div className="border border-white/10 rounded-lg p-4 bg-[#121212]/50 grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-400">Min</label>
                  <input type="number" required min="1" max="10" className="bg-[#1a1a1a] border border-white/10 rounded p-2 text-white text-sm" value={formData.minValue || 1} onChange={e => setFormData({...formData, minValue: parseInt(e.target.value)})} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-400">Max</label>
                  <input type="number" required min="1" max="10" className="bg-[#1a1a1a] border border-white/10 rounded p-2 text-white text-sm" value={formData.maxValue || 10} onChange={e => setFormData({...formData, maxValue: parseInt(e.target.value)})} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-400">Step</label>
                  <input type="number" required min="1" className="bg-[#1a1a1a] border border-white/10 rounded p-2 text-white text-sm" value={formData.stepValue || 1} onChange={e => setFormData({...formData, stepValue: parseInt(e.target.value)})} />
                </div>
                <div className="flex flex-col gap-1 col-span-2 md:col-span-1">
                  <label className="text-xs text-gray-400">Etiqueta Min</label>
                  <input type="text" className="bg-[#1a1a1a] border border-white/10 rounded p-2 text-white text-sm" value={formData.minLabel || ''} onChange={e => setFormData({...formData, minLabel: e.target.value})} />
                </div>
                <div className="flex flex-col gap-1 col-span-2 md:col-span-2">
                  <label className="text-xs text-gray-400">Etiqueta Max</label>
                  <input type="text" className="bg-[#1a1a1a] border border-white/10 rounded p-2 text-white text-sm" value={formData.maxLabel || ''} onChange={e => setFormData({...formData, maxLabel: e.target.value})} />
                </div>
                
                {formData.isGate && (
                  <div className="flex flex-col gap-1 col-span-2 md:col-span-3 pt-3 border-t border-white/10 mt-2">
                    <label className="text-xs font-bold text-gray-300">Valor Aprobatorio (Umbral del Gate)</label>
                    <input type="number" required className="bg-[#1a1a1a] border border-[#00D7D0] rounded p-2 text-white text-sm focus:outline-none" value={formData.passingValue || 5} onChange={e => setFormData({...formData, passingValue: parseInt(e.target.value)})} />
                    <p className="text-xs text-gray-500">El usuario aprueba si selecciona este valor o mayor.</p>
                  </div>
                )}
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 flex justify-end gap-3 bg-[#121212]">
          <button 
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
          >
            Cancelar
          </button>
          <button 
            type="submit"
            form="question-form"
            disabled={isLoading}
            className="px-6 py-2 bg-[#00D7D0] hover:bg-[#00b5af] text-black font-bold rounded-lg transition-colors flex items-center justify-center min-w-[120px]"
          >
            {isLoading ? (
              <span className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
            ) : (
              initialData ? 'Guardar Cambios' : 'Crear Pregunta'
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
