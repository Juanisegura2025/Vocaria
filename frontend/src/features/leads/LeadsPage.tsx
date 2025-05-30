import { Button, Card, Table, Tag, Space, Input, Row, Col, Avatar, Badge } from 'antd';
import { Plus, Search, User, Mail, Phone, Home, Calendar, Filter, Download } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '../../api/client';

const { Search: SearchInput } = Input;

const LeadsPage = () => {
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  
  // Fetch leads data
  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['leads'],
    queryFn: () => fetchApi('/api/leads'),
  });

  const getRandomAvatarColor = (name: string) => {
    const colors = ['#1890ff', '#52c41a', '#722ed1', '#fa8c16', '#f5222d'];
    const charCode = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[charCode % colors.length];
  };

  const columns = [
    {
      title: 'Lead',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: any) => (
        <div className="flex items-center">
          <Avatar 
            style={{ backgroundColor: getRandomAvatarColor(text) }}
            className="mr-3"
          >
            {text.charAt(0).toUpperCase()}
          </Avatar>
          <div>
            <div className="font-medium">{text}</div>
            <div className="text-xs text-gray-500">{record.email}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Contacto',
      key: 'contact',
      render: (record: any) => (
        <div className="space-y-1">
          <div className="flex items-center text-sm">
            <Mail size={14} className="mr-1 text-gray-500" />
            <a href={`mailto:${record.email}`} className="hover:text-blue-500">
              {record.email}
            </a>
          </div>
          {record.phone && (
            <div className="flex items-center text-sm">
              <Phone size={14} className="mr-1 text-gray-500" />
              <a href={`tel:${record.phone}`} className="hover:text-blue-500">
                {record.phone}
              </a>
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Tour',
      dataIndex: 'tour',
      key: 'tour',
      render: (tour: any) => (
        <div className="flex items-center">
          <Home size={14} className="mr-1 text-gray-500" />
          {tour?.name || 'No especificado'}
        </div>
      ),
    },
    {
      title: 'Estado',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusMap: Record<string, { color: string; text: string }> = {
          new: { color: 'blue', text: 'Nuevo' },
          contacted: { color: 'geekblue', text: 'Contactado' },
          qualified: { color: 'green', text: 'Calificado' },
          unqualified: { color: 'red', text: 'No calificado' },
        };
        const statusInfo = statusMap[status] || { color: 'default', text: status };
        return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
      },
      filters: [
        { text: 'Nuevo', value: 'new' },
        { text: 'Contactado', value: 'contacted' },
        { text: 'Calificado', value: 'qualified' },
        { text: 'No calificado', value: 'unqualified' },
      ],
      filteredValue: statusFilter ? [statusFilter] : null,
      onFilter: (value: any, record: any) => record.status === value,
    },
    {
      title: 'Fecha',
      dataIndex: 'created_at',
      key: 'date',
      render: (date: string) => (
        <div className="flex items-center text-sm">
          <Calendar size={14} className="mr-1 text-gray-500" />
          {new Date(date).toLocaleDateString()}
        </div>
      ),
      sorter: (a: any, b: any) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space size="middle">
          <Button 
            type="link" 
            size="small"
            className="text-blue-500 p-0"
          >
            Ver Detalles
          </Button>
          <Button 
            type="text" 
            size="small" 
            icon={<Mail size={16} />} 
            title="Enviar Email"
          />
        </Space>
      ),
    },
  ];

  const filteredLeads = leads.filter((lead: any) =>
    lead.name.toLowerCase().includes(searchText.toLowerCase()) ||
    lead.email.toLowerCase().includes(searchText.toLowerCase()) ||
    (lead.phone && lead.phone.includes(searchText))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-semibold text-gray-800">Gestión de Leads</h1>
        <Space>
          <Button 
            icon={<Download size={16} />}
            className="flex items-center"
          >
            Exportar
          </Button>
          <Button 
            type="primary" 
            icon={<Plus size={16} />}
            className="flex items-center"
          >
            Agregar Lead
          </Button>
        </Space>
      </div>

      <Card>
        <div className="mb-6">
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} md={12} lg={8}>
              <SearchInput
                placeholder="Buscar leads..."
                prefix={<Search size={16} className="text-gray-400" />}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
                className="w-full"
              />
            </Col>
            <Col xs={24} md={12} lg={16} className="text-right">
              <Space>
                <Button icon={<Filter size={16} />}>
                  Filtros
                </Button>
                <Button onClick={() => setStatusFilter(null)}>
                  Limpiar Filtros
                </Button>
              </Space>
            </Col>
          </Row>
        </div>

        <Table
          columns={columns}
          dataSource={filteredLeads}
          rowKey="id"
          loading={isLoading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} leads`,
          }}
        />
      </Card>
    </div>
  );
};

export default LeadsPage;
