import * as ts from "typescript";
import { CompilationUnit } from "./unit";
import { CodeContext } from "./code-context";
import { Visitors } from "./visitors";
import { postProcess } from "./post-process";

// https://ts-ast-viewer.com/#code/PTAEBUE8AcFMGUDGAnAltALqAYrAhhgK7KwDOoAIrALYD2AdqRsgagwFDsigCMAdKABCeUqkQQYZdgBtYWVKQoNYALlAAjWrVl56oALygAZnmmlYAbhlzQeAOarQ9QtXWxkB0ACYArFdlYRqjITAByeNSOTGj0dp4A5ABStAAW9PH+NvS0GPDEjrqQADSgtEbgKQpqhZ4ALBag3DUYkuzZufkJ1HiQbrag0aixoENM+AAmGdZY0goYas6u7gDaALqeyzwlXiUAzKuZWETQsmrLg7Eli27I64bL8Smw0tK08SU8AAwH7EA
// https://github.com/Microsoft/TypeScript/wiki/Using-the-Compiler-API

function generateCompilationUnit(file: string): void {
  // Create a Program to represent the project, then pull out the
  // source file to parse its AST.
  let program = ts.createProgram([file], { allowJs: true });
  const sourceFile = program.getSourceFile(file)!;

  let unit: CompilationUnit = new CompilationUnit(file, sourceFile, {
    noCXXSTDLib: false
  });
  let ctx: CodeContext = new CodeContext();
  let visitors: Visitors = new Visitors(ctx, unit, program.getTypeChecker());

  // Register to unit any typescript diagnostics
  const preEmitDiagnostics = ts.getPreEmitDiagnostics(program, sourceFile);
  for(const diagnostic of preEmitDiagnostics) {
    if(diagnostic.category == ts.DiagnosticCategory.Error)
      unit.typescriptError();
    else
      unit.typescriptWarning();
  }

  // Print diagnostics as part of transpilation
  let diagnostics = ts.formatDiagnosticsWithColorAndContext(preEmitDiagnostics, {
    getCurrentDirectory: () => ts.sys.getCurrentDirectory(),
    getCanonicalFileName: f => f,
    getNewLine: () => "\n"
  });
  console.log(diagnostics)

  // Visit all nodes in AST and crate base for post-processing
  visitors.visitSourceFile();
  postProcess(ctx);
  // console.log(ctx.generatedElements);
}

// Run the extract function with the script's arguments
generateCompilationUnit("example/demo.ts");