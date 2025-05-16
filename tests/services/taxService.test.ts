import { calculateTax } from '../../src/services/taxService';

describe('Tax Service', () => {
  // 示例测试用例，根据实际税率表和规则编写更多测试
  test('should calculate tax correctly for a basic income', () => {
    const income = 10000; // 假设税前收入
    const deductibleExpenses = 5000; // 假设五险一金、专项附加扣除等
    const result = calculateTax(income, deductibleExpenses);
    // 假设应纳税所得额为 5000，适用税率 10%，速算扣除数 210
    // 应纳税额 = 5000 * 0.10 - 210 = 500 - 210 = 290
    expect(result.taxableIncome).toBe(5000);
    expect(result.taxAmount).toBe(290);
  });

  test('should calculate tax correctly for income below threshold', () => {
    const income = 4000; // 假设税前收入
    const deductibleExpenses = 5000; // 假设五险一金、专项附加扣除等
    const result = calculateTax(income, deductibleExpenses);
    // 应纳税所得额为 0，应纳税额为 0
    expect(result.taxableIncome).toBe(0);
    expect(result.taxAmount).toBe(0);
  });

  test('should calculate tax correctly for income in a higher bracket', () => {
    const income = 30000; // 假设税前收入
    const deductibleExpenses = 5000; // 假设五险一金、专项附加扣除等
    const result = calculateTax(income, deductibleExpenses);
    // 应纳税所得额为 25000，适用税率 25%，速算扣除数 2660
    // 应纳税额 = 25000 * 0.25 - 2660 = 6250 - 2660 = 3590
    expect(result.taxableIncome).toBe(25000);
    expect(result.taxAmount).toBe(3590);
  });

  // 添加更多测试用例以覆盖所有税率区间和边界条件
});