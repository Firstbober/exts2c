export enum ElementType {
  Root,
  Block,
  Function
}

export interface Element {
  type: ElementType,
  code: string[]
}

export interface FunctionElement extends Element {
  type: ElementType.Function;
  signature: string
}

export class CodeContext {
  currentElementType: ElementType;

  generatedElements: Element[] = [];
  currentElementIdx: number = 0;

  constructor() {
    this.currentElementType = ElementType.Root;

    this.generatedElements.push({
      type: ElementType.Root,
      code: []
    });
  }

  pushBlock() {
    this.generatedElements.push({
      type: ElementType.Block,
      code: []
    });
    this.currentElementIdx += 1;
    this.currentElementType = this.generatedElements[this.currentElementIdx].type;
  }
  popBlock() {
    this.currentElementIdx -= 1;
    this.currentElementType = this.generatedElements[this.currentElementIdx].type;
  }

  pushFunction(signature: string) {
    this.generatedElements.push({
      type: ElementType.Function,
      code: [],
      signature: signature
    } as FunctionElement);
    this.currentElementIdx += 1;
    this.currentElementType = this.generatedElements[this.currentElementIdx].type;
  }
  popFunction() {
    this.currentElementIdx -= 1;
    this.currentElementType = this.generatedElements[this.currentElementIdx].type;
  }

  pushCode(code: string) {
    this.generatedElements[this.currentElementIdx].code.push(code);
  }
}