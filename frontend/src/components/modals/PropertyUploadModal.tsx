import React, { useState } from 'react';
import {
  Modal,
  Upload,
  Button,
  Form,
  Input,
  InputNumber,
  Select,
  Card,
  Alert,
  Space,
  Divider,
  message
} from 'antd';
import {
  Upload as UploadIcon,
  FileText,
  Home,
  MapPin,
  Building,
  CheckCircle
} from 'lucide-react';
import type { UploadFile, UploadChangeParam } from 'antd/es/upload/interface';
import { toursService } from '../../services/toursService';

const { TextArea } = Input;
const { Option } = Select;
const { Dragger } = Upload;

interface PropertyUploadModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  tourId?: number;
  tourName?: string;
}

interface PropertyFormData {
  property_name: string;
  description?: string;
  address_line1: string;
  city: string;
  state?: string;
  country: string;
  total_area: number;
  bedrooms: number;
  bathrooms: number;
  price?: number;
  currency?: string;
  property_type: string;
  amenities?: string;
  year_built?: number;
  parking_spaces?: number;
  rooms_detail?: string;
}

const PropertyUploadModal: React.FC<PropertyUploadModalProps> = ({
  visible,
  onClose,
  onSuccess,
  tourId,
  tourName
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploadMode, setUploadMode] = useState<'manual' | 'file'>('manual');

  const handleSubmit = async (values: PropertyFormData) => {
    if (!tourId) {
      message.error('No tour selected');
      return;
    }
    
    try {
      setLoading(true);
      
      // Upload property data
      await toursService.uploadPropertyData(tourId, {
        property_name: values.property_name,
        description: values.description,
        address_line1: values.address_line1,
        city: values.city,
        state: values.state,
        country: values.country,
        total_area: values.total_area,
        bedrooms: values.bedrooms,
        bathrooms: values.bathrooms,
        price: values.price,
        currency: values.currency,
        property_type: values.property_type,
        amenities: values.amenities,
        year_built: values.year_built,
        parking_spaces: values.parking_spaces,
        rooms_detail: values.rooms_detail
      });
      
      // Upload files if any
      if (fileList.length > 0) {
        const files = fileList.map(f => f.originFileObj as File).filter(Boolean);
        if (files.length > 0) {
          await toursService.uploadPropertyFiles(tourId, files);
        }
      }
      
      message.success('Property information uploaded successfully!');
      form.resetFields();
      setFileList([]);
      onSuccess();
      onClose();
      
    } catch (error) {
      console.error('Error uploading property data:', error);
      message.error('Failed to upload property information');
    } finally {
      setLoading(false);
    }
  };

  const uploadProps = {
    multiple: true,
    fileList,
    onChange: (info: UploadChangeParam<UploadFile>) => setFileList(info.fileList),
    beforeUpload: (file: File) => {
      const isValidType = file.type === 'application/pdf' || 
                         file.type.includes('image/') ||
                         file.type.includes('document');
      if (!isValidType) {
        message.error('You can only upload PDF, images or documents!');
        return false;
      }
      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        message.error('File must be smaller than 10MB!');
        return false;
      }
      return false; // Prevent auto upload
    }
  };

  return (
    <Modal
      title={
        <div>
          <h3>Upload Property Information</h3>
          {tourName && (
            <p className="text-sm font-normal text-gray-600 mt-1">
              For tour: {tourName}
            </p>
          )}
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
    >
      <Alert
        message="Manual Property Data"
        description="Since Matterport data couldn't be imported automatically, you can manually enter property information or upload property documents."
        type="info"
        showIcon
        className="mb-4"
      />

      <div className="mb-4">
        <Space>
          <Button
            type={uploadMode === 'manual' ? 'primary' : 'default'}
            onClick={() => setUploadMode('manual')}
            icon={<FileText size={16} />}
          >
            Manual Entry
          </Button>
          <Button
            type={uploadMode === 'file' ? 'primary' : 'default'}
            onClick={() => setUploadMode('file')}
            icon={<UploadIcon size={16} />}
          >
            Upload Documents
          </Button>
        </Space>
      </div>

      {uploadMode === 'file' ? (
        <div className="space-y-4">
          <Dragger {...uploadProps} className="mb-4">
            <p className="ant-upload-drag-icon">
              <UploadIcon size={48} className="text-gray-400 mx-auto" />
            </p>
            <p className="ant-upload-text">Click or drag files to upload</p>
            <p className="ant-upload-hint">
              Support for PDF, images, or documents. Max 10MB per file.
              Property brochures, floor plans, or listing documents.
            </p>
          </Dragger>

          {fileList.length > 0 && (
            <Card size="small">
              <div className="text-sm text-gray-600">
                <CheckCircle size={16} className="inline mr-2 text-green-500" />
                {fileList.length} file(s) ready to upload
              </div>
            </Card>
          )}

          <Divider />

          <div className="flex justify-end space-x-3">
            <Button onClick={onClose}>Cancel</Button>
            <Button
              type="primary"
              loading={loading}
              disabled={fileList.length === 0}
              onClick={async () => {
                if (!tourId) {
                  message.error('No tour selected');
                  return;
                }
                
                try {
                  setLoading(true);
                  const files = fileList.map(f => f.originFileObj as File).filter(Boolean);
                  await toursService.uploadPropertyFiles(tourId, files);
                  message.success('Files uploaded successfully!');
                  setFileList([]);
                  onSuccess();
                  onClose();
                } catch (error) {
                  message.error('Failed to upload files');
                } finally {
                  setLoading(false);
                }
              }}
            >
              Upload Files
            </Button>
          </div>
        </div>
      ) : (
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            country: 'Argentina',
            currency: 'USD',
            property_type: 'apartment'
          }}
        >
          {/* Basic Information */}
          <Card 
            title={
              <Space>
                <Home size={16} className="text-blue-500" />
                Basic Information
              </Space>
            }
            size="small"
            className="mb-4"
          >
            <Form.Item
              label="Property Name"
              name="property_name"
              rules={[{ required: true, message: 'Please enter property name' }]}
            >
              <Input placeholder="e.g., Luxury 2BR Apartment in Palermo" />
            </Form.Item>

            <Form.Item
              label="Description"
              name="description"
            >
              <TextArea 
                rows={3} 
                placeholder="Brief description of the property..."
              />
            </Form.Item>

            <Form.Item
              label="Property Type"
              name="property_type"
              rules={[{ required: true }]}
            >
              <Select>
                <Option value="apartment">Apartment</Option>
                <Option value="house">House</Option>
                <Option value="condo">Condo</Option>
                <Option value="townhouse">Townhouse</Option>
                <Option value="commercial">Commercial</Option>
                <Option value="land">Land</Option>
              </Select>
            </Form.Item>
          </Card>

          {/* Location */}
          <Card 
            title={
              <Space>
                <MapPin size={16} className="text-green-500" />
                Location
              </Space>
            }
            size="small"
            className="mb-4"
          >
            <Form.Item
              label="Address"
              name="address_line1"
              rules={[{ required: true, message: 'Please enter address' }]}
            >
              <Input placeholder="Street address" />
            </Form.Item>

            <div className="grid grid-cols-3 gap-4">
              <Form.Item
                label="City"
                name="city"
                rules={[{ required: true }]}
              >
                <Input placeholder="Buenos Aires" />
              </Form.Item>

              <Form.Item
                label="State/Province"
                name="state"
              >
                <Input placeholder="CABA" />
              </Form.Item>

              <Form.Item
                label="Country"
                name="country"
                rules={[{ required: true }]}
              >
                <Input placeholder="Argentina" />
              </Form.Item>
            </div>
          </Card>

          {/* Property Details */}
          <Card 
            title={
              <Space>
                <Building size={16} className="text-purple-500" />
                Property Details
              </Space>
            }
            size="small"
            className="mb-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <Form.Item
                label="Total Area (m²)"
                name="total_area"
                rules={[{ required: true, message: 'Please enter total area' }]}
              >
                <InputNumber 
                  min={1} 
                  placeholder="85"
                  style={{ width: '100%' }}
                />
              </Form.Item>

              <Form.Item
                label="Year Built"
                name="year_built"
              >
                <InputNumber 
                  min={1900} 
                  max={new Date().getFullYear()}
                  placeholder="2020"
                  style={{ width: '100%' }}
                />
              </Form.Item>

              <Form.Item
                label="Bedrooms"
                name="bedrooms"
                rules={[{ required: true }]}
              >
                <InputNumber 
                  min={0} 
                  placeholder="2"
                  style={{ width: '100%' }}
                />
              </Form.Item>

              <Form.Item
                label="Bathrooms"
                name="bathrooms"
                rules={[{ required: true }]}
              >
                <InputNumber 
                  min={0} 
                  step={0.5}
                  placeholder="1.5"
                  style={{ width: '100%' }}
                />
              </Form.Item>

              <Form.Item
                label="Parking Spaces"
                name="parking_spaces"
              >
                <InputNumber 
                  min={0} 
                  placeholder="1"
                  style={{ width: '100%' }}
                />
              </Form.Item>

              <Form.Item
                label="Price"
                name="price"
              >
                <InputNumber 
                  min={0} 
                  placeholder="250000"
                  style={{ width: '100%' }}
                  addonBefore={
                    <Form.Item name="currency" noStyle>
                      <Select style={{ width: 70 }}>
                        <Option value="USD">USD</Option>
                        <Option value="ARS">ARS</Option>
                        <Option value="EUR">EUR</Option>
                      </Select>
                    </Form.Item>
                  }
                />
              </Form.Item>
            </div>

            <Form.Item
              label="Rooms Detail"
              name="rooms_detail"
              extra="List all rooms and their approximate sizes"
            >
              <TextArea 
                rows={2}
                placeholder="e.g., Living Room (25m²), Master Bedroom (18m²), Kitchen (12m²)..."
              />
            </Form.Item>

            <Form.Item
              label="Amenities"
              name="amenities"
            >
              <TextArea 
                rows={2}
                placeholder="e.g., Pool, Gym, 24/7 Security, Balcony, Storage..."
              />
            </Form.Item>
          </Card>

          <Divider />

          <div className="flex justify-end space-x-3">
            <Button onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              icon={<CheckCircle size={16} />}
            >
              Save Property Information
            </Button>
          </div>
        </Form>
      )}
    </Modal>
  );
};

export default PropertyUploadModal;