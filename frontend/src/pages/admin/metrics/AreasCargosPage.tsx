import { useEffect, useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { metricsService, type MetricsResponse } from '../../../services/metrics.service';
import clsx from 'clsx';
import { FilterX, Building2, Briefcase } from 'lucide-react';

const COLORS = ['#4F46E5', '#E11D48', '#F97316', '#8B5CF6', '#0D9488', '#2563EB', '#CA8A04', '#DC2626', '#7C3AED', '#059669'];

interface CustomTooltipProps {
  active?: boolean;
  payload?: { name: string; value: number; payload: { fill: string; name: string } }[];
  label?: string;
}

function CustomBarTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-100 p-3 min-w-[160px]">
      <p className="text-sm font-semibold text-gray-800 mb-1">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
          <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: entry.payload.fill }} />
          <span>Puntaje: <strong>{entry.value}</strong></span>
        </div>
      ))}
    </div>
  );
}

function CustomPieTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-100 p-3 min-w-[160px]">
      <div className="flex items-center gap-2 text-sm text-gray-800 font-semibold mb-1">
        <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: entry.payload.fill }} />
        <span>{entry.name}</span>
      </div>
      <p className="text-sm text-gray-700">Puntaje: <strong>{entry.value}</strong></p>
    </div>
  );
}

function CustomRadarTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-100 p-3 min-w-[140px]">
      <p className="text-sm font-semibold text-gray-800 mb-1">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
          <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: '#4F46E5' }} />
          <span>Puntaje: <strong>{entry.value}</strong></span>
        </div>
      ))}
    </div>
  );
}

