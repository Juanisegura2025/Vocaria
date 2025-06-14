import React, { useState } from 'react';
import {
  Modal,
  Form,
  Input,
  Button,
  Alert,
  Spin,
  Card,
  Descriptions,
  Tag,
  Space,
  Divider,
  Tooltip
} from 'antd';
import { 
  Home, 
  MapPin, 
  Ruler, 
  CheckCircle, 
  AlertTriangle, 
  Info,
  Building,
  Globe
} from 'lucide-react';
import { toursService, CreateTourData } from '../../services/toursService';

interface CreateTourModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface PropertyPreview {
  matterport_name?: string;
  matterport_description?: string;
  address_line1?: string;
  city?: string;
  state?: string;
  country?: string;
  total_area_floor?: number;
  total_area_floor_indoor?: number;
  dimension_units?: string;
  rooms_count?: number;
  rooms_summary?: string;
}

interface TourCreationResponse {
  id: number;
  name: string;
  matterport_model_id: string;
  matterport_data_imported: boolean;
  property_data?: PropertyPreview;
  import_status?: string;
}

const CreateTourModal: React.FC<CreateTourModalProps> = ({
  visible,
  onClose,
  onSuccess
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [importPreview, setImportPreview] = useState<PropertyPreview | null>(null);
  const [importStatus, setImportStatus] = useState<string | undefined>(undefined);
  const [createdTour, setCreatedTour] = useState<TourCreationResponse | null>(null);
  const [step, setStep] = useState<'form' | 'creating' | 'success'>('form');

  const resetModal = () => {
    form.resetFields();
    setImportPreview(null);
    setImportStatus(undefined);
    setCreatedTour(null);
    setStep('form');
    setLoading(false);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const handleSuccess = () => {
    resetModal();
    onSuccess();
  };

  const handleSubmit = async (values: CreateTourData) => {
    try {
      setLoading(true);
      setStep('creating');
      
      console.log('Creating tour with values:', values);
      
      const response = await toursService.createTour(values) as TourCreationResponse;
      
      console.log('Tour creation response:', response);
      
      setCreatedTour(response);
      setImportPreview(response.property_data || null);
      setImportStatus(response.import_status);
      setStep('success');
      
    } catch (error) {
      console.error('Error creating tour:', error);
      setStep('form');
      // Error will be shown in UI
    } finally {
      setLoading(false);
    }
  };

  const formatArea = (area?: number, units: string = 'metric') => {
    if (!area) return 'N/A';
    const unit = units === 'metric' ? 'm²' : 'ft²';
    return `${area.toFixed(1)} ${unit}`;
  };

  const getImportStatusInfo = (status?: string) => {
    switch (status) {
      case 'success':
        return {
          icon: <CheckCircle size={16} className="text-green-500" />,
          text: 'Data imported successfully',
          type: 'success' as const
        };
      case 'partial':
        return {
          icon: <AlertTriangle size={16} className="text-yellow-500" />,
          text: 'Partial import (some data unavailable)',
          type: 'warning' as const
        };
      case 'failed':
        return {
          icon: <AlertTriangle size={16} className="text-red-500" />,
          text: 'Import error - tour created without automatic data',
          type: 'error' as const
        };
      case 'not_configured':
        return {
          icon: <Info size={16} className="text-blue-500" />,
          text: 'Matterport API not configured',
          type: 'info' as const
        };
      default:
        return {
          icon: <Info size={16} className="text-gray-500" />,
          text: 'Unknown import status',
          type: 'info' as const
        };
    }
  };

  // Render: Creating Step
  if (step === 'creating') {
    return (
      <Modal
        title="Creating Tour"
        open={visible}
        onCancel={handleClose}
        footer={null}
        closable={false}
        width={600}
      >
        <div className="text-center py-8">
          <Spin size="large" />
          <div className="mt-4 space-y-2">
            <h3 className="text-lg font-medium">Creating your tour...</h3>
            <p className="text-gray-600">Connecting to Matterport to import data automatically</p>
            <div className="flex justify-center space-x-4 mt-6">
              <div className="flex items-center text-blue-600">
                <Home size={16} className="mr-2" />
                <span>Basic information</span>
              </div>
              <div className="flex items-center text-blue-600">
                <MapPin size={16} className="mr-2" />
                <span>Address</span>
              </div>
              <div className="flex items-center text-blue-600">
                <Ruler size={16} className="mr-2" />
                <span>Dimensions</span>
              </div>
              <div className="flex items-center text-blue-600">
                <Building size={16} className="mr-2" />
                <span>Rooms</span>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    );
  }

  // Render: Success Step
  if (step === 'success' && createdTour) {
    const statusInfo = getImportStatusInfo(importStatus);

    return (
      <Modal
        title="Tour Created Successfully!"
        open={visible}
        onCancel={handleClose}
        width={800}
        footer={
          <div className="flex justify-between">
            <Button onClick={handleClose}>
              Close
            </Button>
            <Space>
              <Button onClick={handleClose}>
                Create Another Tour
              </Button>
              <Button type="primary" onClick={handleSuccess}>
                View My Tours
              </Button>
            </Space>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Import status */}
          <Alert
            icon={statusInfo.icon}
            message={statusInfo.text}
            type={statusInfo.type}
            showIcon
          />

          {/* Created tour information */}
          <Card title="Tour Information">
            <Descriptions column={2}>
              <Descriptions.Item label="Name">
                {createdTour.name}
              </Descriptions.Item>
              <Descriptions.Item label="Model ID">
                <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                  {createdTour.matterport_model_id}
                </code>
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color="green">Active</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Data Imported">
                <Tag color={createdTour.matterport_data_imported ? "green" : "orange"}>
                  {createdTour.matterport_data_imported ? "Yes" : "No"}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* Imported data preview */}
          {importPreview && (
            <Card 
              title={
                <div className="flex items-center">
                  <Globe size={16} className="mr-2 text-blue-500" />
                  Data Imported from Matterport
                </div>
              }
            >
              <div className="space-y-4">
                {/* Basic information */}
                {(importPreview.matterport_name || importPreview.matterport_description) && (
                  <div>
                    <h4 className="font-medium mb-2 flex items-center">
                      <Home size={14} className="mr-2 text-green-500" />
                      Basic Information
                    </h4>
                    <Descriptions column={1}>
                      {importPreview.matterport_name && (
                        <Descriptions.Item label="Matterport Name">
                          {importPreview.matterport_name}
                        </Descriptions.Item>
                      )}
                      {importPreview.matterport_description && (
                        <Descriptions.Item label="Description">
                          {importPreview.matterport_description}
                        </Descriptions.Item>
                      )}
                    </Descriptions>
                  </div>
                )}

                {/* Address */}
                {(importPreview.address_line1 || importPreview.city) && (
                  <div>
                    <h4 className="font-medium mb-2 flex items-center">
                      <MapPin size={14} className="mr-2 text-blue-500" />
                      Location
                    </h4>
                    <Descriptions column={1}>
                      {importPreview.address_line1 && (
                        <Descriptions.Item label="Address">
                          {importPreview.address_line1}
                        </Descriptions.Item>
                      )}
                      {importPreview.city && (
                        <Descriptions.Item label="City">
                          {importPreview.city}, {importPreview.state} {importPreview.country}
                        </Descriptions.Item>
                      )}
                    </Descriptions>
                  </div>
                )}

                {/* Dimensions */}
                {(importPreview.total_area_floor || importPreview.total_area_floor_indoor) && (
                  <div>
                    <h4 className="font-medium mb-2 flex items-center">
                      <Ruler size={14} className="mr-2 text-purple-500" />
                      Dimensions
                    </h4>
                    <Descriptions column={2}>
                      {importPreview.total_area_floor && (
                        <Descriptions.Item label="Total Area">
                          {formatArea(importPreview.total_area_floor, importPreview.dimension_units)}
                        </Descriptions.Item>
                      )}
                      {importPreview.total_area_floor_indoor && (
                        <Descriptions.Item label="Indoor Area">
                          {formatArea(importPreview.total_area_floor_indoor, importPreview.dimension_units)}
                        </Descriptions.Item>
                      )}
                    </Descriptions>
                  </div>
                )}

                {/* Rooms */}
                {importPreview.rooms_count && importPreview.rooms_count > 0 && (
                  <div>
                    <h4 className="font-medium mb-2 flex items-center">
                      <Building size={14} className="mr-2 text-orange-500" />
                      Detected Rooms
                    </h4>
                    <div className="flex items-center space-x-4">
                      <Tag color="blue">{importPreview.rooms_count} rooms</Tag>
                      {importPreview.rooms_summary && (
                        <Tooltip title={importPreview.rooms_summary}>
                          <span className="text-sm text-gray-600 truncate max-w-xs">
                            {importPreview.rooms_summary}
                          </span>
                        </Tooltip>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Next steps */}
          <Card title="Next Steps">
            <div className="space-y-2 text-sm">
              <div className="flex items-center">
                <CheckCircle size={14} className="mr-2 text-green-500" />
                <span>Your virtual agent Jorge now has access to all this information</span>
              </div>
              <div className="flex items-center">
                <CheckCircle size={14} className="mr-2 text-green-500" />
                <span>Can answer questions about dimensions and features</span>
              </div>
              <div className="flex items-center">
                <CheckCircle size={14} className="mr-2 text-green-500" />
                <span>Ready to capture leads automatically</span>
              </div>
            </div>
          </Card>
        </div>
      </Modal>
    );
  }

  // Render: Form Step
  return (
    <Modal
      title="Create New Tour"
      open={visible}
      onCancel={handleClose}
      footer={null}
      width={600}
    >
      <Alert
        message="Automatic Import"
        description="We'll automatically connect to Matterport to import property information, dimensions, and rooms."
        type="info"
        showIcon
        className="mb-6"
      />

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        disabled={loading}
      >
        <Form.Item
          label="Tour Name"
          name="name"
          rules={[
            { required: true, message: 'Please enter a tour name' },
            { min: 3, message: 'Name must be at least 3 characters' },
            { max: 100, message: 'Name cannot exceed 100 characters' }
          ]}
        >
          <Input 
            placeholder="e.g: CABA Apartment - 2 Bedrooms"
            prefix={<Home size={16} className="text-gray-400" />}
          />
        </Form.Item>

        <Form.Item
          label="Matterport Model ID"
          name="matterport_model_id"
          rules={[
            { required: true, message: 'Please enter the Matterport model ID' },
            { 
              pattern: /^[a-zA-Z0-9_-]+$/, 
              message: 'ID must contain only letters, numbers, hyphens and underscores' 
            }
          ]}
          extra="You can find this ID in your Matterport tour URL"
        >
          <Input 
            placeholder="e.g: SxQL3iGyoDo"
            style={{ fontFamily: 'monospace' }}
          />
        </Form.Item>

        <Form.Item
          label="Agent Objective"
          name="agent_objective"
          rules={[
            { max: 200, message: 'Objective cannot exceed 200 characters' }
          ]}
          extra="Define what your virtual agent should achieve with visitors"
        >
          <Input.TextArea 
            placeholder="Schedule an in-person visit with the real estate agent"
            rows={3}
            defaultValue="Schedule a visit"
          />
        </Form.Item>

        <Divider />

        <div className="flex justify-end space-x-3">
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            className="flex items-center"
          >
            {loading ? 'Creating...' : 'Create Tour'}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default CreateTourModal;