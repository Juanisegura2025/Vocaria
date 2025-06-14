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

  const onFinish = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      message.success('Settings saved successfully');
    } catch (error) {
      message.error('Error saving settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">Settings</h1>
        <Button 
          type="primary" 
          icon={<Save size={16} />}
          loading={loading}
          onClick={() => form.submit()}
        >
          Save Changes
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
                Profile
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
                  label="First Name"
                  name="firstName"
                  rules={[{ required: true, message: 'Please enter your first name' }]}
                >
                  <Input placeholder="John" />
                </Form.Item>
                <Form.Item
                  label="Last Name"
                  name="lastName"
                  rules={[{ required: true, message: 'Please enter your last name' }]}
                >
                  <Input placeholder="Doe" />
                </Form.Item>
              </div>
              
              <Form.Item
                label="Email Address"
                name="email"
                rules={[
                  { required: true, message: 'Please enter your email' },
                  { type: 'email', message: 'Invalid email address' },
                ]}
              >
                <Input 
                  prefix={<Mail size={16} className="text-gray-400" />} 
                  placeholder="john@example.com" 
                />
              </Form.Item>

              <Form.Item
                label="Phone Number"
                name="phone"
                rules={[
                  { pattern: /^[0-9+\-\s]+$/, message: 'Invalid phone number' },
                ]}
              >
                <Input placeholder="+1 (555) 123-4567" />
              </Form.Item>

              <Divider orientation="left" className="text-sm font-medium text-gray-500">
                Change Password
              </Divider>

              <Form.Item
                name="currentPassword"
                label="Current Password"
                rules={[
                  { min: 8, message: 'Password must be at least 8 characters' },
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
                  label="New Password"
                  rules={[
                    { min: 8, message: 'Password must be at least 8 characters' },
                  ]}
                >
                  <Input.Password placeholder="••••••••" />
                </Form.Item>
                <Form.Item
                  name="confirmPassword"
                  label="Confirm Password"
                  dependencies={['newPassword']}
                  rules={[
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('newPassword') === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error('Passwords do not match'));
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
                Notifications
              </span>
            }
            key="notifications"
          >
            <div className="max-w-2xl space-y-6">
              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Email notifications</h3>
                    <p className="text-sm text-gray-500">Receive important notifications via email</p>
                  </div>
                  <Form.Item name="emailNotifications" valuePropName="checked" noStyle>
                    <Switch defaultChecked />
                  </Form.Item>
                </div>
              </Card>

              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Tour reminders</h3>
                    <p className="text-sm text-gray-500">Reminders for scheduled tours</p>
                  </div>
                  <Form.Item name="tourReminders" valuePropName="checked" noStyle>
                    <Switch defaultChecked />
                  </Form.Item>
                </div>
              </Card>

              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Lead updates</h3>
                    <p className="text-sm text-gray-500">Notifications about lead activity</p>
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
                Preferences
              </span>
            }
            key="preferences"
          >
            <div className="max-w-2xl space-y-6">
              <Card>
                <h3 className="font-medium mb-4">Language</h3>
                <Form.Item name="language" noStyle>
                  <Select defaultValue="en" style={{ width: 200 }}>
                    <Option value="en">English</Option>
                    <Option value="es">Español</Option>
                    <Option value="pt">Português</Option>
                  </Select>
                </Form.Item>
              </Card>

              <Card>
                <h3 className="font-medium mb-4">Time Zone</h3>
                <Form.Item name="timezone" noStyle>
                  <Select 
                    defaultValue="America/Argentina/Buenos_Aires" 
                    style={{ width: 300 }}
                    showSearch
                    optionFilterProp="children"
                    filterOption={(input, option) => {
                      const optionText = option?.children as string | string[] | undefined;
                      const text = Array.isArray(optionText) ? optionText.join('') : optionText || '';
                      return text.toLowerCase().includes(input.toLowerCase());
                    }}
                  >
                    <Option value="America/Argentina/Buenos_Aires">(GMT-03:00) Buenos Aires</Option>
                    <Option value="America/Mexico_City">(GMT-06:00) Mexico City</Option>
                    <Option value="America/Bogota">(GMT-05:00) Bogotá</Option>
                    <Option value="America/Santiago">(GMT-04:00) Santiago</Option>
                    <Option value="America/Lima">(GMT-05:00) Lima</Option>
                    <Option value="America/New_York">(GMT-05:00) New York</Option>
                    <Option value="Europe/London">(GMT+00:00) London</Option>
                    <Option value="Europe/Madrid">(GMT+01:00) Madrid</Option>
                  </Select>
                </Form.Item>
              </Card>
            </div>
          </TabPane>

          <TabPane
            tab={
              <span>
                <CreditCard size={16} className="mr-1" />
                Subscription
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
                  <h3 className="text-lg font-medium">Professional Plan</h3>
                  <p className="text-gray-600">Your subscription is active</p>
                  <div className="mt-2 text-sm text-gray-500">
                    Next billing: $99.00 USD - June 15, 2025
                  </div>
                </div>
              </div>

              <Divider />

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium">Payment method</h4>
                    <p className="text-sm text-gray-500">Visa ending in 4242</p>
                  </div>
                  <Button type="link">Change</Button>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium">Billing</h4>
                    <p className="text-sm text-gray-500">Monthly invoices</p>
                  </div>
                  <Button type="link">View invoices</Button>
                </div>

                <div className="p-4 bg-yellow-50 rounded-lg flex items-start">
                  <AlertCircle className="text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-yellow-800">Want to change your plan?</h4>
                    <p className="text-sm text-yellow-700">
                      You can upgrade or change your plan at any time.
                    </p>
                    <Button type="primary" className="mt-2">
                      View available plans
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