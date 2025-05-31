const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

// CSS模块插件
const cssModulesPlugin = {
  name: 'css-modules',
  setup(build) {
    build.onLoad({ filter: /\.module\.css$/ }, async (args) => {
      const cssContent = await fs.promises.readFile(args.path, 'utf8');
      
      // 简单的CSS模块处理：为每个类名添加唯一后缀
      const moduleId = path.basename(args.path, '.module.css').replace(/[^a-zA-Z0-9]/g, '_');
      const classNames = {};
      
      // 提取CSS类名
      const classRegex = /\.(\w+[\w-]*)/g;
      let match;
      while ((match = classRegex.exec(cssContent)) !== null) {
        const className = match[1];
        const scopedName = `${className}_${moduleId}`;
        classNames[className] = scopedName;
      }
      
      // 生成作用域CSS
      let scopedCss = cssContent;
      Object.entries(classNames).forEach(([original, scoped]) => {
        const regex = new RegExp(`\\.(${original})(?![\\w-])`, 'g');
        scopedCss = scopedCss.replace(regex, `.${scoped}`);
      });
      
      // 将CSS注入到页面
      const jsContent = `
const styles = ${JSON.stringify(classNames)};
const css = ${JSON.stringify(scopedCss)};
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
}
export default styles;
`;
      
      return {
        contents: jsContent,
        loader: 'js'
      };
    });
  }
};

// 构建配置
esbuild.build({
  entryPoints: ['src/ui/index.tsx'],
  bundle: true,
  outfile: 'build/ui.js',
  platform: 'browser',
  format: 'esm',
  external: ['sqlite3', 'sqlite'],
  plugins: [cssModulesPlugin],
  loader: {
    '.css': 'css'
  }
}).then(() => {
  console.log('Build completed with CSS modules support!');
}).catch((error) => {
  console.error('Build failed:', error);
  process.exit(1);
});