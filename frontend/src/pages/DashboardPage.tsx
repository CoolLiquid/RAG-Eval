import { useQuery } from '@tanstack/react-query';
import { Alert, Button, Card, Col, Row, Space, Statistic, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { fetchHealth } from '@/api/client';
import { fetchKbList } from '@/api/kb';
import { PagePlaceholder } from '@/components/PagePlaceholder';

const { Text } = Typography;

export function DashboardPage() {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['health'],
    queryFn: fetchHealth,
  });
  const { data: kbData } = useQuery({
    queryKey: ['kb', {}],
    queryFn: () => fetchKbList(),
  });

  return (
    <div>
      <PagePlaceholder
        title="首页概览"
        description="MCP 知识库测评运行状态一览"
        priority="P1"
      />
      <Space style={{ marginTop: 16 }}>
        <Button type="primary" onClick={() => navigate('/knowledge-bases/new')}>
          挂载 MCP 知识库
        </Button>
        <Button onClick={() => navigate('/evaluations/new')}>发起测评</Button>
      </Space>
      <Row gutter={16} style={{ marginTop: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic title="MCP 知识库" value={kbData?.total ?? 0} suffix="个" />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="进行中任务" value={0} suffix="个" />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="最近平均得分" value="—" />
          </Card>
        </Col>
      </Row>
      <Card style={{ marginTop: 16 }} title="API 联调状态">
        {isLoading && <Text>检测中...</Text>}
        {isError && (
          <Alert type="error" message="后端未连接，请启动 FastAPI 服务" showIcon />
        )}
        {data && (
          <Alert
            type="success"
            message={`后端已连接：${data.status} (v${data.version})`}
            showIcon
          />
        )}
      </Card>
    </div>
  );
}
