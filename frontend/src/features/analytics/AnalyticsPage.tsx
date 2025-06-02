import { Card, Row, Col, Select, DatePicker, Statistic, Space, Button } from 'antd';
import { Download } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '../../api/client';

const { RangePicker } = DatePicker;
const { Option } = Select;

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

interface AnalyticsData {
  totalLeads: number;
  totalTours: number;
  conversionRate: number;
  avgSessionDuration: string;
  leadsBySource: Array<{
    name: string;
    value: number;
  }>;
  leadsByTour: Array<{
    name: string;
    leads: number;
  }>;
  leadsOverTime: Array<{
    date: string;
    leads: number;
    tours: number;
  }>;
}

const AnalyticsPage = () => {
  const [dateRange, setDateRange] = useState<[string, string]>(['', '']);
  const [tourFilter, setTourFilter] = useState<string>('all');

  const { data: analytics, isLoading } = useQuery<AnalyticsData>({
    queryKey: ['analytics', dateRange, tourFilter],
    queryFn: () => fetchApi('/api/analytics'),
  });

  // Mock data for development
  const mockData: AnalyticsData = {
    totalLeads: 124,
    totalTours: 8,
    conversionRate: 0.42,
    avgSessionDuration: '3:24',
    leadsBySource: [
      { name: 'Tours Virtuales', value: 65 },
      { name: 'Redes Sociales', value: 25 },
      { name: 'Sitio Web', value: 15 },
      { name: 'Referidos', value: 10 },
    ],
    leadsByTour: [
      { name: 'Casa en la Costa', leads: 45 },
      { name: 'Departamento Centro', leads: 32 },
      { name: 'Casa con Piscina', leads: 28 },
      { name: 'Loft Moderno', leads: 19 },
    ],
    leadsOverTime: [
      { date: 'Ene', leads: 10, tours: 5 },
      { date: 'Feb', leads: 15, tours: 7 },
      { date: 'Mar', leads: 22, tours: 10 },
      { date: 'Abr', leads: 18, tours: 8 },
      { date: 'May', leads: 25, tours: 12 },
      { date: 'Jun', leads: 34, tours: 15 },
    ],
  };

  const data = analytics || mockData;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-semibold text-gray-800">Analíticas</h1>
        <Space>
          <RangePicker 
            placeholder={['Fecha inicio', 'Fecha fin']} 
            onChange={(dates) => {
              if (dates && dates[0] && dates[1]) {
                setDateRange([dates[0].format('YYYY-MM-DD'), dates[1].format('YYYY-MM-DD')]);
              } else {
                setDateRange(['', '']);
              }
            }}
            className="w-full sm:w-auto"
          />
          <Select
            placeholder="Filtrar por tour"
            style={{ width: 200 }}
            value={tourFilter}
            onChange={(value: string) => setTourFilter(value)}
          >
            <Option value="all">Todos los tours</Option>
            <Option value="casa-costa">Casa en la Costa</Option>
            <Option value="depto-centro">Departamento Centro</Option>
          </Select>
          <Button icon={<Download size={16} />}>
            Exportar
          </Button>
        </Space>
      </div>

      {/* Summary Cards */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} lg={6}>
          <Card className="h-full">
            <Statistic
              title="Total de Leads"
              value={data.totalLeads}
              valueStyle={{ color: '#3f8600' }}
              loading={isLoading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="h-full">
            <Statistic
              title="Tours Activos"
              value={data.totalTours}
              valueStyle={{ color: '#3f8600' }}
              loading={isLoading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="h-full">
            <Statistic
              title="Tasa de Conversión"
              value={data.conversionRate * 100}
              precision={1}
              suffix="%"
              valueStyle={{ color: '#722ed1' }}
              loading={isLoading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="h-full">
            <Statistic
              title="Interacción Promedio"
              value={data.avgSessionDuration}
              loading={isLoading}
            />
          </Card>
        </Col>
      </Row>

      {/* Charts Row 1 */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} lg={16}>
          <Card title="Leads por Período" className="h-full">
            <div style={{ height: 350 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.leadsOverTime}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="leads" name="Leads" fill="#3b82f6" />
                  <Bar dataKey="tours" name="Tours" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Fuente de Leads" className="h-full">
            <div style={{ height: 350 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.leadsBySource}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => 
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {data.leadsBySource.map((_: { name: string; value: number }, index: number) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]} 
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} leads`, 'Cantidad']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Charts Row 2 */}
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card title="Rendimiento por Tour">
            <div style={{ height: 400 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.leadsByTour}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={150} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="leads" name="Leads Generados" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AnalyticsPage;
