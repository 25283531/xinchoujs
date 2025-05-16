/**
 * 薪酬项服务实现类
 * 继承并实现薪酬项服务的功能
 */

import { SalaryItemService } from './salaryItemService';
import { SalaryItem } from './payrollService';
import { Database } from '../db/database';

export class SalaryItemServiceImpl extends SalaryItemService {
  constructor() {
    super();
  }
  
  /**
   * 根据ID获取薪酬项
   * @param id 薪酬项ID
   * @returns 薪酬项
   */
  public async getSalaryItemById(id: number): Promise<SalaryItem | null> {
    return super.getSalaryItemById(id);
  }
}