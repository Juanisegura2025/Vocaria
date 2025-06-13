import { Button, Card, Table, Tag, Space, Input, Row, Col, Modal, message } from 'antd';
import { Home, Search, Plus, Trash2, Eye, Upload as UploadIcon, Code, CheckCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toursService } from '../../services/toursService';
import type { Tour } from '../../services/toursService';
import ViewTourModal from '../../components/modals/ViewTourModal';
import CreateTourModal from '../../components/modals/CreateTourModal';
import PropertyUploadModal from '../../components/modals/PropertyUploadModal';
import EmbedCodeModal from '../../components/modals/EmbedCodeModal';

const { Search: SearchInput } = Input;

const ToursPage = () => {
  const [searchText, setSearchText] = useState('');
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  
  // New states for property upload
  const [propertyUploadModalVisible, setPropertyUploadModalVisible] = useState(false);
  const [selectedTourForUpload, setSelectedTourForUpload] = useState<Tour | null>(null);
  
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };

  // Load tours function
  const loadTours = async () => {
    try {
      setLoading(true);
      const data = await toursService.getTours();
      setTours(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading tours');
      console.error('Error loading tours:', err);
    } finally {
      setLoading(false);
    }
  };

  // Action handlers
  const handleViewTour = (tour: Tour) => {
    setSelectedTour(tour);
    setViewModalVisible(true);
  };

  const handleCreateTour = () => {
    setCreateModalVisible(true);
  };

  const handleDeleteTour = (tour: Tour) => {
    Modal.confirm({
      title: 'Are you sure?',
      content: `Do you want to delete the tour "${tour.name}"? This action cannot be undone.`,
      okText: 'Yes, delete',
      cancelText: 'Cancel',
      okType: 'danger',
      onOk: async () => {
        try {
          setDeleteLoading(tour.id.toString());
          await toursService.deleteTour(tour.id);
          message.success('Tour deleted successfully');
          // Reload tours
          await loadTours();
        } catch (error) {
          message.error('Error deleting tour');
          console.error('Delete error:', error);
        } finally {
          setDeleteLoading(null);
        }
      }
    });
  };

  const handleTourCreated = async () => {
    setCreateModalVisible(false);
    message.success('Tour created successfully');
    await loadTours();
  };

  // New handler for property upload
  const handleUploadPropertyData = (tour: Tour) => {
    setSelectedTourForUpload(tour);
    setPropertyUploadModalVisible(true);
  };

  // States for embed code modal
  const [embedModalVisible, setEmbedModalVisible] = useState(false);
  const [selectedTourForEmbed, setSelectedTourForEmbed] = useState<Tour | null>(null);

  // Handler for embed code
  const handleGetEmbedCode = (tour: Tour) => {
    setSelectedTourForEmbed(tour);
    setEmbedModalVisible(true);
  };

  // Safe filter function
  const safeFilter = (items: Tour[], searchValue: string) => {
    if (!Array.isArray(items) || !searchValue) return items;
    
    const searchLower = searchValue.toLowerCase();
    return items.filter(tour => 
      tour &&
      (safeStringIncludes(tour.name, searchLower) ||
       safeStringIncludes(tour.matterport_model_id, searchLower) ||
       safeStringIncludes(tour.id?.toString(), searchLower))
    );
  };

  const safeStringIncludes = (str: any, search: string): boolean => {
    return str && typeof str === 'string' && str.toLowerCase().includes(search);
  };

  // Filter tours based on search text
  const filteredTours = safeFilter(tours, searchText || '');

  useEffect(() => {
    loadTours();
  }, []);

  // Format date helper
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid date';
    }
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: Tour) => (
        <div className="flex items-center">
          <div className="bg-blue-100 p-2 rounded-lg mr-3">
            <Home className="text-blue-600" size={16} />
          </div>
          <div className="flex-1">
            <div className="font-medium">{name || 'No name'}</div>
            <div className="text-xs text-gray-500">ID: {record.id}</div>
            {/* Show imported Matterport info */}
            {record.matterport_data_imported && record.property_data && (
              <div className="flex items-center mt-1 text-xs">
                <Tag color="green" className="mr-1 text-xs">
                  Matterport
                </Tag>
                {record.property_data.city && (
                  <span className="text-gray-500">
                    📍 {record.property_data.city}
                  </span>
                )}
                {record.property_data.total_area_floor && (
                  <span className="text-gray-500 ml-2">
                    📐 {record.property_data.total_area_floor.toFixed(1)} {record.property_data.dimension_units === 'metric' ? 'm²' : 'ft²'}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      title: 'Matterport Model',
      dataIndex: 'matterport_model_id',
      key: 'matterport',
      render: (modelId: string) => (
        <Tag color="blue" className="font-mono">
          {modelId || 'Not assigned'}
        </Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'status',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Data Status',
      key: 'data_status',
      width: 130,
      render: (tour: Tour) => {
        // Check if tour has real property data
        const hasPropertyData = tour.matterport_data_imported && 
          tour.property_data && 
          tour.property_data.city; // If it has a city, it probably has real data
        
        if (hasPropertyData) {
          return (
            <Tag color="green" icon={<CheckCircle size={14} />}>
              Data OK
            </Tag>
          );
        }
        
        // Show upload button for ALL tours without property data
        return (
          <Button
            size="small"
            type="link"
            icon={<UploadIcon size={14} />}
            onClick={() => handleUploadPropertyData(tour)}
          >
            Add Data
          </Button>
        );
      }
    },
    {
      title: 'Created',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => (
        <div>
          {formatDate(date)}
        </div>
      ),
    },
    {
      title: 'Leads',
      dataIndex: 'leads_count',
      key: 'leads',
      render: (count: number) => (
        <span className="font-medium">{count || 0}</span>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 180,
      render: (_: any, record: Tour) => (
        <Space size="small">
          <Button 
            type="text" 
            icon={<Eye size={16} />} 
            title="View details"
            onClick={() => handleViewTour(record)}
            className="text-blue-500"
          />
          <Button 
            type="text" 
            icon={<Code size={16} />} 
            title="Get embed code"
            onClick={() => handleGetEmbedCode(record)}
            className="text-green-500"
          />
          <Button 
            type="text" 
            danger 
            icon={<Trash2 size={16} />} 
            title="Delete"
            loading={deleteLoading === record.id?.toString()}
            onClick={() => handleDeleteTour(record)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-semibold text-gray-800">Tour Management</h1>
        <Button 
          type="primary" 
          icon={<Plus size={16} />}
          className="flex items-center"
          onClick={handleCreateTour}
        >
          Create Tour
        </Button>
      </div>

      <Card>
        <div className="mb-6">
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} md={12} lg={6}>
              <SearchInput
                placeholder="Search tours..."
                prefix={<Search size={16} className="text-gray-400" />}
                onChange={handleSearch}
                allowClear
                className="w-full"
              />
            </Col>
            <Col xs={24} md={12} lg={18} className="text-right">
              <Space>
                <Button onClick={() => message.info('Advanced filters coming soon')}>
                  Filter
                </Button>
                <Button onClick={() => message.info('Export coming soon')}>
                  Export
                </Button>
              </Space>
            </Col>
          </Row>
        </div>

        {error ? (
          <div className="p-4 text-red-600">
            Error loading tours: {error}
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={filteredTours}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} tours`,
            }}
            scroll={{ x: 1200 }} // Allow horizontal scroll on small screens
          />
        )}
      </Card>

      {/* Modals */}
      <ViewTourModal
        visible={viewModalVisible}
        tour={selectedTour}
        onClose={() => {
          setViewModalVisible(false);
          setSelectedTour(null);
        }}
      />

      <CreateTourModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        onSuccess={handleTourCreated}
      />

      <PropertyUploadModal
        visible={propertyUploadModalVisible}
        onClose={() => {
          setPropertyUploadModalVisible(false);
          setSelectedTourForUpload(null);
        }}
        onSuccess={async () => {
          setPropertyUploadModalVisible(false);
          setSelectedTourForUpload(null);
          message.success('Property data uploaded successfully');
          await loadTours();
        }}
        tourId={selectedTourForUpload?.id}
        tourName={selectedTourForUpload?.name}
      />

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
    </div>
  );
};

export default ToursPage;