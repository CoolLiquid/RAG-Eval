import { useQuery } from '@tanstack/react-query';
import { Alert, Card, Col, Row, Statistic, Typography } from 'antd';
import { fetchHealth } from '@/api/client';
import { PagePlaceholder } from '@/components/PagePlaceholder';

const { Text } = Typography;

export function DashboardPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['health'],
    queryFn: fetchHealth,
  });

  return (
    <div>
      <PagePlaceholder
        title="首页概览"
        description="MCP 知识库测评运行状态一览"
        priority="P1"
      />
      <Row gutter={16} style={{ marginTop: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic title="MCP 知识库" value={0} suffix="个" />
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
