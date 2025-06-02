import { Button, Card, Table, Tag, Space, Input, Row, Col } from 'antd';
import { Home, Search, Plus, Edit, Trash2, Eye } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toursService } from '../../services/toursService';
import type { Tour } from '../../services/toursService';

const { Search: SearchInput } = Input;

const ToursPage = () => {
  const [searchText, setSearchText] = useState('');
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };

  // Safe filter function
  const safeFilter = (items: Tour[], searchValue: string) => {
    if (!Array.isArray(items) || !searchValue) return items;
    
    const searchLower = searchValue.toLowerCase();
    return items.filter(tour => 
      tour &&
      (safeStringIncludes(tour.property_id, searchLower) ||
       safeStringIncludes(tour.status, searchLower) ||
       safeStringIncludes(tour.id, searchLower))
    );
  };

  const safeStringIncludes = (str: any, search: string): boolean => {
    return str && typeof str === 'string' && str.toLowerCase().includes(search);
  };

  // Filter tours based on search text
  const filteredTours = safeFilter(tours, searchText || '');

  useEffect(() => {
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
      title: 'Fecha Programada',
      dataIndex: 'scheduled_time',
      key: 'scheduledTime',
      render: (date: string) => (
        <div>
          {formatDate(date)}
        </div>
      ),
    },
    {
      title: 'Estado',
      dataIndex: 'status',
      key: 'status',
      render: (status: 'scheduled' | 'completed' | 'cancelled') => {
        const statusMap = {
          scheduled: { color: 'green', text: 'Programado' },
          completed: { color: 'blue', text: 'Completado' },
          cancelled: { color: 'red', text: 'Cancelado' }
        };
        const statusInfo = statusMap[status] || { color: 'gray', text: 'Desconocido' };
        return (
          <Tag color={statusInfo.color}>
            {statusInfo.text}
          </Tag>
        );
      }
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
      title: 'Última actividad',
      dataIndex: 'last_activity',
      key: 'lastActivity',
      render: (date: string) => 
        date ? new Date(date).toLocaleDateString() : 'Nunca',
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: () => (
        <Space size="middle">
          <Button 
            type="text" 
            icon={<Eye size={16} />} 
            title="Ver detalles"
          />
          <Button 
            type="text" 
            icon={<Edit size={16} />} 
            title="Editar"
            className="text-blue-500"
          />
          <Button 
            type="text" 
            danger 
            icon={<Trash2 size={16} />} 
            title="Eliminar"
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
                <Button>Filtrar</Button>
                <Button>Exportar</Button>
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
    </div>
  );
};

export default ToursPage;
