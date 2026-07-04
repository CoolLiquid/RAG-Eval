import { App, Button, Checkbox, Form, Input, Typography } from 'antd';
import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { getRememberedUsername, isAuthenticated, login } from '@/auth/session';
import { BrandLogo } from '@/components/BrandLogo';
import loginHero from '@/assets/login-hero.png';
import styles from './LoginPage.module.css';

type LoginFormValues = {
  username: string;
  password: string;
  remember: boolean;
};

export function LoginPage() {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm<LoginFormValues>();

  if (isAuthenticated()) {
    return <Navigate to="/dashboard" replace />;
  }

  const rememberedUsername = getRememberedUsername();

  const handleFinish = async (values: LoginFormValues) => {
    setLoading(true);
    try {
      const success = login(values.username, values.password, values.remember);
      if (!success) {
        message.error('账号或密码错误');
        return;
      }
      message.success('登录成功');
      navigate('/dashboard', { replace: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <aside className={styles.hero}>
        <div className={styles.heroIllustration}>
          <img src={loginHero} alt="" aria-hidden />
        </div>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>量化你的知识库检索质量</h1>
          <p className={styles.heroSubtitle}>
            挂载 MCP · 标准题库 · 自动化测评 · 可归因报告
          </p>
        </div>
      </aside>

      <main className={styles.formPanel}>
        <div className={styles.formContainer}>
          <BrandLogo size="large" />
          <Typography.Title level={3} className={styles.formTitle}>
            登录
          </Typography.Title>

          <Form
            form={form}
            layout="vertical"
            requiredMark={false}
            initialValues={{
              username: rememberedUsername ?? '',
              remember: Boolean(rememberedUsername),
            }}
            onFinish={handleFinish}
          >
            <Form.Item
              label="账号"
              name="username"
              rules={[{ required: true, message: '请输入账号' }]}
            >
              <Input placeholder="请输入邮箱或用户名" size="large" autoComplete="username" />
            </Form.Item>

            <Form.Item
              label="密码"
              name="password"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password
                placeholder="请输入密码"
                size="large"
                autoComplete="current-password"
              />
            </Form.Item>

            <div className={styles.formExtras}>
              <Form.Item name="remember" valuePropName="checked" noStyle>
                <Checkbox>记住我</Checkbox>
              </Form.Item>
              <Button
                type="link"
                className={styles.forgotLink}
                onClick={() => message.info('MVP 版本暂不支持找回密码')}
              >
                忘记密码？
              </Button>
            </div>

            <Form.Item style={{ marginTop: 24, marginBottom: 0 }}>
              <Button type="primary" htmlType="submit" block size="large" loading={loading}>
                登录
              </Button>
            </Form.Item>
          </Form>

          <p className={styles.formFooter}>MVP 单用户模式</p>
        </div>
      </main>
    </div>
  );
}
