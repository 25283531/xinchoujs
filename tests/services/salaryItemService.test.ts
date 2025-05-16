/**
 * 薪酬项服务单元测试
 */

import { SalaryItemService } from '../../src/services/salaryItemService';
import { SalaryItemServiceImpl } from '../../src/services/salaryItemService.impl';
import { SalaryItem } from '../../src/services/payrollService';

// 模拟数据库连接
jest.mock('../../src/db/database', () => {
  return {
    Database: {
      getInstance: jest.fn().mockReturnValue({
        getConnection: jest.fn().mockReturnValue({
          all: jest.fn(),
          get: jest.fn(),
          run: jest.fn().mockReturnValue({ lastID: 1 }),
          prepare: jest.fn().mockReturnValue({
            run: jest.fn(),
            finalize: jest.fn()
          })
        }),
        initialize: jest.fn(),
        close: jest.fn()
      })
    }
  };
});

// 模拟薪酬项仓库
jest.mock('../../src/db/salaryItemRepository', () => {
  return {
    SalaryItemRepository: jest.fn().mockImplementation(() => {
      return {
        getAllSalaryItems: jest.fn().mockResolvedValue([]),
        getPresetSalaryItems: jest.fn().mockResolvedValue([]),
        getCustomSalaryItems: jest.fn().mockResolvedValue([]),
        getSalaryItemById: jest.fn().mockResolvedValue(null),
        createSalaryItem: jest.fn().mockResolvedValue(1),
        updateSalaryItem: jest.fn().mockResolvedValue(undefined),
        deleteSalaryItem: jest.fn().mockResolvedValue(undefined),
        isSalaryItemReferenced: jest.fn().mockResolvedValue(false),
        countPresetSalaryItems: jest.fn().mockResolvedValue(0)
      };
    })
  };
});

