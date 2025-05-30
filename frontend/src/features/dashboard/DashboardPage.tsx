import { Card, Col, Row, Statistic } from 'antd';
import { Home, Users, MessageSquare, TrendingUp, PlusCircle, UserPlus, BarChart2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '../../api/client';

const DashboardPage = () => {
  // Fetch dashboard data
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => fetchApi('/api/dashboard/stats'),
  });

  const statCards = [
    {
      title: 'Tours Activos',
      value: stats?.activeTours || 0,
      icon: <Home className="text-blue-500" size={24} />,
      color: 'bg-blue-50',
    },
    {
      title: 'Leads Capturados',
      value: stats?.totalLeads || 0,
      icon: <Users className="text-green-500" size={24} />,
      color: 'bg-green-50',
    },
    {
      title: 'Conversaciones Hoy',
      value: stats?.todayConversations || 0,
      icon: <MessageSquare className="text-purple-500" size={24} />,
      color: 'bg-purple-50',
    },
    {
      title: 'Tasa de Conversión',
      value: stats?.conversionRate ? `${(stats.conversionRate * 100).toFixed(1)}%` : '0%',
      icon: <TrendingUp className="text-amber-500" size={24} />,
      color: 'bg-amber-50',
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-800">Panel de Control</h1>
      
      {/* Stats Grid */}
      <Row gutter={[16, 16]}>
        {statCards.map((stat, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <Card className="h-full shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-500">
                    {stat.title}
                  </div>
                  <div className="mt-1 text-2xl font-semibold">
                    {stat.value}
                  </div>
                </div>
                <div className={`p-3 rounded-full ${stat.color}`}>
                  {stat.icon}
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Recent Activity & Quick Actions */}
      <Row gutter={[16, 16]} className="mt-6">
        <Col xs={24} lg={16}>
          <Card title="Actividad Reciente" className="h-full">
            <div className="space-y-4">
              {[1, 2, 3].map((item) => (
                <div key={item} className="flex items-start p-3 hover:bg-gray-50 rounded-lg">
                  <div className="bg-blue-100 p-2 rounded-lg mr-3">
                    <MessageSquare className="text-blue-600" size={18} />
                  </div>
                  <div>
                    <div className="font-medium">Nuevo lead capturado</div>
                    <p className="text-sm text-gray-500">
                      Juan Pérez mostró interés en el tour de Casa en la Costa
                    </p>
                    <div className="text-xs text-gray-400 mt-1">Hace 2 horas</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Acciones Rápidas" className="h-full">
            <div className="space-y-3">
              <button className="w-full flex items-center p-3 text-left rounded-lg border border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-colors">
                <PlusCircle className="text-blue-500 mr-2" size={20} />
                <span>Crear Nuevo Tour</span>
              </button>
              <button className="w-full flex items-center p-3 text-left rounded-lg border border-dashed border-gray-300 hover:border-green-500 hover:bg-green-50 transition-colors">
                <UserPlus className="text-green-500 mr-2" size={20} />
                <span>Agregar Lead Manual</span>
              </button>
              <button className="w-full flex items-center p-3 text-left rounded-lg border border-dashed border-gray-300 hover:border-purple-500 hover:bg-purple-50 transition-colors">
                <BarChart2 className="text-purple-500 mr-2" size={20} />
                <span>Ver Reporte Mensual</span>
              </button>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardPage;