import * as ts from "typescript";
import { CompilationUnit } from "./unit";
import { CodeContext } from "./code-context";
import { Visitors } from "./visitors";

// https://ts-ast-viewer.com/#code/PTAEBUE8AcFMGUDGAnAltALqAYrAhhgK7KwDOoAIrALYD2AdqRsgagwFDsigCMAdKABCeUqkQQYZdgBtYWVKQoNYALlAAjWrVl56oALygAZnmmlYAbhlzQeAOarQ9QtXWxkB0ACYArFdlYRqjITAByeNSOTGj0dp4A5ABStAAW9PH+NvS0GPDEjrqQADSgtEbgKQpqhZ4ALBag3DUYkuzZufkJ1HiQbrag0aixoENM+AAmGdZY0goYas6u7gDaALqeyzwlXiUAzKuZWETQsmrLg7Eli27I64bL8Smw0tK08SU8AAwH7EA
// https://github.com/Microsoft/TypeScript/wiki/Using-the-Compiler-API

function generateCompilationUnit(file: string): void {
  // Create a Program to represent the project, then pull out the
  // source file to parse its AST.
  let program = ts.createProgram([file], { allowJs: true });
  const sourceFile = program.getSourceFile(file);

  let unit: CompilationUnit = new CompilationUnit(file, sourceFile, {
    noCXXSTDLib: false
  });
  let ctx: CodeContext = new CodeContext();
  let visitors: Visitors = new Visitors(ctx, unit);

  visitors.visitSourceFile();
  console.log(ctx.generatedElements);

  // let unit: CompilationUnit = {
  //   code: [],
  //   errors: [],
  //   typesToResolve: []
  // };

  // // TODO use this to get parsing diagnostics
  // // console.log(ts
  // // .getPreEmitDiagnostics(program))

  // // root block
  // pushBlock(unit);

  // // Loop through the root AST nodes of the file
  // ts.forEachChild(sourceFile, node => {
  //   generateBlockMember(node, unit);
  // });

  // console.log(unit.errors);

  // // console.log(unit.code);
  // let rootBlock = false;
  // for (const block of unit.code) {
  //   if (!rootBlock) {
  //     console.log(block.map(v => `${v};\n`).join('').replace('exts2c__internal__function;', ''))
  //     rootBlock = true;
  //     continue;
  //   }
  //   console.log(`{\n${block.map(v => `${v};\n`).join('').replace('exts2c__internal__function;', '')}}\n`)
  // }
}

// Run the extract function with the script's arguments
generateCompilationUnit("example/demo.ts");