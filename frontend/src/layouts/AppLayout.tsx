import {
  DashboardOutlined,
  DatabaseOutlined,
  FileSearchOutlined,
  SettingOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import { Avatar, Breadcrumb, Dropdown, Input, Layout, Menu, Space, Typography } from 'antd';
import { useMemo } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { logout } from '@/auth/session';
import { BrandLogo } from '@/components/BrandLogo';
import { colors, elevation, layout, rounded, spacing } from '@/tokens';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const navItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: '首页概览' },
  { key: '/knowledge-bases', icon: <DatabaseOutlined />, label: 'MCP 知识库' },
  { key: '/question-banks', icon: <UnorderedListOutlined />, label: '测评题库' },
  { key: '/evaluations', icon: <FileSearchOutlined />, label: '测评任务' },
  { key: '/settings', icon: <SettingOutlined />, label: '系统设置' },
];

const breadcrumbMap: Record<string, string> = {
  dashboard: '首页概览',
  'knowledge-bases': 'MCP 知识库',
  new: '挂载向导',
  'question-banks': '测评题库',
  evaluations: '测评任务',
  running: '进行中',
  report: '报告',
  compare: '版本对比',
  settings: '系统设置',
};

export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const selectedKey = useMemo(() => {
    const path = location.pathname;
    if (path.startsWith('/knowledge-bases')) return '/knowledge-bases';
    if (path.startsWith('/question-banks')) return '/question-banks';
    if (path.startsWith('/evaluations')) return '/evaluations';
    if (path.startsWith('/settings')) return '/settings';
    return '/dashboard';
  }, [location.pathname]);

  const breadcrumbItems = useMemo(() => {
    const segments = location.pathname.split('/').filter(Boolean);
    return [
      { title: <Link to="/dashboard">首页</Link> },
      ...segments.map((segment, index) => {
        const path = `/${segments.slice(0, index + 1).join('/')}`;
        const label = breadcrumbMap[segment] ?? segment;
        const isLast = index === segments.length - 1;
        return { title: isLast ? label : <Link to={path}>{label}</Link> };
      }),
    ];
  }, [location.pathname]);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        width={layout.sidebarWidth}
        theme="light"
        style={{ borderRight: `1px solid ${colors.outlineVariant}` }}
      >
        <div
          style={{
            padding: `${spacing.md + 4}px ${spacing.md}px`,
            borderBottom: `1px solid ${colors.outlineVariant}`,
          }}
        >
          <BrandLogo showSubtitle />
        </div>
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={navItems.map((item) => ({
            key: item.key,
            icon: item.icon,
            label: <Link to={item.key}>{item.label}</Link>,
          }))}
          style={{ borderInlineEnd: 'none', marginTop: 8 }}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: colors.surfaceContainerLowest,
            padding: `0 ${spacing.lg}px`,
            borderBottom: `1px solid ${colors.outlineVariant}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Breadcrumb items={breadcrumbItems} />
          <Space size="middle">
            <Input.Search placeholder="搜索知识库或任务..." style={{ width: 240 }} />
            <Dropdown
              menu={{
                items: [{ key: 'logout', label: '退出登录' }],
                onClick: ({ key }) => {
                  if (key === 'logout') {
                    logout();
                    navigate('/login', { replace: true });
                  }
                },
              }}
            >
              <Space style={{ cursor: 'pointer' }}>
                <Avatar size="small">管</Avatar>
                <Text>管理员</Text>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        <Content style={{ margin: spacing.containerMargin }}>
          <div
            style={{
              background: colors.surfaceContainerLowest,
              borderRadius: rounded.default,
              padding: spacing.lg,
              minHeight: 'calc(100vh - 112px)',
              boxShadow: elevation.card,
              border: `1px solid ${colors.outlineVariant}`,
            }}
          >
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
