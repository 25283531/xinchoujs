/**
 * 考勤异常项目定义
 */
export interface AttendanceExceptionItem {
  id?: number;
  name: string; // 异常项名称，如：迟到、早退、旷工
  deductionRuleType: 'fixed' | 'per_hour' | 'per_day_salary' | 'tiered_count'; // 扣款规则类型：固定金额、每小时、每天工资比例、按次数分级
  deductionRuleValue?: number; // 扣款规则值：固定金额、每小时/天扣款金额、每天工资比例（0-1之间）
  deductionRuleThreshold?: number; // 扣款规则阈值：按次数分级时，超过此次数开始扣款
  notes?: string; // 备注
}

/**
 * 导入的考勤数据
 */
export interface ImportedAttendanceData {
  id?: number;
  importDate: string; // 导入日期时间戳
  filePath: string; // 导入的文件路径
  status: 'pending' | 'processed' | 'error'; // 导入状态
  matchingKeyword: 'name' | 'name+id' | 'name+idcard'; // 匹配关键词
  data?: any; // 原始导入数据，存储为 JSON 或其他格式
  rawData: any[]; // 添加 rawData 属性
}

/**
 * 考勤记录定义
 */
export interface AttendanceRecord {
  id?: number;
  employee_id: number;
  record_date: string; // Assuming DATE is stored as 'YYYY-MM-DD'
  exception_type_id: number;
  exception_count: number; // Count of the exception (e.g., hours late, days absent, occurrences)
  remark?: string;
}
