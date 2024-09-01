import * as ts from "typescript";

import { CodeContext } from "./code-context";
import { CompilationUnit, ErrorKind, WarningKind } from "./unit";

enum TypeModifier {
  None,
  Array,
  Tuple
}

interface Type {
  modifier: TypeModifier,
  text: string,
  needsInitialization: boolean
}

export class Visitors {
  ctx: CodeContext;
  unit: CompilationUnit;

  constructor(ctx: CodeContext, unit: CompilationUnit) {
    this.ctx = ctx;
    this.unit = unit;
  }

  visitSourceFile() {
    this.unit.sourceFile.forEachChild(node => {
      this.visitStatement(node);
    });
  }

  visitStatement(node: ts.Node) {
    if (ts.isVariableStatement(node)) {
      return this.visitVariableStatement(node);
    }
    if (ts.isFunctionDeclaration(node)) {
      return this.visitFunctionDeclaration(node);
    }
    if (ts.isExpressionStatement(node)) {
      return this.ctx.pushCode(this.visitExpression(node.expression));
    }

    if (ts.isReturnStatement(node)) {
      if (!node.expression)
        return this.unit.error(node, ErrorKind.NoExpressionPresent);

      return this.ctx.pushCode(`return ${this.visitExpression(node.expression)}`);
    }
  }

  visitVariableStatement(node: ts.VariableStatement) {
    if (node.declarationList.declarations.length == 0) {
      return this.unit.error(node, ErrorKind.InternalASTError)
    }

    for (const declaration of node.declarationList.declarations) {
      if (!declaration.type)
        return this.unit.error(node, ErrorKind.MissingType);

      const type = this.visitType(declaration.type);
      const name = this.visitName(declaration.name);

      if (!declaration.initializer && type.needsInitialization)
        return this.unit.error(node, ErrorKind.MissingInitializationForVariable);

      let code = `${type.text} ${name}${type.modifier == TypeModifier.Array ? '[]' : ''}`
      if (declaration.initializer) {
        code += ` = ${this.visitExpression(declaration.initializer)}`
      }

      this.ctx.pushCode(code);
    }
  }

  visitType(node: ts.Node): Type {
    if (ts.isArrayTypeNode(node)) {
      return {
        modifier: TypeModifier.Array,
        text: this.visitType(node.elementType).text,
        needsInitialization: true
      }
    } else if (ts.isTupleTypeNode(node)) {
      let code = `struct { `;
      let childTypeNeedsInitialization = false;

      for (let idx = 0; idx < node.elements.length; idx++) {
        const element = node.elements[idx];
        let type: Type;

        if (ts.isNamedTupleMember(element)) {
          this.unit.warning(element, WarningKind.NamedTupleMemberIsUnsupported);
          type = this.visitType(element.type);
        } else {
          type = this.visitType(element);
        }

        childTypeNeedsInitialization ||= type.needsInitialization
        code += `${type.text} t${idx}${type.modifier == TypeModifier.Array ? '[]' : ''}; `;
      }

      return {
        modifier: TypeModifier.Tuple,
        text: `${code}}`,
        needsInitialization: false || childTypeNeedsInitialization
      }
    } else if (ts.isTypeReferenceNode(node)) {
      let type = this.visitType(node.typeName);

      return {
        modifier: TypeModifier.None,
        text: type.text,
        needsInitialization: type.needsInitialization
      }
    }

    switch (node.kind) {
      case ts.SyntaxKind.BooleanKeyword:
        return {
          modifier: TypeModifier.None,
          text: "bool",
          needsInitialization: false
        };
      case ts.SyntaxKind.NumberKeyword:
        return {
          modifier: TypeModifier.None,
          text: "double",
          needsInitialization: false
        };
      case ts.SyntaxKind.StringKeyword:
        if (this.unit.options.noCXXSTDLib) {
          this.unit.error(node, ErrorKind.noCXXSTDLib_StringIsUnsupported);
          return {
            modifier: TypeModifier.None,
            needsInitialization: false,
            text: "exts2c__invalid__type"
          }
        }

        return {
          modifier: TypeModifier.None,
          text: "std::string",
          needsInitialization: false
        };
      case ts.SyntaxKind.Identifier:
        return {
          modifier: TypeModifier.None,
          text: (node as ts.Identifier).text,
          needsInitialization: false
        };
      case ts.SyntaxKind.AnyKeyword:
        return {
          modifier: TypeModifier.None,
          text: "auto",
          needsInitialization: true
        };

      default:
        this.unit.error(node, ErrorKind.InvalidType);
        return {
          modifier: TypeModifier.None,
          needsInitialization: false,
          text: "exts2c__invalid__type"
        }
    }
  }

  visitName(node: ts.BindingName): string {
    if (!ts.isIdentifier(node)) {
      this.unit.error(node, ErrorKind.NameIsNotIdentifier)
      return "exts2c__invalid__name";
    }

    return node.text;
  }

  visitExpression(node: ts.Expression): string {
    if (ts.isLiteralExpression(node)) {
      if (ts.isNumericLiteral(node)) {
        return node.text;
      }
      if (ts.isStringLiteral(node)) {
        return `"${node.text}"`;
      }

      this.unit.error(node, ErrorKind.UnsupportedLiteralExpression)
      return `/* literal expression */`;
    }
    if (ts.isExpressionStatement(node)) {
      this.unit.error(node, ErrorKind.UnsupportedExpression);
      return `/* statement expression */`;
    }
    if (ts.isBinaryExpression(node)) {
      const left = this.visitExpression(node.left);
      const right = this.visitExpression(node.right);
      const operator = node.operatorToken;

      return `${left} ${operator.getText(this.unit.sourceFile)} ${right}`;
    }
    if (ts.isObjectLiteralExpression(node)) {
      this.unit.error(node, ErrorKind.UnsupportedExpression);

      return "/* object literal expression */";
    }
    if (ts.isArrayLiteralExpression(node)) {
      let expressions = [];

      node.forEachChild(node => {
        expressions.push(this.visitExpression(node as ts.Expression));
      })

      return `{${expressions.join(', ')}}`
    }
    if (ts.isIdentifier(node)) {
      return node.text;
    }

    switch (node.kind) {
      case ts.SyntaxKind.FalseKeyword:
        return "false";
      case ts.SyntaxKind.TrueKeyword:
        return "true";

      default:
        this.unit.error(node, ErrorKind.InvalidExpression);
        return "/* invalid expression */";
    }
  }

  visitFunctionDeclaration(node: ts.FunctionDeclaration) {
    let parameters: string[] = [];
    for (const parameter of node.parameters) {
      if (!parameter.type)
        return this.unit.error(node, ErrorKind.MissingTypeForFunctionParameter);
      const type = this.visitType(parameter.type);
      const name = `${this.visitName(parameter.name)}${type.modifier == TypeModifier.Array ? '[]' : ''}`;

      parameters.push(`${type.text} ${name}`);
    }

    if (!node.type)
      return this.unit.error(node, ErrorKind.MissingTypeForFunctionReturn);
    const type = this.visitType(node.type);
    const name = `${this.visitName(node.name)}${type.modifier == TypeModifier.Array ? '*' : ''}`;

    const signature = `${type.text} ${name}(${parameters.join(', ')})`;

    this.ctx.pushCode(`exts2c__function__declaration___${signature}`);
    this.ctx.pushFunction(signature);

    if (!node.body) {
      return this.unit.error(node, ErrorKind.MissingBodyForFunction);
    }

    node.body.forEachChild(node => {
      this.visitStatement(node);
    });

    this.ctx.popFunction();
  }
}