import { useEffect, useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { metricsService, type MetricsResponse } from '../../../services/metrics.service';
import clsx from 'clsx';
import { FilterX } from 'lucide-react';

const COLORS = ['#4F46E5', '#10B981', '#F97316', '#8B5CF6', '#14B8A6', '#F43F5E', '#0EA5E9', '#D946EF'];

export default function CategoriasDimensionesPage() {
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

  const filteredParticipants = useMemo(() => {
    if (!data) return [];
    return data.participants.filter(p => {
      if (selectedArea && p.area !== selectedArea) return false;
      if (selectedPosition && p.position !== selectedPosition) return false;
      return true;
    });
  }, [data, selectedArea, selectedPosition]);

  const { categoryData, dimensionData } = useMemo(() => {
    if (!data || filteredParticipants.length === 0) return { categoryData: [], dimensionData: [] };

    // Grouping by Category
    const catMap = new Map<string, { total: number; count: number }>();
    // Grouping by Dimension
    const dimMap = new Map<string, { total: number; count: number }>();

    filteredParticipants.forEach(p => {
      p.categoryScores.forEach(cs => {
        const agg = catMap.get(cs.category) || { total: 0, count: 0 };
        agg.total += cs.score;
        agg.count += 1;
        catMap.set(cs.category, agg);
      });

      p.dimensions.forEach(ds => {
        // If a category filter is active, only include dimension scores belonging to that category
        // In backend we have categoryDimensionScores for this!
        let scoreToUse = ds.score;
        let shouldInclude = true;

        if (selectedCategory) {
          const cdScore = p.categoryDimensionScores.find(cd => cd.category === selectedCategory && cd.dimension === ds.dimension);
          if (cdScore) {
            scoreToUse = cdScore.score;
          } else {
            shouldInclude = false; // Dimension doesn't apply to selected category for this user
          }
        }

        if (shouldInclude) {
          const agg = dimMap.get(ds.dimension) || { total: 0, count: 0 };
          agg.total += scoreToUse;
          agg.count += 1;
          dimMap.set(ds.dimension, agg);
        }
      });
    });

    const cData = Array.from(catMap.entries()).map(([name, agg], idx) => ({
      name,
      score: Number((agg.total / agg.count).toFixed(2)),
      fill: COLORS[idx % COLORS.length]
    }));

    const dData = Array.from(dimMap.entries()).map(([name, agg], idx) => ({
      name,
      score: Number((agg.total / agg.count).toFixed(2)),
      fill: COLORS[idx % COLORS.length]
    }));

    return { categoryData: cData, dimensionData: dData };
  }, [data, filteredParticipants, selectedCategory]);

  if (loading) return <div className="p-8">Cargando...</div>;
  if (!data) return <div className="p-8">Error cargando datos.</div>;

  const clearFilters = () => {
    setSelectedArea('');
    setSelectedPosition('');
    setSelectedCategory('');
    setSelectedDimension('');
  };

  const getOpacity = (itemValue: string, filterValue: string) => {
    if (!filterValue) return 1;
    return itemValue === filterValue ? 1 : 0.3;
  };

  const textFill = isDarkMode ? '#e5e7eb' : '#374151';
  const gridStroke = isDarkMode ? '#374151' : '#e5e7eb';
  const bgPanel = isDarkMode ? 'bg-[#1a1a1a] border-white/5' : 'bg-white border-gray-200 shadow-sm';

  return (
    <div className="p-6 h-full flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Vista por Categorías y Dimensiones (C & D)</h1>
        <button 
          onClick={clearFilters}
          className="flex items-center gap-2 px-3 py-1.5 rounded bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors text-sm font-medium"
        >
          <FilterX size={16} /> Clear All Filters
        </button>
      </div>

      <div className={clsx("flex gap-4 p-4 rounded-xl border flex-wrap", bgPanel)}>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold opacity-70">Área</label>
          <select value={selectedArea} onChange={e => setSelectedArea(e.target.value)} className="bg-transparent border border-gray-500/30 rounded p-1.5 text-sm outline-none">
            <option value="">Todas las áreas</option>
            {data.areas.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold opacity-70">Cargo</label>
          <select value={selectedPosition} onChange={e => setSelectedPosition(e.target.value)} className="bg-transparent border border-gray-500/30 rounded p-1.5 text-sm outline-none">
            <option value="">Todos los cargos</option>
            {data.positions.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold opacity-70">Categoría Rúbrica</label>
          <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="bg-transparent border border-gray-500/30 rounded p-1.5 text-sm outline-none">
            <option value="">Todas las categorías</option>
            {data.categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold opacity-70">Dimensión</label>
          <select value={selectedDimension} onChange={e => setSelectedDimension(e.target.value)} className="bg-transparent border border-gray-500/30 rounded p-1.5 text-sm outline-none">
            <option value="">Todas las dimensiones</option>
            {data.dimensions.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      {filteredParticipants.length === 0 ? (
        <div className="flex-1 flex items-center justify-center opacity-50">No hay datos para los filtros seleccionados.</div>
      ) : (
        <div className="flex flex-col gap-8">
          {/* Seccion Categoria */}
          <section>
            <h2 className="text-lg font-semibold mb-4 border-b border-gray-500/20 pb-2">GRÁFICOS POR CATEGORÍA</h2>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 h-80">
              <div className={clsx("p-4 rounded-xl border flex flex-col", bgPanel)}>
                <h3 className="text-sm font-medium mb-4 text-center">Puntaje por Categoría (Barras)</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                    <XAxis dataKey="name" stroke={textFill} tick={{fontSize: 10}} interval={0} angle={-15} textAnchor="end" height={50} />
                    <YAxis stroke={textFill} tick={{fontSize: 12}} domain={[0, 100]} />
                    <RechartsTooltip cursor={{fill: 'transparent'}} contentStyle={{backgroundColor: isDarkMode ? '#1f2937' : '#fff', borderRadius: '8px', border: 'none'}} />
                    <Bar dataKey="score" radius={[4, 4, 0, 0]} isAnimationActive={true} animationDuration={800}>
                      {categoryData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.fill} 
                          fillOpacity={getOpacity(entry.name, selectedCategory)}
                          className="transition-opacity duration-300"
                          style={{ cursor: 'pointer' }}
                          onClick={() => setSelectedCategory(selectedCategory === entry.name ? '' : entry.name)}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className={clsx("p-4 rounded-xl border flex flex-col", bgPanel)}>
                <h3 className="text-sm font-medium mb-4 text-center">Distribución de Puntajes (Pie)</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <RechartsTooltip contentStyle={{backgroundColor: isDarkMode ? '#1f2937' : '#fff', borderRadius: '8px', border: 'none'}} />
                    <Pie
                      data={categoryData}
                      dataKey="score"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      labelLine={false}
                      isAnimationActive={true}
                      animationDuration={800}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.fill}
                          fillOpacity={getOpacity(entry.name, selectedCategory)}
                          className="transition-opacity duration-300"
                          style={{ cursor: 'pointer' }}
                          onClick={() => setSelectedCategory(selectedCategory === entry.name ? '' : entry.name)}
                        />
                      ))}
                    </Pie>
                    <Legend wrapperStyle={{fontSize: '11px'}} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className={clsx("p-4 rounded-xl border flex flex-col", bgPanel)}>
                <h3 className="text-sm font-medium mb-4 text-center">Radar de Categorías</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={categoryData}>
                    <PolarGrid stroke={gridStroke} />
                    <PolarAngleAxis dataKey="name" tick={{fill: textFill, fontSize: 10}} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{fontSize: 10}} />
                    <Radar name="Puntaje" dataKey="score" stroke="#4F46E5" fill="#4F46E5" fillOpacity={0.5} isAnimationActive={true} />
                    <RechartsTooltip contentStyle={{backgroundColor: isDarkMode ? '#1f2937' : '#fff', borderRadius: '8px', border: 'none'}} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          {/* Seccion Dimension */}
          <section className="pb-12">
            <h2 className="text-lg font-semibold mb-4 border-b border-gray-500/20 pb-2">GRÁFICOS POR DIMENSIÓN</h2>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 h-80">
              <div className={clsx("p-4 rounded-xl border flex flex-col", bgPanel)}>
                <h3 className="text-sm font-medium mb-4 text-center">Puntaje por Dimensión (Barras)</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dimensionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                    <XAxis dataKey="name" stroke={textFill} tick={{fontSize: 9}} interval={0} angle={-25} textAnchor="end" height={60} />
                    <YAxis stroke={textFill} tick={{fontSize: 12}} domain={[0, 100]} />
                    <RechartsTooltip cursor={{fill: 'transparent'}} contentStyle={{backgroundColor: isDarkMode ? '#1f2937' : '#fff', borderRadius: '8px', border: 'none'}} />
                    <Bar dataKey="score" radius={[4, 4, 0, 0]} isAnimationActive={true} animationDuration={800}>
                      {dimensionData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.fill} 
                          fillOpacity={getOpacity(entry.name, selectedDimension)}
                          className="transition-opacity duration-300"
                          style={{ cursor: 'pointer' }}
                          onClick={() => setSelectedDimension(selectedDimension === entry.name ? '' : entry.name)}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className={clsx("p-4 rounded-xl border flex flex-col", bgPanel)}>
                <h3 className="text-sm font-medium mb-4 text-center">Distribución de Puntajes (Pie)</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <RechartsTooltip contentStyle={{backgroundColor: isDarkMode ? '#1f2937' : '#fff', borderRadius: '8px', border: 'none'}} />
                    <Pie
                      data={dimensionData}
                      dataKey="score"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      labelLine={false}
                      isAnimationActive={true}
                      animationDuration={800}
                    >
                      {dimensionData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.fill}
                          fillOpacity={getOpacity(entry.name, selectedDimension)}
                          className="transition-opacity duration-300"
                          style={{ cursor: 'pointer' }}
                          onClick={() => setSelectedDimension(selectedDimension === entry.name ? '' : entry.name)}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className={clsx("p-4 rounded-xl border flex flex-col", bgPanel)}>
                <h3 className="text-sm font-medium mb-4 text-center">Radar de Dimensiones</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="65%" data={dimensionData}>
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
      )}
    </div>
  );
}