describe('SalaryItemService', () => {
  let service: SalaryItemService;

  beforeEach(() => {
    service = new SalaryItemServiceImpl();
    jest.clearAllMocks();
  });

  describe('initPresetSalaryItems', () => {
    it('应该初始化预置薪酬项', async () => {
      // 模拟没有预置薪酬项
      const repository = (service as any).repository;
      repository.countPresetSalaryItems.mockResolvedValue(0);

      await service.initPresetSalaryItems();

      // 验证创建了5个预置薪酬项
      expect(repository.createSalaryItem).toHaveBeenCalledTimes(5);
      
      // 验证创建的预置薪酬项
      const calls = repository.createSalaryItem.mock.calls;
      expect(calls[0][0].name).toBe('租房补贴');
      expect(calls[1][0].name).toBe('通话补贴');
      expect(calls[2][0].name).toBe('学历补贴');
      expect(calls[3][0].name).toBe('高温补贴');
      expect(calls[4][0].name).toBe('技能补贴');
    });

    it('如果已存在预置薪酬项，应该跳过初始化', async () => {
      // 模拟已有预置薪酬项
      const repository = (service as any).repository;
      repository.countPresetSalaryItems.mockResolvedValue(5);

      await service.initPresetSalaryItems();

      // 验证没有创建新的预置薪酬项
      expect(repository.createSalaryItem).not.toHaveBeenCalled();
    });
  });

  describe('getAllSalaryItems', () => {
    it('应该返回所有薪酬项', async () => {
      // 模拟薪酬项数据
      // 修改测试中的类型定义，确保 type 字段只能是 'fixed'、'percentage' 或 'formula'
      const mockItems: SalaryItem[] = [
        { id: 1, name: '租房补贴', type: 'fixed', value: 1000, subsidyCycle: 1, isPreset: true, description: '测试' },
        { id: 2, name: '自定义项', type: 'fixed', value: 500, subsidyCycle: 1, isPreset: false, description: '测试' }
      ];
      
      const repository = (service as any).repository;
      repository.getAllSalaryItems.mockResolvedValue(mockItems);

      const result = await service.getAllSalaryItems();

      expect(result).toEqual(mockItems);
      expect(repository.getAllSalaryItems).toHaveBeenCalled();
    });
  });

  describe('updateSalaryItem', () => {
    it('应该只允许修改预置薪酬项的金额、周期和描述', async () => {
      // 模拟预置薪酬项
      const mockItem: SalaryItem = {
        id: 1,
        name: '租房补贴',
        type: 'fixed',
        value: 1000,
        subsidyCycle: 1,
        isPreset: true,
        description: '测试'
      };
      
      const repository = (service as any).repository;
      repository.getSalaryItemById.mockResolvedValue(mockItem);

      // 尝试修改所有字段
      await service.updateSalaryItem(1, {
        name: '新名称', // 不应被修改
        type: 'percentage', // 不应被修改
        value: 2000, // 应被修改
        subsidyCycle: 2, // 应被修改
        isPreset: false, // 不应被修改
        description: '新描述' // 应被修改
      });

      // 验证只传入了允许的字段
      expect(repository.updateSalaryItem).toHaveBeenCalledWith(1, {
        value: 2000,
        subsidyCycle: 2,
        description: '新描述'
      });
    });

    it('应该允许修改自定义薪酬项的所有字段', async () => {
      // 模拟自定义薪酬项
      const mockItem: SalaryItem = {
        id: 2,
        name: '自定义项',
        type: 'fixed',
        value: 500,
        subsidyCycle: 1,
        isPreset: false,
        description: '测试'
      };
      
      const repository = (service as any).repository;
      repository.getSalaryItemById.mockResolvedValue(mockItem);

      // 修改所有字段
      const updates = {
        name: '新名称',
        type: 'percentage',
        value: 50,
        subsidyCycle: 3,
        isPreset: false,
        description: '新描述'
      };
      
      await service.updateSalaryItem(2, updates);

      // 验证传入了所有字段
      expect(repository.updateSalaryItem).toHaveBeenCalledWith(2, updates);
    });
  });

  describe('deleteSalaryItem', () => {
    it('不应该允许删除预置薪酬项', async () => {
      // 模拟预置薪酬项
      const mockItem: SalaryItem = {
        id: 1,
        name: '租房补贴',
        type: 'fixed',
        value: 1000,
        subsidyCycle: 1,
        isPreset: true,
        description: '测试'
      };
      
      const repository = (service as any).repository;
      repository.getSalaryItemById.mockResolvedValue(mockItem);

      // 尝试删除预置薪酬项应该抛出错误
      await expect(service.deleteSalaryItem(1)).rejects.toThrow('预置薪酬项不允许删除');
      expect(repository.deleteSalaryItem).not.toHaveBeenCalled();
    });

    it('不应该允许删除被薪酬组引用的薪酬项', async () => {
      // 模拟自定义薪酬项
      const mockItem: SalaryItem = {
        id: 2,
        name: '自定义项',
        type: 'fixed',
        value: 500,
        subsidyCycle: 1,
        isPreset: false,
        description: '测试'
      };
      
      const repository = (service as any).repository;
      repository.getSalaryItemById.mockResolvedValue(mockItem);
      repository.isSalaryItemReferenced.mockResolvedValue(true);

      // 尝试删除被引用的薪酬项应该抛出错误
      await expect(service.deleteSalaryItem(2)).rejects.toThrow('该薪酬项已被薪酬组引用，无法删除');
      expect(repository.deleteSalaryItem).not.toHaveBeenCalled();
    });

    it('应该允许删除未被引用的自定义薪酬项', async () => {
      // 模拟自定义薪酬项
      const mockItem: SalaryItem = {
        id: 2,
        name: '自定义项',
        type: 'fixed',
        value: 500,
        subsidyCycle: 1,
        isPreset: false,
        description: '测试'
      };
      
      const repository = (service as any).repository;
      repository.getSalaryItemById.mockResolvedValue(mockItem);
      repository.isSalaryItemReferenced.mockResolvedValue(false);

      await service.deleteSalaryItem(2);

      expect(repository.deleteSalaryItem).toHaveBeenCalledWith(2);
    });
  });
});