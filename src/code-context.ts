enum ElementType {
  Root,
  Block,
  Function
}

interface Element {
  type: ElementType,
  code: string[]
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
      type:ElementType.Block,
      code: []
    });
    this.currentElementIdx += 1;
    this.currentElementType = this.generatedElements[this.currentElementIdx].type;
  }
  popBlock() {
    this.currentElementIdx -= 1;
    this.currentElementType = this.generatedElements[this.currentElementIdx].type;
  }

  pushFunction() {
    this.generatedElements.push({
      type:ElementType.Function,
      code: []
    });
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