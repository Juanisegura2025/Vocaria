import { useState } from 'react';
import { Card, Tabs, Form, Input, Button, Switch, Select, Divider, message } from 'antd';
import { 
  User, 
  Lock, 
  Bell, 
  Mail, 
  Globe, 
  CreditCard,
  Save,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const { TabPane } = Tabs;
const { Option } = Select;

const SettingsPage = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      message.success('Configuración guardada exitosamente');
    } catch (error) {
      message.error('Error al guardar la configuración');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">Configuración</h1>
        <Button 
          type="primary" 
          icon={<Save size={16} />}
          loading={loading}
          onClick={() => form.submit()}
        >
          Guardar Cambios
        </Button>
      </div>

      <Card className="shadow-sm">
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          className="settings-tabs"
        >
          <TabPane
            tab={
              <span>
                <User size={16} className="mr-1" />
                Perfil
              </span>
            }
            key="profile"
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              className="max-w-2xl"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Form.Item
                  label="Nombre"
                  name="firstName"
                  rules={[{ required: true, message: 'Por favor ingresa tu nombre' }]}
                >
                  <Input placeholder="Juan" />
                </Form.Item>
                <Form.Item
                  label="Apellido"
                  name="lastName"
                  rules={[{ required: true, message: 'Por favor ingresa tu apellido' }]}
                >
                  <Input placeholder="Pérez" />
                </Form.Item>
              </div>
              
              <Form.Item
                label="Correo Electrónico"
                name="email"
                rules={[
                  { required: true, message: 'Por favor ingresa tu correo' },
                  { type: 'email', message: 'Correo electrónico no válido' },
                ]}
              >
                <Input 
                  prefix={<Mail size={16} className="text-gray-400" />} 
                  placeholder="juan@ejemplo.com" 
                />
              </Form.Item>

              <Form.Item
                label="Teléfono"
                name="phone"
                rules={[
                  { pattern: /^[0-9+\-\s]+$/, message: 'Número de teléfono no válido' },
                ]}
              >
                <Input placeholder="+54 9 11 1234-5678" />
              </Form.Item>

              <Divider orientation="left" className="text-sm font-medium text-gray-500">
                Cambiar Contraseña
              </Divider>

              <Form.Item
                name="currentPassword"
                label="Contraseña Actual"
                rules={[
                  { min: 8, message: 'La contraseña debe tener al menos 8 caracteres' },
                ]}
              >
                <Input.Password
                  prefix={<Lock size={16} className="text-gray-400" />}
                  placeholder="••••••••"
                />
              </Form.Item>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Form.Item
                  name="newPassword"
                  label="Nueva Contraseña"
                  rules={[
                    { min: 8, message: 'La contraseña debe tener al menos 8 caracteres' },
                  ]}
                >
                  <Input.Password placeholder="••••••••" />
                </Form.Item>
                <Form.Item
                  name="confirmPassword"
                  label="Confirmar Contraseña"
                  dependencies={['newPassword']}
                  rules={[
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('newPassword') === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error('Las contraseñas no coinciden'));
                      },
                    }),
                  ]}
                >
                  <Input.Password placeholder="••••••••" />
                </Form.Item>
              </div>
            </Form>
          </TabPane>

          <TabPane
            tab={
              <span>
                <Bell size={16} className="mr-1" />
                Notificaciones
              </span>
            }
            key="notifications"
          >
            <div className="max-w-2xl space-y-6">
              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Notificaciones por correo</h3>
                    <p className="text-sm text-gray-500">Recibir notificaciones importantes por correo electrónico</p>
                  </div>
                  <Form.Item name="emailNotifications" valuePropName="checked" noStyle>
                    <Switch defaultChecked />
                  </Form.Item>
                </div>
              </Card>

              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Recordatorios de tours</h3>
                    <p className="text-sm text-gray-500">Recordatorios para tours programados</p>
                  </div>
                  <Form.Item name="tourReminders" valuePropName="checked" noStyle>
                    <Switch defaultChecked />
                  </Form.Item>
                </div>
              </Card>

              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Actualizaciones de leads</h3>
                    <p className="text-sm text-gray-500">Notificaciones sobre actividad de leads</p>
                  </div>
                  <Form.Item name="leadUpdates" valuePropName="checked" noStyle>
                    <Switch defaultChecked />
                  </Form.Item>
                </div>
              </Card>
            </div>
          </TabPane>

          <TabPane
            tab={
              <span>
                <Globe size={16} className="mr-1" />
                Preferencias
              </span>
            }
            key="preferences"
          >
            <div className="max-w-2xl space-y-6">
              <Card>
                <h3 className="font-medium mb-4">Idioma</h3>
                <Form.Item name="language" noStyle>
                  <Select defaultValue="es" style={{ width: 200 }}>
                    <Option value="es">Español</Option>
                    <Option value="en">English</Option>
                    <Option value="pt">Português</Option>
                  </Select>
                </Form.Item>
              </Card>

              <Card>
                <h3 className="font-medium mb-4">Zona Horaria</h3>
                <Form.Item name="timezone" noStyle>
                  <Select 
                    defaultValue="America/Argentina/Buenos_Aires" 
                    style={{ width: 300 }}
                    showSearch
                    optionFilterProp="children"
                    filterOption={(input, option) =>
                      (option?.children as string).toLowerCase().includes(input.toLowerCase())
                    }
                  >
                    <Option value="America/Argentina/Buenos_Aires">(GMT-03:00) Buenos Aires</Option>
                    <Option value="America/Mexico_City">(GMT-06:00) Ciudad de México</Option>
                    <Option value="America/Bogota">(GMT-05:00) Bogotá</Option>
                    <Option value="America/Santiago">(GMT-04:00) Santiago</Option>
                    <Option value="America/Lima">(GMT-05:00) Lima</Option>
                  </Select>
                </Form.Item>
              </Card>
            </div>
          </TabPane>

          <TabPane
            tab={
              <span>
                <CreditCard size={16} className="mr-1" />
                Suscripción
              </span>
            }
            key="billing"
          >
            <Card className="max-w-2xl">
              <div className="flex items-start">
                <div className="p-3 bg-green-100 rounded-full mr-4">
                  <CheckCircle className="text-green-600" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-medium">Plan Profesional</h3>
                  <p className="text-gray-600">Tu suscripción está activa</p>
                  <div className="mt-2 text-sm text-gray-500">
                    Próximo cargo: $99.00 USD - 15 de Junio 2023
                  </div>
                </div>
              </div>

              <Divider />

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium">Método de pago</h4>
                    <p className="text-sm text-gray-500">Visa terminada en 4242</p>
                  </div>
                  <Button type="link">Cambiar</Button>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium">Facturación</h4>
                    <p className="text-sm text-gray-500">Facturas mensuales</p>
                  </div>
                  <Button type="link">Ver facturas</Button>
                </div>

                <div className="p-4 bg-yellow-50 rounded-lg flex items-start">
                  <AlertCircle className="text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-yellow-800">¿Quieres cambiar de plan?</h4>
                    <p className="text-sm text-yellow-700">
                      Puedes actualizar o cambiar tu plan en cualquier momento.
                    </p>
                    <Button type="primary" className="mt-2">
                      Ver planes disponibles
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default SettingsPage;
