import { InboxOutlined } from '@ant-design/icons';
import { App, Button, Typography, Upload } from 'antd';
import type { UploadProps } from 'antd';
import { downloadQuestionBankTemplate } from '@/api/questionBanks';
import { colors, spacing } from '@/tokens';

const { Dragger } = Upload;
const { Text, Link } = Typography;

interface CsvUploadZoneProps {
  uploading?: boolean;
  onUpload: (file: File) => void;
}

export function CsvUploadZone({ uploading, onUpload }: CsvUploadZoneProps) {
  const { message } = App.useApp();

  const uploadProps: UploadProps = {
    name: 'file',
    multiple: false,
    accept: '.csv',
    showUploadList: false,
    beforeUpload: (file) => {
      if (!file.name.toLowerCase().endsWith('.csv')) {
        message.error('请上传 CSV 文件');
        return Upload.LIST_IGNORE;
      }
      onUpload(file);
      return false;
    },
  };

  const handleDownloadTemplate = async () => {
    try {
      await downloadQuestionBankTemplate();
      message.success('模板已下载');
    } catch {
      message.error('模板下载失败');
    }
  };

  return (
    <div>
      <Dragger {...uploadProps} disabled={uploading} style={{ padding: spacing.lg }}>
        <p className="ant-upload-drag-icon">
          <InboxOutlined style={{ color: colors.primary }} />
        </p>
        <p className="ant-upload-text">拖拽 CSV 或点击上传</p>
        <p className="ant-upload-hint">
          格式：question, expected_answer, category, difficulty, source_ref
        </p>
      </Dragger>
      <div style={{ marginTop: spacing.sm }}>
        <Text type="secondary">没有模板？</Text>{' '}
        <Link onClick={handleDownloadTemplate}>下载 CSV 模板</Link>
        {' · '}
        <Button type="link" size="small" onClick={handleDownloadTemplate} style={{ padding: 0 }}>
          重新下载
        </Button>
      </div>
    </div>
  );
}
