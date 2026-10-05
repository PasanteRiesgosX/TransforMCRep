import { useEffect, useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { metricsService, type MetricsResponse } from '../../../services/metrics.service';
import clsx from 'clsx';
import { FilterX, Building2, Briefcase } from 'lucide-react';

const COLORS = ['#4F46E5', '#10B981', '#F97316', '#8B5CF6', '#14B8A6', '#F43F5E', '#0EA5E9', '#D946EF'];

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

    // 1. CARDS CALCULATION
    const aCards = data.areas.map(area => {
      // If position is selected, we want participation of THAT position in THIS area
      const denominator = data.allUsersList.filter(u => u.area === area && (!selectedPosition || u.position === selectedPosition)).length;
      const numerator = data.participants.filter(p => p.area === area && (!selectedPosition || p.position === selectedPosition)).length;
      const pct = denominator > 0 ? (numerator / denominator) * 100 : 0;
      return { name: area, pct, count: numerator, total: denominator };
    });

    const pCards = data.positions.map(pos => {
      // If area is selected, we want participation of THIS position in THAT area
      const denominator = data.allUsersList.filter(u => u.position === pos && (!selectedArea || u.area === selectedArea)).length;
      const numerator = data.participants.filter(p => p.position === pos && (!selectedArea || p.area === selectedArea)).length;
      const pct = denominator > 0 ? (numerator / denominator) * 100 : 0;
      return { name: pos, pct, count: numerator, total: denominator };
    });

    // 2. CHART DATA CALCULATION (Areas on X axis)
    // Filter participants for charts based on area/cargo
    const activeParticipants = data.participants.filter(p => {
      if (selectedArea && p.area !== selectedArea) return false;
      if (selectedPosition && p.position !== selectedPosition) return false;
      return true;
    });

    // Grouping by Area for Category Chart
    const areaCatMap = new Map<string, { total: number; count: number }>();
    const areaDimMap = new Map<string, { total: number; count: number }>();

    data.areas.forEach(a => {
      areaCatMap.set(a, { total: 0, count: 0 });
      areaDimMap.set(a, { total: 0, count: 0 });
    });

    activeParticipants.forEach(p => {
      // Category scoring
      if (selectedCategory) {
        const cScore = p.categoryScores.find(c => c.category === selectedCategory);
        if (cScore) {
          const agg = areaCatMap.get(p.area)!;
          agg.total += cScore.score;
          agg.count += 1;
        }
      } else {
        // All categories combined (overallScore or average of categories)
        const agg = areaCatMap.get(p.area)!;
        agg.total += p.overallScore;
        agg.count += 1;
      }

      // Dimension scoring
      if (selectedDimension) {
        // If dimension selected, optionally filter by selected category
        let dScoreObj;
        if (selectedCategory) {
          dScoreObj = p.categoryDimensionScores.find(cd => cd.category === selectedCategory && cd.dimension === selectedDimension);
        } else {
          dScoreObj = p.dimensions.find(d => d.dimension === selectedDimension);
        }

        if (dScoreObj) {
          const agg = areaDimMap.get(p.area)!;
          agg.total += dScoreObj.score;
          agg.count += 1;
        }
      } else {
        // No dimension filter -> show overall score for the selected category (or global if no category)
        if (selectedCategory) {
          const cScore = p.categoryScores.find(c => c.category === selectedCategory);
          if (cScore) {
            const agg = areaDimMap.get(p.area)!;
            agg.total += cScore.score;
            agg.count += 1;
          }
        } else {
          const agg = areaDimMap.get(p.area)!;
          agg.total += p.overallScore;
          agg.count += 1;
        }
      }
    });

    const cData = Array.from(areaCatMap.entries()).map(([area, agg], idx) => ({
      name: area,
      score: agg.count > 0 ? Number((agg.total / agg.count).toFixed(2)) : 0,
      fill: COLORS[idx % COLORS.length]
    })).filter(d => !selectedArea || d.name === selectedArea); // Only show selected area in chart if filtered

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
          <FilterX size={16} /> Clear All Filters
        </button>
      </div>

      <div className={clsx("flex gap-4 p-4 rounded-xl border flex-wrap", bgPanel)}>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold opacity-70">Categoría Rúbrica</label>
          <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="bg-transparent border border-gray-500/30 rounded p-1.5 text-sm outline-none min-w-[150px]">
            <option value="">Todas las categorías</option>
            {data.categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold opacity-70">Dimensión</label>
          <select value={selectedDimension} onChange={e => setSelectedDimension(e.target.value)} className="bg-transparent border border-gray-500/30 rounded p-1.5 text-sm outline-none min-w-[150px]">
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
                  <RechartsTooltip cursor={{fill: 'transparent'}} contentStyle={{backgroundColor: isDarkMode ? '#1f2937' : '#fff', borderRadius: '8px', border: 'none'}} />
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
                  <RechartsTooltip contentStyle={{backgroundColor: isDarkMode ? '#1f2937' : '#fff', borderRadius: '8px', border: 'none'}} />
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
                  <RechartsTooltip contentStyle={{backgroundColor: isDarkMode ? '#1f2937' : '#fff', borderRadius: '8px', border: 'none'}} />
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
                  <RechartsTooltip cursor={{fill: 'transparent'}} contentStyle={{backgroundColor: isDarkMode ? '#1f2937' : '#fff', borderRadius: '8px', border: 'none'}} />
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
                  <RechartsTooltip contentStyle={{backgroundColor: isDarkMode ? '#1f2937' : '#fff', borderRadius: '8px', border: 'none'}} />
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
                  <Radar name="Puntaje" dataKey="score" stroke="#10B981" fill="#10B981" fillOpacity={0.5} isAnimationActive={true} />
                  <RechartsTooltip contentStyle={{backgroundColor: isDarkMode ? '#1f2937' : '#fff', borderRadius: '8px', border: 'none'}} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
