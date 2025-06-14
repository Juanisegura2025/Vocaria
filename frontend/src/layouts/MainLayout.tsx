import { Link, Outlet, useLocation } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import {
  Home,
  Users,
  MessageSquare,
  BarChart2,
  Settings,
  Home as HomeIcon,
} from 'lucide-react';

const { Sider, Content } = Layout;

const menuItems = [
  {
    key: 'dashboard',
    icon: <HomeIcon className="h-5 w-5" />,
    label: 'Dashboard',
    path: '/dashboard',
  },
  {
    key: 'tours',
    icon: <Home className="h-5 w-5" />,
    label: 'Tours',
    path: '/tours',
  },
  {
    key: 'leads',
    icon: <Users className="h-5 w-5" />,
    label: 'Leads',
    path: '/leads',
  },
  {
    key: 'transcripts',
    icon: <MessageSquare className="h-5 w-5" />,
    label: 'Transcripts',
    path: '/transcripts',
  },
  {
    key: 'analytics',
    icon: <BarChart2 className="h-5 w-5" />,
    label: 'Analytics',
    path: '/analytics',
  },
  {
    key: 'settings',
    icon: <Settings className="h-5 w-5" />,
    label: 'Settings',
    path: '/settings',
  },
];

export function MainLayout() {
  const location = useLocation();
  const selectedKey = menuItems.find(item => location.pathname.startsWith(item.path))?.key || 'dashboard';

  return (
    <Layout className="min-h-screen bg-gray-50">
      <Sider
        width={250}
        className="shadow-lg"
        theme="light"
        breakpoint="lg"
        collapsedWidth="0"
      >
        <div className="flex h-16 items-center justify-center border-b border-gray-200 px-4">
          <h1 className="text-xl font-bold text-blue-600">Vocaria Admin</h1>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          className="border-r-0"
        >
          {menuItems.map((item) => (
            <Menu.Item key={item.key} icon={item.icon}>
              <Link to={item.path}>{item.label}</Link>
            </Menu.Item>
          ))}
        </Menu>
      </Sider>
      <Layout>
        <Content className="p-6">
          <div className="bg-white rounded-lg shadow p-6">
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
} 