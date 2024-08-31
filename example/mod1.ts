export function AA1(ina: string) {}
function AA2(ina: string) {}

export let AB1: string = "a";
let AB2: string = "a";


// 2. Enum
enum Color {
  Red,
  Green,
  Blue,
}
let c: Color = Color.Green;

// 3. Functions with Types
function add(x: number, y: number): number {
  return x + y;
}

// 4. Interfaces
interface Person {
  firstName: string;
  lastName: string;
  age?: number; // optional property
}

function greet(person: Person): string {
  return `Hello, ${person.firstName} ${person.lastName}`;
}

// 5. Classes and Inheritance
class Animal {
  protected name: string;

  constructor(name: string) {
    this.name = name;
  }

  move(distanceInMeters: number = 0): void {
    console.log(`${this.name} moved ${distanceInMeters}m.`);
  }
}

class Dog extends Animal {
  bark(): void {
    console.log('Woof! Woof!');
  }
}

let dog = new Dog('Rex');
dog.bark();
dog.move(10);

// 6. Generics
function identity<T>(arg: T): T {
  return arg;
}

let output = identity<string>('myString');
let numberOutput = identity<number>(100);

// 7. Union and Intersection Types
type StringOrNumber = string | number;

function logValue(value: StringOrNumber) {
  console.log(`Value: ${value}`);
}

interface HasName {
  name: string;
}

interface HasAge {
  age: number;
}

type PersonInfo = HasName & HasAge;

const personInfo: PersonInfo = {
  name: 'Jane',
  age: 30,
};

// 8. Type Aliases
type Point = {
  x: number;
  y: number;
};

let point: Point = { x: 10, y: 20 };

// 9. Utility Types
interface Todo {
  title: string;
  description: string;
  completed: boolean;
}

type TodoPreview = Pick<Todo, 'title' | 'completed'>;

const todo: TodoPreview = {
  title: 'Clean room',
  completed: false,
};

// 10. Decorators
function Logger(target: Function) {
  console.log(`Logging... ${target.name}`);
}

@Logger
class Plane {
  constructor(public model: string) {}
}

const plane = new Plane('Boeing 747');

// 11. Type Assertions
let someValue: any = 'this is a string';
let strLength: number = (someValue as string).length;

// 12. Modules (Export and Import)
// In real applications, use `export` and `import` for modularity.
// export class ExportedClass {}

// 13. Asynchronous Functions and Promises
async function fetchData(url: string): Promise<void> {
  try {
    let response = await fetch(url);
    let data = await response.json();
    console.log(data);
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}

// 14. Nullable types
function greetUser(name: string | null) {
  console.log(`Hello, ${name?.toUpperCase() ?? 'Guest'}!`);
}

greetUser('Alice');
greetUser(null);

// 15. Optional Chaining and Nullish Coalescing
interface NestedObject {
  outer?: {
    inner?: {
      value?: string;
    };
  };
}

let nestedObject: NestedObject = {};
console.log(nestedObject.outer?.inner?.value ?? 'Default Value');