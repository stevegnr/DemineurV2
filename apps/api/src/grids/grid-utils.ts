import { OutputCell } from './dto/output.grid';
import { Grid } from './entities/grid.entity';

export function getBit(buffer: Buffer, index: number): boolean {
  const byteIndex = Math.floor(index / 8);
  const bitIndex = index % 8;
  return (buffer[byteIndex] & (1 << bitIndex)) !== 0;
}

export function setBit(buffer: Buffer, index: number): void {
  const byteIndex = Math.floor(index / 8);
  const bitIndex = index % 8;
  buffer[byteIndex] |= 1 << bitIndex;
}

export function countBombsAround(
  x: number,
  y: number,
  width: number,
  height: number,
  mines: Buffer,
): number {
  let count = 0;
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      if (dx === 0 && dy === 0) continue;

      const nx = x + dx;
      const ny = y + dy;

      if (nx >= 1 && nx <= width && ny >= 1 && ny <= height) {
        const nIndex = (ny - 1) * width + (nx - 1);
        if (getBit(mines, nIndex)) {
          count++;
        }
      }
    }
  }
  return count;
}

export function revealAll(buffer: Buffer): void {
  for (let i = 0; i < buffer.length; i++) {
    buffer[i] = 0xff;
  }
}

export function generateOutputCells(grid: Grid): OutputCell[] {
  const { width, height, mines, ouvertures } = grid;

  const cells: OutputCell[] = [];

  for (let y = 1; y <= height; y++) {
    for (let x = 1; x <= width; x++) {
      const index: number = (y - 1) * width + (x - 1);

      const isOpen: boolean = getBit(ouvertures, index);

      let bombsAround: number = undefined;
      let hasBomb: boolean = undefined;
      if (isOpen) {
        bombsAround = countBombsAround(x, y, width, height, mines);
        if (getBit(mines, index)) {
          hasBomb = true;
        }
      }

      cells.push({ x, y, isOpen, bombsAround, hasBomb });
    }
  }

  return cells;
}

// /**
//  * @param bombsBuffer Le Buffer (bitmap) des bombes (1 bit par cellule)
//  * @param width Largeur de la grille
//  * @param height Hauteur de la grille
//  * @returns Liste des coordonnées { x, y } où il y a une bombe
//  */
// export function getBombCoordinates(
//   bombsBuffer: Buffer,
//   width: number,
//   height: number,
// ): { x: number; y: number }[] {
//   const result: { x: number; y: number }[] = [];
//   const totalCells = width * height;

//   for (let index = 0; index < totalCells; index++) {
//     const byteIndex = Math.floor(index / 8);
//     const bitIndex = index % 8;
//     const hasBomb = (bombsBuffer[byteIndex] & (1 << bitIndex)) !== 0;

//     if (hasBomb) {
//       const x = index % width;
//       const y = Math.floor(index / width);
//       result.push({ x, y });
//     }
//   }

//   return result;
// }
