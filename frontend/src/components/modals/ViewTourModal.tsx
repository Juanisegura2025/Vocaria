import { Modal, Descriptions, Tag, Space, Button, Card } from 'antd';
import { Home, Calendar, Settings, ExternalLink } from 'lucide-react';
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
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid date';
    }
  };

  const getMatterportUrl = (modelId: string) => {
    return `https://my.matterport.com/show/?m=${modelId}`;
  };

  // ✅ FIXED: Handle undefined matterport_model_id safely
  const hasMatterportModel = tour.matterport_model_id && tour.matterport_model_id.trim() !== '';

  return (
    <Modal
      title={
        <div className="flex items-center">
          <div className="bg-blue-100 p-2 rounded-lg mr-3">
            <Home className="text-blue-600" size={20} />
          </div>
          <div>
            <div className="text-lg font-semibold">{tour.name}</div>
            <div className="text-sm text-gray-500">Tour Details</div>
          </div>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          Close
        </Button>,
        <Button
          key="matterport"
          type="primary"
          icon={<ExternalLink size={16} />}
          onClick={() => hasMatterportModel && window.open(getMatterportUrl(tour.matterport_model_id), '_blank')}
          disabled={!hasMatterportModel}
        >
          View in Matterport
        </Button>
      ]}
      width={800}
      className="view-tour-modal"
    >
      <div className="space-y-6">
        {/* Basic Information */}
        <Card title="Basic Information" size="small">
          <Descriptions column={2} size="small">
            <Descriptions.Item label="ID" span={1}>
              <Tag color="blue">{tour.id}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Status" span={1}>
              <Tag color={tour.is_active ? 'green' : 'red'}>
                {tour.is_active ? 'Active' : 'Inactive'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Name" span={2}>
              <strong>{tour.name}</strong>
            </Descriptions.Item>
            <Descriptions.Item label="Matterport Model" span={2}>
              <Space>
                <Tag color="blue" className="font-mono">
                  {tour.matterport_model_id || 'Not assigned'}
                </Tag>
                {hasMatterportModel && (
                  <Button
                    type="link"
                    size="small"
                    icon={<ExternalLink size={14} />}
                    onClick={() => window.open(getMatterportUrl(tour.matterport_model_id), '_blank')}
                  >
                    Open Tour
                  </Button>
                )}
              </Space>
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* Agent Configuration */}
        <Card title="Agent Configuration" size="small">
          <Descriptions column={1} size="small">
            <Descriptions.Item label="Agent Objective">
              {tour.agent_objective || 'Not specified'}
            </Descriptions.Item>
            <Descriptions.Item label="Agent ID">
              <Tag color="purple">{tour.agent_id || 'Not assigned'}</Tag>
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* Dates and Activity */}
        <Card title="Dates and Activity" size="small">
          <Descriptions column={2} size="small">
            <Descriptions.Item label="Created Date" span={1}>
              <Space>
                <Calendar size={16} className="text-gray-500" />
                {formatDate(tour.created_at)}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="Last Updated" span={1}>
              <Space>
                <Settings size={16} className="text-gray-500" />
                {formatDate(tour.updated_at || tour.created_at)}
              </Space>
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* Room Data (if available) */}
        {tour.room_data && Array.isArray(tour.room_data) && tour.room_data.length > 0 && (
          <Card title="Room Data" size="small">
            <div className="space-y-2">
              {tour.room_data.map((room: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="font-medium">{room.name || `Room ${index + 1}`}</span>
                  <span className="text-sm text-gray-500">
                    {room.area_m2 ? `${room.area_m2} m²` : 'Area not specified'}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Statistics */}
        <Card title="Statistics" size="small">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{tour.leads_count || 0}</div>
              <div className="text-sm text-gray-600">Leads Captured</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {tour.is_active ? 'Active' : 'Inactive'}
              </div>
              <div className="text-sm text-gray-600">Current Status</div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {tour.agent_id ? 'Yes' : 'No'}
              </div>
              <div className="text-sm text-gray-600">Agent Assigned</div>
            </div>
          </div>
        </Card>
      </div>
    </Modal>
  );
};

export default ViewTourModal;