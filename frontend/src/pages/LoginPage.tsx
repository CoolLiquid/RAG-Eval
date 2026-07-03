import { Button, Card, Form, Input, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { colors } from '@/tokens';

const { Title, Paragraph } = Typography;

export function LoginPage() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: colors.background,
      }}
    >
      <Card style={{ width: 400 }}>
        <Title level={3}>知识库测评平台</Title>
        <Paragraph type="secondary">MVP 单用户模式</Paragraph>
        <Form layout="vertical">
          <Form.Item label="账号" name="username">
            <Input placeholder="账号" />
          </Form.Item>
          <Form.Item label="密码" name="password">
            <Input.Password placeholder="密码" />
          </Form.Item>
          <Button type="primary" block onClick={() => navigate('/dashboard')}>
            登录
          </Button>
        </Form>
      </Card>
    </div>
  );
}
