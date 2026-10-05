import { useEffect, useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { candidatesService, type CandidateMetric } from '../../../services/candidates.service';
import clsx from 'clsx';
import { Search, Eye, CheckCircle, XCircle, AlertTriangle, X, UserCheck, Mail } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

import outlookIcon from '../../../assets/img/logosIA/outlook.webp';

const COLORS = ['#4F46E5', '#E11D48', '#F97316', '#8B5CF6', '#0D9488', '#2563EB', '#CA8A04', '#DC2626', '#7C3AED', '#059669'];

export default function CandidatosPage() {
  const { isDarkMode } = useOutletContext<{ isDarkMode: boolean }>();
  const [candidates, setCandidates] = useState<CandidateMetric[]>([]);
  const [areas, setAreas] = useState<string[]>([]);
  const [positions, setPositions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [viewMode, setViewMode] = useState<'ALL' | 'SELECTED'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('');

  // Persist selected candidates by ID
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modal State
  const [detailCandidate, setDetailCandidate] = useState<CandidateMetric | null>(null);

  useEffect(() => {
    candidatesService.getCandidates().then(res => {
      setCandidates(res.candidates);
      setAreas(res.areas);
      setPositions(res.positions);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const filteredCandidates = useMemo(() => {
    return candidates.filter(c => {
      if (viewMode === 'SELECTED' && !selectedIds.has(c.id)) return false;
      if (selectedArea && c.area !== selectedArea) return false;
      if (selectedPosition && c.position !== selectedPosition) return false;
      if (searchTerm && !c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) && !c.email.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    });
  }, [candidates, viewMode, selectedArea, selectedPosition, searchTerm, selectedIds]);

  const bgPanel = isDarkMode ? 'bg-[#1a1a1a] border-white/5' : 'bg-white border-gray-200 shadow-sm';
  const selectClass = clsx(
    'border rounded p-2 text-sm outline-none min-w-[150px] w-full md:w-auto',
    isDarkMode
      ? 'bg-[#1a1a1a] border-gray-600 text-white'
      : 'bg-white border-gray-300 text-gray-900'
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ELEGIBLE':
        return <span className="flex items-center gap-1 text-green-500 bg-green-500/10 px-2 py-1 rounded-full text-xs font-semibold"><CheckCircle size={14} /> Elegible</span>;
      case 'NO_ELEGIBLE_POR_GATE':
        return <span className="flex items-center gap-1 text-orange-500 bg-orange-500/10 px-2 py-1 rounded-full text-xs font-semibold"><AlertTriangle size={14} /> No elegible por Gate</span>;
      case 'NO_ELEGIBLE':
      default:
        return <span className="flex items-center gap-1 text-red-500 bg-red-500/10 px-2 py-1 rounded-full text-xs font-semibold"><XCircle size={14} /> No elegible</span>;
    }
  };

  const getGateReason = (c: CandidateMetric) => {
    if (c.eligibilityStatus === 'ELEGIBLE') {
      return (
        <div className="bg-green-500/10 border border-green-500/20 text-green-700 text-green-400 p-4 rounded-xl">
          <p className="font-bold mb-1">El candidato es elegible por la siguiente razón:</p>
          <p className="text-sm opacity-90 mb-2">Puntaje aprobatorio y Gate exitoso.</p>
          <div className="bg-black/5 bg-black/20 p-3 rounded">
            <span className="font-semibold block text-xs uppercase opacity-70 mb-1">Pregunta Clave (Gate):</span>
            <p className="text-sm italic">"{c.gateQuestionText}"</p>
            <p className="font-semibold text-sm mt-1">Respuesta: {c.gateAnswerText}</p>
          </div>
        </div>
      );
    }
    if (c.eligibilityStatus === 'NO_ELEGIBLE_POR_GATE') {
      return (
        <div className="bg-orange-500/10 border border-orange-500/20 text-orange-700 text-orange-400 p-4 rounded-xl">
          <p className="font-bold mb-1">El candidato NO es elegible por la siguiente razón:</p>
          <p className="text-sm opacity-90 mb-2">Puntaje global excelente, pero no aprobó la pregunta obligatoria (Gate).</p>
          <div className="bg-black/5 bg-black/20 p-3 rounded">
            <span className="font-semibold block text-xs uppercase opacity-70 mb-1">Pregunta Clave (Gate):</span>
            <p className="text-sm italic">"{c.gateQuestionText}"</p>
            <p className="font-semibold text-sm mt-1">Respuesta: {c.gateAnswerText}</p>
          </div>
        </div>
      );
    }
    return (
      <div className="bg-red-500/10 border border-red-500/20 text-red-700 text-red-400 p-4 rounded-xl">
        <p className="font-bold mb-1">El candidato NO es elegible por la siguiente razón:</p>
        <p className="text-sm opacity-90 mb-2">No alcanzó el puntaje mínimo requerido.</p>
        <div className="bg-black/5 bg-black/20 p-3 rounded">
          <span className="font-semibold block text-xs uppercase opacity-70 mb-1">Pregunta Clave (Gate):</span>
          <p className="text-sm italic">"{c.gateQuestionText}"</p>
          <p className="font-semibold text-sm mt-1">Respuesta: {c.gateAnswerText}</p>
        </div>
      </div>
    );
  };

  const handleSendInvite = () => {
    // Collect emails of selected users
    const emails = candidates.filter(c => selectedIds.has(c.id)).map(c => c.email).join(';');
    if (!emails) return;

    const subject = encodeURIComponent("¡Has sido seleccionado para el proyecto!");
    const body = encodeURIComponent("Hola,\n\nNos complace informarte que has sido seleccionado para formar parte del proyecto.\n\nSaludos cordiales.");
    
    // Method 1: Web Deep Link (Outlook 365)
    // const url = `https://outlook.office.com/mail/deeplink/compose?to=${emails}&subject=${subject}&body=${body}`;
    
    // Method 2: Default mail client (mailto:)
    const url = `mailto:${emails}?subject=${subject}&body=${body}`;
    
    window.location.href = url;
  };

  const handleSendInviteWeb = () => {
    const emails = candidates.filter(c => selectedIds.has(c.id)).map(c => c.email).join(';');
    if (!emails) return;
    const subject = encodeURIComponent("¡Has sido seleccionado para el proyecto!");
    const body = encodeURIComponent("Hola,\n\nNos complace informarte que has sido seleccionado para formar parte del proyecto.\n\nSaludos cordiales.");
    const url = `https://outlook.office.com/mail/deeplink/compose?to=${emails}&subject=${subject}&body=${body}`;
    window.open(url, '_blank');
  };

  if (loading) return <div className="p-8">Cargando candidatos...</div>;

  return (
    <div className="p-6 h-full flex flex-col gap-6 relative">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h1 className="text-2xl font-bold">Gestión de Candidatos</h1>
        
        <div className={clsx("flex gap-2 p-1 rounded-lg", isDarkMode ? "bg-white/10" : "bg-black/10")}>
          <button 
            onClick={() => setViewMode('ALL')} 
            className={clsx(
              "px-4 py-1.5 rounded-md text-sm font-medium transition-colors", 
              viewMode === 'ALL' 
                ? (isDarkMode ? 'bg-[#2a2a2a] shadow text-blue-400' : 'bg-white shadow text-blue-600')
                : (isDarkMode ? 'text-white opacity-70 hover:opacity-100' : 'text-gray-900 opacity-70 hover:opacity-100')
            )}
          >
            Todos los Evaluados
          </button>
          <button 
            onClick={() => setViewMode('SELECTED')} 
            className={clsx(
              "px-4 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2", 
              viewMode === 'SELECTED' 
                ? (isDarkMode ? 'bg-[#2a2a2a] shadow text-green-400' : 'bg-white shadow text-green-600')
                : (isDarkMode ? 'text-white opacity-70 hover:opacity-100' : 'text-gray-900 opacity-70 hover:opacity-100')
            )}
          >
            <UserCheck size={16} /> Seleccionados ({selectedIds.size})
          </button>
        </div>
      </div>

      <div className={clsx("flex gap-4 p-4 rounded-xl border flex-wrap items-end", bgPanel)}>
        <div className="flex-1 min-w-[200px]">
          <label className="text-xs font-semibold opacity-70 block mb-1">Buscar por nombre o correo</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" size={16} />
            <input 
              type="text" 
              placeholder="Buscar..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className={clsx(selectClass, "pl-9")} 
            />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold opacity-70">Filtrar por Área</label>
          <select value={selectedArea} onChange={e => setSelectedArea(e.target.value)} className={selectClass}>
            <option value="">Todas</option>
            {areas.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold opacity-70">Filtrar por Cargo</label>
          <select value={selectedPosition} onChange={e => setSelectedPosition(e.target.value)} className={selectClass}>
            <option value="">Todos</option>
            {positions.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      {viewMode === 'SELECTED' && selectedIds.size > 0 && (
        <div className={clsx("p-4 rounded-xl border flex justify-between items-center bg-blue-500/10 border-blue-500/20")}>
          <div>
            <h3 className="font-bold text-blue-600 text-blue-400 text-lg">Candidatos Listos</h3>
            <p className="text-sm opacity-80">Tienes {selectedIds.size} candidato(s) seleccionado(s) para enviar la invitación.</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={handleSendInvite}
              className="flex items-center gap-2 bg-[#0078D4] hover:bg-[#005a9e] text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <img src={outlookIcon} alt="Outlook" className="w-5 h-5 object-contain" />
              Outlook (Desktop)
            </button>
            <button 
              onClick={handleSendInviteWeb}
              className="flex items-center gap-2 bg-[#0078D4] hover:bg-[#005a9e] text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <Mail size={18} />
              Outlook (Web)
            </button>
          </div>
        </div>
      )}

      <div className={clsx("rounded-xl border overflow-hidden flex-1", bgPanel)}>
        <div className="overflow-x-auto h-full">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="border-b border-gray-200 border-gray-700 bg-black/5">
              <tr>
                <th className="px-4 py-3 font-semibold">Candidato</th>
                <th className="px-4 py-3 font-semibold">Área</th>
                <th className="px-4 py-3 font-semibold">Cargo</th>
                <th className="px-4 py-3 font-semibold">Puntaje</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3 font-semibold text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredCandidates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 opacity-50">No se encontraron candidatos con los filtros actuales.</td>
                </tr>
              ) : (
                filteredCandidates.map(c => (
                  <tr key={c.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold">{c.fullName}</div>
                      <div className="text-xs opacity-60">{c.email}</div>
                    </td>
                    <td className="px-4 py-3">{c.area}</td>
                    <td className="px-4 py-3">{c.position}</td>
                    <td className="px-4 py-3 font-medium">{c.overallScore}%</td>
                    <td className="px-4 py-3">{getStatusBadge(c.eligibilityStatus)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center items-center gap-2">
                        <button 
                          onClick={() => setDetailCandidate(c)}
                          className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 text-gray-300 transition-colors"
                          title="Ver Detalles"
                        >
                          <Eye size={18} />
                        </button>
                        <button 
                          onClick={() => toggleSelection(c.id)}
                          className={clsx(
                            "px-3 py-1.5 rounded-md font-medium text-xs transition-colors",
                            selectedIds.has(c.id) 
                              ? "bg-red-500/10 text-red-500 hover:bg-red-500/20" 
                              : "bg-blue-500/10 text-blue-600 text-blue-400 hover:bg-blue-500/20"
                          )}
                        >
                          {selectedIds.has(c.id) ? "Deseleccionar" : "Seleccionar"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETALLES MODAL */}
      {detailCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm">
          <div className={clsx("w-full max-w-6xl max-h-[90vh] rounded-2xl flex flex-col overflow-hidden shadow-2xl", isDarkMode ? "bg-[#121212] text-white" : "bg-white text-gray-900")}>
            <div className="px-6 py-4 border-b border-gray-200 border-gray-700 flex justify-between items-center bg-black/5">
              <div>
                <h2 className="text-xl font-bold">{detailCandidate.fullName}</h2>
                <p className="text-sm opacity-70">{detailCandidate.position} | {detailCandidate.area}</p>
              </div>
              <button onClick={() => setDetailCandidate(null)} className="p-2 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-6 flex flex-col gap-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-4">
                  {getGateReason(detailCandidate)}
                  
                  <div className={clsx("p-4 rounded-xl border flex flex-col", isDarkMode ? "border-gray-800" : "border-gray-200")}>
                    <h3 className="font-bold mb-4">Rendimiento por Categorías</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={detailCandidate.categoryScores} layout="vertical" margin={{ left: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke={isDarkMode ? '#374151' : '#e5e7eb'} />
                          <XAxis type="number" domain={[0, 100]} />
                          <YAxis dataKey="name" type="category" width={120} tick={{fontSize: 10}} />
                          <RechartsTooltip cursor={{fill: 'transparent'}} contentStyle={{backgroundColor: isDarkMode ? '#1f2937' : '#fff', borderRadius: '8px', border: 'none'}} />
                          <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                            {detailCandidate.categoryScores.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <div className={clsx("p-4 rounded-xl border flex flex-col h-full", isDarkMode ? "border-gray-800" : "border-gray-200")}>
                    <h3 className="font-bold mb-4">Dimensiones</h3>
                    <div className="flex-1 min-h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <RechartsTooltip contentStyle={{backgroundColor: isDarkMode ? '#1f2937' : '#fff', borderRadius: '8px', border: 'none'}} />
                          <Pie
                            data={detailCandidate.dimensionScores}
                            dataKey="score"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                          >
                            {detailCandidate.dimensionScores.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[(index + 4) % COLORS.length]} />
                            ))}
                          </Pie>
                          <Legend wrapperStyle={{fontSize: '11px'}} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <h3 className="font-bold text-lg mb-3">Detalle de Respuestas</h3>
                <div className="border border-gray-200 border-gray-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-black/5 border-b border-gray-200 border-gray-800">
                      <tr>
                        <th className="px-4 py-2">Pregunta</th>
                        <th className="px-4 py-2">Dimensión</th>
                        <th className="px-4 py-2">Respuesta</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                      {detailCandidate.answers.map((ans, idx) => (
                        <tr key={idx} className={ans.isGate ? "bg-amber-500/5" : ""}>
                          <td className="px-4 py-3 max-w-md break-words whitespace-normal">
                            {ans.isGate && <span className="text-amber-500 font-bold text-xs mr-2">[GATE]</span>}
                            {ans.questionText}
                          </td>
                          <td className="px-4 py-3 opacity-70">{ans.dimension || '-'}</td>
                          <td className="px-4 py-3 font-medium whitespace-normal">{ans.answerText}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
