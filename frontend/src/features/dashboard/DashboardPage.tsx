import { Card, Col, Row, Spin, Alert, message } from 'antd';
import { Home, Users, MessageSquare, TrendingUp, PlusCircle, UserPlus, BarChart2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toursService } from '../../services/toursService';
import type { Tour } from '../../services/toursService';

const DashboardPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [toursData, setToursData] = useState<Tour[]>([]);
  const [totalLeads, setTotalLeads] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const tours = await toursService.getTours();
        setToursData(tours);
        
        // Count total leads across all tours
        let leadsCount = 0;
        for (const tour of tours) {
          try {
            const leads = await toursService.getTourLeads(tour.id);
            leadsCount += leads.length;
          } catch (e) {
            console.warn(`Could not load leads for tour ${tour.id}`, e);
          }
        }
        setTotalLeads(leadsCount);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading dashboard data');
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadDashboardData();
  }, []);

  // Action handlers for quick actions
  const handleCreateTour = () => {
    navigate('/tours');
    // The ToursPage will show the create modal when we add a URL parameter later
    // For now, just navigate and show a message
    setTimeout(() => {
      message.info('Haz clic en "Crear Tour" en la página de Tours');
    }, 500);
  };

  const handleAddLead = () => {
    navigate('/leads');
    setTimeout(() => {
      message.info('Funcionalidad de agregar lead manual próximamente');
    }, 500);
  };

  const handleViewReport = () => {
    navigate('/analytics');
    setTimeout(() => {
      message.success('Mostrando reporte de analíticas');
    }, 500);
  };

  const statCards = [
    {
      title: 'Tours Activos',
      value: toursData.filter(tour => tour.is_active).length,
      icon: <Home className="text-blue-500" size={24} />,
      color: 'bg-blue-50',
    },
    {
      title: 'Leads Capturados',
      value: totalLeads,
      icon: <Users className="text-green-500" size={24} />,
      color: 'bg-green-50',
    },
    {
      title: 'Tours Totales',
      value: toursData.length,
      icon: <MessageSquare className="text-purple-500" size={24} />,
      color: 'bg-purple-50',
    },
    {
      title: 'Tasa de Conversión',
      value: toursData.length > 0 ? `${Math.round((totalLeads / toursData.length) * 100)}%` : '0%',
      icon: <TrendingUp className="text-amber-500" size={24} />,
      color: 'bg-amber-50',
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="Error"
        description={error}
        type="error"
        showIcon
        className="mb-4"
      />
    );
  }

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
              {totalLeads > 0 ? (
                <div className="flex items-start p-3 hover:bg-gray-50 rounded-lg">
                  <div className="bg-blue-100 p-2 rounded-lg mr-3">
                    <MessageSquare className="text-blue-600" size={18} />
                  </div>
                  <div>
                    <div className="font-medium">Nuevo lead capturado</div>
                    <p className="text-sm text-gray-500">
                      Un visitante mostró interés en uno de tus tours
                    </p>
                    <div className="text-xs text-gray-400 mt-1">Reciente</div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare size={48} className="mx-auto mb-4 text-gray-300" />
                  <p>No hay actividad reciente</p>
                  <p className="text-sm">Los nuevos leads aparecerán aquí</p>
                </div>
              )}

              {toursData.length > 0 && (
                <div className="flex items-start p-3 hover:bg-gray-50 rounded-lg">
                  <div className="bg-green-100 p-2 rounded-lg mr-3">
                    <Home className="text-green-600" size={18} />
                  </div>
                  <div>
                    <div className="font-medium">Tours configurados</div>
                    <p className="text-sm text-gray-500">
                      Tienes {toursData.length} tour{toursData.length !== 1 ? 's' : ''} listo{toursData.length !== 1 ? 's' : ''} para capturar leads
                    </p>
                    <div className="text-xs text-gray-400 mt-1">Estado actual</div>
                  </div>
                </div>
              )}

              <div className="flex items-start p-3 hover:bg-gray-50 rounded-lg">
                <div className="bg-purple-100 p-2 rounded-lg mr-3">
                  <TrendingUp className="text-purple-600" size={18} />
                </div>
                <div>
                  <div className="font-medium">Sistema funcionando</div>
                  <p className="text-sm text-gray-500">
                    Vocaria está capturando leads automáticamente
                  </p>
                  <div className="text-xs text-gray-400 mt-1">24/7 activo</div>
                </div>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Acciones Rápidas" className="h-full">
            <div className="space-y-3">
              <button 
                onClick={handleCreateTour}
                className="w-full flex items-center p-3 text-left rounded-lg border border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer"
              >
                <PlusCircle className="text-blue-500 mr-2" size={20} />
                <span>Crear Nuevo Tour</span>
              </button>
              <button 
                onClick={handleAddLead}
                className="w-full flex items-center p-3 text-left rounded-lg border border-dashed border-gray-300 hover:border-green-500 hover:bg-green-50 transition-colors cursor-pointer"
              >
                <UserPlus className="text-green-500 mr-2" size={20} />
                <span>Agregar Lead Manual</span>
              </button>
              <button 
                onClick={handleViewReport}
                className="w-full flex items-center p-3 text-left rounded-lg border border-dashed border-gray-300 hover:border-purple-500 hover:bg-purple-50 transition-colors cursor-pointer"
              >
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