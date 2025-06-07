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
      // El error se mostrará en la UI
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
          text: 'Datos importados exitosamente',
          type: 'success' as const
        };
      case 'partial':
        return {
          icon: <AlertTriangle size={16} className="text-yellow-500" />,
          text: 'Importación parcial (algunos datos no disponibles)',
          type: 'warning' as const
        };
      case 'failed':
        return {
          icon: <AlertTriangle size={16} className="text-red-500" />,
          text: 'Error en la importación - tour creado sin datos automáticos',
          type: 'error' as const
        };
      case 'not_configured':
        return {
          icon: <Info size={16} className="text-blue-500" />,
          text: 'API de Matterport no configurada',
          type: 'info' as const
        };
      default:
        return {
          icon: <Info size={16} className="text-gray-500" />,
          text: 'Estado de importación desconocido',
          type: 'info' as const
        };
    }
  };

  // Render: Creating Step
  if (step === 'creating') {
    return (
      <Modal
        title="Creando Tour"
        open={visible}
        onCancel={handleClose}
        footer={null}
        closable={false}
        width={600}
      >
        <div className="text-center py-8">
          <Spin size="large" />
          <div className="mt-4 space-y-2">
            <h3 className="text-lg font-medium">Creando tu tour...</h3>
            <p className="text-gray-600">Conectando con Matterport para importar datos automáticamente</p>
            <div className="flex justify-center space-x-4 mt-6">
              <div className="flex items-center text-blue-600">
                <Home size={16} className="mr-2" />
                <span>Información básica</span>
              </div>
              <div className="flex items-center text-blue-600">
                <MapPin size={16} className="mr-2" />
                <span>Dirección</span>
              </div>
              <div className="flex items-center text-blue-600">
                <Ruler size={16} className="mr-2" />
                <span>Dimensiones</span>
              </div>
              <div className="flex items-center text-blue-600">
                <Building size={16} className="mr-2" />
                <span>Habitaciones</span>
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
        title="¡Tour Creado Exitosamente!"
        open={visible}
        onCancel={handleClose}
        width={800}
        footer={
          <div className="flex justify-between">
            <Button onClick={handleClose}>
              Cerrar
            </Button>
            <Space>
              <Button onClick={handleClose}>
                Crear Otro Tour
              </Button>
              <Button type="primary" onClick={handleSuccess}>
                Ver Mis Tours
              </Button>
            </Space>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Status de importación */}
          <Alert
            icon={statusInfo.icon}
            message={statusInfo.text}
            type={statusInfo.type}
            showIcon
          />

          {/* Información del tour creado */}
          <Card title="Información del Tour">
            <Descriptions column={2}>
              <Descriptions.Item label="Nombre">
                {createdTour.name}
              </Descriptions.Item>
              <Descriptions.Item label="Modelo ID">
                <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                  {createdTour.matterport_model_id}
                </code>
              </Descriptions.Item>
              <Descriptions.Item label="Estado">
                <Tag color="green">Activo</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Datos Importados">
                <Tag color={createdTour.matterport_data_imported ? "green" : "orange"}>
                  {createdTour.matterport_data_imported ? "Sí" : "No"}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* Preview de datos importados */}
          {importPreview && (
            <Card 
              title={
                <div className="flex items-center">
                  <Globe size={16} className="mr-2 text-blue-500" />
                  Datos Importados de Matterport
                </div>
              }
            >
              <div className="space-y-4">
                {/* Información básica */}
                {(importPreview.matterport_name || importPreview.matterport_description) && (
                  <div>
                    <h4 className="font-medium mb-2 flex items-center">
                      <Home size={14} className="mr-2 text-green-500" />
                      Información Básica
                    </h4>
                    <Descriptions column={1}>
                      {importPreview.matterport_name && (
                        <Descriptions.Item label="Nombre en Matterport">
                          {importPreview.matterport_name}
                        </Descriptions.Item>
                      )}
                      {importPreview.matterport_description && (
                        <Descriptions.Item label="Descripción">
                          {importPreview.matterport_description}
                        </Descriptions.Item>
                      )}
                    </Descriptions>
                  </div>
                )}

                {/* Dirección */}
                {(importPreview.address_line1 || importPreview.city) && (
                  <div>
                    <h4 className="font-medium mb-2 flex items-center">
                      <MapPin size={14} className="mr-2 text-blue-500" />
                      Ubicación
                    </h4>
                    <Descriptions column={1}>
                      {importPreview.address_line1 && (
                        <Descriptions.Item label="Dirección">
                          {importPreview.address_line1}
                        </Descriptions.Item>
                      )}
                      {importPreview.city && (
                        <Descriptions.Item label="Ciudad">
                          {importPreview.city}, {importPreview.state} {importPreview.country}
                        </Descriptions.Item>
                      )}
                    </Descriptions>
                  </div>
                )}

                {/* Dimensiones */}
                {(importPreview.total_area_floor || importPreview.total_area_floor_indoor) && (
                  <div>
                    <h4 className="font-medium mb-2 flex items-center">
                      <Ruler size={14} className="mr-2 text-purple-500" />
                      Dimensiones
                    </h4>
                    <Descriptions column={2}>
                      {importPreview.total_area_floor && (
                        <Descriptions.Item label="Área Total">
                          {formatArea(importPreview.total_area_floor, importPreview.dimension_units)}
                        </Descriptions.Item>
                      )}
                      {importPreview.total_area_floor_indoor && (
                        <Descriptions.Item label="Área Interior">
                          {formatArea(importPreview.total_area_floor_indoor, importPreview.dimension_units)}
                        </Descriptions.Item>
                      )}
                    </Descriptions>
                  </div>
                )}

                {/* Habitaciones */}
                {importPreview.rooms_count && importPreview.rooms_count > 0 && (
                  <div>
                    <h4 className="font-medium mb-2 flex items-center">
                      <Building size={14} className="mr-2 text-orange-500" />
                      Habitaciones Detectadas
                    </h4>
                    <div className="flex items-center space-x-4">
                      <Tag color="blue">{importPreview.rooms_count} habitaciones</Tag>
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

          {/* Próximos pasos */}
          <Card title="Próximos Pasos">
            <div className="space-y-2 text-sm">
              <div className="flex items-center">
                <CheckCircle size={14} className="mr-2 text-green-500" />
                <span>Tu agente virtual Jorge ya tiene acceso a toda esta información</span>
              </div>
              <div className="flex items-center">
                <CheckCircle size={14} className="mr-2 text-green-500" />
                <span>Puede responder preguntas sobre dimensiones y características</span>
              </div>
              <div className="flex items-center">
                <CheckCircle size={14} className="mr-2 text-green-500" />
                <span>Lista para capturar leads automáticamente</span>
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
      title="Crear Nuevo Tour"
      open={visible}
      onCancel={handleClose}
      footer={null}
      width={600}
    >
      <Alert
        message="Importación Automática"
        description="Conectaremos automáticamente con Matterport para importar información de la propiedad, dimensiones y habitaciones."
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
          label="Nombre del Tour"
          name="name"
          rules={[
            { required: true, message: 'Por favor ingresa un nombre para el tour' },
            { min: 3, message: 'El nombre debe tener al menos 3 caracteres' },
            { max: 100, message: 'El nombre no puede exceder 100 caracteres' }
          ]}
        >
          <Input 
            placeholder="ej: Apartamento CABA - 2 Dormitorios"
            prefix={<Home size={16} className="text-gray-400" />}
          />
        </Form.Item>

        <Form.Item
          label="ID del Modelo Matterport"
          name="matterport_model_id"
          rules={[
            { required: true, message: 'Por favor ingresa el ID del modelo de Matterport' },
            { 
              pattern: /^[a-zA-Z0-9_-]+$/, 
              message: 'El ID debe contener solo letras, números, guiones y guiones bajos' 
            }
          ]}
          extra="Puedes encontrar este ID en la URL de tu tour de Matterport"
        >
          <Input 
            placeholder="ej: SxQL3iGyoDo"
            style={{ fontFamily: 'monospace' }}
          />
        </Form.Item>

        <Form.Item
          label="Objetivo del Agente"
          name="agent_objective"
          rules={[
            { max: 200, message: 'El objetivo no puede exceder 200 caracteres' }
          ]}
          extra="Define qué debe lograr tu agente virtual con los visitantes"
        >
          <Input.TextArea 
            placeholder="Agendar una visita presencial con el agente inmobiliario"
            rows={3}
            defaultValue="Schedule a visit"
          />
        </Form.Item>

        <Divider />

        <div className="flex justify-end space-x-3">
          <Button onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            className="flex items-center"
          >
            {loading ? 'Creando...' : 'Crear Tour'}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default CreateTourModal;