import * as ts from "typescript";

// https://ts-ast-viewer.com/#code/PTAEBUE8AcFMGUDGAnAltALqAYrAhhgK7KwDOoAIrALYD2AdqRsgagwFDsigCMAdKABCeUqkQQYZdgBtYWVKQoNYALlAAjWrVl56oALygAZnmmlYAbhlzQeAOarQ9QtXWxkB0ACYArFdlYRqjITAByeNSOTGj0dp4A5ABStAAW9PH+NvS0GPDEjrqQADSgtEbgKQpqhZ4ALBag3DUYkuzZufkJ1HiQbrag0aixoENM+AAmGdZY0goYas6u7gDaALqeyzwlXiUAzKuZWETQsmrLg7Eli27I64bL8Smw0tK08SU8AAwH7EA
// https://github.com/Microsoft/TypeScript/wiki/Using-the-Compiler-API

interface Error {
  start: number,
  stop: number,
  contents: string
}

interface CompilationUnit {
  typesToResolve: string[],
  code: string[][],
  errors: Array<Error>
}

function pushBlock(unit: CompilationUnit) {
  unit.code.push([]);
}

function pushCode(unit: CompilationUnit, code: string) {
  unit.code[unit.code.length - 1].push(code);
}

function pushError(unit: CompilationUnit, node: ts.Node, contents: string) {
  unit.errors.push({
    contents: contents,
    start: node.pos,
    stop: node.end
  })
}

function resolveType(type: ts.Node, unit: CompilationUnit): [string, boolean, boolean, boolean] {
  // Remove when modules and cstd is implemented.
  function resolveTypeKeyword(type: ts.Node): string {
    switch (type.kind) {
      case ts.SyntaxKind.BooleanKeyword:
        return "bool";
      case ts.SyntaxKind.NumberKeyword:
        return "double";
      case ts.SyntaxKind.StringKeyword:
        return "string<>";
      case ts.SyntaxKind.Identifier:
        return (type as ts.Identifier).text;

      case ts.SyntaxKind.AnyKeyword:
        pushError(unit, type, "any type is unsupported")
        return "!!"
      default:
        pushError(unit, type, "unsupported token");
        return "!!"
    }
  }

  let prefix = "";
  let postfix = "";
  let requiredInitialization = false;
  let tuple = false;
  let array = false;

  if (ts.isArrayTypeNode(type)) {
    requiredInitialization = true;
    array = true;

    prefix += resolveType(type.elementType, unit)[0];
    return [prefix + postfix, requiredInitialization, tuple, array];
  }

  if (ts.isTupleTypeNode(type)) {
    let types: string[] = [];

    ts.forEachChild(type, node => {
      let ret = resolveType(node, unit);
      types.push(ret[0]);
      requiredInitialization ||= ret[1];
    })

    prefix += `struct {${types.map((v, i) => {
      return `${v} t${i};`;
    }).join(';')
      }}`
    tuple = true;

    return [prefix + postfix, requiredInitialization, tuple, array];
  }

  if (ts.isTypeReferenceNode(type)) {
    requiredInitialization = false;

    let ret = resolveType(type.typeName, unit);
    prefix += ret[0];
    requiredInitialization ||= ret[1];

    return [prefix + postfix, requiredInitialization, tuple, array];
  }

  prefix += resolveTypeKeyword(type);

  return [prefix + postfix, requiredInitialization, tuple, array];
}

function resolveExpression(expression: ts.Expression, unit: CompilationUnit, tuple: boolean): string {
  if(ts.isLiteralExpression(expression)) {
    if(ts.isNumericLiteral(expression)) {
      return expression.text;
    }
    if(ts.isStringLiteral(expression)) {
      return `"${expression.text}"`;
    }
    pushError(unit, expression, "unsupported literal expression");
    return "// literal expression";
  }
  if(ts.isExpressionStatement(expression)) {
    pushError(unit, expression, "unsupported statement expression");
    return "// statement expression";
  }
  if(ts.isBinaryExpression(expression)) {
    pushError(unit, expression, "unsupported binary expression");
    return "// binary expression";
  }
  if(ts.isObjectLiteralExpression(expression)) {
    pushError(unit, expression, "unsupported object literal expression");
    return "// object literal expression";
  }
  if(ts.isArrayLiteralExpression(expression)) {
    let expressions = [];
    expression.forEachChild(node => {
      expressions.push(resolveExpression(node as ts.Expression, unit, false));
    })

    return `{${expressions.join(', ')}}`

    pushError(unit, expression, "unsupported array literal expression");
    return "// array literal expression";
  }

  switch(expression.kind) {
    case ts.SyntaxKind.FalseKeyword:
      return "false";
    case ts.SyntaxKind.TrueKeyword:
      return "true";

    default:
      pushError(unit, expression, "invalid expression");
      return "// invalid expression";
  }
}

function generateVariableDeclaration(node: ts.VariableDeclaration, unit: CompilationUnit) {
  if (!node.type) {
    pushError(unit, node, "failed to recognize type of variable");
    return;
  }

  let [typeCode, typeNeedsInitialization, isTuple, isArray] = resolveType(node.type, unit);

  if(!ts.isIdentifier(node.name)) {
    pushError(unit, node, "variable name is not identifier");
    return;
  }
  let name = node.name.text;

  if(!node.initializer && typeNeedsInitialization) {
    pushError(unit, node, "variable declaration lacks initialization");
    pushCode(unit, `// variable declaration lacks initialization`);
    return;
  }

  if(node.initializer) {
    pushCode(unit, `${typeCode} ${name}${isArray ? '[]' : ''} = ${resolveExpression(node.initializer, unit, isTuple)}`);
    return;
  }
}

function generateVariableStatement(node: ts.VariableStatement, unit: CompilationUnit) {
  node.forEachChild(node => {
    if (ts.isVariableDeclarationList(node)) {
      node.forEachChild(node => {
        if (ts.isVariableDeclaration(node)) {
          generateVariableDeclaration(node, unit)
        } else {
          pushError(unit, node, "unexpected node in variable declaration");
        }
      });

    } else {
      pushError(unit, node, "no variable declaration list node");
    }
  });
}

function generateCompilationUnit(file: string): void {
  // Create a Program to represent the project, then pull out the
  // source file to parse its AST.
  let program = ts.createProgram([file], { allowJs: true });
  const sourceFile = program.getSourceFile(file);

  let unit: CompilationUnit = {
    code: [],
    errors: [],
    typesToResolve: []
  };

  // TODO use this to get parsing diagnostics
  // console.log(ts
  // .getPreEmitDiagnostics(program))

  // root block
  pushBlock(unit);

  // Loop through the root AST nodes of the file
  ts.forEachChild(sourceFile, node => {
    if (ts.isVariableStatement(node)) {
      generateVariableStatement(node, unit);
      return;
    }
  });

  console.log(unit.errors);

  let rootBlock = false;
  for(const block of unit.code) {
    if(!rootBlock) {
      console.log(block.map(v => `${v};\n`).join(''))
      rootBlock = true;
      continue;
    }
    console.log(`{\n${block.join(';\n')}}\n`)
  }
}

// Run the extract function with the script's arguments
generateCompilationUnit("example/demo.ts");