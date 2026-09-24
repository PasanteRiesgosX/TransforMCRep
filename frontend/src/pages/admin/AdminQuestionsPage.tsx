import { useState, useEffect } from 'react';
import { questionsService } from '../../services/questions.service';
import QuestionFormModal from '../../components/admin/QuestionFormModal';
import type { QuestionFormData } from '../../components/admin/QuestionFormModal';
import { Plus, Edit2, Trash2, GripVertical, CheckCircle2, XCircle } from 'lucide-react';
import clsx from 'clsx';

export default function AdminQuestionsPage() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [modalData, setModalData] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      setIsLoading(true);
      const data = await questionsService.getAll();
      setQuestions(data);
    } catch (error) {
      console.error('Error loading questions:', error);
      alert('Error al cargar preguntas');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (q?: any) => {
    setModalData(q || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalData(null);
  };

  const handleSave = async (formData: QuestionFormData) => {
    try {
      setIsSaving(true);
      
      const payload = {
        ...formData,
        options: formData.options?.map((opt, i) => ({ ...opt, orderIndex: i })),
      };

      if (modalData?.id) {
        await questionsService.update(modalData.id, payload);
      } else {
        const nextOrder = questions.length > 0 ? Math.max(...questions.map(q => q.orderIndex)) + 1 : 1;
        await questionsService.create({ ...payload, orderIndex: nextOrder });
      }
      await loadQuestions();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving question:', error);
      alert('Error al guardar la pregunta');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (q: any) => {
    if (!confirm(`¿Estás seguro de ${q.isActive ? 'desactivar' : 'activar'} esta pregunta?`)) return;
    try {
      await questionsService.update(q.id, { isActive: !q.isActive });
      await loadQuestions();
    } catch (error) {
      console.error('Error toggling state:', error);
      alert('Error al cambiar el estado');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta pregunta permanentemente? (Se prefiere desactivar en vez de eliminar)')) return;
    try {
      await questionsService.remove(id);
      await loadQuestions();
    } catch (error) {
      console.error('Error deleting question:', error);
      alert('Error al eliminar');
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between mb-8 shrink-0">
        <div>
          <h1 className="text-3xl font-bold font-display text-white mb-2">Administración de Preguntas</h1>
          <p className="text-gray-400 font-body">Configura el banco de preguntas para la evaluación.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-[#00D7D0] hover:bg-[#00b5af] text-black font-bold py-2.5 px-5 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={20} />
          Nueva Pregunta
        </button>
      </div>

      <div className="flex-1 overflow-auto bg-[#1a1a1a] border border-white/10 rounded-xl">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <span className="w-8 h-8 border-4 border-[#00D7D0] border-t-transparent rounded-full animate-spin"></span>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-[#252525] border-b border-white/10 z-10 shadow-md">
              <tr>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase w-16">Orden</th>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase">Pregunta</th>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase w-32">Tipo</th>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase w-32">Dimensión</th>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase w-20 text-center">Peso</th>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase w-24 text-center">Estado</th>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase w-28 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {questions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">
                    No hay preguntas configuradas.
                  </td>
                </tr>
              ) : (
                questions.map((q) => (
                  <tr key={q.id} className={clsx("hover:bg-white/5 transition-colors", !q.isActive && "opacity-50")}>
                    <td className="p-4 text-gray-500">
                      <div className="flex items-center gap-2">
                        <GripVertical size={16} className="cursor-grab opacity-30 hover:opacity-100" />
                        {q.orderIndex}
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-white line-clamp-2">{q.text}</p>
                      {q.isGate && (
                        <span className="inline-block mt-1 text-[10px] bg-[#FFABF3]/20 text-[#FFABF3] px-2 py-0.5 rounded-full font-bold">
                          GATE
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-sm text-gray-300">
                      {q.type === 'MULTIPLE_CHOICE' ? 'Opción Múlt.' : q.type === 'SLIDER' ? 'Slider' : 'Abierta'}
                    </td>
                    <td className="p-4 text-sm text-gray-400 truncate max-w-[120px]" title={q.dimension || ''}>
                      {q.dimension || '-'}
                    </td>
                    <td className="p-4 text-sm text-center text-gray-300 font-mono">
                      {q.weight}
                    </td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => handleToggleActive(q)}
                        className="inline-flex items-center justify-center p-1 rounded-full transition-colors hover:bg-white/10"
                        title={q.isActive ? 'Desactivar' : 'Activar'}
                      >
                        {q.isActive ? (
                          <CheckCircle2 size={20} className="text-[#00D7D0]" />
                        ) : (
                          <XCircle size={20} className="text-gray-500" />
                        )}
                      </button>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => handleOpenModal(q)}
                          className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(q.id)}
                          className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <QuestionFormModal 
          initialData={modalData}
          onClose={handleCloseModal}
          onSave={handleSave}
          isLoading={isSaving}
        />
      )}
    </div>
  );
}
