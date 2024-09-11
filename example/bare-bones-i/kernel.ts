export type u8 = number;
export type u16 = number;
export type usize = number;

export type ptr<T> = T;
export type constant<T> = T;

// import compiler from "compiler";
// import {u8, u16, usize} from "cstd/int";

/* Check if the compiler thinks you are targeting the wrong operating system. */
if (!compiler.defined("__linux__")) {
  compiler.error("You are not using a cross-compiler, you will most certainly run into trouble");
}

/* This tutorial will only work for the 32-bit ix86 targets. */
if (compiler.defined("__i386__")) {
  compiler.error("This tutorial needs to be compiled with a ix86-elf compiler");
}

enum VGAColor {
  BLACK = 0,
  BLUE = 1,
  GREEN = 2,
  CYAN = 3,
  RED = 4,
  MAGENTA = 5,
  BROWN = 6,
  LIGHT_GREY = 7,
  DARK_GREY = 8,
  LIGHT_BLUE = 9,
  LIGHT_GREEN = 10,
  LIGHT_CYAN = 11,
  LIGHT_RED = 12,
  LIGHT_MAGENTA = 13,
  LIGHT_BROWN = 14,
  WHITE = 15,
}

function vgaEntryColor(fg: VGAColor, bg: VGAColor) {
  return fg | bg << 4;
}

function vgaEntry(uc: u8, color: u8): u16 {
  return (uc as u16) | (color as u16) << 8;
}

function strlen(str: constant<ptr<u8>>) {
  let len: usize = 0;
  while (str[len])
    len++;
  return len;
}

const VGAWidth: usize = 80;
const VGAHeight: usize = 25;

let terminalRow: usize;
let terminalColumn: usize;
let terminalColor: u8;
let terminalBuffer: ptr<u16>;

function terminalInitialize() {
  terminalRow = 0;
  terminalColumn = 0;
  terminalColor = vgaEntryColor(VGAColor.LIGHT_GREY, VGAColor.BLACK);
  terminalBuffer = 0xB8000 as ptr<u16>;
  for (let y = 0; y < VGAHeight; y++) {
    for (let x = 0; x < VGAWidth; x++) {
      const index = y * VGAWidth + x;
      terminalBuffer[index] = vgaEntry(' ', terminalColor);
    }
  }
}

function terminalSetColor(color: u8) {
  terminalColor = color;
}

function terminalPutEntryAt(c: u8, color: u8, x: usize, y: usize) {
  const index = y * VGAWidth + x;
  terminalBuffer[index] = vgaEntry(c, color);
}

function terminalPutChar(c: u8) {
  terminalPutEntryAt(c, terminalColor, terminalColumn, terminalRow);
  if (++terminalColumn == VGAWidth) {
    terminalColumn = 0;
    if (++terminalRow == VGAHeight)
      terminalRow = 0;
  }
}

function terminalWrite(data: constant<ptr<u8>>, size: usize) {
  for (let i = 0; i < size; i++)
    terminalPutChar(data[i]);
}

function terminalWriteString(data: constant<ptr<u8>>) {
  terminalWrite(data, strlen(data));
}

namespace compiler.extern.c {
  function kernelMain() {
    /* Initialize terminal interface */
    terminalInitialize();

    /* Newline support is left as an exercise. */
    terminalWriteString("Hello, kernel World!\n");
  }
}
