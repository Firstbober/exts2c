import { CodeContext, ElementType, FunctionElement } from "./code-context";

export function postProcess(ctx: CodeContext): string {
  let code = '';

  for (const element of ctx.generatedElements) {
    if (element.type == ElementType.Root) {
      code += element.code.join(';\n');
      continue;
    }
  }
  code += ';\n';

  for (const element of ctx.generatedElements) {
    if (element.type != ElementType.Function) {
      continue;
    }

    code = code.replaceAll(`exts2c__function__declaration___${(element as FunctionElement).signature}`,
      `${(element as FunctionElement).signature} {\n    ${element.code.join(';\n    ') + ';\n'}}`);
  }

  console.log(code);

  return ''
}