import { Button, Card, Table, Tag, Space, Input, Row, Col, Modal, message } from 'antd';
import { Home, Search, Plus, Edit, Trash2, Eye } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toursService } from '../../services/toursService';
import type { Tour } from '../../services/toursService';
import ViewTourModal from '../../components/modals/ViewTourModal';
import CreateTourModal from '../../components/modals/CreateTourModal';

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
      title: '¿Estás seguro?',
      content: `¿Quieres eliminar el tour "${tour.name}"? Esta acción no se puede deshacer.`,
      okText: 'Sí, eliminar',
      cancelText: 'Cancelar',
      okType: 'danger',
      onOk: async () => {
        try {
          setDeleteLoading(tour.id.toString());
          await toursService.deleteTour(tour.id);
          message.success('Tour eliminado exitosamente');
          // Reload tours
          await loadTours();
        } catch (error) {
          message.error('Error al eliminar el tour');
          console.error('Delete error:', error);
        } finally {
          setDeleteLoading(null);
        }
      }
    });
  };

  const handleTourCreated = async () => {
    setCreateModalVisible(false);
    message.success('Tour creado exitosamente');
    await loadTours();
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
      return new Date(dateString).toLocaleDateString('es-AR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Fecha inválida';
    }
  };

  const columns = [
    {
      title: 'Nombre',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: Tour) => (
        <div className="flex items-center">
          <div className="bg-blue-100 p-2 rounded-lg mr-3">
            <Home className="text-blue-600" size={16} />
          </div>
          <div>
            <div className="font-medium">{name || 'Sin nombre'}</div>
            <div className="text-xs text-gray-500">ID: {record.id}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Modelo Matterport',
      dataIndex: 'matterport_model_id',
      key: 'matterport',
      render: (modelId: string) => (
        <Tag color="blue" className="font-mono">
          {modelId || 'No asignado'}
        </Tag>
      ),
    },
    {
      title: 'Estado',
      dataIndex: 'is_active',
      key: 'status',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Activo' : 'Inactivo'}
        </Tag>
      ),
    },
    {
      title: 'Fecha Creación',
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
      title: 'Acciones',
      key: 'actions',
      render: (_, record: Tour) => (
        <Space size="middle">
          <Button 
            type="text" 
            icon={<Eye size={16} />} 
            title="Ver detalles"
            onClick={() => handleViewTour(record)}
            className="text-blue-500"
          />
          <Button 
            type="text" 
            icon={<Edit size={16} />} 
            title="Editar"
            className="text-blue-500"
            onClick={() => message.info('Funcionalidad de edición pendiente')}
          />
          <Button 
            type="text" 
            danger 
            icon={<Trash2 size={16} />} 
            title="Eliminar"
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
        <h1 className="text-2xl font-semibold text-gray-800">Gestión de Tours</h1>
        <Button 
          type="primary" 
          icon={<Plus size={16} />}
          className="flex items-center"
          onClick={handleCreateTour}
        >
          Crear Tour
        </Button>
      </div>

      <Card>
        <div className="mb-6">
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} md={12} lg={6}>
              <SearchInput
                placeholder="Buscar tours..."
                prefix={<Search size={16} className="text-gray-400" />}
                onChange={handleSearch}
                allowClear
                className="w-full"
              />
            </Col>
            <Col xs={24} md={12} lg={18} className="text-right">
              <Space>
                <Button onClick={() => message.info('Filtros avanzados pendientes')}>
                  Filtrar
                </Button>
                <Button onClick={() => message.info('Exportación pendiente')}>
                  Exportar
                </Button>
              </Space>
            </Col>
          </Row>
        </div>

        {error ? (
          <div className="p-4 text-red-600">
            Error al cargar los tours: {error}
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
    </div>
  );
};

export default ToursPage;