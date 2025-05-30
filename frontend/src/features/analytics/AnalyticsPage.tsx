import { Card, Row, Col, Select, DatePicker, Divider, Statistic, Space, Button } from 'antd';
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
import { 
  Users, 
  Home, 
  MessageSquare, 
  TrendingUp, 
  Calendar as CalendarIcon,
  Download
} from 'lucide-react';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '../../api/client';

const { RangePicker } = DatePicker;
const { Option } = Select;

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const AnalyticsPage = () => {
  const [dateRange, setDateRange] = useState([null, null]);
  const [tourFilter, setTourFilter] = useState('all');

  // Fetch analytics data
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['analytics', dateRange, tourFilter],
    queryFn: () => fetchApi('/api/analytics'),
  });

  // Mock data - in a real app, this would come from the API
  const mockData = {
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
            onChange={(dates) => setDateRange(dates as any)}
            suffixIcon={<CalendarIcon size={16} />}
            className="w-full sm:w-auto"
          />
          <Select
            placeholder="Filtrar por tour"
            style={{ width: 200 }}
            value={tourFilter}
            onChange={setTourFilter}
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
              prefix={<Users className="text-blue-500" size={24} />}
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
              prefix={<Home className="text-green-500" size={24} />}
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
              prefix={<TrendingUp className="text-purple-500" size={24} />}
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
              prefix={<MessageSquare className="text-amber-500" size={24} />}
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
                    {data.leadsBySource.map((entry: any, index: number) => (
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
