import { Card, Col, Row, Spin, Alert, message, Modal, Select } from 'antd';
import { Home, Users, MessageSquare, TrendingUp, PlusCircle, UserPlus, BarChart2, Code } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toursService } from '../../services/toursService';
import type { Tour } from '../../services/toursService';
import EmbedCodeModal from '../../components/modals/EmbedCodeModal';

const DashboardPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [toursData, setToursData] = useState<Tour[]>([]);
  const [totalLeads, setTotalLeads] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [embedModalVisible, setEmbedModalVisible] = useState(false);
  const [selectedTourForEmbed, setSelectedTourForEmbed] = useState<Tour | null>(null);

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
      message.info('Click "Create Tour" on the Tours page');
    }, 500);
  };

  const handleAddLead = () => {
    navigate('/leads');
    setTimeout(() => {
      message.info('Manual lead addition feature coming soon');
    }, 500);
  };

  const handleViewReport = () => {
    message.info('Monthly report in development');
  };

  const handleGetEmbedCode = () => {
    if (toursData.length === 0) {
      message.warning('You need to create at least one tour first');
      return;
    }

    if (toursData.length === 1) {
      setSelectedTourForEmbed(toursData[0]);
      setEmbedModalVisible(true);
    } else {
      const tourOptions = toursData.map(tour => ({
        label: tour.name,
        value: tour.id,
        tour: tour
      }));

      Modal.confirm({
        title: 'Select Tour',
        content: (
          <div className="my-4">
            <p className="mb-3">Which tour would you like to generate embed code for?</p>
            <Select
              style={{ width: '100%' }}
              placeholder="Select a tour"
              options={tourOptions}
              onChange={(value) => {
                const selectedTour = toursData.find(t => t.id === value);
                if (selectedTour) {
                  setSelectedTourForEmbed(selectedTour);
                }
              }}
            />
          </div>
        ),
        onOk: () => {
          if (selectedTourForEmbed) {
            setEmbedModalVisible(true);
          } else {
            message.warning('Please select a tour');
          }
        },
        okText: 'Get Code',
        cancelText: 'Cancel'
      });
    }
  };

  const statCards = [
    {
      title: 'Active Tours',
      value: toursData.filter(tour => tour.is_active).length,
      icon: <Home className="text-blue-500" size={24} />,
      color: 'bg-blue-50',
    },
    {
      title: 'Leads Captured',
      value: totalLeads,
      icon: <Users className="text-green-500" size={24} />,
      color: 'bg-green-50',
    },
    {
      title: 'Total Tours',
      value: toursData.length,
      icon: <MessageSquare className="text-purple-500" size={24} />,
      color: 'bg-purple-50',
    },
    {
      title: 'Conversion Rate',
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
    <>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-gray-800">Dashboard</h1>
      
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
          <Card title="Recent Activity" className="h-full">
            <div className="space-y-4">
              {totalLeads > 0 ? (
                <div className="flex items-start p-3 hover:bg-gray-50 rounded-lg">
                  <div className="bg-blue-100 p-2 rounded-lg mr-3">
                    <MessageSquare className="text-blue-600" size={18} />
                  </div>
                  <div>
                    <div className="font-medium">New lead captured</div>
                    <p className="text-sm text-gray-500">
                      A visitor showed interest in one of your tours
                    </p>
                    <div className="text-xs text-gray-400 mt-1">Recent</div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare size={48} className="mx-auto mb-4 text-gray-300" />
                  <p>No recent activity</p>
                  <p className="text-sm">New leads will appear here</p>
                </div>
              )}

              {toursData.length > 0 && (
                <div className="flex items-start p-3 hover:bg-gray-50 rounded-lg">
                  <div className="bg-green-100 p-2 rounded-lg mr-3">
                    <Home className="text-green-600" size={18} />
                  </div>
                  <div>
                    <div className="font-medium">Tours configured</div>
                    <p className="text-sm text-gray-500">
                      You have {toursData.length} tour{toursData.length !== 1 ? 's' : ''} ready to capture leads
                    </p>
                    <div className="text-xs text-gray-400 mt-1">Current status</div>
                  </div>
                </div>
              )}

              <div className="flex items-start p-3 hover:bg-gray-50 rounded-lg">
                <div className="bg-purple-100 p-2 rounded-lg mr-3">
                  <TrendingUp className="text-purple-600" size={18} />
                </div>
                <div>
                  <div className="font-medium">System operational</div>
                  <p className="text-sm text-gray-500">
                    Vocaria is capturing leads automatically
                  </p>
                  <div className="text-xs text-gray-400 mt-1">24/7 active</div>
                </div>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Quick Actions" className="h-full">
            <div className="space-y-3">
              <button 
                onClick={handleCreateTour}
                className="w-full flex items-center p-3 text-left rounded-lg border border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer"
              >
                <PlusCircle className="text-blue-500 mr-2" size={20} />
                <span>Create New Tour</span>
              </button>
              <button 
                onClick={handleAddLead}
                className="w-full flex items-center p-3 text-left rounded-lg border border-dashed border-gray-300 hover:border-green-500 hover:bg-green-50 transition-colors cursor-pointer"
              >
                <UserPlus className="text-green-500 mr-2" size={20} />
                <span>Add Manual Lead</span>
              </button>
              <button 
                onClick={handleGetEmbedCode}
                className="w-full flex items-center p-3 text-left rounded-lg border border-dashed border-gray-300 hover:border-green-500 hover:bg-green-50 transition-colors cursor-pointer"
              >
                <Code className="text-green-500 mr-2" size={20} />
                <span>Get Embed Code</span>
              </button>
              
              <button 
                onClick={handleViewReport}
                className="w-full flex items-center p-3 text-left rounded-lg border border-dashed border-gray-300 hover:border-purple-500 hover:bg-purple-50 transition-colors cursor-pointer"
              >
                <BarChart2 className="text-purple-500 mr-2" size={20} />
                <span>View Monthly Report</span>
              </button>
            </div>
          </Card>
        </Col>
      </Row>
      </div>

      <EmbedCodeModal
        visible={embedModalVisible}
        onClose={() => {
          setEmbedModalVisible(false);
          setSelectedTourForEmbed(null);
        }}
        tourId={selectedTourForEmbed?.id || 0}
        tourName={selectedTourForEmbed?.name || ''}
        agentId="agent_01jwsmw7pcfp6r4hcebmbbnd43"
      />
    </>
  );
};

export default DashboardPage;