import * as ts from "typescript";

import { CodeContext } from "./code-context";
import { CompilationUnit, ErrorKind } from "./unit";

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
      // return generateVariableStatement(node, unit);
    }
    if (ts.isFunctionDeclaration(node)) {
      // return generateFunctionDeclaration(node, unit);
    }
    if(ts.isReturnStatement(node)) {
      // if(!node.expression) {
      //   pushError(unit, node, "return must contain an expression")
      //   return;
      // }
      // return pushCode(unit, `return ${resolveExpression(node.expression, unit, false)}`);
    }
  }

  visitVariableStatement(node: ts.VariableStatement) {
    return this.unit.error(node, ErrorKind.InternalASTError)
    if(node.declarationList.declarations.length == 0) {
    }
  }
}