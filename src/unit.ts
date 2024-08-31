import * as ts from "typescript";

interface CompilationUnitOptions {
  noCXXSTDLib: boolean
}

export enum ErrorKind {
  InternalASTError
}

export class CompilationUnit {
  sourcePath: string;
  sourceFile: ts.SourceFile;
  options: CompilationUnitOptions;

  constructor(sourcePath: string, sourceFile: ts.SourceFile, options: CompilationUnitOptions) {
    this.sourcePath = sourcePath;
    this.sourceFile = sourceFile;
    this.options = options;
  }

  error(node: ts.Node, kind: ErrorKind) {
    const kindToString = () => {
      switch (kind) {
        case ErrorKind.InternalASTError:
          return "internal abstract syntax tree is invalid"

        default:
          return "unknown error"
      }
    }

    const Reset = "\x1b[0m";
    const Bold = "\x1b[1m";
    const FgRed = "\x1b[31m";
    const FgBlue = "\x1b[34m";

    console.error(`${Bold}${FgRed}error[${kind}]${Reset}${Bold}: ${kindToString()}${Reset}\n  ${FgBlue}-->${Reset} ${this.sourcePath}\n   ${FgBlue}#${Reset}\n   ${FgBlue}#${Reset} ${node.getText(this.sourceFile)}\n   ${FgBlue}#${Reset}\n`);
  }
};