import { Modal, Descriptions, Tag, Space, Button, Divider, Card } from 'antd';
import { Home, Calendar, User, Settings, ExternalLink } from 'lucide-react';
import type { Tour } from '../../services/toursService';

interface ViewTourModalProps {
  visible: boolean;
  tour: Tour | null;
  onClose: () => void;
}

const ViewTourModal: React.FC<ViewTourModalProps> = ({ visible, tour, onClose }) => {
  if (!tour) return null;

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('es-AR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Fecha inválida';
    }
  };

  const getMatterportUrl = (modelId: string) => {
    return `https://my.matterport.com/show/?m=${modelId}`;
  };

  return (
    <Modal
      title={
        <div className="flex items-center">
          <div className="bg-blue-100 p-2 rounded-lg mr-3">
            <Home className="text-blue-600" size={20} />
          </div>
          <div>
            <div className="text-lg font-semibold">{tour.name}</div>
            <div className="text-sm text-gray-500">Detalles del Tour</div>
          </div>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          Cerrar
        </Button>,
        <Button
          key="matterport"
          type="primary"
          icon={<ExternalLink size={16} />}
          onClick={() => window.open(getMatterportUrl(tour.matterport_model_id), '_blank')}
          disabled={!tour.matterport_model_id}
        >
          Ver en Matterport
        </Button>
      ]}
      width={800}
      className="view-tour-modal"
    >
      <div className="space-y-6">
        {/* Basic Information */}
        <Card title="Información Básica" size="small">
          <Descriptions column={2} size="small">
            <Descriptions.Item label="ID" span={1}>
              <Tag color="blue">{tour.id}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Estado" span={1}>
              <Tag color={tour.is_active ? 'green' : 'red'}>
                {tour.is_active ? 'Activo' : 'Inactivo'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Nombre" span={2}>
              <strong>{tour.name}</strong>
            </Descriptions.Item>
            <Descriptions.Item label="Modelo Matterport" span={2}>
              <Space>
                <Tag color="blue" className="font-mono">
                  {tour.matterport_model_id}
                </Tag>
                {tour.matterport_model_id && (
                  <Button
                    type="link"
                    size="small"
                    icon={<ExternalLink size={14} />}
                    onClick={() => window.open(getMatterportUrl(tour.matterport_model_id), '_blank')}
                  >
                    Abrir Tour
                  </Button>
                )}
              </Space>
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* Agent Configuration */}
        <Card title="Configuración del Agente" size="small">
          <Descriptions column={1} size="small">
            <Descriptions.Item label="Objetivo del Agente">
              {tour.agent_objective || 'No especificado'}
            </Descriptions.Item>
            <Descriptions.Item label="Agent ID">
              <Tag color="purple">{tour.agent_id || 'No asignado'}</Tag>
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* Dates and Activity */}
        <Card title="Fechas y Actividad" size="small">
          <Descriptions column={2} size="small">
            <Descriptions.Item label="Fecha de Creación" span={1}>
              <Space>
                <Calendar size={16} className="text-gray-500" />
                {formatDate(tour.created_at)}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="Última Actualización" span={1}>
              <Space>
                <Settings size={16} className="text-gray-500" />
                {formatDate(tour.updated_at)}
              </Space>
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* Room Data (if available) */}
        {tour.room_data && Array.isArray(tour.room_data) && tour.room_data.length > 0 && (
          <Card title="Datos de Habitaciones" size="small">
            <div className="space-y-2">
              {tour.room_data.map((room: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="font-medium">{room.name || `Habitación ${index + 1}`}</span>
                  <span className="text-sm text-gray-500">
                    {room.area_m2 ? `${room.area_m2} m²` : 'Área no especificada'}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Statistics */}
        <Card title="Estadísticas" size="small">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{tour.leads_count || 0}</div>
              <div className="text-sm text-gray-600">Leads Capturados</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {tour.is_active ? 'Activo' : 'Inactivo'}
              </div>
              <div className="text-sm text-gray-600">Estado Actual</div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {tour.agent_id ? 'Sí' : 'No'}
              </div>
              <div className="text-sm text-gray-600">Agente Asignado</div>
            </div>
          </div>
        </Card>
      </div>
    </Modal>
  );
};

export default ViewTourModal;