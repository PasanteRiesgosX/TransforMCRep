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

    const catMap = new Map<string, { total: number; count: number }>();
    const dimMap = new Map<string, { total: number; count: number }>();

    filteredParticipants.forEach(p => {
      p.categoryScores.forEach(cs => {
        const agg = catMap.get(cs.category) || { total: 0, count: 0 };
        agg.total += cs.score;
        agg.count += 1;
        catMap.set(cs.category, agg);
      });

      p.dimensions.forEach(ds => {
        let scoreToUse = ds.score;
        let shouldInclude = true;

        if (selectedCategory) {
          const cdScore = p.categoryDimensionScores.find(cd => cd.category === selectedCategory && cd.dimension === ds.dimension);
          if (cdScore) {
            scoreToUse = cdScore.score;
          } else {
            shouldInclude = false;
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
  const selectClass = clsx(
    'border rounded p-1.5 text-sm outline-none min-w-[150px]',
    isDarkMode
      ? 'bg-[#1a1a1a] border-gray-600 text-white [&>option]:bg-[#1a1a1a] [&>option]:text-white'
      : 'bg-white border-gray-300 text-gray-900 [&>option]:bg-white [&>option]:text-gray-900'
  );

  return (
    <div className="p-6 h-full flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Vista por Categorías y Dimensiones (C & D)</h1>
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
                    <RechartsTooltip content={<CustomBarTooltip />} cursor={{fill: 'transparent'}} />
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
                    <RechartsTooltip content={<CustomPieTooltip />} />
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
                    <Legend wrapperStyle={{fontSize: '11px', color: '#374151'}} />
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
                    <RechartsTooltip content={<CustomRadarTooltip />} />
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
                    <RechartsTooltip content={<CustomBarTooltip />} cursor={{fill: 'transparent'}} />
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
                    <RechartsTooltip content={<CustomPieTooltip />} />
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
                    <Legend wrapperStyle={{fontSize: '11px', color: '#374151'}} />
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
                    <Radar name="Puntaje" dataKey="score" stroke="#E11D48" fill="#E11D48" fillOpacity={0.5} isAnimationActive={true} />
                    <RechartsTooltip content={<CustomRadarTooltip />} />
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
