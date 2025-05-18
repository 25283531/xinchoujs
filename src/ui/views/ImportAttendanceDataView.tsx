import React, { useState } from 'react';
import { Button, Upload, message, Select, Form, Typography } from 'antd';
import { UploadOutlined } from '@ant-design/icons';

const { Option } = Select;
const { Title } = Typography;

// Declare the ipcRenderer API type
declare const api: {
  send: (channel: string, ...args: any[]) => void;
  receive: (channel: string, func: (...args: any[]) => void) => void;
  invoke: (channel: string, ...args: any[]) => Promise<any>;
};

const ImportAttendanceDataView: React.FC = () => {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [importedDataId, setImportedDataId] = useState<string | null>(null); // State to store the imported data ID
  const [processing, setProcessing] = useState(false); // State for processing loading state

  const handleUpload = async () => {
    const values = await form.validateFields();
    const { matchingKeyword } = values;
    const file = fileList[0];

    if (!file) {
      message.error('请选择要导入的考勤数据文件！');
      return;
    }

    setUploading(true);

    try {
      // Call the main process IPC handler
      const result = await api.invoke('attendance:importAttendanceData', file.originFileObj.path, matchingKeyword);

      if (result.success) {
        message.success('考勤数据读取并导入成功，等待进一步处理！');
        setImportedDataId(result.data.dataId); // Store the returned data ID
        // Keep fileList and form fields for potential re-upload or context
      } else {
        message.error(`考勤数据导入失败: ${result.error}`);
        setFileList([]); // Clear file list on failure
        form.resetFields(); // Reset form fields on failure
        setImportedDataId(null); // Clear data ID on failure
      }
    } catch (error: any) {
      console.error('Error importing attendance data:', error);
      message.error(`考勤数据导入过程中发生错误: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const props = {
    onRemove: (file: any) => {
      const index = fileList.indexOf(file);
      const newFileList = fileList.slice();
      newFileList.splice(index, 1);
      setFileList(newFileList);
    },
    beforeUpload: (file: any) => {
      // Allow only one file
      setFileList([file]);
      return false; // Prevent default upload behavior
    },
    fileList,
    accept: '.xlsx, .xls', // Accept Excel files
  };





  const handleProcessData = async () => {
    if (!importedDataId) {
      message.error('没有可处理的导入数据！');
      return;
    }

    setProcessing(true);

    try {
      // Call the main process IPC handler to process data
      const result = await api.invoke('attendance:processAttendanceData', importedDataId);

      if (result.success) {
        message.success('考勤数据处理任务已启动！');
        setImportedDataId(null); // Clear data ID after processing is initiated
        setFileList([]); // Clear file list after processing
        form.resetFields(); // Reset form fields after processing
      } else {
        message.error(`考勤数据处理失败: ${result.error}`);
      }
    } catch (error: any) {
      console.error('Error processing attendance data:', error);
      message.error(`考勤数据处理过程中发生错误: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div>
      <Title level={4}>导入考勤数据</Title>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleUpload}
      >
        <Form.Item
          name="matchingKeyword"
          label="匹配方式"
          rules={[{ required: true, message: '请选择匹配方式!' }]}
        >
          <Select placeholder="请选择员工匹配方式">
            <Option value="name">姓名</Option>
            <Option value="name+id">姓名+工号</Option>
            <Option value="name+idcard">姓名+身份证号</Option>
          </Select>
        </Form.Item>
        <Form.Item
          label="选择考勤文件 (Excel)"
          required
        >
          <Upload {...props}>
            <Button icon={<UploadOutlined />}>
              选择文件
            </Button>
          </Upload>
        </Form.Item>
        <Form.Item>
          <Button
            type="primary"
            onClick={handleUpload}
            disabled={fileList.length === 0 || uploading}
            loading={uploading}
          >
            {uploading ? '导入中...' : '开始导入'}
          </Button>
        </Form.Item>
        {importedDataId && (
          <Form.Item>
            <Button
              type="primary"
              onClick={handleProcessData}
              disabled={processing}
              loading={processing}
            >
              {processing ? '处理中...' : '处理导入的数据'}
            </Button>
          </Form.Item>
        )}
      </Form>
    </div>
  );
};

export default ImportAttendanceDataView;