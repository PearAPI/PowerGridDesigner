import type { CircuitState } from '../types/circuit';
import { serializeBoard } from './serializeBoard';
import * as nbt from 'prismarine-nbt';
import pako from 'pako';

/**
 * NBT Compiler — Stub implementation.
 *
 * Converts a CircuitState into the palette + blocks structure needed for
 * a Minecraft .nbt schematic file. The actual binary serialization using
 * prismarine-nbt will be completed once the user provides the exact
 * export format details.
 *
 * Current output: JSON representation of the NBT structure.
 */

/** A palette entry in the NBT schematic */
interface PaletteEntry {
  Name: string;
  Properties?: Record<string, string>;
}

/** A block entry in the NBT schematic */
interface BlockEntry {
  pos: [number, number, number];
  state: number; // index into palette
  nbt?: Record<string, unknown>;
}

/** The compiled NBT structure (JSON representation) */
export interface NbtStructure {
  size: [number, number, number];
  palette: PaletteEntry[];
  blocks: BlockEntry[];
  DataVersion: number;
}

/**
 * Compile a CircuitState into an NBT-ready structure.
 * Maps each component to a palette entry + block positions.
 */
export function compileToNbtStructure(state: CircuitState): any {
  // The root Tag_Compound must have an explicit empty name field to compile into a valid NBT byte stream
  const boardTag = {
      type: 'compound',
      name: '',
      value: serializeBoard(state.components, state.wireCells, 0, 0).value
  };
  
  // Attach the blueprint name to the root compound as requested
  boardTag.value.Name = nbt.string("PowerGrid Blueprint");
  
  return boardTag;
}

/**
 * Export the NBT structure as a downloadable binary .nbt file.
 */
export async function downloadNbtBinary(state: CircuitState, filename = 'circuit_board.nbt') {
  try {
    const rootTag = compileToNbtStructure(state);

    // Bypass restrictive inner typings which expect root names on nameless schematic roots
    const buffer = nbt.writeUncompressed(rootTag as any);
    
    // Minecraft requires .nbt schematic files to be structurally GZIP compressed
    const compressedUint8Array = pako.gzip(new Uint8Array(buffer));
    
    const blob = new Blob([compressedUint8Array], { type: 'application/x-gzip' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    return true; // Success
  } catch (error) {
    console.error("Failed to compile NBT binary:", error);
    throw error;
  }
}
