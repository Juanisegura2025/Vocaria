import { Button, Card, Table, Tag, Space, Input, Row, Col } from 'antd';
import { Plus, Search, Home, Edit, Trash2, Eye } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '../../api/client';

const { Search: SearchInput } = Input;

const ToursPage = () => {
  const [searchText, setSearchText] = useState('');
  
  // Fetch tours data
  const { data: tours = [], isLoading } = useQuery({
    queryKey: ['tours'],
    queryFn: () => fetchApi('/api/tours'),
  });

  const columns = [
    {
      title: 'Nombre del Tour',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: any) => (
        <div className="flex items-center">
          <div className="bg-blue-100 p-2 rounded-lg mr-3">
            <Home className="text-blue-600" size={16} />
          </div>
          <div>
            <div className="font-medium">{text}</div>
            <div className="text-xs text-gray-500">ID: {record.id}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Modelo Matterport',
      dataIndex: 'matterport_model_id',
      key: 'matterportModelId',
      render: (text: string) => (
        <Tag color="blue" className="font-mono">
          {text || 'No asignado'}
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
      render: (_: any, record: any) => (
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

  const filteredTours = tours.filter((tour: any) =>
    tour.name.toLowerCase().includes(searchText.toLowerCase()) ||
    tour.matterport_model_id?.toLowerCase().includes(searchText.toLowerCase())
  );

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
                onChange={(e) => setSearchText(e.target.value)}
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

        <Table
          columns={columns}
          dataSource={filteredTours}
          rowKey="id"
          loading={isLoading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} tours`,
          }}
        />
      </Card>
    </div>
  );
};

export default ToursPage;
