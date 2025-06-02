import { Modal, Form, Input, Switch, Button, message } from 'antd';
import { Home, Globe, Target } from 'lucide-react';
import { useState } from 'react';
import { toursService } from '../../services/toursService';

interface CreateTourModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface CreateTourForm {
  name: string;
  matterport_model_id: string;
  agent_objective: string;
  is_active: boolean;
}

const CreateTourModal: React.FC<CreateTourModalProps> = ({ visible, onClose, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: CreateTourForm) => {
    try {
      setLoading(true);
      
      const tourData = {
        name: values.name,
        matterport_model_id: values.matterport_model_id,
        agent_objective: values.agent_objective || 'Schedule a visit',
        is_active: values.is_active ?? true,
      };

      await toursService.createTour(tourData);
      
      form.resetFields();
      onSuccess();
    } catch (error) {
      console.error('Error creating tour:', error);
      message.error('Error al crear el tour. Por favor intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title={
        <div className="flex items-center">
          <div className="bg-green-100 p-2 rounded-lg mr-3">
            <Home className="text-green-600" size={20} />
          </div>
          <div>
            <div className="text-lg font-semibold">Crear Nuevo Tour</div>
            <div className="text-sm text-gray-500">Agrega un nuevo tour virtual</div>
          </div>
        </div>
      }
      open={visible}
      onCancel={handleCancel}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          Cancelar
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          onClick={() => form.submit()}
        >
          Crear Tour
        </Button>
      ]}
      width={600}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          agent_objective: 'Schedule a visit',
          is_active: true,
        }}
        className="mt-4"
      >
        <Form.Item
          name="name"
          label="Nombre del Tour"
          rules={[
            { required: true, message: 'Por favor ingresa un nombre para el tour' },
            { min: 3, message: 'El nombre debe tener al menos 3 caracteres' },
            { max: 100, message: 'El nombre no puede exceder 100 caracteres' },
          ]}
        >
          <Input
            placeholder="Ej: Departamento 2 ambientes en Palermo"
            prefix={<Home size={16} className="text-gray-400" />}
            size="large"
          />
        </Form.Item>

        <Form.Item
          name="matterport_model_id"
          label="ID del Modelo Matterport"
          rules={[
            { required: true, message: 'Por favor ingresa el ID del modelo Matterport' },
            { 
              pattern: /^[a-zA-Z0-9]+$/, 
              message: 'El ID solo puede contener letras y números' 
            },
          ]}
          extra="Puedes encontrar este ID en la URL de tu tour Matterport (ej: SxQL3iGyoDo)"
        >
          <Input
            placeholder="SxQL3iGyoDo"
            prefix={<Globe size={16} className="text-gray-400" />}
            size="large"
            className="font-mono"
          />
        </Form.Item>

        <Form.Item
          name="agent_objective"
          label="Objetivo del Agente"
          rules={[
            { required: true, message: 'Por favor define el objetivo del agente' },
            { max: 200, message: 'El objetivo no puede exceder 200 caracteres' },
          ]}
          extra="Define qué debe lograr el agente conversacional durante las interacciones"
        >
          <Input.TextArea
            placeholder="Schedule a visit"
            prefix={<Target size={16} className="text-gray-400" />}
            rows={3}
            showCount
            maxLength={200}
          />
        </Form.Item>

        <Form.Item
          name="is_active"
          label="Estado Inicial"
          valuePropName="checked"
          extra="Los tours activos pueden recibir visitantes y capturar leads"
        >
          <Switch
            checkedChildren="Activo"
            unCheckedChildren="Inactivo"
            size="default"
          />
        </Form.Item>

        <div className="bg-blue-50 p-4 rounded-lg mt-4">
          <h4 className="font-medium text-blue-800 mb-2">Próximos Pasos</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Una vez creado, podrás embeber el widget en tu tour</li>
            <li>• El agente comenzará a capturar leads automáticamente</li>
            <li>• Podrás ver las conversaciones en la sección Transcripciones</li>
          </ul>
        </div>
      </Form>
    </Modal>
  );
};

export default CreateTourModal;