/**
 * 修复main.ts中的数据库路径配置
 * 确保应用程序使用一致的数据库文件
 */

const fs = require('fs');
const path = require('path');

// 主文件路径
const mainTsPath = path.join(__dirname, 'src', 'main.ts');

// 检查文件是否存在
if (!fs.existsSync(mainTsPath)) {
  console.error('main.ts文件不存在:', mainTsPath);
  process.exit(1);
}

console.log('开始修复main.ts中的数据库路径配置...');

// 读取文件内容
let content = fs.readFileSync(mainTsPath, 'utf8');

// 查找数据库路径配置行
const dbPathRegex = /const dbPath = path\.join\(__dirname, ['"](.+)['"], ['"](.+)['"]\);/;
const match = content.match(dbPathRegex);

if (!match) {
  console.error('无法在main.ts中找到数据库路径配置');
  process.exit(1);
}

// 当前配置
const currentPath = match[0];
console.log('当前数据库路径配置:', currentPath);

// 检查是否需要修改
if (currentPath.includes('hr_payroll.db')) {
  console.log('数据库路径配置已经正确，无需修改');
  process.exit(0);
}

// 修改为使用hr_payroll.db
const newPath = `const dbPath = path.join(__dirname, '../data/hr_payroll.db');`;
content = content.replace(dbPathRegex, newPath);

// 写入文件
fs.writeFileSync(mainTsPath, content, 'utf8');

console.log('数据库路径配置已修改为:', newPath);
console.log('修复完成！');
console.log('\n请运行以下命令重新构建应用程序:');
console.log('npm run build');
console.log('\n然后运行以下命令启动应用程序:');
console.log('npm start');