import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';
import { AutoGraphService } from './autoGraphService';
import { EntityType, RelationVerb } from '../../utils/types';
import {
  AnalysisResult,
  AnalysisError,
  AnalysisProgress,
  ExtractedSymbol,
  ExtractedRelation,
  FileAnalysisResult,
  ImportInfo,
} from './types';

/**
 * 代码分析器
 * 使用 VSCode LSP API 和 TypeScript 分析代码结构
 */
export class CodeAnalyzer {
  private workspaceRoot: string = '';
  private includePatterns: string[] = ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'];
  private excludePatterns: string[] = [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/*.d.ts',
    '**/*.test.ts',
    '**/*.spec.ts',
  ];

  constructor(private autoGraphService: AutoGraphService) {}

  /**
   * 初始化分析器
   */
  public initialize(workspaceRoot: string): void {
    this.workspaceRoot = workspaceRoot;

    // 从配置读取 include/exclude 模式
    const config = vscode.workspace.getConfiguration('knowledgeGraph.autoAnalyze');
    const configInclude = config.get<string[]>('include');
    const configExclude = config.get<string[]>('exclude');

    if (configInclude && configInclude.length > 0) {
      this.includePatterns = configInclude;
    }
    if (configExclude && configExclude.length > 0) {
      this.excludePatterns = configExclude;
    }
  }

  /**
   * 分析整个工作区
   */
  public async analyzeWorkspace(
    progress?: vscode.Progress<{ message?: string; increment?: number }>
  ): Promise<AnalysisResult> {
    const result: AnalysisResult = {
      entities: [],
      relations: [],
      filesCached: 0,
      errors: [],
    };

    // 查找所有匹配的文件
    if (progress) {
      progress.report({ message: 'Scanning files...' });
    }
    
    const files = await this.findFiles();
    const totalFiles = files.length;

    console.log(`Found ${totalFiles} files to analyze`);

    if (totalFiles === 0) {
      return result;
    }

    const incrementPerFile = 80 / totalFiles; // 80% 用于文件分析

    // 第一遍：提取实体
    if (progress) {
      progress.report({ message: `Phase 1/2: Extracting entities from ${totalFiles} files...`, increment: 5 });
    }

    // 使用事务批量处理
    this.autoGraphService.transaction(() => {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const relativePath = path.relative(this.workspaceRoot, file.fsPath);

        if (progress) {
          progress.report({
            message: `[${i + 1}/${totalFiles}] ${relativePath}`,
            increment: incrementPerFile * 0.6, // 60% 用于实体提取
          });
        }

        try {
          const fileResult = this.analyzeFileSync(file.fsPath);

          if (fileResult) {
            // 创建实体
            for (const symbol of fileResult.symbols) {
              const entity = this.autoGraphService.upsertEntity(
                symbol.name,
                symbol.type,
                symbol.filePath,
                symbol.startLine,
                symbol.endLine,
                symbol.description,
                symbol.metadata
              );
              result.entities.push(entity);
            }

            result.filesCached++;
          }
        } catch (error) {
          result.errors.push({
            filePath: relativePath,
            message: error instanceof Error ? error.message : String(error),
          });
        }
      }
    });

    // 第二遍：建立关系（需要所有实体都已创建）
    if (progress) {
      progress.report({ message: `Phase 2/2: Building relationships...`, increment: 5 });
    }