export default function AreasCargosPage() {
  const { isDarkMode } = useOutletContext<{ isDarkMode: boolean }>();
  const [data, setData] = useState<MetricsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedArea, setSelectedArea] = useState<string>('');
  const [selectedPosition, setSelectedPosition] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedDimension, setSelectedDimension] = useState<string>('');

  useEffect(() => {
    metricsService.getMetrics().then(res => {
      setData(res);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  const clearFilters = () => {
    setSelectedArea('');
    setSelectedPosition('');
    setSelectedCategory('');
    setSelectedDimension('');
  };

  const { areaCards, positionCards, chartDataCategory, chartDataDimension } = useMemo(() => {
    if (!data) return { areaCards: [], positionCards: [], chartDataCategory: [], chartDataDimension: [] };

    // 1. CARDS: Count UNIQUE users who have submitted
    const uniqueParticipantsByArea = new Map<string, Set<string>>();
    const uniqueParticipantsByPosition = new Map<string, Set<string>>();

    data.participants.forEach(p => {
      if (p.area) {
        if (!uniqueParticipantsByArea.has(p.area)) uniqueParticipantsByArea.set(p.area, new Set());
        uniqueParticipantsByArea.get(p.area)!.add(p.userId);
      }
      if (p.position) {
        if (!uniqueParticipantsByPosition.has(p.position)) uniqueParticipantsByPosition.set(p.position, new Set());
        uniqueParticipantsByPosition.get(p.position)!.add(p.userId);
      }
    });

    const aCards = data.areas.map(area => {
      const denominator = data.allUsersList.filter(u => u.area === area && (!selectedPosition || u.position === selectedPosition)).length;
      let numerator = 0;
      if (selectedPosition) {
        numerator = data.participants.filter(p => p.area === area && p.position === selectedPosition)
          .reduce((acc, p) => { acc.add(p.userId); return acc; }, new Set<string>()).size;
      } else {
        numerator = uniqueParticipantsByArea.get(area)?.size ?? 0;
      }
      const pct = denominator > 0 ? Math.min((numerator / denominator) * 100, 100) : 0;
      return { name: area, pct, count: numerator, total: denominator };
    });

    const pCards = data.positions.map(pos => {
      const denominator = data.allUsersList.filter(u => u.position === pos && (!selectedArea || u.area === selectedArea)).length;
      let numerator = 0;
      if (selectedArea) {
        numerator = data.participants.filter(p => p.position === pos && p.area === selectedArea)
          .reduce((acc, p) => { acc.add(p.userId); return acc; }, new Set<string>()).size;
      } else {
        numerator = uniqueParticipantsByPosition.get(pos)?.size ?? 0;
      }
      const pct = denominator > 0 ? Math.min((numerator / denominator) * 100, 100) : 0;
      return { name: pos, pct, count: numerator, total: denominator };
    });

    // 2. CHART DATA (Areas on X axis)
    const activeParticipants = data.participants.filter(p => {
      if (selectedArea && p.area !== selectedArea) return false;
      if (selectedPosition && p.position !== selectedPosition) return false;
      return true;
    });

    const userScoresByArea = new Map<string, Map<string, { catScores: Map<string, number[]>; dimScores: Map<string, number[]>; overallScores: number[]; cdScores: Map<string, number[]> }>>();

    activeParticipants.forEach(p => {
      if (!userScoresByArea.has(p.area)) userScoresByArea.set(p.area, new Map());
      const areaMap = userScoresByArea.get(p.area)!;
      if (!areaMap.has(p.userId)) {
        areaMap.set(p.userId, { catScores: new Map(), dimScores: new Map(), overallScores: [], cdScores: new Map() });
      }
      const userEntry = areaMap.get(p.userId)!;
      userEntry.overallScores.push(p.overallScore);
      p.categoryScores.forEach(cs => {
        if (!userEntry.catScores.has(cs.category)) userEntry.catScores.set(cs.category, []);
        userEntry.catScores.get(cs.category)!.push(cs.score);
      });
      p.dimensions.forEach(ds => {
        if (!userEntry.dimScores.has(ds.dimension)) userEntry.dimScores.set(ds.dimension, []);
        userEntry.dimScores.get(ds.dimension)!.push(ds.score);
      });
      p.categoryDimensionScores.forEach(cd => {
        const key = `${cd.category}|${cd.dimension}`;
        if (!userEntry.cdScores.has(key)) userEntry.cdScores.set(key, []);
        userEntry.cdScores.get(key)!.push(cd.score);
      });
    });

    const areaCatMap = new Map<string, { total: number; count: number }>();
    const areaDimMap = new Map<string, { total: number; count: number }>();

    data.areas.forEach(a => {
      areaCatMap.set(a, { total: 0, count: 0 });
      areaDimMap.set(a, { total: 0, count: 0 });
    });

    for (const [area, usersMap] of userScoresByArea) {
      for (const [, userData] of usersMap) {
        const avgOverall = userData.overallScores.reduce((a, b) => a + b, 0) / userData.overallScores.length;

        // Category chart
        if (selectedCategory) {
          const scores = userData.catScores.get(selectedCategory);
          if (scores && scores.length > 0) {
            const avgCat = scores.reduce((a, b) => a + b, 0) / scores.length;
            const agg = areaCatMap.get(area)!;
            agg.total += avgCat;
            agg.count += 1;
          }
        } else {
          const agg = areaCatMap.get(area)!;
          agg.total += avgOverall;
          agg.count += 1;
        }

        // Dimension chart
        if (selectedDimension) {
          if (selectedCategory) {
            const key = `${selectedCategory}|${selectedDimension}`;
            const scores = userData.cdScores.get(key);
            if (scores && scores.length > 0) {
              const avgDim = scores.reduce((a, b) => a + b, 0) / scores.length;
              const agg = areaDimMap.get(area)!;
              agg.total += avgDim;
              agg.count += 1;
            }
          } else {
            const scores = userData.dimScores.get(selectedDimension);
            if (scores && scores.length > 0) {
              const avgDim = scores.reduce((a, b) => a + b, 0) / scores.length;
              const agg = areaDimMap.get(area)!;
              agg.total += avgDim;
              agg.count += 1;
            }
          }
        } else {
          if (selectedCategory) {
            const scores = userData.catScores.get(selectedCategory);
            if (scores && scores.length > 0) {
              const avgCat = scores.reduce((a, b) => a + b, 0) / scores.length;
              const agg = areaDimMap.get(area)!;
              agg.total += avgCat;
              agg.count += 1;
            }
          } else {
            const agg = areaDimMap.get(area)!;
            agg.total += avgOverall;
            agg.count += 1;
          }
        }
      }
    }

    const cData = Array.from(areaCatMap.entries()).map(([area, agg], idx) => ({
      name: area,
      score: agg.count > 0 ? Number((agg.total / agg.count).toFixed(2)) : 0,
      fill: COLORS[idx % COLORS.length]
    })).filter(d => !selectedArea || d.name === selectedArea);

    const dData = Array.from(areaDimMap.entries()).map(([area, agg], idx) => ({
      name: area,
      score: agg.count > 0 ? Number((agg.total / agg.count).toFixed(2)) : 0,
      fill: COLORS[idx % COLORS.length]
    })).filter(d => !selectedArea || d.name === selectedArea);

    return { areaCards: aCards, positionCards: pCards, chartDataCategory: cData, chartDataDimension: dData };
  }, [data, selectedArea, selectedPosition, selectedCategory, selectedDimension]);

  if (loading) return <div className="p-8">Cargando...</div>;
  if (!data) return <div className="p-8">Error cargando datos.</div>;

  const textFill = isDarkMode ? '#e5e7eb' : '#374151';
  const gridStroke = isDarkMode ? '#374151' : '#e5e7eb';
  const bgPanel = isDarkMode ? 'bg-[#1a1a1a] border-white/5' : 'bg-white border-gray-200 shadow-sm';
  const selectClass = clsx(
    'border rounded p-1.5 text-sm outline-none min-w-[150px]',
    isDarkMode
      ? 'bg-[#1a1a1a] border-gray-600 text-white [&>option]:bg-[#1a1a1a] [&>option]:text-white'
      : 'bg-white border-gray-300 text-gray-900 [&>option]:bg-white [&>option]:text-gray-900'
  );

  const getCardOpacity = (item: string, selected: string) => {
    if (!selected) return 1;
    return item === selected ? 1 : 0.4;
  };

  return (
    <div className="p-6 h-full flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Vista por Áreas y Cargos (A & C)</h1>
        <button 
          onClick={clearFilters}
          className="flex items-center gap-2 px-3 py-1.5 rounded bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors text-sm font-medium"
        >
          <FilterX size={16} /> Limpiar Filtros
        </button>
      </div>

      <div className={clsx("flex gap-4 p-4 rounded-xl border flex-wrap", bgPanel)}>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold opacity-70">Área</label>
          <select value={selectedArea} onChange={e => setSelectedArea(e.target.value)} className={selectClass}>
            <option value="">Todas las áreas</option>
            {data.areas.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold opacity-70">Cargo</label>
          <select value={selectedPosition} onChange={e => setSelectedPosition(e.target.value)} className={selectClass}>
            <option value="">Todos los cargos</option>
            {data.positions.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold opacity-70">Categoría Rúbrica</label>
          <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className={selectClass}>
            <option value="">Todas las categorías</option>
            {data.categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold opacity-70">Dimensión</label>
          <select value={selectedDimension} onChange={e => setSelectedDimension(e.target.value)} className={selectClass}>
            <option value="">Todas las dimensiones</option>
            {data.dimensions.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      {/* Secciones de Cards */}
      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold border-b border-gray-500/20 pb-2">Áreas</h2>
        <div className="flex flex-wrap gap-4">
          {areaCards.map(a => (
            <div 
              key={a.name}
              onClick={() => setSelectedArea(selectedArea === a.name ? '' : a.name)}
              className={clsx(
                "p-4 rounded-xl border flex flex-col gap-2 min-w-[180px] cursor-pointer transition-all duration-300",
                bgPanel
              )}
              style={{ opacity: getCardOpacity(a.name, selectedArea), borderColor: selectedArea === a.name ? '#00D7D0' : '' }}
            >
              <div className="flex items-center gap-2 text-sm font-medium">
                <Building2 size={16} className="text-[#00D7D0]" />
                <span className="truncate" title={a.name}>{a.name}</span>
              </div>
              <div className="text-2xl font-bold">{a.pct.toFixed(1)}%</div>
              <div className="text-xs opacity-60">Participación ({a.count}/{a.total})</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold border-b border-gray-500/20 pb-2">Cargos</h2>
        <div className="flex flex-wrap gap-4">
          {positionCards.map(p => (
            <div 
              key={p.name}
              onClick={() => setSelectedPosition(selectedPosition === p.name ? '' : p.name)}
              className={clsx(
                "p-4 rounded-xl border flex flex-col gap-2 min-w-[180px] cursor-pointer transition-all duration-300",
                bgPanel
              )}
              style={{ opacity: getCardOpacity(p.name, selectedPosition), borderColor: selectedPosition === p.name ? '#4F46E5' : '' }}
            >
              <div className="flex items-center gap-2 text-sm font-medium">
                <Briefcase size={16} className="text-[#4F46E5]" />
                <span className="truncate" title={p.name}>{p.name}</span>
              </div>
              <div className="text-2xl font-bold">{p.pct.toFixed(1)}%</div>
              <div className="text-xs opacity-60">Participación ({p.count}/{p.total})</div>
            </div>
          ))}
        </div>
      </div>

      {/* Gráficos */}
      <div className="flex flex-col gap-8 mt-4">
        <section>
          <h2 className="text-lg font-semibold mb-4 border-b border-gray-500/20 pb-2">
            POR CATEGORÍA {selectedCategory && `(${selectedCategory})`}
          </h2>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 h-80">
            <div className={clsx("p-4 rounded-xl border flex flex-col", bgPanel)}>
              <h3 className="text-sm font-medium mb-4 text-center">Puntaje por Área</h3>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartDataCategory}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                  <XAxis dataKey="name" stroke={textFill} tick={{fontSize: 10}} interval={0} angle={-25} textAnchor="end" height={60} />
                  <YAxis stroke={textFill} tick={{fontSize: 12}} domain={[0, 100]} />
                  <RechartsTooltip content={<CustomBarTooltip />} cursor={{fill: 'transparent'}} />
                  <Bar dataKey="score" radius={[4, 4, 0, 0]} isAnimationActive={true} animationDuration={800}>
                    {chartDataCategory.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.fill} 
                        className="transition-opacity duration-300 hover:opacity-80"
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className={clsx("p-4 rounded-xl border flex flex-col", bgPanel)}>
              <h3 className="text-sm font-medium mb-4 text-center">Distribución Global (Pie)</h3>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <RechartsTooltip content={<CustomPieTooltip />} />
                  <Pie
                    data={chartDataCategory}
                    dataKey="score"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    labelLine={false}
                    isAnimationActive={true}
                    animationDuration={800}
                  >
                    {chartDataCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Legend wrapperStyle={{fontSize: '11px', color: '#374151'}} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className={clsx("p-4 rounded-xl border flex flex-col", bgPanel)}>
              <h3 className="text-sm font-medium mb-4 text-center">Radar de Áreas</h3>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="65%" data={chartDataCategory}>
                  <PolarGrid stroke={gridStroke} />
                  <PolarAngleAxis dataKey="name" tick={{fill: textFill, fontSize: 8}} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{fontSize: 10}} />
                  <Radar name="Puntaje" dataKey="score" stroke="#4F46E5" fill="#4F46E5" fillOpacity={0.5} isAnimationActive={true} />
                  <RechartsTooltip content={<CustomRadarTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        <section className="pb-12">
          <h2 className="text-lg font-semibold mb-4 border-b border-gray-500/20 pb-2">
            POR DIMENSIÓN {selectedDimension && `(${selectedDimension})`}
          </h2>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 h-80">
            <div className={clsx("p-4 rounded-xl border flex flex-col", bgPanel)}>
              <h3 className="text-sm font-medium mb-4 text-center">Puntaje por Área</h3>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartDataDimension}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                  <XAxis dataKey="name" stroke={textFill} tick={{fontSize: 10}} interval={0} angle={-25} textAnchor="end" height={60} />
                  <YAxis stroke={textFill} tick={{fontSize: 12}} domain={[0, 100]} />
                  <RechartsTooltip content={<CustomBarTooltip />} cursor={{fill: 'transparent'}} />
                  <Bar dataKey="score" radius={[4, 4, 0, 0]} isAnimationActive={true} animationDuration={800}>
                    {chartDataDimension.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} className="transition-opacity duration-300 hover:opacity-80" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className={clsx("p-4 rounded-xl border flex flex-col", bgPanel)}>
              <h3 className="text-sm font-medium mb-4 text-center">Distribución Global (Pie)</h3>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <RechartsTooltip content={<CustomPieTooltip />} />
                  <Pie
                    data={chartDataDimension}
                    dataKey="score"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    labelLine={false}
                    isAnimationActive={true}
                    animationDuration={800}
                  >
                    {chartDataDimension.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Legend wrapperStyle={{fontSize: '11px', color: '#374151'}} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className={clsx("p-4 rounded-xl border flex flex-col", bgPanel)}>
              <h3 className="text-sm font-medium mb-4 text-center">Radar de Áreas</h3>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="65%" data={chartDataDimension}>
                  <PolarGrid stroke={gridStroke} />
                  <PolarAngleAxis dataKey="name" tick={{fill: textFill, fontSize: 8}} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{fontSize: 10}} />
                  <Radar name="Puntaje" dataKey="score" stroke="#E11D48" fill="#E11D48" fillOpacity={0.5} isAnimationActive={true} />
                  <RechartsTooltip content={<CustomRadarTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
