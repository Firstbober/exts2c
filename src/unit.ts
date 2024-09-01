import * as ts from "typescript";

interface CompilationUnitOptions {
  noCXXSTDLib: boolean
}

export enum ErrorKind {
  InternalASTError,

  InvalidType,
  MissingType,
  MissingTypeForFunctionParameter,
  MissingTypeForFunctionReturn,

  MissingInitializationForVariable,
  MissingBodyForFunction,
  MissingNameForFunction,

  TryingToInitializeAnyLeftHandValue,

  NameIsNotIdentifier,
  UnsupportedLiteralExpression,
  UnsupportedExpression,
  UnsupportedDeclarationType,
  InvalidExpression,
  NoExpressionPresent,

  noCXXSTDLib_StringIsUnsupported,
}

export enum WarningKind {
  NamedTupleMemberIsUnsupported
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
        case ErrorKind.InvalidType:
          return "provided type is nonexistent or unsupported"
        case ErrorKind.MissingInitializationForVariable:
          return "variable declaration is missing value initialization"
        case ErrorKind.MissingType:
          return "type is explicitly required for this kind of statement"
        case ErrorKind.NameIsNotIdentifier:
          return "provided name is not and identifier"
        case ErrorKind.InvalidExpression:
          return "invalid expression"
        case ErrorKind.MissingBodyForFunction:
          return "the function is missing its definition"
        case ErrorKind.MissingTypeForFunctionParameter:
          return "the parameter in the function declaration is missing its type"
        case ErrorKind.MissingTypeForFunctionReturn:
          return "the function is missing its return type"
        case ErrorKind.NoExpressionPresent:
          return "expression in required to be present here"
        case ErrorKind.UnsupportedExpression:
          return "this kind of expression is unsuppoered"
        case ErrorKind.UnsupportedLiteralExpression:
          return "unsupported type of literal"

        case ErrorKind.noCXXSTDLib_StringIsUnsupported:
          return "string type is unsupported without C++ STD library enabled"

        default:
          return "unknown error"
      }
    }

    const Reset = "\x1b[0m";
    const Bold = "\x1b[1m";
    const FgRed = "\x1b[31m";
    const FgBlue = "\x1b[34m";

    const { line } = ts.getLineAndCharacterOfPosition(this.sourceFile, node.pos);

    console.error(`${Bold}${FgRed}error[${kind}]${Reset}${Bold}: ${kindToString()}${Reset}\n  ${FgBlue}-->${Reset} ${this.sourcePath}:${Bold}${FgBlue}${line + 1}${Reset}\n   ${FgBlue}#${Reset}\n   ${FgBlue}#${Reset} ${node.getText(this.sourceFile)}\n   ${FgBlue}#${Reset}\n`);
  }

  warning(node: ts.Node, kind: WarningKind) {
    const kindToString = () => {
      switch (kind) {
        case WarningKind.NamedTupleMemberIsUnsupported:
          return "named tuple members are currently not supported"

        default:
          return "unknown warning"
      }
    }

    const Reset = "\x1b[0m";
    const Bold = "\x1b[1m";
    const FgYellow = "\x1b[33m"
    const FgBlue = "\x1b[34m";

    const { line } = ts.getLineAndCharacterOfPosition(this.sourceFile, node.pos);
    console.warn(`${Bold}${FgYellow}warning[${kind}]${Reset}${Bold}: ${kindToString()}${Reset}\n  ${FgBlue}-->${Reset} ${this.sourcePath}:${Bold}${FgBlue}${line + 1}${Reset}\n   ${FgBlue}#${Reset}\n   ${FgBlue}#${Reset} ${node.getText(this.sourceFile)}\n   ${FgBlue}#${Reset}\n`);
  }

  typescriptError() {}
  typescriptWarning() {}
};