    this.autoGraphService.transaction(() => {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        if (progress) {
          progress.report({
            message: `Building relations [${i + 1}/${totalFiles}]`,
            increment: incrementPerFile * 0.4, // 40% 用于关系建立
          });
        }

        try {
          const fileResult = this.analyzeFileSync(file.fsPath);
          if (fileResult) {
            this.createRelationsFromAnalysis(fileResult, result);
          }
        } catch (error) {
          // 忽略关系创建错误
          console.error(`Error creating relations for ${file.fsPath}:`, error);
        }
      }
    });

    this.autoGraphService.save();

    if (progress) {
      progress.report({ message: 'Complete!', increment: 10 });
    }

    console.log(
      `Analysis complete: ${result.entities.length} entities, ${result.relations.length} relations`
    );

    return result;
  }

  /**
   * 分析单个文件
   */
  public async analyzeFile(
    uri: vscode.Uri,
    forceReanalyze: boolean = false
  ): Promise<AnalysisResult | null> {
    const filePath = uri.fsPath;
    const relativePath = path.relative(this.workspaceRoot, filePath);

    // 检查是否需要分析
    if (!forceReanalyze) {
      const shouldAnalyze = await this.shouldAnalyzeFile(filePath);
      if (!shouldAnalyze) {
        console.log(`Skipping ${relativePath} (unchanged)`);
        return null;
      }
    }

    const result: AnalysisResult = {
      entities: [],
      relations: [],
      filesCached: 0,
      errors: [],
    };

    try {
      // 删除该文件的旧数据
      this.autoGraphService.deleteEntitiesByFile(relativePath);
      this.autoGraphService.deleteFileCache(relativePath);

      const fileResult = this.analyzeFileSync(filePath);

      if (fileResult) {
        this.autoGraphService.transaction(() => {
          // 创建实体
          for (const symbol of fileResult.symbols) {
            const entity = this.autoGraphService.upsertEntity(
              symbol.name,
              symbol.type,
              symbol.filePath,
              symbol.startLine,
              symbol.endLine,
              symbol.description,
              symbol.metadata
            );
            result.entities.push(entity);
          }

          // 创建关系
          this.createRelationsFromAnalysis(fileResult, result);
        });

        // 更新缓存
        const hash = await this.computeFileHash(filePath);
        this.autoGraphService.updateFileCache(relativePath, hash);
        result.filesCached = 1;
      }

      this.autoGraphService.save();
    } catch (error) {
      result.errors.push({
        filePath: relativePath,
        message: error instanceof Error ? error.message : String(error),
      });
    }

    return result;
  }

  /**
   * 同步分析单个文件（提取符号和关系）
   */
  private analyzeFileSync(filePath: string): FileAnalysisResult | null {
    const relativePath = path.relative(this.workspaceRoot, filePath);

    // 读取文件内容
    let content: string;
    try {
      content = fs.readFileSync(filePath, 'utf-8');
    } catch (error) {
      return null;
    }

    const symbols: ExtractedSymbol[] = [];
    const relations: ExtractedRelation[] = [];
    const imports: ImportInfo[] = [];

    const lines = content.split('\n');

    // 解析 imports
    this.extractImports(lines, imports);

    // 解析类
    this.extractClasses(lines, relativePath, symbols, relations);

    // 解析函数
    this.extractFunctions(lines, relativePath, symbols);

    // 解析接口
    this.extractInterfaces(lines, relativePath, symbols, relations);

    // 解析变量/常量
    this.extractVariables(lines, relativePath, symbols);

    // 从 imports 创建关系
    this.createImportRelations(imports, relativePath, relations);

    return {
      filePath: relativePath,
      symbols,
      relations,
      imports,
      exports: [],
    };
  }

  /**
   * 提取 import 语句
   */
  private extractImports(lines: string[], imports: ImportInfo[]): void {
    const importRegex = /^import\s+(?:(?:(\*\s+as\s+\w+)|(\{[^}]+\})|(\w+))(?:\s*,\s*(?:(\{[^}]+\})|(\w+)))?\s+from\s+)?['"]([^'"]+)['"];?/;
    const defaultImportRegex = /^import\s+(\w+)\s+from\s+['"]([^'"]+)['"];?/;
    const namedImportRegex = /^import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"];?/;
    const namespaceImportRegex = /^import\s+\*\s+as\s+(\w+)\s+from\s+['"]([^'"]+)['"];?/;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Namespace import: import * as name from 'module'
      let match = line.match(namespaceImportRegex);
      if (match) {
        imports.push({
          moduleName: match[2],
          importedNames: [match[1]],
          isDefault: false,
          isNamespace: true,
          line: i + 1,
        });
        continue;
      }

      // Named import: import { a, b } from 'module'
      match = line.match(namedImportRegex);
      if (match) {
        const names = match[1]
          .split(',')
          .map((n) => n.trim().split(/\s+as\s+/)[0].trim())
          .filter((n) => n);
        imports.push({
          moduleName: match[2],
          importedNames: names,
          isDefault: false,
          isNamespace: false,
          line: i + 1,
        });
        continue;
      }

      // Default import: import name from 'module'
      match = line.match(defaultImportRegex);
      if (match) {
        imports.push({
          moduleName: match[2],
          importedNames: [match[1]],
          isDefault: true,
          isNamespace: false,
          line: i + 1,
        });
        continue;
      }
    }
  }

  /**
   * 提取类定义
   */
  private extractClasses(
    lines: string[],
    filePath: string,
    symbols: ExtractedSymbol[],
    relations: ExtractedRelation[]
  ): void {
    const classRegex = /^(?:export\s+)?(?:abstract\s+)?class\s+(\w+)(?:\s+extends\s+(\w+))?(?:\s+implements\s+([^{]+))?/;
    // 匹配构造函数参数中的类型注入
    const constructorParamRegex = /(?:private|public|protected|readonly)\s+\w+\s*:\s*(\w+)/g;
    // 匹配装饰器注入 @Inject(SomeService)
    const injectRegex = /@Inject\((\w+)\)/g;

    let braceCount = 0;
    let currentClass: { name: string; startLine: number; content: string[] } | null = null;
    let inConstructor = false;
    let constructorBraceCount = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();

      // 检查类开始
      const match = trimmedLine.match(classRegex);
      if (match && braceCount === 0) {
        currentClass = {
          name: match[1],
          startLine: i + 1,
          content: [],
        };

        // 提取继承关系
        if (match[2]) {
          relations.push({
            sourceName: match[1],
            sourceFilePath: filePath,
            targetName: match[2],
            verb: 'extends',
          });
        }

        // 提取实现关系
        if (match[3]) {
          const implementedInterfaces = match[3].split(',').map((s) => s.trim());
          for (const iface of implementedInterfaces) {
            if (iface) {
              relations.push({
                sourceName: match[1],
                sourceFilePath: filePath,
                targetName: iface,
                verb: 'implements',
              });
            }
          }
        }
      }

      // 记录类内容用于分析依赖
      if (currentClass) {
        currentClass.content.push(line);
        
        // 检测构造函数开始
        if (trimmedLine.includes('constructor(') || trimmedLine.includes('constructor (')) {
          inConstructor = true;
          constructorBraceCount = 0;
        }
        
        // 在构造函数中查找依赖注入
        if (inConstructor || trimmedLine.includes('constructor(')) {
          // 提取构造函数参数中的类型（依赖注入）
          let paramMatch;
          while ((paramMatch = constructorParamRegex.exec(line)) !== null) {
            const typeName = paramMatch[1];
            // 排除基础类型
            if (!this.isPrimitiveType(typeName)) {
              relations.push({
                sourceName: currentClass.name,
                sourceFilePath: filePath,
                targetName: typeName,
                verb: 'uses',
              });
            }
          }
          
          // 提取 @Inject 装饰器
          let injectMatch;
          while ((injectMatch = injectRegex.exec(line)) !== null) {
            relations.push({
              sourceName: currentClass.name,
              sourceFilePath: filePath,
              targetName: injectMatch[1],
              verb: 'uses',
            });
          }
        }
        
        // 追踪构造函数的花括号
        if (inConstructor) {
          constructorBraceCount += (line.match(/\{/g) || []).length;
          constructorBraceCount -= (line.match(/\}/g) || []).length;
          if (constructorBraceCount <= 0 && line.includes('}')) {
            inConstructor = false;
          }
        }
      }

      // 计算花括号
      braceCount += (line.match(/\{/g) || []).length;
      braceCount -= (line.match(/\}/g) || []).length;

      // 检查类结束
      if (currentClass && braceCount === 0 && line.includes('}')) {
        // 分析类内部的依赖使用
        this.extractClassDependencies(currentClass.name, currentClass.content, filePath, relations);
        
        symbols.push({
          name: currentClass.name,
          type: 'class',
          filePath,
          startLine: currentClass.startLine,
          endLine: i + 1,
        });
        currentClass = null;
      }
    }
  }

  /**
   * 检查是否是基础类型或无效类型
   */
  private isPrimitiveType(typeName: string): boolean {
    // 排除纯数字（如 HTTP 状态码 200, 201, 403）
    if (/^\d+$/.test(typeName)) {
      return true;
    }
    
    // 排除太短的名称（可能是误匹配）
    if (typeName.length < 2) {
      return true;
    }
    
    const primitives = [
      'string', 'number', 'boolean', 'any', 'void', 'null', 'undefined',
      'String', 'Number', 'Boolean', 'Object', 'Array', 'Promise', 'Map', 'Set',
      'Record', 'Partial', 'Required', 'Pick', 'Omit', 'Exclude', 'Extract',
      'Date', 'RegExp', 'Error', 'Function', 'Symbol', 'BigInt',
      'Request', 'Response', 'Express', 'Next',  // Express 类型
      'T', 'K', 'V', 'U', 'P',  // 常见泛型参数
    ];
    return primitives.includes(typeName);
  }

  /**
   * 提取类内部的依赖使用（成员变量、方法返回类型、方法参数类型）
   */
  private extractClassDependencies(
    className: string,
    classContent: string[],
    filePath: string,
    relations: ExtractedRelation[]
  ): void {
    // 匹配成员变量声明: private someService: SomeService
    const memberRegex = /^\s*(?:private|public|protected|readonly)\s+\w+\s*[?!]?\s*:\s*(\w+)/;
    // 匹配带有 new 的实例化
    const newInstanceRegex = /new\s+(\w+)\s*\(/g;
    // 匹配方法返回类型: async methodName(...): Promise<SomeType>
    const methodReturnRegex = /(?:async\s+)?(?:\w+)\s*\([^)]*\)\s*:\s*(?:Promise\s*<\s*)?(\w+)(?:\s*>)?/g;
    // 匹配方法参数类型: (param: SomeType, param2: OtherType)
    const methodParamRegex = /\w+\s*:\s*(\w+)(?:\s*[,)])/g;
    // 匹配泛型参数: Promise<SomeType>, Array<SomeType>, Observable<SomeType>
    const genericTypeRegex = /(?:Promise|Observable|Array|Set|Map|Subject|BehaviorSubject)\s*<\s*(\w+)/g;
    
    const addedDeps = new Set<string>();
    
    const addDependency = (typeName: string) => {
      if (!this.isPrimitiveType(typeName) && !addedDeps.has(typeName) && typeName !== className) {
        addedDeps.add(typeName);
        relations.push({
          sourceName: className,
          sourceFilePath: filePath,
          targetName: typeName,
          verb: 'uses',
        });
      }
    };
    
    for (const line of classContent) {
      // 跳过构造函数行（已经处理过）
      if (line.includes('constructor')) continue;
      
      // 检查成员变量类型
      const memberMatch = line.match(memberRegex);
      if (memberMatch) {
        addDependency(memberMatch[1]);
      }
      
      // 检查 new 实例化
      let newMatch;
      while ((newMatch = newInstanceRegex.exec(line)) !== null) {
        addDependency(newMatch[1]);
      }
      
      // 检查方法返回类型
      let returnMatch;
      while ((returnMatch = methodReturnRegex.exec(line)) !== null) {
        addDependency(returnMatch[1]);
      }
      
      // 检查泛型参数（如 Promise<ProfileRO>）
      let genericMatch;
      while ((genericMatch = genericTypeRegex.exec(line)) !== null) {
        addDependency(genericMatch[1]);
      }
      
      // 检查方法参数类型
      // 只在方法定义行检查（包含括号的行）
      if (line.includes('(') && line.includes(')')) {
        let paramMatch;
        while ((paramMatch = methodParamRegex.exec(line)) !== null) {
          addDependency(paramMatch[1]);
        }
      }
    }
  }

  /**
   * 提取函数定义
   */
  private extractFunctions(
    lines: string[],
    filePath: string,
    symbols: ExtractedSymbol[]
  ): void {
    const functionRegex = /^(?:export\s+)?(?:async\s+)?function\s+(\w+)/;
    const arrowFunctionRegex = /^(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*(?::\s*[^=]+)?\s*=>/;
    const methodRegex = /^\s*(?:public|private|protected|static|async|\s)*(\w+)\s*\([^)]*\)\s*(?::\s*[^{]+)?\s*\{/;

    let braceCount = 0;
    let currentFunction: { name: string; startLine: number } | null = null;
    let inClass = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();

      // 检查是否在类内部
      if (trimmedLine.match(/^(?:export\s+)?(?:abstract\s+)?class\s+/)) {
        inClass = true;
      }

      // 只在顶层提取函数
      if (braceCount === 0) {
        // 普通函数
        let match = trimmedLine.match(functionRegex);
        if (match) {
          currentFunction = {
            name: match[1],
            startLine: i + 1,
          };
        }

        // 箭头函数
        if (!match) {
          match = trimmedLine.match(arrowFunctionRegex);
          if (match) {
            currentFunction = {
              name: match[1],
              startLine: i + 1,
            };
          }
        }
      }

      // 计算花括号
      const openBraces = (line.match(/\{/g) || []).length;
      const closeBraces = (line.match(/\}/g) || []).length;
      braceCount += openBraces - closeBraces;

      // 检查函数结束
      if (currentFunction) {
        if (braceCount === 0) {
          symbols.push({
            name: currentFunction.name,
            type: 'function',
            filePath,
            startLine: currentFunction.startLine,
            endLine: i + 1,
          });
          currentFunction = null;
        }
      }

      // 类结束
      if (inClass && braceCount === 0 && line.includes('}')) {
        inClass = false;
      }
    }
  }

  /**
   * 提取接口定义
   */
  private extractInterfaces(
    lines: string[],
    filePath: string,
    symbols: ExtractedSymbol[],
    relations: ExtractedRelation[]
  ): void {
    const interfaceRegex = /^(?:export\s+)?interface\s+(\w+)(?:\s+extends\s+([^{]+))?/;
    // 匹配接口属性类型: propertyName?: TypeName 或 propertyName: TypeName
    const propertyTypeRegex = /^\s*\w+\s*[?!]?\s*:\s*(\w+)(?:\s*\[\s*\])?/;
    // 匹配泛型类型
    const genericInPropertyRegex = /:\s*(?:Array|Set|Map|Promise|Observable)\s*<\s*(\w+)/;

    let braceCount = 0;
    let currentInterface: { name: string; startLine: number; content: string[] } | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();

      // 检查接口开始
      const match = trimmedLine.match(interfaceRegex);
      if (match && braceCount === 0) {
        currentInterface = {
          name: match[1],
          startLine: i + 1,
          content: [],
        };

        // 提取继承关系
        if (match[2]) {
          const extendedInterfaces = match[2].split(',').map((s) => s.trim());
          for (const iface of extendedInterfaces) {
            if (iface) {
              relations.push({
                sourceName: match[1],
                sourceFilePath: filePath,
                targetName: iface,
                verb: 'extends',
              });
            }
          }
        }
      }

      // 记录接口内容
      if (currentInterface) {
        currentInterface.content.push(line);
      }

      // 计算花括号
      braceCount += (line.match(/\{/g) || []).length;
      braceCount -= (line.match(/\}/g) || []).length;

      // 检查接口结束
      if (currentInterface && braceCount === 0 && line.includes('}')) {
        // 分析接口属性中使用的类型
        const addedDeps = new Set<string>();
        for (const contentLine of currentInterface.content) {
          // 检查属性类型
          const propMatch = contentLine.match(propertyTypeRegex);
          if (propMatch) {
            const typeName = propMatch[1];
            if (!this.isPrimitiveType(typeName) && !addedDeps.has(typeName) && typeName !== currentInterface.name) {
              addedDeps.add(typeName);
              relations.push({
                sourceName: currentInterface.name,
                sourceFilePath: filePath,
                targetName: typeName,
                verb: 'uses',
              });
            }
          }
          
          // 检查泛型类型
          const genericMatch = contentLine.match(genericInPropertyRegex);
          if (genericMatch) {
            const typeName = genericMatch[1];
            if (!this.isPrimitiveType(typeName) && !addedDeps.has(typeName) && typeName !== currentInterface.name) {
              addedDeps.add(typeName);
              relations.push({
                sourceName: currentInterface.name,
                sourceFilePath: filePath,
                targetName: typeName,
                verb: 'uses',
              });
            }
          }
        }
        
        symbols.push({
          name: currentInterface.name,
          type: 'interface',
          filePath,
          startLine: currentInterface.startLine,
          endLine: i + 1,
        });
        currentInterface = null;
      }
    }
  }

  /**
   * 提取变量/常量定义
   */
  private extractVariables(
    lines: string[],
    filePath: string,
    symbols: ExtractedSymbol[]
  ): void {
    const exportConstRegex = /^export\s+(?:const|let|var)\s+(\w+)\s*(?::\s*[^=]+)?\s*=/;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // 只提取导出的常量
      const match = line.match(exportConstRegex);
      if (match) {
        // 跳过函数（箭头函数）
        if (line.includes('=>')) {
          continue;
        }

        symbols.push({
          name: match[1],
          type: 'variable',
          filePath,
          startLine: i + 1,
          endLine: i + 1,
        });
      }
    }
  }

  /**
   * 从 import 创建关系
   */
  private createImportRelations(
    imports: ImportInfo[],
    filePath: string,
    relations: ExtractedRelation[]
  ): void {
    for (const imp of imports) {
      // 只处理本地 imports（以 . 开头）
      if (imp.moduleName.startsWith('.')) {
        // 解析模块路径
        const importedFile = this.resolveImportPath(filePath, imp.moduleName);

        for (const name of imp.importedNames) {
          relations.push({
            sourceName: `${filePath}`, // 文件级别的 import
            sourceFilePath: filePath,
            targetName: name,
            targetFilePath: importedFile,
            verb: 'imports',
          });
        }
      }
    }
  }

  /**
   * 解析 import 路径
   */
  private resolveImportPath(fromFile: string, importPath: string): string {
    const dir = path.dirname(fromFile);
    let resolved = path.join(dir, importPath);

    // 尝试添加扩展名
    const extensions = ['.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx'];
    for (const ext of extensions) {
      const withExt = resolved + ext;
      const fullPath = path.join(this.workspaceRoot, withExt);
      if (fs.existsSync(fullPath)) {
        return withExt;
      }
    }

    return resolved;
  }

  /**
   * 从分析结果创建关系
   */
  private createRelationsFromAnalysis(
    fileResult: FileAnalysisResult,
    result: AnalysisResult
  ): void {
    // 跟踪已创建的外部实体，避免重复创建
    const createdExternalEntities = new Set<string>();

    for (const relation of fileResult.relations) {
      // 查找源实体（源实体总是在当前文件中）
      const sourceEntity = this.autoGraphService.findEntityByName(
        relation.sourceName,
        relation.sourceFilePath
      );

      if (!sourceEntity) {
        continue;
      }

      // 查找目标实体
      let targetEntity;
      
      if (relation.targetFilePath) {
        // 如果指定了目标文件路径，在该文件中查找
        targetEntity = this.autoGraphService.findEntityByName(
          relation.targetName,
          relation.targetFilePath
        );
      }
      
      // 如果没找到，尝试在所有实体中按名称搜索（用于 extends/implements 等情况）
      if (!targetEntity) {
        targetEntity = this.autoGraphService.findEntityByName(relation.targetName);
      }

      // 如果仍然找不到，且是 extends/implements/uses 关系，创建外部实体
      if (!targetEntity && this.shouldCreateExternalEntity(relation.verb)) {
        // 检查是否已经创建过
        const externalKey = `external:${relation.targetName}`;
        if (!createdExternalEntities.has(externalKey)) {
          // 创建外部实体
          targetEntity = this.autoGraphService.upsertEntity(
            relation.targetName,
            'external',
            '@external',  // 特殊路径标识外部模块
            0,
            0,
            `External type: ${relation.targetName}`,
            { isExternal: true }
          );
          createdExternalEntities.add(externalKey);
          result.entities.push(targetEntity);
          console.log(`Created external entity: ${relation.targetName}`);
        } else {
          // 已创建过，直接查找
          targetEntity = this.autoGraphService.findEntityByName(relation.targetName, '@external');
        }
      }

      if (targetEntity) {
        const autoRelation = this.autoGraphService.upsertRelation(
          sourceEntity.id,
          targetEntity.id,
          relation.verb,
          relation.metadata
        );

        if (autoRelation) {
          result.relations.push(autoRelation);
        }
      }
    }
  }

  /**
   * 判断是否应该为缺失的目标创建外部实体
   */
  private shouldCreateExternalEntity(verb: string): boolean {
    // extends 和 implements 的目标通常是重要的类型关系
    // uses 可能会产生太多外部实体，可以选择是否包含
    return ['extends', 'implements', 'uses'].includes(verb);
  }

  /**
   * 检查文件是否需要分析
   */
  public async shouldAnalyzeFile(filePath: string): Promise<boolean> {
    const relativePath = path.relative(this.workspaceRoot, filePath);
    const cache = this.autoGraphService.getFileCache(relativePath);

    if (!cache) {
      return true;
    }

    const currentHash = await this.computeFileHash(filePath);
    return currentHash !== cache.contentHash;
  }

  /**
   * 计算文件哈希
   */
  public async computeFileHash(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('md5');
      const stream = fs.createReadStream(filePath);

      stream.on('data', (data) => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  /**
   * 查找所有需要分析的文件
   */
  private async findFiles(): Promise<vscode.Uri[]> {
    const files: vscode.Uri[] = [];

    for (const pattern of this.includePatterns) {
      const found = await vscode.workspace.findFiles(
        pattern,
        `{${this.excludePatterns.join(',')}}`
      );
      files.push(...found);
    }

    // 去重
    const uniqueFiles = [...new Map(files.map((f) => [f.fsPath, f])).values()];

    return uniqueFiles;
  }

  /**
   * 设置 include 模式
   */
  public setIncludePatterns(patterns: string[]): void {
    this.includePatterns = patterns;
  }

  /**
   * 设置 exclude 模式
   */
  public setExcludePatterns(patterns: string[]): void {
    this.excludePatterns = patterns;
  }
}

