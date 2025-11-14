/**
 * Script para verificar queries problemáticas em workspace_members
 * Procura por tentativas de selecionar coluna 'id' que não existe
 */

const fs = require('fs');
const path = require('path');

const problematicPatterns = [
  /workspace_members.*select.*\bid\b/,
  /workspace_members.*select\(['"`]\s*id\s*['"`]\)/,
  /workspace_members.*select\(['"`][\s\S]*\bid\b[\s\S]*['"`]\)/,
];

const dirsToCheck = ['app', 'components', 'contexts', 'hooks', 'lib'];
const extensions = ['.ts', '.tsx', '.js', '.jsx'];

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const issues = [];

  lines.forEach((line, index) => {
    problematicPatterns.forEach(pattern => {
      if (pattern.test(line)) {
        // Verificar se não é workspace_id ou user_id
        if (!line.includes('workspace_id') && !line.includes('user_id')) {
          issues.push({
            file: filePath,
            line: index + 1,
            content: line.trim(),
          });
        }
      }
    });
  });

  return issues;
}

function walkDir(dir) {
  let issues = [];

  if (!fs.existsSync(dir)) return issues;

  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory() && !file.includes('node_modules')) {
      issues = issues.concat(walkDir(filePath));
    } else if (extensions.includes(path.extname(file))) {
      issues = issues.concat(checkFile(filePath));
    }
  });

  return issues;
}

console.log('🔍 Verificando queries problemáticas em workspace_members...\n');

let allIssues = [];
dirsToCheck.forEach(dir => {
  const issues = walkDir(dir);
  allIssues = allIssues.concat(issues);
});

if (allIssues.length === 0) {
  console.log('✅ Nenhuma query problemática encontrada!');
  console.log('   Todas as queries estão usando workspace_id ou user_id corretamente.\n');
} else {
  console.log(`❌ Encontradas ${allIssues.length} queries problemáticas:\n`);

  allIssues.forEach(issue => {
    console.log(`📄 ${issue.file}:${issue.line}`);
    console.log(`   ${issue.content}`);
    console.log('');
  });

  console.log('💡 Sugestão: Trocar .select("id") por .select("user_id") ou .select("*")\n');
}

// Verificar também select('*') que podem estar mascarando o problema
console.log('📊 Resumo de queries em workspace_members:');
console.log('   (select("*") funciona, mas select("id") falha)\n');

let selectStarCount = 0;
let selectSpecificCount = 0;

dirsToCheck.forEach(dir => {
  if (!fs.existsSync(dir)) return;

  const checkStats = (filePath) => {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('workspace_members')) {
      if (/\.select\(['"`]\*['"`]\)/.test(content)) {
        selectStarCount++;
      }
      if (/\.select\(['"`][^*]['"`]\)/.test(content)) {
        selectSpecificCount++;
      }
    }
  };

  const walkForStats = (dir) => {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory() && !file.includes('node_modules')) {
        walkForStats(filePath);
      } else if (extensions.includes(path.extname(file))) {
        checkStats(filePath);
      }
    });
  };

  walkForStats(dir);
});

console.log(`   select('*'): ${selectStarCount} occurrences (✅ safe)`);
console.log(`   select('specific'): ${selectSpecificCount} occurrences (⚠️  verify)\n`);
